import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { COLLECTIONS } from './firestoreCollections';

export async function fetchDashboardBaseData(db, todayKey) {
  const meydanPromise = getDocs(collection(db, COLLECTIONS.MEYDANLAR));
  const todayPromise = getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), where('tarih', '==', todayKey)));
  const recentPromise = getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), orderBy('createdAt', 'desc'), limit(20)));
  const historyPromise = getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), orderBy('tarih', 'desc')))
    .catch(() => getDocs(collection(db, COLLECTIONS.VARDIYALAR)));
  const kronikPromise = getDocs(collection(db, COLLECTIONS.KRONIK_SORUNLAR))
    .then((snapshot) => ({ snapshot, error: null }))
    .catch((error) => ({ snapshot: null, error }));
  const raporlarPromise = getDocs(collection(db, COLLECTIONS.MEYDAN_FAALIYET_RAPORLARI)).catch(() => null);

  const [meydanSnapshot, todaySnapshot, recentSnapshot, historySnapshot, kronikResult, raporlarSnapshot] = await Promise.all([
    meydanPromise,
    todayPromise,
    recentPromise,
    historyPromise,
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
      todaySnapshot,
      recentDocs,
      historyDocs,
      kronikResult,
      raporlarSnapshot,
    };
  }

  const fallbackRecent = await getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), orderBy('tarih', 'desc'), limit(20)));
  return {
    meydanSnapshot,
    todaySnapshot,
    recentDocs: fallbackRecent.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() })),
    historyDocs,
    kronikResult,
    raporlarSnapshot,
  };
}
