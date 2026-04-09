# Login Scenes Asset Guide

Bu klasor, login ekrani arka plan slaytlari icin optimize edilmis final varliklari icerir.

## Hedef kalite standardi

- Cozunurluk: 2752x1536 (16:9) minimum.
- Tercih edilen master: 3840x2160 veya ustu.
- Kullanim dosyasi: `.jpg` (final runtime), kaynaklar icin `.png`/`.tif` ayrica saklanabilir.
- Renk uzayi: sRGB.
- Kadraj: Genis aci, mimari odakli, merkezde metin icin nefes alan bosluk.
- Kontrast: Orta. Cok sert siyah-beyaz kontrasttan kacinin.
- Subject: Istanbul + altyapi + kent ritmi. Kalabalik insan close-up kullanmayin.

## Performans sinirlari

- Tek bir login sahnesi ideal boyut: 280 KB - 520 KB.
- Ust limit: 650 KB (istisnai olarak 700 KB).
- 5 sahne toplam hedef: <= 2.7 MB.

Not: Su an `istanbul-2.jpg` ve `istanbul-5.jpg` dosyalari ideal hedefin uzerinde.

## Stil yonu (premium)

- Saat: Sabah erken veya gun batimi altin saat.
- Gokyuzu: Hafif bulutlu, asiri doygun mavi degil.
- Mimari: Meydan/sokak/ulasim akslari, perspektif hissi olan kareler.
- Isik: Kenar parlamasi, cam/reflection hissi, temiz ama sinematik ton.
- Tutarlilik: Tum slaytlar ayni ton egirisine yakin olmali.

## Renk isleme (onerilen LUT mantigi)

- Mavi hue araligi: doygunluk -10% / -18%.
- Golge (shadows): +8 mavi-cyan tonu.
- Highlights: +4 sicaklik.
- Clarity: +6 ile +10 arasi.
- Grain: cok dusuk (opsiyonel), 4-8 arasi.

## Dosyalama

- Runtime dosyalari: `public/login-scenes/optimized/istanbul-1.webp` ... `istanbul-5.webp`
- Kaynak high-quality dosyalar: `public/login-scenes-photo/`
- Isimlendirme: kucuk harf, tireli, ascii.

## Pipeline komutu

- Uretim: `npm run assets:login:optimize`
- Cikti klasoru: `public/login-scenes/optimized/`
- Rapor: `public/login-scenes/optimized/report.json`

## QA checklist

Yeni sahne eklemeden once:

1. 16:9 kadraja oturtuldu mu?
2. Dosya boyutu hedef araliginda mi?
3. Solda/sagda metin okunurlugu iyi mi?
4. Cok parlak hotspot veya dikkat dagitan obje var mi?
5. Diger 4 sahneyle tonal tutarlilik var mi?

## Ayrintili sahne notlari

- Tek tek sahne bazli crop ve ton ayarlari icin: `SCENE_GRADING_NOTES.md`

## Kabul kriteri (kisa)

- Gorsel premium hissediyor.
- Metin ustunde okunurluk sorunu yok.
- Mobilde crop oldugunda ana odak kaybolmuyor.
- Toplam yuk maliyeti hedefi asmiyor.
