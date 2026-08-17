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
  console.log(`\n========================================`);
  console.log(`FILE: ${f}`);
  console.log(`Total Sheets: ${wb.SheetNames.length}`);
  console.log(`========================================`);
  
  let totalRows = 0;
  for (const s of wb.SheetNames) {
    const sheet = wb.Sheets[s];
    const rows = sheetUtils.sheet_to_json(sheet, { header: 1 });
    totalRows += (rows.length > 0 ? rows.length - 1 : 0);
    console.log(`- Sheet: "${s.padEnd(25)}" | Rows: ${String(rows.length).padStart(5)} | Cols: ${rows[0]?.length || 0}`);
  }
  console.log(`-> Total Data Rows in ${f}: ${totalRows}`);
}
