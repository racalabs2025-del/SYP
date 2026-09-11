import { getApplicationFreshness, formatDataDate } from './dataFreshness.js';

export function buildDailySummary({ todayShifts = [], activeMeydanCount = 0, executiveData, shiftDate, dataQualityIssuesCount = 0, kronikSorunlarCount = 0 }) {
  const staffCount = new Set(todayShifts.map((item) => item.personelAdi?.trim()).filter(Boolean)).size;
  const freshness = getApplicationFreshness(executiveData);
  const meta = executiveData?.metadata;
  const lines = [
    'GÜNLÜK SAHA PLANLAMA ÖZETİ',
    'Vardiya planı tarihi: ' + formatDataDate(shiftDate),
    'Kayıtlı plan: ' + todayShifts.length + ' vardiya, ' + staffCount + ' farklı personel, ' + activeMeydanCount + ' meydan.',
    'Plan kayıtları personelin sahada bulunduğunu doğrulamaz.',
    '',
    'BAŞVURU ÖZETİ',
    'Başvuru göstergeleri ilçe havuzlarından derlenmiştir; tek bir meydanın iş yükü olarak yorumlanamaz.',
    'Başvuru veri tarihi: ' + freshness.formatted + ' (' + freshness.source + ').',
    meta ? 'Kapanmamış başvuru: ' + (meta.totalUnresolved ?? 0) + '; taahhüdü aşan: ' + (meta.totalSlaBreached ?? 0) + '; açık kritik: ' + (meta.totalOpenCritical ?? 0) + '.' : 'Başvuru özeti bulunmuyor.',
    freshness.isStale ? 'Başvuru özeti güncel olmayabilir; işlem öncesinde son durumu doğrulayın.' : '',
    '',
    'TAKİP EDİLECEK KONULAR',
    'Veri kalite bulgusu: ' + dataQualityIssuesCount + '; kayıtlı kronik sorun: ' + kronikSorunlarCount + '.',
    todayShifts.length ? 'Görevlendirmeleri ve devir notlarını kayıtlı planla karşılaştırın.' : 'Seçilen tarih için vardiya kaydı yok; planın yüklenip yüklenmediğini kontrol edin.',
  ];
  return { text: lines.filter((line) => line !== null).join('\n'), staffCount, freshness };
}
