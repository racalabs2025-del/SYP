import React, { useState, useMemo } from 'react';
import {
  MapPinIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
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
  ViewColumnsIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import {
  ANADOLU_DISTRICTS,
  AVRUPA_DISTRICTS,
  TOTAL_MEYDAN_COUNT,
  ANADOLU_TOTAL_COUNT,
  AVRUPA_TOTAL_COUNT,
  ALL_CANONICAL_MEYDANLAR,
} from '../../data/canonicalMeydanData';

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
  className = '',
}) {
  const [viewMode, setViewMode] = useState('drilldown'); // 'drilldown' | 'accordion'
  const [activeYaka, setActiveYaka] = useState('anadolu'); // 'anadolu' | 'avrupa'
  const [activeDistrictId, setActiveDistrictId] = useState('kadikoy'); // default 'kadikoy'
  const [searchQuery, setSearchQuery] = useState('');

  // Accordion state (for tree view mode)
  const [expandedYakalar, setExpandedYakalar] = useState({ anadolu: true, avrupa: true });
  const [expandedDistricts, setExpandedDistricts] = useState({ kadikoy: true, beyoglu: true });

  function toggleAccordionYaka(yakaKey) {
    setExpandedYakalar((prev) => ({ ...prev, [yakaKey]: !prev[yakaKey] }));
  }

  function toggleAccordionDistrict(distId) {
    setExpandedDistricts((prev) => ({ ...prev, [distId]: !prev[distId] }));
  }

  // Active district list
  const activeDistrictsList = useMemo(() => {
    return activeYaka === 'anadolu' ? ANADOLU_DISTRICTS : AVRUPA_DISTRICTS;
  }, [activeYaka]);

  const activeDistrict = useMemo(() => {
    return activeDistrictsList.find((d) => d.id === activeDistrictId) || activeDistrictsList[0];
  }, [activeDistrictsList, activeDistrictId]);

  // Search filtered results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase('tr-TR');
    return ALL_CANONICAL_MEYDANLAR.filter(
      (m) =>
        m.name.toLowerCase('tr-TR').includes(query) ||
        m.district.toLowerCase('tr-TR').includes(query)
    );
  }, [searchQuery]);

  return (
    <div className={`meydan-explorer ${viewMode === 'accordion' ? 'meydan-explorer--accordion' : 'meydan-explorer--drilldown'} ${className}`}>
      {/* ─── MODE A: MULTI-PANE DRILLDOWN (REF IMAGE 1) ─── */}
      {viewMode === 'drilldown' ? (
        <>
          {/* Column 1: Main Overview & Yaka Selector */}
          <div className="explorer-col explorer-col--primary">
            <div className="explorer-col__header">
              <div className="explorer-title-wrap">
                <button
                  type="button"
                  className={`explorer-overview-btn ${!selectedMeydan || selectedMeydan.id === 'tum-meydanlar' ? 'is-active' : ''}`}
                  onClick={() => onSelectMeydan(null)}
                  title="Genel Bakışa Dön"
                >
                  <div className="explorer-icon-pin">
                    <MapPinIcon width={16} height={16} />
                  </div>
                  <h3 className="explorer-main-title">Tüm Meydanlar</h3>
                  <span className="explorer-badge-total">{TOTAL_MEYDAN_COUNT}</span>
                </button>

                <button
                  type="button"
                  className="explorer-mode-toggle-btn"
                  onClick={() => setViewMode('accordion')}
                  title="Ağaç / Akordeon Görünümüne Geç"
                  aria-label="Ağaç görünümü"
                >
                  <ListBulletIcon width={15} height={15} />
                </button>
              </div>

              <div className="explorer-search-wrap">
                <MagnifyingGlassIcon className="explorer-search-icon" width={15} height={15} />
                <input
                  type="text"
                  className="explorer-search-input"
                  placeholder="Meydan veya ilçe ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {searchResults ? (
              <div className="explorer-search-results">
                <div className="explorer-section-label">Arama Sonuçları ({searchResults.length})</div>
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`explorer-item-btn ${selectedMeydan?.id === m.id ? 'is-active' : ''}`}
                    onClick={() => onSelectMeydan(m)}
                  >
                    <div className="explorer-item-left">
                      <span className="explorer-district-dot" />
                      <span className="explorer-item-name">{m.name}</span>
                    </div>
                    <span className="explorer-item-count">{m.district}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="explorer-yaka-list">
                <button
                  type="button"
                  className={`explorer-yaka-btn ${activeYaka === 'anadolu' ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveYaka('anadolu');
                    setActiveDistrictId(ANADOLU_DISTRICTS[0].id);
                  }}
                >
                  <div className="explorer-yaka-left">
                    <GlobeAltIcon width={17} height={17} className="explorer-yaka-icon" />
                    <span className="explorer-yaka-name">Anadolu Yakası</span>
                  </div>
                  <div className="explorer-yaka-right">
                    <span className="explorer-badge-count">{ANADOLU_TOTAL_COUNT}</span>
                    <ChevronRightIcon width={13} height={13} className="explorer-arrow" />
                  </div>
                </button>

                <button
                  type="button"
                  className={`explorer-yaka-btn ${activeYaka === 'avrupa' ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveYaka('avrupa');
                    setActiveDistrictId(AVRUPA_DISTRICTS[0].id);
                  }}
                >
                  <div className="explorer-yaka-left">
                    <BuildingOffice2Icon width={17} height={17} className="explorer-yaka-icon" />
                    <span className="explorer-yaka-name">Avrupa Yakası</span>
                  </div>
                  <div className="explorer-yaka-right">
                    <span className="explorer-badge-count">{AVRUPA_TOTAL_COUNT}</span>
                    <ChevronRightIcon width={13} height={13} className="explorer-arrow" />
                  </div>
                </button>
              </div>
            )}

            {/* Decorative Bottom Silhouette and Official İBB Brand */}
            <div className="explorer-col__footer">
              <div
                className="explorer-footer-silhouette"
                style={{ backgroundImage: 'url(/assets/dashboard/bosphorus-bridge-sketch.svg)' }}
              />
              <div className="explorer-footer-brand">
                <img
                  src="/assets/dashboard/ibb-official-logo.svg"
                  alt="İBB"
                  className="explorer-ibb-logo"
                />
                <div className="explorer-footer-text">
                  <span className="explorer-ibb-title">İSTANBUL</span>
                  <span className="explorer-ibb-sub">BÜYÜKŞEHİR BELEDİYESİ</span>
                  <span className="explorer-ibb-slogan">Daha güçlü Daha yaşanabilir İstanbul</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Districts in the active Yaka */}
          {!searchResults && (
            <div className="explorer-col explorer-col--districts">
              <div className="explorer-col__header">
                <div className="explorer-back-title">
                  <div className="explorer-back-left">
                    <ChevronLeftIcon width={14} height={14} className="explorer-back-icon" />
                    <span className="explorer-current-yaka">
                      {activeYaka === 'anadolu' ? 'Anadolu Yakası' : 'Avrupa Yakası'}
                    </span>
                  </div>
                  <span className="explorer-badge-count explorer-badge-count--blue">
                    {activeYaka === 'anadolu' ? ANADOLU_TOTAL_COUNT : AVRUPA_TOTAL_COUNT}
                  </span>
                </div>
              </div>

              <div className="explorer-districts-scroll">
                {activeDistrictsList.map((district) => {
                  const isSelected = activeDistrict?.id === district.id;
                  return (
                    <button
                      key={district.id}
                      type="button"
                      className={`explorer-item-btn explorer-district-btn ${isSelected ? 'is-active' : ''}`}
                      onClick={() => setActiveDistrictId(district.id)}
                    >
                      <div className="explorer-item-left">
                        <span className="explorer-district-icon-wrap">
                          {getDistrictIcon(district.name)}
                        </span>
                        <span className="explorer-item-name">{district.name}</span>
                      </div>
                      <div className="explorer-item-right">
                        <span className="explorer-item-count">{district.count}</span>
                        <ChevronRightIcon width={13} height={13} className="explorer-arrow" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Column 3: Squares in the active District */}
          {!searchResults && activeDistrict && (
            <div className="explorer-col explorer-col--squares">
              <div className="explorer-col__header">
                <div className="explorer-back-title">
                  <div className="explorer-back-left">
                    <ChevronLeftIcon width={14} height={14} className="explorer-back-icon" />
                    <span className="explorer-current-district">{activeDistrict.name}</span>
                  </div>
                  <span className="explorer-badge-count explorer-badge-count--blue">
                    {activeDistrict.count}
                  </span>
                </div>
              </div>

              <div className="explorer-squares-scroll">
                {activeDistrict.meydanlar.map((meydan) => {
                  const isSelected = selectedMeydan?.id === meydan.id;
                  const thumbImg = meydan.heroImage || '/assets/dashboard/kadikoy-boga.jpg';
                  return (
                    <button
                      key={meydan.id}
                      type="button"
                      className={`explorer-square-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => onSelectMeydan(meydan)}
                    >
                      <div
                        className="explorer-square-thumb"
                        style={{ backgroundImage: `url(${thumbImg})` }}
                      />
                      <span className="explorer-square-name">{meydan.name}</span>
                      <ChevronRightIcon width={13} height={13} className="explorer-square-arrow" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ─── MODE B: COMPACT TREE ACCORDION (REF IMAGE 2) ─── */
        <div className="explorer-col explorer-col--accordion-full">
          <div className="explorer-col__header">
            <div className="explorer-title-wrap">
              <button
                type="button"
                className={`explorer-overview-btn ${!selectedMeydan || selectedMeydan.id === 'tum-meydanlar' ? 'is-active' : ''}`}
                onClick={() => onSelectMeydan(null)}
                title="Genel Bakışa Dön"
              >
                <div className="explorer-icon-pin">
                  <MapPinIcon width={16} height={16} />
                </div>
                <h3 className="explorer-main-title">Tüm Meydanlar</h3>
                <span className="explorer-badge-total">{TOTAL_MEYDAN_COUNT}</span>
              </button>

              <button
                type="button"
                className="explorer-mode-toggle-btn"
                onClick={() => setViewMode('drilldown')}
                title="Sütunlu / Çekmeceli Görünüme Geç"
                aria-label="Sütunlu görünüm"
              >
                <ViewColumnsIcon width={15} height={15} />
              </button>
            </div>

            <div className="explorer-search-wrap">
              <MagnifyingGlassIcon className="explorer-search-icon" width={15} height={15} />
              <input
                type="text"
                className="explorer-search-input"
                placeholder="Meydan veya ilçe ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="explorer-accordion-body">
            {searchResults ? (
              <div className="explorer-search-results">
                <div className="explorer-section-label">Arama Sonuçları ({searchResults.length})</div>
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`explorer-item-btn ${selectedMeydan?.id === m.id ? 'is-active' : ''}`}
                    onClick={() => onSelectMeydan(m)}
                  >
                    <div className="explorer-item-left">
                      <span className="explorer-district-dot" />
                      <span className="explorer-item-name">{m.name}</span>
                    </div>
                    <span className="explorer-item-count">{m.district}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="explorer-tree-wrap">
                {/* 1. Anadolu Yakası Accordion Section */}
                <div className="tree-yaka-group">
                  <button
                    type="button"
                    className="tree-yaka-header"
                    onClick={() => toggleAccordionYaka('anadolu')}
                  >
                    <div className="tree-header-left">
                      <GlobeAltIcon width={17} height={17} className="tree-yaka-icon" />
                      <strong className="tree-yaka-title">Anadolu Yakası</strong>
                    </div>
                    <div className="tree-header-right">
                      <span className="explorer-badge-count">{ANADOLU_TOTAL_COUNT}</span>
                      {expandedYakalar.anadolu ? (
                        <ChevronDownIcon width={15} height={15} className="tree-arrow" />
                      ) : (
                        <ChevronRightIcon width={15} height={15} className="tree-arrow" />
                      )}
                    </div>
                  </button>

                  {expandedYakalar.anadolu && (
                    <div className="tree-districts-list">
                      {ANADOLU_DISTRICTS.map((dist) => {
                        const isDistOpen = !!expandedDistricts[dist.id];
                        return (
                          <div key={dist.id} className="tree-district-item">
                            <button
                              type="button"
                              className={`tree-district-header ${isDistOpen ? 'is-open' : ''}`}
                              onClick={() => toggleAccordionDistrict(dist.id)}
                            >
                              <div className="tree-dist-left">
                                <span className="tree-dist-icon-wrap">
                                  {getDistrictIcon(dist.name)}
                                </span>
                                <span className="tree-dist-name">{dist.name}</span>
                              </div>
                              <div className="tree-dist-right">
                                <span className="tree-dist-count">{dist.count}</span>
                                {isDistOpen ? (
                                  <ChevronDownIcon width={13} height={13} className="tree-arrow" />
                                ) : (
                                  <ChevronRightIcon width={13} height={13} className="tree-arrow" />
                                )}
                              </div>
                            </button>

                            {isDistOpen && (
                              <div className="tree-squares-list">
                                {dist.meydanlar.map((m) => {
                                  const isSelected = selectedMeydan?.id === m.id;
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      className={`tree-square-link ${isSelected ? 'is-selected' : ''}`}
                                      onClick={() => onSelectMeydan(m)}
                                    >
                                      <div className="tree-square-left">
                                        <span className="tree-square-dot" />
                                        <span className="tree-square-name">{m.name}</span>
                                      </div>
                                      <ChevronRightIcon width={12} height={12} className="tree-square-arrow" />
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

                {/* 2. Avrupa Yakası Accordion Section */}
                <div className="tree-yaka-group">
                  <button
                    type="button"
                    className="tree-yaka-header"
                    onClick={() => toggleAccordionYaka('avrupa')}
                  >
                    <div className="tree-header-left">
                      <BuildingOffice2Icon width={17} height={17} className="tree-yaka-icon" />
                      <strong className="tree-yaka-title">Avrupa Yakası</strong>
                    </div>
                    <div className="tree-header-right">
                      <span className="explorer-badge-count">{AVRUPA_TOTAL_COUNT}</span>
                      {expandedYakalar.avrupa ? (
                        <ChevronDownIcon width={15} height={15} className="tree-arrow" />
                      ) : (
                        <ChevronRightIcon width={15} height={15} className="tree-arrow" />
                      )}
                    </div>
                  </button>

                  {expandedYakalar.avrupa && (
                    <div className="tree-districts-list">
                      {AVRUPA_DISTRICTS.map((dist) => {
                        const isDistOpen = !!expandedDistricts[dist.id];
                        return (
                          <div key={dist.id} className="tree-district-item">
                            <button
                              type="button"
                              className={`tree-district-header ${isDistOpen ? 'is-open' : ''}`}
                              onClick={() => toggleAccordionDistrict(dist.id)}
                            >
                              <div className="tree-dist-left">
                                <span className="tree-dist-icon-wrap">
                                  {getDistrictIcon(dist.name)}
                                </span>
                                <span className="tree-dist-name">{dist.name}</span>
                              </div>
                              <div className="tree-dist-right">
                                <span className="tree-dist-count">{dist.count}</span>
                                {isDistOpen ? (
                                  <ChevronDownIcon width={13} height={13} className="tree-arrow" />
                                ) : (
                                  <ChevronRightIcon width={13} height={13} className="tree-arrow" />
                                )}
                              </div>
                            </button>

                            {isDistOpen && (
                              <div className="tree-squares-list">
                                {dist.meydanlar.map((m) => {
                                  const isSelected = selectedMeydan?.id === m.id;
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      className={`tree-square-link ${isSelected ? 'is-selected' : ''}`}
                                      onClick={() => onSelectMeydan(m)}
                                    >
                                      <div className="tree-square-left">
                                        <span className="tree-square-dot" />
                                        <span className="tree-square-name">{m.name}</span>
                                      </div>
                                      <ChevronRightIcon width={12} height={12} className="tree-square-arrow" />
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
              </div>
            )}
          </div>

          {/* Decorative Bottom Silhouette and İBB Brand */}
          <div className="explorer-col__footer">
            <div
              className="explorer-footer-silhouette"
              style={{ backgroundImage: 'url(/assets/dashboard/bosphorus-bridge-sketch.svg)' }}
            />
            <div className="explorer-footer-brand">
              <img
                src="/assets/dashboard/ibb-official-logo.svg"
                alt="İBB"
                className="explorer-ibb-logo"
              />
              <div className="explorer-footer-text">
                <span className="explorer-ibb-title">İSTANBUL</span>
                <span className="explorer-ibb-sub">BÜYÜKŞEHİR BELEDİYESİ</span>
                <span className="explorer-ibb-slogan">Daha güçlü Daha yaşanabilir İstanbul</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
