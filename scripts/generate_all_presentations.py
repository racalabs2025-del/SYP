import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# ─── COLOR PALETTE ───────────────────────────────────────────────────────────
C_DARK_BG       = RGBColor(3, 18, 36)      # Deep Sapphire Dark
C_CARD_BG       = RGBColor(8, 30, 58)      # Card dark background
C_CARD_BORDER   = RGBColor(20, 60, 105)    # Card subtle border
C_ACCENT_CYAN   = RGBColor(56, 189, 248)   # Bright Cyan
C_ACCENT_BLUE   = RGBColor(2, 132, 199)    # Royal Blue
C_ACCENT_AMBER  = RGBColor(245, 158, 11)   # Warning / Aging Amber
C_ACCENT_GREEN  = RGBColor(16, 185, 129)   # Success Green
C_ACCENT_RED    = RGBColor(239, 68, 68)    # Critical Red
C_TEXT_WHITE    = RGBColor(255, 255, 255)  # Headings / primary
C_TEXT_MUTED    = RGBColor(148, 163, 184)  # Subtitles / secondary
C_TEXT_BODY     = RGBColor(226, 232, 240)  # Body text
C_PILL_BG       = RGBColor(14, 45, 82)     # Badge pill bg

FONT_NAME = "Segoe UI"
FONT_BOLD = "Segoe UI Semibold"

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    return prs

def add_bg(slide, image_path=None):
    bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = C_DARK_BG
    bg_shape.line.fill.background()

    if image_path and os.path.exists(image_path):
        # Insert image on the right or backdrop
        try:
            pic = slide.shapes.add_picture(image_path, Inches(7.2), Inches(0), Inches(6.133), Inches(7.5))
            # Semi-transparent overlay over image
            ov = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.2), Inches(0), Inches(6.133), Inches(7.5))
            ov.fill.solid()
            ov.fill.fore_color.rgb = C_DARK_BG
            ov.line.fill.background()
        except Exception as e:
            pass

def add_header(slide, kicker, title, category="SAHA YÖNETİM PANELİ (SYP)"):
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(11.733), Inches(1.15))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

    p0 = tf.paragraphs[0]
    p0.text = f"{category.upper()}  •  {kicker.upper()}"
    p0.font.name = FONT_BOLD
    p0.font.size = Pt(10)
    p0.font.bold = True
    p0.font.color.rgb = C_ACCENT_CYAN
    p0.space_after = Pt(2)

    p1 = tf.add_paragraph()
    p1.text = title
    p1.font.name = FONT_BOLD
    p1.font.size = Pt(22)
    p1.font.bold = True
    p1.font.color.rgb = C_TEXT_WHITE

def add_takeaway(slide, text, top=1.65):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top), Inches(11.733), Inches(0.52))
    shape.fill.solid()
    shape.fill.fore_color.rgb = C_PILL_BG
    shape.line.color.rgb = C_ACCENT_BLUE
    shape.line.width = Pt(1)

    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.2)
    tf.margin_right = Inches(0.2)
    tf.margin_top = Inches(0.09)
    p = tf.paragraphs[0]
    p.text = f"💡 YÖNETİCİ VURGUSU:  {text}"
    p.font.name = FONT_BOLD
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_TEXT_WHITE

def add_card(slide, left, top, width, height, title=None, icon=None, items=None, accent=C_ACCENT_CYAN, bg=C_CARD_BG):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    card.fill.solid()
    card.fill.fore_color.rgb = bg
    card.line.color.rgb = C_CARD_BORDER
    card.line.width = Pt(1.2)

    # Header in card
    tb = slide.shapes.add_textbox(Inches(left + 0.28), Inches(top + 0.22), Inches(width - 0.56), Inches(height - 0.44))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

    if title:
        p0 = tf.paragraphs[0]
        full_title = f"{icon}  {title}" if icon else title
        p0.text = full_title
        p0.font.name = FONT_BOLD
        p0.font.size = Pt(13)
        p0.font.bold = True
        p0.font.color.rgb = accent
        p0.space_after = Pt(10)

    if items:
        first = True if not title else False
        for item in items:
            p = tf.paragraphs[0] if first else tf.add_paragraph()
            first = False
            p.text = f"•  {item}"
            p.font.name = FONT_NAME
            p.font.size = Pt(10)
            p.font.color.rgb = C_TEXT_BODY
            p.space_after = Pt(7)

def add_kpi(slide, left, top, width, height, icon, value, label, subtext="", accent=C_ACCENT_CYAN):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    card.fill.solid()
    card.fill.fore_color.rgb = C_CARD_BG
    card.line.color.rgb = accent
    card.line.width = Pt(1.5)

    tb = slide.shapes.add_textbox(Inches(left + 0.2), Inches(top + 0.18), Inches(width - 0.4), Inches(height - 0.36))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

    p0 = tf.paragraphs[0]
    p0.text = f"{icon}  {value}"
    p0.font.name = FONT_BOLD
    p0.font.size = Pt(22)
    p0.font.bold = True
    p0.font.color.rgb = accent
    p0.space_after = Pt(2)

    p1 = tf.add_paragraph()
    p1.text = label
    p1.font.name = FONT_BOLD
    p1.font.size = Pt(11)
    p1.font.bold = True
    p1.font.color.rgb = C_TEXT_WHITE
    p1.space_after = Pt(4)

    if subtext:
        p2 = tf.add_paragraph()
        p2.text = subtext
        p2.font.name = FONT_NAME
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = C_TEXT_MUTED

def add_footer(slide, current, total):
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(6.95), Inches(11.733), Inches(0.35))
    tf = tb.text_frame
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = f"Saha Yönetim Paneli (SYP)  •  Meydan Yönetimi Birimi  •  Sayfa {current} / {total}"
    p.font.name = FONT_NAME
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_TEXT_MUTED

def add_cover(slide, title, subtitle, date_str, is_executive=False):
    add_bg(slide)

    # Large glowing badge
    badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.3), Inches(2.2), Inches(0.8))
    badge.fill.solid()
    badge.fill.fore_color.rgb = C_CARD_BG
    badge.line.color.rgb = C_ACCENT_CYAN
    badge.line.width = Pt(2)
    tf_b = badge.text_frame
    tf_b.margin_top = Inches(0.18)
    p_b = tf_b.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    p_b.text = "SYP"
    p_b.font.name = FONT_BOLD
    p_b.font.size = Pt(28)
    p_b.font.bold = True
    p_b.font.color.rgb = C_ACCENT_CYAN

    # Title box
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(2.4), Inches(11.5), Inches(3.2))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

    p0 = tf.paragraphs[0]
    p0.text = "İSTANBUL BÜYÜKŞEHİR BELEDİYESİ  •  MEYDAN YÖNETİMİ BİRİMİ"
    p0.font.name = FONT_BOLD
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = C_ACCENT_CYAN
    p0.space_after = Pt(12)

    p1 = tf.add_paragraph()
    p1.text = title
    p1.font.name = FONT_BOLD
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = C_TEXT_WHITE
    p1.space_after = Pt(14)

    p2 = tf.add_paragraph()
    p2.text = subtitle
    p2.font.name = FONT_NAME
    p2.font.size = Pt(15)
    p2.font.color.rgb = C_TEXT_MUTED
    p2.space_after = Pt(24)

    # Info pills
    p3 = tf.add_paragraph()
    doc_type = "C-LEVEL STRATEJİK YÖNETİM SUNUMU" if is_executive else "KAPSAMLI OPERASYONEL VE FONKSİYONEL SİSTEM KILAVUZU"
    p3.text = f"📅 {date_str}   |   🎯 {doc_type}   |   ⚡ Sürüm 1.0 (Canlı Sistem)"
    p3.font.name = FONT_NAME
    p3.font.size = Pt(11)
    p3.font.color.rgb = C_ACCENT_CYAN

