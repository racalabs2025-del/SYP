import MeydanCard from '../../MeydanCard';

export default function ActiveMeydanlarSection({
  loading,
  activeMeydanlar,
  visibleMeydanlar,
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
  return (
    <section className="panel-section">
      <div className="panel-section__header">
        <div>
          <span className="section-kicker">Meydanlar</span>
          <h2>Aktif Meydanlar</h2>
          <p>Kartlarda Planlı, bugün görevi planlanan personel sayısını; Görevde ise şu an sahadaki aktif personel sayısını gösterir.</p>
        </div>
      </div>

      {loading ? <div className="message message-loading">Veriler yükleniyor...</div> : null}

      {!loading && activeMeydanlar.length ? (
        <>
          <div className="active-meydan-list">
            {visibleMeydanlar.map((meydan) => {
              const plannedCount = getScheduledCount(meydan.id);
              const activeCount = getActiveCount(meydan.id);
              const plannedNames = getPlannedPersonnelNames(meydan.id);
              const plannedDetails = getPlannedPersonnelDetails(meydan.id);
              const previewNames = plannedNames.slice(0, 2).join(', ');
              const remainingPlannedCount = Math.max(0, plannedNames.length - 2);

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
                      <span className="active-meydan-row__title">{meydan.isim}</span>
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

          {activeMeydanlar.length > initialVisibleCount ? (
            <div className="show-more-row">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={onToggleShowAll}
              >
                {showAllMeydanlar
                  ? 'Daha Az Göster'
                  : `Daha Fazla Gör (${activeMeydanlar.length - initialVisibleCount} meydan daha)`}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {!loading && !activeMeydanlar.length ? (
        <div className="empty-state">Bugun icin kayitli aktif vardiya bulunmamaktadir.</div>
      ) : null}
    </section>
  );
}
