# 🚀 SYP Başvuru İçe Aktarma & Yayına Alma Rehberi

## ✨ Özet

Bu rehber, **12.094 İBB başvuru kaydının** Firestore'a aktarılması ve uygulamanın production'a hazırlanması için adım adım talimatlar sağlar.

- ✅ **Veri**: 12.094 başvuru + 39 meydan (39 ilçe)
- ✅ **Sistem**: DeepSeek AI + fallback kategorilendirme
- ✅ **UI**: Başvuru filtreleri, kategoriler, grafikler
- ✅ **Hız**: ~2-3 dakika (fallback mode)
- ✅ **Güvenlik**: Firestore free tier uyumlu (quota safe)

---

## 🎯 Hızlı Başlangıç (Windows)

### Otomatik Deployment
```batch
# 1. production_deploy.bat dosyasını çift tıkla VEYA CMD'te çalıştır:
production_deploy.bat

# Bu script:
#   ✓ npm run build
#   ✓ npm run deploy:rules
#   ✓ npm run import:basvurular -- --dry-run (test)
#   ✓ npm run import:basvurular (real)
#   ✓ Doğrulama adımlarını gösterir
```

### Manuel Adımlar
```powershell
# Terminal aç (Ctrl+Shift+~ VS Code'da)

# 1. Test: Firestore'a yazma yok, sadece analiz
npm run import:basvurular -- --dry-run

# Beklenen çıktı:
#   ============================================================
#   İBB Meydan Başvuru İçe Aktarıcı
#   ⚠️  DRY-RUN modu aktif — Firestore'a yazılmayacak
#   ============================================================
#   ...
#   ✅ Dry-run tamamlandı. Firestore'a yazılmadı.

# 2. Production: Gerçek içe aktarım (2-3 dakika sürer)
npm run import:basvurular

# Beklenen çıktı:
#   ...
#   📝 meydanBasvurulari — 12094 kayıt yazılıyor...
#   meydanBasvurulari: 1/25 batch tamamlandı (250/12094)
#   meydanBasvurulari: 2/25 batch tamamlandı (500/12094)
#   ...
#   meydanBasvuruStats — istatistikler yazılıyor...
#   ✅ İçe aktarma tamamlandı!
#   meydanBasvurulari : 12094 kayıt
#   meydanBasvuruStats: 39 meydan
```

---

## 📋 Yapılandırma

### 1. Environment Setup
```bash
# .env dosyası (projeye zaten var)
VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx
```

### 2. Firebase Rules (Deploy Edilmiş Durumda)
```bash
# Rules aktif ve anonim auth yapılandırılmış
npm run deploy:rules  # (Güncellemek istersem)
```

### 3. Firestore Collections (Otomatik Oluşturulur)
```
✓ meydanBasvurulari     — 12.094 kayıt (başvuru detayları)
✓ meydanBasvuruStats    — 39 kayıt (meydan istatistikleri)
```

---

## 📊 Veri Yapısı

### meydanBasvurulari (Tek Başvuru)
```javascript
{
  meydanId: "uskudar",
  basvuruNo: "12345-2026-AB",
  konu: "BAKIM ONARIM",
  altKonu: "Yol Bakımı",
  aciklama: "Cadde çukuru vardır...",
  durum: "Kapandı",
  ilgiliOlduguBirim: "Park ve Bahçeler",
  basvuruSahibi: "Ahmet Y.",
  tarih: "2026-03-15",
  ay: "2026-03",
  yil: 2026,
  
  // Kategorilendirme
  category: "BAKIM_ONARIM",          // Standar kategori
  normalizedKonu: "Yol Bakım-Onarım", // İnsan okunaklı
  konuGuveni: 0.85                     // Güvenirlik (0-1)
}
```

### meydanBasvuruStats (Meydan Özeti)
```javascript
{
  meydanId: "uskudar",
  toplamBasvuru: 1913,
  konuDagilimi: { "BAKIM ONARIM": 456, "AYDINLATMA": 234, ... },
  categoryDagilimi: { "BAKIM_ONARIM": 456, "AYDINLATMA": 234, ... },
  durumDagilimi: { "Kapandı": 800, "Beklemede": 500, ... },
  aylikDagilim: { "2026-03": 156, "2026-02": 234, ... }
}
```

---

## 🔄 İçe Aktarım Akışı

### Aşama 1: Veri Okuma
```
Excel file (basvurudetaylar.xlsx)
    ↓
12.094 satır oku
    ↓
Geçersiz kayıtları (eksik ilçe/no) filtrele
    ↓
→ 12.094 geçerli kayıt
```

