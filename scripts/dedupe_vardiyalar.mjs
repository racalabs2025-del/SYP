import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const APPLY_MODE = process.argv.includes('--apply');
const SHOW_HELP = process.argv.includes('--help') || process.argv.includes('-h');

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return Number(value.toMillis()) || 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
}

function makeShiftKey(row) {
  const personel = String(row?.personelAdi || '').trim().toLocaleLowerCase('tr-TR');
  const meydan = String(row?.meydanId || '').trim().toLocaleLowerCase('tr-TR');
  const tarih = String(row?.tarih || '').trim();
  const saat = String(row?.saatAraligi || '').trim().replace(/\s+/g, '');
  const tip = String(row?.vardiyaTipi || '').trim().toLocaleLowerCase('tr-TR');

  if (!personel || !meydan || !tarih || !saat || !tip) {
    return '';
  }

  return [personel, meydan, tarih, saat, tip].join('|');
}

function pickKeeper(rows) {
  return [...rows].sort((a, b) => {
    const aUpdated = toMillis(a.updatedAt);
    const bUpdated = toMillis(b.updatedAt);
    if (aUpdated !== bUpdated) return bUpdated - aUpdated;

    const aCreated = toMillis(a.createdAt);
    const bCreated = toMillis(b.createdAt);
    if (aCreated !== bCreated) return bCreated - aCreated;

    return String(a.id || '').localeCompare(String(b.id || ''), 'tr');
  })[0];
}

function printHelp() {
  console.log('Vardiya duplicate temizleme scripti');
  console.log('');
  console.log('Kural: Aynı personel + aynı meydan + aynı tarih + aynı saat + aynı vardiya tipi tekrarlarını tek kayda düşürür.');
  console.log('');
  console.log('Kullanım:');
  console.log('  node scripts/dedupe_vardiyalar.mjs           # dry-run (yazmaz)');
  console.log('  node scripts/dedupe_vardiyalar.mjs --apply   # silme işlemini uygular');
}

async function main() {
  if (SHOW_HELP) {
    printHelp();
    return;
  }

  const app = initializeApp(firebaseConfig);

  try {
    const auth = getAuth(app);
    await signInAnonymously(auth);
    const db = getFirestore(app);

    const snapshot = await getDocs(collection(db, 'vardiyalar'));
    const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    const groups = new Map();
    const invalidRows = [];

    rows.forEach((row) => {
      const key = makeShiftKey(row);
      if (!key) {
        invalidRows.push(row.id);
        return;
      }

      const list = groups.get(key) || [];
      list.push(row);
      groups.set(key, list);
    });

    const duplicateGroups = [];
    const toDelete = [];

    groups.forEach((list, key) => {
      if (list.length <= 1) return;

      const keeper = pickKeeper(list);
      const deletes = list.filter((row) => row.id !== keeper.id);

      duplicateGroups.push({ key, count: list.length, keeperId: keeper.id, deleteIds: deletes.map((row) => row.id) });
      deletes.forEach((row) => toDelete.push(row.id));
    });

    console.log('='.repeat(64));
    console.log('VARDIYA DUPLICATE RAPORU');
    console.log('='.repeat(64));
    console.log(`Toplam vardiya kaydı: ${rows.length}`);
    console.log(`Geçersiz anahtar nedeniyle atlanan kayıt: ${invalidRows.length}`);
    console.log(`Duplicate grup sayısı: ${duplicateGroups.length}`);
    console.log(`Silinecek duplicate kayıt: ${toDelete.length}`);

    if (duplicateGroups.length) {
      console.log('Duplicate örnekleri (ilk 20):');
      duplicateGroups.slice(0, 20).forEach((item, index) => {
        console.log(`${index + 1}. ${item.key} -> toplam ${item.count}, korunacak ${item.keeperId}, silinecek ${item.deleteIds.join(', ')}`);
      });
    }

    if (!APPLY_MODE) {
      console.log('');
      console.log('Dry-run tamamlandı. Yazım yapılmadı.');
      console.log('Uygulamak için: node scripts/dedupe_vardiyalar.mjs --apply');
      return;
    }

    if (!toDelete.length) {
      console.log('Silinecek duplicate kayıt bulunmadı.');
      return;
    }

    for (const id of toDelete) {
      await deleteDoc(doc(db, 'vardiyalar', id));
    }

    console.log('');
    console.log(`Tamamlandı. ${toDelete.length} duplicate vardiya kaydı silindi.`);
  } finally {
    await deleteApp(app);
  }
}

main().catch((error) => {
  console.error('Duplicate temizleme hatası:', error?.message || error);
  process.exitCode = 1;
});
