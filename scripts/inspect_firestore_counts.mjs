import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await signInAnonymously(auth);

const collectionsToCount = [
  'meydanlar',
  'vardiyalar',
  'meydanBasvurulari',
  'meydanBasvuruStats',
  'personelBasvuruOzetleri',
  'kronikSorunlar',
  'personelIzinler'
];

console.log('=== FIRESTORE COLLECTION COUNTS ===');
for (const colName of collectionsToCount) {
  try {
    const snap = await getDocs(collection(db, colName));
    console.log(`- ${colName.padEnd(25)}: ${snap.size} documents`);
  } catch (err) {
    console.error(`- ${colName.padEnd(25)}: Error (${err.message})`);
  }
}
process.exit(0);
