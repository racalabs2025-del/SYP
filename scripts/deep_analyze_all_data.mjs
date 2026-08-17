import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;
const parseDate = XLSX.SSF?.parse_date_code || XLSX.default?.SSF?.parse_date_code;

function excelSerialToDateStr(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    const trimmed = serial.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parts = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (parts) {
      return `${parts[3]}-${String(parts[2]).padStart(2, '0')}-${String(parts[1]).padStart(2, '0')}`;
    }
  }
  const num = Number(serial);
  if (isNaN(num) || num <= 0) return null;
  try {
    if (parseDate) {
      const d = parseDate(num);
      return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
    const msPerDay = 86400000;
    const excelEpoch = new Date(1899, 11, 30).getTime();
    const jsDate = new Date(excelEpoch + num * msPerDay);
    const y = jsDate.getFullYear();
    const m = jsDate.getMonth() + 1;
    const d = jsDate.getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  } catch {
    return null;
  }
}

const files = [
  { name: 'ANADOLU YAKASI.xlsx', yaka: 'Anadolu' },
  { name: 'AVRUPA YAKASI.xlsx', yaka: 'Avrupa' }
];

const stats = {
  totalRows: 0,
  totalValidBasvurular: 0,
  duplicateBasvuruNos: new Map(),
  allBasvuruNos: new Set(),
  personelStats: {},
  durumStats: {},
  onemStats: {},
  tipStats: {},
  konuStats: {},
  ilceStats: {},
  birimStats: {},
  dateMin: '9999-99-99',
  dateMax: '0000-00-00',
  invalidDates: [],
  missingDistricts: [],
  missingBasvuruNo: 0,
  qualityIssues: []
};

for (const fileObj of files) {
  const p = path.resolve(ROOT, 'Buyuk_guncelleme', fileObj.name);
  const wb = readFile(p);

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rawRows = sheetUtils.sheet_to_json(sheet, { header: 1 });
    if (!rawRows || rawRows.length <= 1) continue;

    const headers = rawRows[0].map(h => String(h || '').trim());
    const getCol = (row, colName) => {
      const idx = headers.indexOf(colName);
      return idx >= 0 ? row[idx] : undefined;
    };

    const personelName = sheetName.trim();
    if (!stats.personelStats[personelName]) {
      stats.personelStats[personelName] = {
        yaka: fileObj.yaka,
        total: 0,
        kapandi: 0,
        acik: 0,
        planlama: 0,
        digerDurum: 0,
        minDate: '9999-99-99',
        maxDate: '0000-00-00',
        topKonular: {},
        topIlceler: {},
        dates: {}
      };
    }

    const pStat = stats.personelStats[personelName];

    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0 || row.every(v => v === null || v === undefined || v === '')) continue;
      stats.totalRows++;

      const basvuruNo = String(getCol(row, 'Başvuru No') || '').trim();
      const konu = String(getCol(row, 'Konu') || 'BİLİNMİYOR').trim();
      const altKonu = String(getCol(row, 'Alt Konu') || '').trim();
      const durum = String(getCol(row, 'Durum') || 'Belirtilmemiş').trim();
      const onem = String(getCol(row, 'Önem Derecesi') || '4-Düşük').trim();
      const tip = String(getCol(row, 'Tip') || 'ŞİKAYET').trim();
      const aciklama = String(getCol(row, 'Açıklama') || '').trim();
      const birim = String(getCol(row, 'İlişkili Olduğu Birim') || '').trim();
      const ilce = String(getCol(row, 'İlçe') || '').trim().toUpperCase();
      const mahalle = String(getCol(row, 'Mahalle') || '').trim();
      const rawDate = getCol(row, 'Oluşturulma Tarihi');
      const dateStr = excelSerialToDateStr(rawDate);

      if (!basvuruNo) {
        stats.missingBasvuruNo++;
        stats.qualityIssues.push({ type: 'MISSING_BASVURU_NO', personel: personelName, rowIdx: r });
      } else {
        if (stats.allBasvuruNos.has(basvuruNo)) {
          const count = stats.duplicateBasvuruNos.get(basvuruNo) || 1;
          stats.duplicateBasvuruNos.set(basvuruNo, count + 1);
        } else {
          stats.allBasvuruNos.add(basvuruNo);
        }
      }

      if (!dateStr) {
        stats.invalidDates.push({ personel: personelName, basvuruNo, rawDate });
      } else {
        if (dateStr < stats.dateMin) stats.dateMin = dateStr;
        if (dateStr > stats.dateMax) stats.dateMax = dateStr;
        if (dateStr < pStat.minDate) pStat.minDate = dateStr;
        if (dateStr > pStat.maxDate) pStat.maxDate = dateStr;
        pStat.dates[dateStr] = (pStat.dates[dateStr] || 0) + 1;
      }

      if (!ilce) {
        stats.missingDistricts.push({ personel: personelName, basvuruNo, aciklama: aciklama.slice(0, 50) });
      } else {
        stats.ilceStats[ilce] = (stats.ilceStats[ilce] || 0) + 1;
        pStat.topIlceler[ilce] = (pStat.topIlceler[ilce] || 0) + 1;
      }

      // Aggregate Stats
      stats.totalValidBasvurular++;
      pStat.total++;

      if (durum === 'Kapandı') {
        pStat.kapandi++;
        stats.durumStats['Kapandı'] = (stats.durumStats['Kapandı'] || 0) + 1;
      } else if (durum === 'Planlama') {
        pStat.planlama++;
        stats.durumStats['Planlama'] = (stats.durumStats['Planlama'] || 0) + 1;
      } else if (durum.toLowerCase().includes('açık') || durum.toLowerCase().includes('acik') || durum.toLowerCase().includes('işlemde') || durum.toLowerCase().includes('islemde')) {
        pStat.acik++;
        stats.durumStats['Açık/İşlemde'] = (stats.durumStats['Açık/İşlemde'] || 0) + 1;
      } else {
        pStat.digerDurum++;
        stats.durumStats[durum] = (stats.durumStats[durum] || 0) + 1;
      }

      stats.onemStats[onem] = (stats.onemStats[onem] || 0) + 1;
      stats.tipStats[tip] = (stats.tipStats[tip] || 0) + 1;
      stats.konuStats[konu] = (stats.konuStats[konu] || 0) + 1;
      pStat.topKonular[konu] = (pStat.topKonular[konu] || 0) + 1;
      if (birim) stats.birimStats[birim] = (stats.birimStats[birim] || 0) + 1;
    }
  }
}

