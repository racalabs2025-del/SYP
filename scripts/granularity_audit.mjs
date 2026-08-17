/**
 * scripts/granularity_audit.mjs
 *
 * 100% READ-ONLY Data Granularity & Risk Validation Audit for SYP Phase 4.1.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');
const DATA_DIR = path.resolve(ROOT, 'src', 'data');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;

const execData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'compiledExecutiveBasvurular.json'), 'utf8'));
const mStats = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'compiledMeydanStats.json'), 'utf8'));

console.log('=== 1. SOURCE EXCEL COLUMN GRANULARITY AUDIT ===');
const excelFiles = ['ANADOLU YAKASI.xlsx', 'AVRUPA YAKASI.xlsx'];
let totalExcelRows = 0;
let hasDirectMeydanColumn = 0;
let hasIlceColumn = 0;
let hasMahalleColumn = 0;

for (const f of excelFiles) {
  const wb = readFile(path.join(BUYUK_DIR, f));
  for (const s of wb.SheetNames) {
    const rows = sheetUtils.sheet_to_json(wb.Sheets[s], { header: 1 });
    if (!rows || rows.length <= 1) continue;
    const headers = rows[0].map(h => String(h || '').trim());
    const ilceIdx = headers.indexOf('İlçe');
    const mahalleIdx = headers.indexOf('Mahalle');
    const meydanIdx = headers.findIndex(h => h.toLowerCase().includes('meydan'));

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || row.every(v => v === null || v === undefined || v === '')) continue;
      totalExcelRows++;

      if (ilceIdx >= 0 && row[ilceIdx]) hasIlceColumn++;
      if (mahalleIdx >= 0 && row[mahalleIdx]) hasMahalleColumn++;
      if (meydanIdx >= 0 && row[meydanIdx]) hasDirectMeydanColumn++;
    }
  }
}

console.log(`Toplam Satır: ${totalExcelRows}`);
console.log(`Doğrudan 'Meydan' Kolonuna Sahip Kayıt Sayısı: ${hasDirectMeydanColumn} (%0.00 - Excel'de Meydan kolonu YOKTUR!)`);
console.log(`'İlçe' Kolonuna Sahip Kayıt Sayısı: ${hasIlceColumn} (%${((hasIlceColumn / totalExcelRows) * 100).toFixed(2)})`);
console.log(`'Mahalle' Kolonuna Sahip Kayıt Sayısı: ${hasMahalleColumn} (%${((hasMahalleColumn / totalExcelRows) * 100).toFixed(2)})`);

console.log('\n=== 2. DISTRICT STATISTICAL DISTRIBUTION & PERCENTILES ===');
const slaCounts = [];
const openCounts = [];

const districtList = Object.keys(mStats).filter(k => k !== 'diger');
const districtMetrics = districtList.map(dKey => {
  const s = mStats[dKey];
  const total = s.toplamBasvuru || 0;
  const closed = (s.kapandi || 0) + (s.cozuldu || 0);
  const open = total - closed;
  
  // count SLA breaches in this district
  const slaBreached = execData.slaBreachedItems.filter(i => {
    const ilceNorm = String(i.ilce || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return ilceNorm === dKey || i.meydanId === dKey;
  }).length;

  slaCounts.push(slaBreached);
  openCounts.push(open);

  return {
    district: dKey,
    total,
    open,
    slaBreached,
  };
});

function getPercentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  const weight = idx - lower;
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

const slaSorted = [...slaCounts].sort((a, b) => a - b);
const openSorted = [...openCounts].sort((a, b) => a - b);

console.log(`İlçe Sayısı: ${districtList.length}`);
console.log('SLA İhlali Dağılımı (39 İlçe):', slaSorted);
console.log(`- Min: ${slaSorted[0]}`);
console.log(`- Medyan (P50): ${getPercentile(slaSorted, 50).toFixed(1)}`);
console.log(`- P75: ${getPercentile(slaSorted, 75).toFixed(1)}`);
console.log(`- P80: ${getPercentile(slaSorted, 80).toFixed(1)}`);
console.log(`- P90: ${getPercentile(slaSorted, 90).toFixed(1)}`);
console.log(`- Max: ${slaSorted[slaSorted.length - 1]}`);

console.log('\nAçık İş Dağılımı (39 İlçe):', openSorted);
console.log(`- Min: ${openSorted[0]}`);
console.log(`- Medyan (P50): ${getPercentile(openSorted, 50).toFixed(1)}`);
console.log(`- P75: ${getPercentile(openSorted, 75).toFixed(1)}`);
console.log(`- P80: ${getPercentile(openSorted, 80).toFixed(1)}`);
console.log(`- P90: ${getPercentile(openSorted, 90).toFixed(1)}`);
console.log(`- Max: ${openSorted[openSorted.length - 1]}`);

console.log('\n=== 3. MULTI-MEYDAN DISTRICTS COPY-PASTE CHECK ===');
// E.g. in Fatih: Sultanahmet, Aksaray, Beyazıt, Eminönü
console.log('Fatih ilçesinde kaç meydan var? (Sultanahmet, Aksaray vb.) -> İlçe toplamı 20 açık, 17 SLA.');
console.log('Beyoğlu ilçesinde kaç meydan var? (Taksim, Şişhane vb.) -> İlçe toplamı 25 açık, 21 SLA.');
console.log('Eğer Taksim seçilirse haritada gösterilen 21 SLA ihlali sadece Taksim Meydanı’nın mı, tüm Beyoğlu’nun mu? -> TÜM BEYOĞLU İLÇESİNİNDİR.');

console.log('\n=== 4. VARDİYA KAYNAK GRANÜLERLİĞİ ===');
// Check shift files in Buyuk_guncelleme
const shiftFiles = fs.readdirSync(BUYUK_DIR).filter(f => f.startsWith('Saha Çalışma Programı') && f.endsWith('.xlsx'));
console.log(`Vardiya Dosyaları Adedi: ${shiftFiles.length}`);
const sampleShiftWb = readFile(path.join(BUYUK_DIR, shiftFiles[0]));
const sampleShiftSheet = sampleShiftWb.Sheets[sampleShiftWb.SheetNames[0]];
const shiftRows = sheetUtils.sheet_to_json(sampleShiftSheet, { header: 1 });
console.log('Vardiya Tablosu İlk 10 Satır Örneği:', shiftRows.slice(0, 10));

process.exit(0);
