import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { COLLECTIONS } from './firestoreCollections';

export async function fetchDashboardBaseData(db, todayKey) {
  const meydanPromise = getDocs(collection(db, COLLECTIONS.MEYDANLAR));
  const basvuruStatsPromise = getDocs(collection(db, COLLECTIONS.MEYDAN_BASVURU_STATS)).catch(() => null);
  const todayPromise = getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), where('tarih', '==', todayKey)));
  const recentPromise = getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), orderBy('createdAt', 'desc'), limit(20)));
  const historyPromise = getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), orderBy('tarih', 'desc')))
    .catch(() => getDocs(collection(db, COLLECTIONS.VARDIYALAR)));
  const personelIzinPromise = getDocs(collection(db, COLLECTIONS.PERSONEL_IZINLER)).catch(() => null);
  const kronikPromise = getDocs(collection(db, COLLECTIONS.KRONIK_SORUNLAR))
    .then((snapshot) => ({ snapshot, error: null }))
    .catch((error) => ({ snapshot: null, error }));
  const raporlarPromise = getDocs(collection(db, COLLECTIONS.MEYDAN_FAALIYET_RAPORLARI)).catch(() => null);

  const [meydanSnapshot, basvuruStatsSnapshot, todaySnapshot, recentSnapshot, historySnapshot, personelIzinSnapshot, kronikResult, raporlarSnapshot] = await Promise.all([
    meydanPromise,
    basvuruStatsPromise,
    todayPromise,
    recentPromise,
    historyPromise,
    personelIzinPromise,
    kronikPromise,
    raporlarPromise,
  ]);

  if (!meydanSnapshot || !todaySnapshot || !recentSnapshot || !historySnapshot) {
    throw new Error('Dashboard temel verileri alınamadı.');
  }

  const recentDocs = recentSnapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
  const historyDocs = historySnapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));

  if (recentDocs.length) {
    return {
      meydanSnapshot,
      basvuruStatsSnapshot,
      todaySnapshot,
      recentDocs,
      historyDocs,
      personelIzinSnapshot,
      kronikResult,
      raporlarSnapshot,
    };
  }

  const fallbackRecent = await getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), orderBy('tarih', 'desc'), limit(20)));
  return {
    meydanSnapshot,
    basvuruStatsSnapshot,
    todaySnapshot,
    recentDocs: fallbackRecent.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() })),
    historyDocs,
    personelIzinSnapshot,
    kronikResult,
    raporlarSnapshot,
  };
}
