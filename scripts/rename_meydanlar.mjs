/**
 * rename_meydanlar.mjs
 * Updates isim/tamAd fields in the meydanlar Firestore collection for:
 *   - fatih      → Fatih (Aksaray) Meydanı
 *   - beyoglu    → Taksim Meydanı
 *   - bahcelievler → Bahçelievler (Şirinevler) Meydanı
 *
 * Run: node scripts/rename_meydanlar.mjs --apply
 * (dry-run without --apply)
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const APPLY_MODE = process.argv.includes('--apply');

const RENAMES = {
  fatih: {
    isim: 'Fatih (Aksaray) Meydanı',
    tamAd: 'Fatih (Aksaray) Meydanı',
  },
  beyoglu: {
    isim: 'Taksim Meydanı',
    tamAd: 'Taksim Meydanı',
  },
  bahcelievler: {
    isim: 'Bahçelievler (Şirinevler) Meydanı',
    tamAd: 'Bahçelievler (Şirinevler) Meydanı',
  },
};

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  await signInAnonymously(auth);
  const db = getFirestore(app);

  console.log(APPLY_MODE ? '🟢 APPLY MODE — writing changes' : '🟡 DRY RUN — no changes written');
  console.log('');

  for (const [meydanId, newNames] of Object.entries(RENAMES)) {
    const ref = doc(db, 'meydanlar', meydanId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.log(`  ⚠️  meydanlar/${meydanId} — document NOT FOUND, skipping`);
      continue;
    }

    const data = snap.data();
    console.log(`meydanlar/${meydanId}`);
    console.log(`  isim:  "${data.isim}" → "${newNames.isim}"`);
    console.log(`  tamAd: "${data.tamAd}" → "${newNames.tamAd}"`);

    if (APPLY_MODE) {
      await updateDoc(ref, {
        isim: newNames.isim,
        tamAd: newNames.tamAd,
      });
      console.log(`  ✅ updated`);
    }

    console.log('');
  }

  if (!APPLY_MODE) {
    console.log('Run with --apply to write changes.');
  } else {
    console.log('Done.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
