import * as XLSX from 'xlsx';

const readFile = XLSX.readFile || XLSX.default?.readFile;

function excelSerialToIsoDate(serial) {
  if (typeof serial === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(serial.trim())) {
    return serial.trim();
  }
  const num = Number(serial);
  if (isNaN(num) || num <= 0 || num > 100000) return null;
  const utcDays = Math.floor(num - 25569);
  const utcValue = utcDays * 86400;
  const dateObj = new Date(utcValue * 1000);
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const wb = readFile('Buyuk_guncelleme/Saha Çalışma Programı (10-14 AĞUSTOS).xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

let currentPersonel = '';
let currentTelefon = '';
let currentBolge = '';
const extractedShifts = [];

for (let i = 2; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r[0] === undefined || r[0] === null) continue;

  if (r[1] && String(r[1]).trim()) {
    currentPersonel = String(r[1]).trim();
    currentTelefon = String(r[2] || '').trim();
    currentBolge = String(r[3] || '').trim();
  }

  const isoTarih = excelSerialToIsoDate(r[0]);
  if (!isoTarih) continue;
  if (!currentPersonel) continue;

  const lokasyonRaw = String(r[4] || '').trim();
  if (!lokasyonRaw || lokasyonRaw === 'Yİ' || lokasyonRaw === 'OFF' || lokasyonRaw === 'İZİNLİ') continue;

  extractedShifts.push({
    personelAdi: currentPersonel,
    telefon: currentTelefon,
    bolge: currentBolge,
    tarih: isoTarih,
    lokasyonRaw,
  });
}

console.log('Extracted Shifts Count:', extractedShifts.length);
const byDate = {};
extractedShifts.forEach(s => byDate[s.tarih] = (byDate[s.tarih] || 0) + 1);
console.log('Shifts By Date:', byDate);
console.log('\nSample Shifts for 2026-08-12 (Today):');
console.log(extractedShifts.filter(s => s.tarih === '2026-08-12').slice(0, 5));
