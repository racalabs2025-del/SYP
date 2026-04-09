/**
 * import_basvurular.mjs
 *
 * İBB Meydan Yönetimi başvuru Excel dosyasını okur ve Firestore'a iki koleksiyona yazar:
 *   1. meydanBasvurulari  — Tek tek kayıtlar (basvuruNo = doc ID)
 *   2. meydanBasvuruStats — Her meydan için toplu istatistik (meydanId = doc ID)
 *
 * Kullanım:
 *   node scripts/import_basvurular.mjs
 *   node scripts/import_basvurular.mjs --dry-run   (Firestore'a yazmaz, sadece analiz eder)
 *   node scripts/import_basvurular.mjs --file=diger_dosya.xlsx
 *   node scripts/import_basvurular.mjs --with-normalization (Enable DeepSeek API normalization)
 *
 * Notlar:
 *   - "Başvuru Kanalı" == "Meydan Yönetimi" olan tüm kayıtlar işlenir.
 *   - İlçe adı → meydanId dönüşümü: Türkçe karakterler ASCII'ye çevrilir.
 *   - Açıklama metni 800 karakterle sınırlandırılır.
 *   - Konu normalizasyonu varsayılan olarak DEVRE DIŞI (fallback kullanılır).
 *   - --with-normalization flag'i ile DeepSeek API normalizasyonu etkinleştirilebilir.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as url from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { normalizeTopic, normalizeTopicBatch } from '../src/service/deepseekTopicNormalizer.js';
import { readSecret } from './shared/env.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const readFile  = XLSX.readFile  || XLSX.default?.readFile;
const sheetUtils = XLSX.utils    || XLSX.default?.utils;
const parseDate = XLSX.SSF?.parse_date_code || XLSX.default?.SSF?.parse_date_code;

const DRY_RUN   = process.argv.includes('--dry-run');
const WITH_NORMALIZATION = process.argv.includes('--with-normalization'); // By default, normalization is OFF
const FILE_ARG  = process.argv.find(a => a.startsWith('--file='))?.slice(7);
const XLSX_FILE = path.resolve(ROOT, FILE_ARG || 'basvurudetaylar.xlsx');

const BATCH_SIZE = 499; // Firestore limit is 500 operations per batch
const NORMALIZATION_BATCH_SIZE = 10; // DeepSeek API chunk size

// DeepSeek API key (only load if normalization is requested)
const DEEPSEEK_API_KEY = WITH_NORMALIZATION ? readSecret('VITE_DEEPSEEK_API_KEY') : null;

// ─── İlçe → meydanId ─────────────────────────────────────────────────────────

/**
 * Türkçe ilçe adını (büyük harf) Firestore meydanId slug'ına çevirir.
 * Örn: "ÜSKÜDAR" → "uskudar",  "KADIKÖY" → "kadikoy"
 */
