import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPinIcon,
  UserGroupIcon,
  UserIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import {
  ALL_CANONICAL_MEYDANLAR,
  TOTAL_MEYDAN_COUNT,
  DOGRUDAN_YONETIM_COUNT,
  ORTAK_CALISMA_COUNT,
} from '../../data/canonicalMeydanData.js';

const GUNUN_ISTANBULU_CARDS = [
  {
    id: 'taksim-meydani',
    name: 'Taksim Meydanı',
    desc: 'Beyoğlu • Kültür ve Buluşma Odağı',
    img: '/assets/meydan_photos/image49.png',
  },
  {
    id: 'beyazit-meydani',
    name: 'Beyazıt Meydanı',
    desc: 'Fatih • Turizm Şb. Md. Ortak Çalışma',
    img: '/assets/meydan_photos/image41.png',
  },
  {
    id: 'kadikoy-bostanci-meydani',
    name: 'Kadıköy Bostancı Meydanı',
    desc: 'Kadıköy • 35.000m² Kamusal Yaşam',
    img: '/assets/meydan_photos/image138.jpg',
  },
  {
    id: 'sultanahmet-meydani',
    name: 'Sultanahmet Meydanı',
    desc: 'Fatih • Tarihi Yarımada Kalbi',
    img: '/assets/meydan_photos/image120.jpg',
  },
];

