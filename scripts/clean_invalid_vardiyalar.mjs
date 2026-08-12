import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const BATCH_LIMIT = 400;

function splitIntoChunks(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInAnonymously(auth);

  const snapshot = await getDocs(collection(db, 'vardiyalar'));
  console.log(`Checking ${snapshot.size} vardiya documents in Firestore...`);

  const invalidDocRefs = [];
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const tarih = String(data.tarih || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) {
      console.log(`Invalid date document [${docSnap.id}]: tarih="${tarih}"`);
      invalidDocRefs.push(docSnap.ref);
    }
  });

  console.log(`Found ${invalidDocRefs.length} invalid vardiya documents.`);

  if (invalidDocRefs.length > 0) {
    const chunks = splitIntoChunks(invalidDocRefs, BATCH_LIMIT);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
    console.log(`Successfully deleted ${invalidDocRefs.length} invalid vardiya documents.`);
  }
}

main().catch(console.error);
