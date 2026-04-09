import { initializeApp } from 'firebase/app';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function normalizeDateShape(value) {
  const raw = String(value || '').trim();
  if (!raw) return '(empty)';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'YYYY-MM-DD';
  if (/^\d{4}[\/.]\d{1,2}[\/.]\d{1,2}$/.test(raw)) return 'YYYY/M/D';
  if (/^\d{1,2}[\/.]\d{1,2}[\/.]\d{4}$/.test(raw)) return 'D/M/YYYY';
  if (/^\d{1,2}\s+[\p{L}.]+(\s+\d{4})?/u.test(raw)) return 'D MON [YYYY]';
  return 'OTHER';
}

async function main() {
  const latestSnapshot = await getDocs(query(collection(db, 'vardiyalar'), orderBy('createdAt', 'desc'), limit(250)));
  const latest = latestSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const shapeCounts = new Map();
  for (const item of latest) {
    const shape = normalizeDateShape(item.tarih);
    shapeCounts.set(shape, (shapeCounts.get(shape) || 0) + 1);
  }

  console.log('Latest 250 date shapes:');
  for (const [shape, count] of shapeCounts.entries()) {
    console.log(`- ${shape}: ${count}`);
  }

  const weekSnapshot = await getDocs(
    query(collection(db, 'vardiyalar'), where('tarih', '>=', '2026-04-06'), where('tarih', '<=', '2026-04-12')),
  );
  const weekRows = weekSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  console.log(`\nRows in 2026-04-06..2026-04-12 (query by ISO dates): ${weekRows.length}`);

  const meydanCounts = new Map();
  for (const row of weekRows) {
    const key = row.meydanId || '(no-meydanId)';
    meydanCounts.set(key, (meydanCounts.get(key) || 0) + 1);
  }

  const sorted = Array.from(meydanCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log('\nTop meydan IDs in that week:');
  for (const [id, count] of sorted) {
    console.log(`- ${id}: ${count}`);
  }

  const sample = latest.slice(0, 10).map((item) => ({
    personelAdi: item.personelAdi,
    meydanId: item.meydanId,
    tarih: item.tarih,
    saatAraligi: item.saatAraligi,
    vardiyaTipi: item.vardiyaTipi,
  }));

  console.log('\nLatest 10 samples:');
  console.table(sample);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
