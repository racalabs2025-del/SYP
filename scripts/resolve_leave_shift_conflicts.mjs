import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const APPLY_MODE = process.argv.includes('--apply');

function isLeaveShift(type) {
  const norm = String(type || '').toLocaleLowerCase('tr-TR').replace(/[ıi]/g, 'i').trim();
  return norm.includes('izin') || norm.includes('tatil') || norm.includes('rapor') || norm.includes('istirahat') || norm === 'ofis' || norm === 'calistay';
}

function normName(n) {
  return String(n || '').toLocaleLowerCase('tr-TR').replace(/[ıi]/g, 'i').replace(/[^a-z0-9]/g, '');
}

async function main() {
  const app = initializeApp(firebaseConfig);
  try {
    const auth = getAuth(app);
    await signInAnonymously(auth);
    const db = getFirestore(app);

    const [vardiyaSnap, izinSnap] = await Promise.all([
      getDocs(collection(db, 'vardiyalar')),
      getDocs(collection(db, 'personelIzinler')),
    ]);

    const rawShifts = vardiyaSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const rawLeaves = izinSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const leaveMap = new Map();
    rawLeaves.forEach((l) => {
      const tarih = l.baslangicTarihi || l.tarih;
      if (tarih) {
        leaveMap.set(`${normName(l.personelAdi)}|${tarih}`, l);
      }
    });

    const toUpdate = [];
    rawShifts.forEach((s) => {
      if (!isLeaveShift(s.vardiyaTipi)) {
        const l = leaveMap.get(`${normName(s.personelAdi)}|${s.tarih}`);
        if (l) {
          toUpdate.push({
            shiftId: s.id,
            personelAdi: s.personelAdi,
            tarih: s.tarih,
            oldType: s.vardiyaTipi,
            newType: l.izinTuru || 'İzinli',
            meydanId: s.meydanId,
          });
        }
      }
    });

    console.log('='.repeat(64));
    console.log('İZİN VE VARDIYA ÇAKIŞMALARINI DÜZELTME RAPORU');
    console.log('='.repeat(64));
    console.log(`İzin gününde görev yazılmış ve düzeltilecek vardiya sayısı: ${toUpdate.length}`);

    if (toUpdate.length) {
      console.log('Örnek kayıtlar (ilk 10):');
      toUpdate.slice(0, 10).forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.personelAdi} [${item.tarih}] (${item.oldType} -> ${item.newType}) @ ${item.meydanId}`);
      });
    }

    if (!APPLY_MODE) {
      console.log('\nDry-run tamamlandı. Yazım yapılmadı.');
      console.log('Uygulamak için: node scripts/resolve_leave_shift_conflicts.mjs --apply');
      return;
    }

    let batch = writeBatch(db);
    let batchCount = 0;
    let totalWritten = 0;

    for (const item of toUpdate) {
      const ref = doc(db, 'vardiyalar', item.shiftId);
      batch.update(ref, {
        vardiyaTipi: item.newType,
        isLeave: true,
        conflictResolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batchCount += 1;
      totalWritten += 1;

      if (batchCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`\nİşlem tamamlandı: ${totalWritten} vardiya kaydı izin türüne göre güncellendi.`);
  } finally {
    await deleteApp(app);
  }
}

main().catch(console.error);
