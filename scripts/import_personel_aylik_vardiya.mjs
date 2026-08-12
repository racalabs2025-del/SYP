/**
 * scripts/import_personel_aylik_vardiya.mjs
 *
 * AVRUPA YAKASI .xlsx ve ANADOLU YAKASI .xlsx dosyalarındaki
 * aylık personel görev takvimlerini Firestore'a vardiya kaydı olarak yazar.
 *
 * Bu dosyalar aylık takvim formatındadır:
 *   Row 0: Tarih serial numaraları (Excel date serial)
 *   Row 1: Gün adları (Pazartesi, Salı vs.) + ADI SOYADI başlığı
 *   Row 2+: Her satır bir personel, her sütun bir gün
 *
 * Hücre değerleri:
 *   - Meydan adı → vardiya kaydı oluştur
 *   - HT, Yİ, Mİ, R, RT, OFF, İZİN, OFİS, Çözüm Noktası → atla
 *
 * Kullanım:
 *   node scripts/import_personel_aylik_vardiya.mjs --dry-run
 *   node scripts/import_personel_aylik_vardiya.mjs --apply
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { normalizeMeydanInput } from '../src/utils/meydanNormalization.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');

const APPLY_MODE = process.argv.includes('--apply');
const DRY_RUN = !APPLY_MODE || process.argv.includes('--dry-run');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;

const BATCH_LIMIT = 400;

// Tokens that indicate NOT a meydan assignment (leave, off, etc.)
const SKIP_TOKENS = new Set([
  'ht', 'h t', 'yi', 'mi', 'r', 'rt', 'off', 'izin', 'izinli',
  'rapor', 'ofis', '-', '', 'cozum noktasi',
]);

function isSkipValue(val) {
  if (!val || typeof val !== 'string') return true;
  const trimmed = val.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
  if (SKIP_TOKENS.has(lower)) return true;
  if (trimmed.length <= 2) return true;
  if (lower.startsWith('cozum')) return true;
  return false;
}

function excelSerialToIsoDate(serial) {
  if (typeof serial === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(serial.trim())) {
    return serial.trim();
  }
  const num = Number(serial);
  if (isNaN(num) || num <= 0) return null;
  const utcDays = Math.floor(num - 25569);
  const utcValue = utcDays * 86400;
  const dateObj = new Date(utcValue * 1000);
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function splitIntoChunks(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function detectShiftHours(cellValue) {
  const upper = String(cellValue || '').toUpperCase();
  if (upper.includes('AKŞAM') || upper.includes('AKSAM')) {
    return '11:30-20:00';
  }
  if (upper.includes('SABAH')) {
    return '08:30-17:00';
  }
  return '10:00-18:30';
}

function extractMeydanIds(cellValue) {
  if (!cellValue || typeof cellValue !== 'string') return [];
  
  const cleaned = cellValue
    .replace(/\(TAM GÜN\)/gi, '')
    .replace(/\(TAMGÜN\)/gi, '')
    .replace(/\(SABAH\)/gi, '')
    .replace(/\(AKŞAM\)/gi, '')
    .replace(/\(AKSAM\)/gi, '')
    .trim();
  
  if (!cleaned) return [];
  
  const fullNorm = normalizeMeydanInput({ tamAd: cleaned, kisaAd: cleaned, isim: cleaned });
  if (fullNorm.valid) {
    return [fullNorm.id];
  }
  
  const parts = cleaned.split('-').map(s => s.trim()).filter(Boolean);
  const ids = new Set();
  
  for (const part of parts) {
    if (isSkipValue(part)) continue;
    const norm = normalizeMeydanInput({ tamAd: part, kisaAd: part, isim: part });
    if (norm.valid) {
      ids.add(norm.id);
    }
  }
  
  return Array.from(ids);
}

function parseMonthlyFiles() {
  const files = [
    { filename: 'AVRUPA YAKASI  .xlsx', yaka: 'Avrupa' },
    { filename: 'ANADOLU YAKASI .xlsx', yaka: 'Anadolu' },
  ];

  const shiftList = [];
  const seenKeys = new Set();
  const stats = {
    totalFiles: 0,
    totalSheets: 0,
    totalPersonnel: 0,
    totalCells: 0,
    skippedCells: 0,
    totalShifts: 0,
    unmatchedLocations: new Map(),
  };

  for (const { filename, yaka } of files) {
    const filePath = path.join(BUYUK_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`  [UYARI] Dosya bulunamadi: ${filename}`);
      continue;
    }

    stats.totalFiles++;
    const wb = readFile(filePath);

    for (const sheetName of wb.SheetNames) {
      stats.totalSheets++;
      const ws = wb.Sheets[sheetName];
      const rows = sheetUtils.sheet_to_json(ws, { header: 1, defval: null });

      if (rows.length < 3) continue;

      const dateRow = rows[0];
      const headerRow = rows[1];

      let nameColIdx = -1;
      let firstDateColIdx = -1;
      
      for (let c = 0; c < headerRow.length; c++) {
        const hdr = String(headerRow[c] || '').trim().toUpperCase();
        if (hdr.includes('ADI') || hdr.includes('SOYADI') || hdr.includes('ISIM')) {
          nameColIdx = c;
          firstDateColIdx = c + 1;
          break;
        }
      }

      if (nameColIdx === -1) {
        nameColIdx = 1;
        firstDateColIdx = 2;
      }

      const colDateMap = new Map();
      for (let c = firstDateColIdx; c < dateRow.length; c++) {
        const serial = dateRow[c];
        if (serial === null || serial === undefined) continue;
        const isoDate = excelSerialToIsoDate(serial);
        if (isoDate) {
          colDateMap.set(c, isoDate);
        }
      }

      console.log(`  [${yaka}] ${sheetName}: ${rows.length - 2} personel, ${colDateMap.size} gun sutunu`);

      for (let rowIdx = 2; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        if (!row) continue;

        const personelAdi = String(row[nameColIdx] || '').trim();
        if (!personelAdi || personelAdi.length < 3) continue;
        if (personelAdi.toUpperCase().includes('SABAH') || personelAdi.toUpperCase().includes('TAM GÜN')) continue;

        stats.totalPersonnel++;

        for (const [colIdx, isoDate] of colDateMap) {
          const cellValue = row[colIdx];
          if (cellValue === null || cellValue === undefined) continue;
          
          const cellStr = String(cellValue).trim();
          stats.totalCells++;

          if (isSkipValue(cellStr)) {
            stats.skippedCells++;
            continue;
          }

          const meydanIds = extractMeydanIds(cellStr);
          if (meydanIds.length === 0) {
            const cleanedForLog = cellStr.substring(0, 60);
            stats.unmatchedLocations.set(cleanedForLog, (stats.unmatchedLocations.get(cleanedForLog) || 0) + 1);
            continue;
          }

          const saatAraligi = detectShiftHours(cellStr);

          for (const meydanId of meydanIds) {
            const key = `${personelAdi}_${isoDate}_${meydanId}`;
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);

            shiftList.push({
              personelAdi,
              meydanId,
              tarih: isoDate,
              saatAraligi,
              vardiyaTipi: 'Gunduz',
              bolge: yaka,
              lokasyonRaw: cellStr,
            });
            stats.totalShifts++;
          }
        }
      }
    }
  }

  return { shiftList, stats };
}

async function main() {
  console.log('==================================================');
  console.log(`PERSONEL AYLIK VARDIYA IMPORT - MODE: ${DRY_RUN ? 'DRY-RUN' : 'APPLY'}`);
  console.log('==================================================\n');

  console.log('1. Aylik personel dosyalari okunuyor...');
  const { shiftList, stats } = parseMonthlyFiles();

  console.log(`\n2. Sonuclar:`);
  console.log(`   Dosya: ${stats.totalFiles}, Sayfa: ${stats.totalSheets}`);
  console.log(`   Personel satiri: ${stats.totalPersonnel}`);
  console.log(`   Hucre: ${stats.totalCells} (${stats.skippedCells} atlandi)`);
  console.log(`   Toplam yeni vardiya: ${stats.totalShifts}`);

  if (stats.unmatchedLocations.size > 0) {
    console.log(`\n   Eslesmyen lokasyonlar (${stats.unmatchedLocations.size} tane):`);
    const sorted = Array.from(stats.unmatchedLocations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    for (const [loc, count] of sorted) {
      console.log(`     [${count}x] ${loc}`);
    }
  }

  const monthBreakdown = {};
  shiftList.forEach(s => {
    const m = s.tarih.substring(0, 7);
    monthBreakdown[m] = (monthBreakdown[m] || 0) + 1;
  });
  console.log('\n   Aylik dagilim:', JSON.stringify(monthBreakdown, null, 2));

  console.log('\n   Ornek kayitlar (HAKAN HAN):');
  const examples = shiftList.filter(s => s.personelAdi === 'HAKAN HAN').slice(0, 10);
  if (examples.length === 0) {
    shiftList.slice(0, 5).forEach(s => console.log(`     ${s.personelAdi} | ${s.tarih} | ${s.meydanId} | ${s.saatAraligi}`));
  } else {
    examples.forEach(s => console.log(`     ${s.personelAdi} | ${s.tarih} | ${s.meydanId} | ${s.saatAraligi}`));
  }

  if (DRY_RUN) {
    console.log('\n[DRY-RUN] Canli yazma icin: node scripts/import_personel_aylik_vardiya.mjs --apply');
    return;
  }

  console.log('\n3. Firestore baglantisi kuruluyor...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInAnonymously(auth);
  console.log('   Anonim giris basarili.');

  console.log('\n4. Mevcut vardiyalar kontrol ediliyor (duplicate onleme)...');
  const existingSnap = await getDocs(collection(db, 'vardiyalar'));
  const existingKeys = new Set();
  existingSnap.docs.forEach(d => {
    const data = d.data();
    if (data.personelAdi && data.tarih && data.meydanId) {
      existingKeys.add(`${data.personelAdi}_${data.tarih}_${data.meydanId}`);
    }
  });
  console.log(`   Mevcut kayit: ${existingSnap.size}, benzersiz anahtar: ${existingKeys.size}`);

  const newShifts = shiftList.filter(s => {
    const key = `${s.personelAdi}_${s.tarih}_${s.meydanId}`;
    return !existingKeys.has(key);
  });
  console.log(`   Yeni yazilacak: ${newShifts.length} (${shiftList.length - newShifts.length} mevcut, atlandi)`);

  if (newShifts.length === 0) {
    console.log('\n   Tum kayitlar zaten mevcut. Yazilacak yeni veri yok.');
    return;
  }

  console.log(`\n5. Firestore'a ${newShifts.length} vardiya yaziliyor...`);
  const chunks = splitIntoChunks(newShifts, BATCH_LIMIT);
  let written = 0;
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const shift of chunk) {
      batch.set(doc(collection(db, 'vardiyalar')), {
        ...shift,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
    written += chunk.length;
    console.log(`   ${written}/${newShifts.length} yazildi...`);
  }

  console.log('\n==================================================');
  console.log(`TAMAMLANDI! ${written} yeni vardiya kaydi eklendi.`);
  console.log('==================================================');
}

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
