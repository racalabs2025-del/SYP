/**
 * scripts/import_eylul_2026_vardiyalar.mjs
 *
 * Imports Eylül 2026 shifts from:
 * Buyuk_guncelleme/08.09.26_guncel_vardiyalar/AVRUPA EYLÜL.xlsx
 * Buyuk_guncelleme/08.09.26_guncel_vardiyalar/EYLÜL ANADOLU.xlsx
 *
 * Rules:
 * 1. Name normalization:
 *    - 'CANER DİLİ' -> 'CANER DİŞLİ'
 *    - 'ŞÜKRÜ KIDIL' -> 'ŞÜKRÜ KİDİL'
 *    - 'İBRAHİM SÜREK' -> 'İBRAHİM SİREK'
 * 2. Leaves ('HT', 'YI', 'Yİ', 'R', 'Mİ', etc.):
 *    - isLeave: true, meydanId: null, saatAraligi: '00:00-00:00'
 *    - Synced to 'personelIzinler' collection
 * 3. 'Diğer Meydan' / Saha Harici:
 *    - 'Terminal Meydanı' -> meydanId: 'diger', isSahaHarici: true, excluded from canonical meydan coverage
 * 4. Deterministic Doc IDs:
 *    - shift_${tarih}_${safeName} to guarantee zero duplicates on re-runs.
 */

import fs from 'fs';
import path from 'path';
import url from 'url';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getFirestore, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { normalizeMeydanInput } from '../src/utils/meydanNormalization.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VARD_DIR = path.resolve(ROOT, 'Buyuk_guncelleme', '08.09.26_guncel_vardiyalar');

const DRY_RUN = process.argv.includes('--dry-run') && !process.argv.includes('--apply');

const NAME_OVERRIDES = {
  'CANER DİLİ': 'CANER DİŞLİ',
  'ŞÜKRÜ KIDIL': 'ŞÜKRÜ KİDİL',
  'İBRAHİM SÜREK': 'İBRAHİM SİREK',
};

const LEAVE_MAPPINGS = {
  'HT': 'Hafta Tatili',
  'Yİ': 'Yıllık İzin',
  'YI': 'Yıllık İzin',
  'R': 'Raporlu',
  'RT': 'Resmi Tatil',
  'Mİ': 'Mazeret İzni',
  'MI': 'Mazeret İzni',
  'ÇALIŞTAY': 'Çalıştay',
  'CALISTAY': 'Çalıştay',
  'OFİS': 'Ofis',
  'OFIS': 'Ofis',
};

function normalizePersonelName(raw) {
  const clean = String(raw || '').trim();
  return NAME_OVERRIDES[clean] || clean;
}

function detectShiftHours(rawText) {
  const upper = String(rawText || '').toUpperCase();
  if (upper.includes('SABAH')) {
    return '08:30-17:00';
  }
  if (upper.includes('AKŞAM') || upper.includes('AKSAM')) {
    return '11:30-20:00';
  }
  return '10:00-18:30';
}

function parseShiftEntry(rawText) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) {
    return null;
  }

  const upper = trimmed.toUpperCase();

  // Check simple leave tokens
  if (LEAVE_MAPPINGS[upper]) {
    return {
      isLeave: true,
      isSahaHarici: true,
      vardiyaTipi: LEAVE_MAPPINGS[upper],
      saatAraligi: '00:00-00:00',
      meydanId: null,
      rawLocation: trimmed,
    };
  }

  // Check 'Terminal Meydanı' (Diğer alan / Saha Harici)
  if (upper.includes('TERMINAL')) {
    return {
      isLeave: false,
      isSahaHarici: true,
      vardiyaTipi: 'Diğer Görev (Terminal)',
      saatAraligi: '10:00-18:30',
      meydanId: 'diger',
      rawLocation: trimmed,
    };
  }

  const hours = detectShiftHours(trimmed);
  const normalized = normalizeMeydanInput({ tamAd: trimmed });
  const meydanId = normalized?.id || 'diger';

  return {
    isLeave: false,
    isSahaHarici: false,
    vardiyaTipi: hours === '08:30-17:00' ? 'Sabah' : hours === '11:30-20:00' ? 'Akşam' : 'Tam Gün',
    saatAraligi: hours,
    meydanId: meydanId,
    rawLocation: trimmed,
  };
}

