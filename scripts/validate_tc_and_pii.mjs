/**
 * scripts/validate_tc_and_pii.mjs
 *
 * Checks true TC checksums and checks citizen fields specifically.
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;

function isValidTCKN(tcknStr) {
  if (!/^[1-9][0-9]{10}$/.test(tcknStr)) return false;
  const digits = tcknStr.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenth = ((oddSum * 7) - evenSum) % 10;
  if (tenth < 0 ? tenth + 10 : tenth !== digits[9]) return false;
  const totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if ((totalSum % 10) !== digits[10]) return false;
  return true;
}

const excelFiles = ['ANADOLU YAKASI.xlsx', 'AVRUPA YAKASI.xlsx'];
let totalRows = 0;
let realTCCount = 0;
let hasBasvuruSahibiColumn = 0;
let basvuruSahibiFilled = 0;
let vatandasList = [];

for (const f of excelFiles) {
  const filePath = path.join(BUYUK_DIR, f);
  if (!fs.existsSync(filePath)) continue;
  const wb = readFile(filePath);
  for (const s of wb.SheetNames) {
    const rows = sheetUtils.sheet_to_json(wb.Sheets[s], { header: 1 });
    if (!rows || rows.length <= 1) continue;
    const headers = rows[0].map(h => String(h || '').trim());
    const sahipIdx = headers.indexOf('Başvuru Sahibi');
    const aciklamaIdx = headers.indexOf('Açıklama');
    const ozetIdx = headers.indexOf('Özet');

    if (sahipIdx >= 0) hasBasvuruSahibiColumn++;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || row.every(v => v === null || v === undefined || v === '')) continue;
      totalRows++;

      if (sahipIdx >= 0 && row[sahipIdx]) {
        basvuruSahibiFilled++;
      }

      const textToScan = `${row[aciklamaIdx] || ''} ${row[ozetIdx] || ''}`;
      const elevenDigits = textToScan.match(/\b[1-9][0-9]{10}\b/g) || [];
      for (const d of elevenDigits) {
        if (isValidTCKN(d)) {
          realTCCount++;
        }
      }
    }
  }
}

console.log(`Toplam İncelenen Satır: ${totalRows}`);
console.log(`'Başvuru Sahibi' (Vatandaş Ad-Soyad) Kolonu Dolu Satır Sayısı: ${basvuruSahibiFilled} (%${((basvuruSahibiFilled/totalRows)*100).toFixed(2)})`);
console.log(`Açıklama / Özet Metinlerinde Algoritmik Olarak Geçerli Gerçek TC Kimlik No Sayısı: ${realTCCount}`);

process.exit(0);
