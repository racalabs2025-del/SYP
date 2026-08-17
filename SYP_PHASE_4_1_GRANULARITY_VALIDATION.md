# SYP - Saha Yönetim Paneli
# FAZ 4.1: VERİ GRANÜLERLİĞİ VE RİSK DOĞRULAMA (AUDIT) RAPORU

**Tarih:** 17 Ağustos 2026  
**Denetim Tipi:** %100 Read-Only (Veri tabanında ve kodda hiçbir değişiklik yapılmamıştır)  
**Kapsam:** 11.268 Unique Başvuru, 15 Vardiya Dosyası, 52 Fiziksel Meydan, 39 İlçe

---

## 1. İlçe Verisi vs. Meydan Verisi Karşılaştırması

52 fiziksel meydan ve 39 ilçe üzerindeki göstergelerin kaynak granülerliği:

| Gösterge | Kaynak Kolonu / Dosyası | Gerçek Granülerlik Seviyesi | Açıklama |
| :--- | :--- | :---: | :--- |
| **Vardiya / Nöbetçi Personel** | `Saha Çalışma Programı...` (Lokasyon Kolonu) | **`MEYDAN_LEVEL`** | Çizelgede *"Taksim Meydanı"*, *"Üsküdar Mimar Sinan Meydanı"* gibi fiziksel meydan adı açıkça yazılıdır. |
| **Toplam Başvuru Sayısı** | `ANADOLU/AVRUPA YAKASI.xlsx` (`İlçe` Kolonu) | **`DISTRICT_LEVEL`** | Başvurularda meydan kolonu yoktur; ilçe bazında açılmıştır. |
| **Açık / Süreçteki İş (`openCount`)** | `ANADOLU/AVRUPA YAKASI.xlsx` (`İlçe` Kolonu) | **`DISTRICT_LEVEL`** | İlçe genelindeki açık iş havuzudur. |
| **Taahhüt Aşımı (`slaCount`)** | `ANADOLU/AVRUPA YAKASI.xlsx` (`İlçe` Kolonu) | **`DISTRICT_LEVEL`** | İlçe genelindeki taahhüt aşımlarıdır. |
| **Aktif Kritik İş (`activeCritical`)** | `ANADOLU/AVRUPA YAKASI.xlsx` (`İlçe` Kolonu) | **`DISTRICT_LEVEL`** | İlçe sınırlarında açılan `2-Yüksek` kayıtlarıdır. |
| **Son Başvuru Tarihi (`sonTarih`)** | `ANADOLU/AVRUPA YAKASI.xlsx` (`İlçe` Kolonu) | **`DISTRICT_LEVEL`** | İlçedeki en son bildirim tarihidir. |

### Çoklu Meydan Bulunan İlçelerdeki Durum:
* **Fatih İlçesi:** Fatih ilçesinde Aksaray, Sultanahmet, Beyazıt, Eminönü meydanları bulunmaktadır. Fatih ilçesinin toplam 20 açık işi ve 17 SLA aşımı Fatih'e bağlı **tüm meydanlara ilçe toplamı olarak yansımaktadır**.
* **Beyoğlu İlçesi:** Taksim, Şişhane, Piyalepaşa meydanları yer alır. 25 açık iş ve 21 SLA aşımı **tüm Beyoğlu meydanları için ortak ilçe sayısıdır**.
* **Üsküdar & Kadıköy:** Üsküdar'ın 35 açık işi ve 25 SLA aşımı Üsküdar meydanlarına; Kadıköy'ün 9 açık işi Kadıköy meydanlarına ilçe havuzundan gelmektedir.

---

## 2. Gerçek Meydan Eşleşme Oranı

11.268 unique başvurunun kaynak bazlı eşleşme dağılımı:

