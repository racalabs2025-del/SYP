import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { normalizeMeydanInput } from '../src/utils/meydanNormalization.js';

function normalizePersonelKeyForQuality(name) {
  return String(name || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function isLeaveShift(type) {
  return type === 'Izinli' || type === 'İzinli' || type === 'HAFTA TATILI' || type === 'HAFTA TATİLİ';
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInAnonymously(auth);

  const [meydanSnap, vardiyaSnap, izinSnap] = await Promise.all([
    getDocs(collection(db, 'meydanlar')),
    getDocs(collection(db, 'vardiyalar')),
    getDocs(collection(db, 'personelIzinler')).catch(() => ({ docs: [] })),
  ]);

  const meydanList = meydanSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const meydanMap = Object.fromEntries(meydanList.map(m => [m.id, m]));

  const shifts = vardiyaSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const leaveRows = izinSnap.docs ? izinSnap.docs.map(d => ({ id: d.id, ...d.data() })) : [];

  const issues = [];
  const shiftDuplicateCounts = new Map();

  shifts.forEach(shift => {
    const personelAdi = String(shift?.personelAdi || '').trim();
    const personelKey = normalizePersonelKeyForQuality(personelAdi);
    const tarih = String(shift?.tarih || '').trim();
    const saatAraligi = String(shift?.saatAraligi || '').trim();
    const vardiyaTipi = String(shift?.vardiyaTipi || '').trim();
    const meydanId = String(shift?.meydanId || '').trim();

    if (!personelKey || !tarih) return;

    if (!isLeaveShift(vardiyaTipi)) {
      if (saatAraligi.replace(/\s+/g, '') === '08:30-16:00') {
        issues.push({
          type: 'hour_format',
          personelAdi,
          tarih,
          saatAraligi,
          problem: `Geçersiz vardiya saat aralığı (08:30-16:00)`,
        });
      }

      const duplicateKey = `${personelKey}|${meydanId}|${tarih}|${saatAraligi}|${vardiyaTipi}`;
      const existing = shiftDuplicateCounts.get(duplicateKey) || { count: 0, personelAdi, meydanId, tarih, saatAraligi };
      existing.count += 1;
      shiftDuplicateCounts.set(duplicateKey, existing);
    }
  });

  shiftDuplicateCounts.forEach(item => {
    if (item.count > 1) {
      issues.push({
        type: 'duplicate_shift',
        personelAdi: item.personelAdi,
        tarih: item.tarih,
        meydanId: item.meydanId,
        count: item.count,
        problem: `Aynı gün ve aynı saatte ${item.count} mükerrer vardiya`,
      });
    }
  });

  console.log(`Toplam ${issues.length} kalite uyarısı/sorunu bulundu.\n`);
  const byType = {};
  issues.forEach(i => byType[i.type] = (byType[i.type] || 0) + 1);
  console.log('Hata Türleri Dağılımı:', byType);

  console.log('\nÖrnek 10 Hata Kaydı:');
  console.log(issues.slice(0, 10));
}

main().catch(console.error);
