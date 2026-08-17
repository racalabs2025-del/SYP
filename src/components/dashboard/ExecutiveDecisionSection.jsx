import React, { useState, useMemo } from 'react';
import compiledExecutiveData from '../../data/compiledExecutiveBasvurular.json';

export default function ExecutiveDecisionSection() {
  const [activeTab, setActiveTab] = useState('sla'); // 'sla' | 'critical'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const metadata = compiledExecutiveData?.metadata || {
    totalUnresolved: 232,
    totalSlaBreached: 173,
    totalAging30Plus: 147,
    totalCritical: 32,
    agingBuckets: [
      { id: '0_3', label: '0–3 Gün', count: 26, percentage: 11, color: '#3b82f6' },
      { id: '4_7', label: '4–7 Gün', count: 14, percentage: 6, color: '#06b6d4' },
      { id: '8_14', label: '8–14 Gün', count: 15, percentage: 6, color: '#eab308' },
      { id: '15_30', label: '15–30 Gün', count: 30, percentage: 13, color: '#f97316' },
      { id: '30_plus', label: '30+ Gün', count: 147, percentage: 63, color: '#ef4444' },
    ],
  };

  const slaItems = compiledExecutiveData?.slaBreachedItems || [];
  const criticalItems = compiledExecutiveData?.criticalItems || [];

  const currentList = activeTab === 'sla' ? slaItems : criticalItems;
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
  const paginatedList = currentList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <section className="panel-section executive-decision-section" style={{ marginTop: '1.5rem' }}>
      <div className="panel-section__header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="section-kicker" style={{ marginBottom: 0 }}>Karar Destek</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#b91c1c',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Yönetici Paneli
            </span>
          </div>
          <h2>Yönetici Karar & Risk Göstergeleri</h2>
          <p>
            Saha operasyonunda aksiyon bekleyen kapanmamış başvurular, taahhüt (SLA) aşımları ve kritik önemdeki işlerin anlık takibi.
          </p>
        </div>
      </div>

      {/* 1. YÖNETİCİ KPI KARTLARI */}
      <div
        className="executive-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            border: '1px solid #fecdd3',
            borderRadius: '16px',
            padding: '1.15rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label" style={{ color: '#9f1239', fontWeight: '600', fontSize: '0.85rem' }}>
              Taahhüt Süresi Aşımı (SLA)
            </span>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          </div>
          <strong className="stat-value" style={{ color: '#e11d48', fontSize: '2rem', display: 'block', margin: '0.35rem 0 0.15rem 0' }}>
            {metadata.totalSlaBreached}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: '500' }}>
            Hedef tarihi geçmiş açık bildirim
          </span>
        </div>

        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1px solid #fed7aa',
            borderRadius: '16px',
            padding: '1.15rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label" style={{ color: '#9a3412', fontWeight: '600', fontSize: '0.85rem' }}>
              30+ Gün Yaşlanan
            </span>
            <span style={{ fontSize: '1.2rem' }}>⏳</span>
          </div>
          <strong className="stat-value" style={{ color: '#ea580c', fontSize: '2rem', display: 'block', margin: '0.35rem 0 0.15rem 0' }}>
            {metadata.totalAging30Plus}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#c2410c', fontWeight: '500' }}>
            1 aydan uzun süredir açık iş stoku
          </span>
        </div>

        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '16px',
            padding: '1.15rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label" style={{ color: '#166534', fontWeight: '600', fontSize: '0.85rem' }}>
              Aktif Kritik İş (2-Yüksek)
            </span>
            <span style={{ fontSize: '1.2rem' }}>🚨</span>
          </div>
          <strong className="stat-value" style={{ color: '#16a34a', fontSize: '2rem', display: 'block', margin: '0.35rem 0 0.15rem 0' }}>
            {metadata.totalOpenCritical || 0}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '500' }}>
            Toplam: {metadata.totalCritical || 32} (Tümü Çözüldü/Kapandı)
          </span>
        </div>

        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.15rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label" style={{ color: '#334155', fontWeight: '600', fontSize: '0.85rem' }}>
              Kapanmamış Toplam İş
            </span>
            <span style={{ fontSize: '1.2rem' }}>📋</span>
          </div>
          <strong className="stat-value" style={{ color: '#0f172a', fontSize: '2rem', display: 'block', margin: '0.35rem 0 0.15rem 0' }}>
            {metadata.totalUnresolved}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
            Açık ({metadata.totalOpen || 32}) + Süreçte ({metadata.totalInProgress || 200})
          </span>
        </div>
      </div>

      {/* 2. AÇIK İŞ YAŞLANDIRMA (AGING) GÖRÜNÜMÜ */}
      <div
        className="executive-aging-card"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
              📊 Kapanmamış İşlerin Yaşlandırma (Aging) Analizi
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Toplam {metadata.totalUnresolved} açık/süreçteki işin bekleme sürelerine göre dağılımı
            </span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#0369a1',
              background: '#e0f2fe',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
            }}
          >
            Snapshot: 14 Ağustos 2026
          </span>
        </div>

        {/* Çok Katmanlı Segmentli Bar */}
        <div
          style={{
            display: 'flex',
            height: '14px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#f1f5f9',
            marginBottom: '1rem',
          }}
        >
          {metadata.agingBuckets.map((bucket) => {
            if (!bucket.count) return null;
            return (
              <div
                key={bucket.id}
                style={{
                  width: `${bucket.percentage}%`,
                  background: bucket.color,
                  transition: 'width 0.3s ease',
                }}
                title={`${bucket.label}: ${bucket.count} adet (%${bucket.percentage})`}
              />
            );
          })}
        </div>

        {/* Gösterge Kartları */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {metadata.agingBuckets.map((bucket) => (
            <div
              key={bucket.id}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.65rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: bucket.color,
                  flexShrink: 0,
                }}
              />
              <div>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>
                  {bucket.label}
                </span>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                  {bucket.count}{' '}
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '400' }}>
                    (%{bucket.percentage})
                  </span>
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. YÖNETİCİ ÖNCELİKLİ İŞLER ALANI (SEKMELİ) */}
      <div
        className="executive-priority-card"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
              🎯 Yönetici Öncelikli İş Listesi
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Doğrudan müdahale ve koordinasyon bekleyen kayıtlar
            </span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              padding: '0.25rem',
              borderRadius: '10px',
              gap: '0.25rem',
            }}
          >
            <button
              type="button"
              onClick={() => handleTabChange('sla')}
              style={{
                border: 'none',
                background: activeTab === 'sla' ? '#ffffff' : 'transparent',
                color: activeTab === 'sla' ? '#e11d48' : '#64748b',
                fontWeight: '600',
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: activeTab === 'sla' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              ⚠️ Taahhüdü Aşanlar ({slaItems.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('critical')}
              style={{
                border: 'none',
                background: activeTab === 'critical' ? '#ffffff' : 'transparent',
                color: activeTab === 'critical' ? '#16a34a' : '#64748b',
                fontWeight: '600',
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: activeTab === 'critical' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              🚨 Kritik İşler ({criticalItems.length})
            </button>
          </div>
        </div>

        {/* Tablo / Liste */}
        {paginatedList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.9rem' }}>
            Bu kategoride bekleyen kayıt bulunmamaktadır.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.82rem',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Başvuru No</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>İlçe / Mahalle</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Konu & Açıklama</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Durum</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Taahhüt Tarihi</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Yaş</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Önem</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((row) => {
                  const isBreached = Boolean(row.slaBreached);
                  const isCrit = String(row.onemDerecesi || '').includes('2');

                  return (
                    <tr
                      key={row.docId || row.basvuruNo}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                        #{row.basvuruNo}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{row.ilce || 'DİĞER'}</span>
                        {row.mahalle ? (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                            {row.mahalle}
                          </span>
                        ) : null}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', maxWidth: '280px' }}>
                        <span
                          style={{
                            fontWeight: '600',
                            color: '#00498E',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.konu || 'DİĞER'}
                        </span>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: '#475569',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={row.aciklama}
                        >
                          {row.aciklama || row.altKonu || '-'}
                        </p>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            background:
                              row.durum === 'Kapandı' || row.durum === 'Çözüldü'
                                ? '#dcfce7'
                                : row.durum === 'Planlama'
                                ? '#ffedd5'
                                : '#fef3c7',
                            color:
                              row.durum === 'Kapandı' || row.durum === 'Çözüldü'
                                ? '#166534'
                                : row.durum === 'Planlama'
                                ? '#9a3412'
                                : '#854d0e',
                          }}
                        >
                          {row.durum}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontWeight: isBreached ? '700' : '500',
                            color: isBreached ? '#e11d48' : '#334155',
                          }}
                        >
                          {row.taahhutTarihi || '-'}
                        </span>
                        {isBreached ? (
                          <span style={{ display: 'block', fontSize: '0.68rem', color: '#be123c', fontWeight: '600' }}>
                            Aşıldı
                          </span>
                        ) : null}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: (row.agingDays || 0) > 30 ? '#ef4444' : '#475569' }}>
                          {row.agingDays !== undefined ? `${row.agingDays} gün` : '-'}
                        </strong>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            color: isCrit ? '#166534' : '#64748b',
                            background: isCrit ? '#dcfce7' : '#f1f5f9',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                          }}
                        >
                          {row.onemDerecesi || '4-Düşük'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Sayfalama Kontrolleri */}
        {totalPages > 1 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #f1f5f9',
              fontSize: '0.8rem',
              color: '#64748b',
            }}
          >
            <span>
              Toplam {currentList.length} kayıttan {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, currentList.length)} arası gösteriliyor
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                }}
              >
                ← Önceki
              </button>
              <span style={{ alignSelf: 'center', fontWeight: '600', color: '#0f172a' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                }}
              >
                Sonraki →
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
