import { initializeApp } from 'firebase/app';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function wipeVardiyalar() {
  if (process.env.CONFIRM_WIPE !== 'true') {
    throw new Error('Silme islemi icin CONFIRM_WIPE=true ortam degiskeni gerekli.');
  }

  const snapshot = await getDocs(collection(db, 'vardiyalar'));
  console.log(`${snapshot.size} vardiya kaydi siliniyor...`);

  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => {
    batch.delete(item.ref);
  });

  await batch.commit();
  console.log('Vardiyalar temizlendi. Meydanlar korundu.');
}

wipeVardiyalar().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
