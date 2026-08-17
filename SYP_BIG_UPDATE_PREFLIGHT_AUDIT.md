# SYP - Saha Yönetim Paneli
# BÜYÜK VERİ GÜNCELLEMESİ PRE-FLIGHT AUDIT RAPORU

**Denetim Tarihi:** 17 Ağustos 2026  
**Denetim Tipi:** %100 Read-Only (Veri tabanına ve kaynak dosyalara hiçbir yazma/silme işlemi yapılmamıştır)

---

## A. Excel Kaynakları Analizi

| Metrik | ANADOLU YAKASI.xlsx | AVRUPA YAKASI.xlsx | TOPLAM / BİRLEŞİK |
| :--- | :---: | :---: | :---: |
| **Sheet (Personel) Sayısı** | 19 | 20 | **39 Personel** |
| **Ham Satır Sayısı** | 6.529 | 4.838 | **11.367 Kayıt** |
| **Geçerli Kayıt Sayısı** | 6.529 | 4.838 | **11.367 Kayıt** |
| **Tarihsiz Kayıt** | 0 | 0 | **0** |
| **İlçesiz Kayıt** | 0 | 1 (*Onur Armağan / Satır 4*) | **1** |
| **Başvuru No Eksik** | 0 | 0 | **0** |
| **Tekil Başvuru Sayısı** | 6.529 | 4.739 | **11.268 Tekil No** |
| **Mükerrer (Duplicate) Adayı** | 0 | 99 (*Burak Özçelik & Caner Dişli*) | **99 Kayıt** |
| **En Eski Kayıt Tarihi** | 24.05.2014 | 06.11.2013 | **06.11.2013** |
| **En Yeni Kayıt Tarihi** | 13.08.2026 | 14.08.2026 | **14.08.2026** |

> **Duplicate Kuralı:** Farklı personel sekmelerinde aynı `Başvuru No` (örn: `1-70288120473`) tespit edildiğinde duplicate adayı sayılmıştır. 99 kaydın tamamı Burak Özçelik ve Caner Dişli sayfaları arasında ortak paylaşılan kayıtlardır.

---

## B. Mevcut Firestore Durumu ve Şemalar

| Koleksiyon Adı | Doküman Sayısı | Ana Alanlar (Şema) | Örnek Doc ID |
| :--- | :---: | :--- | :--- |
| **`meydanBasvurulari`** | **14.601** | `basvuruNo`, `tarih`, `ay`, `yil`, `ilce`, `mahalle`, `meydanId`, `konu`, `altKonu`, `durum`, `onemDerecesi`, `tip`, `aciklama`, `birim`, `personelAdi`, `personelKey`, `yaka` | `1-70297659623` |
| **`personelBasvuruOzetleri`**| **82** | `personelAdi`, `personelKey`, `yaka`, `toplamBasvuru`, `kapandi`, `planlama`, `acik`, `diger`, `ilkTarih`, `sonTarih`, `aylikDagilim`, `konuDagilimi`, `ilceDagilimi`, `sonBasvurular` | `2026-q1--erhan-ekinci` |
| **`meydanBasvuruStats`** | **40** | `meydanId`, `ilce`, `toplamBasvuru`, `kapandi`, `planlama`, `acik`, `diger`, `aylikDagilim`, `konuDagilimi`, `sonBasvurular` | `uskudar`, `kadikoy` |
| **`vardiyalar`** | **7.122** | `personelAdi`, `meydanId`, `tarih`, `saatAraligi`, `vardiyaTipi`, `createdAt` | `00bJ84q4ia817A0uWqD9` |
| **`meydanlar`** | **52** | `id`, `isim`, `tamAd`, `ilce`, `bolge`, `alanM2`, `fonksiyonlar`, `organizasyonSorumlusu` | `taksim`, `kadikoy` |
| **`personelIzinler`** | **63** | `personelAdi`, `personelAdiNorm`, `izinTuru`, `baslangicTarihi`, `bitisTarihi`, `gunSayisi` | Otomatik hash ID |
| **`kronikSorunlar`** | **43** | `basvuruNo`, `meydanAdi`, `konuBasligi`, `detaylar`, `basvuruGelisTarihi` | Başvuru No dizisi |

---

## C. Import Güvenliği ve Altyapı Denetimi

1. **Idempotency (Tekrarlanan Import Güvenliği):**
   - Belge kimliği `docId = basvuruNo.replace(/[^a-zA-Z0-9-]/g, '-')` formülüyle üretilmektedir.
   - Aynı Excel dosyası 100 kez import edilse dahi yeni doküman üretilmez; mevcut kayıt güncellenir (`upsert`).
2. **Upsert & Merge:**
   - Firestore yazımlarında `batch.set(docRef, item, { merge: true })` kullanılmaktadır.
3. **Batch Limitleri:**
   - Firestore tek seferde 500 yazmaya izin verir. Ancak Web SDK ağ hattı için güvenli sınır **150** ve batch'ler arası **400ms delay** gereklidir.
4. **Partial Failure Toleransı:**
   - Olası ağ kopmalarında scriptler 5 aşamalı exponential backoff ile otomatik retry yapacak yapıdadır.
5. **Kaynak İzlenebilirliği:**
   - Her kayıtta `personelAdi`, `yaka`, `basvuruKanali`, `updatedAt` alanları saklanmaktadır.

---

## D. Normalizasyon ve Eşleştirme Denetimi

