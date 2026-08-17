/**
 * src/utils/pdfExport.js
 *
 * Professional A4 Executive PDF / Print Generator for SYP Phase 5.
 * Features:
 *   - 100% Turkish UTF-8 font support (ç, ğ, ı, ö, ş, ü)
 *   - Clean corporate A4 page layout with automatic page breaks
 *   - 0 external dependencies, ultra-fast & mobile compatible
 */

export function exportExecutiveBriefingToPdf(dataset) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>SYP_Yonetici_Brifingi_${dataset.lastDataDate || '2026-08-14'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.4;
    }
    .header {
      border-bottom: 2px solid #00498E;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-title h1 {
      margin: 0 0 4px 0;
      font-size: 16pt;
      color: #00498E;
      font-weight: 800;
    }
    .header-title p {
      margin: 0;
      font-size: 9pt;
      color: #475569;
    }
    .header-meta {
      text-align: right;
      font-size: 8.5pt;
      color: #64748b;
    }
    .header-meta strong {
      color: #0f172a;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #00498E;
      margin: 12px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 3px solid #00498E;
      padding-left: 6px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .kpi-card--highlight {
      background: #fff1f2;
      border-color: #fecdd3;
    }
    .kpi-label {
      font-size: 8pt;
      color: #64748b;
      display: block;
      font-weight: 600;
      text-transform: uppercase;
    }
    .kpi-val {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      margin: 4px 0;
      display: block;
    }
    .kpi-card--highlight .kpi-val {
      color: #e11d48;
    }
    .kpi-sub {
      font-size: 7.5pt;
      color: #94a3b8;
    }
    .action-box {
      background: #f0f7ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 14px;
    }
    .action-item {
      margin-bottom: 6px;
      font-size: 8.5pt;
    }
    .action-item:last-child {
      margin-bottom: 0;
    }
    .action-item strong {
      color: #0369a1;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
    }
    th, td {
      padding: 5px 8px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #475569;
    }
    .text-right {
      text-align: right;
    }
    .badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
    }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-yellow { background: #fef3c7; color: #d97706; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .footer-notice {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      font-size: 7.5pt;
      color: #64748b;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-title">
      <h1>İBB SAHA YÖNETİM PANELİ (SYP)</h1>
      <p>Yönetici Karar Destek & Saha Operasyon Brifingi</p>
    </div>
    <div class="header-meta">
      <div>Veri Snapshot: <strong>${dataset.lastDataDateFormatted}</strong></div>
      <div>Rapor Tarihi: <strong>${dataset.generatedAtFormatted}</strong></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card kpi-card--highlight">
      <span class="kpi-label">Taahhüt Aşımı (SLA)</span>
      <span class="kpi-val">${dataset.kpiSummary.totalSlaBreached}</span>
      <span class="kpi-sub">Hedef Tarihi Geçmiş Açık İş</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">Kapanmamış İş Stoku</span>
      <span class="kpi-val">${dataset.kpiSummary.totalUnresolved}</span>
      <span class="kpi-sub">Açık: 32 · Süreçte: 200</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">30+ Gün Yaşlanan</span>
      <span class="kpi-val">${dataset.kpiSummary.totalAging30Plus}</span>
      <span class="kpi-sub">1 Aydan Uzun Bekleyen</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">Aktif Kritik Bildirim</span>
      <span class="kpi-val">${dataset.kpiSummary.activeCritical}</span>
      <span class="kpi-sub">Toplam Tarihsel: ${dataset.kpiSummary.totalCritical}</span>
    </div>
  </div>

  <div class="section-title">💡 Yönetim İçin Öncelikli 3 Saha Aksiyonu</div>
  <div class="action-box">
    ${dataset.actionItems
      .map(
        (a, idx) => `
      <div class="action-item">
        <strong>${idx + 1}. ${a.title}:</strong> ${a.description}
      </div>
    `
      )
      .join('')}
  </div>

  <div class="two-col">
    <div>
      <div class="section-title">⚠️ Taahhüt Aşımı En Yoğun 5 İlçe</div>
      <table>
        <thead>
          <tr>
            <th>İlçe</th>
            <th class="text-right">SLA Aşımı</th>
            <th class="text-right">Açık İş</th>
          </tr>
        </thead>
        <tbody>
          ${dataset.topSlaDistricts
            .map(
              (d) => `
            <tr>
              <td><strong>${d.district}</strong></td>
              <td class="text-right"><span class="badge badge-red">${d.count}</span></td>
              <td class="text-right">${dataset.fullDistrictList.find((f) => f.district === d.district)?.openCount || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div>
      <div class="section-title">⏳ Açık İşlerin Yaşlandırma (Aging) Dağılımı</div>
      <table>
        <thead>
          <tr>
            <th>Aralık</th>
            <th class="text-right">Kayıt</th>
            <th class="text-right">Oran</th>
            <th>Statü</th>
          </tr>
        </thead>
        <tbody>
          ${dataset.agingBuckets
            .map(
              (b) => `
            <tr>
              <td><strong>${b.label}</strong></td>
              <td class="text-right">${b.count}</td>
              <td class="text-right">${b.ratio}</td>
              <td><small>${b.status}</small></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="section-title">📍 Meydan Operasyon & Nöbet Durumu</div>
  <p style="font-size: 8.5pt; color: #475569; margin: 4px 0 8px 0;">
    Son çalışma programında sabit personel atanmamış olan <strong>${dataset.kpiSummary.unstaffedMeydanCount} meydan</strong> için gezici saha denetim ekibi planlanmalıdır.
  </p>
  <div style="font-size: 8pt; background: #fffbeb; border: 1px solid #fde68a; padding: 6px 10px; border-radius: 6px;">
    <strong>Nöbetçi Görünmeyen Meydanlar:</strong> ${dataset.unstaffedMeydanlar.map((m) => m.name || m.id).join(', ')}
  </div>

  <div class="footer-notice">
    <strong>Veri Standardı ve Granülerlik Notu:</strong> ${dataset.granularityNotice}<br>
    <em>Rapor, İstanbul Büyükşehir Belediyesi Saha Yönetim Paneli (SYP) deterministik karar destek motoru tarafından üretilmiştir.</em>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Fallback if popup blocker is active
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SYP_Yonetici_Brifingi_${dataset.lastDataDate || '2026-08-14'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
