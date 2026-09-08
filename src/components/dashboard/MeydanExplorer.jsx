import React, { useState, useMemo } from 'react';
import {
  MapPinIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  BuildingLibraryIcon,
  GlobeAltIcon,
  GlobeEuropeAfricaIcon,
  UserGroupIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  ANADOLU_DISTRICTS,
  AVRUPA_DISTRICTS,
  TOTAL_MEYDAN_COUNT,
  ANADOLU_TOTAL_COUNT,
  AVRUPA_TOTAL_COUNT,
  DOGRUDAN_YONETIM_COUNT,
  ORTAK_CALISMA_COUNT,
  ALL_CANONICAL_MEYDANLAR,
} from '../../data/canonicalMeydanData.js';

function getDistrictIcon(districtName) {
  const norm = (districtName || '').toLowerCase('tr-TR');
  if (norm.includes('kadıköy') || norm.includes('kadikoy')) return <MapPinIcon width={15} height={15} />;
  if (norm.includes('üsküdar') || norm.includes('fatih')) return <BuildingLibraryIcon width={15} height={15} />;
  if (norm.includes('ataşehir') || norm.includes('çekmeköy')) return <BuildingOffice2Icon width={15} height={15} />;
  if (norm.includes('maltepe')) return <GlobeEuropeAfricaIcon width={15} height={15} />;
  if (norm.includes('kartal')) return <BuildingOfficeIcon width={15} height={15} />;
  if (norm.includes('pendik')) return <SparklesIcon width={15} height={15} />;
  if (norm.includes('tuzla')) return <PaperAirplaneIcon width={15} height={15} />;
  if (norm.includes('sancaktepe')) return <UserGroupIcon width={15} height={15} />;
  if (norm.includes('sultanbeyli')) return <BuildingLibraryIcon width={15} height={15} />;
  return <BuildingOffice2Icon width={15} height={15} />;
}

