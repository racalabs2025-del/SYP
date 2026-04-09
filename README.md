# SYP - Saha Yonetim Paneli

Saha Yonetim Paneli, IBB saha ekipleri icin meydan gorunurlugu, vardiya takibi ve Excel tabanli veri yukleme akisini yoneten bir React + Vite uygulamasidir.

## Faz 1 Kapsami

- Mobil oncelikli ve kurumsal renklerle yenilenmis splash, login, dashboard ve meydan detay ekranlari
- Session tabanli yonetici girisi
- Firestore uzerinden meydan ve vardiya verisi okuma
- Excel dosyalarini tarayip DeepSeek yardimiyla vardiya listesine donusturen yukleme akisi
- Batch limitine uygun Firestore toplu yazma ve silme yardimcilari
- Node scriptleri icin tasinabilir env ve kaynak klasor destegi

## Kurulum

```bash
npm install
npm run dev
```

Tek komutla hem Vite hem AI proxy calistirmak icin:

```bash
npm run dev:full
```

AI import akisi icin ayri terminalde proxy sunucusunu calistirin:

```bash
npm run proxy:ai
```

## Ortam Degiskenleri

Istemci tarafinda Vite degiskenleri kullanilir:

```env
VITE_AI_PROXY_URL=/api/deepseek
VITE_ALLOW_CLIENT_DEEPSEEK=false
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Node scriptleri ayni degerleri process env veya kok `.env` dosyasindan okur.

Proxy sunucusu icin su degiskenlerden biri gerekir:

```env
DEEPSEEK_API_KEY=...
# veya gecis donemi icin
VITE_DEEPSEEK_API_KEY=...
```

Not: Firebase Authentication > Sign-in method altinda Anonymous secenegi acik olmali.

## Firestore Rules Deploy

Kronik sorun importu veya yonetim panelindeki yazma islemleri `permission-denied` hatasi veriyorsa canli projedeki Firestore kurallari bu repo ile senkron degildir.

Kurallari deploy etmek icin:

```bash
npx firebase-tools login
npx firebase-tools use <project-id>
npm run deploy:rules
```

Bu repo icinde [firestore.rules](firestore.rules) ve [storage.rules](storage.rules) dosyalari [firebase.json](firebase.json) uzerinden deploy edilir.

## Firestore Yapisi

### `meydanlar`

- `isim`: Kartta gosterilen kisa ad
- `tamAd`: Detay veya tooltip icin uzun ad

### `vardiyalar`

- `personelAdi`
- `meydanId`
- `tarih` (`YYYY-MM-DD`)
- `saatAraligi` (`HH:MM-HH:MM`)
- `vardiyaTipi`
- `createdAt`

## Komutlar

```bash
npm run dev
npm run build
npm run lint
```

Ek yardimci scriptler:

```bash
node scripts/test_ai.js
node scripts/test_excel.js C:/ornek/klasor
node scripts/bulk_import.js C:/ornek/klasor
CONFIRM_WIPE=true node scripts/wipe_vardiyalar.js
npm run seed:rapor
npm run proxy:ai
npm run assets:login:optimize
```

Ilk ornek faaliyet raporunu Firestore'a eklemek icin:

```bash
npm run seed:rapor
```

Komut varsayilan olarak kucuk bir PDF olusturur ve `meydanFaaliyetRaporlari/{docId}/chunks` formatinda yazar.
Istege bagli parametreler:

```bash
npm run seed:rapor -- --title="Nisan 2026 Faaliyet Raporu" --name="nisan-2026-faaliyet-raporu.pdf"
```

Kaynak klasor parametresi verilmezse scriptler `PLANLAR_DIR` ortam degiskenini, o da yoksa varsayilan klasoru kullanir.

## Bilinen Riskler

- Firebase Auth kullanilsa da istemci tarafli route kontrolu tek basina guvenlik saglamaz; Firestore security rules mutlaka aktif edilmelidir.
- `meydanFaaliyetRaporlari` ve altindaki `chunks` belgeleri icin uygun read/write rule olmadan rapor yukleme ve seed komutu `permission-denied` ile durur.
- DeepSeek cagrisi varsayilan olarak `VITE_AI_PROXY_URL` uzerinden yapilir. Proxy yoksa ve `VITE_ALLOW_CLIENT_DEEPSEEK=true` ise istemci fallback devreye girer; bu durumda API anahtari istemcide oldugu icin gizli kalmaz.
- `createdAt` olmayan eski vardiya kayitlari icin panel fallback okuma yapar; veri buyudukce gercek siralama icin tum kayitlarin timestamp ile yazilmasi onerilir.

## Faz 2 Onerisi

- Gercek kimlik dogrulama ve rol yonetimi
- AI import katmanini backend'e tasima
- Firestore sorgularini index destekli detayli filtrelere tasima
- Vardiya kayitlarina audit log ve olusturan kullanici bilgisi ekleme