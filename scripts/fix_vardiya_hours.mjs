import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const APPLY_MODE = process.argv.includes('--apply');
const SHOW_HELP = process.argv.includes('--help') || process.argv.includes('-h');

const TARGET_TIME = '08:30-17:00';

function normalizeTimeRange(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return '';
  }

  const compact = raw.replace(/\s+/g, '').replace(/[.]/g, ':');
  const match = compact.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!match) {
    return raw;
  }

  const [, sh, sm, eh, em] = match;
  return `${String(Number(sh)).padStart(2, '0')}:${String(Number(sm)).padStart(2, '0')}-${String(Number(eh)).padStart(2, '0')}:${String(Number(em)).padStart(2, '0')}`;
}

function shouldNormalizeToTarget(normalizedTime) {
  return normalizedTime === '08:30-16:00';
}

function buildCanonicalShiftKey(row) {
  return [
    String(row?.personelAdi || '').trim().toLocaleLowerCase('tr-TR'),
    String(row?.meydanId || row?.meydanAdi || row?.meydan || '').trim().toLocaleLowerCase('tr-TR'),
    String(row?.tarih || '').trim(),
    String(row?.vardiyaTipi || '').trim().toLocaleLowerCase('tr-TR'),
    TARGET_TIME,
  ].join('|');
}

function printHelp() {
  console.log('Vardiya saat duzeltme scripti');
  console.log('');
  console.log('Amaç: vardiyalar koleksiyonundaki 08:30-16:00 saatlerini 08:30-17:00 olarak duzeltmek.');
  console.log('Ayrica ayni personel + meydan + tarih + vardiyaTipi icin 08:30-17:00 zaten varsa duplicate kaydi siler.');
  console.log('');
  console.log('Kullanim:');
  console.log('  node scripts/fix_vardiya_hours.mjs            # dry-run (yazmaz)');
  console.log('  node scripts/fix_vardiya_hours.mjs --apply    # degisiklikleri uygular');
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

    const canonicalMap = new Map();
    rows.forEach((row) => {
      const normalizedTime = normalizeTimeRange(row?.saatAraligi);
      const key = buildCanonicalShiftKey(row);

      if (normalizedTime === TARGET_TIME) {
        const existing = canonicalMap.get(key);
        if (!existing) {
          canonicalMap.set(key, row.id);
        }
      }
    });

    const toUpdate = [];
    const toDelete = [];
    const skipped = [];

    rows.forEach((row) => {
      const normalizedTime = normalizeTimeRange(row?.saatAraligi);
      if (!shouldNormalizeToTarget(normalizedTime)) {
        return;
      }

      const key = buildCanonicalShiftKey(row);
      const existingCanonicalId = canonicalMap.get(key);

      if (existingCanonicalId && existingCanonicalId !== row.id) {
        toDelete.push({ id: row.id, reason: `Duplicate with ${existingCanonicalId}` });
        return;
      }

      if (!String(row?.personelAdi || '').trim() || !String(row?.tarih || '').trim()) {
        skipped.push({ id: row.id, reason: 'Missing personelAdi or tarih' });
        return;
      }

      toUpdate.push({ id: row.id });
      canonicalMap.set(key, row.id);
    });

    console.log('='.repeat(64));
    console.log('VARDIYA SAAT DOGRULAMA RAPORU');
    console.log('='.repeat(64));
    console.log(`Toplam vardiya kaydi: ${rows.length}`);
    console.log(`08:30-16:00 -> 08:30-17:00 guncellenecek: ${toUpdate.length}`);
    console.log(`Duplicate oldugu icin silinecek: ${toDelete.length}`);
    console.log(`Atlanan kayit: ${skipped.length}`);

    if (toUpdate.length) {
      console.log('Guncellenecek kayitlar (ilk 20):');
      console.log(toUpdate.slice(0, 20).map((item) => item.id).join(', '));
    }

    if (toDelete.length) {
      console.log('Silinecek duplicate kayitlar (ilk 20):');
      console.log(toDelete.slice(0, 20).map((item) => `${item.id} (${item.reason})`).join(', '));
    }

    if (skipped.length) {
      console.log('Atlanan kayitlar (ilk 20):');
      console.log(skipped.slice(0, 20).map((item) => `${item.id} (${item.reason})`).join(', '));
    }

    if (!APPLY_MODE) {
      console.log('');
      console.log('Dry-run tamamlandi. Yazim yapilmadi.');
      console.log('Uygulamak icin: node scripts/fix_vardiya_hours.mjs --apply');
      return;
    }

    for (const item of toUpdate) {
      await updateDoc(doc(db, 'vardiyalar', item.id), {
        saatAraligi: TARGET_TIME,
        updatedAt: serverTimestamp(),
        saatAraligiFixAppliedAt: serverTimestamp(),
      });
    }

    for (const item of toDelete) {
      await deleteDoc(doc(db, 'vardiyalar', item.id));
    }

    console.log('');
    console.log(`Tamamlandi. ${toUpdate.length} kayit guncellendi, ${toDelete.length} duplicate kayit silindi.`);
  } finally {
    await deleteApp(app);
  }
}

main().catch((error) => {
  console.error('Vardiya saat fix hatasi:', error?.message || error);
  process.exitCode = 1;
});
