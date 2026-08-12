import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;

const files = fs.readdirSync(BUYUK_DIR);
console.log('Files in Buyuk_guncelleme:', files);

for (const file of files) {
  const filePath = path.join(BUYUK_DIR, file);
  console.log('\n========================================');
  console.log('FILE:', file);
  console.log('========================================');

  if (file.endsWith('.json')) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log('JSON Record Count:', Array.isArray(data) ? data.length : typeof data);
      if (Array.isArray(data) && data.length > 0) {
        console.log('Sample Record Keys:', Object.keys(data[0]));
        console.log('Sample Record 0:', JSON.stringify(data[0], null, 2));
      }
    } catch (err) {
      console.error('Error reading JSON:', err.message);
    }
  } else if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
    try {
      const wb = readFile(filePath);
      console.log('Sheet Names:', wb.SheetNames);
      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        const rows = sheetUtils.sheet_to_json(sheet, { header: 1 });
        console.log(`--- Sheet: ${sheetName} (${rows.length} rows) ---`);
        if (rows.length > 0) {
          console.log('Header Row (Row 0):', rows[0]);
          if (rows.length > 1) console.log('Row 1:', rows[1]);
          if (rows.length > 2) console.log('Row 2:', rows[2]);
        }
      }
    } catch (err) {
      console.error('Error reading Excel:', err.message);
    }
  }
}
