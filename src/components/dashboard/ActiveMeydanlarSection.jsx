import { useMemo, useState } from 'react';
import MeydanCard from '../../MeydanCard';
import { getMeydanYaka } from '../../utils/meydanYaka';

export default function ActiveMeydanlarSection({
  loading,
  activeMeydanlar = [],
  expandedMeydanId,
  getPlannedPersonnelNames,
  getPlannedPersonnelDetails,
  getActiveCount,
  getScheduledCount,
  showAllMeydanlar,
  initialVisibleCount,
  onToggleMeydan,
  onToggleShowAll,
}) {
  const [yakaFilter, setYakaFilter] = useState('all'); // 'all' | 'avrupa' | 'anadolu'

  const totalCount = activeMeydanlar.length;
  const avrupaCount = useMemo(
    () => activeMeydanlar.filter((m) => getMeydanYaka(m) === 'avrupa').length,
    [activeMeydanlar]
  );
  const anadoluCount = useMemo(
    () => activeMeydanlar.filter((m) => getMeydanYaka(m) === 'anadolu').length,
    [activeMeydanlar]
  );

  const filteredMeydanlar = useMemo(() => {
    if (yakaFilter === 'anadolu') {
      return activeMeydanlar.filter((m) => getMeydanYaka(m) === 'anadolu');
    }
    if (yakaFilter === 'avrupa') {
      return activeMeydanlar.filter((m) => getMeydanYaka(m) === 'avrupa');
    }
    return activeMeydanlar;
  }, [activeMeydanlar, yakaFilter]);

  const visibleMeydanlar = useMemo(
    () => (showAllMeydanlar ? filteredMeydanlar : filteredMeydanlar.slice(0, initialVisibleCount)),
    [filteredMeydanlar, showAllMeydanlar, initialVisibleCount]
  );

  return (
    <section className="panel-section">
      <div className="panel-section__header active-meydanlar-header">
        <div>
          <span className="section-kicker">Meydanlar</span>
          <h2>Meydanlar</h2>
          <p>Kartlarda Planlı, bugün görevi planlanan personel sayısını; Görevde ise şu an sahadaki aktif personel sayısını gösterir.</p>
        </div>

        {!loading && activeMeydanlar.length ? (
          <div className="yaka-segmented-tabs" role="tablist" aria-label="Bölge / Yaka Seçimi">
            <button
              type="button"
              role="tab"
              aria-selected={yakaFilter === 'all'}
              className={`yaka-tab-btn${yakaFilter === 'all' ? ' is-active' : ''}`}
              onClick={() => setYakaFilter('all')}
            >
              <span>Tümü</span>
              <span className="yaka-tab-badge">{totalCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={yakaFilter === 'avrupa'}
              className={`yaka-tab-btn${yakaFilter === 'avrupa' ? ' is-active' : ''}`}
              onClick={() => setYakaFilter('avrupa')}
            >
              <span>Avrupa</span>
              <span className="yaka-tab-badge">{avrupaCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={yakaFilter === 'anadolu'}
              className={`yaka-tab-btn${yakaFilter === 'anadolu' ? ' is-active' : ''}`}
              onClick={() => setYakaFilter('anadolu')}
            >
              <span>Anadolu</span>
              <span className="yaka-tab-badge">{anadoluCount}</span>
            </button>
          </div>
        ) : null}
      </div>

      {loading ? <div className="message message-loading">Veriler yükleniyor...</div> : null}

      {!loading && filteredMeydanlar.length ? (
        <>
          <div key={yakaFilter} className="active-meydan-list has-filter-animation">
            {visibleMeydanlar.map((meydan) => {
              const plannedCount = getScheduledCount(meydan.id);
              const activeCount = getActiveCount(meydan.id);
              const plannedNames = getPlannedPersonnelNames(meydan.id);
              const plannedDetails = getPlannedPersonnelDetails(meydan.id);
              const previewNames = plannedNames.slice(0, 2).join(', ');
              const remainingPlannedCount = Math.max(0, plannedNames.length - 2);
              const yaka = getMeydanYaka(meydan);

              return (
                <article
                  key={meydan.id}
                  className={`active-meydan-row${expandedMeydanId === meydan.id ? ' is-expanded' : ''}`}
                >
                  <button
                    type="button"
                    className="active-meydan-row__trigger"
                    aria-expanded={expandedMeydanId === meydan.id}
                    aria-controls={`active-meydan-panel-${meydan.id}`}
                    onClick={() => onToggleMeydan(meydan.id)}
                  >
                    <span className="active-meydan-row__main">
                      <span className="active-meydan-row__title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="active-meydan-row__title">{meydan.isim}</span>
                        <span className={`active-meydan-row__pill active-meydan-row__pill--yaka active-meydan-row__pill--yaka-${yaka}`}>
                          {yaka === 'anadolu' ? 'Anadolu' : 'Avrupa'}
                        </span>
                      </span>
                      <span className="active-meydan-row__summary">
                        {plannedNames.length
                          ? `${previewNames}${remainingPlannedCount ? ` +${remainingPlannedCount}` : ''}`
                          : 'Bugün planlı personel yok'}
                      </span>
                      <span className="active-meydan-row__meta">
                        <span className="active-meydan-row__pill active-meydan-row__pill--planned">
                          Planlı: {plannedCount}
                        </span>
                        <span className="active-meydan-row__pill active-meydan-row__pill--active">
                          Görevde: {activeCount}
                        </span>
                      </span>
                    </span>
                    <span className={`active-meydan-row__chevron${expandedMeydanId === meydan.id ? ' is-open' : ''}`} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </span>
                  </button>

                  <div
                    id={`active-meydan-panel-${meydan.id}`}
                    className={`active-meydan-row__panel${expandedMeydanId === meydan.id ? ' is-open' : ''}`}
                  >
                    <MeydanCard
                      meydan={meydan}
                      aktifSayisi={activeCount}
                      planliSayisi={plannedCount}
                      plannedPersonnelNames={plannedNames}
                      plannedPersonnelDetails={plannedDetails}
                      interactiveMode="embedded"
                    />
                  </div>
                </article>
              );
            })}
          </div>

          {filteredMeydanlar.length > initialVisibleCount ? (
            <div className="show-more-row">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={onToggleShowAll}
              >
                {showAllMeydanlar
                  ? 'Daha Az Göster'
                  : `Daha Fazla Gör (${filteredMeydanlar.length - initialVisibleCount} meydan daha)`}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {!loading && !filteredMeydanlar.length && activeMeydanlar.length ? (
        <div className="empty-state">
          {yakaFilter === 'anadolu'
            ? 'Anadolu Yakasında bugün için kayıtlı aktif meydan bulunmuyor.'
            : 'Avrupa Yakasında bugün için kayıtlı aktif meydan bulunmuyor.'}
        </div>
      ) : null}

      {!loading && !activeMeydanlar.length ? (
        <div className="empty-state">Bugun icin kayitli aktif vardiya bulunmamaktadir.</div>
      ) : null}
    </section>
  );
}

