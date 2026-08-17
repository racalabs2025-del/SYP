/**
 * scripts/write_aggregates_only.mjs
 *
 * ANADOLU YAKASI.xlsx ve AVRUPA YAKASI.xlsx dosyalarından
 * 39 personel ve 39 meydan için tam performans istatistiklerini hesaplar.
 *
 * Hem Firestore'a (personelBasvuruOzetleri, meydanBasvuruStats) yazar,
 * hem de src/data/ içine statik JSON olarak kaydeder.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, getFirestore, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { getPersonelBasvuruDocId, normalizePersonelKey } from '../src/utils/personelBasvuru.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;
const parseDate = XLSX.SSF?.parse_date_code || XLSX.default?.SSF?.parse_date_code;

function excelSerialToDateStr(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    const trimmed = serial.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parts = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (parts) {
      return `${parts[3]}-${String(parts[2]).padStart(2, '0')}-${String(parts[1]).padStart(2, '0')}`;
    }
  }
  const num = Number(serial);
  if (isNaN(num) || num <= 0) return null;
  try {
    if (parseDate) {
      const d = parseDate(num);
      return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
    const msPerDay = 86400000;
    const excelEpoch = new Date(1899, 11, 30).getTime();
    const jsDate = new Date(excelEpoch + num * msPerDay);
    const y = jsDate.getFullYear();
    const m = jsDate.getMonth() + 1;
    const d = jsDate.getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  } catch {
    return null;
  }
}

function ilceToMeydanId(ilce) {
  if (!ilce) return 'diger';
  return String(ilce)
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function run() {
  console.log('Hesaplama başlatılıyor...');

  const files = [
    { filename: 'ANADOLU YAKASI.xlsx', yaka: 'Anadolu' },
    { filename: 'AVRUPA YAKASI.xlsx', yaka: 'Avrupa' },
  ];

  const personelAggregates = {};
  const meydanAggregates = {};
  let totalBasvuruCount = 0;

  for (const fileItem of files) {
    const filePath = path.join(BUYUK_DIR, fileItem.filename);
    const wb = readFile(filePath);

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rawRows = sheetUtils.sheet_to_json(sheet, { header: 1 });
      if (!rawRows || rawRows.length <= 1) continue;

      const headers = rawRows[0].map((h) => String(h || '').trim());
      const getVal = (row, colName) => {
        const idx = headers.indexOf(colName);
        return idx >= 0 ? row[idx] : undefined;
      };

      const rawPersonelName = sheetName.trim();
      const pKey = normalizePersonelKey(rawPersonelName);

      if (!personelAggregates[pKey]) {
        personelAggregates[pKey] = {
          personelAdi: rawPersonelName,
          personelKey: pKey,
          yaka: fileItem.yaka,
          toplamBasvuru: 0,
          kapandi: 0,
          planlama: 0,
          acik: 0,
          diger: 0,
          ilkTarih: '9999-99-99',
          sonTarih: '0000-00-00',
          aylikDagilim: {},
          konuDagilimi: {},
          ilceDagilimi: {},
          sonBasvurular: [],
          updatedAt: new Date().toISOString(),
        };
      }

      const pStat = personelAggregates[pKey];

      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0 || row.every((v) => v === null || v === undefined || v === '')) {
          continue;
        }

        const basvuruNo = String(getVal(row, 'Başvuru No') || '').trim();
        if (!basvuruNo) continue;
        totalBasvuruCount++;

        const rawDate = getVal(row, 'Oluşturulma Tarihi');
        const rawTaahhut = getVal(row, 'Taahhüt Tarihi');
        const tarih = excelSerialToDateStr(rawDate) || '2026-01-01';
        const taahhutTarihi = excelSerialToDateStr(rawTaahhut) || '';
        const ay = tarih ? tarih.slice(0, 7) : '2026-01';

        const ilce = String(getVal(row, 'İlçe') || '').trim().toUpperCase();
        const mahalle = String(getVal(row, 'Mahalle') || '').trim();
        const meydanId = ilceToMeydanId(ilce);

        const konu = String(getVal(row, 'Konu') || 'DİĞER').trim();
        const altKonu = String(getVal(row, 'Alt Konu') || '').trim();
        const durum = String(getVal(row, 'Durum') || 'Kapandı').trim();
        const onemDerecesi = String(getVal(row, 'Önem Derecesi') || '4-Düşük').trim();
        const tip = String(getVal(row, 'Tip') || 'ŞİKAYET').trim();
        const aciklama = String(getVal(row, 'Açıklama') || '').trim().slice(0, 500);
        const birim = String(getVal(row, 'İlişkili Olduğu Birim') || '').trim();

        // Personel Stats
        pStat.toplamBasvuru += 1;
        if (durum === 'Kapandı') pStat.kapandi += 1;
        else if (durum === 'Planlama') pStat.planlama += 1;
        else if (durum.toLowerCase().includes('açık') || durum.toLowerCase().includes('islem')) pStat.acik += 1;
        else pStat.diger += 1;

        if (tarih < pStat.ilkTarih) pStat.ilkTarih = tarih;
        if (tarih > pStat.sonTarih) pStat.sonTarih = tarih;

        pStat.aylikDagilim[ay] = (pStat.aylikDagilim[ay] || 0) + 1;
        pStat.konuDagilimi[konu] = (pStat.konuDagilimi[konu] || 0) + 1;
        if (ilce) pStat.ilceDagilimi[ilce] = (pStat.ilceDagilimi[ilce] || 0) + 1;

        if (pStat.sonBasvurular.length < 20) {
          pStat.sonBasvurular.push({
            basvuruNo,
            tarih,
            ilce,
            mahalle,
            konu,
            altKonu,
            durum,
            onemDerecesi,
            aciklama: aciklama.slice(0, 150),
          });
        }

        // Meydan Stats
        if (!meydanAggregates[meydanId]) {
          meydanAggregates[meydanId] = {
            meydanId,
            ilce: ilce || meydanId,
            toplamBasvuru: 0,
            kapandi: 0,
            planlama: 0,
            acik: 0,
            diger: 0,
            aylikDagilim: {},
            konuDagilimi: {},
            sonBasvurular: [],
            updatedAt: new Date().toISOString(),
          };
        }

        const mStat = meydanAggregates[meydanId];
        mStat.toplamBasvuru += 1;
        if (durum === 'Kapandı') mStat.kapandi += 1;
        else if (durum === 'Planlama') mStat.planlama += 1;
        else if (durum.toLowerCase().includes('açık') || durum.toLowerCase().includes('islem')) mStat.acik += 1;
        else mStat.diger += 1;

        mStat.aylikDagilim[ay] = (mStat.aylikDagilim[ay] || 0) + 1;
        mStat.konuDagilimi[konu] = (mStat.konuDagilimi[konu] || 0) + 1;

        if (mStat.sonBasvurular.length < 20) {
          mStat.sonBasvurular.push({
            basvuruNo,
            tarih,
            personelAdi: rawPersonelName,
            mahalle,
            konu,
            durum,
            aciklama: aciklama.slice(0, 150),
          });
        }
      }
    }
  }

  console.log(`Toplam Başvuru: ${totalBasvuruCount}`);
  console.log(`Personel Sayısı: ${Object.keys(personelAggregates).length}`);
  console.log(`Meydan Sayısı: ${Object.keys(meydanAggregates).length}`);

  // 1. Save locally in src/data/ for high-performance static fallback
  const dataDir = path.resolve(ROOT, 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dataDir, 'compiledPersonelBasvurular.json'),
    JSON.stringify(personelAggregates, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(dataDir, 'compiledMeydanStats.json'),
    JSON.stringify(meydanAggregates, null, 2),
    'utf8'
  );
  console.log('✓ src/data/compiledPersonelBasvurular.json ve compiledMeydanStats.json oluşturuldu.');

  // 2. Write to Firestore
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    await signInAnonymously(auth);

    console.log('Firestore güncelleniyor...');

    const batch = writeBatch(db);

    // Write personel summaries
    for (const [pKey, pStat] of Object.entries(personelAggregates)) {
      const docRef1 = doc(db, 'personelBasvuruOzetleri', pKey);
      batch.set(docRef1, pStat, { merge: true });

      const docId2026 = getPersonelBasvuruDocId(pStat.personelAdi);
      const docRef2 = doc(db, 'personelBasvuruOzetleri', docId2026);
      batch.set(docRef2, pStat, { merge: true });
    }

    // Write meydan stats
    for (const [mId, mStat] of Object.entries(meydanAggregates)) {
      const docRef = doc(db, 'meydanBasvuruStats', mId);
      batch.set(docRef, mStat, { merge: true });
    }

    await batch.commit();
    console.log('✓ Firestore personelBasvuruOzetleri ve meydanBasvuruStats başarıyla güncellendi!');
  } catch (err) {
    console.warn('Firestore yazma uyarısı (Statik cache devrede):', err.message);
  }

  process.exit(0);
}

run().catch(console.error);
