/**
 * scripts/compile_executive_dataset.mjs
 *
 * Compiles unresolved (open/in progress) and critical applications
 * into a lightweight, fast JSON cache: src/data/compiledExecutiveBasvurular.json
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { computeDecisionSupportMetrics, isOpenOrInProgress, isCriticalApplication } from '../src/utils/decisionSupport.js';
import { normalizePersonelKey } from '../src/utils/personelBasvuru.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');
const DATA_DIR = path.resolve(ROOT, 'src', 'data');

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

function ilceToMeydanId(ilce) {
  if (!ilce) return 'diger';
  return String(ilce)
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function run() {
  console.log('=== YÖNETİCİ VERİ SETİ DERLEMESİ ===\n');

  const files = [
    { filename: 'ANADOLU YAKASI.xlsx', yaka: 'Anadolu' },
    { filename: 'AVRUPA YAKASI.xlsx', yaka: 'Avrupa' },
  ];

  const allUniqueMap = new Map();

  for (const fileItem of files) {
    const fPath = path.join(BUYUK_DIR, fileItem.filename);
    const wb = readFile(fPath);

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rawRows = sheetUtils.sheet_to_json(sheet, { header: 1 });
      if (!rawRows || rawRows.length <= 1) continue;

      const headers = rawRows[0].map(h => String(h || '').trim());
      const getVal = (r, col) => {
        const idx = headers.indexOf(col);
        return idx >= 0 ? r[idx] : undefined;
      };

      const rawPersonelName = sheetName.trim();
      const pKey = normalizePersonelKey(rawPersonelName);

      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0 || row.every(v => v === null || v === undefined || v === '')) continue;

        const basvuruNo = String(getVal(row, 'Başvuru No') || '').trim();
        if (!basvuruNo) continue;

        const docId = basvuruNo.replace(/[^a-zA-Z0-9-]/g, '-');
        const rawDate = getVal(row, 'Oluşturulma Tarihi');
        const rawTaahhut = getVal(row, 'Taahhüt Tarihi');
        const tarih = excelSerialToDateStr(rawDate) || '2026-01-01';
        const taahhutTarihi = excelSerialToDateStr(rawTaahhut) || '';
        const ilce = String(getVal(row, 'İlçe') || '').trim().toUpperCase();
        const mahalle = String(getVal(row, 'Mahalle') || '').trim();
        const durum = String(getVal(row, 'Durum') || 'Kapandı').trim();
        const altDurum = String(getVal(row, 'Alt Durum') || '').trim();
        const onemDerecesi = String(getVal(row, 'Önem Derecesi') || '4-Düşük').trim();
        const konu = String(getVal(row, 'Konu') || 'DİĞER').trim();
        const altKonu = String(getVal(row, 'Alt Konu') || '').trim();
        const aciklama = String(getVal(row, 'Açıklama') || '').trim().slice(0, 1000);
        const birim = String(getVal(row, 'İlişkili Olduğu Birim') || '').trim();

        if (allUniqueMap.has(docId)) {
          const existing = allUniqueMap.get(docId);
          if (!existing.sourcePersonnel.includes(rawPersonelName)) {
            existing.sourcePersonnel.push(rawPersonelName);
          }
          existing.isShared = true;
        } else {
          allUniqueMap.set(docId, {
            docId,
            basvuruNo,
            tarih,
            taahhutTarihi,
            ilce,
            mahalle,
            meydanId: ilceToMeydanId(ilce),
            durum,
            altDurum,
            onemDerecesi,
            konu,
            altKonu,
            aciklama,
            birim,
            personelAdi: rawPersonelName,
            personelKey: pKey,
            yaka: fileItem.yaka,
            sourcePersonnel: [rawPersonelName],
            isShared: false,
          });
        }
      }
    }
  }

  const allApplications = Array.from(allUniqueMap.values());
  const refDate = '2026-08-14';

  const metrics = computeDecisionSupportMetrics(allApplications, refDate);

  console.log('Hesaplanan Karar Destek Metrikleri:');
  console.log(`- Toplam Unique Başvuru: ${metrics.totalUnique}`);
  console.log(`- Kapanmamış Başvuru (Açık + Süreçte): ${metrics.totalUnresolved}`);
  console.log(`- Taahhüdü Aşan (SLA İhlali): ${metrics.totalSlaBreached}`);
  console.log(`- 30+ Gün Yaşlanan: ${metrics.totalAging30Plus}`);
  console.log(`- Kritik Başvuru (2-Yüksek): ${metrics.totalCritical} (Açık Kritik: ${metrics.totalOpenCritical})`);
  console.log('Yaşlandırma Dağılımı:', metrics.agingCounts);

  // Save compiledExecutiveBasvurular.json
  const executiveDataset = {
    metadata: {
      generatedAt: new Date().toISOString(),
      referenceDate: refDate,
      totalUnique: metrics.totalUnique,
      totalClosed: metrics.totalClosed,
      totalInProgress: metrics.totalInProgress,
      totalOpen: metrics.totalOpen,
      totalUnresolved: metrics.totalUnresolved,
      totalSlaBreached: metrics.totalSlaBreached,
      totalAging30Plus: metrics.totalAging30Plus,
      totalCritical: metrics.totalCritical,
      totalOpenCritical: metrics.totalOpenCritical,
      agingBuckets: metrics.agingBuckets,
      topOpenDistricts: metrics.topOpenDistricts,
    },
    unresolvedItems: metrics.openOrInProgressItems,
    slaBreachedItems: metrics.slaBreachedItems,
    criticalItems: metrics.criticalItems,
  };

  fs.writeFileSync(
    path.join(DATA_DIR, 'compiledExecutiveBasvurular.json'),
    JSON.stringify(executiveDataset, null, 2),
    'utf8'
  );

  console.log('\n✓ src/data/compiledExecutiveBasvurular.json dosyası başarıyla üretildi!');
  process.exit(0);
}

run().catch(console.error);
