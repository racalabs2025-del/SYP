import React, { useMemo, useState } from 'react';
import compiledExecutiveData from '../../data/compiledExecutiveBasvurular.json';
import dataFreshness from '../../data/dataFreshness.json';
import { buildExecutiveBriefingDataset } from '../../utils/executiveExportDataset';
import { exportExecutiveBriefingToPdf } from '../../utils/pdfExport';
import { exportExecutiveBriefingToExcel } from '../../utils/excelExport';

export default function ExecutiveBriefingCenter({
  todayShifts = [],
  activeMeydanlar = [],
  isPresentationMode = false,
  onTogglePresentationMode = null,
}) {
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const dataset = useMemo(() => {
    return buildExecutiveBriefingDataset({
      todayShifts,
      activeMeydanlar,
      executiveData: compiledExecutiveData,
      freshnessData: dataFreshness,
    });
  }, [todayShifts, activeMeydanlar]);

  const { kpiSummary, topSlaDistricts, unstaffedMeydanlar, actionItems } = dataset;

  const handleExportPdf = () => {
    exportExecutiveBriefingToPdf(dataset);
  };

  const handleExportExcel = () => {
    try {
      setDownloadingExcel(true);
      exportExecutiveBriefingToExcel(dataset);
    } finally {
      setTimeout(() => setDownloadingExcel(false), 1500);
    }
  };

  return (
    <section className="panel-section executive-briefing-section" style={{ marginTop: '1.5rem' }}>
      <div
        className="panel-section__header"
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="section-kicker" style={{ marginBottom: 0 }}>Operasyon Merkezi</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#00498E',
                background: 'rgba(0, 73, 142, 0.08)',
                border: '1px solid rgba(0, 73, 142, 0.15)',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
              }}
            >
              Yönetici Brifingi
            </span>
          </div>
          <h2>📋 İstanbul Meydanları Yönetici Brifing Merkezi</h2>
          <p>
            Veri snapshot tarihi ({dataset.lastDataDateFormatted}) itibarıyla operasyonel darboğazlar, taahhüt aşımları ve öncelikli aksiyon planı.
          </p>
        </div>

        {/* Export & Sunum Aksiyon Butonları */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportPdf}
            className="btn btn-outline"
            style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              padding: '0.45rem 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
            }}
          >
            <span>📄</span> PDF Brifingi
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="btn btn-outline"
            disabled={downloadingExcel}
            style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              padding: '0.45rem 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
            }}
          >
            <span>📊</span> {downloadingExcel ? 'Hazırlanıyor...' : 'Excel İndir (XLSX)'}
          </button>

          {onTogglePresentationMode ? (
            <button
              type="button"
              onClick={onTogglePresentationMode}
              className="btn btn-primary"
              style={{
                fontSize: '0.8rem',
                fontWeight: '700',
                padding: '0.45rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: isPresentationMode ? '#dc2626' : '#00498E',
                borderColor: isPresentationMode ? '#dc2626' : '#00498E',
                cursor: 'pointer',
              }}
            >
              <span>{isPresentationMode ? '✕' : '🖥️'}</span> {isPresentationMode ? 'Sunumdan Çık' : 'Sunum Modu'}
            </button>
          ) : null}
        </div>
      </div>

      {/* 1. YÖNETSEL AKSİYON PLANI (ÖNCELİK SIRALI 3 MADDE) */}
      <div
        className="briefing-action-box"
        style={{
          background: 'linear-gradient(135deg, #f0f7ff 0%, #e0effe 100%)',
          border: '1px solid #bae6fd',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>💡</span> Yönetim İçin Öncelikli 3 Saha Aksiyonu
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
          {actionItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #e0f2fe',
                borderRadius: '12px',
                padding: '0.9rem 1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                  {idx + 1}. {item.title}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: '1.45' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. BRİFİNG DETAY GRID (İKİ SÜTUN: SLA AŞIMLARI & NÖBETSİZ MEYDANLAR) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Sol Sütun: Taahhüt (SLA) Aşımında İlk 5 İlçe */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a', fontWeight: '700' }}>
              ⚠️ Taahhüt (SLA) Aşımının En Yoğun Olduğu İlçeler
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#e11d48' }}>
              Toplam: {kpiSummary.totalSlaBreached}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {topSlaDistricts.map((d, index) => {
              const maxSla = topSlaDistricts[0]?.count || 1;
              const barWidth = Math.round((d.count / maxSla) * 100);

              return (
                <div key={d.district} style={{ fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>
                      {index + 1}. {d.district}
                    </span>
                    <strong style={{ color: '#e11d48' }}>{d.count} bildirim</strong>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${barWidth}%`, height: '100%', background: '#e11d48', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sağ Sütun: Nöbetsiz Meydanlar / Plan Durumu */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a', fontWeight: '700' }}>
              📍 Son Vardiya Planında Personel Görünmeyen Meydanlar
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#d97706' }}>
              {unstaffedMeydanlar.length} Meydan
            </span>
          </div>

          <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
            Son çalışma programında sabit nöbetçi atanmamış meydanlar gezici denetim ekiplerince taranmalıdır.
          </p>

          <div
            style={{
              maxHeight: '170px',
              overflowY: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem',
            }}
          >
            {unstaffedMeydanlar.length > 0 ? (
              unstaffedMeydanlar.map((m) => (
                <span
                  key={m.id}
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                  }}
                >
                  {m.name || m.id}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>
                ✓ Tüm meydanlar için planlı personel mevcuttur.
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.75rem 0 0 0', fontStyle: 'italic' }}>
            * Başvuru ve SLA verileri ilçe havuzuna aittir. Nöbet listeleri doğrudan fiziksel meydan çalışma programına dayanır.
          </p>
        </div>
      </div>
    </section>
  );
}
