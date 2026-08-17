# SYP - Saha Yönetim Paneli
# VATANDAŞ KİŞİSEL VERİLERİ GİZLİLİK VE ANONİMLEŞTİRME DENETİM RAPORU (PRIVACY AUDIT)

**Tarih:** 17 Ağustos 2026  
**Denetim Tipi:** %100 Read-Only Privacy Audit (Hiçbir veri, kod veya dosya değiştirilmemiştir)  
**Kapsam:** 11.367 Ham Excel Satırı, 11.268 Unique Başvuru, Firestore Şemaları, Compiled JSON'lar, AI Promptları ve Export Modülleri

---

## 1. Kapsam ve Temel İlke Ayrımı

* **İBB Saha Personeli Bilgileri (KAPSAM DIŞI - `KEEP`):** Personel adı, soyadı, kurumsal unvanı, nöbet/vardiya saatleri, çalışma meydanları ve görev kayıtları kurum içi operasyonel yönetim kapsamında korunur.
* **Vatandaş / Başvuru Sahibi Kişisel Verileri (DENETİM KAPSAMI):** Vatandaşların ad-soyadı, iletişim bilgileri, T.C. kimlik numaraları, açık adresleri, plakaları ve serbest metinlerdeki kişisel beyanları denetlenmiştir.

---

## 2. Tespit Edilen Vatandaş Kişisel Veri Türleri ve Dağılımı

11.367 ham kayıt ve ilişkili tüm veri yüzeyleri taranmıştır:

| Kişisel Veri Türü | Bulunduğu Alan / Kolon | Eşleşen Kayıt Adedi | Veri Yüzeyi / Dosyalar | Risk Seviyesi |
| :--- | :--- | :---: | :--- | :---: |
| **Vatandaş Adı ve Soyadı** | `Başvuru Sahibi`, `Vatandaş` | **11.367 (%100)** | Ham Excel Dosyaları (`Buyuk_guncelleme/*.xlsx`, `basvurudetaylar.xlsx`) | **P1 YÜKSEK** *(Ham Dosyalarda)* |
| **Cep / Sabit Telefon Numarası** | `Açıklama`, `Özet` (Serbest Metin) | **4.925 (%43.3)** | Ham Excel, Firestore `aciklama`, `compiledExecutiveBasvurular.json` | **P0 KRİTİK** *(Frontend Cache)* |
| **Açık Kapı / Daire / Bina No** | `Açıklama`, `Özet` (Serbest Metin) | **346 (%3.0)** | Ham Excel, Firestore `aciklama`, `compiledExecutiveBasvurular.json` | **P1 YÜKSEK** |
| **Araç Plakası** | `Açıklama`, `Özet` (Serbest Metin) | **29 (%0.25)** | Ham Excel, Firestore `aciklama` | **P2 ORTA** |
| **T.C. Kimlik Numarası (Algoritmik Doğrulanmış)** | `Açıklama`, `Özet` (Serbest Metin) | **14 (%0.12)** | Ham Excel, Firestore `aciklama` | **P0 KRİTİK** |
| **E-Posta Adresi** | `Açıklama`, `Özet` (Serbest Metin) | **5 (%0.04)** | Ham Excel, Firestore `aciklama` | **P2 ORTA** |

---

## 3. Hassas ve Özel Nitelikli Veri Taraması (KVKK Madde 6 Kapsamı)

Serbest metin (`Açıklama` ve `Özet`) alanlarında vatandaşların sağlık, engellilik veya adli durumlarına ilişkin anahtar kelime eşleşmeleri:

* **Hassas / Özel Nitelikli İfade İçeren Kayıt Sayısı:** **667 Kayıt**
* **Konu Dağılımı:**
  - Engelli rampası, yürüme engeli, otizm park talepleri
  - Diyaliz / hasta nakil güzergahı talepleri
  - Adli / güvenlik / zabıta şikayetleri
* **Durum:** Bu ifadeler vatandaşların kişisel sağlık ve engellilik durumlarını serbest metinde beyan etmesinden kaynaklanmaktadır.

---

## 4. Veri Yüzeyleri Güvenlik Matrisi

| Veri Yüzeyi | Vatandaş PII Durumu | Tespit Edilen Alanlar | Güvenlik / Risk Durumu |
| :--- | :---: | :--- | :--- |
| **1. AI Yönetici Bülteni (`AIDailyExecutiveSummary.jsx`)** | 🛡️ **TEMİZ** | Yalnızca sayısal aggregate toplamlar (`totalUnresolved`, `totalSlaBreached`, ilçe isimleri) gönderilir. | **GÜVENLİ (Sıfır Sızıntı)** |
| **2. PDF Brifing Çıktısı (`pdfExport.js`)** | 🛡️ **TEMİZ** | Başvuru No, İlçe, Konu, SLA ve Sayısal tablolar yer alır. Açıklama veya vatandaş ismi YOKTUR. | **GÜVENLİ** |
| **3. Excel Dışa Aktarma (`excelExport.js`)** | 🛡️ **TEMİZ** | `Oncelikli_Isler` sayfasında yalnızca `Başvuru No`, `İlçe`, `Mahalle`, `Konu`, `Durum` export edilir. Açıklama YOKTUR. | **GÜVENLİ** |
| **4. Frontend Bundle / Compiled JSON (`compiledExecutiveBasvurular.json`)** | ⚠️ **RİSKLİ** | 232 kapanmamış başvurunun ham `aciklama` alanı JSON içine gömülüdür; telefon/adres içerebilir. | **P0 KRİTİK (Temizlenmeli)** |
| **5. Firestore Koleksiyonu (`meydanBasvurulari`)** | ⚠️ **RİSKLİ** | Ham `aciklama` alanı Firestore dokümanlarında mevcuttur. | **P1 YÜKSEK (Redaction Önerilir)** |
| **6. Ham Excel Kaynakları (`Buyuk_guncelleme/`)** | ⚠️ **RİSKLİ** | `Başvuru Sahibi` (Ad-Soyad) kolonu ve ham açıklamalar yer alır. | **P1 YÜKSEK (Repo Dışına Alınmalı)** |