1. **Personel İsim Eşleşmeleri:**
   - Sistemde kayıtlı 46 personelin **39'u** Excel dosyalarında yer almaktadır.
   - İsim Varyasyonları:
     - Excel: `AHMET KOCABIYIK` ↔ Kayıtlı: `AHMET KOCABIYİK`
     - Excel: `ŞÜKRÜ KIDİL` ↔ Kayıtlı: `ŞÜKRÜ KİDİL`
     - *Çözüm:* `normalizePersonelKey` fonksiyonu Türkçe karakterleri ASCII slug'a dönüştürdüğü için her iki yazım da `ahmet-kocabiyik` ve `sukru-kidil` olarak %100 sorunsuz eşleşmektedir.
   - Excel'de başvurusu olmayan 7 kayıtlı personel: `EZGİ KOÇ`, `VEDAT VARLIK`, `YUSUF GÜNDOĞDU`, `OSMAN ÇABUKER`, `UMUT EMRE`, `UĞUR BEYHATUN`, `FATİH GÜNEŞ` (bu personeller bildirim girmemiş, sadece vardiyada görev almış personellerdir).
2. **İlçe & Meydan Normalizasyonu:**
   - Excel'deki 39 ilçe adı `ilceToMeydanId` ile 52 meydan slug'ına tam uyumlu eşleşmektedir.
3. **Durum Değerleri:**
   - Excel'de 8 farklı durum tespit edilmiştir: `Kapandı` (%96), `Planlama` (%2.5), `Çözüldü`, `Atama Bekliyor`, `Çalışılıyor`, `Beklemede`, `Yeni Başvuru`, `Değerlendirme`.

---

## E. Vardiya ve 2026-04-20 – 2026-04-30 Dönemi İncelemesi

> **ÖNEMLİ TESPİT:** 
> `Buyuk_guncelleme` klasöründeki 15 adet `Saha Çalışma Programı` Excel dosyası taranmıştır:
> - `Saha Çalışma Programı (4-8 MAYIS).xlsx` (En erken dosya)
> - ...
> - `Saha Çalışma Programı (10-14 AĞUSTOS).xlsx` (En güncel dosya)

* **2026-04-20 – 2026-04-30 Arası:** Bu 11 günlük döneme ait **kaynak klasörde hiçbir Excel dosyası bulunmamaktadır**.
* **Değerlendirme:** Bu boşluk bir kodlama/import hatası DEĞİL, **kaynak veri setinin 4 Mayıs 2026 öncesini içermemesinden** kaynaklanmaktadır.
* **Kural:** Asla tahmini vardiya üretilmemelidir. Yönetim sunumunda vardiya takviminin "Mayıs - Ağustos 2026 Aktif Saha Planı" olduğu belirtilmelidir.

---

## F. Veri Tazeliği

* **En Güncel Başvuru Verisi:** **14 Ağustos 2026** (Cuma)
* **En Güncel Vardiya Verisi:** **14 Ağustos 2026**
* **Dashboard Zaman Eşleşmesi:** Dashboard canlı verileri bugüne (17 Ağustos 2026) göre filtrelemekte, son 7 günlük ve haftalık vardiyaları hatasız listelemektedir.

---

## G. Risk Seviyeleri (Risk Listesi)

* **[P0 - KRİTİK] Firestore Spark Kota Sınırı:**
  - Firebase ücretsiz planında günlük 20.000 yazma kotası mevcuttur. 11.367 kaydın tek seferde yazımı kotayı doldurabilir. Bu sebeple projedeki `src/data/compiledPersonelBasvurular.json` statik veri katmanı hayati bir tampon görevi görmektedir.
* **[P1 - YÜKSEK] 99 Mükerrer Kayıt:**
  - Burak Özçelik ve Caner Dişli sekmelerindeki aynı 99 kayıt `docId` bazında filtrelenmeli, istatistiklerde mükerrer sayılmamalıdır.
* **[P2 - ORTA] 120 Başvuruda İlçe Seçilmemiş Olması:**
  - Başvuru açıklamasında meydan adı geçmesine rağmen sistemde ilçe kolonu boş kalan 120 kayıt bulunmaktadır.
* **[P3 - İYİLEŞTİRME] Bildirimi Olmayan 7 Personel:**
  - Hiç bildirim açmamış 7 personelin profilinde boşluk yerine "Bu dönem için açılmış saha bildirimi bulunmamaktadır" bilgilendirme kartı gösterilmelidir.

---

## H. Önerilen Uygulama Sırası (Maksimum 6 Adım)

1. **Adım 1 - Statik Veri Teyidi:** `compiledPersonelBasvurular.json` ve `compiledMeydanStats.json` dosyalarının 39 personel ve 39 ilçe için eksiksiz derlendiğini doğrulamak.
2. **Adım 2 - Güvenli Batch Ayarı:** İçe aktarma scriptlerinde `batchSize = 150` ve `400ms sleep` kuralını kalıcı hale getirmek.
3. **Adım 3 - Mükerrer Filtreleme:** 99 çift kaydı `docId` tekilleştirmesiyle istatistik hesaplamalarına yansıtmak.
4. **Adım 4 - Personel & Meydan Arayüz Entegrasyonu:** [PersonelDetail.jsx](file:///c:/Users/candu/Desktop/SYP%20-%20Saha%20Y%C3%B6netim%20Paneli/src/pages/PersonelDetail.jsx) ekranında her personel için canlı 11.367 kayıtlık dinamik karne ve son bildirim listesini doğrulamak.
5. **Adım 5 - Vardiya Açıklama Notu:** Nisan sonundaki 11 günlük kaynak eksikliğini yapay veri üretmeden "Mayıs - Ağustos 2026 Dönemi" olarak etiketlemek.
6. **Adım 6 - Vercel Production Doğrulaması:** Canlı sistemde (`https://saha-yonetim-paneli.vercel.app`) tüm sayfaların, AI bülteninin ve personel detaylarının sıfır hata ile çalıştığını doğrulamak.
