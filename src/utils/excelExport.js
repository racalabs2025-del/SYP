/**
 * src/utils/excelExport.js
 *
 * Multi-sheet Executive Excel (.xlsx) Exporter for SYP Phase 5.
 */

import * as XLSX from 'xlsx';

export function exportExecutiveBriefingToExcel(dataset) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Yonetici_Ozeti
  const summaryRows = [
    ['İSTANBUL BÜYÜKŞEHİR BELEDİYESİ - MEYDAN YÖNETİMİ BİRİMİ'],
    ['YÖNETİCİ KARAR VE OPERASYON RAPORU'],
    [],
    ['Veri Snapshot Tarihi', dataset.lastDataDateFormatted],
    ['Rapor Üretim Tarihi', dataset.generatedAtFormatted],
    [],
    ['TEMEL YÖNETİCİ GÖSTERGELERİ', 'DEĞER', 'BİRİM / AÇIKLAMA'],
    ['Toplam İşlem Görmüş Tekil Başvuru', dataset.kpiSummary.totalUnique, 'Adet (39 İlçe Toplamı)'],
    ['Kapanmamış İş Stoku (Açık + Süreçte)', dataset.kpiSummary.totalUnresolved, 'Adet (İlçe Havuzları Toplamı)'],
    ['Taahhüt Süresi Aşımı (SLA İhlali)', dataset.kpiSummary.totalSlaBreached, 'Adet (Taahhüt Tarihi Geçmiş Açık İşler)'],
    ['30+ Gün Bekleyen Yaşlı İşler', dataset.kpiSummary.totalAging30Plus, 'Adet (1 Aydan Uzun Süredir Açık)'],
    ['Aktif Kritik Bildirim (2-Yüksek)', dataset.kpiSummary.activeCritical, 'Adet (Acil Müdahale Bekleyen)'],
    ['Toplam Tarihsel Kritik Bildirim', dataset.kpiSummary.totalCritical, 'Adet (Tümü Çözüldü/Kapandı)'],
    ['Son Planda Personel Görünmeyen Meydan', dataset.kpiSummary.unstaffedMeydanCount, 'Meydan (Fiziksel Meydan Seviyesi)'],
    [],
    ['ÖNCELİKLİ YÖNETSEL AKSİYONLAR', 'ÖNCELİK', 'AÇIKLAMA'],
    ...dataset.actionItems.map((a, idx) => [
      `${idx + 1}. ${a.title}`,
      `Öncelik ${a.priority}`,
      a.description,
    ]),
    [],
    ['VERİ GRANÜLERLİĞİ BİLGİLENDİRMESİ'],
    [dataset.granularityNotice],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Yonetici_Ozeti');

  // 2. Sheet: Oncelikli_Isler (SLA Aşımı + Kritik)
  const priorityRows = [
    ['Başvuru No', 'İlçe', 'Mahalle', 'Konu Başlığı', 'Durum', 'Önem Derecesi', 'Açık Süresi (Gün)', 'Taahhüt Tarihi', 'Granülerlik'],
    ...dataset.slaBreachedItems.map((item) => [
      item.basvuruNo,
      item.ilce,
      item.mahalle,
      item.konu,
      item.durum,
      item.onemDerecesi,
      item.agingDays,
      item.taahhutTarihi,
      'DISTRICT_LEVEL',
    ]),
  ];
  const wsPriority = XLSX.utils.aoa_to_sheet(priorityRows);
  XLSX.utils.book_append_sheet(wb, wsPriority, 'Oncelikli_Isler');

  // 3. Sheet: Ilce_SLA
  const ilceSlaRows = [
    ['İlçe Adı', 'Taahhüt Aşımı (SLA) Bildirim Sayısı', 'Toplam Açık İş', 'Granülerlik'],
    ...dataset.fullDistrictList.map((d) => [
      d.district,
      d.slaBreachedCount,
      d.openCount,
      'DISTRICT_LEVEL',
    ]),
  ];
  const wsIlceSla = XLSX.utils.aoa_to_sheet(ilceSlaRows);
  XLSX.utils.book_append_sheet(wb, wsIlceSla, 'Ilce_SLA');

  // 4. Sheet: Ilce_Acik_Is
  const sortedByOpen = [...dataset.fullDistrictList].sort((a, b) => b.openCount - a.openCount);
  const ilceOpenRows = [
    ['İlçe Adı', 'Toplam Açık / Süreçte İş Stoku', 'Taahhüt Aşımı (SLA)', 'Granülerlik'],
    ...sortedByOpen.map((d) => [
      d.district,
      d.openCount,
      d.slaBreachedCount,
      'DISTRICT_LEVEL',
    ]),
  ];
  const wsIlceOpen = XLSX.utils.aoa_to_sheet(ilceOpenRows);
  XLSX.utils.book_append_sheet(wb, wsIlceOpen, 'Ilce_Acik_Is');

  // 5. Sheet: Aging
  const agingRows = [
    ['Yaşlandırma Aralığı', 'Kayıt Adedi', 'Toplam İçindeki Oran', 'Yönetimsel Anlamı'],
    ...dataset.agingBuckets.map((b) => [
      b.label,
      b.count,
      b.ratio,
      b.status,
    ]),
  ];
  const wsAging = XLSX.utils.aoa_to_sheet(agingRows);
  XLSX.utils.book_append_sheet(wb, wsAging, 'Aging');

  // 6. Sheet: Meydan_Vardiya
  const meydanRows = [
    ['Meydan Adı / ID', 'Bağlı Olduğu İlçe', 'Nöbetçi Personel Durumu', 'Granülerlik'],
    ...dataset.unstaffedMeydanlar.map((m) => [
      m.name || m.id,
      m.ilce || '-',
      'Son Planda Personel Görünmüyor',
      'MEYDAN_LEVEL',
    ]),
  ];
  const wsMeydan = XLSX.utils.aoa_to_sheet(meydanRows);
  XLSX.utils.book_append_sheet(wb, wsMeydan, 'Meydan_Vardiya');

  const fileName = `SYP_Yonetici_Veri_Seti_${dataset.lastDataDate || '2026-08-14'}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
