// Browser Console'da çalıştırılacak test script
// Dashboard.jsx açıkken F12 -> Console'a yapıştır

async function testRaporlar() {
  const { db } = await import('./firebaseDb.js');
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

  try {
    console.log('Test raporları konacak...');

    const testData = [
      {
        baslik: 'OCAK 2026 FAALİYET RAPORU',
        ad: 'ocak-2026-rapor.pdf',
        boyut: 1024 * 500,
      },
      {
        baslik: 'ŞUBAT 2026 FAALİYET RAPORU',
        ad: 'subat-2026-rapor.pdf',
        boyut: 1024 * 600,
      },
      {
        baslik: 'MART 2026 FAALİYET RAPORU',
        ad: 'mart-2026-rapor.pdf',
        boyut: 1024 * 550,
      },
    ];

    for (const data of testData) {
      const docRef = await addDoc(collection(db, 'meydanFaaliyetRaporlari'), {
        ...data,
        url: 'https://example.com/test.pdf',
        createdAt: serverTimestamp(),
        yuklenmeTarihi: new Date().toLocaleString('tr-TR'),
      });
      console.log(`✓ Eklendi: ${data.baslik} (${docRef.id})`);
    }

    console.log('✓ Test tamamlandı! Sayfayı yenile (F5) ve Faaliyet Raporları sekmesini kontrol et.');
  } catch (error) {
    console.error('✗ Hata:', error);
  }
}

testRaporlar();
