import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import {
  getPersonelBasvuruDocId,
  normalizePersonelKey,
  PERSONEL_BASVURU_PERIOD_KEY,
  PERSONEL_BASVURU_PERIOD_LABEL,
  toPlannedWorkDays,
} from '../src/utils/personelBasvuru.js';

const PERSONEL_BASVURU_ROWS = [
  ['AHMET KOCABIYIK', 32],
  ['AYKUT ARMAĞAN', 50],
  ['BERKAY DEDE', 12],
  ['ENES DURAN', 53],
  ['HAKAN HAN', 66],
  ['HAYDAR ÇOBAN', 85],
  ['HELİN ÖZDEMİR', 96],
  ['İSMAİL ÇOBAN', 33],
  ['KAMİLE ÇELİK', 103],
  ['KEMAL GÖNÜLTAŞ', 31],
  ['MUSTAFA KAYA', 38],
  ['OKTAY ARSLAN', 14],
  ['OZAN YUSUF AKBAŞ', 34],
  ['SEZAYİ KARAKOÇ', 2],
  ['ŞABAN ETİRLİ', 49],
  ['TUNCAY ÇATAL', 2],
  ['UĞUR AKIN', 42],
  ['VEDAT VARLIK', 46],
  ['YUSUF GÜNDOĞDU', 4],
  ['ZEYNEP AYDEMİR', 176],
  ['ERHAN EKİNCİ', 88],
  ['ESRA ŞEKER', 66],
  ['EMİN ERDOĞAN', 40],
  ['HÜSEYİN TÜRKAY', 42],
  ['HATİCE ADSAN', 38],
  ['ONUR ARMAĞAN', 29],
  ['HASAN BİLİCİ', 39],
  ['NİYAZİ BOL', 7],
  ['ERDEM ARABACI', 26],
  ['KADER SALMAN', 19],
  ['BURAK ÖZÇELİK', 0],
  ['ŞÜKRÜ KIDIL', 19],
  ['İBRAHİM SİREK', 13],
  ['UĞUR BEYHATUN', 35],
  ['ÇAĞATAY BEYOĞLU', 24],
  ['FATİH GÜNEŞ', 24],
  ['CANER DİŞLİ', 10],
  ['KEMAL EVREN DARMAN', 11],
];

async function run() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Anonim oturum aciliyor...');
  await signInAnonymously(auth);

  const batch = writeBatch(db);

  PERSONEL_BASVURU_ROWS.forEach(([personelAdi, toplamKayit]) => {
    const docId = getPersonelBasvuruDocId(personelAdi);
    const plannedWorkDays = toPlannedWorkDays(toplamKayit);
    batch.set(doc(db, 'personelBasvuruOzetleri', docId), {
      personelAdi,
      normalizedAd: normalizePersonelKey(personelAdi),
      toplamKayitRaw: toplamKayit,
      toplamKayit: plannedWorkDays,
      periodKey: PERSONEL_BASVURU_PERIOD_KEY,
      periodLabel: PERSONEL_BASVURU_PERIOD_LABEL,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  console.log(`Tamamlandi. ${PERSONEL_BASVURU_ROWS.length} personel ozeti yazildi.`);
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});