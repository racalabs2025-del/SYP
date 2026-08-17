/**
 * scripts/decision_support_preflight.mjs
 *
 * 100% READ-ONLY Pre-Flight Analysis for Executive Decision Support System.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { normalizePersonelKey } from '../src/utils/personelBasvuru.js';

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

async function run() {
  console.log('=== YÖNETİCİ KARAR DESTEK PRE-FLIGHT ANALİZİ ===\n');

  const files = ['ANADOLU YAKASI.xlsx', 'AVRUPA YAKASI.xlsx'];
  const uniqueMap = new Map();
  const allHeadersFound = new Set();

  for (const f of files) {
    const fPath = path.join(BUYUK_DIR, f);
    const wb = readFile(fPath);
    for (const s of wb.SheetNames) {
      const rows = sheetUtils.sheet_to_json(wb.Sheets[s], { header: 1 });
      if (!rows || rows.length <= 1) continue;
      const headers = rows[0].map(h => String(h || '').trim());
      headers.forEach(h => allHeadersFound.add(h));

      const getVal = (r, col) => {
        const idx = headers.indexOf(col);
        return idx >= 0 ? r[idx] : undefined;
      };

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || r.every(v => v === null || v === undefined || v === '')) continue;
        const basvuruNo = String(getVal(r, 'Başvuru No') || '').trim();
        if (!basvuruNo) continue;

        const docId = basvuruNo.replace(/[^a-zA-Z0-9-]/g, '-');
        if (!uniqueMap.has(docId)) {
          uniqueMap.set(docId, {
            basvuruNo,
            tarih: excelSerialToDateStr(getVal(r, 'Oluşturulma Tarihi')),
            taahhutTarihi: excelSerialToDateStr(getVal(r, 'Taahhüt Tarihi')),
            kapanisTarihi: excelSerialToDateStr(getVal(r, 'Kapanış Tarihi') || getVal(r, 'Kapanma Tarihi') || getVal(r, 'Son İşlem Tarihi')),
            durum: String(getVal(r, 'Durum') || '').trim(),
            altDurum: String(getVal(r, 'Alt Durum') || '').trim(),
            onemDerecesi: String(getVal(r, 'Önem Derecesi') || '').trim(),
            konu: String(getVal(r, 'Konu') || '').trim(),
            altKonu: String(getVal(r, 'Alt Konu') || '').trim(),
            ilce: String(getVal(r, 'İlçe') || '').trim().toUpperCase(),
            aciklama: String(getVal(r, 'Açıklama') || '').trim(),
            personel: s.trim(),
          });
        }
      }
    }
  }

  console.log(`Toplam Unique Başvuru: ${uniqueMap.size}`);
  console.log('Excel Tablolarında Bulunan Tüm Başlıklar:', Array.from(allHeadersFound));

  // 1. Durum Dağılımı
  const durumCounts = {};
  for (const item of uniqueMap.values()) {
    const d = item.durum || 'BOŞ';
    durumCounts[d] = (durumCounts[d] || 0) + 1;
  }
  console.log('\n1. Durum Dağılımı:');
  console.table(durumCounts);

  // 2. Önem Derecesi Dağılımı
  const onemCounts = {};
  for (const item of uniqueMap.values()) {
    const o = item.onemDerecesi || 'BOŞ';
    onemCounts[o] = (onemCounts[o] || 0) + 1;
  }
  console.log('\n2. Önem Derecesi Dağılımı:');
  console.table(onemCounts);

  // 3. Tarih ve Taahhüt Analizi
  let hasTaahhutCount = 0;
  let hasKapanisCount = 0;
  let taahhutAşanCount = 0; // if taahhutTarihi < reference date and durum != 'Kapandı'
  const refDate = '2026-08-14'; // snapshot date

  for (const item of uniqueMap.values()) {
    if (item.taahhutTarihi) hasTaahhutCount++;
    if (item.kapanisTarihi) hasKapanisCount++;
    if (item.durum !== 'Kapandı' && item.taahhutTarihi && item.taahhutTarihi < refDate) {
      taahhutAşanCount++;
    }
  }
  console.log('\n3. Tarih Alanları Varlığı:');
  console.log(`- Taahhüt Tarihi Olan Kayıt: ${hasTaahhutCount} / ${uniqueMap.size}`);
  console.log(`- Kapanış Tarihi Olan Kayıt: ${hasKapanisCount} / ${uniqueMap.size} (Gerçek Kapanış Tarihi kolonu bulunmamaktadır!)`);
  console.log(`- Taahhüt Tarihini Aşmış Açık Kayıt (14 Ağustos 2026 itibarıyla): ${taahhutAşanCount}`);

  // 4. Geciken / Açık İşlerin Yaşlandırma (Aging) Analizi (14 Ağustos 2026 referans alınarak)
  const openItems = Array.from(uniqueMap.values()).filter(i => i.durum !== 'Kapandı');
  console.log(`\nToplam Açık/Süreçteki Kayıt Sayısı: ${openItems.length}`);

  const agingBuckets = {
    '0 - 3 gün': 0,
    '4 - 7 gün': 0,
    '8 - 14 gün': 0,
    '15 - 30 gün': 0,
    '31 - 90 gün': 0,
    '90+ gün': 0,
  };

  for (const item of openItems) {
    if (!item.tarih) continue;
    const diffMs = new Date(refDate).getTime() - new Date(item.tarih).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) agingBuckets['0 - 3 gün']++;
    else if (diffDays <= 7) agingBuckets['4 - 7 gün']++;
    else if (diffDays <= 14) agingBuckets['8 - 14 gün']++;
    else if (diffDays <= 30) agingBuckets['15 - 30 gün']++;
    else if (diffDays <= 90) agingBuckets['31 - 90 gün']++;
    else agingBuckets['90+ gün']++;
  }
  console.log('\nAçık/Süreçteki Kayıtların Yaşlandırma (Aging) Dağılımı:');
  console.table(agingBuckets);

  // 5. İlçe Bazlı Açık / Toplam ve Risk Göstergeleri
  const ilceStats = {};
  for (const item of uniqueMap.values()) {
    const ilce = item.ilce || 'DİĞER';
    if (!ilceStats[ilce]) {
      ilceStats[ilce] = { toplam: 0, kapandi: 0, acik: 0, planlama: 0, son30Gun: 0, onemliAcik: 0 };
    }
    const s = ilceStats[ilce];
    s.toplam++;
    if (item.durum === 'Kapandı') s.kapandi++;
    else if (item.durum === 'Planlama') s.planlama++;
    else s.acik++;

    if (item.tarih && item.tarih >= '2026-07-15') s.son30Gun++;
    if (item.durum !== 'Kapandı' && (item.onemDerecesi.includes('1') || item.onemDerecesi.includes('2'))) {
      s.onemliAcik++;
    }
  }

  // Save analysis to scratch JSON
  fs.writeFileSync(
    path.join(ROOT, 'scripts', 'decision_support_preflight_data.json'),
    JSON.stringify({
      totalUnique: uniqueMap.size,
      allHeaders: Array.from(allHeadersFound),
      durumCounts,
      onemCounts,
      hasTaahhutCount,
      hasKapanisCount,
      taahhutAşanCount,
      openItemsCount: openItems.length,
      agingBuckets,
      ilceStats
    }, null, 2),
    'utf8'
  );

  console.log('\nAnaliz tamamlandı. scripts/decision_support_preflight_data.json dosyasına yazıldı.');
  process.exit(0);
}

run().catch(console.error);
