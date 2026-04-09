import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Firebase Admin SDK başlat
const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve('./firebase-credentials.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addTestRapor() {
  try {
    console.log('Test raporu ekleniyor...');

    const testRapor = {
      baslik: 'NISAN 2026 FAALİYET RAPORU',
      ad: 'test-rapor.pdf',
      boyut: 1024000,
      url: 'https://example.com/test.pdf', // Bu URL geçerli bir Firebase Storage URL olmalı
      createdAt: new Date(),
      yuklenmeTarihi: new Date().toLocaleString('tr-TR'),
    };

    const docRef = await db.collection('meydanFaaliyetRaporlari').add(testRapor);
    console.log('✓ Rapor eklendi:', docRef.id);

    // Kontrol et
    const docs = await db.collection('meydanFaaliyetRaporlari').get();
    console.log(`\n✓ Toplam rapor sayısı: ${docs.size}`);
    docs.forEach((doc) => {
      console.log(`- ${doc.data().baslik} (${doc.id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

addTestRapor();
