export default function KronikSorunlarSection({
  loading,
  kronikLoadError,
  kronikSorunlar,
  visibleKronikSorunlar,
  showAllKronik,
  initialVisibleCount,
  previewLimit,
  truncateText,
  onOpenKronikModal,
  onToggleShowAll,
}) {
  return (
    <section className="panel-section">
      <div className="panel-section__header">
        <div>
          <span className="section-kicker">Meydanlar</span>
          <h2>Meydanlar Kronik Sorunlar ve Süreçleri</h2>
          <p>Meydanlarla ilgili kronikleşmiş sorunların takibi bu ekrandan sağlanmaktadır.</p>
        </div>
      </div>

      {loading ? <div className="message message-loading">Kronik sorunlar yükleniyor...</div> : null}

      {!loading && kronikLoadError ? (
        <div className="message message-error">{kronikLoadError}</div>
      ) : null}

      {!loading && !kronikLoadError && kronikSorunlar.length ? (
        <>
          <div className="kronik-list" role="list">
            {visibleKronikSorunlar.map((item) => {
              const topicText = item.konuBasligi || item.basvuruAciklamasi || '-';
              const previewTopic = truncateText(topicText);
              const previewDescription = truncateText(item.basvuruAciklamasi || '-');
              const hasOverflow = topicText.length > previewLimit || String(item.basvuruAciklamasi || '').length > previewLimit;

              return (
                <article key={item.id} className="kronik-item" role="listitem">
                  <button
                    type="button"
                    className="kronik-item__summary"
                    onClick={() => onOpenKronikModal(item.id)}
                    aria-label={`${item.basvuruNo || '-'} başvuru detayı`}
                  >
                    <div className="kronik-item__main">
                      <span className="kronik-item__no">Başvuru No: {item.basvuruNo || '-'}</span>
                      <strong>{item.meydanAdi || '-'}</strong>
                      <p><strong className="kronik-item__label">Konu:</strong> {previewTopic || '-'}</p>
                      <p><strong className="kronik-item__label">Açıklama:</strong> {previewDescription || '-'}</p>
                    </div>
                    <div className="kronik-item__meta">
                      <span>{item.basvuruGelisTarihi || '-'}</span>
                      <span className="kronik-item__toggle">{hasOverflow ? 'Devamını Gör' : 'Detayı Gör'}</span>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>

          {kronikSorunlar.length > initialVisibleCount ? (
            <div className="show-more-row">
              <button className="btn btn-ghost" type="button" onClick={onToggleShowAll}>
                {showAllKronik
                  ? 'Daha Az Göster'
                  : `Devamını Gör (${kronikSorunlar.length - initialVisibleCount} başvuru daha)`}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {!loading && !kronikLoadError && !kronikSorunlar.length ? (
        <div className="empty-state">Henüz kronik sorun kaydı bulunmuyor.</div>
      ) : null}
    </section>
  );
}
