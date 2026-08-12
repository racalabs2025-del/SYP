 m# 📋 İBB Başvuru İçe Aktarma Rehberi

## Hızlı Başlangıç

```bash
# 1. Testi çalıştır (Firestore'a yazmaz)
npm run import:basvurular -- --dry-run

# 2. Gerçek içe aktarımı yap (Firestore'a yazar)
npm run import:basvurular

# 3. DeepSeek API normalizasyonu ile içe aktarım (İsteğe bağlı, yavaş)
npm run import:basvurular -- --with-normalization
```

---

## 📊 Contents

### Dosya Depolama
- **Excel**: `basvurudetaylar.xlsx` (12.094 başvuru kaydı)
- **Import Script**: `scripts/import_basvurular.mjs`
- **Normalizer Service**: `src/service/deepseekTopicNormalizer.js`

### Firestore Koleksiyonları
```
✓ meydanBasvurulari     — 12.094 başvuru dokümanı
✓ meydanBasvuruStats    — 39 meydan için toplama istatistiği
```

### Başvuru Veri Yapısı
```javascript
{
  meydanId: "uskudar",          // Meydan ID
  basvuruNo: "12345-2026",      // Başvuru numarası
  ilce: "ÜSKÜDAR",              // İlçe adı
  konu: "BAKIM ONARIM",         // Ana konu
  altKonu: "Yol Bakımı",        // Alt konu
  aciklama: "Cadde çukuru...",  // Açıklama metni
  ilgiliOlduguBirim: "Park",    // İlgili birim
  durum: "Kapandı",             // Başvuru durumu
  basvuruSahibi: "Ahmet Yılmaz",// Başvuru sahibi
  tarih: "2026-03-15",          // Oluşturulma tarihi
  ay: "2026-03",                // Ay (YYYY-MM)
  yil: 2026,                    // Yıl
  
  // Normalizasyon alanları (opsiyonel)
  normalizedKonu: "Yol Bakım-Onarım",  // İçeriği normalize edilmiş konu
  category: "BAKIM_ONARIM",            // Standart kategori
  konuGuveni: 0.85                     // Güvenirlik skoru (0-1)
}
```

---

## ⚙️ Yapılandırma

### Environment Variables
```env
# .env dosyasında (varsa)
VITE_DEEPSEEK_API_KEY=sk-xxxx...

# Varsayılan: lkalu döneminde kullanılmaz (fallback kategorilendirme)
# --with-normalization flag'i ile etkinleştirilir
```

###Firebase Rules
```
✓ Dosya: firestore.rules
✓ Durum: Deploy edilmiş
✓ Anonymo auth: Aktif
```

---

## 🚀 Production İçin Preparation Checklist

- [x] **Dry-run test**: `npm run import:basvurular -- --dry-run` ✅
- [  ] **Kota kontrol**: Firebase Free Tier'da 20.000 write/gün limit
- [  ] **Batch sizing**: 250 doc/batch + 2 sn delay (quota güvenli)
- [x] **Error handling**: API timeouts → fallback kategorilendirme
- [x] **Data validation**: Excel → Firestore dönüşümü
- [  ] **Firestore indexes**: Composite indexes konfigüre edilmiş
- [ ] **Backup**: Import öncesi Firebase exor
- [ ] **Monitoring**: meydanBasvuruStats doğruluğu kontrol

---

## 📈 İçe Aktarma Süresi Tahmini

### Konfigürasyon: 250 doc/batch + 2 sn delay
| Aşama | Kayıt | Batch | Süre |
|-------|-------|-------|------|
| Transform | 12.094 | — | ~1 sn |
| Category | 12.094 | — | ~2 sn |
| Write | 12.094 | 49 | ~98 sn (1.6 min) |
| Stats | 39 | 1 | ~1 sn |
| **Toplam** | — | — | **~2 dakika** |

> ⚠️ **Not**: Firestore free tier'da quota problems öngörülüyorsa, batch size'ı 100'e düşürür,delay'i 3-5 sn'ye çıkarabilirsiniz.

---

## 🔍 Kategori Türleri (Fallback)

Normalizasyon olmadan kullanılan basit kategoriler:

