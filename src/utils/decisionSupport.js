/**
 * src/utils/decisionSupport.js
 *
 * Deterministik Yönetici Karar Destek & SLA Motoru
 *
 * İş Kuralları:
 *   1. Statü Sınıflandırması:
 *      - Kapalı: "Kapandı", "Çözüldü"
 *      - Süreçte: "Planlama", "Beklemede", "Çalışılıyor", "Değerlendirme"
 *      - Açık: "Atama Bekliyor", "Yeni Başvuru"
 *   2. SLA İhlali (Taahhüt Aşımı):
 *      - isOpenOrInProgress(durum) === true AND taahhutTarihi < referenceDate
 *   3. Yaşlandırma (Aging):
 *      - referenceDate - basvuruTarihi (gün cinsinden)
 *   4. Kritiklik:
 *      - onemDerecesi === "2-Yüksek" veya onemDerecesi içinde "2" / "yüksek"
 */

export const DEFAULT_REFERENCE_DATE = '2026-08-14';

import { toPrivacySafeApplication } from './privacySafeApplication.js';

export const STATUS_CATEGORIES = {
  CLOSED: 'closed',
  IN_PROGRESS: 'in_progress',
  OPEN: 'open',
};

export const STATUS_CATEGORY_LABELS = {
  [STATUS_CATEGORIES.CLOSED]: 'Kapalı',
  [STATUS_CATEGORIES.IN_PROGRESS]: 'Süreçte',
  [STATUS_CATEGORIES.OPEN]: 'Açık',
};

export const AGING_BUCKETS = [
  { id: '0_3', label: '0–3 Gün', min: 0, max: 3, color: '#3b82f6' },
  { id: '4_7', label: '4–7 Gün', min: 4, max: 7, color: '#06b6d4' },
  { id: '8_14', label: '8–14 Gün', min: 8, max: 14, color: '#eab308' },
  { id: '15_30', label: '15–30 Gün', min: 15, max: 30, color: '#f97316' },
  { id: '30_plus', label: '30+ Gün', min: 31, max: Infinity, color: '#ef4444' },
];

/**
 * Durum değerinin analiz kategorisini döndürür.
 * Asla kaynak durum metnini değiştirmez.
 */
export function getStatusCategory(durum) {
  if (!durum) return STATUS_CATEGORIES.OPEN;
  const d = String(durum).trim().toLowerCase();

  if (d === 'kapandı' || d === 'kapandi' || d === 'çözüldü' || d === 'cozuldu') {
    return STATUS_CATEGORIES.CLOSED;
  }

  if (
    d === 'planlama' ||
    d === 'beklemede' ||
    d === 'çalışılıyor' ||
    d === 'calisiliyor' ||
    d === 'değerlendirme' ||
    d === 'degerlendirme'
  ) {
    return STATUS_CATEGORIES.IN_PROGRESS;
  }

  return STATUS_CATEGORIES.OPEN;
}

/**
 * Başvurunun açık veya süreçte (kapanmamış) olup olmadığını belirler.
 */
export function isOpenOrInProgress(durum) {
  const category = getStatusCategory(durum);
  return category === STATUS_CATEGORIES.OPEN || category === STATUS_CATEGORIES.IN_PROGRESS;
}

/**
 * Başvurunun taahhüt süresini aşıp aşmadığını (SLA Breach) kontrol eder.
 * Kural: Halen kapanmamış AND taahhüt tarihi var AND taahhüt tarihi < referans tarih
 */
export function isSlaBreached(item, referenceDate = dataFreshness?.lastApplicationDate || '2026-08-14') {
  if (!item || !isOpenOrInProgress(item.durum)) return false;
  if (!item.taahhutTarihi) return false;

  const tDate = String(item.taahhutTarihi).trim();
  const rDate = String(referenceDate).trim();
  return tDate < rDate;
}

/**
 * Başvurunun yaşını (açık kaldığı gün sayısını) hesaplar.
 */
