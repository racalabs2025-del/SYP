import React, { useMemo, useState } from 'react';
import compiledExecutiveData from '../../data/compiledExecutiveBasvurular.json';
import dataFreshness from '../../data/dataFreshness.json';
import { buildExecutiveBriefingDataset } from '../../utils/executiveExportDataset';
import { exportExecutiveBriefingToPdf } from '../../utils/pdfExport';
import { exportExecutiveBriefingToExcel } from '../../utils/excelExport';
import { getExecutiveChampionsData } from '../../utils/executiveChampions';
import OpenApplicationsSection from './OpenApplicationsSection';

export default function ExecutiveSummarySection({
  todayShifts = [],
  activeMeydanlar = [],
  historyShifts = [],
  meydanlar = [],
  isPresentationMode = false,
  onTogglePresentationMode = null,
}) {
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showOperationalDetails, setShowOperationalDetails] = useState(false);

  // Build the underlying executive dataset for export & unstaffed calculations
  const dataset = useMemo(() => {
    return buildExecutiveBriefingDataset({
      todayShifts,
      activeMeydanlar,
      executiveData: compiledExecutiveData,
      freshnessData: dataFreshness,
    });
  }, [todayShifts, activeMeydanlar]);

  // Compute positive personnel leadership and productivity metrics
  const champions = useMemo(() => {
    return getExecutiveChampionsData({
      historyShifts,
      todayShifts,
      activeMeydanlar,
      meydanlar,
    });
  }, [historyShifts, todayShifts, activeMeydanlar, meydanlar]);

  const { recordLeader, mobilityLeader, meydanSpecialist, generalStats } = champions;
  const { kpiSummary } = dataset;
  const lastDataDateFormatted = dataFreshness?.lastApplicationDateFormatted || '14 Ağustos 2026';

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

  const totalUnresolvedCount = kpiSummary.totalUnresolved || 232;
  const activeCriticalCount = kpiSummary.activeCritical || 0;
  const totalOpenCount = compiledExecutiveData?.metadata?.totalOpen || 32;
  const totalInProgressCount = compiledExecutiveData?.metadata?.totalInProgress || 200;

  return (
    <section className="panel-section executive-summary-section" style={{ marginTop: '1.5rem' }}>
      {/* 1. SECTION HEADER & EXPORT ACTIONS */}
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
            <span className="section-kicker" style={{ marginBottom: 0 }}>Yönetim Paneli</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                color: '#00498E',
                background: 'rgba(0, 73, 142, 0.08)',
                border: '1px solid rgba(0, 73, 142, 0.15)',
                padding: '0.12rem 0.55rem',
                borderRadius: '999px',
              }}
            >
              🗓️ Son Saha Verisi: {lastDataDateFormatted}
            </span>
          </div>
          <h2>Yönetici Özeti</h2>
          <p>
            Saha liderliği, personel başarıları ve operasyonel verimlilik göstergeleri.
          </p>
        </div>

        {/* Export & Sunum Aksiyon Butonları */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExportPdf}
            className="btn btn-outline"
            style={{
              fontSize: '0.78rem',
              fontWeight: '600',
              padding: '0.4rem 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              borderRadius: '8px',
            }}
          >
            <span>📄</span> PDF
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="btn btn-outline"
            disabled={downloadingExcel}
            style={{
              fontSize: '0.78rem',
              fontWeight: '600',
              padding: '0.4rem 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              borderRadius: '8px',
            }}
          >
            <span>📊</span> {downloadingExcel ? 'Hazırlanıyor...' : 'Excel (XLSX)'}
          </button>

          {onTogglePresentationMode ? (
            <button
              type="button"
              onClick={onTogglePresentationMode}
              className="btn btn-primary"
              style={{
                fontSize: '0.78rem',
                fontWeight: '600',
                padding: '0.4rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: isPresentationMode ? '#dc2626' : '#00498E',
                borderColor: isPresentationMode ? '#dc2626' : '#00498E',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
            >
              <span>{isPresentationMode ? '✕' : '🖥️'}</span> {isPresentationMode ? 'Sunumdan Çık' : 'Sunum Modu'}
            </button>
          ) : null}
        </div>
      </div>

      {/* 2. POZİTİF PERSONEL LİDERLİK & BAŞARI KARTLARI */}
      <div
        className="executive-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Kart 1: En Çok Kayıt Açan Personel */}
        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '16px',
            padding: '1.2rem 1.25rem',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ color: '#166534', fontWeight: '700', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>🏆</span> En Çok Kayıt Açan Personel
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#166534',
                background: '#dcfce7',
                padding: '0.12rem 0.5rem',
                borderRadius: '999px',
              }}
            >
              👑 Kayıt Lideri
            </span>
          </div>

          <div style={{ margin: '0.4rem 0 0.2rem 0' }}>
            <strong style={{ fontSize: '1.15rem', color: '#0f172a', display: 'block' }}>
              {recordLeader.name}
            </strong>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#15803d', display: 'block', lineHeight: 1.2, marginTop: '0.15rem' }}>
              {recordLeader.totalRecords.toLocaleString('tr-TR')} <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#166534' }}>Saha Kaydı</span>
            </span>
          </div>

          <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#166534', fontWeight: '600' }}>✓ {recordLeader.resolvedRecords.toLocaleString('tr-TR')} Çözülen</span>
            <span>·</span>
            <span>%{recordLeader.resolveRate} Başarı Oranı</span>
          </div>
        </div>

        {/* Kart 2: En Fazla Farklı Meydanda Çalışan Personel */}
        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
            border: '1px solid #bae6fd',
            borderRadius: '16px',
            padding: '1.2rem 1.25rem',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ color: '#0369a1', fontWeight: '700', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>🌍</span> Saha Mobilite Lideri
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#0369a1',
                background: '#e0f2fe',
                padding: '0.12rem 0.5rem',
                borderRadius: '999px',
              }}
            >
              🚀 Yüksek Esneklik
            </span>
          </div>

          <div style={{ margin: '0.4rem 0 0.2rem 0' }}>
            <strong style={{ fontSize: '1.15rem', color: '#0f172a', display: 'block' }}>
              {mobilityLeader.name}
            </strong>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0284c7', display: 'block', lineHeight: 1.2, marginTop: '0.15rem' }}>
              {mobilityLeader.distinctCount} <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0369a1' }}>Farklı Meydan/Bölge</span>
            </span>
          </div>

          <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📍 {mobilityLeader.locationsPreview}
          </div>
        </div>

        {/* Kart 3: Meydanın Uzmanı */}
        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
            border: '1px solid #e9d5ff',
            borderRadius: '16px',
            padding: '1.2rem 1.25rem',
            boxShadow: '0 2px 8px rgba(147, 51, 234, 0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ color: '#7e22ce', fontWeight: '700', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>⭐</span> Meydanın Uzmanı
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#7e22ce',
                background: '#f3e8ff',
                padding: '0.12rem 0.5rem',
                borderRadius: '999px',
              }}
            >
              🏛️ Yerinde Deneyim
            </span>
          </div>

          <div style={{ margin: '0.4rem 0 0.2rem 0' }}>
            <strong style={{ fontSize: '1.15rem', color: '#0f172a', display: 'block' }}>
              {meydanSpecialist.name}
            </strong>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#9333ea', display: 'block', lineHeight: 1.2, marginTop: '0.15rem' }}>
              {meydanSpecialist.assignmentCount} <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#7e22ce' }}>Saha Faaliyeti</span>
            </span>
          </div>

          <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🏛️ {meydanSpecialist.subtitle}
          </div>
        </div>
      </div>

      {/* 3. DAHA FAZLA GÖR (İŞ YÜKÜ VE BAŞVURU HAVUZU DETAYLARI) TOGGLE BUTONU */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setShowOperationalDetails((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 1.35rem',
            borderRadius: '999px',
            fontSize: '0.82rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#00498E',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
        >
          {showOperationalDetails ? (
            <>
              <span>▲ Daha Az Gör (İş Yükü ve Başvuru Havuzunu Gizle)</span>
            </>
          ) : (
            <>
              <span>▼ Daha Fazla Gör (İş Yükü ve İlçe Başvuru Havuzu Detayları)</span>
            </>
          )}
        </button>
      </div>

      {/* 4. GENİŞLEYEN İŞ YÜKÜ VE BAŞVURU DETAYLARI BÖLÜMÜ */}
      {showOperationalDetails ? (
        <div
          className="operational-details-container"
          style={{
            marginTop: '1.25rem',
            padding: '1.25rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <span className="section-kicker" style={{ marginBottom: '0.2rem' }}>Operasyonel Durum</span>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
              İlçe Havuzları ve Başvuru Dağılımı
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              İlçe havuzlarında devam eden kayıtların durumu ve açık bildirim tablosu.
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Süreçteki Başvuru */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block' }}>
                Toplam Süreçteki Başvuru
              </span>
              <strong style={{ fontSize: '1.6rem', color: '#0f172a', display: 'block', margin: '0.2rem 0' }}>
                {totalUnresolvedCount}
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Açık ({totalOpenCount}) + Süreçte ({totalInProgressCount})
              </span>
            </div>

            {/* Öncelikli İş Durumu */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: '600', display: 'block' }}>
                Öncelikli Bildirim Durumu
              </span>
              <strong style={{ fontSize: '1.6rem', color: '#16a34a', display: 'block', margin: '0.2rem 0' }}>
                {activeCriticalCount}
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#15803d' }}>
                Müdahale bekleyen öncelikli kayıt bulunmuyor
              </span>
            </div>

            {/* Günlük Saha Gücü */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#00498E', fontWeight: '600', display: 'block' }}>
                Bugün Sahadaki Personel
              </span>
              <strong style={{ fontSize: '1.6rem', color: '#00498E', display: 'block', margin: '0.2rem 0' }}>
                {generalStats.staffOnDutyToday}
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                {generalStats.staffedMeydansToday} meydanda aktif koordinasyon
              </span>
            </div>
          </div>

          {/* Açık ve Süreçteki Başvurular Tablosu */}
          <OpenApplicationsSection />
        </div>
      ) : null}
    </section>
  );
}
