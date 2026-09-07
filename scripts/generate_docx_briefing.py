import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_shading(cell, color_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CCCCCC", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="none"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_callout_box(doc, text_list, title="ÖNEMLİ BİLGİ"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_shading(cell, "F0F4F8")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="00498E"/>'
        f'  <w:top w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'  <w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    run_title = p.add_run(f"📌 {title}")
    run_title.font.name = "Segoe UI"
    run_title.font.size = Pt(10.5)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0, 73, 142)
    
    for item in text_list:
        p2 = cell.add_paragraph()
        p2.paragraph_format.space_before = Pt(2)
        p2.paragraph_format.space_after = Pt(2)
        p2.paragraph_format.line_spacing = 1.15
        run_text = p2.add_run(item)
        run_text.font.name = "Segoe UI"
        run_text.font.size = Pt(9.5)
        run_text.font.color.rgb = RGBColor(30, 41, 59)
    
    # spacing after table
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(4)
    p_after.paragraph_format.space_after = Pt(6)

def create_document():
    doc = Document()
    
    # Set page margins (1 inch / 2.54 cm)
    for section in doc.sections:
        section.top_margin = Inches(0.9)
        section.bottom_margin = Inches(0.9)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        
        # Header / Footer
        footer = section.footer
        p_foot = footer.paragraphs[0]
        p_foot.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        f_run = p_foot.add_run("İBB Meydan Yönetimi — Saha Yönetim Portalı (SYP) | Bilgi Notu")
        f_run.font.name = "Segoe UI"
        f_run.font.size = Pt(8.5)
        f_run.font.color.rgb = RGBColor(148, 163, 184)
        
    # --- HEADER / TITLE BLOCK ---
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_inst.paragraph_format.space_before = Pt(0)
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst = p_inst.add_run("İSTANBUL BÜYÜKŞEHİR BELEDİYESİ")
    r_inst.font.name = "Segoe UI"
    r_inst.font.size = Pt(11)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(0, 128, 204) # Cyan Blue

    p_subinst = doc.add_paragraph()
    p_subinst.paragraph_format.space_before = Pt(0)
    p_subinst.paragraph_format.space_after = Pt(8)
    r_subinst = p_subinst.add_run("Muhtarlık İşleri Dairesi Başkanlığı | Meydan Yönetimi Birimi")
    r_subinst.font.name = "Segoe UI"
    r_subinst.font.size = Pt(10)
    r_subinst.font.color.rgb = RGBColor(100, 116, 139)

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("SAHA YÖNETİM PORTALI (SYP)")
    r_title.font.name = "Segoe UI Semibold"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0, 73, 142) # IBB Navy

    p_subtitle = doc.add_paragraph()
    p_subtitle.paragraph_format.space_before = Pt(0)
    p_subtitle.paragraph_format.space_after = Pt(12)
    r_sub = p_subtitle.add_run("Kapsamlı Sistem Bilgi Notu, Mimari Yapı & Fonksiyonel Rapor")
    r_sub.font.name = "Segoe UI"
    r_sub.font.size = Pt(12.5)
    r_sub.font.color.rgb = RGBColor(51, 65, 85)

    # Metadata Strip Table
    meta_table = doc.add_table(rows=1, cols=3)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    
    col_widths = [Inches(2.1), Inches(2.2), Inches(2.2)]
    meta_data = [
        ("📅 Rapor Tarihi", "28 Ağustos 2026"),
        ("⚡ Sistem Durumu", "v1.0 (Production Ready)"),
        ("🎯 Hedef Kitle", "Meydan Yönetimi & Koordinatörlük")
    ]
    for idx, (label, val) in enumerate(meta_data):
        cell = meta_table.cell(0, idx)
        cell.width = col_widths[idx]
        set_cell_shading(cell, "F8FAFC")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        
        r1 = p.add_run(f"{label}: ")
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(8.5)
        r1.font.bold = True
        r1.font.color.rgb = RGBColor(0, 73, 142)
        
        r2 = p.add_run(val)
        r2.font.name = "Segoe UI"
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = RGBColor(71, 85, 105)
        
    set_table_borders(meta_table, color="E2E8F0", sz="4")
    
    # Separator
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(10)
    p_div.paragraph_format.space_after = Pt(10)

    # Helper for Headings
    def add_custom_heading(text, level=1):
        p = doc.add_paragraph()
        if level == 1:
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(text)
            run.font.name = "Segoe UI Semibold"
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0, 73, 142)
        elif level == 2:
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(text)
            run.font.name = "Segoe UI Semibold"
            run.font.size = Pt(11.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0, 128, 204)
        return p

    def add_body_paragraph(text, bold_prefix=None, bullet=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        
        if bullet:
            p.paragraph_format.left_indent = Inches(0.25)
            r_bullet = p.add_run("▪  ")
            r_bullet.font.name = "Segoe UI"
            r_bullet.font.size = Pt(9.5)
            r_bullet.font.color.rgb = RGBColor(0, 128, 204)
            
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.name = "Segoe UI"
            r_pre.font.size = Pt(10)
            r_pre.font.bold = True
            r_pre.font.color.rgb = RGBColor(30, 41, 59)
            
        r_txt = p.add_run(text)
        r_txt.font.name = "Segoe UI"
        r_txt.font.size = Pt(10)
        r_txt.font.color.rgb = RGBColor(51, 65, 85)
        return p

    # --- SECTION 1: YÖNETİCİ ÖZETİ ---
    add_custom_heading("1. Yönetici Özeti (Executive Summary)", level=1)
    add_body_paragraph(
        "Saha Yönetim Paneli (SYP), İstanbul Büyükşehir Belediyesi'nin 39 ilçesinde yer alan stratejik meydanların ve saha ekiplerinin "
        "operasyonel koordinasyonunu uçtan uca dijitalleştiren kapsamlı bir Karar Destek Sistemidir (Decision Support System). "
        "Manuel Excel dosyaları, dağınık vardiya çizelgeleri ve kopuk iletişim kanalları yerine; tek bir merkezi ekrandan sahanın canlı nabzını tutmayı sağlar."
    )
    add_body_paragraph(
        "Sistem, sahadaki personel durumunu, açık vatandaş başvurularını (12.000+ kayıt), kronik altyapı/çevre problemlerini, anlık hava koşullarını "
        "ve DeepSeek Yapay Zekâ motorunun oluşturduğu günlük operasyonel brifingleri entegre bir biçimde yöneticilere sunmaktadır."
    )
    
    add_callout_box(
        doc,
        [
            "• 39 İlçe & Meydan Entegrasyonu: Tüm İstanbul çapında homojen saha görünürlüğü.",
            "• 12.094 Aktif Başvuru Analizi: 11 standart kategoride otomatik NLP konu sınıflandırması.",
            "• DeepSeek AI Destekli Günlük Brifing: Her sabah yöneticiye anlık saha risk ve koordinasyon raporu.",
            "• Canlı Meteoroloji: Açık alan ekipleri için anlık rüzgar, yağış ve sıcaklık takibi."
        ],
        title="SYP TEMEL DEĞER VE KAZANIMLARI"
    )

    # --- SECTION 2: TEKNOLOJİ YIĞINI & MİMARİ ---
    add_custom_heading("2. Sistem Mimarisi ve Teknoloji Yığını", level=1)
    add_body_paragraph(
        "SYP, modern web standartlarına tam uyumlu, modüler, güvenli ve yüksek performanslı bileşenlerle inşa edilmiştir:"
    )
    
    add_body_paragraph(
        "React 19 ve Vite 8 tabanlı Single Page Application (SPA). React Router v7 ile hızlı sayfa geçişleri, Recharts ile interaktif veri grafikleri ve Heroicons ikon seti kullanılmıştır.",
        bold_prefix="Kullanıcı Arayüzü (Frontend): ",
        bullet=True
    )
    add_body_paragraph(
        "Node.js tabanlı HTTP Proxy (Port: 8787). DeepSeek AI ve OpenWeather API çağrılarını istemci dışından güvenli yönetir, exponential backoff ile hata toleransı sağlar.",
        bold_prefix="API Proxy & Entegrasyon Servisi: ",
        bullet=True
    )
    add_body_paragraph(
        "Google Cloud Firebase NoSQL Veritabanı. 12 bini aşkın belgeyi milisaniyeler seviyesinde sorgulayabilen yapılandırılmış koleksiyonlar ve granüler güvenlik kuralları (Firestore Security Rules).",
        bold_prefix="Veritabanı Katmanı (Firestore): ",
        bullet=True
    )
    add_body_paragraph(
        "Toplu Excel (.xlsx) verilerini tarayan, eksik alanları temizleyen ve Firestore Free Tier kotasını korumak için 250'lik gruplar (chunks) halinde aktaran veri hattı.",
        bold_prefix="Toplu Veri İşleme Motoru (Batch Processing): ",
        bullet=True
    )

    # --- SECTION 3: TEMEL MODÜLLER ---
    add_custom_heading("3. Temel Modüller ve Fonksiyonel Yetenekler", level=1)
    
    add_custom_heading("3.1. Yönetici Karar Destek ve Yapay Zekâ Brifingi (Executive Briefing)", level=2)
    add_body_paragraph(
        "Ana panelin en üstünde yer alan yapay zekâ motoru; o gün görevli personel sayısını, izinli durumlarını, meydanlardaki açık başvuru yoğunluğunu "
        "ve kronik sorunları tarayarak yöneticiye hap bilgiler şeklinde 'Günün Saha Tavsiyesi' ve 'Özet Durum Raporu' oluşturur."
    )
    
    add_custom_heading("3.2. İnteraktif İstanbul Saha Haritası (IstanbulFieldMap)", level=2)
    add_body_paragraph(
        "39 ilçeyi kapsayan vektörel harita üzerinden meydanların aktiflik durumu, personel sayısı ve açık başvuru yükü renk kodlarıyla görselleştirilir. "
        "Yöneticiler haritadan tek tıklamayla ilgili meydanın detay sayfasına geçiş yapabilir."
    )

    add_custom_heading("3.3. Meydan Detay ve Gündem Portalı (MeydanDetail)", level=2)
    add_body_paragraph(
        "Her meydan için özel hazırlanan detay sayfasında:",
        bullet=False
    )
    add_body_paragraph("Canlı Hava Durumu: OpenWeather entegrasyonuyla sıcaklık, nem, rüzgar ve saatlik yağış tahmini.", bullet=True)
    add_body_paragraph("Günlük Vardiya Listesi: Meydanda o gün nöbetçi personeller, çalışma saatleri ve iletişim bilgileri.", bullet=True)
    add_body_paragraph("Başvuru Analizi: Kategori filtresi, aylık başvuru trendi (LineChart), konu dağılımı (BarChart) ve açık kayıt yaş analizi.", bullet=True)
    add_body_paragraph("Meydan Okuma Notları: Sahadan gelen operasyonel durum notları ve arşiv kayıtları.", bullet=True)

    add_custom_heading("3.4. Personel Performans ve Görev Dağılımı (PersonelDetail)", level=2)
    add_body_paragraph(
        "Personel bazlı sayfada; personelin hangi meydanlarda kaç gün görev yaptığı (PieChart), toplam nöbet gün sayısı, izin geçmişi ve sahada oluşturduğu çözüm kayıtlarının dönemsel istatistikleri sunulur."
    )

    add_custom_heading("3.5. Başvuru Normalizasyonu ve NLP Kategorilendirme", level=2)
    add_body_paragraph(
        "12.094 adet İBB Beyazmasa / Saha başvurusu; 'BAKIM ONARIM', 'AYDINLATMA', 'PEYZAJ VE YEŞİL ALAN', 'ZABITA VE ASAYİŞ', 'ULAŞIM' gibi 11 ana standart kategoriye otomatik eşleştirilmiş ve güvenilirlik puanı (0.00 - 1.00) ile etiketlenmiştir."
    )

    add_custom_heading("3.6. Excel İçe Aktarma & Veri Yönetim Sihirbazı", level=2)
    add_body_paragraph(
        "Yöneticiler yeni ayın vardiya çizelgelerini, personel izin listelerini veya kronik sorun listelerini doğrudan panel üzerinden sürükle-bırak yöntemiyle yükleyebilir. Sistem hatalı satırları ayıklar ve onay sonrası Firestore'a yazar."
    )

    # --- SECTION 4: VERİ MODELİ TABLOSU ---
    add_custom_heading("4. Firestore Veritabanı Şeması ve Koleksiyonlar", level=1)
    add_body_paragraph(
        "Sistem NoSQL yapıda tasarlanmış olup koleksiyon mimarisi aşağıdaki gibidir:"
    )

    t_schema = doc.add_table(rows=8, cols=3)
    t_schema.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_schema.autofit = False
    
    t_schema_widths = [Inches(1.8), Inches(2.2), Inches(2.5)]
    headers = ["Koleksiyon Adı", "Kullanım Amacı", "Örnek Veri Alanları"]
    
    for c_idx, h_text in enumerate(headers):
        cell = t_schema.cell(0, c_idx)
        cell.width = t_schema_widths[c_idx]
        set_cell_shading(cell, "00498E")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(h_text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(9.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)

    schema_rows = [
        ("meydanlar", "39 İlçe / Meydan ana tanım kartları", "id, isim, tamAd, ilce, lat, lon, aktif"),
        ("vardiyalar", "Günlük & aylık personel çalışma kayıtları", "personelAdi, meydanId, tarih, saatAraligi, vardiyaTipi"),
        ("meydanBasvurulari", "12.094 adet vatandaş saha başvurusu", "basvuruNo, meydanId, category, durum, konu, tarih"),
        ("meydanBasvuruStats", "Meydan başına önceden hesaplanan özetler", "toplamBasvuru, durumDagilimi, categoryDagilimi, aylikDagilim"),
        ("meydanFaaliyetRaporlari", "Aylık faaliyet raporu PDF ve chunkları", "baslik, ay, yil, dosyaAdi, chunkCount, createdAt"),
        ("kronikSorunlar", "Meydanlardaki süreğen altyapı/çevre sorunları", "meydanId, baslik, oncelik, sorumluBirim, durum"),
        ("personelIzinleri", "Personel yıllık ve mazeret izinleri", "personelAdi, baslangicTarihi, bitisTarihi, izinTuru")
    ]

    for r_idx, (col1, col2, col3) in enumerate(schema_rows, start=1):
        row_bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([col1, col2, col3]):
            cell = t_schema.cell(r_idx, c_idx)
            cell.width = t_schema_widths[c_idx]
            set_cell_shading(cell, row_bg)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            run = p.add_run(val)
            run.font.name = "Segoe UI"
            run.font.size = Pt(8.5)
            if c_idx == 0:
                run.font.bold = True
                run.font.color.rgb = RGBColor(0, 73, 142)
            else:
                run.font.color.rgb = RGBColor(51, 65, 85)
                
    set_table_borders(t_schema, color="CBD5E1", sz="4")

    # Spacing after table
    p_sp1 = doc.add_paragraph()
    p_sp1.paragraph_format.space_before = Pt(8)
    p_sp1.paragraph_format.space_after = Pt(4)

    # --- SECTION 5: GÜVENLİK VE KVKK ---
    add_custom_heading("5. Veri Güvenliği, KVKK ve Gizlilik Standartları", level=1)
    add_body_paragraph(
        "Sistem üzerinde kamu verisinin gizliliği ve Kişisel Verilerin Korunması Kanunu (KVKK) gereksinimleri titizlikle uygulanmıştır:"
    )
    add_body_paragraph(
        "Veritabanından ve Excel aktarımlarından personellere veya vatandaşlara ait T.C. Kimlik Numaraları ve özel telefon numaraları taranarak arındırılmış; anonim ve maskeli kimlik yapısına geçilmiştir.",
        bold_prefix="PII (Kişisel Veri) Arındırma: ",
        bullet=True
    )
    add_body_paragraph(
        "DeepSeek AI ve OpenWeather API anahtarları istemci (browser) tarafına sızdırılmaz. Tüm harici istekler backend proxy üzerinden izole şekilde yönetilir.",
        bold_prefix="API Güvenlik Duvarı: ",
        bullet=True
    )
    add_body_paragraph(
        "Firestore kuralları üzerinde yetkisiz belge silme veya yetkisiz veri manipülasyonunu engelleyen sıkı güvenlik politikaları uygulanmıştır.",
        bold_prefix="Kural Tabanlı Veri Erişimi (Firestore Rules): ",
        bullet=True
    )

    # --- SECTION 6: ÇALIŞTIRMA VE OPERASYON KOMUTLARI ---
    add_custom_heading("6. Çalıştırma, Dağıtım ve Otomasyon Komutları", level=1)
    add_body_paragraph(
        "Sistemin geliştirme, veri aktarımı ve yayına alma aşamalarında kullanılan temel komutlar şunlardır:"
    )

    t_cmd = doc.add_table(rows=7, cols=2)
    t_cmd.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_cmd.autofit = False
    
    t_cmd_widths = [Inches(2.5), Inches(4.0)]
    cmd_headers = ["Komut", "İşlev ve Açıklama"]
    
    for c_idx, h_text in enumerate(cmd_headers):
        cell = t_cmd.cell(0, c_idx)
        cell.width = t_cmd_widths[c_idx]
        set_cell_shading(cell, "00498E")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        run = p.add_run(h_text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(9.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)

    cmd_rows = [
        ("npm run dev:full", "Önerilen: Frontend (:5173) ve AI/Hava Proxy (:8787) servislerini eş zamanlı başlatır."),
        ("npm run dev", "Sadece Vite React arayüz geliştirme sunucusunu başlatır."),
        ("npm run proxy:ai", "Sadece arka plan AI ve Weather proxy sunucusunu başlatır."),
        ("npm run build", "Canlı yayın (Production) paketini derler (dist/ klasörü)."),
        ("npm run import:basvurular:dry", "12.094 başvuruyu veritabanına yazmadan doğrular (Dry-run simülasyonu)."),
        ("npm run import:basvurular", "Excel başvuru verilerini normalize edip Firestore'a batch olarak yazar.")
    ]

    for r_idx, (c_cmd, c_desc) in enumerate(cmd_rows, start=1):
        row_bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([c_cmd, c_desc]):
            cell = t_cmd.cell(r_idx, c_idx)
            cell.width = t_cmd_widths[c_idx]
            set_cell_shading(cell, row_bg)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            run = p.add_run(val)
            run.font.name = "Consolas" if c_idx == 0 else "Segoe UI"
            run.font.size = Pt(8.5)
            if c_idx == 0:
                run.font.bold = True
                run.font.color.rgb = RGBColor(0, 73, 142)
            else:
                run.font.color.rgb = RGBColor(51, 65, 85)
                
    set_table_borders(t_cmd, color="CBD5E1", sz="4")

    # Spacing
    p_sp2 = doc.add_paragraph()
    p_sp2.paragraph_format.space_before = Pt(8)
    p_sp2.paragraph_format.space_after = Pt(4)

    # --- SECTION 7: SONUÇ VE GELECEK VİZYONU ---
    add_custom_heading("7. Sonuç ve Önerilen Sonraki Adımlar", level=1)
    add_body_paragraph(
        "Saha Yönetim Paneli (SYP), İstanbul genelindeki meydan yönetimini modern bir kurumsal zekâ platformuna dönüştürmüştür. "
        "Sistemin gelecekteki operasyonel kabiliyetini daha da artırmak adına şu geliştirmeler önerilmektedir:"
    )
    add_body_paragraph(
        "İBB Active Directory / LDAP entegrasyonu ile rol bazlı yetkilendirme (Yönetici, Koordinatör, Saha Şefi, Saha Personeli).",
        bold_prefix="1. İBB Kurumsal Kimlik Entegrasyonu (SSO): ",
        bullet=True
    )
    add_body_paragraph(
        "Personelin sahadayken cep telefonundan fotoğraf ve anlık durum notu yükleyebileceği optimize mobil saha arayüzü.",
        bold_prefix="2. Saha Mobil Uygulaması (PWA): ",
        bullet=True
    )
    add_body_paragraph(
        "Aşırı yağış/fırtına uyarılarında veya kritik başvuru artışlarında sahadaki personele ve amirlere anlık SMS / WhatsApp / Push bildirim iletimi.",
        bold_prefix="3. Anlık Push ve Alarm Sistemi: ",
        bullet=True
    )

    # Output file path
    output_path = os.path.abspath("SYP_Saha_Yonetim_Paneli_Bilgi_Notu.docx")
    doc.save(output_path)
    print(f"Word belgesi basariyla olusturuldu: {output_path}")

if __name__ == "__main__":
    create_document()
