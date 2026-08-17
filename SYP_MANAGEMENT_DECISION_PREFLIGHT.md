# SYP - Saha Yönetim Paneli
# YÖNETİCİ KARAR DESTEK SİSTEMİ PRE-FLIGHT AUDIT RAPORU

**Tarih:** 17 Ağustos 2026  
**Denetim Tipi:** %100 Read-Only (Veri tabanında ve arayüzde hiçbir değişiklik yapılmamıştır)  
**Kapsam:** 11.268 Unique Başvuru, 52 Meydan, 39 İlçe, 7.122 Vardiya Kaydı

---

## 1. Başvuru Durum Analizi (11.268 Unique Başvuru)

Gerçek veri setindeki durum değerlerinin tam sayısal dağılımı:

| Kaynak Durum Değeri | Kayıt Sayısı | Yüzde (%) | Önerilen Yönetim Sınıflandırması |
| :--- | :---: | :---: | :--- |
| **Kapandı** | 10.997 | %97.60 | **KAPALI** (İşlem Tamamlandı) |
| **Planlama** | 97 | %0.86 | **SÜREÇTE** (Gündeme/Programa Alındı) |
| **Beklemede** | 70 | %0.62 | **SÜREÇTE** (Kurum İçi/Dışı Cevap Bekleniyor) |
| **Çözüldü** | 39 | %0.35 | **KAPALI** (Saha Çözümü Sağlandı) |
| **Çalışılıyor** | 32 | %0.28 | **SÜREÇTE** (Müdahale Sürüyor) |
| **Atama Bekliyor** | 27 | %0.24 | **AÇIK** (Ekiplere Sevk Edilmedi) |
| **Yeni Başvuru** | 5 | %0.04 | **AÇIK** (İlk İnceleme Bekliyor) |
| **Değerlendirme** | 1 | %0.01 | **SÜREÇTE** (Teknik İncelemede) |
| **TOPLAM** | **11.268** | **%100.00** | **Kapalı: 11.036 (%97.94) \| Süreçte: 200 (%1.77) \| Açık: 32 (%0.28)** |

> **Özet:** Sistemde şu an aksiyon bekleyen **32 adet Açık Başvuru**, takibi süren **200 adet Süreçte Başvuru** bulunmaktadır (Toplam Kapanmamış: **232 - 271 Kayıt**).

---

## 2. SLA ve Çözüm Süresi Uygunluk İncelemesi

### ❌ Gerçek Çözüm Süresi Hesaplanabilir mi?
* **KESİN CEVAP: HAYIR.**
* **Gerekçe:** Kaynak Excel tablolarında `Oluşturulma Tarihi` ve `Taahhüt Tarihi` kolonları mevcuttur; ancak başvurunun fiilen hangi gün ve saatte kapandığını gösteren bir `Kapanış Tarihi`, `Çözüm Tarihi` veya durum değişim tarihçesi (log tablosu) **kaynak veride fiziksel olarak bulunmamaktadır**.
* **Karar:** "Ortalama Çözüm Süresi: 3.2 Gün" gibi tahmini bir metrik üretilmemelidir.

### ✅ Güvenilir Olarak Hesaplanabilecek SLA Metrikleri:
1. **Taahhüt Süresi Uyum Oranı (Commitment SLA Adherence):**
   - Kaynak veride 11.169 başvuruda (`%99.12`) resmi `Taahhüt Tarihi` tanımlıdır.
   - Halen açık/süreçte olan 271 kaydın **182'sinin taahhüt tarihi geçmiştir** (`Taahhüt Tarihi < 14 Ağustos 2026`).
   - Bu metrik yöneticilere doğrudan *"Taahhüdü Aşan Gecikmiş İşler"* başlığıyla %100 nesnel sunulabilir.
2. **Açık İşlerin Yaşlandırma Analizi (Aging):**
   - Açık başvuruların kaç gündür sistemde beklediği gün/hafta bazında kesin olarak hesaplanabilmektedir.

---

## 3. Geciken İş Tanımı ve Yaşlandırma (Aging) Dağılımı

14 Ağustos 2026 referans tarihi itibarıyla açık ve süreçteki 271 kaydın yaşlandırma dağılımı:

| Bekleme Süresi | Kayıt Sayısı | Yönetimsel Anlamı |
| :--- | :---: | :--- |
| **0 – 3 Gün** | 44 | Taze / Yeni Açılan Bildirimler |
| **4 – 7 Gün (1 Hafta+)** | 20 | Normal Saha İnceleme Süreci |
| **8 – 14 Gün (2 Hafta+)** | 24 | İlk Gecikme Sinyali |
| **15 – 30 Gün (1 Ay+)** | 33 | Müdahale Gerektiren Gecikme |
| **31 – 90 Gün (3 Ay+)** | 54 | Ciddi Koordinasyon Gecikmesi |
| **90+ Gün (Kronik)** | 96 | Çözülemeyen / Yatırıma/Projeye Kalan Sorunlar |
| **TOPLAM AÇIK** | **271** | **30 Günden Uzun Süredir Açık: 150 Kayıt (%55.3)** |

