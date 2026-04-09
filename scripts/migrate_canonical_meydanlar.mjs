import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { normalizeMeydanInput } from '../src/utils/meydanNormalization.js';

const BATCH_LIMIT = 400;
const APPLY_MODE = process.argv.includes('--apply');

function splitIntoChunks(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function normalizeShiftRecord(shift, rawMeydanById) {
  const sourceMeydan = rawMeydanById[shift.meydanId] || {
    id: shift.meydanId,
    isim: shift.meydanId,
    tamAd: shift.meydanId,
  };

  const normalizedMeydan = normalizeMeydanInput({
    meydanId: sourceMeydan.id,
    isim: sourceMeydan.isim,
    kisaAd: sourceMeydan.isim,
    tamAd: sourceMeydan.tamAd,
  });

  if (!normalizedMeydan.valid) {
    return null;
  }

  return {
    personelAdi: shift.personelAdi,
    meydanId: normalizedMeydan.id,
    tarih: shift.tarih,
    saatAraligi: shift.saatAraligi || '10:00-18:30',
    vardiyaTipi: shift.vardiyaTipi || 'Gunduz',
    canonicalMeydan: normalizedMeydan,
  };
}

async function deleteAllDocs(db, collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  const refs = snapshot.docs.map((item) => item.ref);
  const chunks = splitIntoChunks(refs, BATCH_LIMIT);

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((reference) => batch.delete(reference));
    await batch.commit();
  }
}

async function writeCanonicalData(db, canonicalMeydanMap, canonicalShiftMap) {
  const operations = [
    ...Array.from(canonicalMeydanMap.entries()).map(([id, data]) => ({ type: 'meydan', id, data })),
    ...Array.from(canonicalShiftMap.values()).map((data) => ({ type: 'vardiya', data })),
  ];

  const chunks = splitIntoChunks(operations, BATCH_LIMIT);

  for (const chunk of chunks) {
    const batch = writeBatch(db);

    chunk.forEach((operation) => {
      if (operation.type === 'meydan') {
        batch.set(doc(db, 'meydanlar', operation.id), operation.data);
        return;
      }

      batch.set(doc(collection(db, 'vardiyalar')), {
        ...operation.data,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }
}

async function run() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Anonim oturum aciliyor...');
  await signInAnonymously(auth);

  console.log('Firestore verileri okunuyor...');
  const [meydanSnapshot, vardiyaSnapshot] = await Promise.all([
    getDocs(collection(db, 'meydanlar')),
    getDocs(collection(db, 'vardiyalar')),
  ]);

  const rawMeydanlar = meydanSnapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
  const rawVardiyalar = vardiyaSnapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
  const rawMeydanById = Object.fromEntries(rawMeydanlar.map((item) => [item.id, item]));

  const canonicalMeydanMap = new Map();
  const canonicalShiftMap = new Map();
  const invalidMeydanCounts = new Map();
  const invalidShiftSamples = [];
  let duplicateShiftCount = 0;

  rawVardiyalar.forEach((shift) => {
    const normalizedShift = normalizeShiftRecord(shift, rawMeydanById);

    if (!normalizedShift) {
      const invalidKey = String(shift.meydanId || '(bos)');
      invalidMeydanCounts.set(invalidKey, (invalidMeydanCounts.get(invalidKey) || 0) + 1);

      if (invalidShiftSamples.length < 15) {
        invalidShiftSamples.push({
          personelAdi: shift.personelAdi || '',
          meydanId: shift.meydanId || '',
          tarih: shift.tarih || '',
        });
      }
      return;
    }

    canonicalMeydanMap.set(normalizedShift.canonicalMeydan.id, {
      isim: normalizedShift.canonicalMeydan.isim,
      tamAd: normalizedShift.canonicalMeydan.tamAd,
    });

    const shiftKey = [
      normalizedShift.personelAdi,
      normalizedShift.meydanId,
      normalizedShift.tarih,
      normalizedShift.saatAraligi,
      normalizedShift.vardiyaTipi,
    ].join('|');

    if (canonicalShiftMap.has(shiftKey)) {
      duplicateShiftCount += 1;
      return;
    }

    canonicalShiftMap.set(shiftKey, {
      personelAdi: normalizedShift.personelAdi,
      meydanId: normalizedShift.meydanId,
      tarih: normalizedShift.tarih,
      saatAraligi: normalizedShift.saatAraligi,
      vardiyaTipi: normalizedShift.vardiyaTipi,
    });
  });

  const summary = {
    rawMeydanCount: rawMeydanlar.length,
    rawVardiyaCount: rawVardiyalar.length,
    canonicalMeydanCount: canonicalMeydanMap.size,
    canonicalVardiyaCount: canonicalShiftMap.size,
    droppedInvalidShiftCount: rawVardiyalar.length - canonicalShiftMap.size - duplicateShiftCount,
    duplicateShiftCount,
    topInvalidMeydanIds: Array.from(invalidMeydanCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 20),
    invalidShiftSamples,
  };

  console.log('\nMigrasyon ozeti:');
  console.log(JSON.stringify(summary, null, 2));

  if (!APPLY_MODE) {
    console.log('\nDry-run tamamlandi. Gercek tasima icin: npm run migrate:meydanlar -- --apply');
    return;
  }

  console.log('\nEski veriler temizleniyor...');
  await deleteAllDocs(db, 'vardiyalar');
  await deleteAllDocs(db, 'meydanlar');

  console.log('Kanonik veriler yaziliyor...');
  await writeCanonicalData(db, canonicalMeydanMap, canonicalShiftMap);

  console.log('\nMigrasyon tamamlandi.');
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});