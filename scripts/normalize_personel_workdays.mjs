import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, getDocs, doc, writeBatch, serverTimestamp, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { toPlannedWorkDays } from '../src/utils/personelBasvuru.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function run() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInAnonymously(auth);

  const snap = await getDocs(collection(db, 'personelBasvuruOzetleri'));
  const rows = snap.docs;

  console.log(`Toplam ozet kaydi: ${rows.length}`);
  if (!rows.length) {
    return;
  }

  const batch = writeBatch(db);
  let updated = 0;

  rows.forEach((row) => {
    const data = row.data() || {};
    const raw = typeof data.toplamKayitRaw === 'number'
      ? data.toplamKayitRaw
      : Number(data.toplamKayit || 0);

    const planned = toPlannedWorkDays(raw);

    if (data.toplamKayitRaw === raw && data.toplamKayit === planned) {
      return;
    }

    updated += 1;

    if (!DRY_RUN) {
      batch.set(doc(db, 'personelBasvuruOzetleri', row.id), {
        ...data,
        toplamKayitRaw: raw,
        toplamKayit: planned,
        updatedAt: serverTimestamp(),
      });
    }
  });

  if (DRY_RUN) {
    console.log(`Dry-run: ${updated} kayit guncellenecek.`);
    return;
  }

  if (updated > 0) {
    await batch.commit();
  }

  console.log(`Tamamlandi. ${updated} kayit guncellendi.`);
}

run().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