def build_executive_deck(filename="SYP_Ust_Duzey_Yonetici_Sunumu.pptx"):
    prs = create_deck()
    total = 18

    # ─── 1. KAPAK ─────────────────────────────────────────────────────────────
    s1 = prs.slides.add_slide(prs.slide_layouts[6])
    add_cover(s1, "SAHA YÖNETİM PANELİ (SYP)", 
              "İstanbul Meydanlarının Dijital Operasyon ve Komuta Merkezi", 
              "Eylül 2026", is_executive=True)
    add_footer(s1, 1, total)

    # ─── 2. YÖNETİCİ ÖZETİ ────────────────────────────────────────────────────
    s2 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s2)
    add_header(s2, "Stratejik İhtiyaç ve Hedef", "Yönetici Özeti: Dağınık Sahadan Tek Ekran Komutasına")
    add_takeaway(s2, "Telefon trafiği ve dağınık listeler yerine; tek merkezden anlık, şeffaf ve ölçülebilir yönetim.")
    add_kpi(s2, 0.8, 2.35, 3.6, 1.4, "🏛️", "15 Meydan", "Kesintisiz Canlı Takip", "İstanbul'un ana yaya ve buluşma merkezleri")
    add_kpi(s2, 4.86, 2.35, 3.6, 1.4, "📋", "12.000+", "Analiz Edilen Başvuru", "11 standart kategoride otomatik tasnif")
    add_kpi(s2, 8.93, 2.35, 3.6, 1.4, "⏱️", "%45", "Taahhüt Aşımı Düşüşü", "Erken uyarı ve yaşlandırma takip sistemiyle")
    add_card(s2, 0.8, 4.0, 5.66, 2.7, "Stratejik Zorluklar (Eski Yapı)", "❌", [
        "Meydanlardaki personel durumunun ancak telefonla teyit edilebilmesi",
        "Vatandaş başvurularının dağınık listelerde kaybolması ve yaşlanması",
        "Meydan amirlerinin tespitlerinin kurumsal hafızaya aktarılamaması"
    ], accent=C_ACCENT_RED)
    add_card(s2, 6.86, 4.0, 5.66, 2.7, "SYP ile Kazanılan Güç (Yeni Dönem)", "✅", [
        "Tüm meydan personeli ve vardiyalarının tek ekranda anlık doğrulanması",
        "Yaşlanan dosyalar ve darboğazlar için otomatik kırmızı alarm mekanizması",
        "Her sabah yöneticinin masasına gelen 3 maddelik kritik eylem brifingi"
    ], accent=C_ACCENT_GREEN)
    add_footer(s2, 2, total)

    # ─── 3. DÖNÜŞÜM: ÖNCESİ VE SONRASI ─────────────────────────────────────────
    s3 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s3)
    add_header(s3, "Operasyonel Evrim", "Dönüşüm: Geleneksel Yönetimden Veriye Dayalı Komutaya")
    add_takeaway(s3, "Hantallıktan kurtulup dakikalar içinde karar alan proaktif bir operasyon yapısına geçtik.")
    add_card(s3, 0.8, 2.35, 5.66, 4.35, "Geleneksel Saha Yönetimi (Öncesi)", "⏳", [
        "Dağınık Excel Tabloları: Birbirini tutmayan, güncelliğini yitiren personel listeleri",
        "WhatsApp / Telefon İletişimi: Denetlenemeyen, sözlü kalan ve arşivi olmayan mesajlaşmalar",
        "Geciken Reaksiyon: Bir sorunun merkeze ulaşması ve ilgili birime iletilmesinde bürokratik kayıp",
        "Görünmeyen Darboğazlar: Hangi birimin işi geciktirdiğinin tespit edilememesi",
        "Kayıt Altına Alınmayan Ziyaretler: Protokol ve saha tespitlerinin şahısların hafızasında kalması"
    ], accent=C_ACCENT_AMBER)
    add_card(s3, 6.86, 2.35, 5.66, 4.35, "Saha Yönetim Paneli (Sonrası)", "🚀", [
        "Tek Merkezli Canlı Veri: Tüm koordinatör ve amirlerin aynı gerçekliği gördüğü ortak ekran",
        "Dijital Görev & Nöbet Şablonu: Hangi personelin nerede olduğu saniyesinde teyitli",
        "Otomatik Yaşlandırma Analizi: 30+ günü aşan kronik işlerin doğrudan yöneticiye sinyal vermesi",
        "Birimler Arası Senkronizasyon: Fen İşleri, Zabıta, Park Bahçeler ortak vaka takibi",
        "Kurumsal Protokol Defteri: Tüm denetim ve saha notlarının kalıcı dijital arşivi"
    ], accent=C_ACCENT_CYAN)
    add_footer(s3, 3, total)

    # ─── 4. SAHA AYAK İZİ (15 MEYDAN) ──────────────────────────────────────────
    s4 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s4)
    add_header(s4, "Coğrafi Hâkimiyet", "Sahadaki Ayak İzimiz: 15 Odak Meydanın Stratejik Konumu")
    add_takeaway(s4, "İstanbul'un günlük 10 milyonu aşan insan hareketliliği 15 kritik meydanda yönetiliyor.")
    add_card(s4, 0.8, 2.35, 5.66, 4.35, "Avrupa Yakası Meydanları (10 Merkez)", "🏙️", [
        "Taksim Meydanı: Kültür, turizm ve yoğun yaya aksı",
        "Bakırköy Özgürlük Meydanı: Marmaray ve alışveriş odağı",
        "Mecidiyeköy Meydanı: Metrobüs-Metro aktarma kavşağı",
        "Beşiktaş Meydanı: Vapur iskeleleri ve sahil yoğunluğu",
        "Eminönü & Tarihi Yarımada Meydanları: Beyazıt, Aksaray, Sultanahmet",
        "Batı Aksı: Şirinevler, Beylikdüzü ve Esenyurt Meydanları"
    ], accent=C_ACCENT_CYAN)
    add_card(s4, 6.86, 2.35, 5.66, 4.35, "Anadolu Yakası Meydanları (5 Merkez)", "🌊", [
        "Kadıköy Rıhtım Meydanı: Anadolu yakasının ana buluşma ve aktarma arteri",
        "Üsküdar Meydanı: Boğaz kıyısı, Marmaray ve sahil sirkülasyonu",
        "Ümraniye Meydanı: Metro ve yoğun ticaret omurgası",
        "Tüm Meydanlar İçin Standart: Asgari personel doluluğu ve periyodik denetim şartı",
        "Bölgesel Eşgüdüm: Yoğunluk anlarında meydanlar arası dinamik ekip transferi"
    ], accent=C_ACCENT_BLUE)
    add_footer(s4, 4, total)

    # ─── 5. TEK BAKISTA BÜTÜN İSTANBUL (KOKPİT) ──────────────────────────────
    s5 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s5)
    add_header(s5, "Komuta Arayüzü", "Tek Bakışta Bütün İstanbul: Meydan Yönetimi Kokpiti")
    add_takeaway(s5, "Yöneticinin sahanın genel durumunu kavraması ve aksayan noktayı görmesi sadece 5 saniye sürer.")
    add_card(s5, 0.8, 2.35, 3.6, 4.35, "Renk Kodlu Durum Takibi", "🚦", [
        "Yeşil Durum: Personel tam, taahhüt aşımı yok, rutin devriye.",
        "Sarı Durum: Başvuru yoğunluğu artışta, 8-15 günlük takipler mevcut.",
        "Kırmızı Durum: Taahhüt aşımı riski, acil müdahale veya personel açığı var."
    ])
    add_card(s5, 4.86, 2.35, 3.6, 4.35, "Hiyerarşik Derinlik", "🔍", [
        "Üst Görünüm: 15 meydanın makro sağlık karnesi ve toplam saha gücü.",
        "Meydan Detayı: Tek tıkla o meydandaki tüm personelin isimleri ve açık işler.",
        "Personel Kartı: Görevli personelin iletişim ve haftalık nöbet planı."
    ])
    add_card(s5, 8.93, 2.35, 3.6, 4.35, "Hızlı Aksiyon ve Filtreleme", "⚡", [
        "Sorumlu Bazlı Süzme: Bölge amirinin kendi yetki alanına anında odaklanması.",
        "Durum Filtreleri: Sadece sorunlu meydanları tek tıkla listeleyebilme.",
        "Anlık Senkronizasyon: Sahadaki her değişiklik ekranda anında görünür."
    ])
    add_footer(s5, 5, total)

    # ─── 6. CANLI SAHA GÜCÜ (VARDİYA) ─────────────────────────────────────────
    s6 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s6)
    add_header(s6, "İş Gücü Optimizasyonu", "Canlı Saha Gücü: Kim, Nerede, Hangi Görevde?")
    add_takeaway(s6, "Sahada kör nokta bırakmıyoruz; planlanan vardiya ile sahadaki fiili mevcudiyet tam örtüşüyor.")
    add_kpi(s6, 0.8, 2.35, 3.6, 1.4, "👥", "3 Vardiya", "Kesintisiz Devriye", "Gündüz, akşam ve hafta sonu nöbet şablonları")
    add_kpi(s6, 4.86, 2.35, 3.6, 1.4, "📊", "%98.2", "Vardiya Uyumu", "Planlanan nöbete sadakat ve eksiksiz devir")
    add_kpi(s6, 8.93, 2.35, 3.6, 1.4, "🛡️", "Sıfır Açık", "Coverage Güvencesi", "Kritik saatlerde asgari personel emniyet eşiği")
    add_card(s6, 0.8, 4.0, 5.66, 2.7, "Dinamik Vardiya Çizelgesi", "📅", [
        "Haftalık ve aylık bazda unvan, görev ve meydan eşleştirmesi",
        "İzinli, raporlu ve mazeretli personelin mevcuttan anlık düşmesi",
        "Ekip lideri ve saha devriye personeli net rol tanımları"
    ])
    add_card(s6, 6.86, 4.0, 5.66, 2.7, "Eksik Saha Gücü Uyarısı", "⚠️", [
        "Bir meydanda belirlenen asgari nöbetçi sayısının altına düşülürse otomatik ikaz",
        "Hastalık veya ani mazeret hallerinde komşu meydandan yedekleme",
        "Amirlerin onayına bağlı esnek vardiya takası ve izin kayıtları"
    ])
    add_footer(s6, 6, total)

    # ─── 7. VATANDAS BASVURU ANALİTİĞİ ────────────────────────────────────────
    s7 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s7)
    add_header(s7, "Talep Röntgeni", "Sahadaki Sorunların Röntgeni: 12.000+ Başvuru Analitiği")
    add_takeaway(s7, "Vatandaşın her başvurusunu kuru bir kayıt değil, meydan iyileştirmesinin kılavuzu olarak görüyoruz.")
    add_card(s7, 0.8, 2.35, 3.6, 4.35, "11 Standart Kategori", "📂", [
        "Temizlik & Katı Atık",
        "Zabıta & Düzen Sağlama",
        "Fen İşleri & Altyapı",
        "Park, Bahçe & Yeşil Alan",
        "Ulaşım & Yaya Sirkülasyonu",
        "Aydınlatma & Enerji",
        "Sokak Hayvanları ve Sağlık"
    ])
    add_card(s7, 4.86, 2.35, 3.6, 4.35, "Konu Bazlı Yoğunluk", "📊", [
        "Hangi meydanda en çok hangi şikayet tipi öne çıkıyor?",
        "Mevsimsel ve haftalık talep artışlarının önceden kestirilmesi.",
        "Tekrarlayan arızaların kalıcı onarıma yönlendirilmesi."
    ])
    add_card(s7, 8.93, 2.35, 3.6, 4.35, "Çözüm ve Kapanış Hızı", "⏱️", [
        "Başvurunun ilk açılış anından yerinde incelenmesine kadar geçen süre.",
        "İlgili daire başkanlıklarına sevk edilen işlerin takip disiplini.",
        "Vatandaşa geri bildirim verilerek kapatılan kayıtların oranı."
    ])
    add_footer(s7, 7, total)

    # ─── 8. YASLANDIRMA (AGING) MODELİ ────────────────────────────────────────
    s8 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s8)
    add_header(s8, "Darboğaz Tespiti", "Kırmızı Alarm: Yaşlandırma (Aging) ve Darboğaz Tespiti")
    add_takeaway(s8, "Masada unutulan hiçbir iş kalmaz; yaşlanan her dosya yönetici ekranında yukarı taşınır.")
    add_kpi(s8, 0.8, 2.35, 2.7, 1.4, "🟢", "0 - 7 Gün", "Taze İşler", "Rutin operasyon döngüsü", accent=C_ACCENT_GREEN)
    add_kpi(s8, 3.8, 2.35, 2.7, 1.4, "🟡", "8 - 15 Gün", "Takipte Olanlar", "Gecikme eğilimi gösterenler", accent=C_ACCENT_AMBER)
    add_kpi(s8, 6.8, 2.35, 2.7, 1.4, "🟠", "16 - 30 Gün", "Kritik Aşama", "Amir seviyesinde müdahale", accent=C_ACCENT_AMBER)
    add_kpi(s8, 9.8, 2.35, 2.7, 1.4, "🔴", "30+ Gün", "Kırmızı Alarm", "Üst yönetim koordinasyonu", accent=C_ACCENT_RED)
    add_card(s8, 0.8, 4.0, 5.66, 2.7, "Neden Yaşlandırma Analitiği?", "🎯", [
        "Sadece toplam açık iş sayısına bakmak yöneticileri yanıltır.",
        "Asıl risk; haftalardır çözülmeden bekleyen kronik işlerdir.",
        "SYP, yaşlanan işleri renk skalasında ayırarak rehaveti önler."
    ])
    add_card(s8, 6.86, 4.0, 5.66, 2.7, "Kurumlar Arası Koordinasyon Gücü", "🤝", [
        "30 günü aşan konularda ilgili Daire Başkanlığına resmi uyarı sinyali",
        "İlçe belediyesi sorumluluğunda kalan alanların tespiti ve resmi bildirim",
        "Bürokratik tıkanıklıkların yönetici toplantılarına doğrudan gündem olması"
    ])
    add_footer(s8, 8, total)

    # ─── 9. KRONİK SAHA PROBLEMLERİ ───────────────────────────────────────────
    s9 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s9)
    add_header(s9, "Kök Neden Çözümü", "Kronik Saha Problemleri ve Kalıcı Çözüm Takibi")
    add_takeaway(s9, "Günü kurtaran geçici önlemler yerine, problemi kaynağında yok eden yapısal çözümler üretiyoruz.")
    add_card(s9, 0.8, 2.35, 5.66, 4.35, "Kronik Vaka Kriterleri", "🔍", [
        "Aynı noktada 30 gün içinde 3'ten fazla tekrarlanan arızalar (Örn: Çöken ızgaralar)",
        "Birden fazla birimin ortak müdahalesini gerektiren karmaşık aksaklıklar",
        "Meydan zemin kaplaması, aydınlatma direkleri ve sabit kent mobilyaları hasarları",
        "Saha amirinin 'Kronik Risk' olarak işaretlediği stratejik noktalar"
    ])
    add_card(s9, 6.86, 2.35, 5.66, 4.35, "Kalıcı Çözüm Mekanizması", "🛠️", [
        "Özel Dosya Takibi: Her kronik problem için bağımsız bir çözüm dosyası açılır.",
        "Yerinde Fotoğraflı Tespit: İlk durum ve nihai imalat fotoğraflarla belgelenir.",
        "Tarihli Taahhüt: İlgili imalatçı veya müteahhit birimin verdiği kesin bitiş tarihi girilir.",
        "Meydan Şefinin Nihai Onayı: Problem sahada fiilen çözülmeden dosya sistemden kapanamaz."
    ])
    add_footer(s9, 9, total)

    # ─── 10. PROTOKOL VE ZİYARET DEFTERİ ──────────────────────────────────────
    s10 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s10)
    add_header(s10, "Kurumsal Hafıza", "Sahadaki Kurumsal Hafıza: Dijital Ziyaret ve Gözlem Defteri")
    add_takeaway(s10, "Meydanlara yapılan üst düzey ziyaretler ve verilen talimatlar unutulmaz; hepsi kayıt altındadır.")
    add_card(s10, 0.8, 2.35, 3.6, 4.35, "Protokol Ziyaretleri", "🏛️", [
        "Başkanlık, Genel Sekreterlik ve Daire Başkanı saha ziyaretleri",
        "Ziyaret sırasında yerinde iletilen özel talimatlar ve notlar",
        "Talimatın muhatabı olan birim ve verilen hedef süre kaydı"
    ])
    add_card(s10, 4.86, 2.35, 3.6, 4.35, "Saha Şeflerinin Notları", "✍️", [
        "Meydan sorumlusunun o güne ait önemli operasyonel gözlemleri",
        "Etkinlik, miting veya olağanüstü toplanma kayıtları",
        "Fiziki güvenlik ve asayişle ilgili kolluk kuvveti temasları"
    ])
    add_card(s10, 8.93, 2.35, 3.6, 4.35, "Geriye Dönük İzlenebilirlik", "📖", [
        "Hangi meydanı en son kim ziyaret etti ve ne talimat verdi?",
        "Geçmiş denetim notlarının gerçekleşme oranlarının raporlanması",
        "Yönetici devir-teslimlerinde kaybolmayan kurumsal bilgi birikimi"
    ])
    add_footer(s10, 10, total)

    # ─── 11. METEOROLOJİ VE AÇIK ALAN EMNİYETİ ─────────────────────────────────
    s11 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s11)
    add_header(s11, "Risk Yönetimi", "Meteoroloji ve Açık Alan Operasyon Güvenliği")
    add_takeaway(s11, "Personelimizi ve meydan donatılarımızı hava şartlarına göre önceden konumlandırıyoruz.")
    add_kpi(s11, 0.8, 2.35, 3.6, 1.4, "🌬️", "Rüzgar Şiddeti", "Sahil Meydanları", "Beşiktaş, Üsküdar, Kadıköy için fırtına eşiği")
    add_kpi(s11, 4.86, 2.35, 3.6, 1.4, "🌧️", "Yağış Alarmı", "Altyapı Tedbirleri", "Izgara temizlikleri ve su birikintisi önlemleri")
    add_kpi(s11, 8.93, 2.35, 3.6, 1.4, "🌡️", "Aşırı Sıcak / Soğuk", "Personel Sağlığı", "Açık alan mesaisinde dinlenme ve takviye planı")
    add_card(s11, 0.8, 4.0, 5.66, 2.7, "Meydan Bazlı Mikro İklim Takibi", "⛅", [
        "İstanbul genelinde hava homojen değildir; sahil ile iç kesimler farklıdır.",
        "Her meydanın kendi anlık hava durumu doğrudan panel kartında yer alır.",
        "Saha amiri operasyonu genel tahminlere değil, meydanın anlık gerçeğine göre yönetir."
    ])
    add_card(s11, 6.86, 4.0, 5.66, 2.7, "Proaktif Operasyonel Kararlar", "🦺", [
        "Şiddetli rüzgarda tabela, tente ve bayrak direklerinin emniyete alınması",
        "Kar yağışında tuzlama ve küreme ekiplerinin meydan girişlerine konuşlandırılması",
        "Personelin koruyucu ekipman (yağmurluk, mont, reflektör) tamlığının teyidi"
    ])
    add_footer(s11, 11, total)

    # ─── 12. AKILLI GÜNLÜK BRİFİNG ─────────────────────────────────────────────
    s12 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s12)
    add_header(s12, "Karar Destek Sistemi", "Yöneticinin Dijital Danışmanı: Akıllı Günlük Brifing")
    add_takeaway(s12, "Her sabah saat 08:30'da yöneticinin ekranına sahanın en kritik 3 odak maddesi gelir.")
    add_card(s12, 0.8, 2.35, 5.66, 4.35, "Otomatik Analitik Çıkarımlar", "💡", [
        "Yüzlerce satırlık veri yığınını yöneticiye okutmak verimsizliktir.",
        "Sistem arka planda tüm meydanları, başvuruları ve personeli süzer.",
        "Öne Çıkan Tespitler: En çok yaşlanan 3 konu, personeli eksik kalan 2 meydan, çözüm hızı düşen birimler.",
        "Anlaşılır, insan dilinde ve doğrudan eyleme dönük kısa yönetici cümleleri."
    ])
    add_card(s12, 6.86, 2.35, 5.66, 4.35, "Örnek Sabah Brifingi Formatı", "📋", [
        "1. UYARI: Taksim Meydanı'nda zemin kaplama arızaları 18 gündür açık; Fen İşleri ekipleri bugün yönlendirilmeli.",
        "2. RİSK: Kadıköy Rıhtım'da akşam saatlerinde beklenen fırtına sebebiyle iskele çevresi devriyesi 2 personel artırılmalı.",
        "3. BAŞARI: Bakırköy Meydanı'nda bu hafta açılan temizlik başvurularının %94'ü ilk 24 saatte başarıyla çözüldü."
    ], accent=C_ACCENT_GREEN)
    add_footer(s12, 12, total)

    # ─── 13. KVKK VE BİLGİ GÜVENLİĞİ ──────────────────────────────────────────
    s13 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s13)
    add_header(s13, "Mevzuat ve Mahremiyet", "Sıfır Hukuki Risk: KVKK ve Bilgi Güvenliği İlkeleri")
    add_takeaway(s13, "Vatandaşın mahremiyeti esastır; sahada sadece iş çözülür, kişisel veriye erişilmez.")
    add_card(s13, 0.8, 2.35, 3.6, 4.35, "Veri Maskeleme Standardı", "🔒", [
        "T.C. Kimlik Numaraları: İlk 3 ve son 2 hane görünür, kalanı yıldızlanır.",
        "Telefon Numaraları: Operasyon ekranlarında tam telefon asla açık gösterilmez.",
        "Açık Hane Adresi: Sadece meydan ve vaka konumu yer alır; şahsi adres gizlenir."
    ])
    add_card(s13, 4.86, 2.35, 3.6, 4.35, "Bilmesi Gerektiği Kadar", "🛡️", [
        "Saha personeli sadece arızayı ve noktayı bilmekle yükümlüdür.",
        "Vatandaşın kişisel profili sahaya akmaz, merkezde korunur.",
        "Gereksiz kişisel veri transferi ve paylaşımı engellenir."
    ])
    add_card(s13, 8.93, 2.35, 3.6, 4.35, "Erişim Denetimi (Audit Log)", "👁️‍🗨️", [
        "Hangi kullanıcının hangi kaydı ne zaman incelediği saniyesine kadar kayıtlıdır.",
        "Ekran görüntüsü alma ve dışa aktarma yetkileri sınırlandırılmıştır.",
        "Hukuki ve idari denetimlerde %100 hesap verebilirlik sağlanır."
    ])
    add_footer(s13, 13, total)

    # ─── 14. SÜREÇ AKISI ──────────────────────────────────────────────────────
    s14 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s14)
    add_header(s14, "Uçtan Uca Operasyon", "Kesintisiz Süreç Akışı: Sahadan Yönetici Masasına")
    add_takeaway(s14, "Sahada bir aksaklığın doğması ile kararın alınması arasındaki süreyi dakikalara indirdik.")
    add_card(s14, 0.8, 2.35, 2.7, 4.35, "1. Tespit & Giriş", "📍", [
        "Vatandaş başvurusu veya saha devriyesinin tespiti sisteme düşer.",
        "Konum ve problem kategorisi belirlenir.",
        "Yasal taahhüt sayacı işlemeye başlar."
    ])
    add_card(s14, 3.8, 2.35, 2.7, 4.35, "2. Atama & İntikal", "🚶", [
        "Meydan şefi ekibi görevlendirir.",
        "Personel meydan içinde intikal eder.",
        "Gerekirse ilgili destek birimi (Fen İşleri, Zabıta) bilgilendirilir."
    ])
    add_card(s14, 6.8, 2.35, 2.7, 4.35, "3. Çözüm & Doğrulama", "✅", [
        "Yerinde müdahale tamamlanır.",
        "Çözüm notu ve saha teyidi girilir.",
        "Meydan şefi yerinde kontrol edip onaylar."
    ])
    add_card(s14, 9.8, 2.35, 2.7, 4.35, "4. Yönetim Raporu", "📊", [
        "Kapanan kayıt anlık KPI grafiğine işler.",
        "Meydanın başarı skoru yükselir.",
        "Gün sonu yönetici tablosu güncellenir."
    ])
    add_footer(s14, 14, total)

    # ─── 15. PERFORMANS VE KPI KARNESİ ────────────────────────────────────────
    s15 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s15)
    add_header(s15, "Ölçülebilir Başarı", "Performans Göstergeleri: Ölçülemeyen Hizmet Yönetilemez")
    add_takeaway(s15, "Başarımızı kanaatlerle değil, nesnel ve doğrulanabilir metriklerle ölçüyoruz.")
    add_kpi(s15, 0.8, 2.35, 2.7, 1.4, "🎯", "%91.4", "Çözüm Oranı", "Açılan başvuruların kapatılma oranı", accent=C_ACCENT_GREEN)
    add_kpi(s15, 3.8, 2.35, 2.7, 1.4, "⚡", "-%38", "Reaksiyon Süresi", "İlk intikal süresinde kısalma", accent=C_ACCENT_CYAN)
    add_kpi(s15, 6.8, 2.35, 2.7, 1.4, "👥", "%98.2", "Vardiya Devamlılık", "Nöbet saatlerine tam riayet", accent=C_ACCENT_BLUE)
    add_kpi(s15, 9.8, 2.35, 2.7, 1.4, "📉", "-%45", "Geciken İşler", "30+ gün bekleyen vaka düşüşü", accent=C_ACCENT_AMBER)
    add_card(s15, 0.8, 4.0, 5.66, 2.7, "Meydanlar Arası Performans Kıyaslama", "🏆", [
        "Hangi meydan ekipleri en hızlı reaksiyonu veriyor?",
        "Hangi meydanda kronik vaka sayısı sıfırlandı?",
        "Ekipler arasında sağlıklı bir kurumsal rekabet ve hizmet motivasyonu."
    ])
    add_card(s15, 6.86, 4.0, 5.66, 2.7, "Daire Başkanlığı Seviyesinde Raporlama", "📑", [
        "İlgili destek dairelerine (Zabıta, Fen İşleri vb.) haftalık karne sunumu",
        "İyileştirme gereken noktaların veriyle somut olarak masaya konması",
        "Kaynak dağılımında liyakat ve ihtiyaç odaklı planlama imkanı"
    ])
    add_footer(s15, 15, total)

    # ─── 16. KAYNAK TASARRUFU VE VERİMLİLİK ───────────────────────────────────
    s16 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s16)
    add_header(s16, "Maliyet ve Verim", "Saha Verimliliği: Yatırımın Kurumsal Karşılığı")
    add_takeaway(s16, "SYP bir masraf kalemi değil; operasyonel israfı önleyen doğrudan bir tasarruf aracıdır.")
    add_card(s16, 0.8, 2.35, 3.6, 4.35, "Zaman ve İletişim Tasarrufu", "⏱️", [
        "Günlük telefon zincirlerinin ve yüzlerce mesajın ortadan kalkması.",
        "Amirlerin rapor derlemek yerine sahayı denetlemeye vakit ayırması.",
        "Haftalık koordinasyon toplantısı hazırlık süresinin saatlerden dakikalara inmesi."
    ])
    add_card(s16, 4.86, 2.35, 3.6, 4.35, "Mükerrer İşlerin Önlenmesi", "🔄", [
        "Aynı sorun için birden fazla ekibin ayrı ayrı sahaya çıkmasının engellenmesi.",
        "Meydandaki hazır personelin doğrudan olaya yönlendirilmesiyle yakıt tasarrufu.",
        "Araç ve ekipman aşınmalarında somut düşüş."
    ])
    add_card(s16, 8.93, 2.35, 3.6, 4.35, "Kurumsal İtibar ve Memnuniyet", "⭐", [
        "Vatandaşın bildirdiği problemin hızla çözülmesiyle artan kamuoyu güveni.",
        "Meydanların düzenli, bakımlı ve güvenli algısının pekişmesi.",
        "Şeffaf belediyecilik ilkelerinin sahada fiilen tecelli etmesi."
    ])
    add_footer(s16, 16, total)

    # ─── 17. İSTANBUL GENELİNE YAYILIM ─────────────────────────────────────────
    s17 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s17)
    add_header(s17, "Büyüme Vizyonu", "İstanbul Geneline Yayılım: 15 Meydandan 39 İlçeye")
    add_takeaway(s17, "Modüler mimarimiz, İstanbul'un tüm yaşam alanlarını ve parklarını bünyesine katmaya hazır.")
    add_card(s17, 0.8, 2.35, 3.6, 4.35, "1. Aşama (Mevcut Durum)", "🟢", [
        "15 Ana Stratejik Meydan tam aktif.",
        "Personel, vardiya ve başvuru entegrasyonu tamamlandı.",
        "Saha amirleri paneli günlük rutinde kullanıyor."
    ], accent=C_ACCENT_GREEN)
    add_card(s17, 4.86, 2.35, 3.6, 4.35, "2. Aşama (Yakın Plan)", "🟡", [
        "39 İlçenin alt meydanları ve prestij caddelerinin entegrasyonu.",
        "Kıyı şeritleri, sahil dolgu alanları ve yoğun parkların dahil edilmesi.",
        "Masaüstü ve mobil amir tablet koordinasyonunun yaygınlaştırılması."
    ], accent=C_ACCENT_CYAN)
    add_card(s17, 8.93, 2.35, 3.6, 4.35, "3. Aşama (Büyükşehir Vizyonu)", "🔵", [
        "İlçe belediyeleri ile ortak operasyonel ara yüz paylaşımı.",
        "Şehir geneli entegre afet ve acil toplanma alanı izleme altyapısı.",
        "Akıllı şehircilikte dünya çapında örnek vaka."
    ], accent=C_ACCENT_BLUE)
    add_footer(s17, 17, total)

    # ─── 18. KAPANIŞ VE KARAR ÖZETİ ───────────────────────────────────────────
    s18 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s18)
    add_header(s18, "Karar Talebi ve Vizyon", "Sonuç ve Karar Özeti: 'Sahayı Yöneten, Şehri Yönetir'", category="SAHA YÖNETİM PANELİ (SYP)")
    add_takeaway(s18, "SYP ile İstanbul meydanları artık sahipsiz değil; her metrekaresi canlı takip ve kontrol altında.")

    add_card(s18, 0.8, 2.35, 5.66, 4.35, "Üst Yönetim Karar ve Eylem Adımları", "✅", [
        "1. Kurumsal Yetkilendirme: Saha amirlerinin panele veri giriş disiplininin onaylanması.",
        "2. Haftalık Brifing Entegrasyonu: Üst yönetim koordinasyon toplantılarının SYP üzerinden icra edilmesi.",
        "3. Kurumlar Arası Eşgüdüm: İlgili Daire Başkanlıklarının çözülemeyen kronik işler için SYP masasında toplanması.",
        "4. 2. Faz Yayılım Onayı: 39 ilçe geneline açılma takviminin başlatılması."
    ], accent=C_ACCENT_CYAN)

    add_card(s18, 6.86, 2.35, 5.66, 4.35, "Teşekkür & İletişim", "🤝", [
        "İSTANBUL BÜYÜKŞEHİR BELEDİYESİ",
        "Muhtarlık İşleri Dairesi Başkanlığı",
        "Meydan Yönetimi Birimi",
        "",
        "Saha Yönetim Paneli (SYP) Operasyon Ekibi",
        "📧 iletisim@ibb.gov.tr",
        "🏛️ İstanbul / 2026"
    ], accent=C_ACCENT_GREEN)
    add_footer(s18, 18, total)

    prs.save(filename)
    print(f"Executive Presentation saved successfully: {filename}")

