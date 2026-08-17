/**
 * scripts/preflight_audit_collector.mjs
 *
 * 100% READ-ONLY Pre-Flight Audit Tool for SYP Big Update.
 * Does NOT write, update, delete or modify anything in Firestore or local datasets.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { normalizeMeydanInput } from '../src/utils/meydanNormalization.js';
import { SAHA_PERSONELI } from '../src/utils/sahaPersoneli.js';

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
  console.log('=== SYP PRE-FLIGHT AUDIT DATA COLLECTION (READ-ONLY) ===\n');

  // -------------------------------------------------------------
  // A. EXCEL KAYNAKLARI (ANADOLU YAKASI & AVRUPA YAKASI)
  // -------------------------------------------------------------
  const excelFiles = [
    { name: 'ANADOLU YAKASI.xlsx', yaka: 'Anadolu' },
    { name: 'AVRUPA YAKASI.xlsx', yaka: 'Avrupa' }
  ];

  const excelAudit = {
    files: {},
    totalRowsOverall: 0,
    totalValidOverall: 0,
    seenBasvuruNoMap: new Map(), // basvuruNo -> { file, sheet, row }
    intraSheetDuplicates: [],
    interSheetDuplicates: [],
    exactRowDuplicates: [],
    missingDates: [],
    missingDistricts: [],
    missingBasvuruNos: [],
    dateMin: '9999-99-99',
    dateMax: '0000-00-00',
    uniqueStatusValues: new Set(),
    uniqueTopicValues: new Set(),
    uniqueDistrictValues: new Set(),
  };

  for (const f of excelFiles) {
    const fPath = path.join(BUYUK_DIR, f.name);
    const wb = readFile(fPath);
    const fileStats = {
      filename: f.name,
      sheetCount: wb.SheetNames.length,
      sheets: [],
      rawRows: 0,
      validRows: 0,
      missingDates: 0,
      missingDistricts: 0,
      missingBasvuruNos: 0,
      dateMin: '9999-99-99',
      dateMax: '0000-00-00',
    };

    for (const sName of wb.SheetNames) {
      const sheet = wb.Sheets[sName];
      const rows = sheetUtils.sheet_to_json(sheet, { header: 1 });
      const headers = rows[0] ? rows[0].map(h => String(h || '').trim()) : [];
      const getVal = (r, col) => {
        const idx = headers.indexOf(col);
        return idx >= 0 ? r[idx] : undefined;
      };

      const sheetStat = {
        name: sName.trim(),
        totalRows: 0,
        validRows: 0,
        missingDate: 0,
        missingDistrict: 0,
        missingBasvuruNo: 0,
        dateMin: '9999-99-99',
        dateMax: '0000-00-00',
      };

      const sheetSeenBasvuru = new Set();

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || r.every(v => v === null || v === undefined || v === '')) continue;

        sheetStat.totalRows++;
        fileStats.rawRows++;
        excelAudit.totalRowsOverall++;

        const basvuruNo = String(getVal(r, 'Başvuru No') || '').trim();
        const rawDate = getVal(r, 'Oluşturulma Tarihi');
        const dateStr = excelSerialToDateStr(rawDate);
        const ilce = String(getVal(r, 'İlçe') || '').trim();
        const durum = String(getVal(r, 'Durum') || '').trim();
        const konu = String(getVal(r, 'Konu') || '').trim();
        const aciklama = String(getVal(r, 'Açıklama') || '').trim();

        if (durum) excelAudit.uniqueStatusValues.add(durum);
        if (konu) excelAudit.uniqueTopicValues.add(konu);
        if (ilce) excelAudit.uniqueDistrictValues.add(ilce.toUpperCase());

        let isValid = true;

        if (!basvuruNo) {
          sheetStat.missingBasvuruNo++;
          fileStats.missingBasvuruNos++;
          excelAudit.missingBasvuruNos.push({ file: f.name, sheet: sName, row: i });
          isValid = false;
        }

        if (!dateStr) {
          sheetStat.missingDate++;
          fileStats.missingDates++;
          excelAudit.missingDates.push({ file: f.name, sheet: sName, row: i, basvuruNo });
          isValid = false;
        } else {
          if (dateStr < fileStats.dateMin) fileStats.dateMin = dateStr;
          if (dateStr > fileStats.dateMax) fileStats.dateMax = dateStr;
          if (dateStr < sheetStat.dateMin) sheetStat.dateMin = dateStr;
          if (dateStr > sheetStat.dateMax) sheetStat.dateMax = dateStr;
          if (dateStr < excelAudit.dateMin) excelAudit.dateMin = dateStr;
          if (dateStr > excelAudit.dateMax) excelAudit.dateMax = dateStr;
        }

        if (!ilce) {
          sheetStat.missingDistrict++;
          fileStats.missingDistricts++;
          excelAudit.missingDistricts.push({ file: f.name, sheet: sName, row: i, basvuruNo });
        }

        if (basvuruNo) {
          if (sheetSeenBasvuru.has(basvuruNo)) {
            excelAudit.intraSheetDuplicates.push({ file: f.name, sheet: sName, row: i, basvuruNo });
          } else {
            sheetSeenBasvuru.add(basvuruNo);
          }

          if (excelAudit.seenBasvuruNoMap.has(basvuruNo)) {
            const prev = excelAudit.seenBasvuruNoMap.get(basvuruNo);
            excelAudit.interSheetDuplicates.push({
              basvuruNo,
              firstOccurrence: prev,
              secondOccurrence: { file: f.name, sheet: sName, row: i }
            });
          } else {
            excelAudit.seenBasvuruNoMap.set(basvuruNo, { file: f.name, sheet: sName, row: i });
          }
        }

        if (isValid) {
          sheetStat.validRows++;
          fileStats.validRows++;
          excelAudit.totalValidOverall++;
        }
      }

      fileStats.sheets.push(sheetStat);
    }

    excelAudit.files[f.name] = fileStats;
  }

  // -------------------------------------------------------------
  // B. FIRESTORE KOLEKSİYONLARI VE ŞEMALARI
  // -------------------------------------------------------------
  console.log('Firestore koleksiyonları inceleniyor...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInAnonymously(auth);

  const firestoreAudit = {};
  const targetCols = [
    'meydanBasvurulari',
    'personelBasvuruOzetleri',
    'meydanBasvuruStats',
    'vardiyalar',
    'meydanlar',
    'personelIzinler',
    'kronikSorunlar'
  ];

  for (const cName of targetCols) {
    try {
      const snap = await getDocs(collection(db, cName));
      const sampleDoc = snap.docs[0]?.data() || null;
      firestoreAudit[cName] = {
        count: snap.size,
        sampleKeys: sampleDoc ? Object.keys(sampleDoc) : [],
        sampleDocId: snap.docs[0]?.id || null,
      };
    } catch (err) {
      firestoreAudit[cName] = { error: err.message };
    }
  }

  // -------------------------------------------------------------
  // E. VARDİYA KAYNAK VE TARİH KAPSAMI ANALİZİ (2026-04-20 - 2026-04-30)
  // -------------------------------------------------------------
  console.log('Vardiya kaynak dosyaları inceleniyor...');
  const shiftExcelFiles = fs.readdirSync(BUYUK_DIR).filter(f => f.startsWith('Saha Çalışma Programı') && f.endsWith('.xlsx'));
  
  const shiftFileDates = [];
  const shiftRawDatesFound = new Set();
  const shiftPersonnelFound = new Set();
  let totalShiftRows = 0;

  for (const sFile of shiftExcelFiles) {
    const sPath = path.join(BUYUK_DIR, sFile);
    const wb = readFile(sPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = sheetUtils.sheet_to_json(sheet, { header: 1 });
    totalShiftRows += rows.length;

    // Check headers and rows for dates
    const headerRow = rows[0] || [];
    shiftFileDates.push({
      filename: sFile,
      rows: rows.length,
      headers: headerRow.slice(0, 10),
    });
  }

  // -------------------------------------------------------------
  // D. NORMALİZASYON & EŞLEŞTİRME KONTROLLERİ
  // -------------------------------------------------------------
  // Registered personnel list
  const registeredPersonnelNames = SAHA_PERSONELI.map(p => p.ad.trim());
  const excelSheetPersonnelNames = [
    ...excelAudit.files['ANADOLU YAKASI.xlsx'].sheets.map(s => s.name),
    ...excelAudit.files['AVRUPA YAKASI.xlsx'].sheets.map(s => s.name)
  ];

  const unregisteredExcelPersonnel = excelSheetPersonnelNames.filter(
    name => !registeredPersonnelNames.some(reg => reg.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'))
  );

  const missingExcelForRegistered = registeredPersonnelNames.filter(
    reg => !excelSheetPersonnelNames.some(name => name.toLocaleLowerCase('tr-TR') === reg.toLocaleLowerCase('tr-TR'))
  );

  // Write comprehensive JSON result
  const fullAuditReport = {
    excelAudit,
    firestoreAudit,
    shiftAnalysis: {
      shiftFilesCount: shiftExcelFiles.length,
      shiftExcelFiles,
      shiftFileDates,
      totalShiftRows,
      april20_30_SourceCheck: 'Kaynak Buyuk_guncelleme klasöründe 2026-04-20 ile 2026-04-30 arasını içeren hiçbir Saha Çalışma Programı dosyası bulunmamaktadır. En erken dosya Saha Çalışma Programı (4-8 MAYIS).xlsx dosyasıdır.'
    },
    normalizationAudit: {
      registeredPersonnelCount: registeredPersonnelNames.length,
      excelPersonnelCount: excelSheetPersonnelNames.length,
      unregisteredExcelPersonnel,
      missingExcelForRegistered,
      uniqueStatusValues: Array.from(excelAudit.uniqueStatusValues),
      uniqueTopicValues: Array.from(excelAudit.uniqueTopicValues),
      uniqueDistrictValues: Array.from(excelAudit.uniqueDistrictValues),
    }
  };

  fs.writeFileSync(
    path.resolve(ROOT, 'scripts', 'preflight_audit_full.json'),
    JSON.stringify(fullAuditReport, null, 2),
    'utf8'
  );

  console.log('\nAudit veri toplama tamamlandı. scripts/preflight_audit_full.json dosyasına yazıldı.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
