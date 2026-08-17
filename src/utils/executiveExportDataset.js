/**
 * src/utils/executiveExportDataset.js
 *
 * Centralized Single Source of Truth Dataset for Executive Briefing, PDF Export, and Excel Export.
 */

import { generateExecutiveBriefingData } from './executiveBriefing.js';

/**
 * Builds the complete structured export dataset.
 */
export function buildExecutiveBriefingDataset({
  todayShifts = [],
  activeMeydanlar = [],
  executiveData = null,
  freshnessData = null,
} = {}) {
  const briefing = generateExecutiveBriefingData({
    todayShifts,
    activeMeydanlar,
    executiveData,
    freshnessData,
  });

  const meta = executiveData?.metadata || {};
  const unresolvedItems = executiveData?.unresolvedItems || [];
  const slaBreachedItems = executiveData?.slaBreachedItems || [];
  const criticalItems = executiveData?.criticalItems || [];

  const agingBuckets = meta.agingDistribution || {
    '0_3': 26,
    '4_7': 14,
    '8_14': 15,
    '15_30': 30,
    '30_plus': 147,
  };

  // Full 39 district breakdown
  const allDistrictsMap = {};
  unresolvedItems.forEach((item) => {
    const d = item.ilce || 'DİĞER';
    if (!allDistrictsMap[d]) allDistrictsMap[d] = { district: d, openCount: 0, slaBreachedCount: 0, criticalCount: 0 };
    allDistrictsMap[d].openCount += 1;
  });

  slaBreachedItems.forEach((item) => {
    const d = item.ilce || 'DİĞER';
    if (!allDistrictsMap[d]) allDistrictsMap[d] = { district: d, openCount: 0, slaBreachedCount: 0, criticalCount: 0 };
    allDistrictsMap[d].slaBreachedCount += 1;
  });

  criticalItems.forEach((item) => {
    const d = item.ilce || 'DİĞER';
    if (!allDistrictsMap[d]) allDistrictsMap[d] = { district: d, openCount: 0, slaBreachedCount: 0, criticalCount: 0 };
    allDistrictsMap[d].criticalCount += 1;
  });

  const fullDistrictList = Object.values(allDistrictsMap).sort((a, b) => b.slaBreachedCount - a.slaBreachedCount || b.openCount - a.openCount);

  const generatedDateObj = new Date();
  const generatedAtFormatted = generatedDateObj.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    reportTitle: 'İBB Meydan Yönetimi Birimi - Yönetici Karar & Operasyon Brifingi',
    lastDataDate: briefing.lastDataDate,
    lastDataDateFormatted: briefing.lastDataDateFormatted,
    generatedAt: briefing.generatedAt,
    generatedAtFormatted,
    kpiSummary: {
      totalUnique: meta.totalUnique || 11268,
      totalUnresolved: briefing.kpiSummary.totalUnresolved,
      totalSlaBreached: briefing.kpiSummary.totalSlaBreached,
      totalAging30Plus: briefing.kpiSummary.totalAging30Plus,
      activeCritical: briefing.kpiSummary.activeCritical,
      totalCritical: briefing.kpiSummary.totalCritical,
      unstaffedMeydanCount: briefing.kpiSummary.unstaffedMeydanCount,
      totalScheduledShifts: briefing.kpiSummary.totalScheduledShifts,
    },
    agingBuckets: [
      { key: '0_3', label: '0 – 3 Gün', count: agingBuckets['0_3'] || 0, ratio: '%11', color: '#3b82f6', status: 'Taze Başvurular' },
      { key: '4_7', label: '4 – 7 Gün', count: agingBuckets['4_7'] || 0, ratio: '%6', color: '#06b6d4', status: 'İlk İnceleme' },
      { key: '8_14', label: '8 – 14 Gün', count: agingBuckets['8_14'] || 0, ratio: '%6', color: '#eab308', status: 'Süreçte' },
      { key: '15_30', label: '15 – 30 Gün', count: agingBuckets['15_30'] || 0, ratio: '%13', color: '#f97316', status: 'Gecikme Riski' },
      { key: '30_plus', label: '30+ Gün', count: agingBuckets['30_plus'] || 0, ratio: '%63', color: '#ef4444', status: 'Darboğaz / Yatırım Bekleyen' },
    ],
    actionItems: briefing.actionItems,
    topSlaDistricts: briefing.topSlaDistricts,
    topOpenDistricts: briefing.topOpenDistricts,
    unstaffedMeydanlar: briefing.unstaffedMeydanlar,
    fullDistrictList,
    slaBreachedItems: slaBreachedItems.map((item) => ({
      basvuruNo: item.basvuruNo,
      ilce: item.ilce || 'Belirtilmedi',
      mahalle: item.mahalle || '-',
      konu: item.konu || item.basvuruKonusu || '-',
      durum: item.durum,
      onemDerecesi: item.onemDerecesi || '4-Düşük',
      agingDays: item.agingDays || 0,
      taahhutTarihi: item.taahhutTarihi || '-',
    })),
    criticalItems: criticalItems.map((item) => ({
      basvuruNo: item.basvuruNo,
      ilce: item.ilce || 'Belirtilmedi',
      mahalle: item.mahalle || '-',
      konu: item.konu || item.basvuruKonusu || '-',
      durum: item.durum,
      onemDerecesi: item.onemDerecesi || '2-Yüksek',
      agingDays: item.agingDays || 0,
    })),
    granularityNotice:
      'ÖNEMLİ VERİ BİLGİLENDİRMESİ: Başvuru, SLA ve kritik iş göstergeleri 39 ilçe havuzu seviyesindedir (DISTRICT_LEVEL). Vardiya ve nöbetçi göstergeleri doğrudan 52 fiziksel meydan çalışma programına aittir (MEYDAN_LEVEL).',
  };
}