def build_detailed_deck(filename="SYP_Detayli_Operasyonel_Sunum.pptx"):
    prs = create_deck()
    total = 16

    # ─── 1. KAPAK ─────────────────────────────────────────────────────────────
    s1 = prs.slides.add_slide(prs.slide_layouts[6])
    add_cover(s1, "SAHA YÖNETİM PANELİ (SYP)", 
              "Kapsamlı Operasyonel ve Fonksiyonel Sistem Kılavuzu & Bilgilendirme Raporu", 
              "Eylül 2026", is_executive=False)
    add_footer(s1, 1, total)

    # ─── 2. SISTEMIN AMACI VE VARLIK NEDENI ────────────────────────────────────
    s2 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s2)
    add_header(s2, "Operasyonel Vizyon", "Sistemin Amacı ve Varlık Nedeni: Hangi Problemleri Çözer?", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s2, "Sahadaki tüm aktörleri tek bir dijital gerçeklikte buluşturarak bürokrasiyi ve gecikmeyi yok ediyoruz.")
    add_card(s2, 0.8, 2.35, 5.66, 4.35, "Çözülen Temel Operasyonel Sorunlar", "🎯", [
        "Haberleşme Kopukluğu: Farklı birimlerin birbirinden habersiz saha çalışması yapması engellendi.",
        "Müdahale Gecikmeleri: Vatandaş şikayetlerinin ilgili saha ekibine iletilmesindeki kayıplar sıfırlandı.",
        "Denetim Eksikliği: Sahadaki personelin anlık nöbet ve görev durumunun şeffaflaşması sağlandı.",
        "Görünmeyen Kronik Problemler: Yıllardır tekrarlayan arızaların kök nedenlerine inilmesi sağlandı.",
        "Kayıtsız Ziyaretler: Protokol ve saha tespitlerinin kurumsal hafızaya işlenmesi sağlandı."
    ], accent=C_ACCENT_CYAN)
    add_card(s2, 6.86, 2.35, 5.66, 4.35, "Saha Yönetim Paneli Temel Misyonu", "🏛️", [
        "15 Odak Meydanın 7/24 Kesintisiz İzlenmesi: Canlı doluluk ve risk durumunun takibi.",
        "Vatandaş Odaklı Hizmet Çevikliği: Başvuruların açıldığı andan kapandığı ana kadar izlenmesi.",
        "Liyakat ve Ölçülebilirlik: Saha personelinin mesai ve görev disiplininin nesnel takibi.",
        "Karar Destek Gücü: Yöneticilerin hislerle değil, doğrulanmış saha verileriyle karar alması.",
        "Yüksek Kurumsal İtibar: Meydanların güvenli, temiz ve bakımlı tutulması."
    ], accent=C_ACCENT_BLUE)
    add_footer(s2, 2, total)

    # ─── 3. SAHA KAPSAMI (15 MEYDAN) ──────────────────────────────────────────
    s3 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s3)
    add_header(s3, "Operasyonel Alan", "Kurumsal Kapsam: 15 Stratejik Meydan ve Saha Ekipleri", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s3, "İstanbul'un en yoğun meydanları için standart operasyon prosedürleri ve asgari güç tanımı yapılmıştır.")
    add_card(s3, 0.8, 2.35, 3.6, 4.35, "Avrupa Yakası Meydanları", "🏙️", [
        "Taksim Meydanı (Beyoğlu)",
        "Bakırköy Özgürlük Meydanı",
        "Mecidiyeköy Meydanı (Şişli)",
        "Beşiktaş Meydanı & Barbaros",
        "Eminönü Meydanı (Fatih)",
        "Beyazıt & Sultanahmet Meydanları",
        "Aksaray, Şirinevler, Beylikdüzü, Esenyurt"
    ])
    add_card(s3, 4.86, 2.35, 3.6, 4.35, "Anadolu Yakası Meydanları", "🌊", [
        "Kadıköy Rıhtım & Çarşı Meydanı",
        "Üsküdar İskele Meydanı",
        "Ümraniye Meydanı",
        "Sahil şeridi bağlantı aksları",
        "Yolcu ve yaya transfer arterleri"
    ])
    add_card(s3, 8.93, 2.35, 3.6, 4.35, "Meydan Standartları", "⚖️", [
        "Asgari Personel Gücü: Her meydanın saat bazlı taban nöbetçi kotası.",
        "Denetim Periyodu: Günde en az 3 periyodik devriye turu.",
        "Meydan Sorumlusu: Her meydanda 1. derecede yetkili ve sorumlu amir.",
        "Ortak Envanter: Meydandaki kamusal donatıların kayıt altına alınması."
    ])
    add_footer(s3, 3, total)

    # ─── 4. KULLANICI ROLLERİ VE HİYERARŞİ ─────────────────────────────────────
    s4 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s4)
    add_header(s4, "Organizasyon Şeması", "Kullanıcı Rolleri ve Yetkilendirme Hiyerarşisi", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s4, "Her kademe yalnızca kendi sorumluluğundaki alana müdahale eder; yetki karmaşası önlenir.")
    add_card(s4, 0.8, 2.35, 2.7, 4.35, "Saha Personeli", "👷", [
        "Meydanda fiilen görev yapan ekip.",
        "Günlük nöbet ve devriyeyi icra eder.",
        "Altyapı aksaklıklarını yerinde tespit eder.",
        "Kişisel verilere erişimi yoktur; sadece iş emrini görür."
    ])
    add_card(s4, 3.8, 2.35, 2.7, 4.35, "Meydan Sorumlusu", "👔", [
        "Meydandaki personeli organize eder.",
        "Günlük vardiya yoklamasını onaylar.",
        "Gelen başvuruları doğrular ve çözer.",
        "Meydana ait ziyaret ve gözlem defterini tutar."
    ])
    add_card(s4, 6.8, 2.35, 2.7, 4.35, "Bölge Koordinatörü", "📋", [
        "Birden çok meydanı denetler.",
        "Personel açığı olan meydana takviye yönlendirir.",
        "Yaşlanan başvuruları ilgili dairelere resmi olarak sevk eder.",
        "Haftalık performans raporlarını onaylar."
    ])
    add_card(s4, 9.8, 2.35, 2.7, 4.35, "Üst Yönetim", "🏛️", [
        "Daire Başkanı ve Genel Sekreterlik.",
        "Tüm İstanbul genelindeki darboğazları izler.",
        "Günlük akıllı analitik brifingleri alır.",
        "Stratejik kaynak ve bütçe kararlarını verir."
    ])
    add_footer(s4, 4, total)

    # ─── 5. 24 SAATLİK SÜREÇ DÖNGÜSÜ ──────────────────────────────────────────
    s5 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s5)
    add_header(s5, "İşleyiş Rutini", "Günlük 24 Saatlik Operasyon Döngüsü: Açılıştan Geceye", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s5, "Saha yönetimi tesadüflere değil, disiplinli bir saatlik operasyon akışına bağlıdır.")
    add_card(s5, 0.8, 2.35, 3.6, 4.35, "Sabah Fazı (08:00 - 10:00)", "🌅", [
        "08:00: Gündüz vardiyası yoklaması ve panelde nöbet teyidi.",
        "08:30: Sistemin yöneticiye otomatik sabah brifingini üretmesi.",
        "09:00: Meydan şeflerinin açık kalan işleri personeline paylaştırması.",
        "Hava durumuna göre açık alan tedbirlerinin alınması."
    ])
    add_card(s5, 4.86, 2.35, 3.6, 4.35, "Gün İçi Canlı Takip (10:00 - 17:00)", "☀️", [
        "Vatandaştan gelen yeni başvuruların anlık ekrana düşmesi.",
        "Saha ekiplerinin olay yerine intikali ve yerinde inceleme.",
        "Çözülen işlerin fotoğraflanarak panelden kapatılması.",
        "Protokol ziyaretlerinin anında dijital deftere işlenmesi."
    ])
    add_card(s5, 8.93, 2.35, 3.6, 4.35, "Akşam ve Gece Fazı (17:00 - 00:00+)", "🌙", [
        "17:30: Gündüz vardiyası kapanışı ve akşam ekibine devir teslim.",
        "18:00: Günün çözülemeyen işlerinin yaşlandırma listesine eklenmesi.",
        "20:00: Aydınlatma, güvenlik ve gece yaya hareketliliği denetimi.",
        "23:59: Günlük operasyonel karnenin mühürlenmesi."
    ])
    add_footer(s5, 5, total)

    # ─── 6. PERSONEL VE VARDİYA SİSTEMİ ───────────────────────────────────────
    s6 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s6)
    add_header(s6, "İş Gücü Disiplini", "Canlı Personel ve Vardiya Yönetim Sistemi", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s6, "Hangi saatte hangi personelin hangi meydanda olduğu şeffaf ve denetlenebilirdir.")
    add_card(s6, 0.8, 2.35, 5.66, 4.35, "Vardiya ve Nöbet Planlama İlkeleri", "📅", [
        "Dinamik Takvim: Haftalık ve aylık bazda personelin vardiya atamaları.",
        "Görev Tanımları: Meydan şefi, nöbetçi amir, saha devriye, teknik personel ayrımı.",
        "İzin ve Rapor Yönetimi: Yıllık izin, mazeret ve sağlık raporlarının anlık işlenmesi.",
        "Fiili Mevcut Hesabı: İzinli olan personelin o günkü nöbet mevcudundan otomatik düşülmesi."
    ])
    add_card(s6, 6.86, 2.35, 5.66, 4.35, "Coverage (Saha Gücü Güvencesi)", "🛡️", [
        "Her meydanın güvenliği ve düzeni için belirlenmiş bir 'Asgari Personel Eşiği' vardır.",
        "Eğer izin veya hastalık sebebiyle mevcudiyet bu eşiğin altına inerse sistem alarm verir.",
        "Bölge koordinatörü derhal komşu meydandan veya yedek havuzdan personel kaydırır.",
        "Böylece hiçbir meydan sahipsiz veya gözetimsiz kalmaz."
    ])
    add_footer(s6, 6, total)

    # ─── 7. VATANDAS BASVURULARI ──────────────────────────────────────────────
    s7 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s7)
    add_header(s7, "Talep Çözüm Zinciri", "Vatandaş Başvuru ve Talep Yönetimi (12.000+ Kayıt)", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s7, "Her başvuru yasal taahhüt süresi ve çözüm durumuyla baştan sona izlenir.")
    add_card(s7, 0.8, 2.35, 3.6, 4.35, "Başvuru Kaynakları", "📥", [
        "ALO 153 Çözüm Merkezi kayıtları",
        "Meydandaki vatandaştan doğrudan gelen yüz yüze talepler",
        "Saha ekiplerinin devriye esnasında açtığı doğrudan arıza bildirimleri",
        "Sosyal medya ve dijital kanallardan aktarılan vakalar"
    ])
    add_card(s7, 4.86, 2.35, 3.6, 4.35, "Operasyonel Süreç Adımları", "⚙️", [
        "1. Kayıt ve Ön İnceleme: Konunun yetki alanı teyidi.",
        "2. Sahada İnceleme: Personelin arızayı yerinde görmesi.",
        "3. Müdahale: Kendi imkanlarıyla onarım veya ilgili Daireye sevk.",
        "4. Kapanış ve Teyit: İş bitim fotoğrafı ile kaydın tamamlanması."
    ])
    add_card(s7, 8.93, 2.35, 3.6, 4.35, "Statü ve Taahhüt Disiplini", "⏳", [
        "Yasal SLA Süresi: Her kategori için belirlenmiş maksimum çözüm süresi.",
        "Taahhüt Aşımı Riski: Sürenin bitimine 24 saat kala sarı alarm.",
        "Aşılmış İşler: Doğrudan koordinatör ekranında kırmızı alarm.",
        "Sıfır Kayıp: Sistemde hiçbir başvuru çözülmeden silinemez."
    ])
    add_footer(s7, 7, total)

    # ─── 8. KATEGORİK SINIFLANDIRMA ───────────────────────────────────────────
    s8 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s8)
    add_header(s8, "Talep Taksonomisi", "Başvuru Kategorizasyonu ve 11 Standart Başlık", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s8, "Doğru sınıflandırma, doğru ekibin hızla müdahale etmesini sağlar.")
    add_card(s8, 0.8, 2.35, 5.66, 4.35, "11 Temel Operasyon Kategorisi", "📂", [
        "1. Temizlik ve Atık: Çöp birikintileri, süpürme, konteyner talepleri.",
        "2. Zabıta & İntizam: Seyyar satıcı, işgaliye, dilencilik, meydan düzeni.",
        "3. Fen İşleri & Yol: Kırık kaldırım, çukur, mazgal ve kaplama arızaları.",
        "4. Park & Bahçeler: Ağaç budama, çim biçme, sulama sistemleri.",
        "5. Ulaşım & Trafik: Yaya geçidi, bariyer, durak ve yönlendirme eksiklikleri.",
        "6. Aydınlatma & Enerji: Yanmayan direkler, açık kablolar, armatürler.",
        "7. Sokak Hayvanları: Sahipsiz köpekler, besleme noktaları, veterinerlik.",
        "8. Sosyal Destek, Güvenlik, Etkinlik ve Diğer Çevre Başlıkları."
    ])
    add_card(s8, 6.86, 2.35, 5.66, 4.35, "Analitik Faydalar", "📊", [
        "Meydan İhtiyaç Profilinin Çıkarılması: Hangi meydan temizlikte, hangisi zabıtada yoğun?",
        "Bütçe ve Malzeme Planlaması: Kırılan taş türünden yanmayan armatür tipine kadar envanter öngörüsü.",
        "Mevsimsel Dalgalanmalar: Yaz aylarında yeşil alan, kış aylarında altyapı ağırlıklı talep hazırlığı.",
        "Destek Birimlerine Karne: İlgili dairelerin meydan bazlı çözüm performansının tespiti."
    ])
    add_footer(s8, 8, total)

    # ─── 9. YASLANDIRMA ANALİZİ ───────────────────────────────────────────────
    s9 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s9)
    add_header(s9, "Risk ve Süre Analitiği", "Yaşlandırma (Aging) Analitiği ve Darboğaz Tespiti", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s9, "Zamanında çözülmeyen her iş, vatandaş gözünde kurumsal güven kaybına dönüşür.")
    add_card(s9, 0.8, 2.35, 5.66, 4.35, "Yaşlandırma Aralıkları ve Anlamları", "⏳", [
        "🟢 0 - 7 Gün (Taze Dosyalar): Normal çözüm süreci içinde yer alan, ekiplerin üzerinde çalıştığı rutin işler.",
        "🟡 8 - 15 Gün (Takip Edilenler): İlgili birime sevk edilmiş ancak henüz kapatılmamış, gecikme potansiyeli taşıyan işler.",
        "🟠 16 - 30 Gün (Kritik Bölge): Meydan amirinin doğrudan müdahale etmesi gereken, ikinci kez hatırlatılan işler.",
        "🔴 30+ Gün (Kronik Tıkanıklık): Kurumlar arası mutabakat veya üst düzey talimat gerektiren yüksek riskli darboğazlar."
    ])
    add_card(s9, 6.86, 2.35, 5.66, 4.35, "Darboğaz Analizi Yöntemi", "🔍", [
        "Sorumlu Birim Analizi: 30 günü aşan işlerin hangi Daire Başkanlığında tıkandığının somutlaşması.",
        "Meydan Kıyaslaması: Bazı meydanlar 3 günde çözerken bazılarının 20 günde çözmesinin sebeplerinin araştırılması.",
        "Müteahhit ve İmalatçı Denetimi: Dış yüklenicilerin taahhütlerine uyumunun tespiti.",
        "Yöneticiye Otomatik Rapor: Haftalık koordinasyon gündemine doğrudan taşınan yaşlı dosyalar listesi."
    ])
    add_footer(s9, 9, total)

    # ─── 10. SAHA GÖZLEMLERİ VE KRONİK SORUNLAR ───────────────────────────────
    s10 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s10)
    add_header(s10, "Kökten İyileştirme", "Saha Gözlemleri, Kronik Aksaklıklar ve Çözüm Takibi", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s10, "Aynı yere 10 kez tamire gitmek yerine, kalıcı inşaat ve yenileme projesini tetikliyoruz.")
    add_card(s10, 0.8, 2.35, 5.66, 4.35, "Kronik Problemin Tanımı ve Tespiti", "🛠️", [
        "Tekrarlayan Vakalar: Aynı ızgaranın sürekli tıkanması, aynı trafonun sürekli atması.",
        "Yapısal Hatalar: Meydan projesinde hatalı eğim veya yetersiz drenaj sebebiyle oluşan su birikintileri.",
        "Ağır Yük Hasarları: Meydana giren ağır tonajlı araçların sürekli kırdığı granit zeminler.",
        "Saha Şefinin Gözlemi: Rutin başvuru olarak değil, 'Yapısal Problem' olarak işaretlenen konular."
    ])
    add_card(s10, 6.86, 2.35, 5.66, 4.35, "Kalıcı Çözüm Prosedürü", "📋", [
        "Özel Vaka Kaydı: Standart başvurudan ayrı, müstakil bir iyileştirme dosyası oluşturulur.",
        "İlgili Yatırımcı Daireye Sunum: Fen İşleri veya İSKİ yatırım programına alınması talep edilir.",
        "Fotoğraflı Öncesi/Sonrası Belgeleme: İmalatın her safhası görsel olarak arşivlenir.",
        "Kapanış Doğrulaması: Meydan sorumlusu ve teknik heyet yerinde incelemeden dosya arşive kalkamaz."
    ])
    add_footer(s10, 10, total)

    # ─── 11. ZİYARET VE PROTOKOL DEFTERİ ──────────────────────────────────────
    s11 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s11)
    add_header(s11, "İdari Hafıza", "Protokol ve İdari Ziyaret Defteri: Kurumsal Hafıza", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s11, "Yöneticilerin sahada verdiği sözler ve talimatlar uçup gitmez, sistemde somut göreve dönüşür.")
    add_card(s11, 0.8, 2.35, 3.6, 4.35, "Protokol Heyet Kayıtları", "🏛️", [
        "Başkanlık Heyeti saha incelemeleri",
        "Genel Sekreter ve Yardımcıları ziyaretleri",
        "Daire Başkanları ve Meclis Üyeleri tespitleri",
        "Kaymakamlık ve İlçe Belediye ortak turları"
    ])
    add_card(s11, 4.86, 2.35, 3.6, 4.35, "Talimatların Görevleşmesi", "✍️", [
        "Heyet tarafından sahada verilen sözlü talimatlar anında deftere girilir.",
        "Talimat birime atanır ve yasal hedef tarih tanımlanır.",
        "Meydan amiri talimatın icrasını adım adım takip eder."
    ])
    add_card(s11, 8.93, 2.35, 3.6, 4.35, "Kurumsal Hesap Verebilirlik", "📖", [
        "Geçmişte hangi meydanda ne konuşuldu, ne talep edildi?",
        "Ziyaret sonrasında yapılan iyileştirmelerin karnesi.",
        "Yöneticiye: 'Geçen ayki ziyaretinizde talep ettiğiniz 4 konu tamamlandı' raporu sunabilme gücü."
    ])
    add_footer(s11, 11, total)

    # ─── 12. METEOROLOJİK RİSK HARİTASI ───────────────────────────────────────
    s12 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s12)
    add_header(s12, "İş Güvenliği & Tedbir", "Anlık Meteoroloji ve Açık Alan Ekipleri Emniyet Modeli", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s12, "Açık alan çalışanlarının sağlığı ve meydan güvenliği hava koşullarına göre dinamik korunur.")
    add_card(s12, 0.8, 2.35, 5.66, 4.35, "Meydan Düzeyinde Canlı Veri", "⛅", [
        "İstanbul'un mikroiklim gerçeği: Kadıköy açıkken Sarıyer'de şiddetli yağış olabilir.",
        "15 meydanın her biri için ayrı anlık sıcaklık, rüzgar ve yağış durumu izlenir.",
        "Sahil meydanları (Beşiktaş, Üsküdar, Kadıköy) için deniz kaynaklı rüzgar ve dalga ikazları.",
        "İç meydanlar için don ve buzlanma risk haritaları."
    ])
    add_card(s12, 6.86, 2.35, 5.66, 4.35, "İş Güvenliği ve Operasyon Tedbirleri", "🦺", [
        "Aşırı Sıcaklar: Açık alanda aralıksız devriye sürelerinin kısaltılması ve gölgelik nöbet noktaları.",
        "Fırtına ve Şiddetli Rüzgar: Meydandaki reklam panoları, süslemeler ve bayrakların emniyete alınması.",
        "Kar ve Buzlanma: Yaya geçiş akslarında solüsyon ve tuzlama ekiplerinin önceden konuşlandırılması.",
        "Personel Kıyafet Kontrolü: Hava koşullarına uygun kişisel koruyucu donanım takibi."
    ])
    add_footer(s12, 12, total)

    # ─── 13. KARAR DESTEK VE AKILLI BRİFİNG ───────────────────────────────────
    s13 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s13)
    add_header(s13, "Yönetim Zekâsı", "Karar Destek Sistemi ve Akıllı Günlük Brifing Mekanizması", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s13, "Yöneticiye yüzlerce veri tablosu değil; doğrudan aksiyona dönüşecek 3 net karar maddesi sunulur.")
    add_card(s13, 0.8, 2.35, 5.66, 4.35, "Analitik Özetleme Yöntemi", "💡", [
        "Veri Filtreleme: Binlerce başvuru, onlarca personel ve 15 meydan içinden istisnalar ayrıştırılır.",
        "Risk Skorlaması: En yüksek gecikme riskine sahip işler matematiksel olarak sıralanır.",
        "Kapasite Dengesi: Boşta personeli olan meydan ile personele acil ihtiyaç duyan meydan tespit edilir.",
        "Yöneticiye Hazır Özet: Her sabah tek sayfalık net durum özeti üretilir."
    ])
    add_card(s13, 6.86, 2.35, 5.66, 4.35, "Brifing Çıktısı Nasıl Kullanılır?", "📋", [
        "Sabah Koordinasyon Toplantısı: Yönetici doğrudan brifingdeki 3 maddeyi gündeme alır.",
        "İlgili Daire Başkanının Aranması: 'Şu meydanda şu iş 20 gündür bekliyor, bugün çözülmesini bekliyoruz.'",
        "Kaynak Tahsisi: Sahada iş yoğunluğu yaşanan meydana çevre birimlerden destek gönderilmesi.",
        "Haftalık Trend: Hangi sorunların kronikleştiğinin somut takibi."
    ])
    add_footer(s13, 13, total)

    # ─── 14. KVKK VE KİŞİSEL VERİLERİN KORUNMASI ───────────────────────────────
    s14 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s14)
    add_header(s14, "Hukuki Uyumluluk", "KVKK ve Kişisel Verilerin Korunması Standartları", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s14, "Saha yönetiminde en üst seviye veri mahremiyeti ve mevzuat disiplini uygulanır.")
    add_card(s14, 0.8, 2.35, 3.6, 4.35, "Veri Maskeleme Politikası", "🔒", [
        "Vatandaşın T.C. Kimlik Numarası sistemde asla açık tutulmaz: 123*****89 şeklinde maskelenir.",
        "Telefon numaraları operasyon ekranlarında yıldızlı gösterilir.",
        "Kişisel isimler yalnızca yetkili koordinatör ekranında görünür.",
        "Saha ekipleri vatandaşı arayamaz, sadece fiziksel sorunu çözer."
    ])
    add_card(s14, 4.86, 2.35, 3.6, 4.35, "İhtiyaç Kadar Bilgi Prensibi", "🛡️", [
        "Saha personeli görevini yapmak için vatandaşın kim olduğuna ihtiyaç duymaz.",
        "Gerekli olan tek şey: Konum ve arızanın niteliğidir.",
        "Gereksiz hiçbir kişisel veri sahaya aktarılmaz ve depolanmaz.",
        "6698 sayılı KVKK mevzuatına tam uyum sağlanır."
    ])
    add_card(s14, 8.93, 2.35, 3.6, 4.35, "Veri Saklama ve İmha", "🗑️", [
        "Tamamlanan başvuruların kişisel veri kısımları yasal süre sonunda anonimleştirilir.",
        "İstatistiki analizler için sadece kategorik ve coğrafi veriler saklanır.",
        "Kurum dışına hiçbir surette ham veri çıkarılamaz ve kopyalanamaz."
    ])
    add_footer(s14, 14, total)

    # ─── 15. BİLGİ GÜVENLİĞİ VE AUDIT LOG ──────────────────────────────────────
    s15 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s15)
    add_header(s15, "Sistem Güvenliği", "Bilgi Güvenliği, Erişim Kontrolleri ve Denetim İzi", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s15, "Sistemdeki her hareket, her tıklama ve her güncelleme saniyesi saniyesine kayıt altındadır.")
    add_card(s15, 0.8, 2.35, 5.66, 4.35, "Erişim Güvenliği İlkeleri", "🔑", [
        "Kişiye Özel Yetkilendirme: Her kullanıcının kendi unvan ve görevine uygun yetki profili.",
        "Güçlü Kimlik Doğrulama: Yetkisiz girişlere karşı güvenli kimlik kontrol mekanizması.",
        "Rol Ayrılığı: Personel yetkisi olan kullanıcı rapor değiştiremez; şef yetkisi olan koordinatör kararı alamaz.",
        "Ekran Koruma: Hassas verilerin kontrolsüz kopyalanmasını önleyen yetki kısıtlamaları."
    ])
    add_card(s15, 6.86, 2.35, 5.66, 4.35, "Denetim İzi (Audit Log) Mekanizması", "📜", [
        "Kim, ne zaman, hangi meydanın hangi kaydını inceledi?",
        "Bir başvurunun durumunu kim 'Tamamlandı' olarak değiştirdi?",
        "Geriye dönük tüm idari ve hukuki soruşturmalarda delil niteliğinde sistem kütüğü.",
        "Veri bütünlüğü ve hesap verebilirlik ilkelerinin eksiksiz teminatı."
    ])
    add_footer(s15, 15, total)

    # ─── 16. KAZANIMLAR VE SONUÇ ──────────────────────────────────────────────
    s16 = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s16)
    add_header(s16, "Kurumsal Fayda", "Ölçülebilir Operasyonel Kazanımlar ve Kurumsal Değer", category="FONKSİYONEL SİSTEM RAPORU")
    add_takeaway(s16, "SYP, sahadaki emeği görünür kılan ve belediyemizin hizmet kalitesini tescilleyen modern bir platformdur.")
    add_card(s16, 0.8, 2.35, 3.6, 4.35, "Operasyonel Hız ve Çeviklik", "⚡", [
        "Saha müdahale sürelerinde %38 hızlanma",
        "Taahhüt aşımı yaşayan dosya oranında %45 gerileme",
        "Telefon ve mesaj karmaşasından kurtulan verimli amir kadrosu",
        "Meydanlar arası adil ve dengeli iş yükü dağılımı"
    ])
    add_card(s16, 4.86, 2.35, 3.6, 4.35, "Şeffaflık ve Kurumsal İtibar", "⭐", [
        "Vatandaşın başvurusunu yerinde hızla çözen aktif belediye algısı",
        "Tüm meydanların düzenli, güvenli ve bakımlı tutulması",
        "Geçmişe dönük eksiksiz idari hafıza ve vaka arşivi",
        "Denetlenebilir ve hesap verebilir yönetim kültürü"
    ])
    add_card(s16, 8.93, 2.35, 3.6, 4.35, "Gelecek Perspektifi", "🚀", [
        "İstanbul'un 39 ilçesindeki tüm meydan ve parkların sisteme entegrasyonu",
        "Diğer büyükşehir birimleri için rol model olan dijital saha standardı",
        "Akıllı şehircilikte Türkiye'nin öncü saha yönetim platformu",
        "Sıfır hata, sıfır gecikme ve tam memnuniyet hedefi"
    ])
    add_footer(s16, 16, total)

    prs.save(filename)
    print(f"Detailed Operational Presentation saved successfully: {filename}")

if __name__ == "__main__":
    build_executive_deck("SYP_Ust_Duzey_Yonetici_Sunumu.pptx")
    build_detailed_deck("SYP_Detayli_Operasyonel_Sunum.pptx")
    print("ALL PRESENTATIONS GENERATED SUCCESSFULLY!")
