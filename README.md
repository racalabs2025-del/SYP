# SYP — Saha Yönetim Paneli

İBB saha ekipleri için meydan, vardiya, personel, başvuru ve faaliyet raporu yönetimi. React 19 + Vite arayüzü, Firebase Auth/Firestore ve Vercel API uçları kullanır.

## Başlangıç

Node 24 önerilir. Ortam değişkenleri için .env.example dosyasını temel alın; değerleri .env içine yazın.

```sh
npm ci
npm run dev
# Arayüz ve yerel AI/hava durumu proxy birlikte:
npm run dev:full
```

## Giriş ve roller

Giriş e-posta ve hesap parolasıyla yapılır. Hesabın Firebase Email/Password sağlayıcısında bulunması ve sypRole yetki alanına sahip olması gerekir:

- viewer: panel ve raporları görüntüler.
- editor: veri ekler ve günceller.
- admin: ek olarak kayıtları siler.

İlk yönetici hesabı, sunucu kimlik bilgileri ve kuralların yayımlanması için [canlıya geçiş rehberini](SECURITY_ROLLOUT.md) izleyin. Eski ortak parola ve anonim giriş akışı kaldırılmıştır. Hesaplar hazır olmadan yeni kuralları canlıya yayımlamayın.

## Veri kaynakları

Meydanlar, vardiyalar, izinler, kronik sorunlar ve raporlar Firestore'dan okunur. Yönetici başvuru göstergeleri src/data altındaki derlenmiş özetlerden gelir. Başvuru veri tarihi, vardiya planı tarihi ve son okuma zamanı ayrı gösterilir. Yeni vardiya yüklemek başvuru özetini güncellemez.

Başlıca koleksiyonlar: meydanlar, vardiyalar, personelIzinler, kronikSorunlar, meydanBasvurulari, meydanBasvuruStats, personelBasvuruOzetleri, meydanFaaliyetRaporlari ve operasyonelIcgoruler. Günlük notlar meydanların gunlukNotlar alt koleksiyonunda; parçalı raporlar chunks alt koleksiyonunda tutulur.

## AI servisi

Tarayıcı yalnızca VITE_AI_PROXY_URL (varsayılan /api/deepseek) üzerinden, oturum tokenıyla istek gönderir. DEEPSEEK_API_KEY sunucuda tutulur; istemciye doğrudan AI anahtarı gönderilmez. Yerel ve Vercel proxy aynı yetki doğrulamasını kullanır. Servis kullanılamadığında yönetici bülteni gerçek kayıtlardan hesaplanan özeti gösterir.

## Kontroller

```sh
npm run lint
npm run smoke:verify
npm run test:rules
```

smoke:verify derleme ve güvenilirlik testlerini çalıştırır. test:rules Java 17+ gerektirir; demo-syp-tests projesinde yerel Firestore/Storage emülatörlerini kullanır. Canlı veri okumaz veya değiştirmez.

Eski anonim bakım/import scriptleri yeni kurallarla yetkilendirilmez. Excel yükleme için yetkili panel akışını kullanın; scriptlerin geçiş sınırları ve doğrulama ayrıntıları [rehberde](SECURITY_ROLLOUT.md) açıklanmıştır.
