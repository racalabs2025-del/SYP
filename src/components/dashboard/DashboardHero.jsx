import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

  // Strictly 2 real photo landmarks per square
  const landmarks = useMemo(() => {
    if (selectedMeydan?.landmarks && selectedMeydan.landmarks.length > 0) {
      return selectedMeydan.landmarks.slice(0, 2);
    }
    if (selectedMeydan?.images && selectedMeydan.images.length > 0) {
      return selectedMeydan.images.slice(0, 2).map((img, i) => ({
        id: `photo-${i + 1}`,
        name: `${selectedMeydan.name} Görsel ${i + 1}`,
        img,
      }));
    }
    const defaultImg = selectedMeydan?.heroImage || '/assets/dashboard/kadikoy-boga.jpg';
    return [
      { id: 'photo-1', name: `${selectedMeydan?.name || 'Meydan'} Görsel 1`, img: defaultImg },
      { id: 'photo-2', name: `${selectedMeydan?.name || 'Meydan'} Görsel 2`, img: defaultImg },
    ];
  }, [selectedMeydan]);

  // Current Meydan index in 95 Canonical List
  const currentMeydanIndex = useMemo(() => {
    if (!selectedMeydan?.id) return 0;
    const idx = ALL_CANONICAL_MEYDANLAR.findIndex((m) => m.id === selectedMeydan.id);
    return idx >= 0 ? idx : 0;
  }, [selectedMeydan?.id]);

  const handlePrevMeydan = useCallback(() => {
    const prevIdx = (currentMeydanIndex - 1 + ALL_CANONICAL_MEYDANLAR.length) % ALL_CANONICAL_MEYDANLAR.length;
    const target = ALL_CANONICAL_MEYDANLAR[prevIdx];
    if (onSelectMeydan) {
      onSelectMeydan(target);
    }
  }, [currentMeydanIndex, onSelectMeydan]);

  const handleNextMeydan = useCallback(() => {
    const nextIdx = (currentMeydanIndex + 1) % ALL_CANONICAL_MEYDANLAR.length;
    const target = ALL_CANONICAL_MEYDANLAR[nextIdx];
    if (onSelectMeydan) {
      onSelectMeydan(target);
    }
  }, [currentMeydanIndex, onSelectMeydan]);

  // Keyboard navigation for meydan slider
  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMeydan();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextMeydan();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevMeydan, handleNextMeydan]);

  // Hero visuals: switches dynamically when thumbnail or arrows are clicked
  const activeLandmarkImg = landmarks[activeThumbnailIndex]?.img;
  const heroImage = isGeneralOverview
    ? '/assets/dashboard/taksim-square.jpg'
    : (activeLandmarkImg || selectedMeydan?.heroImage || '/assets/dashboard/kadikoy-boga.jpg');

  return (
    <div className="dashboard-hero-container">
      {isGeneralOverview ? (
        /* ═══ GENERAL OVERVIEW HERO (REF IMAGE 2) ═══ */
        <div className="dashboard-hero-card dashboard-hero-card--overview">
          {/* Background Image with Cinematic View */}
          <div
            key={heroImage}
            className="dashboard-hero-card__bg"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="dashboard-hero-card__overlay" />
          </div>

          <div className="dashboard-hero-card__content">
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
          </div>
        </div>
      ) : (
        /* ═══ SPECIFIC MEYDAN HERO ═══ */
        <>
          {/* 1. ÜST: GÖRSEL KARTI (Tamamen Ferah, Sinematik, Alttaki Katmanlardan Arındırılmış) */}
          <div className="dashboard-hero-card dashboard-hero-card--detail">
            {/* Background Image with Cinematic View */}
            <div
              key={heroImage}
              className="dashboard-hero-card__bg"
              style={{ backgroundImage: `url(${heroImage})` }}
            >
              <div className="dashboard-hero-card__overlay" />
            </div>

            {/* Floating Sleek Meydan Navigation Arrows on Left and Right of Card */}
            <button
              type="button"
              className="hero-side-nav-btn hero-side-nav-btn--prev"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevMeydan();
              }}
              title="Önceki Meydan (Sol Ok)"
              aria-label="Önceki Meydan"
            >
              <ChevronLeftIcon width={22} height={22} />
            </button>

            <button
              type="button"
              className="hero-side-nav-btn hero-side-nav-btn--next"
              onClick={(e) => {
                e.stopPropagation();
                handleNextMeydan();
              }}
              title="Sonraki Meydan (Sağ Ok)"
              aria-label="Sonraki Meydan"
            >
              <ChevronRightIcon width={22} height={22} />
            </button>

            {/* Header Row (Başlık & Personel) */}
            <div className="dashboard-hero-card__content">
              <div className="dashboard-hero-card__header-row">
                <div
                  className="dashboard-hero-title-group dashboard-hero-title-group--clickable"
                  onClick={() => {
                    if (selectedMeydan?.id) {
                      navigate(`/meydan/${selectedMeydan.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (selectedMeydan?.id) navigate(`/meydan/${selectedMeydan.id}`);
                    }
                  }}
                  title={`${selectedMeydan?.name || 'Meydan'} detay sayfasına git`}
                >
                  <div className="dashboard-hero-pin-badge">
                    <MapPinIcon width={24} height={24} />
                  </div>
                  <div>
                    {(selectedMeydan?.alanM2 || selectedMeydan?.yapimYili) && (
                      <div className="hero-badge-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        {selectedMeydan?.alanM2 && (
                          <span
                            style={{
                              background: 'rgba(255, 255, 255, 0.14)',
                              color: '#e2e8f0',
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backdropFilter: 'blur(6px)',
                            }}
                          >
                            📐 {selectedMeydan.alanM2}
                          </span>
                        )}
                        {selectedMeydan?.yapimYili && (
                          <span
                            style={{
                              background: 'rgba(255, 255, 255, 0.14)',
                              color: '#e2e8f0',
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backdropFilter: 'blur(6px)',
                            }}
                          >
                            🏗️ {selectedMeydan.yapimYili}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="dashboard-hero-title-wrap">
                      <h1 className="dashboard-hero-title dashboard-hero-title--clickable">
                        {selectedMeydan?.name || 'Meydan'}
                      </h1>
                      <ChevronRightIcon width={18} height={18} className="hero-title-arrow" />
                    </div>
                    <div className="dashboard-hero-location-row">
                      <MapPinIcon width={13} height={13} className="hero-subpin" />
                      <span className="dashboard-hero-location">{selectedMeydan?.subtitle || `${selectedMeydan?.district || ''}, İstanbul`}</span>
                    </div>
                  </div>
                </div>

                {/* Sağ Üst: Sahada Görevli Personel */}
                {activePersonnel.length > 0 ? (
                  <div className="hero-top-roster">
                    <div className="hero-top-roster__badge">
                      <span className="hero-top-roster__pulse-dot" />
                      <span className="hero-top-roster__label">Sahada Görevli ({activePersonnel.length})</span>
                    </div>
                    <div className="hero-top-roster__list">
                      {activePersonnel.map((person, idx) => (
                        <div
                          key={idx}
                          className="hero-top-roster__person"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/personel/${encodeURIComponent(person.name)}`);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/personel/${encodeURIComponent(person.name)}`);
                            }
                          }}
                          title={`${person.name} detay sayfasına git`}
                        >
                          <div className="hero-top-roster__avatar">{person.name.charAt(0)}</div>
                          <div className="hero-top-roster__meta">
                            <strong className="hero-top-roster__name">{person.name}</strong>
                            <span className="hero-top-roster__hours">{person.hours} • {person.type}</span>
                          </div>
                          <ChevronRightIcon width={14} height={14} className="hero-top-roster__arrow" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="hero-top-roster hero-top-roster--empty">
                    <div className="hero-top-roster__badge hero-top-roster__badge--muted">
                      <span className="hero-top-roster__label">Personel planlanıyor</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. ALT: GÖRSEL DIŞINDAKİ BİLGİ & BUTONLAR ALANI (Subpanel) */}
          <div className="dashboard-hero-subpanel">
            {/* Görselin altındaki bilgilendirme yazısı ve fonksiyonlar */}
            {(selectedMeydan?.aciklama || (selectedMeydan?.fonksiyonlar && selectedMeydan.fonksiyonlar.length > 0)) && (
              <div className="dashboard-hero-bottom-info">
                {selectedMeydan?.aciklama && (
                  <p className="hero-bottom-info__text">
                    {selectedMeydan.aciklama}
                  </p>
                )}
                {selectedMeydan?.fonksiyonlar && selectedMeydan.fonksiyonlar.length > 0 && (
                  <div className="hero-bottom-info__tags">
                    {selectedMeydan.fonksiyonlar.map((f, idx) => (
                      <span key={idx} className="hero-bottom-info__tag">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Butonlar: Görsel 1 / Görsel 2 Butonları ve Meydan Kontrolleri */}
            <div className="dashboard-hero-subpanel__actions-row">
              <div className="landmarks-grid landmarks-grid--two">
                {landmarks.slice(0, 2).map((landmark, idx) => {
                  const isActive = idx === activeThumbnailIndex;
                  return (
                    <button
                      key={landmark.id}
                      type="button"
                      className={`landmark-preview-card ${isActive ? 'is-active' : ''}`}
                      onClick={() => setActiveThumbnailIndex(idx)}
                      title={idx === 0 ? 'Görsel 1 (Genel Görünüm)' : 'Görsel 2 (Meydan Alanı)'}
                    >
                      <div
                        className="landmark-preview-card__img"
                        style={{ backgroundImage: `url(${landmark.img})` }}
                      />
                      <div className="landmark-preview-card__caption">
                        <MapPinIcon width={11} height={11} className="landmark-caption-pin" />
                        <span className="landmark-name">
                          {idx === 0 ? 'Görsel 1 (Genel Görünüm)' : 'Görsel 2 (Meydan Alanı)'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Carousel Pagination & Arrows */}
              <div className="landmarks-controls">
                <button
                  type="button"
                  className="btn-meydan-cycle btn-meydan-cycle--prev"
                  onClick={handlePrevMeydan}
                  title="Önceki Meydan (Sol Ok)"
                >
                  <ChevronLeftIcon width={14} height={14} />
                  <span>Önceki Meydan</span>
                </button>

                <div className="hero-slider-center-info">
                  <span className="hero-slider-meydan-counter">
                    {currentMeydanIndex + 1} / {ALL_CANONICAL_MEYDANLAR.length}
                  </span>
                  <div className="landmarks-dots">
                    {landmarks.slice(0, 2).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`landmarks-dot ${idx === activeThumbnailIndex ? 'is-active' : ''}`}
                        onClick={() => setActiveThumbnailIndex(idx)}
                        aria-label={`Görsel ${idx + 1}`}
                        title={`Görsel ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-meydan-cycle btn-meydan-cycle--next"
                  onClick={handleNextMeydan}
                  title="Sonraki Meydan (Sağ Ok)"
                >
                  <span>Sonraki Meydan</span>
                  <ChevronRightIcon width={14} height={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
