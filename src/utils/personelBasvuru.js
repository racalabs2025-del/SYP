export const PERSONEL_BASVURU_PERIOD_KEY = '2026-q1';
export const PERSONEL_BASVURU_PERIOD_LABEL = '2026 Ocak-Subat-Mart';

// Haftada 2 izin standardi: her 7 gunluk blokta 2 gun dusulur.
export function toPlannedWorkDays(totalDays) {
  const total = Number(totalDays);
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  const fullWeeks = Math.floor(total / 7);
  return Math.max(0, total - (fullWeeks * 2));
}

export function normalizePersonelKey(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, ' ');
}

export function getPersonelBasvuruDocId(name, periodKey = PERSONEL_BASVURU_PERIOD_KEY) {
  const normalized = normalizePersonelKey(name).replace(/\s+/g, '-');
  return `${periodKey}--${normalized || 'unknown'}`;
}