console.log('==============================================');
console.log('GENEL ÖZET:');
console.log(`Toplam Satır: ${stats.totalRows}`);
console.log(`Tekil Başvuru Sayısı: ${stats.allBasvuruNos.size}`);
console.log(`Çift (Duplicate) Başvuru Sayısı: ${stats.duplicateBasvuruNos.size}`);
console.log(`Tarih Aralığı: ${stats.dateMin} -> ${stats.dateMax}`);
console.log(`Eksik Tarihli Satır: ${stats.invalidDates.length}`);
console.log(`İlçesi Boş Satır: ${stats.missingDistricts.length}`);
console.log(`Başvuru No Boş Satır: ${stats.missingBasvuruNo}`);
console.log('==============================================');

console.log('\nDURUM DAĞILIMI:');
console.table(stats.durumStats);

console.log('\nÖNEM DERECESİ DAĞILIMI:');
console.table(stats.onemStats);

console.log('\nTİP DAĞILIMI:');
console.table(stats.tipStats);

console.log('\nEN ÇOK BAŞVURU ALAN İLK 10 KONU:');
const sortedKonular = Object.entries(stats.konuStats).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.table(sortedKonular);

console.log('\nEN ÇOK BAŞVURU ALAN İLK 10 İLÇE:');
const sortedIlceler = Object.entries(stats.ilceStats).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.table(sortedIlceler);

console.log('\nPERSONEL BAZLI ÖZET (39 Personel):');
const personelTable = Object.entries(stats.personelStats).map(([name, s]) => ({
  Personel: name,
  Yaka: s.yaka,
  Toplam: s.total,
  Kapandı: s.kapandi,
  Planlama: s.planlama,
  Açık: s.acik,
  Diğer: s.digerDurum,
  'İlk Tarih': s.minDate,
  'Son Tarih': s.maxDate,
})).sort((a, b) => b.Toplam - a.Toplam);

console.table(personelTable);

// Save summary to JSON for reporting
fs.writeFileSync(
  path.resolve(ROOT, 'scripts', 'deep_analysis_result.json'),
  JSON.stringify({ ...stats, personelTable }, null, 2),
  'utf8'
);
console.log('\nDetaylı sonuçlar scripts/deep_analysis_result.json dosyasına yazıldı.');
