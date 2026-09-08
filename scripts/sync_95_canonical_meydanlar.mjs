import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { ALL_CANONICAL_MEYDANLAR } from '../src/data/canonicalMeydanData.js';
import { normalizeMeydanInput } from '../src/utils/meydanNormalization.js';

const BATCH_SIZE = 400;

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function run() {
  console.log('--- 95 KANONİK MEYDAN FİRESTORE SENKRONİZASYONU BAŞLATILIYOR ---');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInAnonymously(auth);
  console.log('Firebase oturumu basariyla acildi.');

  // 1. Fetch current meydanlar
  const meydanSnap = await getDocs(collection(db, 'meydanlar'));
  console.log(`Mevcut Firestore meydan sayisi: ${meydanSnap.docs.length}`);

  const canonicalIdSet = new Set(ALL_CANONICAL_MEYDANLAR.map(m => m.id));

  // 2. Identify obsolete documents to delete
  const obsoleteDocs = meydanSnap.docs.filter(d => !canonicalIdSet.has(d.id));
  console.log(`Silinecek eski/gecersiz meydan dokuman sayisi: ${obsoleteDocs.length}`);

  for (const chunk of chunkArray(obsoleteDocs, BATCH_SIZE)) {
    const batch = writeBatch(db);
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  if (obsoleteDocs.length > 0) {
    console.log('Eski meydan kayitlari temizlendi.');
  }

  // 3. Upsert all 95 canonical squares with complete presentation metadata
  console.log(`95 Kanonik meydan yaziliyor...`);
  const squareChunks = chunkArray(ALL_CANONICAL_MEYDANLAR, BATCH_SIZE);

  for (const chunk of squareChunks) {
    const batch = writeBatch(db);
    chunk.forEach(m => {
      const docRef = doc(db, 'meydanlar', m.id);
      batch.set(docRef, {
        id: m.id,
        sira: m.sira,
        name: m.name,
        isim: m.name,
        tamAd: m.name,
        district: m.district,
        yaka: m.yaka,
        kategori: m.kategori,
        yonetimNotu: m.yonetimNotu,
        subtitle: m.subtitle,
        yapimYili: m.yapimYili,
        alanM2: m.alanM2,
        fonksiyonlar: m.fonksiyonlar,
        aciklama: m.aciklama,
        heroImage: m.heroImage,
        images: m.images,
        landmarks: m.landmarks,
        personnel: m.personnel,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }
  console.log(`Tüm 95 meydan Firestore'a eksiksiz kaydedildi!`);

  // 4. Normalize existing shifts so their meydanId strictly maps to canonical 95 squares
  console.log('\nMevcut vardiyalar taranip kanonik 95 meydan ID\'lerine esleniyor...');
  const vardiyaSnap = await getDocs(collection(db, 'vardiyalar'));
  console.log(`Toplam vardiya sayisi: ${vardiyaSnap.docs.length}`);

  let updatedShiftCount = 0;
  let deletedShiftCount = 0;
  const shiftUpdates = [];
  const shiftDeletes = [];

  vardiyaSnap.docs.forEach(d => {
    const data = d.data();
    const normalized = normalizeMeydanInput({
      meydanId: data.meydanId,
      tamAd: data.rawLocation || data.meydanId,
    });

    if (!normalized.valid) {
      if (data.isLeave || data.vardiyaTipi === 'HAFTA TATILI' || data.vardiyaTipi === 'Izinli') {
        // Keep leave as is
      } else {
        // Invalid non-square shift, mark for deletion or keep if desired
      }
    } else if (normalized.id !== data.meydanId) {
      shiftUpdates.push({
        ref: d.ref,
        canonicalId: normalized.id,
        canonicalName: normalized.isim,
      });
    }
  });

  console.log(`Guncellenecek vardiya sayisi: ${shiftUpdates.length}`);

  for (const chunk of chunkArray(shiftUpdates, BATCH_SIZE)) {
    const batch = writeBatch(db);
    chunk.forEach(u => {
      batch.update(u.ref, {
        meydanId: u.canonicalId,
      });
    });
    await batch.commit();
    updatedShiftCount += chunk.length;
    process.stdout.write(`.`);
  }

  console.log(`\n${updatedShiftCount} vardiyanin meydan kimligi 95 kanonik meydan listesine gore guncellendi!`);
  console.log('--- SENKRONİZASYON BAŞARIYLA TAMAMLANDI ---');
}

run().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
