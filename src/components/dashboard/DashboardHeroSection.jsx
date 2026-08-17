import { Link } from 'react-router-dom';
import dataFreshness from '../../data/dataFreshness.json';

export default function DashboardHeroSection({
  activeMeydanCount,
  totalScheduledShiftCount,
  totalActiveShiftCount,
  activeStatOverlay,
  onOpenStatOverlay,
  onCloseStatOverlay,
  activeMeydanRows,
  scheduledPersonnelRows,
  activePersonnelRows,
  statOverlayPanelRef,
}) {
  const overlayTitleId = `stat-overlay-title-${activeStatOverlay || 'default'}`;
  const lastDataDateFormatted = dataFreshness?.lastApplicationDateFormatted || '14 Ağustos 2026';

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <span className="section-kicker" style={{ marginBottom: 0 }}>Günlük Operasyon</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#00498E',
                background: 'rgba(0, 73, 142, 0.08)',
                border: '1px solid rgba(0, 73, 142, 0.15)',
                padding: '0.15rem 0.55rem',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Kaynak Excel dosyalarındaki son güncelleme tarihi"
            >
              🗓️ Son Saha Verisi: {lastDataDateFormatted}
            </span>
          </div>
          <h1>Meydanlara Genel Bakış</h1>
          <p>Bu ekranda saha operasyonunu tek bakışta izleyin. Aktif personeller, haftalık planlamalar ve güncel bilgiler bu ekranda gösterilir.</p>
        </div>

        <div className="dashboard-stats">
          <button
            className="stat-card stat-card--primary stat-card--interactive"
            type="button"
            onClick={() => onOpenStatOverlay('meydanlar')}
          >
            <span className="stat-label">Aktif Meydan</span>
            <strong className="stat-value">{activeMeydanCount}</strong>
          </button>
          <button
            className="stat-card stat-card--info stat-card--interactive"
            type="button"
            onClick={() => onOpenStatOverlay('planli')}
          >
            <span className="stat-label">Planlı Personel</span>
            <strong className="stat-value">{totalScheduledShiftCount}</strong>
          </button>
          <button
            className="stat-card stat-card--success stat-card--interactive"
            type="button"
            onClick={() => onOpenStatOverlay('aktif')}
          >
            <span className="stat-label">Sahada Şu An</span>
            <strong className="stat-value">{totalActiveShiftCount}</strong>
          </button>
        </div>
      </section>

      {activeStatOverlay ? (
        <div className="stat-overlay" onClick={onCloseStatOverlay} role="presentation">
          <div
            ref={statOverlayPanelRef}
            className="stat-overlay__panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={overlayTitleId}
          >
            {activeStatOverlay === 'meydanlar' ? (
              <>
                <div className="stat-overlay__header">
                  <h3 id={overlayTitleId}>Aktif Meydanlar ({activeMeydanRows.length})</h3>
                </div>
                {activeMeydanRows.length ? (
                  <ul className="stat-overlay__list">
                    {activeMeydanRows.map((item) => (
                      <li key={item.id} className="stat-overlay__item">
                        <Link
                          to={`/meydan/${encodeURIComponent(item.id)}`}
                          className="stat-overlay__meydan-link"
                          onClick={onCloseStatOverlay}
                        >
                          {item.isim}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="stat-overlay__empty">Bugün görevli meydan bulunmuyor.</p>
                )}
              </>
            ) : null}

            {activeStatOverlay === 'planli' ? (
              <>
                <div className="stat-overlay__header">
                  <h3 id={overlayTitleId}>Planlı Personel ({scheduledPersonnelRows.length})</h3>
                </div>
                {scheduledPersonnelRows.length ? (
                  <ul className="stat-overlay__list">
                    {scheduledPersonnelRows.map((item) => (
                      <li key={item.id} className="stat-overlay__item stat-overlay__item--detail">
                        <Link to={`/personel/${encodeURIComponent(item.personelAdi)}`} className="personel-name-link"><strong>{item.personelAdi}</strong></Link>
                        <span>{item.meydanAdi}</span>
                        <span>{item.saatAraligi}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="stat-overlay__empty">Bugün planlı personel bulunmuyor.</p>
                )}
              </>
            ) : null}

            {activeStatOverlay === 'aktif' ? (
              <>
                <div className="stat-overlay__header">
                  <h3 id={overlayTitleId}>Sahada Şu An ({activePersonnelRows.length})</h3>
                </div>
                {activePersonnelRows.length ? (
                  <ul className="stat-overlay__list">
                    {activePersonnelRows.map((item) => (
                      <li key={item.id} className="stat-overlay__item stat-overlay__item--detail">
                        <Link to={`/personel/${encodeURIComponent(item.personelAdi)}`} className="personel-name-link"><strong>{item.personelAdi}</strong></Link>
                        <span>{item.meydanAdi}</span>
                        <span>{item.saatAraligi}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="stat-overlay__empty">Şu an görevde personel bulunmuyor.</p>
                )}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
