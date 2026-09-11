import bundledFreshness from '../data/dataFreshness.json' with { type: 'json' };

export const DEFAULT_REFERENCE_DATE = bundledFreshness.lastApplicationDate;

export function formatDataDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Tarih belirtilmedi';
  const date = new Date(value + 'T12:00:00Z');
  if (Number.isNaN(date.getTime())) return 'Tarih belirtilmedi';
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
}

export function getApplicationFreshness(executiveData, freshnessData = bundledFreshness, now = new Date()) {
  // A compiled report must retain its own calculation date even if other imports are newer.
  const date = executiveData?.metadata?.referenceDate || freshnessData?.lastApplicationDate || null;
  const ageDays = date ? Math.max(0, Math.floor((now.getTime() - new Date(date + 'T00:00:00Z').getTime()) / 86400000)) : null;
  return { date, formatted: formatDataDate(date), ageDays, isStale: ageDays === null || !Number.isFinite(ageDays) || ageDays > 7, source: 'İçe aktarılan başvuru özeti' };
}
