/**
 * scripts/find_and_sync_missing_105.mjs
 *
 * 1. Identifies the exact 105 records present in new Excel (11,268 unique)
 *    but not yet written to Firestore (11,163 present).
 * 2. Details each record (basvuruNo, personel, tarih, ilce, sourceFile, sourceSheet, sourceRow).
 * 3. Writes ONLY these 105 records to Firestore in a single safe batch of 105 docs.
 * 4. Verifies that Firestore coverage becomes 11,268 / 11,268.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { normalizePersonelKey } from '../src/utils/personelBasvuru.js';

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
  console.log('=== 1. YENİ EXCEL KAYITLARI OKUNUYOR ===');
  const files = [
    { filename: 'ANADOLU YAKASI.xlsx', yaka: 'Anadolu' },
    { filename: 'AVRUPA YAKASI.xlsx', yaka: 'Avrupa' },
  ];

  const excelMap = new Map(); // docId -> docItem

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

      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0 || row.every((v) => v === null || v === undefined || v === '')) {
          continue;
        }

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

        // Check if missing district specifically (1-17703298)
        const dataQuality = !ilce ? 'missingDistrict' : 'valid';

        if (excelMap.has(docId)) {
          const existing = excelMap.get(docId);
          if (!existing.sourcePersonnel.includes(rawPersonelName)) {
            existing.sourcePersonnel.push(rawPersonelName);
          }
          if (!existing.sourceSheets.includes(sheetName)) {
            existing.sourceSheets.push(sheetName);
          }
          existing.isShared = true;
        } else {
          excelMap.set(docId, {
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
            dataQuality,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  console.log(`Yeni Excel Unique Kayıt Sayısı: ${excelMap.size}`);

  console.log('\n=== 2. FIRESTORE MEVCUT KAYITLARI OKUNUYOR ===');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInAnonymously(auth);

  const snap = await getDocs(collection(db, 'meydanBasvurulari'));
  const firestoreIds = new Set(snap.docs.map(d => d.id));
  console.log(`Firestore meydanBasvurulari Toplam Doküman Sayısı: ${firestoreIds.size}`);

  // Find the exact missing ones
  const missingFromFirestore = [];
  for (const [docId, docItem] of excelMap.entries()) {
    if (!firestoreIds.has(docId)) {
      missingFromFirestore.push(docItem);
    }
  }

  console.log(`\n=== 3. FIRESTORE'DA EKSİK OLAN KAYITLAR (${missingFromFirestore.length} Adet) ===`);
  console.log(`Eksik Kayıt Adedi: ${missingFromFirestore.length}`);

  // Save the full 105 list to JSON
  fs.writeFileSync(
    path.join(ROOT, 'scripts', 'missing_105_records.json'),
    JSON.stringify(missingFromFirestore, null, 2),
    'utf8'
  );
  console.log(`Detaylı 105 kayıt listesi scripts/missing_105_records.json dosyasına yazıldı.`);

  console.log('İlk 5 Örnek:');
  missingFromFirestore.slice(0, 5).forEach((m, idx) => {
    console.log(`  [${idx + 1}] #${m.basvuruNo} | Personel: ${m.personelAdi} | Tarih: ${m.tarih} | İlçe: ${m.ilce} | Kaynak: ${m.sourceFile} / ${m.sourceSheet} (Satır ${m.sourceRow})`);
  });

  if (missingFromFirestore.length > 0) {
    console.log(`\n=== 4. EKSİK ${missingFromFirestore.length} KAYIT FİRESTORE'A GÜVENLE YAZILIYOR ===`);
    const batch = writeBatch(db);
    for (const item of missingFromFirestore) {
      const docRef = doc(db, 'meydanBasvurulari', item.docId);
      batch.set(docRef, item, { merge: true });
    }
    await batch.commit();
    console.log(`✓ ${missingFromFirestore.length} eksik kayıt tek bir güvenli batch ile Firestore'a eklendi!`);
  }

  // Re-verify coverage
  console.log('\n=== 5. NİHAİ KAPSAMA DOĞRULAMASI ===');
  const snapAfter = await getDocs(collection(db, 'meydanBasvurulari'));
  const firestoreIdsAfter = new Set(snapAfter.docs.map(d => d.id));

  let verifiedCount = 0;
  for (const docId of excelMap.keys()) {
    if (firestoreIdsAfter.has(docId)) {
      verifiedCount++;
    }
  }

  console.log(`Toplam Firestore Dokümanı: ${firestoreIdsAfter.size}`);
  console.log(`Yeni Excel Unique Kayıt Sayısı: ${excelMap.size}`);
  console.log(`Yeni Excel Unique Kayıtlarının Firestore Kapsaması: ${verifiedCount} / ${excelMap.size} (%${((verifiedCount / excelMap.size) * 100).toFixed(2)})`);

  if (verifiedCount === excelMap.size) {
    console.log('\n🎉 [PASS] EŞİTLİK TAM SAĞLANDI: 11.268 / 11.268');
  } else {
    console.log('\n❌ [FAIL] Uyuşmazlık var!');
  }

  process.exit(0);
}

run().catch(console.error);
