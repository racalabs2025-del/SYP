import MeydanCard from '../../MeydanCard';

export default function ActiveMeydanlarSection({
  loading,
  activeMeydanlar,
  visibleMeydanlar,
  getActiveCount,
  getScheduledCount,
  showAllMeydanlar,
  initialVisibleCount,
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
          <div className="meydan-grid">
            {visibleMeydanlar.map((meydan) => (
              <MeydanCard
                key={meydan.id}
                meydan={meydan}
                aktifSayisi={getActiveCount(meydan.id)}
                planliSayisi={getScheduledCount(meydan.id)}
              />
            ))}
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
