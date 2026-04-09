import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { resolveSourceDir } from './shared/env.js';

async function testExcel() {
  const sourceDir = resolveSourceDir('C:/Users/candu/Desktop/PLANLAR');

  if (!sourceDir || !fs.existsSync(sourceDir)) {
    throw new Error(`Excel klasoru bulunamadi: ${sourceDir || '(bos)'}`);
  }

  const files = fs.readdirSync(sourceDir).filter((file) => file.toLowerCase().endsWith('.xlsx'));

  if (!files.length) {
    throw new Error(`Klasorde test edilecek Excel dosyasi yok: ${sourceDir}`);
  }

  const filePath = path.join(sourceDir, files[0]);
  console.log('Testing file:', filePath);

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log('JSON Length:', rawJson.length);
  console.log('First Row:', rawJson[0]);
}

testExcel().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
