import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import compiledExecutiveData from '../../data/compiledExecutiveBasvurular.json';
import compiledMeydanStats from '../../data/compiledMeydanStats.json';
import dataFreshness from '../../data/dataFreshness.json';
import { classifyMeydanRisk, MEYDAN_OPERATIONAL_STATUSES } from '../../utils/executiveBriefing';

const ANADOLU_DISTRICTS = [
  { id: 'kadikoy', name: 'Kadıköy', ilce: 'KADIKÖY', title: 'Kadıköy Rıhtım Meydanı' },
  { id: 'uskudar', name: 'Üsküdar', ilce: 'ÜSKÜDAR', title: 'Üsküdar Mimar Sinan Meydanı' },
  { id: 'umraniye', name: 'Ümraniye', ilce: 'ÜMRANİYE', title: 'Ümraniye 15 Temmuz Şehitler Meydanı' },
  { id: 'maltepe', name: 'Maltepe', ilce: 'MALTEPE', title: 'Maltepe Sahil Meydanı' },
  { id: 'kartal', name: 'Kartal', ilce: 'KARTAL', title: 'Kartal Meydanı' },
  { id: 'pendik', name: 'Pendik', ilce: 'PENDİK', title: 'Pendik Sahil Meydanı' },
  { id: 'beykoz', name: 'Beykoz', ilce: 'BEYKOZ', title: 'Beykoz Sahil Meydanı' },
  { id: 'cekmekoy', name: 'Çekmeköy', ilce: 'ÇEKMEKÖY', title: 'Çekmeköy Meydanı' },
  { id: 'sancaktepe', name: 'Sancaktepe', ilce: 'SANCAKTEPE', title: 'Sancaktepe Meydanı' },
  { id: 'sultanbeyli', name: 'Sultanbeyli', ilce: 'SULTANBEYLİ', title: 'Sultanbeyli Kent Meydanı' },
  { id: 'tuzla', name: 'Tuzla', ilce: 'TUZLA', title: 'Tuzla Sahil Meydanı' },
  { id: 'sile', name: 'Şile', ilce: 'ŞİLE', title: 'Şile Meydanı' },
  { id: 'adalar', name: 'Adalar', ilce: 'ADALAR', title: 'Büyükada Saat Meydanı' },
  { id: 'atasehir', name: 'Ataşehir', ilce: 'ATAŞEHİR', title: 'Ataşehir Meydanı' },
];

const AVRUPA_DISTRICTS = [
  { id: 'taksim', name: 'Taksim', ilce: 'BEYOĞLU', title: 'Taksim Meydanı' },
  { id: 'besiktas', name: 'Beşiktaş', ilce: 'BEŞİKTAŞ', title: 'Beşiktaş İskele Meydanı' },
  { id: 'fatih', name: 'Fatih (Aksaray)', ilce: 'FATİH', title: 'Fatih Aksaray Meydanı' },
  { id: 'sisli', name: 'Şişli Mecidiyeköy', ilce: 'ŞİŞLİ', title: 'Şişli Mecidiyeköy Meydanı' },
  { id: 'bakirkoy', name: 'Bakırköy', ilce: 'BAKIRKÖY', title: 'Bakırköy Özgürlük Meydanı' },
  { id: 'bahcelievler', name: 'Bahçelievler', ilce: 'BAHÇELİEVLER', title: 'Bahçelievler Şirinevler Meydanı' },
  { id: 'zeytinburnu', name: 'Zeytinburnu', ilce: 'ZEYTİNBURNU', title: 'Zeytinburnu 15 Temmuz Meydanı' },
  { id: 'eyupsultan', name: 'Eyüpsultan', ilce: 'EYÜPSULTAN', title: 'Eyüpsultan Meydanı' },
  { id: 'sariyer', name: 'Sarıyer', ilce: 'SARIYER', title: 'Sarıyer Merkez Meydanı' },
  { id: 'sultangazi', name: 'Sultangazi', ilce: 'SULTANGAZİ', title: 'Sultangazi Meydanı' },
  { id: 'esenler', name: 'Esenler', ilce: 'ESENLER', title: 'Esenler Dörtyol Meydanı' },
  { id: 'bagcilar', name: 'Bağcılar', ilce: 'BAĞCILAR', title: 'Bağcılar 15 Temmuz Meydanı' },
  { id: 'avcilar', name: 'Avcılar', ilce: 'AVCILAR', title: 'Avcılar Marmara Cad. Meydanı' },
  { id: 'beylikduzu', name: 'Beylikdüzü', ilce: 'BEYLİKDÜZÜ', title: 'Beylikdüzü Yaşam Vadisi Meydanı' },
  { id: 'buyukcekmece', name: 'Büyükçekmece', ilce: 'BÜYÜKÇEKMECE', title: 'Büyükçekmece Kent Meydanı' },
  { id: 'silivri', name: 'Silivri', ilce: 'SİLİVRİ', title: 'Silivri Sahil Meydanı' },
  { id: 'basaksehir', name: 'Başakşehir', ilce: 'BAŞAKŞEHİR', title: 'Başakşehir Sular Vadisi' },
  { id: 'bayrampasa', name: 'Bayrampaşa', ilce: 'BAYRAMPAŞA', title: 'Bayrampaşa Meydanı' },
  { id: 'esenyurt', name: 'Esenyurt', ilce: 'ESENYURT', title: 'Esenyurt Cumhuriyet Meydanı' },
  { id: 'gaziosmanpasa', name: 'Gaziosmanpaşa', ilce: 'GAZİOSMANPAŞA', title: 'Gaziosmanpaşa Meydanı' },
  { id: 'gungoren', name: 'Güngören', ilce: 'GÜNGÖREN', title: 'Güngören Meydanı' },
  { id: 'kagithane', name: 'Kağıthane', ilce: 'KAĞITHANE', title: 'Kağıthane Çağlayan Meydanı' },
  { id: 'kucukcekmece', name: 'Küçükçekmece', ilce: 'KÜÇÜKÇEKMECE', title: 'Küçükçekmece Meydanı' },
];