export function getAgingDays(item, referenceDate = dataFreshness?.lastApplicationDate || '2026-08-14') {
  if (!item || !item.tarih) return 0;
  try {
    const tMs = new Date(item.tarih).getTime();
    const rMs = new Date(referenceDate).getTime();
    if (isNaN(tMs) || isNaN(rMs)) return 0;
    const diff = Math.floor((rMs - tMs) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  } catch {
    return 0;
  }
}

/**
 * Yaş gününe göre aralık kimliğini döndürür.
 */
export function getAgingBucket(days) {
  if (days <= 3) return '0_3';
  if (days <= 7) return '4_7';
  if (days <= 14) return '8_14';
  if (days <= 30) return '15_30';
  return '30_plus';
}

/**
 * Başvurunun kritik önem derecesine sahip olup olmadığını kontrol eder.
 */
export function isCriticalApplication(item) {
  if (!item || !item.onemDerecesi) return false;
  const o = String(item.onemDerecesi).trim().toLowerCase();
  return o.includes('2') || o.includes('yüksek') || o.includes('yuksek') || o.includes('1-çok') || o.includes('1-cok');
}

/**
 * Verilen başvuru listesinden deterministik yönetici karar destek metriklerini hesaplar.
 */
export function computeDecisionSupportMetrics(
  applications = [],
  referenceDate = dataFreshness?.lastApplicationDate || '2026-08-14'
) {
  let totalClosed = 0;
  let totalInProgress = 0;
  let totalOpen = 0;
  let totalSlaBreached = 0;
  let totalAging30Plus = 0;
  let totalCritical = 0;
  let totalOpenCritical = 0;

  const agingCounts = {
    '0_3': 0,
    '4_7': 0,
    '8_14': 0,
    '15_30': 0,
    '30_plus': 0,
  };

  const slaBreachedItems = [];
  const criticalItems = [];
  const openOrInProgressItems = [];
  const districtOpenCounts = {};

  // Tekilleştirme için Set (Shared kayıtların çift sayılmaması)
  const seenDocIds = new Set();

  for (const item of applications) {
    const docId = item.docId || item.basvuruNo;
    if (!docId || seenDocIds.has(docId)) continue;
    seenDocIds.add(docId);

    const category = getStatusCategory(item.durum);
    const isUnresolved = category !== STATUS_CATEGORIES.CLOSED;
    const isCrit = isCriticalApplication(item);

    if (category === STATUS_CATEGORIES.CLOSED) {
      totalClosed += 1;
    } else if (category === STATUS_CATEGORIES.IN_PROGRESS) {
      totalInProgress += 1;
    } else {
      totalOpen += 1;
    }

    if (isCrit) {
      totalCritical += 1;
      const days = getAgingDays(item, referenceDate);
      const breached = isSlaBreached(item, referenceDate);
      if (isUnresolved) {
        totalOpenCritical += 1;
      }
      criticalItems.push(toPrivacySafeApplication({
        ...item,
        agingDays: days,
        slaBreached: breached,
      }));
    }

    if (isUnresolved) {
      const days = getAgingDays(item, referenceDate);
      const bucket = getAgingBucket(days);
      agingCounts[bucket] = (agingCounts[bucket] || 0) + 1;

      if (days > 30) {
        totalAging30Plus += 1;
      }

      const breached = isSlaBreached(item, referenceDate);
      if (breached) {
        totalSlaBreached += 1;
        slaBreachedItems.push(toPrivacySafeApplication({
          ...item,
          agingDays: days,
          slaBreached: true,
        }));
      }

      openOrInProgressItems.push(toPrivacySafeApplication({
        ...item,
        agingDays: days,
        slaBreached: breached,
      }));

      const ilce = item.ilce || 'DİĞER';
      districtOpenCounts[ilce] = (districtOpenCounts[ilce] || 0) + 1;
    }
  }

  // Sıralama: En yüksek öncelikli ve en çok gecikenler başta
  slaBreachedItems.sort((a, b) => {
    if (isCriticalApplication(b) && !isCriticalApplication(a)) return 1;
    if (isCriticalApplication(a) && !isCriticalApplication(b)) return -1;
    return b.agingDays - a.agingDays;
  });

  criticalItems.sort((a, b) => b.agingDays - a.agingDays);

  const topOpenDistricts = Object.entries(districtOpenCounts)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalUnresolved = totalOpen + totalInProgress;

  return {
    referenceDate,
    totalUnique: seenDocIds.size,
    totalClosed,
    totalInProgress,
    totalOpen,
    totalUnresolved,
    totalSlaBreached,
    totalAging30Plus,
    totalCritical,
    totalOpenCritical,
    agingCounts,
    agingBuckets: AGING_BUCKETS.map((b) => ({
      ...b,
      count: agingCounts[b.id] || 0,
      percentage: totalUnresolved > 0 ? Math.round(((agingCounts[b.id] || 0) / totalUnresolved) * 100) : 0,
    })),
    slaBreachedItems,
    criticalItems,
    openOrInProgressItems,
    topOpenDistricts,
  };
}