function parseExcelFile(filePath, yaka) {
  const readFile = XLSX.readFile || XLSX.default?.readFile;
  const sheetUtils = XLSX.utils || XLSX.default?.utils;

  const wb = readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = sheetUtils.sheet_to_json(ws, { header: 1 });

  if (!rawRows || rawRows.length < 3) {
    throw new Error(`Geçersiz dosya yapısı: ${filePath}`);
  }

  const rowDates = rawRows[0];
  const dates = [];

  for (let c = 1; c < rowDates.length; c++) {
    const val = rowDates[c];
    if (!val) continue;

    let dateStr = '';
    if (typeof val === 'number') {
      const msPerDay = 86400000;
      const epoch = new Date(1899, 11, 30).getTime();
      const d = new Date(epoch + val * msPerDay);
      dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (val instanceof Date) {
      dateStr = `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}-${String(val.getDate()).padStart(2, '0')}`;
    } else {
      const s = String(val).trim();
      const match = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (match) {
        dateStr = `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
      } else {
        dateStr = s.slice(0, 10);
      }
    }
    dates.push({ colIndex: c, date: dateStr });
  }

  const records = [];

  for (let r = 2; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !row[0]) continue;

    const rawName = String(row[0]).trim();
    const cleanName = normalizePersonelName(rawName);

    for (const { colIndex, date } of dates) {
      const rawCell = row[colIndex];
      const parsed = parseShiftEntry(rawCell);
      if (!parsed) continue;

      records.push({
        personelAdi: cleanName,
        rawPersonelAdi: rawName,
        tarih: date,
        yaka: yaka,
        ...parsed,
      });
    }
  }

  return records;
}

async function run() {
  console.log('=== EYLÜL 2026 VARDİYA İÇE AKTARIM SİSTEMİ ===\n');

  const avrupaFile = path.join(VARD_DIR, 'AVRUPA EYLÜL.xlsx');
  const anadoluFile = path.join(VARD_DIR, 'EYLÜL ANADOLU.xlsx');

  if (!fs.existsSync(avrupaFile) || !fs.existsSync(anadoluFile)) {
    throw new Error('Eylül vardiya Excel dosyaları klasörde bulunamadı!');
  }

  console.log('Dosyalar okunuyor...');
  const avrupaRecords = parseExcelFile(avrupaFile, 'avrupa');
  const anadoluRecords = parseExcelFile(anadoluFile, 'anadolu');
  const allRecords = [...avrupaRecords, ...anadoluRecords];

  console.log(`- Avrupa Kayıt Sayısı: ${avrupaRecords.length} (Beklenen: 17 * 30 = 510)`);
  console.log(`- Anadolu Kayıt Sayısı: ${anadoluRecords.length} (Beklenen: 18 * 30 = 540)`);
  console.log(`- Toplam Kayıt Sayısı: ${allRecords.length} (Beklenen: 1050)`);

  const activeMeydanShifts = allRecords.filter(r => !r.isLeave && !r.isSahaHarici);
  const terminalShifts = allRecords.filter(r => r.isSahaHarici && !r.isLeave);
  const leaveShifts = allRecords.filter(r => r.isLeave);

  console.log(`\nDağılım Özeti:`);
  console.log(`  * Standart Saha Meydan Vardiyaları: ${activeMeydanShifts.length}`);
  console.log(`  * Diğer Alan (Terminal Meydanı): ${terminalShifts.length}`);
  console.log(`  * İzin / Rapor / Tatil Kayıtları: ${leaveShifts.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY-RUN]: Veriler başarıyla hazırlandı. Firestore yazımı için --apply ekleyin.');
    process.exit(0);
  }

  console.log('\nFirestore bağlantısı başlatılıyor...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInAnonymously(auth);

  const vardiyalarCol = collection(db, 'vardiyalar');
  const personelIzinlerCol = collection(db, 'personelIzinler');

  console.log('Vardiyalar Firestore koleksiyonlarına yazılıyor (Toplu Batch)...');

  let batch = writeBatch(db);
  let batchCount = 0;
  let totalWritten = 0;

  for (const record of allRecords) {
    // Generate deterministic safe doc ID
    const safeName = record.personelAdi.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const safeDate = record.tarih;
    const docId = `shift_${safeDate}_${safeName}`;

    const docRef = doc(vardiyalarCol, docId);
    batch.set(
      docRef,
      {
        personelAdi: record.personelAdi,
        rawPersonelAdi: record.rawPersonelAdi,
        tarih: record.tarih,
        yaka: record.yaka,
        vardiyaTipi: record.vardiyaTipi,
        saatAraligi: record.saatAraligi,
        meydanId: record.meydanId,
        rawLocation: record.rawLocation,
        isLeave: record.isLeave,
        isSahaHarici: record.isSahaHarici,
        kaynak: 'guncel_eylul_2026_excel',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    batchCount += 1;
    totalWritten += 1;

    // If leave, also sync to personelIzinler
    if (record.isLeave) {
      const leaveDocId = `leave_${safeDate}_${safeName}`;
      const leaveRef = doc(personelIzinlerCol, leaveDocId);
      batch.set(
        leaveRef,
        {
          personelAdi: record.personelAdi,
          tarih: record.tarih,
          izinTuru: record.vardiyaTipi,
          aciklama: record.rawLocation,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      batchCount += 1;
    }

    if (batchCount >= 400) {
      await batch.commit();
      console.log(`-> ${totalWritten} vardiya kaydedildi...`);
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\n🎉 BAŞARILI: Toplam ${totalWritten} vardiya kaydı Firestore'a eksiksiz yazıldı!`);
  process.exit(0);
}

run().catch((err) => {
  console.error('HATA:', err);
  process.exit(1);
});
