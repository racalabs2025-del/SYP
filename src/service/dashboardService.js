import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { COLLECTIONS } from './firestoreCollections.js';

export function getDefaultShiftDateRange(todayKey) {
  const base = todayKey ? new Date(todayKey) : new Date();
  const start = new Date(base);
  start.setDate(start.getDate() - 30);
  const toDateStr = (d) => d.toISOString().slice(0, 10);
  return {
    from: toDateStr(start),
    to: todayKey || toDateStr(base),
  };
}

export async function fetchDashboardBaseData(db, todayKey, dateRange = null) {
  const effectiveRange = dateRange || getDefaultShiftDateRange(todayKey);
  const meydanPromise = getDocs(collection(db, COLLECTIONS.MEYDANLAR));
  const basvuruStatsPromise = getDocs(collection(db, COLLECTIONS.MEYDAN_BASVURU_STATS)).catch(() => null);
  const todayPromise = getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), where('tarih', '==', todayKey)));
  const recentPromise = getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), orderBy('createdAt', 'desc'), limit(20)));
  const historyPromise = getDocs(
    query(
      collection(db, COLLECTIONS.VARDIYALAR),
      where('tarih', '>=', effectiveRange.from),
      where('tarih', '<=', effectiveRange.to),
      orderBy('tarih', 'desc'),
    ),
  ).catch(() => getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), orderBy('tarih', 'desc'), limit(150))));

  const personelIzinPromise = getDocs(collection(db, COLLECTIONS.PERSONEL_IZINLER)).catch(() => null);
  const kronikPromise = getDocs(collection(db, COLLECTIONS.KRONIK_SORUNLAR))
    .then((snapshot) => ({ snapshot, error: null }))
    .catch((error) => ({ snapshot: null, error }));
  const raporlarPromise = getDocs(collection(db, COLLECTIONS.MEYDAN_FAALIYET_RAPORLARI)).catch(() => null);

  const [
    meydanSnapshot,
    basvuruStatsSnapshot,
    todaySnapshot,
    recentSnapshot,
    historySnapshot,
    personelIzinSnapshot,
    kronikResult,
    raporlarSnapshot,
  ] = await Promise.all([
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

  const finalRecentDocs = recentDocs.length
    ? recentDocs
    : (await getDocs(query(collection(db, COLLECTIONS.VARDIYALAR), orderBy('tarih', 'desc'), limit(20))))
      .docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));

  return {
    meydanSnapshot,
    basvuruStatsSnapshot,
    todaySnapshot,
    recentDocs: finalRecentDocs,
    historyDocs,
    personelIzinSnapshot,
    kronikResult,
    raporlarSnapshot,
    loadedDateRange: effectiveRange,
  };
}

export async function fetchShiftsForDateRange(db, fromDateKey, toDateKey) {
  const rangeQuery = query(
    collection(db, COLLECTIONS.VARDIYALAR),
    where('tarih', '>=', fromDateKey),
    where('tarih', '<=', toDateKey),
    orderBy('tarih', 'desc'),
  );
  const snapshot = await getDocs(rangeQuery);
  return snapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
}

export async function fetchAllHistoricalShifts(db, limitCount = 1000) {
  const q = query(
    collection(db, COLLECTIONS.VARDIYALAR),
    orderBy('tarih', 'desc'),
    limit(limitCount),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
}

export async function fetchLatestExcelAuditLogs(db, limitCount = 10) {
  try {
    const q = query(
      collection(db, COLLECTIONS.EXCEL_AUDIT),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
  } catch (err) {
    console.warn('Excel audit log fetch error:', err);
    return [];
  }
}