function ilceToMeydanId(ilce) {
  if (!ilce) return null;
  return String(ilce)
    .toLowerCase()
    .replace(/\u0131/g, 'i') // ı → i
    .replace(/\u011f/g, 'g') // ğ → g
    .replace(/\u00fc/g, 'u') // ü → u
    .replace(/\u015f/g, 's') // ş → s
    .replace(/\u00f6/g, 'o') // ö → o
    .replace(/\u00e7/g, 'c') // ç → c
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// ─── Excel tarih dönüşümü ─────────────────────────────────────────────────────

function excelSerialToDateStr(serial) {
  if (!serial || typeof serial !== 'number') return null;
  try {
    if (parseDate) {
      const d = parseDate(serial);
      return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
    // Fallback: Excel epoch to JS Date (Excel serial 1 = Jan 1 1900)
    const msPerDay = 86400000;
    const excelEpoch = new Date(1899, 11, 30).getTime(); // Dec 30, 1899
    const jsDate = new Date(excelEpoch + serial * msPerDay);
    const y = jsDate.getFullYear();
    const m = jsDate.getMonth() + 1;
    const d = jsDate.getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  } catch {
    return null;
  }
}

// ─── Veri dönüşümü ────────────────────────────────────────────────────────────

function rowToDoc(row, normalizedData) {
  const ilce     = String(row['İlçe']               || '').trim().toUpperCase();
  const basvuruNo = String(row['Başvuru No']         || '').trim();
  const konu     = String(row['Konu']                || '').trim().toUpperCase();
  const altKonu  = String(row['Alt Konu']            || '').trim();
  const durum    = String(row['Durum']               || '').trim();
  const aciklama = String(row['Açıklama']            || '').trim().slice(0, 800);
  const sahip    = String(row['Başvuru Sahibi']      || '').trim();
  const ilgili   = String(row['İlişkili Olduğu Birim'] || '').trim();

  if (!basvuruNo || !ilce) return null;

  const meydanId = ilceToMeydanId(ilce);
  if (!meydanId) return null;

  const tarih = excelSerialToDateStr(row['Oluşturulma Tarihi']);
  const ay    = tarih ? tarih.slice(0, 7) : null; // "2026-01"
  const yil   = tarih ? Number(tarih.slice(0, 4))  : null;

  // Firestore doc ID: basvuruNo'daki özel karakterleri kaldır
  const docId = basvuruNo.replace(/[^a-zA-Z0-9-]/g, '-');

  const baseData = {
    meydanId,
    basvuruNo,
    ilce,
    tarih:         tarih    || '',
    ay:            ay       || '',
    yil:           yil      || 0,
    basvuruSahibi: sahip,
    konu,
    altKonu,
    aciklama,
    ilgiliOlduguBirim: ilgili,
    durum,
  };

  // Normalization verilerini ekle (varsa)
  if (normalizedData) {
    baseData.normalizedKonu = normalizedData.normalizedKonu || konu;
    baseData.category = normalizedData.category || 'DIGER';
    baseData.konuGuveni = normalizedData.confidence || 0;
  }

  return {
    docId,
    data: baseData,
  };
}

// ─── İstatistik toplayıcı ─────────────────────────────────────────────────────

function buildStats(docs) {
  const statsByMeydan = new Map();

  for (const { data } of docs) {
    const { meydanId, konu, category, durum, tarih, ay } = data;
    if (!meydanId) continue;

    if (!statsByMeydan.has(meydanId)) {
      statsByMeydan.set(meydanId, {
        toplamBasvuru:  0,
        konuDagilimi:  {},
        categoryDagilimi: {},
        durumDagilimi: {},
        aylikDagilim:  {},
        ilkTarih:      null,
        sonTarih:      null,
      });
    }

    const s = statsByMeydan.get(meydanId);
    s.toplamBasvuru++;

    if (konu)  s.konuDagilimi[konu]   = (s.konuDagilimi[konu]   || 0) + 1;
    if (category) s.categoryDagilimi[category] = (s.categoryDagilimi[category] || 0) + 1;
    if (durum) s.durumDagilimi[durum] = (s.durumDagilimi[durum] || 0) + 1;
    if (ay)    s.aylikDagilim[ay]     = (s.aylikDagilim[ay]     || 0) + 1;

    if (tarih) {
      if (!s.ilkTarih || tarih < s.ilkTarih) s.ilkTarih = tarih;
      if (!s.sonTarih || tarih > s.sonTarih) s.sonTarih = tarih;
    }
  }

  return statsByMeydan;
}

// ─── Firestore yazar ──────────────────────────────────────────────────────────

async function flushBatch(db, ops) {
  const batch = writeBatch(db);
  for (const { ref, data } of ops) {
    batch.set(ref, data, { merge: false });
  }
  await batch.commit();
}

async function writeInBatches(db, collectionName, entries, label) {
  const total   = entries.length;
  let   written = 0;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const chunk = entries.slice(i, i + BATCH_SIZE);
    const ops   = chunk.map(({ docId, data }) => ({
      ref:  doc(collection(db, collectionName), docId),
      data: { ...data, importedAt: serverTimestamp() },
    }));

    await flushBatch(db, ops);
    written += chunk.length;
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batchMax = Math.ceil(total / BATCH_SIZE);
    console.log(`  ${label}: ${batchNum}/${batchMax} batch tamamlandı (${written}/${total})`);
  }
}

// ─── Ana fonksiyon ────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('İBB Meydan Başvuru İçe Aktarıcı');
  console.log(DRY_RUN ? '⚠️  DRY-RUN modu aktif — Firestore\'a yazılmayacak' : '');
  console.log('='.repeat(60));

  // 1. Excel oku
  console.log(`\n📂 Dosya okunuyor: ${XLSX_FILE}`);
  const wb   = readFile(XLSX_FILE);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows  = sheetUtils.sheet_to_json(sheet, { defval: '' });
  console.log(`   Toplam satır: ${rows.length}`);

  // 2. Dönüştür
  console.log('\n🔄 Veriler dönüştürülüyor...');
  const docs    = [];
  const skipped = [];

  for (const row of rows) {
    const result = rowToDoc(row);
    if (result) {
      docs.push(result);
    } else {
      skipped.push(row['Başvuru No'] || '(no)');
    }
  }

  console.log(`   ✓ İşlenecek: ${docs.length} kayıt`);
  if (skipped.length) {
    console.log(`   ⚠ Atlanan  : ${skipped.length} kayıt (İlçe veya Başvuru No eksik)`);
  }

  // 3. Konuları normalize et (DeepSeek API) - OPTİYONEL
  if (WITH_NORMALIZATION && DEEPSEEK_API_KEY && docs.length > 0) {
    console.log('\n🤖 Konular DeepSeek API ile normalize ediliyor...');
    try {
      // Normalizasyon için gerekli verileri hazırla
      const itemsForNormalization = docs.map((d, idx) => ({
        basvuruNo: d.data.basvuruNo,
        konu: d.data.konu,
        aciklama: d.data.aciklama,
      }));

      // Batch'ler halinde API'ye gönder
      const normalizedResults = await normalizeTopicBatch(
        itemsForNormalization,
        DEEPSEEK_API_KEY,
        (current, total) => {
          process.stdout.write(`\r   [${current}/${total}] konuları işleniyor...`);
        }
      );
      console.log('\n   ✓ Normalizasyon tamamlandı');

      // Normalized verileri docs'e ekle
      const normMap = new Map(normalizedResults.map(r => [r.basvuruNo, r]));
      docs.forEach(doc => {
        const normData = normMap.get(doc.data.basvuruNo);
        if (normData) {
          doc.data.normalizedKonu = normData.normalizedKonu;
          doc.data.category = normData.category;
          doc.data.konuGuveni = normData.confidence;
        }
      });
    } catch (normErr) {
      console.warn(`\n   ⚠️  Normalizasyon hatası: ${normErr.message}. Devam ediliyor...`);
    }
  } else if (!WITH_NORMALIZATION) {
    console.log('\n⏭️  Konu normalizasyonu devre dışı. Fallback kategoriler kullanılıyor.');
    console.log('   💡 Normalizasyon etkinleştirmek için: --with-normalization flag\'ı ekleyin');
    // Varsayılan fallback kategorilendirme
    docs.forEach(doc => {
      const konu = String(doc.data.konu || '').toLocaleLowerCase('tr-TR');
      let category = 'DIGER';
      if (konu.includes('bakim') || konu.includes('onarim')) {
        category = 'BAKIM_ONARIM';
      } else if (konu.includes('aydınlat') || konu.includes('işık')) {
        category = 'AYDINLATMA';
      } else if (konu.includes('temizlik')) {
        category = 'BAKIM_ONARIM';
      } else if (konu.includes('park') || konu.includes('bahçe')) {
        category = 'PEYZAJ_YESIL_ALAN';
      }
      doc.data.category = category;
      doc.data.normalizedKonu = konu.split(' ').map(w => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1)).join(' ');
      doc.data.konuGuveni = 0.5; // Medium confidence for fallback
    });
  } else if (WITH_NORMALIZATION && !DEEPSEEK_API_KEY) {
    console.log('\n⚠️  DeepSeek API anahtarı bulunamadı. Fallback kategoriler kullanılıyor.');
    // Apply fallback categorization
    docs.forEach(doc => {
      const konu = String(doc.data.konu || '').toLocaleLowerCase('tr-TR');
      let category = 'DIGER';
      if (konu.includes('bakim') || konu.includes('onarim')) {
        category = 'BAKIM_ONARIM';
      } else if (konu.includes('aydınlat') || konu.includes('işık')) {
        category = 'AYDINLATMA';
      } else if (konu.includes('temizlik')) {
        category = 'BAKIM_ONARIM';
      } else if (konu.includes('park') || konu.includes('bahçe')) {
        category = 'PEYZAJ_YESIL_ALAN';
      }
      doc.data.category = category;
      doc.data.normalizedKonu = konu.split(' ').map(w => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1)).join(' ');
      doc.data.konuGuveni = 0.5; // Medium confidence for fallback
    });
  }

  // 4. İstatistikleri hesapla
  console.log('\n📊 Meydan istatistikleri hesaplanıyor...');
  const statsByMeydan = buildStats(docs);
  console.log(`   ${statsByMeydan.size} farklı meydan tespit edildi:`);
  for (const [meydanId, s] of [...statsByMeydan.entries()].sort((a, b) => b[1].toplamBasvuru - a[1].toplamBasvuru)) {
    console.log(`     ${meydanId.padEnd(20)} ${String(s.toplamBasvuru).padStart(5)} başvuru`);
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry-run tamamlandı. Firestore\'a yazılmadı.');
    return;
  }

  // 5. Firebase auth
  console.log('\n🔐 Firebase bağlantısı kuruluyor...');
  const app  = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db   = getFirestore(app);

  try {
    await signInAnonymously(auth);
    console.log('   ✓ Anonim oturum açıldı');
  } catch (authErr) {
    console.error(`   ✗ Kimlik doğrulama hatası: ${authErr.code} — ${authErr.message}`);
    console.error('   Firebase konsolunda "Anonymous" kimlik doğrulaması etkin olmalı.');
    process.exit(1);
  }

  // 6. meydanBasvurulari'na yaz
  console.log(`\n📝 meydanBasvurulari — ${docs.length} kayıt yazılıyor...`);
  await writeInBatches(db, 'meydanBasvurulari', docs, 'meydanBasvurulari');

  // 7. meydanBasvuruStats'a yaz
  console.log('\n📊 meydanBasvuruStats — istatistikler yazılıyor...');
  const statsEntries = [...statsByMeydan.entries()].map(([meydanId, s]) => ({
    docId: meydanId,
    data:  { meydanId, ...s },
  }));
  await writeInBatches(db, 'meydanBasvuruStats', statsEntries, 'meydanBasvuruStats');

  console.log('\n' + '='.repeat(60));
  console.log(`✅ İçe aktarma tamamlandı!`);
  console.log(`   meydanBasvurulari : ${docs.length} kayıt`);
  console.log(`   meydanBasvuruStats: ${statsEntries.length} meydan`);
  console.log('='.repeat(60));

  process.exit(0);
}

main().catch((err) => {
  console.error('\n✗ Beklenmedik hata:', err);
  process.exit(1);
});
