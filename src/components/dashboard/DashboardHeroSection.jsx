import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import dataFreshness from '../../data/dataFreshness.json';
import { getMeydanYaka } from '../../utils/meydanYaka';

export default function DashboardHeroSection({
  activeMeydanCount,
  totalScheduledShiftCount,
  totalActiveShiftCount,
  activeStatOverlay,
  onOpenStatOverlay,
  onCloseStatOverlay,
  activeMeydanRows = [],
  scheduledPersonnelRows = [],
  activePersonnelRows = [],
  statOverlayPanelRef,
}) {
  const [modalYakaFilter, setModalYakaFilter] = useState('all'); // 'all' | 'avrupa' | 'anadolu'
  const overlayTitleId = `stat-overlay-title-${activeStatOverlay || 'default'}`;
  const lastDataDateFormatted = dataFreshness?.lastApplicationDateFormatted || '14 Ağustos 2026';

  const modalAvrupaCount = useMemo(
    () => activeMeydanRows.filter((m) => getMeydanYaka(m) === 'avrupa').length,
    [activeMeydanRows]
  );
  const modalAnadoluCount = useMemo(
    () => activeMeydanRows.filter((m) => getMeydanYaka(m) === 'anadolu').length,
    [activeMeydanRows]
  );

  const filteredModalMeydanRows = useMemo(() => {
    if (modalYakaFilter === 'anadolu') {
      return activeMeydanRows.filter((m) => getMeydanYaka(m) === 'anadolu');
    }
    if (modalYakaFilter === 'avrupa') {
      return activeMeydanRows.filter((m) => getMeydanYaka(m) === 'avrupa');
    }
    return activeMeydanRows;
  }, [activeMeydanRows, modalYakaFilter]);

  return (
    <>
      <section className="dashboard-hero" aria-label="Saha operasyonu genel özeti">
        <div className="dashboard-hero__head">
          <span className="dashboard-hero__freshness-badge">
            <span className="freshness-icon" aria-hidden="true">🗓️</span>
            <span>Son Saha Verisi: {lastDataDateFormatted}</span>
          </span>
          <span className="section-kicker">Günlük Operasyon</span>
        </div>

        <div className="dashboard-hero__content">
          <div className="dashboard-hero__text">
            <h1 className="dashboard-hero__title">Meydanlara Genel Bakış</h1>
            <p className="dashboard-hero__desc">
              Bu ekranda saha operasyonunu tek bakışta izleyin. Aktif personeller, haftalık planlamalar ve güncel bilgiler bu ekranda gösterilir.
            </p>
          </div>

          <div className="dashboard-stats" role="group" aria-label="Operasyon sayaçları">
            <button
              type="button"
              className={`stat-card stat-card--interactive${activeStatOverlay === 'meydanlar' ? ' is-active' : ''}`}
              onClick={() => onOpenStatOverlay('meydanlar')}
              aria-expanded={activeStatOverlay === 'meydanlar'}
              aria-controls="stat-overlay-title-meydanlar"
            >
              <span className="stat-label">Meydanlar</span>
              <strong className="stat-value">{activeMeydanCount}</strong>
            </button>

            <button
              type="button"
              className={`stat-card stat-card--interactive${activeStatOverlay === 'planli' ? ' is-active' : ''}`}
              onClick={() => onOpenStatOverlay('planli')}
              aria-expanded={activeStatOverlay === 'planli'}
              aria-controls="stat-overlay-title-planli"
            >
              <span className="stat-label">Planlı Personel</span>
              <strong className="stat-value">{totalScheduledShiftCount}</strong>
            </button>

            <button
              type="button"
              className={`stat-card stat-card--interactive${activeStatOverlay === 'aktif' ? ' is-active' : ''}`}
              onClick={() => onOpenStatOverlay('aktif')}
              aria-expanded={activeStatOverlay === 'aktif'}
              aria-controls="stat-overlay-title-aktif"
            >
              <span className="stat-label">Sahada Şu An</span>
              <strong className="stat-value">{totalActiveShiftCount}</strong>
            </button>
          </div>
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
            <div className="stat-overlay__drag-handle" aria-hidden="true" />

            {activeStatOverlay === 'meydanlar' ? (
              <>
                <div className="stat-overlay__header stat-overlay__header-row">
                  <div>
                    <h3 id={overlayTitleId}>Meydanlar ({filteredModalMeydanRows.length})</h3>
                  </div>

                  <div className="stat-overlay__header-right">
                    <div className="yaka-segmented-tabs yaka-segmented-tabs--sm" role="tablist" aria-label="Modal Yaka Seçimi">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={modalYakaFilter === 'all'}
                        className={`yaka-tab-btn yaka-tab-btn--sm${modalYakaFilter === 'all' ? ' is-active' : ''}`}
                        onClick={() => setModalYakaFilter('all')}
                      >
                        <span>Tümü</span>
                        <span className="yaka-tab-badge">{activeMeydanRows.length}</span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={modalYakaFilter === 'avrupa'}
                        className={`yaka-tab-btn yaka-tab-btn--sm${modalYakaFilter === 'avrupa' ? ' is-active' : ''}`}
                        onClick={() => setModalYakaFilter('avrupa')}
                      >
                        <span>Avrupa</span>
                        <span className="yaka-tab-badge">{modalAvrupaCount}</span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={modalYakaFilter === 'anadolu'}
                        className={`yaka-tab-btn yaka-tab-btn--sm${modalYakaFilter === 'anadolu' ? ' is-active' : ''}`}
                        onClick={() => setModalYakaFilter('anadolu')}
                      >
                        <span>Anadolu</span>
                        <span className="yaka-tab-badge">{modalAnadoluCount}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="stat-overlay__close-btn"
                      onClick={onCloseStatOverlay}
                      aria-label="Kapat"
                    >
                      <XMarkIcon width={18} height={18} />
                    </button>
                  </div>
                </div>

                {filteredModalMeydanRows.length ? (
                  <ul key={modalYakaFilter} className="stat-overlay__list has-filter-animation">
                    {filteredModalMeydanRows.map((item) => {
                      const yaka = getMeydanYaka(item);
                      return (
                        <li key={item.id} className="stat-overlay__item">
                          <Link
                            to={`/meydan/${encodeURIComponent(item.id)}`}
                            className="stat-overlay__meydan-link stat-overlay__meydan-row"
                            onClick={onCloseStatOverlay}
                          >
                            <span>{item.isim}</span>
                            <span className={`stat-overlay__yaka-badge stat-overlay__yaka-badge--${yaka}`}>
                              {yaka === 'anadolu' ? 'Anadolu' : 'Avrupa'}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="stat-overlay__empty">Bu bölgede kayıtlı aktif meydan bulunmuyor.</p>
                )}
              </>
            ) : null}

            {activeStatOverlay === 'planli' ? (
              <>
                <div className="stat-overlay__header">
                  <h3 id={overlayTitleId}>Planlı Personel ({scheduledPersonnelRows.length})</h3>
                  <button
                    type="button"
                    className="stat-overlay__close-btn"
                    onClick={onCloseStatOverlay}
                    aria-label="Kapat"
                  >
                    <XMarkIcon width={18} height={18} />
                  </button>
                </div>
                {scheduledPersonnelRows.length ? (
                  <ul className="stat-overlay__list">
                    {scheduledPersonnelRows.map((item) => (
                      <li key={item.id} className="stat-overlay__item stat-overlay__item--detail">
                        <Link to={`/personel/${encodeURIComponent(item.personelAdi)}`} className="personel-name-link">
                          <strong>{item.personelAdi}</strong>
                        </Link>
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
                  <button
                    type="button"
                    className="stat-overlay__close-btn"
                    onClick={onCloseStatOverlay}
                    aria-label="Kapat"
                  >
                    <XMarkIcon width={18} height={18} />
                  </button>
                </div>
                {activePersonnelRows.length ? (
                  <ul className="stat-overlay__list">
                    {activePersonnelRows.map((item) => (
                      <li key={item.id} className="stat-overlay__item stat-overlay__item--detail">
                        <Link to={`/personel/${encodeURIComponent(item.personelAdi)}`} className="personel-name-link">
                          <strong>{item.personelAdi}</strong>
                        </Link>
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
