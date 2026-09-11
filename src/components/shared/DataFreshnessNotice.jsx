import { getApplicationFreshness, formatDataDate } from '../../utils/dataFreshness';

export default function DataFreshnessNotice({ executiveData, shiftDate, loadedAt }) {
  const freshness = getApplicationFreshness(executiveData);
  return (
    <div className="data-freshness-notice" role="note">
      <span><strong>Başvuru veri tarihi:</strong> {freshness.formatted} · {freshness.source}</span>
      {freshness.isStale && <span className="data-freshness-notice__stale">Başvuru özeti güncel olmayabilir; son durumu doğrulayın.</span>}
      {shiftDate && <span><strong>Vardiya planı:</strong> {formatDataDate(shiftDate)} · Kayıtlı plan</span>}
      {loadedAt && <span><strong>Son okuma:</strong> {loadedAt}</span>}
    </div>
  );
}