export default function IstanbulFieldMap({ todayShifts = [], activeMeydanlar = [] }) {
  const [selectedMeydan, setSelectedMeydan] = useState(null);
  const [sideFilter, setSideFilter] = useState('all'); // 'all' | 'avrupa' | 'anadolu' | 'risk_only'

  // Precompute metrics map
  const { districtStats, staffByMeydan } = useMemo(() => {
    const staffMap = new Map();
    todayShifts.forEach((shift) => {
      const id = shift.meydanId;
      if (!id) return;
      if (!staffMap.has(id)) staffMap.set(id, []);
      staffMap.get(id).push(shift);
    });

    const slaByDistrict = {};
    (compiledExecutiveData?.slaBreachedItems || []).forEach((item) => {
      const d = item.ilce || 'DİĞER';
      slaByDistrict[d] = (slaByDistrict[d] || 0) + 1;
    });

    const openByDistrict = {};
    (compiledExecutiveData?.unresolvedItems || []).forEach((item) => {
      const d = item.ilce || 'DİĞER';
      openByDistrict[d] = (openByDistrict[d] || 0) + 1;
    });

    const criticalByDistrict = {};
    (compiledExecutiveData?.criticalItems || []).forEach((item) => {
      if (item.durum !== 'Kapandı' && item.durum !== 'Çözüldü') {
        const d = item.ilce || 'DİĞER';
        criticalByDistrict[d] = (criticalByDistrict[d] || 0) + 1;
      }
    });

    return {
      districtStats: {
        slaByDistrict,
        openByDistrict,
        criticalByDistrict,
      },
      staffByMeydan: staffMap,
    };
  }, [todayShifts]);

  const evaluateMeydan = (m) => {
    const ilce = m.ilce;
    const staff = staffByMeydan.get(m.id) || [];
    const plannedCount = staff.length;
    const slaCount = districtStats.slaByDistrict[ilce] || 0;
    const openCount = districtStats.openByDistrict[ilce] || 0;
    const activeCriticalCount = districtStats.criticalByDistrict[ilce] || 0;
    const statsObj = compiledMeydanStats[m.id] || {};
    const sonTarih = statsObj.sonTarih || dataFreshness?.lastApplicationDateFormatted || '14 Ağustos 2026';

    const risk = classifyMeydanRisk({
      activeCriticalCount,
      slaBreachedCount: slaCount,
      openCount,
      plannedStaffCount: plannedCount,
    });

    return {
      ...m,
      staff,
      plannedCount,
      slaCount,
      openCount,
      activeCriticalCount,
      sonTarih,
      risk,
    };
  };

  const allMeydanList = useMemo(() => {
    return [
      ...AVRUPA_DISTRICTS.map((d) => ({ ...d, side: 'avrupa' })),
      ...ANADOLU_DISTRICTS.map((d) => ({ ...d, side: 'anadolu' })),
    ].map(evaluateMeydan);
  }, [districtStats, staffByMeydan]);

  const filteredMeydanList = useMemo(() => {
    if (sideFilter === 'avrupa') {
      return allMeydanList.filter((m) => m.side === 'avrupa');
    }
    if (sideFilter === 'anadolu') {
      return allMeydanList.filter((m) => m.side === 'anadolu');
    }
    if (sideFilter === 'risk_only') {
      return allMeydanList.filter((m) => m.risk.id !== 'NORMAL');
    }
    return allMeydanList;
  }, [allMeydanList, sideFilter]);

  const avrupaItems = filteredMeydanList.filter((m) => m.side === 'avrupa');
  const anadoluItems = filteredMeydanList.filter((m) => m.side === 'anadolu');

  return (
    <div className="istanbul-field-map-container" style={{ marginTop: '1rem' }}>
      {/* Controls & Filter Bar */}
      <div className="map-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="map-controls__side-picker" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`map-tab ${sideFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setSideFilter('all')}
          >
            Tüm Meydanlar ({allMeydanList.length})
          </button>
          <button
            type="button"
            className={`map-tab ${sideFilter === 'avrupa' ? 'is-active' : ''}`}
            onClick={() => setSideFilter('avrupa')}
          >
            🏰 Avrupa Yakası ({AVRUPA_DISTRICTS.length})
          </button>
          <button
            type="button"
            className={`map-tab ${sideFilter === 'anadolu' ? 'is-active' : ''}`}
            onClick={() => setSideFilter('anadolu')}
          >
            🌊 Anadolu Yakası ({ANADOLU_DISTRICTS.length})
          </button>
          <button
            type="button"
            className={`map-tab ${sideFilter === 'risk_only' ? 'is-active' : ''}`}
            onClick={() => setSideFilter('risk_only')}
            style={{ color: '#e11d48', fontWeight: '700' }}
          >
            ⚠️ Riskli / Nöbetsiz ({allMeydanList.filter((m) => m.risk.id !== 'NORMAL').length})
          </button>
        </div>

        {/* Legend */}
        <div className="map-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.75rem' }}>
          <span className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} /> İlçede Kritik İş
          </span>
          <span className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e11d48' }} /> İlçe SLA Riski
          </span>
          <span className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} /> Meydan Nöbeti Yok
          </span>
          <span className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c' }} /> İlçede Açık İş
          </span>
          <span className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} /> Normal
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="map-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {avrupaItems.length > 0 ? (
          <div className="map-region-block">
            <h4 className="region-title" style={{ fontSize: '0.9rem', color: '#00498E', marginBottom: '0.75rem' }}>
              🏰 Avrupa Yakası Meydanları ({avrupaItems.length})
            </h4>
            <div className="district-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.6rem' }}>
              {avrupaItems.map((m) => {
                const isSelected = selectedMeydan?.id === m.id;
                return (
                  <div
                    key={m.id}
                    className={`district-map-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedMeydan(m)}
                    style={{
                      background: m.risk.bgColor,
                      border: `1px solid ${isSelected ? '#00498E' : m.risk.borderColor}`,
                      borderRadius: '12px',
                      padding: '0.65rem 0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 0 2px #00498E' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </strong>
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: m.risk.color,
                          flexShrink: 0,
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <span style={{ color: m.risk.color, fontWeight: '600' }}>
                        {m.risk.shortLabel}
                      </span>
                      <span style={{ color: '#64748b' }}>
                        {m.plannedCount ? `${m.plannedCount} Nöbet` : '0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {anadoluItems.length > 0 ? (
          <div className="map-region-block">
            <h4 className="region-title" style={{ fontSize: '0.9rem', color: '#00498E', marginBottom: '0.75rem' }}>
              🌊 Anadolu Yakası Meydanları ({anadoluItems.length})
            </h4>
            <div className="district-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.6rem' }}>
              {anadoluItems.map((m) => {
                const isSelected = selectedMeydan?.id === m.id;
                return (
                  <div
                    key={m.id}
                    className={`district-map-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedMeydan(m)}
                    style={{
                      background: m.risk.bgColor,
                      border: `1px solid ${isSelected ? '#00498E' : m.risk.borderColor}`,
                      borderRadius: '12px',
                      padding: '0.65rem 0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 0 2px #00498E' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </strong>
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: m.risk.color,
                          flexShrink: 0,
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <span style={{ color: m.risk.color, fontWeight: '600' }}>
                        {m.risk.shortLabel}
                      </span>
                      <span style={{ color: '#64748b' }}>
                        {m.plannedCount ? `${m.plannedCount} Nöbet` : '0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Kompakt Harita Detay Kartı */}
      {selectedMeydan ? (
        <div
          className="map-detail-card"
          style={{
            marginTop: '1.25rem',
            background: '#ffffff',
            border: `1px solid ${selectedMeydan.risk.borderColor}`,
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                  🏛️ {selectedMeydan.title || selectedMeydan.name}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    color: selectedMeydan.risk.color,
                    background: selectedMeydan.risk.bgColor,
                    border: `1px solid ${selectedMeydan.risk.borderColor}`,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                  }}
                >
                  {selectedMeydan.risk.label}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Bağlı Olduğu İlçe: <strong>{selectedMeydan.ilce}</strong> · {selectedMeydan.risk.description}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMeydan(null)}
              style={{
                border: 'none',
                background: '#f1f5f9',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontWeight: '700',
                color: '#64748b',
              }}
            >
              ✕
            </button>
          </div>

          {/* BÖLÜM 1: MEYDAN OPERASYONU (MEYDAN_LEVEL) */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <strong style={{ fontSize: '0.82rem', color: '#00498E', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Meydan Nöbetçi Kadrosu (Meydan Seviyesi)
              </strong>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: selectedMeydan.plannedCount > 0 ? '#16a34a' : '#d97706' }}>
                {selectedMeydan.plannedCount > 0 ? `${selectedMeydan.plannedCount} Planlı Personel` : 'Nöbetçi Görünmüyor'}
              </span>
            </div>

            {selectedMeydan.staff.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {selectedMeydan.staff.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                    }}
                  >
                    👤 {s.personelAdi} ({s.saatAraligi})
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.76rem', color: '#92400e' }}>
                ℹ️ Son vardiya planında bu fiziksel meydana nöbetçi atanmamıştır (Gezici saha denetimi gerekir).
              </div>
            )}
          </div>

          {/* BÖLÜM 2: İLÇE BAŞVURU DURUMU (DISTRICT_LEVEL) */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <strong style={{ fontSize: '0.82rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                📍 {selectedMeydan.ilce} İlçesi Genelinde Başvuru Durumu
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                İlçe Havuzu
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.65rem',
              }}
            >
              <div style={{ background: '#fff1f2', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #fecdd3' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#9f1239' }}>İlçe Taahhüt Aşımı (SLA)</span>
                <strong style={{ fontSize: '1.1rem', color: '#e11d48' }}>
                  {selectedMeydan.slaCount}
                </strong>
              </div>
              <div style={{ background: '#fff7ed', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#9a3412' }}>İlçe Açık / Süreçte İş</span>
                <strong style={{ fontSize: '1.1rem', color: '#ea580c' }}>
                  {selectedMeydan.openCount}
                </strong>
              </div>
              <div style={{ background: '#f0fdf4', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#166534' }}>İlçede Aktif Kritik İş</span>
                <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>
                  {selectedMeydan.activeCriticalCount}
                </strong>
              </div>
            </div>

            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
              * Başvuru ve SLA göstergeleri {selectedMeydan.ilce} ilçesi genelindeki verilere dayanmaktadır. Nöbetçi kadrosu doğrudan fiziksel meydana aittir.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <Link
              to={`/meydan/${selectedMeydan.id}`}
              className="btn btn-primary"
              style={{
                textDecoration: 'none',
                padding: '0.45rem 1rem',
                fontSize: '0.82rem',
                fontWeight: '600',
                borderRadius: '8px',
              }}
            >
              {selectedMeydan.name} Meydan Detayına Git →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
