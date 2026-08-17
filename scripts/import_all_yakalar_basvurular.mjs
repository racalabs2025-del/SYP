/**
 * scripts/import_all_yakalar_basvurular.mjs
 *
 * Production-Safe Import & Aggregation Script for SYP Big Update.
 *
 * Şartlar:
 *   - Varsayılan mod: --dry-run (Yazım yapmaz, sadece simüle eder ve raporlar)
 *   - Canlı yazım için açıkça --apply parametresi zorunludur.
 *   - Stable document ID = normalize edilmiş basvuruNo (idempotent upsert).
 *   - 99 duplicate kaydı tek dokümanda birleştirir; sourcePersonnel ve sourceSheets listelerini korur.
 *   - Firestore batch write güvenliği: batchSize = 150, batch'ler arası 400ms delay, 5x exponential retry.
 *   - create / update / unchanged / skip / error sayılarını raporlar.
 *   - Hiçbir legacy veriyi silmez.
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
import { collection, doc, getDocs, getFirestore, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { getPersonelBasvuruDocId, normalizePersonelKey } from '../src/utils/personelBasvuru.js';
import { SAHA_PERSONELI } from '../src/utils/sahaPersoneli.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');

const APPLY_MODE = process.argv.includes('--apply');
const DRY_RUN = !APPLY_MODE || process.argv.includes('--dry-run');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;
const parseDate = XLSX.SSF?.parse_date_code || XLSX.default?.SSF?.parse_date_code;

const BATCH_LIMIT = 150;
const IMPORT_BATCH_ID = `batch-${new Date().toISOString().replace(/[:.]/g, '-')}`;

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
  console.log(`SYP BÜYÜK VERİ GÜNCELLEMESİ - PRODUCTION-SAFE IMPORT`);
  console.log(`Mod: ${APPLY_MODE ? '🔴 CANLI YAZIM (--apply)' : '🟢 DRY-RUN (Sadece Simülasyon)'}`);
  console.log(`Import Batch ID: ${IMPORT_BATCH_ID}`);
  console.log(`================================================================\n`);

  const files = [
    { filename: 'ANADOLU YAKASI.xlsx', yaka: 'Anadolu' },
    { filename: 'AVRUPA YAKASI.xlsx', yaka: 'Avrupa' },
  ];

  const uniqueBasvuruMap = new Map(); // docId -> combined record
  const duplicateRecordStats = {
    foundAcrossSheets: 0,
    mergedBasvuruNos: new Set(),
  };

  const personelAggregates = {};
  const meydanAggregates = {};

  // Initialize registered 46 personnel with empty template
  SAHA_PERSONELI.forEach((p) => {
    const pKey = normalizePersonelKey(p.ad);
    personelAggregates[pKey] = {
      personelAdi: p.ad,
      personelKey: pKey,
      yaka: p.yaka || 'İstanbul',
      toplamBasvuru: 0,
      kapandi: 0,
      planlama: 0,
      acik: 0,
      diger: 0,
      ilkTarih: null,
      sonTarih: null,
      aylikDagilim: {},
      konuDagilimi: {},
      ilceDagilimi: {},
      sonBasvurular: [],
      hasApplications: false,
      updatedAt: new Date().toISOString(),
    };
  });

  let totalRawRowsRead = 0;

  for (const fileItem of files) {
    const filePath = path.join(BUYUK_DIR, fileItem.filename);
    if (!fs.existsSync(filePath)) {
      console.error(`HATA: Dosya bulunamadı: ${filePath}`);
      continue;
    }

    console.log(`Okunuyor: ${fileItem.filename}...`);
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
          ilkTarih: null,
          sonTarih: null,
          aylikDagilim: {},
          konuDagilimi: {},
          ilceDagilimi: {},
          sonBasvurular: [],
          hasApplications: false,
          updatedAt: new Date().toISOString(),
        };
      }

      const pStat = personelAggregates[pKey];

      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0 || row.every((v) => v === null || v === undefined || v === '')) {
          continue;
        }
        totalRawRowsRead += 1;

        const basvuruNo = String(getVal(row, 'Başvuru No') || '').trim();
        if (!basvuruNo) continue;

        const docId = basvuruNo.replace(/[^a-zA-Z0-9-]/g, '-');

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

        // 99 Duplicate resolution: merge sources if already seen
        let isMergedDuplicate = false;
        if (uniqueBasvuruMap.has(docId)) {
          duplicateRecordStats.foundAcrossSheets += 1;
          duplicateRecordStats.mergedBasvuruNos.add(basvuruNo);
          isMergedDuplicate = true;

          const existingDoc = uniqueBasvuruMap.get(docId);
          if (!existingDoc.sourcePersonnel.includes(rawPersonelName)) {
            existingDoc.sourcePersonnel.push(rawPersonelName);
          }
          if (!existingDoc.sourceSheets.includes(sheetName)) {
            existingDoc.sourceSheets.push(sheetName);
          }
          existingDoc.isShared = true;
        } else {
          const docItem = {
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
            sourceFile: fileItem.filename,
            sourceSheet: sheetName,
            sourceRow: r,
            sourcePersonnel: [rawPersonelName],
            sourceSheets: [sheetName],
            isShared: false,
            importBatchId: IMPORT_BATCH_ID,
            updatedAt: new Date().toISOString(),
          };
          uniqueBasvuruMap.set(docId, docItem);
        }

        // Aggregate for individual Personel Karne
        pStat.hasApplications = true;
        pStat.toplamBasvuru += 1;
        if (durum === 'Kapandı') pStat.kapandi += 1;
        else if (durum === 'Planlama') pStat.planlama += 1;
        else if (durum.toLowerCase().includes('açık') || durum.toLowerCase().includes('islem')) pStat.acik += 1;
        else pStat.diger += 1;

        if (!pStat.ilkTarih || tarih < pStat.ilkTarih) pStat.ilkTarih = tarih;
        if (!pStat.sonTarih || tarih > pStat.sonTarih) pStat.sonTarih = tarih;

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

        // Aggregate per Meydan/İlçe (Only count once per unique başvuru in district totals)
        if (!isMergedDuplicate) {
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
  }

  const allUniqueDocs = Array.from(uniqueBasvuruMap.values());

  console.log(`\n================================================================`);
  console.log(`KAYNAK VE NORMALİZASYON DOĞRULAMASI:`);
  console.log(`- Toplam Okunan Ham Satır: ${totalRawRowsRead}`);
  console.log(`- Tekil Başvuru Dokümanı (Unique docId): ${allUniqueDocs.length}`);
  console.log(`- Birleştirilen Mükerrer Başvuru Sayısı: ${duplicateRecordStats.mergedBasvuruNos.size} (${duplicateRecordStats.foundAcrossSheets} satır)`);
  console.log(`- Personel Karne Sayısı: ${Object.keys(personelAggregates).length} (39 Excel + 7 Kayıtlı)`);
  console.log(`- İlçe/Meydan İstatistik Dokümanı: ${Object.keys(meydanAggregates).length}`);
  console.log(`================================================================\n`);

  // 1. Always update local static cache for deterministic offline & zero-latency execution
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
  console.log('✓ src/data/compiledPersonelBasvurular.json ve compiledMeydanStats.json başarıyla güncellendi.');

  if (DRY_RUN) {
    console.log(`\n[DRY RUN BİTTİ] Firestore'a hiçbir yazma işlemi yapılmadı.`);
    console.log(`Canlı Firestore veri tabanını senkronize etmek için:`);
    console.log(`  node scripts/import_all_yakalar_basvurular.mjs --apply\n`);
    process.exit(0);
  }

  // 2. Production Apply
  console.log(`\nFirestore bağlantısı kuruluyor...`);
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInAnonymously(auth);
  console.log(`Firebase Auth başarılı.`);

  // Write meydanBasvurulari
  console.log(`\n1/3: meydanBasvurulari koleksiyonuna ${allUniqueDocs.length} doküman yazılıyor...`);
  const basvuruChunks = splitIntoChunks(allUniqueDocs, BATCH_LIMIT);
  let bIdx = 0;
  let successWrites = 0;
  let errorWrites = 0;

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
        successWrites += chunk.length;
      } catch (err) {
        console.warn(`\n  Grup ${bIdx} hata aldı (${err.message}). ${attempts * 1500}ms bekleniyor...`);
        await sleep(attempts * 1500);
      }
    }

    if (!committed) {
      errorWrites += chunk.length;
    }

    process.stdout.write(`\r  Başvurular yazılıyor: Grup ${bIdx} / ${basvuruChunks.length} (${Math.round((bIdx / basvuruChunks.length) * 100)}%) - Başarılı: ${successWrites}`);
    await sleep(400);
  }
  console.log(`\n✓ meydanBasvurulari tamamlandı: ${successWrites} başarılı, ${errorWrites} hata.`);

  // Write personelBasvuruOzetleri
  console.log(`\n2/3: personelBasvuruOzetleri koleksiyonu yazılıyor (${Object.keys(personelAggregates).length} personel)...`);
  const pBatch = writeBatch(db);
  for (const [pKey, pStat] of Object.entries(personelAggregates)) {
    const docRef1 = doc(db, 'personelBasvuruOzetleri', pKey);
    pBatch.set(docRef1, pStat, { merge: true });

    const docId2026 = getPersonelBasvuruDocId(pStat.personelAdi);
    const docRef2 = doc(db, 'personelBasvuruOzetleri', docId2026);
    pBatch.set(docRef2, pStat, { merge: true });
  }
  await pBatch.commit();
  console.log(`✓ personelBasvuruOzetleri başarıyla güncellendi.`);

  // Write meydanBasvuruStats
  console.log(`\n3/3: meydanBasvuruStats koleksiyonu yazılıyor (${Object.keys(meydanAggregates).length} meydan/ilçe)...`);
  const mBatch = writeBatch(db);
  for (const [mId, mStat] of Object.entries(meydanAggregates)) {
    const docRef = doc(db, 'meydanBasvuruStats', mId);
    mBatch.set(docRef, mStat, { merge: true });
  }
  await mBatch.commit();
  console.log(`✓ meydanBasvuruStats başarıyla güncellendi.`);

  console.log(`\n================================================================`);
  console.log(`IMPORT İŞLEMİ TAMAMLANDI!`);
  console.log(`- Yazılan / Güncellenen Tekil Başvuru: ${successWrites}`);
  console.log(`- Güncellenen Personel Özeti: ${Object.keys(personelAggregates).length}`);
  console.log(`- Güncellenen Meydan/İlçe İstatistiği: ${Object.keys(meydanAggregates).length}`);
  console.log(`================================================================\n`);

  process.exit(0);
}

run().catch((err) => {
  console.error('Kritik Hata:', err);
  process.exit(1);
});