| Eşleşme Tipi | Kayıt Sayısı | Yüzde (%) | Durum / Doğrulama |
| :--- | :---: | :---: | :--- |
| **Doğrudan `meydanId` / Meydan Kolonu** | **0** | **%0.00** | **Kaynak Excel'de "Meydan" başlıklı kolon fiziksel olarak YOKTUR.** |
| **Kesin İlçe Eşleşmesi** | **11.267** | **%99.99** | 39 ilçeye %100 doğru ve kesin haritalanmıştır. |
| **Mahalle Seviyesinde Eşleşme** | **9.112** | **%80.16** | 9.112 kayıtta `Mahalle` bilgisi mevcuttur. |
| **Açıklamadan Meydan Tahmini** | **0** | **%0.00** | Yapay/tahmini eşleşme uygulanmamıştır. |
| **İlçesiz Kayıt** | **1** | **%0.01** | `1-17703298` (Onur Armağan / Satır 4) |

> **Özet:** Başvuruların **%0'ı fiziksel meydan seviyesinde, %99.99'u ilçe seviyesindedir**.

---

## 3. Harita Yanıltıcılık Kontrolü ve Sunum Önerisi

### Mevcut Durum Riski:
Haritada Taksim Meydanı seçildiğinde *"21 SLA İhlali - 25 Açık İş"* görünmesi, yöneticide **"Taksim Meydanı'nın fiziki sınırları içinde 21 gecikme var"** şeklinde yanlış bir algı yaratabilir. Gerçekte bu sayı **Beyoğlu ilçesinin tamamındaki** gecikmelerdir.

### Önerilen Şeffaf Sunum Modeli:
Harita detay kartında ve listelerde etiketler şu şekilde düzenlenmelidir:
* *"Beyoğlu İlçesi Genelinde Taahhüt Aşımı: 21"*
* *"Beyoğlu İlçesi Açık İş Stoku: 25"*
* *"Taksim Meydanı Nöbetçi Kadrosu: 3 Personel (Meydan Seviyesi)"*

---

## 4. Risk Eşiklerinin Matematiksel Dağılımı ve Doğrulaması

39 ilçenin gerçek veri dağılımı ve çeyreklik (percentile) analizi:

| İstatistiksel Metrik | Taahhüt Aşımı (`slaCount`) | Açık İş Stoku (`openCount`) |
| :--- | :---: | :---: |
| **Minimum (Min)** | 0 | 0 |
| **Medyan (P50)** | **2.0** | **3.0** |
| **75. Yüzdelik (P75)** | **6.0** | **10.0** |
| **80. Yüzdelik (P80)** | **7.6** | **13.2** |
| **90. Yüzdelik (P90)** | **14.6** | **16.6** |
| **Maksimum (Max)** | 25 (Üsküdar) | 51 (Üsküdar/Tüm) |
| **Mevcut Kod Eşiği** | `slaCount >= 10` *(~P85 Tepe Dilim)* | `openCount >= 8` *(~P70 Tepe Dilim)* |

### Eşik Değerlendirmesi:
* `slaCount >= 10` eşiği, İstanbul'un en yoğun **en üst %15'lik dilimini (P85)** (Üsküdar: 25, Beyoğlu: 21, Fatih: 17, Şişli: 16, Ümraniye: 14, Sultanbeyli: 10) izole etmektedir.
* `openCount >= 8` eşiği, açık iş stoku ortalamanın belirgin üstünde olan **en üst %30'luk dilimi (P70)** (11 ilçe) yakalamaktadır.
* **Sonuç:** Eşikler keyfi olmayıp, verinin P85 ve P70 tepe kuyruğunu filtreleyen ampirik eşiklerdir.

---

## 5. Nöbetçi Verisi Granülerliği (`NO_STAFF`)

* Vardiya çizelgelerinde (`Saha Çalışma Programı...`) personelin görevi doğrudan *"Taksim Meydanı"*, *"Kadıköy Rıhtım Meydanı"*, *"Büyükada Meydanı"* gibi fiziksel meydan isimleriyle belirtilmektedir.
* Dolayısıyla `plannedStaffCount` ve `NO_STAFF` sınıflandırması **gerçek `MEYDAN_LEVEL` seviyesindedir ve %100 güvenilirdir**.