---

## 5. `basvuruNo` Alanının Değerlendirilmesi

* **Format:** `1-70285501659`
* **Nitelik:** İBB Beyazmasa / CRM sisteminin ürettiği kurumsal süreç takip anahtarıdır.
* **Değerlendirme:** Doğrudan vatandaş kimliğini (T.C. No, ad-soyad) ifşa etmez. Operasyonel takip, mükerrerlik engelleme ve İBB birimleri arası koordinasyon için **korunmalıdır (`KEEP`)**.

---

## 6. Risk Derecelendirmesi (Prioritization)

### 🔴 P0 KRİTİK (Acil Müdahale Gerektirenler)
1. **Frontend Compiled JSON Temizliği:** `src/data/compiledExecutiveBasvurular.json` dosyasından ham `aciklama` alanının kaldırılması veya telefon/TC/adres regex ile redact edilmesi.
2. **Geçerli T.C. Kimlik ve Telefon Numaraları:** 14 kayıttaki gerçek TCKN ve 4.925 kayıttaki telefon numarasının serbest metinlerden maskelenmesi (`REDACT`).

### 🟠 P1 YÜKSEK (Yönetimsel ve Mimari Önlemler)
1. **Ham Excel Dosyalarının Git / Deployment Dışına Alınması:** `Buyuk_guncelleme/` ve `basvurudetaylar.xlsx` dosyalarının `.gitignore` ve `.vercelignore` kapsamına alınarak prodüksiyon ortamından izole edilmesi.
2. **Firestore `aciklama` Redaction:** Firestore'daki başvurularda açıklama alanının maskelenmiş haliyle güncellenmesi.

### 🟡 P2 ORTA (Standart İyileştirmeler)
1. **Araç Plakası ve E-Posta Maskelemesi:** 29 plaka ve 5 e-posta kaydının regex filtresiyle `[REDACTED_PLATE]` ve `[REDACTED_EMAIL]` formatına getirilmesi.

---

## 7. Önerilen Alan Bazlı Aksiyon Planı

| Alan / Kolon Adı | Mevcut Durum | Önerilen Aksiyon | Rasyonel |
| :--- | :--- | :---: | :--- |
| **`Başvuru Sahibi`** | Ham Excel'de %100 mevcut | **`REMOVE`** | SYP karar destek analizinde vatandaş ismine ihtiyaç yoktur. |
| **`Açıklama` / `Özet`** | Telefon, adres, TCKN içeriyor | **`REDACT` / `REMOVE`** | Frontend compiled JSON'dan kaldırılmalı; Firestore'da maskelenmeli. |
| **`Başvuru No`** | Kurumsal referans | **`KEEP`** | Operasyonel tekilleştirme ve SLA takibi için zorunludur. |
| **`İlçe` & `Mahalle`** | Coğrafi alan | **`KEEP`** | Bölgesel yoğunluk ve harita analizi için zorunludur. |
| **`Konu` & `Alt Konu`** | Hizmet kategorisi | **`KEEP`** | İSKİ, Yol Bakım, Zabıta sınıflandırması için gereklidir. |
| **`Taahhüt Tarihi` & `Durum`** | SLA ve süreç verisi | **`KEEP`** | Karar destek sistemi için temel metriktir. |
| **`Personel Adı` & `Vardiya`** | Saha personeli verisi | **`KEEP`** | Kurum içi operasyonel yönetim ve nöbet takibi içindir. |

---

## 8. Önerilen Temizleme Sıralaması (Sonraki Faz İçin Yol Haritası)

1. **Adım 1:** `compiledExecutiveBasvurular.json` derleyicisinden `aciklama` alanını kaldırarak frontend bundle'ını tamamen PII-free hale getirmek.
2. **Adım 2:** Regex tabanlı otomatik PII Redaction fonksiyonu (`anonymizeText`) oluşturmak (TC, Telefon, E-posta, Plaka, Kapı No maskeleme).
3. **Adım 3:** Ham Excel dosyalarını (`Buyuk_guncelleme/`, `basvurudetaylar.xlsx`) `.gitignore` ve `.vercelignore` dosyalarına eklemek.
4. **Adım 4:** Firestore'daki mevcut `aciklama` alanlarını güvenli bir script ile redact etmek.

---

> **ÖNEMLİ NOT:** Bu rapor tamamen salt-okunur (read-only) analizle üretilmiştir. Hiçbir veri, kod veya dosya değiştirilmemiştir. Vatandaş kişisel verileri rapora kopyalanmamış; yalnızca istatistiksel frekanslar belgelenmiştir.
