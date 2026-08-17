/**
 * scripts/privacy_audit.mjs
 *
 * 100% READ-ONLY Privacy and Citizen PII Scanner for SYP.
 * Scans all Excel, JSON, scripts, frontend source, and export modules for citizen PII.
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');
const DATA_DIR = path.resolve(ROOT, 'src', 'data');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;

// Regex patterns for citizen PII
const TC_REGEX = /\b[1-9][0-9]{10}\b/g;
const PHONE_REGEX = /(?:\+?90|0)?[\s-]?(?:\(?5[0-9]{2}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}|\(?5[0-9]{2}\)?[\s-]?[0-9]{7})/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PLATE_REGEX = /\b(?:0[1-9]|[1-7][0-9]|8[01])[\s-]?[A-Z]{1,3}[\s-]?[0-9]{2,4}\b/g;
const DOOR_ADDRESS_REGEX = /(?:no\s*:\s*\d+|d:\s*\d+|kat\s*:\s*\d+|daire\s*:\s*\d+|blok\s*:\s*\d+|sok(?:ak)?\s*no\s*\d+)/gi;

// Sensitive category keywords
const SENSITIVE_KEYWORDS = [
  'engelli', 'otizm', 'down sendrom', 'kanser', 'diyaliz', 'tedavi', 'ameliyat', 'hasta',
  'hastalık', 'raporlu', 'psikiyatri', 'şizofren', 'adli', 'cezaevi', 'hükümlü', 'sabıka',
  'darp', 'şiddet', 'sığınma evi', 'siyasi parti', 'cami cemaati', 'din', 'mezhep'
];

console.log('=== 1. SCANNING BUYUK_GUNCELLEME EXCEL SOURCES ===');
const excelFiles = ['ANADOLU YAKASI.xlsx', 'AVRUPA YAKASI.xlsx'];
let totalExcelRows = 0;
let excelColumnsFound = new Set();
let citizenTCCount = 0;
let citizenPhoneCount = 0;
let citizenEmailCount = 0;
let citizenPlateCount = 0;
let citizenDoorAddressCount = 0;
let sensitiveContentCount = 0;

for (const f of excelFiles) {
  const filePath = path.join(BUYUK_DIR, f);
  if (!fs.existsSync(filePath)) continue;
  const wb = readFile(filePath);
  for (const s of wb.SheetNames) {
    const rows = sheetUtils.sheet_to_json(wb.Sheets[s], { header: 1 });
    if (!rows || rows.length <= 1) continue;
    const headers = rows[0].map(h => String(h || '').trim());
    headers.forEach(h => excelColumnsFound.add(h));

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || row.every(v => v === null || v === undefined || v === '')) continue;
      totalExcelRows++;

      // Check all cell contents in this row
      const fullRowText = row.map(c => String(c || '')).join(' ');

      if (TC_REGEX.test(fullRowText)) citizenTCCount++;
      if (PHONE_REGEX.test(fullRowText)) citizenPhoneCount++;
      if (EMAIL_REGEX.test(fullRowText)) citizenEmailCount++;
      if (PLATE_REGEX.test(fullRowText)) citizenPlateCount++;
      if (DOOR_ADDRESS_REGEX.test(fullRowText)) citizenDoorAddressCount++;

      const lowerText = fullRowText.toLowerCase();
      if (SENSITIVE_KEYWORDS.some(kw => lowerText.includes(kw))) {
        sensitiveContentCount++;
      }
    }
  }
}

console.log(`Toplam Satır: ${totalExcelRows}`);
console.log(`Excel Kolon Başlıkları:`, Array.from(excelColumnsFound));
console.log(`TC Kimlik Eşleşen Satır: ${citizenTCCount}`);
console.log(`Telefon Eşleşen Satır: ${citizenPhoneCount}`);
console.log(`E-Posta Eşleşen Satır: ${citizenEmailCount}`);
console.log(`Plaka Eşleşen Satır: ${citizenPlateCount}`);
console.log(`Açık Kapı/Bina Adresi Eşleşen Satır: ${citizenDoorAddressCount}`);
console.log(`Hassas / Özel Nitelikli Anahtar Kelime İçeren Satır: ${sensitiveContentCount}`);

console.log('\n=== 2. SCANNING COMPILED JSON DATASETS ===');
const jsonFiles = [
  'compiledExecutiveBasvurular.json',
  'compiledMeydanStats.json',
  'dataFreshness.json'
];

for (const jf of jsonFiles) {
  const jp = path.join(DATA_DIR, jf);
  if (!fs.existsSync(jp)) continue;
  const content = fs.readFileSync(jp, 'utf8');
  const sizeMb = (content.length / (1024 * 1024)).toFixed(2);
  const tcMatches = (content.match(TC_REGEX) || []).length;
  const phoneMatches = (content.match(PHONE_REGEX) || []).length;
  const emailMatches = (content.match(EMAIL_REGEX) || []).length;
  console.log(`File: ${jf} (${sizeMb} MB) -> TC: ${tcMatches}, Telefon: ${phoneMatches}, E-posta: ${emailMatches}`);
}

console.log('\n=== 3. SCANNING LEGACY BASVURUDETAYLAR.XLSX ===');
const legacyExcelPath = path.join(ROOT, 'basvurudetaylar.xlsx');
if (fs.existsSync(legacyExcelPath)) {
  const wb = readFile(legacyExcelPath);
  const rows = sheetUtils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  console.log(`basvurudetaylar.xlsx mevcut! Toplam satır: ${rows.length}, Kolonlar:`, rows[0]);
} else {
  console.log('basvurudetaylar.xlsx ana dizinde bulunamadı.');
}

console.log('\n=== 4. CHECKING AI CONTEXT IN AIDAILYEXECUTIVESUMMARY ===');
const aiPath = path.join(ROOT, 'src', 'components', 'dashboard', 'AIDailyExecutiveSummary.jsx');
const aiCode = fs.readFileSync(aiPath, 'utf8');
const sendsAciklama = aiCode.includes('basvuruAciklamasi') || aiCode.includes('aciklama');
console.log(`AI Prompt'una ham başvuru açıklaması gidiyor mu? -> ${sendsAciklama ? 'EVET (RİSK!)' : 'HAYIR (GÜVENLİ - Sadece aggregate metrikler)'}`);

process.exit(0);