---

## 6. Kritik İş Harita Eşleşmesi

* 32 tarihsel kritik kayıt kaynak tabloda `İlçe` bazlıdır (`DISTRICT_LEVEL`).
* Şu an `activeCritical = 0` olduğu için haritada yanlış kırmızı nokta riski yoktur. Gelecekte aktif kritik kayıt oluştuğunda bunun *"İlçede Kritik Bildirim"* olarak adlandırılması yanıltıcılığı önler.

---

## 7. Sonuç Matrisi

| Gösterge | Gerçek Granülerlik | Güven Seviyesi | Haritada Meydan Bazında Gösterilebilir mi? |
| :--- | :---: | :---: | :--- |
| **Vardiya / Nöbetçi Kadro** | `MEYDAN_LEVEL` | **HIGH** | ✅ **EVET** (Fiziksel meydana tam bağlı) |
| **Nöbet Durumu (`NO_STAFF`)** | `MEYDAN_LEVEL` | **HIGH** | ✅ **EVET** (Fiziksel meydana tam bağlı) |
| **Taahhüt Süresi Aşımı (SLA)** | `DISTRICT_LEVEL` | **HIGH (İlçe Bazlı)** | ⚠️ **İLÇE ETİKETİYLE** (*"İlçede 21 SLA Aşımı"*) |
| **Açık İş Stoku (`openCount`)** | `DISTRICT_LEVEL` | **HIGH (İlçe Bazlı)** | ⚠️ **İLÇE ETİKETİYLE** (*"İlçede 25 Açık İş"*) |
| **Kritik İş (`activeCritical`)** | `DISTRICT_LEVEL` | **HIGH (İlçe Bazlı)** | ⚠️ **İLÇE ETİKETİYLE** (*"İlçede Kritik İş"*) |
| **Toplam Başvuru Hacmi** | `DISTRICT_LEVEL` | **HIGH (İlçe Bazlı)** | ⚠️ **İLÇE ETİKETİYLE** (*"İlçe Toplamı"*) |
| **Son Bildirim Tarihi** | `DISTRICT_LEVEL` | **HIGH (İlçe Bazlı)** | ⚠️ **İLÇE ETİKETİYLE** (*"İlçe Son Bildirimi"*) |

---

## 8. Karar ve Sınıflandırma

### A. MEYDAN BAZINDA GÜVENİLİR (Fiziksel 52 Meydan)
1. **Nöbetçi Personel Sayısı ve İsimleri**
2. **Vardiya Saat Aralıkları**
3. **Sahada Şu An / Görevde Olanlar**
4. **Nöbet Planı Olmayan Meydanlar (`NO_STAFF`)**

### B. YALNIZ İLÇE BAZINDA GÜVENİLİR (39 İlçe)
1. **Taahhüt Aşımı (SLA İhlali)** *(İlçenin tamamına aittir)*
2. **Açık / Süreçteki Başvuru Sayısı** *(İlçenin tamamına aittir)*
3. **Kritik Bildirimler (`2-Yüksek`)** *(İlçenin tamamına aittir)*
4. **Toplam Tarihsel Başvuru Hacmi** *(İlçenin tamamına aittir)*
5. **Yaşlandırma (Aging) Dağılımı** *(İlçe/Bölge havuzuna aittir)*

### C. VERİ GELİŞTİRİLMELİ
* **Başvuru Formuna Fiziki Meydan Dropdown'ı Eklenmesi:** Saha raportörlerinin bildirim açarken yalnızca "İlçe/Mahalle" değil, doğrudan "Meydan Adı" seçmesi sağlandığında tüm SLA ve açık iş metrikleri fiziksel meydan seviyesine (`MEYDAN_LEVEL`) indirgenebilir.
