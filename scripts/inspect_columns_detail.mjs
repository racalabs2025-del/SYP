import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;

const f1 = path.resolve(ROOT, 'Buyuk_guncelleme', 'ANADOLU YAKASI.xlsx');
const wb1 = readFile(f1);
const s1 = wb1.Sheets[wb1.SheetNames[0]];
const rows1 = sheetUtils.sheet_to_json(s1, { header: 1 });

console.log('=== ANADOLU YAKASI Sheet 0 Headers ===');
rows1[0].forEach((col, idx) => console.log(`Col ${idx}: ${col}`));

console.log('\n=== Sample Row 1 ===');
rows1[1].forEach((val, idx) => console.log(`Col ${idx} (${rows1[0][idx]}): ${val}`));
