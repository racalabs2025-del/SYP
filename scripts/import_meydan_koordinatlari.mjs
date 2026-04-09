import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { normalizeMeydanInput } from '../src/utils/meydanNormalization.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;

const FILE_ARG = process.argv.find((arg) => arg.startsWith('--file='))?.slice(7);
const DRY_RUN = process.argv.includes('--dry-run');
const XLSX_FILE = path.resolve(ROOT, FILE_ARG || 'src/meydan_adres_konum.xlsx');

if (!readFile || !sheetUtils) {
  throw new Error('XLSX modulu okunamadi.');
}

function normalizeText(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCoordinates(raw) {
  const text = String(raw || '').trim();
  if (!text) {
    return null;
  }

  const decimalPair = text.match(/(-?\d{1,2}\.\d+)[,;\s]+(-?\d{1,3}\.\d+)/);
  if (decimalPair) {
    return { lat: Number(decimalPair[1]), lon: Number(decimalPair[2]), source: 'inline' };
  }

  const atPair = text.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atPair) {
    return { lat: Number(atPair[1]), lon: Number(atPair[2]), source: 'maps-at' };
  }

  const dPair = text.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (dPair) {
    return { lat: Number(dPair[1]), lon: Number(dPair[2]), source: 'maps-3d4d' };
  }

  const qPair = text.match(/[?&]q=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (qPair) {
    return { lat: Number(qPair[1]), lon: Number(qPair[2]), source: 'maps-query' };
  }

  const queryPair = text.match(/[?&](query|ll|destination)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (queryPair) {
    return { lat: Number(queryPair[2]), lon: Number(queryPair[3]), source: 'maps-params' };
  }

  return null;
}

async function extractCoordinatesFromResolvedUrl(rawUrl) {
  const urlText = String(rawUrl || '').trim();
  if (!urlText) {
    return null;
  }

  const direct = extractCoordinates(urlText);
  if (direct) {
    return direct;
  }

  if (!/^https?:\/\//i.test(urlText)) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(urlText, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    const resolvedUrl = response.url || '';
    const fromResolved = extractCoordinates(resolvedUrl);
    if (fromResolved) {
      return { ...fromResolved, source: `${fromResolved.source}-redirect` };
    }

    const decodedUrl = decodeURIComponent(resolvedUrl);
    const fromDecoded = extractCoordinates(decodedUrl);
    if (fromDecoded) {
      return { ...fromDecoded, source: `${fromDecoded.source}-decoded` };
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function isValidCoordinate(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return false;
  }

  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function getColumn(row, predicates) {
  const keys = Object.keys(row || {});
  const key = keys.find((item) => predicates.some((predicate) => normalizeText(item).includes(predicate)));
  return key ? row[key] : '';
}

function buildCandidateTexts(row) {
  const meydanAdi = getColumn(row, ['meydan adi', 'meydan adı', 'meydan']);
  const ilce = getColumn(row, ['ilce', 'ilçe']);
  const adres = getColumn(row, ['adres']);

  return [meydanAdi, ilce, adres].map((item) => String(item || '').trim()).filter(Boolean);
}

function resolveTargetId(row, knownById, knownByName) {
  const meydanRaw = String(getColumn(row, ['meydan adi', 'meydan adı', 'meydan']) || '').trim();
  const ilceRaw = String(getColumn(row, ['ilce', 'ilçe']) || '').trim();
  const normalizedCandidates = [meydanRaw, ilceRaw]
    .map((item) => normalizeMeydanInput({ meydanId: item, isim: item, kisaAd: item, tamAd: item }))
    .filter((item) => item?.valid);

  for (const candidate of normalizedCandidates) {
    if (knownById.has(candidate.id)) {
      return candidate.id;
    }

    if (knownByName.has(candidate.id)) {
      return knownByName.get(candidate.id);
    }
  }

  const rowCandidates = buildCandidateTexts(row).map((item) => normalizeText(item));
  for (const [nameKey, id] of knownByName.entries()) {
    if (rowCandidates.some((value) => value && (nameKey.includes(value) || value.includes(nameKey)))) {
      return id;
    }
  }

  return '';
}

async function run() {
  const workbook = readFile(XLSX_FILE);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = sheetUtils.sheet_to_json(sheet, { defval: '' });

  if (!rows.length) {
    console.log('Excel dosyasinda islenecek satir yok.');
    return;
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  await signInAnonymously(auth);
  const firestore = getFirestore(app);

  const meydanSnapshot = await getDocs(collection(firestore, 'meydanlar'));
  const knownById = new Map();
  const knownByName = new Map();

  meydanSnapshot.docs.forEach((snapshot) => {
    const data = snapshot.data() || {};
    const meydanId = snapshot.id;
    const isim = normalizeText(data?.isim || '');
    const tamAd = normalizeText(data?.tamAd || '');

    knownById.set(meydanId, true);
    if (isim) {
      knownByName.set(isim, meydanId);
    }
    if (tamAd) {
      knownByName.set(tamAd, meydanId);
    }
  });

  const updates = [];
  const skipped = [];

  for (const [index, row] of rows.entries()) {
    const konum = getColumn(row, ['konum']);
    const mapsLink = getColumn(row, ['konum link', 'konumurl', 'maps', 'link', 'url']);
    const inlineLat = getColumn(row, ['lat']);
    const inlineLon = getColumn(row, ['lon', 'lng']);

    let coordinates = null;
    if (String(inlineLat).trim() && String(inlineLon).trim()) {
      coordinates = {
        lat: Number(String(inlineLat).replace(',', '.')),
        lon: Number(String(inlineLon).replace(',', '.')),
        source: 'lat-lon-columns',
      };
    }

    if (!coordinates) {
      coordinates = extractCoordinates(konum)
        || extractCoordinates(mapsLink)
        || await extractCoordinatesFromResolvedUrl(konum)
        || await extractCoordinatesFromResolvedUrl(mapsLink);
    }

    if (!coordinates || !isValidCoordinate(coordinates.lat, coordinates.lon)) {
      skipped.push({ index: index + 2, reason: 'koordinat-yok' });
      return;
    }

    const targetId = resolveTargetId(row, knownById, knownByName);
    if (!targetId) {
      skipped.push({ index: index + 2, reason: 'meydan-eslesmedi' });
      return;
    }

    updates.push({
      id: targetId,
      lat: Number(coordinates.lat.toFixed(6)),
      lon: Number(coordinates.lon.toFixed(6)),
      source: coordinates.source,
      excelRow: index + 2,
    });
  }

  const dedupById = new Map();
  updates.forEach((item) => {
    dedupById.set(item.id, item);
  });

  const finalUpdates = Array.from(dedupById.values());

  if (!DRY_RUN && finalUpdates.length) {
    const batchSize = 400;
    for (let start = 0; start < finalUpdates.length; start += batchSize) {
      const chunk = finalUpdates.slice(start, start + batchSize);
      const batch = writeBatch(firestore);

      chunk.forEach((item) => {
        batch.set(doc(firestore, 'meydanlar', item.id), {
          lat: item.lat,
          lon: item.lon,
          geoSource: item.source,
          geoUpdatedAt: serverTimestamp(),
        }, { merge: true });
      });

      await batch.commit();
    }
  }

  console.log(`Toplam satir: ${rows.length}`);
  console.log(`Eslesen kayit: ${finalUpdates.length}`);
  console.log(`Atlanan satir: ${skipped.length}`);
  if (skipped.length) {
    console.log('Ilk 10 atlanan satir:', skipped.slice(0, 10));
  }

  if (DRY_RUN) {
    console.log('Dry-run tamamlandi. Firestore yazimi yapilmadi.');
  } else {
    console.log('Koordinat guncelleme tamamlandi.');
  }
}

run().catch((error) => {
  console.error('Koordinat import hatasi:', error?.message || error);
  process.exitCode = 1;
});