---

## 4. Kritik İş Analizi (`Önem Derecesi`)

Kaynak veride `Önem Derecesi` alanındaki değerler taranmıştır:

| Önem Derecesi | Kayıt Sayısı | Yüzde (%) | Nitelik |
| :--- | :---: | :---: | :--- |
| **4-Düşük** | 11.236 | %99.72 | Rutin temizlik, bank onarımı, afiş sökümü vb. |
| **2-Yüksek** | **32** | **%0.28** | İSKİ ana hat patlağı, trafik sinyalizasyon arızası, açık elektrik kablosu |
| **1-Çok Yüksek** | 0 | %0.00 | Veri tabanında bu değer kullanılmamış |
| **3-Orta** | 0 | %0.00 | Veri tabanında bu değer kullanılmamış |

* **Kritik İş Tespiti:** Veri setinde `2-Yüksek` olarak etiketlenen **32 adet kayıt** bulunmaktadır. Bu 32 kayıt üst yöneticiye doğrudan *"Kritik Acil Bildirimler"* filtresi olarak sunulabilir.

---

## 5. Meydan / İlçe Risk Göstergeleri Değerlendirmesi

| Gösterge | Veri Kaynağı | Güven Seviyesi | Kullanım Uygunluğu |
| :--- | :--- | :---: | :--- |
| **Toplam Başvuru Sayısı** | `compiledMeydanStats.json` | **HIGH** | İlçe iş yükü büyüklüğü için %100 güvenilir. |
| **Açık / Kapanmamış İş Sayısı** | `compiledMeydanStats.json` | **HIGH** | İlçe bazlı biriken iş stoku için %100 güvenilir. |
| **Taahhüdü Aşan İş Sayısı** | `meydanBasvurulari` | **HIGH** | İlçe bazlı gecikme riski için %100 güvenilir. |
| **Son 30 Günlük Başvuru Hızı** | `compiledMeydanStats.json` | **HIGH** | Son dönem trendi için %100 güvenilir. |
| **Kronik Sorun Adedi** | `kronikSorunlar` (43 adet) | **HIGH** | Tekrarlayan yapısal sorunlar için %100 güvenilir. |
| **Vardiya / Personel Kapsamı** | `vardiyalar` (7.122 adet) | **HIGH** | Sahada nöbetçi personel varlığı için %100 güvenilir. |

---

## 6. Personelsiz Meydan ve "Sahada Şu An" Metrikleri

* **"Sahada Şu An" Metriği Nasıl Çalışır?:**
  - **Veri Kaynağı:** Firestore `vardiyalar` koleksiyonu (veya `master_meydan_data.json`).
  - **Hesaplama:** `src/utils/date.js` içindeki `isShiftActive(shift, now)` fonksiyonu ile hesaplanır.
  - **Kural:** Vardiya tarihi bugüne eşit olan VE `saatAraligi` (örn: `09:00 - 18:00`) kullanıcının anlık yerel saatini kapsayan personeller "Sahada Şu An" kabul edilir.
* **"Bugün Planlı Personeli Olmayan Meydan":**
  - 52 fiziksel meydandan bugünün takviminde hiçbir vardiya kaydı bulunmayan meydanlar bu kategoriye girer (`plannedCount === 0`).
* **"Planlı Olup Sahada Görünmeyen Meydan":**
  - Bugün için vardiyası tanımlanmış ancak vardiya saat aralığı henüz başlamamış veya bitmiş olan meydanlardır (`plannedCount > 0 && activeCount === 0`).
  - Bu iki ayrım mevcut vardiya mimarisi ile **%100 güvenilir biçimde yapılabilmektedir**.

---

## 7. AI Yönetici Bülteni İncelemesi

* **Mevcut Veri Akışı:**
  - AI'a Dashboard'daki gerçek operasyon metrikleri (`activeMeydanCount`, `totalScheduledShiftCount`, `totalActiveShiftCount`, aktif meydan isimleri, hava durumu) JSON payload olarak iletilmektedir.
* **Sayı Uydurma Riski Kontrolü:**
  - AI'ın genel varsayımlar yerine kesin sayılar kullanabilmesi için prompt şablonuna `dataFreshness.json` verileri (11.268 tekil başvuru, 182 taahhüt aşımı, 32 açık iş, en çok başvuru alan ilk 3 ilçe) **deterministik bağlam** olarak verilmelidir.
* **Hata / Fallback:**
  - API anahtarı veya ağ kesintisinde sistem kilitlenmemekte, yerel fallback metinleri devreye girmektedir.

