import React, { useState } from 'react';

const INSIGHT_ICONS = {
  'Saha Koordinasyon Gücü': '🟢',
  'Saha Mobilite ve Esneklik': '🚀',
  'Meydan Deneyimi ve Uzmanlık': '⭐',
  'Saha Çözüm ve Kayıt Öncüsü': '🏆',
  'Günün Saha Tavsiyesi': '💡',
  'Planlama ve Veri Akışı': '📊',
  'Çok Meydanlı Personel': '🚀',
  'Sabit Görev Eşleşmesi': '⭐',
  'Toplam Kayıt Lideri': '🏆',
  'Veri Akışı': '📊',
  'Yoğunluk/Kayıt Dengesi': '⚖️',
};

export default function OperationalInsightsSection({
  insights = [],
  loading = false,
  onRefresh = null,
  lastUpdatedAt = '',
}) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const todayDateFormatted = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="panel-section operational-insights-panel" style={{ marginTop: '1.5rem' }}>
      <div
        className="panel-section__header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="section-kicker" style={{ marginBottom: 0 }}>Akıllı Operasyon</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                color: '#166534',
                background: '#dcfce7',
                border: '1px solid #bbf7d0',
                padding: '0.12rem 0.55rem',
                borderRadius: '999px',
              }}
            >
              ⚡ Günlük Dinamik Analiz
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Akıllı Operasyon Önerileri</h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Saha koordinasyonu, personel başarıları ve günlük operasyonel yönlendirmeler.
          </p>
        </div>

        {/* Güncelleme Butonu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {lastUpdatedAt ? (
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Son: {lastUpdatedAt}
            </span>
          ) : (
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              📅 {todayDateFormatted}
            </span>
          )}

          {onRefresh ? (
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={loading || refreshing}
              className="btn btn-outline"
              style={{
                fontSize: '0.78rem',
                fontWeight: '600',
                padding: '0.35rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '8px',
                cursor: 'pointer',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#00498E',
              }}
            >
              <span>{loading || refreshing ? '⏳' : '⚡'}</span>
              <span>{loading || refreshing ? 'Güncelleniyor...' : 'Önerileri Yenile'}</span>
            </button>
          ) : null}
        </div>
      </div>

      {loading ? <div className="message message-loading">Akıllı operasyon önerileri hazırlanıyor...</div> : null}

      {!loading && !insights.length ? (
        <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          Henüz üretilebilir operasyonel öneri bulunamadı.
        </div>
      ) : null}

      {!loading && insights.length ? (
        <div
          className="insight-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1rem',
          }}
        >
          {insights.map((item, index) => {
            const icon = INSIGHT_ICONS[item.title] || '💡';
            const isSuccess = item.severity === 'success';

            return (
              <article
                key={`${item.title}-${index}`}
                className="insight-card"
                style={{
                  background: isSuccess
                    ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)'
                    : '#ffffff',
                  border: `1px solid ${isSuccess ? '#bbf7d0' : '#e2e8f0'}`,
                  borderRadius: '14px',
                  padding: '1.1rem 1.25rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{item.title}</strong>
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        color: isSuccess ? '#166534' : '#0369a1',
                        background: isSuccess ? '#dcfce7' : '#e0f2fe',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '999px',
                      }}
                    >
                      {isSuccess ? 'Aktif Durum' : 'Öneri & Analiz'}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      color: '#334155',
                      lineHeight: '1.45',
                    }}
                  >
                    {item.text}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
