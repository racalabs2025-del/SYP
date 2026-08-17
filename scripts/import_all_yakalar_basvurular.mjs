/**
 * scripts/import_all_yakalar_basvurular.mjs
 *
 * Buyuk_guncelleme klasöründeki ANADOLU YAKASI.xlsx ve AVRUPA YAKASI.xlsx dosyalarındaki
 * tüm sekmeleri (39 personel, 11.367 başvuru) okur ve Firestore'a yazar:
 *   1. meydanBasvurulari (Tek tek başvuru kayıtları)
 *   2. personelBasvuruOzetleri (Her personel için dinamik performans ve istatistik özeti)
 *   3. meydanBasvuruStats (Her meydan/ilçe için toplu başvuru istatistikleri)
 *
 * Kullanım:
 *   node scripts/import_all_yakalar_basvurular.mjs --dry-run
 *   node scripts/import_all_yakalar_basvurular.mjs --apply
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { getPersonelBasvuruDocId, normalizePersonelKey } from '../src/utils/personelBasvuru.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');

const APPLY_MODE = process.argv.includes('--apply');
const DRY_RUN = !APPLY_MODE || process.argv.includes('--dry-run');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;
const parseDate = XLSX.SSF?.parse_date_code || XLSX.default?.SSF?.parse_date_code;

const BATCH_LIMIT = 150; // Smaller batch size to prevent Firestore rate limits

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function splitIntoChunks(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function run() {
  console.log(`================================================================`);
  console.log(`BÜYÜK BAŞVURU VERİLERİ İÇE AKTARMA VE GÜNCELLEME`);
  console.log(`Mod: ${APPLY_MODE ? 'CANLI YAZIM (--apply)' : 'DRY-RUN (Test Modu)'}`);
  console.log(`================================================================\n`);

  const files = [
    { filename: 'ANADOLU YAKASI.xlsx', yaka: 'Anadolu' },
    { filename: 'AVRUPA YAKASI.xlsx', yaka: 'Avrupa' },
  ];

  const allBasvuruDocs = [];
  const personelAggregates = new Map();
  const meydanAggregates = new Map();
  const seenBasvuruNos = new Map();

  for (const fileItem of files) {
    const filePath = path.join(BUYUK_DIR, fileItem.filename);
    if (!fs.existsSync(filePath)) {
      console.error(`Dosya bulunamadı: ${filePath}`);
      continue;
    }

    console.log(`Dosya okunuyor: ${fileItem.filename} (${fileItem.yaka} Yakası)...`);
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

      if (!personelAggregates.has(pKey)) {
        personelAggregates.set(pKey, {
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
        });
      }

      const pStat = personelAggregates.get(pKey);

      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0 || row.every((v) => v === null || v === undefined || v === '')) {
          continue;
        }

        const basvuruNo = String(getVal(row, 'Başvuru No') || '').trim();
        if (!basvuruNo) continue;

        const rawDate = getVal(row, 'Oluşturulma Tarihi');
        const rawTaahhut = getVal(row, 'Taahhüt Tarihi');
        const tarih = excelSerialToDateStr(rawDate) || '2026-01-01';
        const taahhutTarihi = excelSerialToDateStr(rawTaahhut) || '';
        const ay = tarih ? tarih.slice(0, 7) : '2026-01';
        const yil = tarih ? Number(tarih.slice(0, 4)) : 2026;

        const ilce = String(getVal(row, 'İlçe') || '').trim().toUpperCase();
        const mahalle = String(getVal(row, 'Mahalle') || '').trim();
        const meydanId = ilceToMeydanId(ilce);

        const konu = String(getVal(row, 'Konu') || 'DİĞER').trim();
        const altKonu = String(getVal(row, 'Alt Konu') || '').trim();
        const durum = String(getVal(row, 'Durum') || 'Kapandı').trim();
        const altDurum = String(getVal(row, 'Alt Durum') || '').trim();
        const onemDerecesi = String(getVal(row, 'Önem Derecesi') || '4-Düşük').trim();
        const tip = String(getVal(row, 'Tip') || 'ŞİKAYET').trim();
        const aciklama = String(getVal(row, 'Açıklama') || '').trim().slice(0, 1000);
        const birim = String(getVal(row, 'İlişkili Olduğu Birim') || '').trim();
        const basvuruSahibi = String(getVal(row, 'Başvuru Sahibi') || '').trim();
        const basvuruKanali = String(getVal(row, 'Başvuru Kanalı') || 'Meydan Yönetimi').trim();

        const docId = basvuruNo.replace(/[^a-zA-Z0-9-]/g, '-');

        const basvuruItem = {
          docId,
          basvuruNo,
          tarih,
          taahhutTarihi,
          ay,
          yil,
          ilce,
          mahalle,
          meydanId,
          konu,
          altKonu,
          durum,
          altDurum,
          onemDerecesi,
          tip,
          aciklama,
          birim,
          basvuruSahibi,
          basvuruKanali,
          personelAdi: rawPersonelName,
          personelKey: pKey,
          yaka: fileItem.yaka,
          updatedAt: new Date().toISOString(),
        };

        // If duplicate across sheets, preserve first
        if (!seenBasvuruNos.has(docId)) {
          seenBasvuruNos.set(docId, basvuruItem);
          allBasvuruDocs.push(basvuruItem);
        }

        // Aggregate per Personel
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

        if (pStat.sonBasvurular.length < 15) {
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

        // Aggregate per Meydan/İlçe
        if (!meydanAggregates.has(meydanId)) {
          meydanAggregates.set(meydanId, {
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
          });
        }

        const mStat = meydanAggregates.get(meydanId);
        mStat.toplamBasvuru += 1;
        if (durum === 'Kapandı') mStat.kapandi += 1;
        else if (durum === 'Planlama') mStat.planlama += 1;
        else if (durum.toLowerCase().includes('açık') || durum.toLowerCase().includes('islem')) mStat.acik += 1;
        else mStat.diger += 1;

        mStat.aylikDagilim[ay] = (mStat.aylikDagilim[ay] || 0) + 1;
        mStat.konuDagilimi[konu] = (mStat.konuDagilimi[konu] || 0) + 1;

        if (mStat.sonBasvurular.length < 15) {
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

  console.log(`\nİşlenen Toplam Başvuru Kaydı: ${allBasvuruDocs.length}`);
  console.log(`Personel Özeti Sayısı: ${personelAggregates.size}`);
  console.log(`Meydan/İlçe İstatistik Sayısı: ${meydanAggregates.size}`);

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Firestore'a yazılmadı. Canlıya yazmak için --apply ile çalıştırın.`);
    process.exit(0);
  }

  console.log(`\nFirestore bağlantısı kuruluyor...`);
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInAnonymously(auth);
  console.log(`Firebase Auth başarılı.`);

  // 1. Write meydanBasvurulari
  console.log(`\n1/3: meydanBasvurulari koleksiyonuna ${allBasvuruDocs.length} doküman yazılıyor...`);
  const basvuruChunks = splitIntoChunks(allBasvuruDocs, BATCH_LIMIT);
  let bIdx = 0;
  for (const chunk of basvuruChunks) {
    bIdx += 1;
    let committed = false;
    let attempts = 0;

    while (!committed && attempts < 5) {
      attempts += 1;
      try {
        const batch = writeBatch(db);
        for (const item of chunk) {
          const docRef = doc(db, 'meydanBasvurulari', item.docId);
          batch.set(docRef, item, { merge: true });
        }
        await batch.commit();
        committed = true;
      } catch (err) {
        console.warn(`\n  Grup ${bIdx} hata aldı (${err.message}). ${attempts * 1500}ms bekleniyor...`);
        await sleep(attempts * 1500);
      }
    }
    process.stdout.write(`\r  Başvurular yazılıyor: Grup ${bIdx} / ${basvuruChunks.length} (${Math.round((bIdx / basvuruChunks.length) * 100)}%)`);
    await sleep(400); // 400ms delay between batches to respect Firestore limits
  }
  console.log(`\n✓ meydanBasvurulari başarıyla güncellendi.`);

  // 2. Write personelBasvuruOzetleri
  console.log(`\n2/3: personelBasvuruOzetleri koleksiyonuna ${personelAggregates.size} personel özeti yazılıyor...`);
  const pBatch = writeBatch(db);
  for (const [pKey, pStat] of personelAggregates.entries()) {
    // Write primary docId
    const docRef1 = doc(db, 'personelBasvuruOzetleri', pKey);
    pBatch.set(docRef1, pStat, { merge: true });

    // Also write standard 2026-q1 format docId for compatibility
    const docId2026 = getPersonelBasvuruDocId(pStat.personelAdi);
    const docRef2 = doc(db, 'personelBasvuruOzetleri', docId2026);
    pBatch.set(docRef2, pStat, { merge: true });
  }
  await pBatch.commit();
  console.log(`✓ personelBasvuruOzetleri başarıyla güncellendi.`);

  // 3. Write meydanBasvuruStats
  console.log(`\n3/3: meydanBasvuruStats koleksiyonuna ${meydanAggregates.size} meydan istatistiği yazılıyor...`);
  const mBatch = writeBatch(db);
  for (const [mId, mStat] of meydanAggregates.entries()) {
    const docRef = doc(db, 'meydanBasvuruStats', mId);
    mBatch.set(docRef, mStat, { merge: true });
  }
  await mBatch.commit();
  console.log(`✓ meydanBasvuruStats başarıyla güncellendi.`);

  console.log(`\n================================================================`);
  console.log(`TÜM VERİLER BAŞARIYLA FİRESTORE'A YAZILDI VE SENKRONİZE EDİLDİ!`);
  console.log(`================================================================\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Hata oluştu:', err);
  process.exit(1);
});
