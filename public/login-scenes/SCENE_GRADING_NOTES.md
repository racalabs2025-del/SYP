# Scene Grading Notes (Login Background)

Bu notlar `public/login-scenes/` altindaki 5 sahnenin premium login deneyimi icin tek tek optimize edilmesine yoneliktir.

## Genel hedef

- UI ustunde metin okunurlugu her sahnede tutarli olsun.
- Sahne gecisinde renk sicrama olmasin (ton birligi).
- Mobil crop oldugunda ana odak kaybolmasin.
- Dikkat dagitan watermark/artefact kalmasin.

## Ortak teknik ayarlar

- Contrast: -4 ile -8
- Highlights: -18 ile -28
- Shadows: +8 ile +14
- Blacks: -4
- Vibrance: -8
- Saturation: -4
- Clarity: +6
- Dehaze: +4
- Grain: 4-6 (cok hafif)
- Vignette: -8 (soft)

Overlay (login ekrani icin):
- Ust gradient: `rgba(6,24,46,0.76)` -> `rgba(8,21,38,0.84)`
- Ek cyan glow: sadece lokal, opaklik %12-%18
- Ek amber glow: sadece lokal, opaklik %10-%14

---

## 1) istanbul-1.jpg
Karakter: Gun dogumu, sisli bogaz, premium ve sakin.

Crop odagi:
- Desktop: Kopru ve gemiler merkezde kalacak.
- Mobile: Sol alt agaclik fazla baskin, alt bolumden %8-%10 kirp.

Ton/Filtro:
- Orange doygunlugu: -10
- Magenta: -6
- Mavi luminance: +4
- Highlights: -18
- Shadows: +10

Not:
- Su an en dengeli sahnelerden biri. Hero metni icin uygun.

---

## 2) istanbul-2.jpg
Karakter: Galata Kulesi sokak perspektifi, dramatik yagmur.

Crop odagi:
- Desktop: Kule merkezde kalsin.
- Mobile: Sag ve sol kenardaki su damlasi overlay hissi cok dikkat cekiyor; yanal kirpma ile her iki yandan %4-%6 alin.

Ton/Filtro:
- Cyan/Siyah kontrasti fazla sert: Saturation -8, Blacks +3
- Turuncu pencereler: Highlights -12, Orange luminance -4
- Global contrast: -6

Not:
- Sahne guclu ama agresif. Diger sahnelerle tonal uyum icin mutlaka yumusatilmali.

---

## 3) istanbul-3.jpg
Karakter: Vapur + skyline sunset, nostaljik.

Crop odagi:
- Desktop: Vapur merkez-altta kalmali.
- Mobile: Vapurun burnu kesilmemeli; alt kesimden fazla crop yapmayin.

Ton/Filtro:
- Sky contrast: -8
- Blue saturation: -10
- Orange saturation: -6
- Shadows: +12
- Clarity: +4

Kritik not:
- Sag alt bolgede belirgin artefact/sticker (parlak lekeli alan) var.
- Bu artefact temizlenmeden production'a alinmamali.

---

## 4) istanbul-4.jpg
Karakter: Gece kopru + light trail, premium teknoloji hissi.

Crop odagi:
- Desktop: Kopru girisi (sag alt) ve kule (sag orta) korunmali.
- Mobile: Sol alt cami guzel ama kalabalik yapiyor; sol altdan %6 kirpma ile sadeleştirilebilir.

Ton/Filtro:
- Blue channel saturation: -12
- Shadows: +8
- Highlights: -20 (light trail patlamasini azalt)
- Whites: -10

Not:
- Gece sahnesi set icin cok degerli. Ancak diger sahnelerden daha koyu, login metnini yutabilir.

---

## 5) istanbul-5.jpg
Karakter: Istiklal/tramvay/crowd, hareketli ve yasayan sehir hissi.

Crop odagi:
- Desktop: Tramvay merkezde kalsin.
- Mobile: Kalabalik solda yogun; sol kenardan %5 kirpma ile dengele.

Ton/Filtro:
- Kirmizi tramvay doygunlugu: -8 (fokus tek basina bagirmasin)
- Sarilar (magaza isiklari): Highlights -18
- Global saturation: -6
- Clarity: +8

Not:
- En hareketli kare. Slideshow icinde ardisik geciste enerji zirvesi olarak 4. veya 5. sirada kullanilmali.

---

## Slayt sirasi (onerilen)

1. istanbul-1.jpg (sakin premium giris)
2. istanbul-3.jpg (vapur + skyline)
3. istanbul-5.jpg (sehir ritmi)
4. istanbul-2.jpg (dramatik sokak)
5. istanbul-4.jpg (gece teknoloji final)

Bu sira, hikayeyi gunduzden geceye dogru tasir ve premium his verir.

---

## Pre-Production kontrol listesi

1. Watermark/logo/artefact temizlendi mi?
2. Tum sahnelerde tonal birlik var mi?
3. Mobil crop testinde ana odak korunuyor mu?
4. Login metni en az 4.5:1 kontrastla okunuyor mu?
5. Toplam 5 sahne boyutu 2.7 MB hedefine yakin mi?
