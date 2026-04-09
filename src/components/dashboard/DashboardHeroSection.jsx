import { Link } from 'react-router-dom';

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

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <span className="section-kicker">Günlük Operasyon</span>
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