### Aşama 2: Kategorilendirme (Fallback)
```
Her başvuru için:
  konu → BAKIM_ONARIM / AYDINLATMA / VE_SU_KANAL / PEYZAJ_YESIL_ALAN / DIGER
  confidence = 0.5 (medium, fallback olduğu için)

Örn:
  "YOL BAKIM" → BAKIM_ONARIM
  "AYDINLATMA SORUNU" → AYDINLATMA
  "PARK VE BAHÇE" → PEYZAJ_YESIL_ALAN
  "DİĞER" → DIGER
```

### Aşama 3: Batch Writing (Quota Safe)
```
12.094 kayıt → 49 batch (250 doc/batch)
   batch 1  (250 doc) → write → delay 2s
   batch 2  (250 doc) → write → delay 2s
   batch 3  (250 doc) → write → delay 2s
   ...
   batch 49 (194 doc) → write → done

Total: ~98 saniye = 1.6 dakika
```

### Aşama 4: İstatistik Oluşturma
```
Tüm 12.094 kayıttan özet:
  Per meydanId:
    {
      toplamBasvuru,
      konuDagilimi (10+ konu),
      categoryDagilimi (11 kategori),
      durumDagilimi (5+ durum),
      aylikDagilim (12-24 ay)
    }

→ 39 meydan özeti Firestore'a yazıl
```

---

## 🎮 UI'da Kullanım

### Meydan Detay Sayfasında
```
┌─ BAŞVURU GÜNDEMİ ──────────────────────────┐
│                                             │
│ Özet Kartları:                             │
│  ├─ Toplam Başvuru: 1913                  │
│  ├─ Kapandı: 800                          │
│  └─ Beklemede: 500                        │
│                                             │
│ Filtreler:                                 │
│  ├─ Ay: [2026-03 ▼]                      │
│  ├─ Durum: [Kapandı ▼]                   │
│  ├─ Kategori: [BAKIM_ONARIM ▼]  ← NEW! │
│  └─ Ara: [Konu/Açıklama                 │
│                                             │
│ Konu Dağılımı (Bar Chart)                 │
│  ├─ BAKIM ONARIM:        ▓▓▓▓▓ 456      │
│  ├─ AYDINLATMA:          ▓▓▓ 234        │
│  └─ ... (top 8)                          │
│                                             │
│ Kategori Dağılımı (Normalized) ← NEW!    │
│  ├─ BAKIM_ONARIM:        ▓▓▓▓▓ 456      │
│  ├─ AYDINLATMA:          ▓▓▓ 234        │
│  └─ ... (all 11 categories)              │
│                                             │
│ Aylık Trend (Line Chart)                  │
│  └─ Graph                                 │
│                                             │
│ Açık Kayıt Yaş Dağılımı                  │
│  ├─ 0-3 gün:  42                        │
│  ├─ 4-7 gün:  89                        │
│  └─ ...                                  │
│                                              │
│ Başvuru Listesi:                          │
│  └─ [expandable items with category info] │
│                                             │
└─────────────────────────────────────────────┘
```

### Başvuru Detayma (İçe Açıldığında)
```
[Detay Kart]
Alt Konu: Yol Bakımı
Kategori: BAKIM_ONARIM (85%)      ← Yeni!
Normalized: Yol Bakım-Onarım      ← Yeni!
Başvuru Sahibi: Ahmet Y.
Açıklama: Deniz Caddesi, çukur...
İlgili Birim: Park ve Bahçeler
Başvuru No: 12345-2026-AB
```

---

## ⚙️ İleri Yapılandırma

### Eğer Batch Quota Hatası Alırsan

**Sorun**: `RESOURCE_EXHAUSTED: Quota exceeded`

**Çözüm**: `scripts/import_basvurular.mjs` dosyasında değiştirleri:
```javascript
// Satır ~48-49
const BATCH_SIZE = 100;        // 250'den 100'e düşür
const BATCH_DELAY_MS = 5000;   // 2000'den 5000'e artır

// Sonra tekrar çalıştır:
npm run import:basvurular
```

### DeepSeek API Kullanmak (Opsiyonel, Yavaş)

**Not**: Bu mod çok yavaş (30+ dakika). Normalde gerekli değil.

```bash
# API normalizasyonu ile:
npm run import:basvurular -- --with-normalization

# Beklenen sonuçlar:
# - Daha yüksek confidence skoru (0.85+ vs 0.5)
# - Daha iyi kategorilendirme
# - Much longer wait time (30+ min)
```

