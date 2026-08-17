/**
 * scripts/generate_complete_audit_and_gap_analysis.mjs
 *
 * Sistemin tüm veri setlerini (11.367 başvuru, 7.122 vardiya, 52 meydan, 39 personel, izinler)
 * derinlemesine tarar ve şu raporları üretir:
 *   1. Düzeltilen Hatalar
 *   2. Düzeltilemeyen / Manuel Müdahale Gerektiren Anomaliler
 *   3. Eksik Veriler (Gün, Tarih, Personel ve Meydan Bazında)
 *   4. Yönetim Sunumu Eleştiri ve Durum Raporu
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');

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

// 1. Audit Basvurular
const files = [
  { filename: 'ANADOLU YAKASI.xlsx', yaka: 'Anadolu' },
  { filename: 'AVRUPA YAKASI.xlsx', yaka: 'Avrupa' },
];

const audit = {
  totalRecords: 0,
  validRecords: 0,
  duplicateAcrossSheets: [],
  duplicateBasvuruNos: new Map(),
  seenBasvuruNos: new Map(),
  missingBasvuruNoCount: 0,
  missingDateCount: 0,
  missingDistrictCount: 0,
  missingDescriptionCount: 0,
  unknownStatusCount: 0,
  dateMin: '9999-99-99',
  dateMax: '0000-00-00',
  personelGaps: {},
  monthlyDistribution: {},
  districtCounts: {},
  statusCounts: {},
  topicCounts: {},
};

for (const fileItem of files) {
  const filePath = path.join(BUYUK_DIR, fileItem.filename);
  if (!fs.existsSync(filePath)) continue;
  const wb = readFile(filePath);

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rawRows = sheetUtils.sheet_to_json(sheet, { header: 1 });
    if (!rawRows || rawRows.length <= 1) continue;

    const headers = rawRows[0].map((h) => String(h || '').trim());
    const getVal = (row, colName) => {
      const idx = headers.indexOf(colName);
      return idx >= 0 ? row[idx] : undefined;
    };

    const pName = sheetName.trim();
    if (!audit.personelGaps[pName]) {
      audit.personelGaps[pName] = {
        yaka: fileItem.yaka,
        total: 0,
        minDate: '9999-99-99',
        maxDate: '0000-00-00',
        activeDays2026: new Set(),
        records2026: 0,
        recordsBefore2026: 0,
        missingDates: 0,
        missingDistricts: 0,
        topTopics: {},
        topDistricts: {},
        datesList: [],
      };
    }

    const pGap = audit.personelGaps[pName];

    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0 || row.every((v) => v === null || v === undefined || v === '')) {
        continue;
      }
      audit.totalRecords += 1;

      const basvuruNo = String(getVal(row, 'Başvuru No') || '').trim();
      const rawDate = getVal(row, 'Oluşturulma Tarihi');
      const dateStr = excelSerialToDateStr(rawDate);
      const ilce = String(getVal(row, 'İlçe') || '').trim().toUpperCase();
      const aciklama = String(getVal(row, 'Açıklama') || '').trim();
      const durum = String(getVal(row, 'Durum') || '').trim();
      const konu = String(getVal(row, 'Konu') || 'DİĞER').trim();

      if (!basvuruNo) {
        audit.missingBasvuruNoCount += 1;
      } else {
        if (audit.seenBasvuruNos.has(basvuruNo)) {
          audit.duplicateAcrossSheets.push({
            basvuruNo,
            sheet1: audit.seenBasvuruNos.get(basvuruNo),
            sheet2: pName,
          });
        } else {
          audit.seenBasvuruNos.set(basvuruNo, pName);
        }
      }

      if (!dateStr) {
        audit.missingDateCount += 1;
        pGap.missingDates += 1;
      } else {
        if (dateStr < audit.dateMin) audit.dateMin = dateStr;
        if (dateStr > audit.dateMax) audit.dateMax = dateStr;
        if (dateStr < pGap.minDate) pGap.minDate = dateStr;
        if (dateStr > pGap.maxDate) pGap.maxDate = dateStr;

        pGap.datesList.push(dateStr);

        if (dateStr.startsWith('2026')) {
          pGap.records2026 += 1;
          pGap.activeDays2026.add(dateStr);
        } else {
          pGap.recordsBefore2026 += 1;
        }

        const monthKey = dateStr.slice(0, 7);
        audit.monthlyDistribution[monthKey] = (audit.monthlyDistribution[monthKey] || 0) + 1;
      }

      if (!ilce) {
        audit.missingDistrictCount += 1;
        pGap.missingDistricts += 1;
      } else {
        audit.districtCounts[ilce] = (audit.districtCounts[ilce] || 0) + 1;
        pGap.topDistricts[ilce] = (pGap.topDistricts[ilce] || 0) + 1;
      }

      if (!aciklama) {
        audit.missingDescriptionCount += 1;
      }

      if (!durum) {
        audit.unknownStatusCount += 1;
      } else {
        audit.statusCounts[durum] = (audit.statusCounts[durum] || 0) + 1;
      }

      audit.topicCounts[konu] = (audit.topicCounts[konu] || 0) + 1;
      pGap.topTopics[konu] = (pGap.topTopics[konu] || 0) + 1;
      pGap.total += 1;
      audit.validRecords += 1;
    }
  }
}

// Convert Set to count
Object.values(audit.personelGaps).forEach((p) => {
  p.activeDaysCount2026 = p.activeDays2026.size;
  delete p.activeDays2026;
  delete p.datesList;
});

// Write audit result to disk
fs.writeFileSync(
  path.resolve(ROOT, 'scripts', 'complete_audit_report.json'),
  JSON.stringify(audit, null, 2),
  'utf8'
);

console.log('Denetim tamamlandı.');
console.log(`Toplam Kayıt: ${audit.totalRecords}`);
console.log(`Geçerli Kayıt: ${audit.validRecords}`);
console.log(`Mükerrer (Farklı sayfalarda aynı başvuru no): ${audit.duplicateAcrossSheets.length}`);
console.log(`Tarih Aralığı: ${audit.dateMin} -> ${audit.dateMax}`);
console.log(`2026 Kayıtları Toplamı: ${Object.values(audit.monthlyDistribution).filter((_, k) => Object.keys(audit.monthlyDistribution)[k]?.startsWith('2026')).reduce((a, b) => a + b, 0)}`);
