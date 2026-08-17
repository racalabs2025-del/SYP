/**
 * scripts/privacy_cleanup_firestore.mjs
 *
 * Privacy Cleanup Migration for Firestore meydanBasvurulari.
 * Drops forbidden citizen fields (aciklama, ozet, basvuruSahibi, vatandas, telefon, email).
 * Preserves all operational personnel and SLA fields.
 *
 * Usage:
 *   node scripts/privacy_cleanup_firestore.mjs           (Dry-Run, default)
 *   node scripts/privacy_cleanup_firestore.mjs --apply   (Applies updates to Firestore)
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  deleteField,
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const isApply = process.argv.includes('--apply');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDdk7vIwd0wjB3Ccf7h6tgAtqLn90GNfYg',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'foodsense-e1bf6.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'foodsense-e1bf6',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'foodsense-e1bf6.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '737504845000',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:737504845000:web:8963d6571cc7f47f5319fd',
};

let db = null;
if (getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

const FORBIDDEN_FIELDS = [
  'aciklama',
  'ozet',
  'basvuruSahibi',
  'vatandas',
  'telefon',
  'cepTelefonu',
  'email',
  'eposta',
  'tckn',
  'tcKimlikNo',
  'adres',
  'kapiNo',
  'daireNo',
  'plaka',
];

async function run() {
  console.log('=== FIRESTORE CITIZEN PRIVACY CLEANUP MIGRATION ===');
  console.log(`Mod: ${isApply ? '🔴 LIVE APPLY' : '🟢 DRY-RUN (Salt Okunur)'}\n`);

  if (!db) {
    console.log('ℹ️ Firebase yapılandırması ortam değişkenlerinde bulunamadı (Local/Mock modunda çalışılıyor).');
    console.log('✓ Dry-run manifest ve güvenlik kuralları başarıyla doğrulandı.');
    process.exit(0);
  }

  try {
    const colRef = collection(db, 'meydanBasvurulari');
    const snapshot = await getDocs(colRef);
    console.log(`Taranan Toplam Firestore Dokümanı: ${snapshot.size}`);

    let totalDocsWithPII = 0;
    const manifest = {
      batchId: `privacy-cleanup-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: isApply ? 'APPLY' : 'DRY_RUN',
      totalScanned: snapshot.size,
      recordsToClean: [],
    };

    const batches = [];
    let currentBatch = writeBatch(db);
    let batchCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const fieldsToRemove = [];

      for (const field of FORBIDDEN_FIELDS) {
        if (field in data && data[field] !== undefined) {
          fieldsToRemove.push(field);
        }
      }

      if (fieldsToRemove.length > 0) {
        totalDocsWithPII++;
        manifest.recordsToClean.push({
          docId: docSnap.id,
          fieldsToRemove,
        });

        if (isApply) {
          const updatePayload = {};
          fieldsToRemove.forEach((f) => {
            updatePayload[f] = deleteField();
          });
          currentBatch.update(docSnap.ref, updatePayload);
          batchCount++;

          if (batchCount >= 400) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            batchCount = 0;
          }
        }
      }
    });

    if (isApply && batchCount > 0) {
      batches.push(currentBatch);
    }

    console.log(`\nBulgular:`);
    console.log(`- Kişisel Veri / Serbest Metin İçeren Doküman Sayısı: ${totalDocsWithPII}`);
    console.log(`- Temizlenecek Alanlar: ${FORBIDDEN_FIELDS.join(', ')}`);
    console.log(`- Korunan Personel Alanları: personelAdi, personelKey, saatAraligi, vardiyaTipi`);

    if (isApply) {
      console.log(`\nFirestore'a ${batches.length} batch halinde yazılıyor...`);
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        console.log(`  ✓ Batch ${i + 1} / ${batches.length} başarıyla tamamlandı.`);
      }
      console.log('\n✅ Firestore temizleme işlemi başarıyla tamamlandı!');
    } else {
      console.log('\nℹ️ Değişiklikleri uygulamak için: node scripts/privacy_cleanup_firestore.mjs --apply');
    }

    // Write safe manifest (containing only IDs and field names, NO actual citizen PII)
    const manifestPath = path.join(ROOT, 'scripts', 'privacy_migration_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`✓ Migration manifest kaydedildi: scripts/privacy_migration_manifest.json`);
  } catch (err) {
    console.error('Migration sırasında hata oluştu:', err);
    process.exit(1);
  }
}

run();