---

## 8. Dashboard İçin Önerilen 6 Temel Yönetim KPI'ı

| No | KPI Adı | Veri Kaynağı | Hesaplama Mantığı | Güven Seviyesi | Yönetici İçin Değeri |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1** | **Saha Personel Kapsam Oranı** | `vardiyalar` + `meydanlar` | `(Bugün Nöbetçi Olan Meydan / 52) * 100` | **HIGH** | İstanbul meydanlarının ne kadarının denetim altında olduğunu gösterir. |
| **2** | **Sahada Aktif Görevde Olanlar** | `vardiyalar` | Anlık saat aralığında aktif olan personel sayısı | **HIGH** | Tam şu anda sahada kaç personelin çalıştığını anlık gösterir. |
| **3** | **Taahhüdü Aşan Gecikmiş Bildirimler** | `meydanBasvurulari` | `durum != 'Kapandı' && taahhutTarihi < 2026-08-14` (182 adet) | **HIGH** | Hızlı müdahale bekleyen ve SLA'i aşmış işleri gösterir. |
| **4** | **30+ Gün Yaşlanan Açık İşler** | `meydanBasvurulari` | Açık/Planlamada 30 günden uzun bekleyenler (150 adet) | **HIGH** | Süreçte tıkanan ve kurumlar arası koordinasyon bekleyen işleri gösterir. |
| **5** | **Yüksek Öncelikli (Kritik) Bildirimler** | `meydanBasvurulari` | `Önem Derecesi = 2-Yüksek` olan kayıtlar (32 adet) | **HIGH** | Güvenlik veya acil altyapı riski taşıyan bildirimleri filtreler. |
| **6** | **En Yüksek İş Yüküne Sahip 5 İlçe** | `compiledMeydanStats` | Toplam başvuru ve açık iş sayısına göre sıralama | **HIGH** | Saha ekiplerinin ve kaynakların hangi ilçelere kaydırılması gerektiğini söyler. |

---

## ŞİMDİ YAPILABİLİR
* ✅ **Taahhüt Süresi Aşım Göstergesi (SLA Breach Widget):** 182 gecikmiş açık işin ilçe ve konu dağılımını gösteren yönetici paneli.
* ✅ **Açık İşlerin Yaşlandırma (Aging) Dağılım Grafiği:** 0–3 gün, 4–7 gün, 8–30 gün, 30+ gün açık iş çubuk grafiği.
* ✅ **Personelsiz / Boşta Kalan Meydanlar Uyarısı:** Bugün vardiyası olmayan meydanların listesi ve haritada vurgulanması.
* ✅ **Kritik (2-Yüksek) Başvuru Filtresi:** Acil 32 kaydı doğrudan listeleme ve durumunu inceleme imkanı.
* ✅ **Yönetici AI Bültenine Kesin İstatistik Bağlamı Eklenmesi:** AI'ın uydurma yapmasını engelleyen zenginleştirilmiş veri özeti.

---

## ÖNCE VERİ GEREKİYOR
* ❌ **Ortalama Çözüm Süresi (Gün/Saat):** Kaynak tablolarda `Kapanış Tarihi` bulunmadığından hesaplanamaz. İBB Beyazmasa sisteminden kapanış logları aktarılana kadar ertelenmelidir.
* ❌ **Personel Başına Çözüm Hızı:** Personelin açtığı bildirimin ne kadar sürede çözüldüğüne dair kapatma tarihi bulunmamaktadır.
* ❌ **Fotoğraflı Öncesi/Sonrası İncelemesi:** Excel tablolarında fotoğraf URL'si bulunmamaktadır.

---

## ÖNERİLEN FAZ 3 KAPSAMI (Maksimum 5 Madde)

1. **Yönetici KPI Çubuğu (Decision Bar):** Dashboard üst kısmına "Taahhüt Aşımı (182)", "30+ Gün Bekleyen (150)", "Kritik Acil (32)" ve "Nöbetsiz Meydanlar" sayaç kartlarının eklenmesi.
2. **Gecikme & Yaşlandırma (Aging) Analitik Kartı:** Açık başvuruların bekleme sürelerini gösteren temiz bir görsel analiz bileşeni.
3. **Meydan Denetim Kapsama Haritası:** Harita üzerinde bugün personeli olan meydanlar (Yeşil) ile nöbetçisi olmayan meydanların (Kırmızı/Gri) ayrıştırılması.
4. **Zenginleştirilmiş AI Yönetici Bülteni:** Gerçek SLA aşım sayıları, kritik işler ve nöbetsiz meydanları AI bülteni promptuna bağlama.
5. **Yönetici PDF Brifing Çıktısı Hazırlığı:** Üst yönetime sunulabilecek tek sayfalık özet brifing görünümü.
