import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { COLLECTIONS } from './firestoreCollections';

export async function loadStoredOperationalInsights(db, dayKey) {
  const ref = doc(db, COLLECTIONS.OPERASYONEL_ICGORULER, dayKey);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.data();
  return Array.isArray(data?.insights) ? data.insights : [];
}

export async function saveOperationalInsights(db, dayKey, insights = []) {
  if (!Array.isArray(insights) || !insights.length) {
    return;
  }

  const ref = doc(db, COLLECTIONS.OPERASYONEL_ICGORULER, dayKey);
  await setDoc(ref, {
    dayKey,
    insights,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