```
BAKIM_ONARIM        — Yol, asfalt, kaldırım, tornalar, çöp
AYDINLATMA          — Aydınlatma, lamba, ışık
VE_SU_KANAL         — Su, kanal (Fallback: DIGER)
PEYZAJ_YESIL_ALAN   — Park, bahçe, ağaç, yeşil alan
(Diğer)             — DIGER (varsayılan)
```

---

## 🛠️ Sorun Çözme

### Problem: "Quota exceeded" hatası alıyorum
**Çözüm**: 
1. Batch size'ı azaltın (499 → 100)
2. Delay'i artırın (2000ms → 5000ms)
3. İmport dosyalı kısım kısım yapın (--file flag'i ile)

### Problem: API'ye bağlanılamıyor
**Çözüm**: 
- Normalizasyon devre dışı (varsayılan): sorun yok ✓
- `--with-normalization` kullanıyorsanız, `--dry-run` ile test edin

### Problem: Bazı başvuruların kategorisi hatalı
**Çözüm**: 
- Fallback kategorisi yanlışsa, özel mapping kuralları ekleyin
- `src/service/deepseekTopicNormalizer.js` içinde keyword'ler güncelleyin

---

##  📚 Komut Seçenekleri

```bash
# Temel kullanım
npm run import:basvurular

# Sadece analiz (yazma yok)
npm run import:basvurular -- --dry-run

# Farklı Excel dosyası
npm run import:basvurular -- --file=dosya2.xlsx

# DeepSeek API kullanarak normalizasyon (yavaş, 30+ dakika)
npm run import:basvurular -- --with-normalization

# Kombinasyon: Farklı dosya + test
npm run import:basvurular -- --file=dosya2.xlsx --dry-run
```

---

## 📊 İstatistik Doğrulaması

İmport tamamlandıktan sonra kontrol edin:

```javascript
// Firebase Console'da
db.collection('meydanBasvuruStats').doc('uskudar').get()
// Çıktı: { toplamBasvuru: 1913, konuDagilimi: {...}, categoryDagilimi: {...} }
```

**Beklenen Meydanlar**: 39 (43 ilçe + Adalar)
**Toplam Başvurular**: 12.094

---

## ✨ UI'da Görüntüleme

Meydan detay sayfasında:
- ✅ Filtreler (Ay, Durum, **Kategori**)
- ✅ Konu dağılımı (8 top)
- ✅ **Kategori dağılımı** (Normalized)
- ✅ Aylık trend
- ✅ Açık kayıt yaş dağılımı
- ✅ Başvuru listesi (detaylı + category/confidence gösten)

---

## 🔐 Production Deployment

### Adımlar
1. ✅ Dry-run test: `npm run import:basvurular -- --dry-run`
2. ✅ Build: `npm run build`
3. ✅ Deploy: `firebase deploy --only firestore`
4. ✅ İçe aktarım: `npm run import:basvurular`
5. ✅ Doğrulama: Firebase Console'da istatistikler kontrol

### Firebase Optimization
```bash
# Indexes deploy ( belirli sorgular için opsiyonel)
firebase deploy --only firestore:indexes

# Rules deploy
firebase deploy --only firestore:rules
```

---

## 📝 Notes

- **Fallback Kategorileri**: Yeterli çoğunluğu doğru kategorize ediliyor (%80+ güvenirlik beklenen)
- **DeepSeek API**: Opsiyonel. olmadan import hızlı ve stabil çalışır.
iyonu devre dışı bıraktık çünkü API rate limiting problemleri yaşadık.
- **Veri Bütün lüğü**: Tüm 12.094 kayıt kontrol edildi, geçersiz kayıtlar (eksik ilçe/başvuru no) otomatik atlanır
- **Firestore Limit**: Free tier 20.000 write/gün. İmport ~12.100 write = güvenli margin

---

## Sorular?

- Firebase configurasyon: `firebase.json`, `firebaseconfig.js` kontrol edin
- Script hataları: `scripts/shared/env.js` environment değişkenlerini kontrol edin
- Veri işleme: `src/utils/meydanNormalization.js` ayrıntılarına bakın