export default function MeydanExplorer({
  selectedMeydan,
  onSelectMeydan,
  todayShifts = [],
  activeDateKey = '',
  className = '',
}) {
  const [activeYaka, setActiveYaka] = useState('anadolu'); // 'all' | 'anadolu' | 'avrupa' | 'ortak'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDistricts, setExpandedDistricts] = useState({ kadikoy: true, uskudar: true, bakirkoy: true, beyoglu: true, fatih: true, sultangazi: true });

  function toggleDistrict(distId) {
    setExpandedDistricts((prev) => ({ ...prev, [distId]: !prev[distId] }));
  }

  // Active district list based on Yaka tab
  const displayedDistricts = useMemo(() => {
    if (activeYaka === 'anadolu') return ANADOLU_DISTRICTS;
    if (activeYaka === 'avrupa') return AVRUPA_DISTRICTS;
    if (activeYaka === 'ortak') {
      const all = [...ANADOLU_DISTRICTS, ...AVRUPA_DISTRICTS];
      return all
        .map((d) => ({
          ...d,
          count: d.meydanlar.filter((m) => m.kategori === 'ORTAK ÇALIŞMA').length,
          meydanlar: d.meydanlar.filter((m) => m.kategori === 'ORTAK ÇALIŞMA'),
        }))
        .filter((d) => d.meydanlar.length > 0);
    }
    return [...ANADOLU_DISTRICTS, ...AVRUPA_DISTRICTS];
  }, [activeYaka]);

  // Helper to find personnel for a specific square
  function getSquarePersonnel(m) {
    if (!m) return [];

    if (todayShifts && todayShifts.length > 0) {
      const matched = todayShifts.filter((s) => {
        if (s.isLeave) return false;
        if (m.rawVariants && s.rawLocation && m.rawVariants.some(v => v.toLowerCase().trim() === s.rawLocation.toLowerCase().trim())) {
          return true;
        }
        if (s.rawLocation && (s.rawLocation.toLowerCase().includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(s.rawLocation.toLowerCase()))) {
          return true;
        }
        if (m.personnel && s.personelAdi && m.personnel.some(p => p.toLowerCase().trim() === s.personelAdi.toLowerCase().trim())) {
          return true;
        }
        return false;
      });

      if (matched.length > 0) {
        return matched.map((s) => s.personelAdi);
      }
    }

    return m.personnel || [];
  }

  // Search filtered results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase('tr-TR');
    return ALL_CANONICAL_MEYDANLAR.filter(
      (m) =>
        m.name.toLowerCase('tr-TR').includes(query) ||
        m.district.toLowerCase('tr-TR').includes(query) ||
        (m.kategori && m.kategori.toLowerCase('tr-TR').includes(query)) ||
        (m.yonetimNotu && m.yonetimNotu.toLowerCase('tr-TR').includes(query)) ||
        (m.fonksiyonlar && m.fonksiyonlar.some((fn) => fn.toLowerCase('tr-TR').includes(query))) ||
        (m.personnel && m.personnel.some((p) => p.toLowerCase('tr-TR').includes(query)))
    );
  }, [searchQuery]);

  const isOverviewActive = !selectedMeydan || selectedMeydan.id === 'tum-meydanlar';

  return (
    <nav className={`meydan-explorer-unified ${className}`} aria-label="Meydan Gezgini">
      {/* ─── 1. TOP HEADER & OVERVIEW ─── */}
      <div className="explorer-unified-header">
        <button
          type="button"
          className={`explorer-overview-btn ${isOverviewActive ? 'is-active' : ''}`}
          onClick={() => onSelectMeydan(null)}
          title="Tüm Meydanlar Genel Bakış"
        >
          <div className="explorer-icon-pin">
            <MapPinIcon width={16} height={16} />
          </div>
          <div className="explorer-overview-text">
            <strong className="explorer-main-title">Tüm Meydanlar</strong>
            <span className="explorer-sub-label">Vardiya & Görev Noktaları</span>
          </div>
          <span className="explorer-badge-total">{TOTAL_MEYDAN_COUNT}</span>
        </button>

        {/* Search input */}
        <div className="explorer-search-wrap">
          <MagnifyingGlassIcon className="explorer-search-icon" width={15} height={15} />
          <input
            type="text"
            className="explorer-search-input"
            placeholder="Meydan, ilçe veya personel ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="explorer-search-clear"
              onClick={() => setSearchQuery('')}
              title="Temizle"
            >
              <XMarkIcon width={14} height={14} />
            </button>
          )}
        </div>

        {/* Yaka Switcher Tabs */}
        {!searchQuery && (
          <div className="explorer-yaka-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeYaka === 'anadolu'}
              className={`explorer-yaka-tab ${activeYaka === 'anadolu' ? 'is-active' : ''}`}
              onClick={() => setActiveYaka('anadolu')}
            >
              <span>Anadolu</span>
              <span className="tab-badge">{ANADOLU_TOTAL_COUNT}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeYaka === 'avrupa'}
              className={`explorer-yaka-tab ${activeYaka === 'avrupa' ? 'is-active' : ''}`}
              onClick={() => setActiveYaka('avrupa')}
            >
              <span>Avrupa</span>
              <span className="tab-badge">{AVRUPA_TOTAL_COUNT}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeYaka === 'all'}
              className={`explorer-yaka-tab ${activeYaka === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveYaka('all')}
            >
              <span>Hepsi</span>
              <span className="tab-badge">{TOTAL_MEYDAN_COUNT}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeYaka === 'ortak'}
              className={`explorer-yaka-tab ${activeYaka === 'ortak' ? 'is-active' : ''}`}
              onClick={() => setActiveYaka('ortak')}
              title="Ortak Çalışma Alanları (Beyazıt, Sultangazi vb.)"
            >
              <span>Ortak</span>
              <span className="tab-badge" style={{ background: '#ea580c', color: '#fff' }}>{ORTAK_CALISMA_COUNT}</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── 2. SCROLLABLE BODY ─── */}
      <div className="explorer-unified-body">
        {searchResults ? (
          /* Search Results */
          <div className="explorer-search-results">
            <div className="explorer-section-label">Arama Sonuçları ({searchResults.length})</div>
            {searchResults.length === 0 ? (
              <div className="explorer-empty-search">Eşleşen meydan veya personel bulunamadı.</div>
            ) : (
              searchResults.map((m) => {
                const isSelected = selectedMeydan?.id === m.id;
                const staff = getSquarePersonnel(m);
                const thumbImg = m.heroImage || '/assets/dashboard/kadikoy-boga.jpg';
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`explorer-item-btn tree-square-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelectMeydan(m)}
                  >
                    <div
                      className="tree-square-thumb"
                      style={{ backgroundImage: `url(${thumbImg})` }}
                    />
                    <div className="tree-square-info">
                      <strong className="tree-square-name">
                        {m.name}
                        {m.kategori === 'ORTAK ÇALIŞMA' && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginLeft: '6px',
                              background: 'rgba(234, 88, 12, 0.15)',
                              color: '#c2410c',
                              border: '1px solid rgba(234, 88, 12, 0.4)',
                              fontSize: '10px',
                              fontWeight: '600',
                              padding: '1px 5px',
                              borderRadius: '8px',
                              verticalAlign: 'middle',
                            }}
                            title={m.yonetimNotu}
                          >
                            🤝 Ortak
                          </span>
                        )}
                      </strong>
                      <span className="tree-square-staff">
                        👤 {staff.length > 0 ? staff.slice(0, 2).join(', ') : 'Personel Planlanıyor'}
                      </span>
                    </div>
                    <span className="tree-square-count-pill" title={`${staff.length} Personel`}>
                      {staff.length}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* Districts Accordion Tree */
          <div className="explorer-districts-tree">
            {displayedDistricts.map((dist) => {
              const isOpen = !!expandedDistricts[dist.id];
              const hasActiveChild = dist.meydanlar.some((m) => m.id === selectedMeydan?.id);

              return (
                <div key={dist.id} className={`tree-district-block ${hasActiveChild ? 'has-active' : ''}`}>
                  <button
                    type="button"
                    className={`tree-district-row ${isOpen ? 'is-open' : ''}`}
                    onClick={() => toggleDistrict(dist.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="tree-dist-left">
                      <span className="tree-dist-icon-wrap">
                        {getDistrictIcon(dist.name)}
                      </span>
                      <strong className="tree-dist-name">{dist.name}</strong>
                    </div>
                    <div className="tree-dist-right">
                      <span className="tree-dist-count">{dist.count}</span>
                      {isOpen ? (
                        <ChevronDownIcon width={13} height={13} className="tree-chevron" />
                      ) : (
                        <ChevronRightIcon width={13} height={13} className="tree-chevron" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="tree-squares-container">
                      {dist.meydanlar.map((m) => {
                        const isSelected = selectedMeydan?.id === m.id;
                        const thumbImg = m.heroImage || '/assets/dashboard/kadikoy-boga.jpg';
                        const staff = getSquarePersonnel(m);

                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={`tree-square-row ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => onSelectMeydan(m)}
                          >
                            <div
                              className="tree-square-thumb"
                              style={{ backgroundImage: `url(${thumbImg})` }}
                            />
                            <div className="tree-square-info">
                              <span className="tree-square-name">
                                {m.name}
                                {m.kategori === 'ORTAK ÇALIŞMA' && (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      marginLeft: '6px',
                                      background: 'rgba(234, 88, 12, 0.15)',
                                      color: '#c2410c',
                                      border: '1px solid rgba(234, 88, 12, 0.4)',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      padding: '1px 5px',
                                      borderRadius: '8px',
                                      verticalAlign: 'middle',
                                    }}
                                    title={m.yonetimNotu}
                                  >
                                    🤝 Ortak
                                  </span>
                                )}
                              </span>
                              <span className="tree-square-staff">
                                {staff.length > 0 ? (
                                  <>
                                    <span className="staff-icon">👤</span> {staff.slice(0, 2).join(', ')}
                                    {staff.length > 2 ? ` +${staff.length - 2}` : ''}
                                  </>
                                ) : (
                                  'Personel planlanıyor'
                                )}
                              </span>
                            </div>
                            <span className="tree-square-count-pill" title={`${staff.length} Görevli Personel`}>
                              {staff.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
