import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const APPLY_MODE = process.argv.includes('--apply');

async function main() {
  const app = initializeApp(firebaseConfig);
  try {
    const auth = getAuth(app);
    await signInAnonymously(auth);
    const db = getFirestore(app);

    const snapshot = await getDocs(collection(db, 'personelIzinler'));
    const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const fixable = [];
    rows.forEach((row) => {
      const tarih = String(row?.tarih || '').trim();
      const hasStart = !!String(row?.baslangicTarihi || '').trim();
      const hasEnd = !!String(row?.bitisTarihi || '').trim();

      if (!hasStart && tarih) {
        fixable.push({
          id: row.id,
          tarih,
          baslangicTarihi: tarih,
          bitisTarihi: hasEnd ? String(row.bitisTarihi).trim() : tarih,
          gunSayisi: Number(row?.gunSayisi) > 0 ? Number(row.gunSayisi) : 1,
        });
      }
    });

    console.log('='.repeat(64));
    console.log('PERSONEL IZIN KAYITLARI NORMALIZASYON RAPORU');
    console.log('='.repeat(64));
    console.log(`Toplam izin kaydı: ${rows.length}`);
    console.log(`baslangicTarihi eksik olup tarih alanından doldurulacak kayıt: ${fixable.length}`);

    if (fixable.length) {
      console.log('Örnek kayıtlar (ilk 5):');
      console.log(fixable.slice(0, 5));
    }

    if (!APPLY_MODE) {
      console.log('\nDry-run modunda çalıştı. Veri tabanına yazılmadı.');
      console.log('Uygulamak için: node scripts/normalize_personel_izin_records.mjs --apply');
      return;
    }

    let batch = writeBatch(db);
    let batchCount = 0;
    let totalUpdated = 0;

    for (const item of fixable) {
      const ref = doc(db, 'personelIzinler', item.id);
      batch.update(ref, {
        baslangicTarihi: item.baslangicTarihi,
        bitisTarihi: item.bitisTarihi,
        gunSayisi: item.gunSayisi,
        updatedAt: serverTimestamp(),
      });

      batchCount += 1;
      totalUpdated += 1;

      if (batchCount >= 400) {
        await batch.commit();
        console.log(`-> ${totalUpdated} izin belgesi güncellendi...`);
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`-> ${totalUpdated} izin belgesi güncellendi.`);
    }

    console.log(`\nİşlem tamamlandı: Toplam ${totalUpdated} izin kaydı standardize edildi.`);
  } finally {
    await deleteApp(app);
  }
}

main().catch(console.error);
