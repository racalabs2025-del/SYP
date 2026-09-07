import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getMeydanYaka } from '../../utils/meydanYaka';

export default function StatDetailOverlay({
  activeStatOverlay,
  onCloseStatOverlay,
  activeMeydanRows = [],
  scheduledPersonnelRows = [],
  activePersonnelRows = [],
  statOverlayPanelRef,
}) {
  const [modalYakaFilter, setModalYakaFilter] = useState('all'); // 'all' | 'avrupa' | 'anadolu'
  const overlayTitleId = `stat-overlay-title-${activeStatOverlay || 'default'}`;

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

  if (!activeStatOverlay) return null;

  return (
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
              <p className="stat-overlay__empty">Kayıtlı planlı personel bulunmuyor.</p>
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
              <p className="stat-overlay__empty">Şu anda sahada aktif personel bulunmuyor.</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
