# SYP erişim ve veri doğruluğu güncellemesi

11 Eylül 2026. Bu değişiklikler yerel çalışma kopyasında hazırlanmıştır; canlı Firebase veya Vercel yapılandırması değiştirilmemiştir.

## Roller

| Rol | Panel ve rapor okuma | Veri ekleme / güncelleme | Kayıt silme |
| --- | --- | --- | --- |
| `viewer` — Görüntüleyici | Evet | Hayır | Hayır |
| `editor` — Veri sorumlusu | Evet | Evet | Hayır |
| `admin` — Yönetici | Evet | Evet | Evet |

Giriş Firebase Email/Password ile yapılır. Rol, Firebase Admin SDK ile atanan `sypRole` özel yetki alanından alınır. Anonim veya rol atanmamış hesaplar kabul edilmez. Arayüz kontrollerinin yanı sıra Firestore ve Storage kuralları erişimi sınırlar. AI uçları Firebase ID token doğrulaması ve iptal edilmiş oturum kontrolü yapar; üç rol de AI özetlerini kullanabilir.

## Canlıya geçiş sırası

1. Firebase Authentication içinde Email/Password sağlayıcısını etkinleştirin. İlk yönetici hesabını oluşturun; kullanıcı UID'sini alın. Uygulamada herkese açık hesap oluşturma veya rol verme ekranı yoktur.
2. Güvenilir yönetim makinesinde Firebase Admin için Application Default Credentials veya çalışma alanı dışındaki bir servis hesabını gösteren `GOOGLE_APPLICATION_CREDENTIALS` kullanın. Sunucu proje kimliğini `FIREBASE_PROJECT_ID` ile belirtin. Kimlik dosyasını repoya koymayın.
3. İlk hesabın rolünü kontrol edip atayın:

   ```sh
   npm run auth:role -- USER_UID admin
   npm run auth:role -- USER_UID admin --apply
   ```

   İlk komut yalnızca doğrular. İkinci komut rolü yazar ve eski yenileme tokenlarını iptal eder. `editor`, `viewer` veya erişimi kaldırmak için `none` kullanılabilir. Diğer özel yetki alanları korunur. Kullanıcı tekrar giriş yapmalıdır. Firestore/Storage, önceden verilmiş ID tokenını süresi dolana kadar (yaklaşık bir saate kadar) kabul edebilir; API iptal kontrolünü her istekte yapar.

4. Vercel sunucu ortamında `DEEPSEEK_API_KEY`, `FIREBASE_PROJECT_ID` ve `FIREBASE_SERVICE_ACCOUNT_JSON` tanımlayın. Servis hesabının Firebase Auth kullanıcılarını okuyabilmesi gerekir; rol atama yetkisini mümkünse ayrı yönetim hesabında tutun. Bunlar `VITE_` öneki taşımamalıdır. Önceden tarayıcıya gönderilmiş AI anahtarlarını sağlayıcı panelinden yenileyin.
5. Önizleme dağıtımında yetkili hesapla giriş ve AI erişimini doğrulayın. Ardından aynı sürümün uygulamasını ve iki kural dosyasını koordineli olarak yayımlayın:

   ```sh
   npx firebase deploy --only firestore:rules,storage --project PROJECT_ID
   ```

   Yeni kurallar eski anonim istemcileri reddeder. İlk yönetici hesabı hazır olmadan kuralları yayımlamak mevcut kullanıcıları kilitler. `.vercelignore` sunucudaki doğrulama modüllerini dağıtıma dahil eder.
6. Yönetici, veri sorumlusu ve görüntüleyici hesaplarıyla okuma, yükleme ve silme davranışlarını canlıda kontrol edin.

Yerel AI proxy `.env` dosyasını okur (`npm run dev:full`). Sunucuya özgü değişkenler için `.env.example` dosyasına bakın. Eski anonim oturum açan `scripts/` içe aktarma ve bakım komutları yeni kurallarla yetki alamaz; bunları gevşek kurallarla çalıştırmayın. Güncel Excel yükleme akışı yetkili panel oturumunu kullanır. Bu sürüm eski bakım scriptlerini Admin SDK'ye taşımamaktadır.

## Veri tarihleri ve hesaplamalar

- Başvuru KPI'ları, raporlar ve bülten, derlenmiş başvuru özetinin `metadata.referenceDate` tarihini esas alır. Daha yeni bir vardiya yüklemesi başvuru özetini güncelmiş gibi göstermez.
- Başvuru veri tarihi, vardiya tarihi ve son Firestore okuma zamanı ayrı gösterilir. Yedi günden eski başvuru özeti için güncellik uyarısı vardır.
- Sıfır metrikler korunur. Eksik veri eski örnek sayılarla doldurulmaz; yaşlandırma yüzdeleri veri kümesinden hesaplanır.
- Bugünün vardiyası yoksa geçmişteki veya gelecekteki plan bugünün yerine gösterilmez.
- Bülten yalnızca toplu sayıları AI servisine iletir. Çevrimdışı özet gerçek kayıtlardan üretilir; örnek personel, başarı oranı veya doğrulanmamış risk yokluğu içermez.
- Derlenmiş başvuru ve personel JSON dosyaları hâlâ istemci paketindedir. Oturum kontrolü bu statik dosyaları gizli hale getirmez. Bu verilerin gizli tutulması gerekiyorsa ayrıca yetkili sunucu veri katmanına taşınmalıdır. Bu sürüm veri kaynağı mimarisini tamamen değiştirmez.

## Doğrulama

```sh
npm run lint
npm run smoke:verify
npm run test:rules
```

Kurallar testi yalnızca `demo-syp-tests` emülatör projesini kullanır; canlıya erişmez. Node 24 ve Java 17 ile doğrulanmıştır. Firebase CLI 14, mevcut Java 17 ortamıyla çalışması için geliştirme bağımlılığı olarak tutulur. İlk çalıştırmada emülatör dosyalarını indirir. Ek mevcut testler: karar destek, operasyon merkezi, ilçe/meydan ayrımı, dışa aktarım, vatandaş verisi sınırı ve terminoloji.

Uygulamanın derlenmesi canlıdaki hesap, yetki veya sunucu kimlik bilgilerinin hazır olduğunu kanıtlamaz. Canlı geçiş adımları tamamlanmadan güvenlik değişiklikleri mevcut yayına uygulanmış sayılmaz.

## Referanslar

- [Firebase özel yetki alanları](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firebase ID token doğrulama](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Firebase oturum iptali](https://firebase.google.com/docs/auth/admin/manage-sessions)
- [Firestore kurallarını emülatörde test etme](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
