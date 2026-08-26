import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import compiledExecutiveData from '../../data/compiledExecutiveBasvurular.json';
import compiledMeydanStats from '../../data/compiledMeydanStats.json';
import dataFreshness from '../../data/dataFreshness.json';

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
  const [sideFilter, setSideFilter] = useState('all'); // 'all' | 'avrupa' | 'anadolu'
  const [showAllMeydanlar, setShowAllMeydanlar] = useState(false);

  // Precompute metrics map
  const { districtStats, staffByMeydan } = useMemo(() => {
    const staffMap = new Map();
    todayShifts.forEach((shift) => {
      const id = shift.meydanId;
      if (!id) return;
      if (!staffMap.has(id)) staffMap.set(id, []);
      staffMap.get(id).push(shift);
    });

    const openByDistrict = {};
    (compiledExecutiveData?.unresolvedItems || []).forEach((item) => {
      const d = item.ilce || 'DİĞER';
      openByDistrict[d] = (openByDistrict[d] || 0) + 1;
    });

    const priorityByDistrict = {};
    (compiledExecutiveData?.criticalItems || []).forEach((item) => {
      if (item.durum !== 'Kapandı' && item.durum !== 'Çözüldü') {
        const d = item.ilce || 'DİĞER';
        priorityByDistrict[d] = (priorityByDistrict[d] || 0) + 1;
      }
    });

    return {
      districtStats: {
        openByDistrict,
        priorityByDistrict,
      },
      staffByMeydan: staffMap,
    };
  }, [todayShifts]);

  const evaluateMeydan = (m) => {
    const ilce = m.ilce;
    const staff = staffByMeydan.get(m.id) || [];
    const plannedCount = staff.length;
    const openCount = districtStats.openByDistrict[ilce] || 0;
    const activePriorityCount = districtStats.priorityByDistrict[ilce] || 0;
    const statsObj = compiledMeydanStats[m.id] || {};
    const sonTarih = statsObj.sonTarih || dataFreshness?.lastApplicationDateFormatted || '14 Ağustos 2026';

    return {
      ...m,
      staff,
      plannedCount,
      openCount,
      activePriorityCount,
      sonTarih,
      hasStaff: plannedCount > 0,
    };
  };

  const allMeydanList = useMemo(() => {
    return [
      ...AVRUPA_DISTRICTS.map((d) => ({ ...d, side: 'avrupa' })),
      ...ANADOLU_DISTRICTS.map((d) => ({ ...d, side: 'anadolu' })),
    ].map(evaluateMeydan);
  }, [districtStats, staffByMeydan]);

  // Counts summary
  const totalStaffCount = useMemo(() => {
    return todayShifts.length;
  }, [todayShifts]);

  const staffedMeydanCount = useMemo(() => {
    return allMeydanList.filter((m) => m.hasStaff).length;
  }, [allMeydanList]);

  const avrupaStaffedCount = useMemo(() => {
    return allMeydanList.filter((m) => m.side === 'avrupa' && m.hasStaff).length;
  }, [allMeydanList]);

  const anadoluStaffedCount = useMemo(() => {
    return allMeydanList.filter((m) => m.side === 'anadolu' && m.hasStaff).length;
  }, [allMeydanList]);

  // Filtered by side
  const currentSideList = useMemo(() => {
    if (sideFilter === 'avrupa') {
      return allMeydanList.filter((m) => m.side === 'avrupa');
    }
    if (sideFilter === 'anadolu') {
      return allMeydanList.filter((m) => m.side === 'anadolu');
    }
    return allMeydanList;
  }, [allMeydanList, sideFilter]);

  // Unstaffed count in current side view
  const unstaffedInCurrentSide = useMemo(() => {
    return currentSideList.filter((m) => !m.hasStaff).length;
  }, [currentSideList]);

  // Filtered list (respecting showAllMeydanlar)
  const displayedMeydanList = useMemo(() => {
    if (!showAllMeydanlar) {
      return currentSideList.filter((m) => m.hasStaff);
    }
    return currentSideList;
  }, [currentSideList, showAllMeydanlar]);

  const avrupaItems = displayedMeydanList.filter((m) => m.side === 'avrupa');
  const anadoluItems = displayedMeydanList.filter((m) => m.side === 'anadolu');

  return (
    <div className="istanbul-field-map-container" style={{ marginTop: '1rem' }}>
      {/* Controls & Filter Bar */}
      <div
        className="map-controls"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        {/* Side Picker Tabs */}
        <div className="map-controls__side-picker" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`map-tab ${sideFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setSideFilter('all')}
          >
            Tüm Meydanlar ({showAllMeydanlar ? allMeydanList.length : staffedMeydanCount})
          </button>
          <button
            type="button"
            className={`map-tab ${sideFilter === 'avrupa' ? 'is-active' : ''}`}
            onClick={() => setSideFilter('avrupa')}
          >
            🏰 Avrupa Yakası ({showAllMeydanlar ? AVRUPA_DISTRICTS.length : avrupaStaffedCount})
          </button>
          <button
            type="button"
            className={`map-tab ${sideFilter === 'anadolu' ? 'is-active' : ''}`}
            onClick={() => setSideFilter('anadolu')}
          >
            🌊 Anadolu Yakası ({showAllMeydanlar ? ANADOLU_DISTRICTS.length : anadoluStaffedCount})
          </button>
        </div>

        {/* Clean Operational Summary Legend */}
        <div
          className="map-legend"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.78rem',
            color: '#475569',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              fontWeight: '600',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
            {staffedMeydanCount} Meydanda Personel Var
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#f8fafc',
              color: '#00498E',
              border: '1px solid #cbd5e1',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              fontWeight: '600',
            }}
          >
            👥 {totalStaffCount} Personel Sahada
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="map-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {avrupaItems.length > 0 ? (
          <div className="map-region-block">
            <h4
              className="region-title"
              style={{
                fontSize: '0.88rem',
                fontWeight: '700',
                color: '#00498E',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>🏰 Avrupa Yakası Meydanları</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  color: '#0369a1',
                  background: '#e0f2fe',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                }}
              >
                {avrupaItems.length}
              </span>
            </h4>
            <div className="district-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem' }}>
              {avrupaItems.map((m) => {
                const isSelected = selectedMeydan?.id === m.id;
                const hasStaff = m.hasStaff;

                return (
                  <div
                    key={m.id}
                    className={`district-map-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedMeydan(m)}
                    style={{
                      background: hasStaff ? '#ffffff' : '#f8fafc',
                      border: `1px solid ${isSelected ? '#00498E' : hasStaff ? '#bbf7d0' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      padding: '0.65rem 0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected
                        ? '0 0 0 2px #00498E'
                        : hasStaff
                        ? '0 2px 6px rgba(22, 163, 74, 0.08)'
                        : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <strong
                        style={{
                          fontSize: '0.82rem',
                          color: hasStaff ? '#0f172a' : '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.name}
                      </strong>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: hasStaff ? '#16a34a' : '#cbd5e1',
                          flexShrink: 0,
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <span style={{ color: hasStaff ? '#15803d' : '#94a3b8', fontWeight: hasStaff ? '600' : '400' }}>
                        {hasStaff ? 'Personel Var' : 'Plan Yok'}
                      </span>
                      {hasStaff ? (
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '0.7rem',
                          }}
                        >
                          {m.plannedCount} Personel
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          sideFilter !== 'anadolu' && (
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', fontSize: '0.8rem', color: '#64748b' }}>
              Avrupa Yakası'nda şu anda personeli bulunan meydan görünmüyor.
            </div>
          )
        )}

        {anadoluItems.length > 0 ? (
          <div className="map-region-block">
            <h4
              className="region-title"
              style={{
                fontSize: '0.88rem',
                fontWeight: '700',
                color: '#00498E',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>🌊 Anadolu Yakası Meydanları</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  color: '#0369a1',
                  background: '#e0f2fe',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                }}
              >
                {anadoluItems.length}
              </span>
            </h4>
            <div className="district-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem' }}>
              {anadoluItems.map((m) => {
                const isSelected = selectedMeydan?.id === m.id;
                const hasStaff = m.hasStaff;

                return (
                  <div
                    key={m.id}
                    className={`district-map-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedMeydan(m)}
                    style={{
                      background: hasStaff ? '#ffffff' : '#f8fafc',
                      border: `1px solid ${isSelected ? '#00498E' : hasStaff ? '#bbf7d0' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      padding: '0.65rem 0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected
                        ? '0 0 0 2px #00498E'
                        : hasStaff
                        ? '0 2px 6px rgba(22, 163, 74, 0.08)'
                        : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <strong
                        style={{
                          fontSize: '0.82rem',
                          color: hasStaff ? '#0f172a' : '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.name}
                      </strong>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: hasStaff ? '#16a34a' : '#cbd5e1',
                          flexShrink: 0,
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <span style={{ color: hasStaff ? '#15803d' : '#94a3b8', fontWeight: hasStaff ? '600' : '400' }}>
                        {hasStaff ? 'Personel Var' : 'Plan Yok'}
                      </span>
                      {hasStaff ? (
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '0.7rem',
                          }}
                        >
                          {m.plannedCount} Personel
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          sideFilter !== 'avrupa' && (
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', fontSize: '0.8rem', color: '#64748b' }}>
              Anadolu Yakası'nda şu anda personeli bulunan meydan görünmüyor.
            </div>
          )
        )}
      </div>

      {/* Daha Fazla Gör / Daha Az Gör Butonu */}
      {unstaffedInCurrentSide > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowAllMeydanlar((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#00498E',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#f8fafc')}
          >
            {showAllMeydanlar ? (
              <>
                <span>▲ Daha Az Gör (Sadece Personeli Olan Meydanlar)</span>
              </>
            ) : (
              <>
                <span>▼ Daha Fazla Gör ({unstaffedInCurrentSide} Meydan Daha)</span>
              </>
            )}
          </button>
        </div>
      ) : null}

      {/* Kompakt Harita Detay Kartı */}
      {selectedMeydan ? (
        <div
          className="map-detail-card"
          style={{
            marginTop: '1.25rem',
            background: '#ffffff',
            border: `1px solid ${selectedMeydan.hasStaff ? '#bbf7d0' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
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
                    color: selectedMeydan.hasStaff ? '#166534' : '#64748b',
                    background: selectedMeydan.hasStaff ? '#dcfce7' : '#f1f5f9',
                    border: `1px solid ${selectedMeydan.hasStaff ? '#bbf7d0' : '#e2e8f0'}`,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                  }}
                >
                  {selectedMeydan.hasStaff ? 'Personel Görevde' : 'Planlanmış Personel Yok'}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Bağlı Olduğu İlçe: <strong>{selectedMeydan.ilce}</strong>
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

          {/* BÖLÜM 1: MEYDAN PERSONEL KADROSU */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <strong style={{ fontSize: '0.82rem', color: '#00498E', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Meydan Personel Kadrosu
              </strong>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: selectedMeydan.plannedCount > 0 ? '#16a34a' : '#64748b' }}>
                {selectedMeydan.plannedCount > 0 ? `${selectedMeydan.plannedCount} Planlı Personel` : 'Personel Planı Yok'}
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
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                ℹ️ Bugün için bu meydanda planlanmış personel kaydı bulunmamaktadır.
              </div>
            )}
          </div>

          {/* BÖLÜM 2: İLÇE GENEL SAHA DURUMU */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <strong style={{ fontSize: '0.82rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                📍 {selectedMeydan.ilce} İlçesi Genel Saha Durumu
              </strong>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.65rem',
              }}
            >
              <div style={{ background: '#f0f9ff', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#0369a1' }}>İlçede Açık / Süreçteki İş</span>
                <strong style={{ fontSize: '1.1rem', color: '#0284c7' }}>
                  {selectedMeydan.openCount}
                </strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#475569' }}>Öncelikli Takipteki İş</span>
                <strong style={{ fontSize: '1.1rem', color: '#334155' }}>
                  {selectedMeydan.activePriorityCount}
                </strong>
              </div>
            </div>
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