---

## 🔍 Doğrulama

### Veriler İçe Aktarıldı mı?

```javascript
// Firebase Console → Firestore → Console aç

// Kontrol 1: Başvuru sayısı
db.collection('meydanBasvurulari').count().get().then(snap => 
  console.log(snap.data().count) // 12094 beklenen
)

// Kontrol 2: Meydanlar
db.collection('meydanBasvuruStats').get().then(snap => 
  console.log(`${snap.size} meydanlar`) // 39 beklenen
)

// Kontrol 3: Kategori dağılımı
db.collection('meydanBasvuruStats').doc('uskudar').get().then(doc =>
  console.log(doc.data().categoryDagilimi)
  // { BAKIM_ONARIM: 456, AYDINLATMA: 234, ... }
)
```

### UI'da Test

```
1. npm run dev (geliştirme sunucusu)
2. Şehir arayüzüne git
3. "Uskudar" seç (en büyük meydan)
4. Başvuru Gündemi panelini açınca görmeli:
   ✓ 1913 toplam başvuru
   ✓ Kategori filtreleme çalışıyor
   ✓ Kategori dağılım grafiği görünüyor
   ✓ Başvuru listesinde category + confidence alan var
```

---

## ⚠️ Sık Sorun & Çözüm

| Sorun | Sebep | Çözüm |
|-------|-------|-------|
| **Build başarısız** | Node modules eksik | `npm install` |
| **Firebase auth hatası** | Anonymous auth kapalı | Firebase Console → Kimlik Doğrulama → Anonymous aktif yap |
| **Quota exceeded hatası** | Çok hızlı writes | Batch size düşür (499 → 100), delay artır (2s → 5s) |
| **Kategoriler hatalı** | Fallback anahtar sözcükleri eksik | `src/service/deepseekTopicNormalizer.js` keyword map güncelle |
| **UI'da başvurular görülmüyor** | Firestore veri yok | `npm run import:basvurular` çalıştır |
| **Dry-run başarılı, import başarısız** | Firebase connectivity issue | Firestore reachability kontrol et (VPN/proxy sorunu olabilir) |

---

##  🎓 Referans

### Proje Dosyaları
- `scripts/import_basvurular.mjs` — Ana import script
- `src/service/deepseekTopicNormalizer.js` — Kategorilendirme
- `src/pages/MeydanDetail.jsx` — UI bileşenleri
- `firestore.rules` — Güvenlik kuralları
- `.env` — API anahtarları

### Komutlar
```bash
npm run import:basvurular                      # Gerçek import
npm run import:basvurular -- --dry-run         # Test (yazma yok)
npm run import:basvurular -- --with-normalization  # API kullanı
npm run build                                   # Production build
npm run deploy:rules                            # Rules update
npm run dev                                     # Dev server
```

### Firestore Limitleri (Free Tier)
```
Günlük:
  - 20.000 writes  (12.094 import = %60)
  - 50.000 reads
  - 1 GB storage

Bu import rahat geçer. Ancak test import + gerçek import = 24K writes
→ Limit yakınında kalmıyor, güvenli.
```

---

## 📞 Desteğe İhtiyacın Varsa

1. **Build hatası**: `npm install` çalıştır, cache temizle
2. **Firebase Issues**: Firebase Console → Project Settings → API Credentials kontrol
3. **Import hatası**: `--dry-run` ile test et, hatayı okU
4. **Kategori sorunları**: `src/service/deepseekTopicNormalizer.js` keyword map
5. **UI Hataları**: Browser console (F12) → Network tab → Firestore requests

---

## ✅ Production Checklist

- [ ] Dry-run test başarılı
- [ ] Excel dosyası (basvurudetaylar.xlsx) mevcut
- [ ] .env dosyasında VITE_DEEPSEEK_API_KEY var (opsiyonel)
- [ ] Firebase console erişilebilir
- [ ] `npm run build` başarılı
- [ ] `npm run import:basvurular` çalıştır
- [ ] Firebase Console'da meydanBasvurulari (12.094 doc) kontrol et
- [ ] Firebase Console'da meydanBasvuruStats (39 doc) kontrol et
- [ ] UI'da başvuru filtreleri çalışıyor
- [ ] Kategori filter seçenekleri görünüyor
- [ ] Application tümü yayına alınmış

---

**Son Güncelleme**: Nisan 7, 2026  
**Versiyon**: 1.0  
**Durum**: ✅ Production Ready
