export default function OperationalInsightsSection({ insights = [], loading }) {
  return (
    <section className="panel-section">
      <div className="panel-section__header">
        <div>
          <span className="section-kicker">Akıllı Operasyon</span>
          <h2>Akıllı Operasyon Önerileri</h2>
          <p>Planlama geçmişi ve personel dağılımına göre öne çıkan operasyon sinyalleri listelenir.</p>
        </div>
      </div>

      {loading ? <div className="message message-loading">İçgörüler hazırlanıyor...</div> : null}

      {!loading && !insights.length ? (
        <div className="empty-state">Henüz üretilebilir içgörü bulunamadı.</div>
      ) : null}

      {!loading && insights.length ? (
        <div className="insight-list">
          {insights.map((item, index) => (
            <article key={`${item.title}-${index}`} className={`insight-item insight-item--${item.severity || 'info'}${item.lowConfidence ? ' insight-item--low-confidence' : ''}`}>
              <div className="insight-item__header">
                <strong>{item.title}</strong>
                {item.lowConfidence ? <span className="insight-badge insight-badge--low-confidence">Otomatik eşleşme</span> : null}
              </div>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
