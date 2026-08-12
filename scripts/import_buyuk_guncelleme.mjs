/**
 * scripts/import_buyuk_guncelleme.mjs
 *
 * Buyuk_guncelleme klasöründeki güncel (Ağustos 2026) verileri okuyup Firestore'a yazar.
 * Kullanım:
 *   node scripts/import_buyuk_guncelleme.mjs --dry-run
 *   node scripts/import_buyuk_guncelleme.mjs --apply
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
import { getPersonelBasvuruDocId, normalizePersonelKey } from '../src/utils/personelBasvuru.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUYUK_DIR = path.resolve(ROOT, 'Buyuk_guncelleme');

const APPLY_MODE = process.argv.includes('--apply');
const DRY_RUN = !APPLY_MODE || process.argv.includes('--dry-run');

const readFile = XLSX.readFile || XLSX.default?.readFile;
const sheetUtils = XLSX.utils || XLSX.default?.utils;

const BATCH_LIMIT = 400;

function excelSerialToIsoDate(serial) {
  if (typeof serial === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(serial.trim())) {
    return serial.trim();
  }
  const num = Number(serial);
  if (isNaN(num) || num <= 0) return null;
  // Excel epoch offset
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

// ─── 1. MEYDAN MASTER DATA PARSING ───
function loadMeydanMasterData() {
  const masterJsonPath = path.join(BUYUK_DIR, 'master_meydan_data.json');
  let masterList = [];
  if (fs.existsSync(masterJsonPath)) {
    masterList = JSON.parse(fs.readFileSync(masterJsonPath, 'utf8'));
  }

  const bolgePath = path.join(BUYUK_DIR, 'TÜM LİSTE(PİLOTLU)-MEYDAN YÖNETİMİ BÖLGE DAĞILIM ÇALIŞMASI.xlsx');
  const contactsByMeydanName = new Map();
  if (fs.existsSync(bolgePath)) {
    const wb = readFile(bolgePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = sheetUtils.sheet_to_json(sheet, { header: 1 });
    // Header is row 1
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[7]) continue;
      const orgSorumlu = r[1] || '';
      const orgIletisim = r[2] || '';
      const genelSorumlu = r[3] || '';
      const genelIletisim = r[4] || '';
      const bolge = r[5] || '';
      const ilce = r[6] || '';
      const meydanAdi = r[7] || '';

      contactsByMeydanName.set(String(meydanAdi).trim().toLowerCase(), {
        orgSorumlu,
        orgIletisim,
        genelSorumlu,
        genelIletisim,
        bolge,
        ilce,
        meydanAdi,
      });
    }
  }

  const meydanMap = new Map();

  for (const item of masterList) {
    const norm = normalizeMeydanInput({
      tamAd: item.header || '',
      kisaAd: item.ilce || '',
      isim: item.header || '',
    });

    if (!norm.valid) continue;

    const key = norm.id;
    const contact = contactsByMeydanName.get(String(item.header || '').trim().toLowerCase()) || {};

    const existing = meydanMap.get(key) || {};

    meydanMap.set(key, {
      id: key,
      isim: norm.isim || existing.isim || item.header,
      tamAd: item.header || norm.tamAd || existing.tamAd,
      ilce: item.ilce || existing.ilce || '',
      bolge: item.bolge || contact.bolge || existing.bolge || '',
      yapimYili: item.yapim_yili || existing.yapimYili || '',
      ilgiliMudurluk: item.mudurl || existing.ilgiliMudurluk || '',
      fonksiyonlar: Array.isArray(item.fonksiyonlar) ? item.fonksiyonlar : existing.fonksiyonlar || [],
      aciklama: item.aciklama || existing.aciklama || '',
      alanM2: item.alan_m2 || existing.alanM2 || '',
      m2Source: item.m2_source || existing.m2Source || '',
      organizasyonSorumlusu: contact.orgSorumlu || existing.organizasyonSorumlusu || '',
      organizasyonIletisim: contact.orgIletisim || existing.organizasyonIletisim || '',
      genelAlanSorumlusu: contact.genelSorumlu || existing.genelAlanSorumlusu || '',
      genelAlanIletisim: contact.genelIletisim || existing.genelAlanIletisim || '',
      images: Array.isArray(item.images) ? item.images.map(img => img.filename || img) : (existing.images || []),
      updatedAt: new Date().toISOString(),
    });
  }

  return meydanMap;
}

// ─── 2. VARDIYA DATA PARSING ───
function loadShiftData(validMeydanIds) {
  const shiftFiles = fs.readdirSync(BUYUK_DIR).filter(f => f.startsWith('Saha Çalışma Programı') && f.endsWith('.xlsx'));
  const shiftList = [];
  const seenKeys = new Set();

  for (const file of shiftFiles) {
    const filePath = path.join(BUYUK_DIR, file);
    const wb = readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = sheetUtils.sheet_to_json(sheet, { header: 1 });

    let currentPersonel = '';
    let currentTelefon = '';
    let currentBolge = '';

    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r[0] === undefined || r[0] === null) continue;

      if (r[1] && String(r[1]).trim()) {
        currentPersonel = String(r[1]).trim();
        currentTelefon = String(r[2] || '').trim();
        currentBolge = String(r[3] || '').trim();
      }

      const rawTarih = r[0];
      const isoTarih = excelSerialToIsoDate(rawTarih);
      if (!isoTarih) continue;
      if (!currentPersonel) continue;

      const lokasyonRaw = String(r[4] || '').trim();
      if (!lokasyonRaw || lokasyonRaw === 'Yİ' || lokasyonRaw === 'OFF' || lokasyonRaw === 'İZİNLİ') {
        continue;
      }

      // Split multi-locations
      const locParts = lokasyonRaw.split(/[-,\n]/).map(s => s.trim()).filter(Boolean);

      for (const locPart of locParts) {
        const norm = normalizeMeydanInput({ tamAd: locPart, kisaAd: locPart, isim: locPart });
        if (!norm.valid) continue;

        const key = `${currentPersonel}_${isoTarih}_${norm.id}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        shiftList.push({
          personelAdi: currentPersonel,
          telefon: currentTelefon,
          bolge: currentBolge,
          meydanId: norm.id,
          tarih: isoTarih,
          saatAraligi: '09:00-17:00',
          vardiyaTipi: 'Gunduz',
          lokasyonRaw,
          canonicalMeydan: norm,
        });
      }
    }
  }

  return shiftList;
}

// ─── 3. PERSONEL BASVURU OZETLERI PARSING ───
function loadPersonelBasvuruOzetleri() {
  const personelFiles = [
    'PERSONEL VERİLER.xlsx',
    'AVRUPA YAKASI PERSONEL VERİLER 2026 .xlsx',
    'ANADOLU YAKASI VERİLER.xlsx'
  ];

  const summaryMap = new Map();

  for (const filename of personelFiles) {
    const filePath = path.join(BUYUK_DIR, filename);
    if (!fs.existsSync(filePath)) continue;

    const wb = readFile(filePath);
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows = sheetUtils.sheet_to_json(sheet, { header: 1 });
      if (rows.length < 3) continue;

      // Detect column indices
      const headerRow = rows[1] || rows[0];
      const nameCol = headerRow.findIndex(c => String(c).includes('PERSONEL') || String(c).includes('AD'));
      if (nameCol === -1) continue;

      for (let i = 2; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[nameCol]) continue;
        const personelAdi = String(r[nameCol]).trim();
        if (!personelAdi || personelAdi.includes('TOPLAM')) continue;

        const docId = getPersonelBasvuruDocId(personelAdi);
        const normalizedAd = normalizePersonelKey(personelAdi);

        // Calculate totals
        const totalIletilenVal = Number(r[r.length - 2] || r[8] || 0) || 0;
        const totalCozumVal = Number(r[r.length - 1] || r[9] || 0) || 0;

        summaryMap.set(docId, {
          docId,
          personelAdi,
          normalizedAd,
          toplamIletilen: totalIletilenVal,
          toplamCozum: totalCozumVal,
          toplamKayit: totalCozumVal || totalIletilenVal,
          periodKey: '2026_q1_q3',
          periodLabel: 'Ocak-Ağustos 2026',
        });
      }
    }
  }

  return summaryMap;
}

// ─── MAIN EXECUTION ───
async function main() {
  console.log('==================================================');
  console.log(`IMPORT BÜYÜK GÜNCELLEME - MODE: ${DRY_RUN ? 'DRY-RUN (Simülasyon)' : 'APPLY (Canlı Yazma)'}`);
  console.log('==================================================\n');

  console.log('1. Meydan Master verileri işleniyor...');
  const meydanMap = loadMeydanMasterData();
  console.log(`   -> Toplam ${meydanMap.size} geçerli meydan kaydı hazırlandı.`);

  console.log('\n2. Vardiya verileri işleniyor...');
  const validMeydanIds = new Set(meydanMap.keys());
  const shiftList = loadShiftData(validMeydanIds);
  console.log(`   -> Toplam ${shiftList.length} Ağustos 2026 vardiya kaydı hazırlandı.`);

  console.log('\n3. Personel başvuru özetleri işleniyor...');
  const personelMap = loadPersonelBasvuruOzetleri();
  console.log(`   -> Toplam ${personelMap.size} personel özet kaydı hazırlandı.`);

  if (DRY_RUN) {
    console.log('\n[DRY-RUN] Veriler doğrulandı. Canlı veritabanına yazmak için:');
    console.log('   node scripts/import_buyuk_guncelleme.mjs --apply');
    return;
  }

  // Live write to Firestore
  console.log('\nFirestore bağlantısı kuruluyor...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInAnonymously(auth);
  console.log('Anonim giriş başarılı.');

  // 1. Write Meydanlar
  console.log(`\nFirestore 'meydanlar' koleksiyonuna ${meydanMap.size} kayıt yazılıyor...`);
  const meydanEntries = Array.from(meydanMap.entries());
  const meydanChunks = splitIntoChunks(meydanEntries, BATCH_LIMIT);
  for (const chunk of meydanChunks) {
    const batch = writeBatch(db);
    for (const [id, data] of chunk) {
      batch.set(doc(db, 'meydanlar', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
  console.log("   ✓ 'meydanlar' başarıyla güncellendi.");

  // 2. Write Vardiyalar
  console.log(`\nFirestore 'vardiyalar' koleksiyonuna ${shiftList.length} kayıt yazılıyor...`);
  const shiftChunks = splitIntoChunks(shiftList, BATCH_LIMIT);
  for (const chunk of shiftChunks) {
    const batch = writeBatch(db);
    for (const shift of chunk) {
      batch.set(doc(collection(db, 'vardiyalar')), {
        ...shift,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
  console.log("   ✓ 'vardiyalar' başarıyla yazıldı.");

  // 3. Write Personel Özetleri
  console.log(`\nFirestore 'personelBasvuruOzetleri' koleksiyonuna ${personelMap.size} kayıt yazılıyor...`);
  const personelEntries = Array.from(personelMap.values());
  const personelChunks = splitIntoChunks(personelEntries, BATCH_LIMIT);
  for (const chunk of personelChunks) {
    const batch = writeBatch(db);
    for (const p of chunk) {
      batch.set(doc(db, 'personelBasvuruOzetleri', p.docId), {
        ...p,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
  console.log("   ✓ 'personelBasvuruOzetleri' başarıyla güncellendi.");

  console.log('\n==================================================');
  console.log('BÜYÜK GÜNCELLEME İŞLEMİ BAŞARIYLA TAMAMLANDI!');
  console.log('==================================================');
}

main().catch((err) => {
  console.error('Hata oluştu:', err);
  process.exit(1);
});
