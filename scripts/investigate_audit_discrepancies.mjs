/**
 * scripts/investigate_audit_discrepancies.mjs
 *
 * Detailed investigation of:
 * 1. Missing district count (1 vs 120)
 * 2. Firestore 14,601 vs Excel 11,268 records
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;

console.log('=== 1. DISTRICT (İLÇE) MISSING INVESTIGATION ===');

// Check ANADOLU YAKASI.xlsx & AVRUPA YAKASI.xlsx
const newFiles = ['ANADOLU YAKASI.xlsx', 'AVRUPA YAKASI.xlsx'];
let newExcelMissingDistrict = [];

for (const f of newFiles) {
  const wb = readFile(path.join(BUYUK_DIR, f));
  for (const s of wb.SheetNames) {
    const rows = sheetUtils.sheet_to_json(wb.Sheets[s], { header: 1 });
    const headers = rows[0] ? rows[0].map(h => String(h || '').trim()) : [];
    const ilceIdx = headers.indexOf('İlçe');
    const basvuruIdx = headers.indexOf('Başvuru No');
    const aciklamaIdx = headers.indexOf('Açıklama');

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || row.every(v => v === null || v === undefined || v === '')) continue;
      const val = ilceIdx >= 0 ? row[ilceIdx] : undefined;
      if (!val || String(val).trim() === '') {
        newExcelMissingDistrict.push({
          file: f,
          sheet: s,
          row: r,
          basvuruNo: row[basvuruIdx],
          aciklama: row[aciklamaIdx] ? String(row[aciklamaIdx]).slice(0, 80) : ''
        });
      }
    }
  }
}

console.log(`Yeni Excel dosyalarında (${newFiles.join(', ')}) ilçesi boş kayıt sayısı:`, newExcelMissingDistrict.length);
console.log('Detay:', newExcelMissingDistrict);

// Check root basvurudetaylar.xlsx (legacy file)
const legacyFile = path.join(ROOT, 'basvurudetaylar.xlsx');
let legacyMissingDistrict = 0;
let legacyTotalRows = 0;
if (fs.existsSync(legacyFile)) {
  const wbLeg = readFile(legacyFile);
  for (const s of wbLeg.SheetNames) {
    const rows = sheetUtils.sheet_to_json(wbLeg.Sheets[s], { header: 1 });
    const headers = rows[0] ? rows[0].map(h => String(h || '').trim()) : [];
    const ilceIdx = headers.indexOf('İlçe');
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || row.every(v => v === null || v === undefined || v === '')) continue;
      legacyTotalRows++;
      const val = ilceIdx >= 0 ? row[ilceIdx] : undefined;
      if (!val || String(val).trim() === '') {
        legacyMissingDistrict++;
      }
    }
  }
  console.log(`Eski basvurudetaylar.xlsx dosyasında toplam satır: ${legacyTotalRows}, ilçesi boş satır sayısı: ${legacyMissingDistrict}`);
}

console.log('\n=== 2. FIRESTORE 14,601 vs EXCEL 11,268 COMPARISON ===');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
await signInAnonymously(auth);

console.log('Firestore meydanBasvurulari okunuyor...');
const snap = await getDocs(collection(db, 'meydanBasvurulari'));
console.log(`Firestore toplam meydanBasvurulari doküman sayısı: ${snap.size}`);

// Get all unique basvuruNo from new Excel
const newExcelBasvuruNos = new Set();
for (const f of newFiles) {
  const wb = readFile(path.join(BUYUK_DIR, f));
  for (const s of wb.SheetNames) {
    const rows = sheetUtils.sheet_to_json(wb.Sheets[s], { header: 1 });
    const headers = rows[0] ? rows[0].map(h => String(h || '').trim()) : [];
    const basvuruIdx = headers.indexOf('Başvuru No');
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[basvuruIdx]) continue;
      newExcelBasvuruNos.add(String(row[basvuruIdx]).trim());
    }
  }
}
console.log(`Yeni Excel'deki tekil Başvuru No adedi: ${newExcelBasvuruNos.size}`);

let inBoth = 0;
let onlyInFirestore = 0;
let firestoreMissingDistrict = 0;
const onlyInFirestoreSamples = [];

snap.docs.forEach(d => {
  const data = d.data();
  const bNo = data.basvuruNo || d.id;
  if (!data.ilce || String(data.ilce).trim() === '') {
    firestoreMissingDistrict++;
  }
  if (newExcelBasvuruNos.has(bNo)) {
    inBoth++;
  } else {
    onlyInFirestore++;
    if (onlyInFirestoreSamples.length < 5) {
      onlyInFirestoreSamples.push({
        id: d.id,
        basvuruNo: bNo,
        tarih: data.tarih,
        ilce: data.ilce,
        personelAdi: data.personelAdi,
        konu: data.konu
      });
    }
  }
});

console.log(`\nKarşılaştırma Sonuçları:`);
console.log(`- Hem Yeni Excel'de hem Firestore'da olan: ${inBoth}`);
console.log(`- Sadece Firestore'da bulunan (Legacy/önceki import): ${onlyInFirestore}`);
console.log(`- Firestore'da ilçesi boş olan doküman sayısı: ${firestoreMissingDistrict}`);
console.log(`- Yalnızca Firestore'da bulunan örnek kayıtlar:`, onlyInFirestoreSamples);

fs.writeFileSync(
  path.join(ROOT, 'scripts', 'discrepancy_analysis.json'),
  JSON.stringify({
    newExcelMissingDistrict,
    legacyMissingDistrict,
    inBoth,
    onlyInFirestore,
    firestoreMissingDistrict,
    onlyInFirestoreSamples
  }, null, 2),
  'utf8'
);

process.exit(0);
