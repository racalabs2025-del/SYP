import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;

const files = ['ANADOLU YAKASI.xlsx', 'AVRUPA YAKASI.xlsx'];
for (const f of files) {
  const p = path.resolve(ROOT, 'Buyuk_guncelleme', f);
  const wb = readFile(p);
  console.log('\n========================================');
  console.log('=== FILE:', f, '===');
  console.log('Sheet Names:', wb.SheetNames);
  for (const s of wb.SheetNames) {
    const sheet = wb.Sheets[s];
    const rows = sheetUtils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${s} (Total Rows: ${rows.length}) ---`);
    for (let r = 0; r < Math.min(5, rows.length); r++) {
      console.log(`Row ${r}:`, JSON.stringify(rows[r]?.slice(0, 15)));
    }
  }
}