export default function DashboardHero({
  selectedMeydan,
  totalMeydanCount = 50,
  plannedPersonnelCount = 35,
  activePersonnelCount = 28,
  todayShifts = [],
  activeDateKey = '',
  onOpenPersonnel,
  onOpenStatOverlay,
  onSelectMeydan,
}) {
  const navigate = useNavigate();
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState(0);

  // When selected square changes, reset active thumbnail to 0
  useEffect(() => {
    setActiveThumbnailIndex(0);
  }, [selectedMeydan?.id]);

  // If no square is selected or selectedMeydan is 'tum-meydanlar', show General Overview (Ref Image 2)
  const isGeneralOverview = !selectedMeydan || selectedMeydan.id === 'tum-meydanlar';

  // Compute personnel assigned to selected meydan
  const activePersonnel = useMemo(() => {
    if (!selectedMeydan || isGeneralOverview) return [];

    if (todayShifts && todayShifts.length > 0) {
      const matched = todayShifts.filter((s) => {
        if (s.isLeave) return false;
        if (selectedMeydan.rawVariants && s.rawLocation && selectedMeydan.rawVariants.some(v => v.toLowerCase().trim() === s.rawLocation.toLowerCase().trim())) {
          return true;
        }
        if (s.rawLocation && (s.rawLocation.toLowerCase().includes(selectedMeydan.name.toLowerCase()) || selectedMeydan.name.toLowerCase().includes(s.rawLocation.toLowerCase()))) {
          return true;
        }
        if (selectedMeydan.personnel && s.personelAdi && selectedMeydan.personnel.some(p => p.toLowerCase().trim() === s.personelAdi.toLowerCase().trim())) {
          return true;
        }
        return false;
      });

      if (matched.length > 0) {
        return matched.map((s) => ({
          name: s.personelAdi,
          hours: s.saatAraligi || '10:00 - 18:30',
          type: s.vardiyaTipi || 'Tam Gün',
        }));
      }
    }

    if (selectedMeydan.personnel && selectedMeydan.personnel.length > 0) {
      return selectedMeydan.personnel.map((p) => ({
        name: p,
        hours: '10:00 - 18:30',
        type: 'Planlı Saha Görevi',
      }));
    }

    return [];
  }, [selectedMeydan, todayShifts, isGeneralOverview]);

  const landmarks = selectedMeydan?.landmarks || [
    { id: 'boga', name: 'Boğa Heykeli', img: '/assets/dashboard/kadikoy-boga.jpg' },
    { id: 'iskele', name: 'İskele', img: '/assets/dashboard/kadikoy-iskele.jpg' },
    { id: 'genel', name: 'Meydan Genel', img: '/login-scenes/cult/kiz-kulesi.jpg' },
    { id: 'sahil', name: 'Sahil Hattı', img: '/login-scenes/cult/ortakoy.jpg' },
  ];

  // Hero visuals: switches dynamically when thumbnail or arrows are clicked
  const activeLandmarkImg = landmarks[activeThumbnailIndex]?.img;
  const heroImage = isGeneralOverview
    ? '/assets/dashboard/taksim-square.jpg'
    : (activeLandmarkImg || selectedMeydan?.heroImage || '/assets/dashboard/kadikoy-boga.jpg');

  function handlePrev() {
    setActiveThumbnailIndex((prev) => (prev > 0 ? prev - 1 : landmarks.length - 1));
  }

  function handleNext() {
    setActiveThumbnailIndex((prev) => (prev < landmarks.length - 1 ? prev + 1 : 0));
  }

  return (
    <div className="dashboard-hero-container">
      {/* ─── MAIN HERO SHOWCASE CARD ─── */}
      <div className={`dashboard-hero-card ${isGeneralOverview ? 'dashboard-hero-card--overview' : 'dashboard-hero-card--detail'}`}>
        {/* Background Image with Cinematic View */}
        <div
          key={heroImage}
          className="dashboard-hero-card__bg"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="dashboard-hero-card__overlay" />
        </div>

        {/* Content Overlay */}
        <div className="dashboard-hero-card__content">
          {isGeneralOverview ? (
            /* ═══ GENERAL OVERVIEW HERO (REF IMAGE 2) ═══ */
            <>
              <div className="dashboard-hero-card__top dashboard-hero-card__top--overview">
                <div className="dashboard-hero-kicker-row">
                  <span className="hero-kicker-caps">İSTANBUL'UN KALBİ</span>
                  <div className="hero-kicker-line" />
                </div>
                <h1 className="dashboard-hero-title dashboard-hero-title--large">Meydanlara Genel Bakış</h1>
                <p className="dashboard-hero-lead">
                  95 Meydan • 88 Doğrudan Yönetim • 7 Ortak Çalışma Alanı
                </p>
              </div>

              {/* 3 Large Stat Cards Centered inside Hero (Ref Image 2) */}
              <div className="dashboard-hero-kpi-bar dashboard-hero-kpi-bar--overview">
                <div
                  className="hero-kpi-chip hero-kpi-chip--large"
                  onClick={() => onOpenStatOverlay && onOpenStatOverlay('meydanlar')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="hero-kpi-chip__icon hero-kpi-chip__icon--blue">
                    <MapPinIcon width={22} height={22} />
                  </div>
                  <div className="hero-kpi-chip__text">
                    <span className="hero-kpi-chip__label">Meydanlar</span>
                    <strong className="hero-kpi-chip__val">{totalMeydanCount}</strong>
                  </div>
                  <ChevronRightIcon width={16} height={16} className="hero-kpi-chip__arrow" />
                </div>

                <div
                  className="hero-kpi-chip hero-kpi-chip--large"
                  onClick={() => onOpenStatOverlay && onOpenStatOverlay('planli')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="hero-kpi-chip__icon hero-kpi-chip__icon--cyan">
                    <UserGroupIcon width={22} height={22} />
                  </div>
                  <div className="hero-kpi-chip__text">
                    <span className="hero-kpi-chip__label">Planlı Personel</span>
                    <strong className="hero-kpi-chip__val">{plannedPersonnelCount}</strong>
                  </div>
                  <ChevronRightIcon width={16} height={16} className="hero-kpi-chip__arrow" />
                </div>

                <div
                  className="hero-kpi-chip hero-kpi-chip--large"
                  onClick={() => onOpenStatOverlay && onOpenStatOverlay('aktif')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="hero-kpi-chip__icon hero-kpi-chip__icon--green">
                    <UserIcon width={22} height={22} />
                  </div>
                  <div className="hero-kpi-chip__text">
                    <span className="hero-kpi-chip__label">Sahada Şu An</span>
                    <strong className="hero-kpi-chip__val">{activePersonnelCount}</strong>
                  </div>
                  <ChevronRightIcon width={16} height={16} className="hero-kpi-chip__arrow" />
                </div>
              </div>

              {/* Bottom location pin and controls */}
              <div className="dashboard-hero-bottom-bar">
                <div className="hero-bottom-location">
                  <MapPinIcon width={15} height={15} />
                  <span>Taksim Meydanı, Beyoğlu</span>
                </div>

                <div className="landmarks-controls landmarks-controls--inline">
                  <div className="landmarks-dots">
                    <span className="landmarks-dot is-active" />
                    <span className="landmarks-dot" />
                    <span className="landmarks-dot" />
                    <span className="landmarks-dot" />
                  </div>
                  <div className="landmarks-nav-buttons">
                    <button type="button" className="landmarks-nav-btn" aria-label="Önceki">
                      <ChevronLeftIcon width={14} height={14} />
                    </button>
                    <button type="button" className="landmarks-nav-btn" aria-label="Sonraki">
                      <ChevronRightIcon width={14} height={14} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ═══ SPECIFIC MEYDAN HERO ═══ */
            <>
              <div className="dashboard-hero-card__header-row">
                <div className="dashboard-hero-title-group">
                  <div className="dashboard-hero-pin-badge">
                    <MapPinIcon width={24} height={24} />
                  </div>
                  <div>
                    <div className="hero-badge-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      {selectedMeydan?.kategori === 'ORTAK ÇALIŞMA' ? (
                        <span
                          className="hero-mgmt-chip"
                          style={{
                            background: 'rgba(234, 88, 12, 0.25)',
                            border: '1px solid rgba(251, 146, 60, 0.6)',
                            color: '#fed7aa',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                          title={selectedMeydan?.yonetimNotu}
                        >
                          🤝 Ortak Çalışma {selectedMeydan?.yonetimNotu ? `• ${selectedMeydan.yonetimNotu}` : ''}
                        </span>
                      ) : (
                        <span
                          className="hero-mgmt-chip"
                          style={{
                            background: 'rgba(16, 185, 129, 0.25)',
                            border: '1px solid rgba(52, 211, 153, 0.6)',
                            color: '#a7f3d0',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          🏛️ İBB Meydan Yönetimi (Doğrudan)
                        </span>
                      )}
                      {selectedMeydan?.alanM2 && (
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.12)',
                            color: '#e2e8f0',
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          📐 {selectedMeydan.alanM2}
                        </span>
                      )}
                      {selectedMeydan?.yapimYili && (
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.12)',
                            color: '#e2e8f0',
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          🏗️ {selectedMeydan.yapimYili}
                        </span>
                      )}
                    </div>
                    <h1 className="dashboard-hero-title">{selectedMeydan?.name || 'Meydan'}</h1>
                    <div className="dashboard-hero-location-row">
                      <MapPinIcon width={13} height={13} className="hero-subpin" />
                      <span className="dashboard-hero-location">{selectedMeydan?.subtitle || `${selectedMeydan?.district || ''}, İstanbul`}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Meydan Personeli + Meydan Detay Sayfası */}
              <div className="dashboard-hero-card__action-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-hero-action"
                  onClick={() => {
                    if (onOpenPersonnel) {
                      onOpenPersonnel(selectedMeydan);
                    } else if (selectedMeydan?.id) {
                      navigate(`/meydan/${selectedMeydan.id}`);
                    }
                  }}
                >
                  <UserGroupIcon width={17} height={17} />
                  <span>Meydan Personeli Detayı ({activePersonnel.length})</span>
                  <ChevronRightIcon width={15} height={15} />
                </button>

                <button
                  type="button"
                  className="btn-hero-action"
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => {
                    if (selectedMeydan?.id) {
                      navigate(`/meydan/${selectedMeydan.id}`);
                    }
                  }}
                >
                  <span>Meydan Detay Sayfası</span>
                  <ChevronRightIcon width={15} height={15} />
                </button>
              </div>

              {/* Prominent Active Field Personnel List Directly on Hero Card */}
              {activePersonnel.length > 0 && (
                <div className="dashboard-hero-roster-glass">
                  <div className="hero-roster-title-row">
                    <div className="hero-roster-title-left">
                      <div className="hero-roster-pulse-dot" />
                      <span className="hero-roster-heading">Sahada Görevli Personel</span>
                    </div>
                    <span className="hero-roster-count-badge">{activePersonnel.length} Görevli</span>
                  </div>
                  <div className="hero-roster-items">
                    {activePersonnel.map((person, idx) => (
                      <div key={idx} className="hero-roster-person-card">
                        <div className="hero-roster-avatar">{person.name.charAt(0)}</div>
                        <div className="hero-roster-person-meta">
                          <strong className="hero-roster-person-name">{person.name}</strong>
                          <span className="hero-roster-person-shift">{person.hours} • {person.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Center space */}
              <div className="dashboard-hero-center-spacer" />

              {/* Bottom 4 Preview Cards (Ref Image 1) */}
              <div className="dashboard-hero-detail-footer">
                <div className="landmarks-grid">
                  {landmarks.map((landmark, idx) => {
                    const isActive = idx === activeThumbnailIndex;
                    return (
                      <div
                        key={landmark.id}
                        className={`landmark-preview-card ${isActive ? 'is-active' : ''}`}
                        onClick={() => setActiveThumbnailIndex(idx)}
                      >
                        <div
                          className="landmark-preview-card__img"
                          style={{ backgroundImage: `url(${landmark.img})` }}
                        />
                        <div className="landmark-preview-card__caption">
                          <MapPinIcon width={11} height={11} className="landmark-caption-pin" />
                          <span className="landmark-name">{landmark.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Carousel Pagination & Arrows */}
                <div className="landmarks-controls">
                  <div className="landmarks-dots">
                    {landmarks.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`landmarks-dot ${idx === activeThumbnailIndex ? 'is-active' : ''}`}
                        onClick={() => setActiveThumbnailIndex(idx)}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <div className="landmarks-nav-buttons">
                    <button
                      type="button"
                      className="landmarks-nav-btn"
                      onClick={handlePrev}
                      title="Önceki"
                      aria-label="Önceki"
                    >
                      <ChevronLeftIcon width={15} height={15} />
                    </button>
                    <button
                      type="button"
                      className="landmarks-nav-btn"
                      onClick={handleNext}
                      title="Sonraki"
                      aria-label="Sonraki"
                    >
                      <ChevronRightIcon width={15} height={15} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── IF GENERAL OVERVIEW: GÜNÜN İSTANBUL'U 4-CARD SHOWCASE (REF IMAGE 2) ─── */}
      {isGeneralOverview && (
        <div className="dashboard-gunun-istanbuli">
          <div className="gunun-istanbuli-header">
            <div className="gunun-istanbuli-title-group">
              <ChartBarIcon width={18} height={18} className="gunun-istanbuli-icon" />
              <h3 className="gunun-istanbuli-title">Günün İstanbul'u</h3>
            </div>
            <button
              type="button"
              className="gunun-istanbuli-link"
              onClick={() => onSelectMeydan && onSelectMeydan({ id: 'kadikoy-meydani', name: 'Kadıköy Meydanı', district: 'Kadıköy' })}
            >
              <span>Tüm Meydanlar</span>
              <ChevronRightIcon width={14} height={14} />
            </button>
          </div>

          <div className="gunun-istanbuli-grid">
            {GUNUN_ISTANBULU_CARDS.map((card) => (
              <div
                key={card.id}
                className="gunun-card"
                onClick={() => {
                  const match = ALL_CANONICAL_MEYDANLAR.find((m) => m.id === card.id);
                  if (onSelectMeydan) onSelectMeydan(match || { id: card.id, name: card.name, district: card.name });
                }}
                role="button"
                tabIndex={0}
              >
                <div
                  className="gunun-card__img"
                  style={{ backgroundImage: `url(${card.img})` }}
                />
                <div className="gunun-card__content">
                  <strong className="gunun-card__title">{card.name}</strong>
                  <span className="gunun-card__desc">{card.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
