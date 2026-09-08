import React, { useState } from 'react';
import {
  MapPinIcon,
  UserGroupIcon,
  UserIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const GUNUN_ISTANBULU_CARDS = [
  {
    id: 'sultanahmet-meydani',
    name: 'Sultanahmet',
    desc: 'Tarihin buluşma noktası',
    img: '/login-scenes/cult/tarihi-yarimada.jpg',
  },
  {
    id: 'kadikoy-meydani',
    name: 'Kadıköy',
    desc: 'Yaşamın enerjisi',
    img: '/assets/dashboard/kadikoy-boga.jpg',
  },
  {
    id: 'taksim-meydani',
    name: 'Taksim',
    desc: 'Her zaman canlı',
    img: '/assets/dashboard/taksim-square.jpg',
  },
  {
    id: 'eminonu-meydani',
    name: 'Eminönü',
    desc: "İstanbul'un kapısı",
    img: '/assets/dashboard/kadikoy-iskele.jpg',
  },
];

export default function DashboardHero({
  selectedMeydan,
  totalMeydanCount = 95,
  plannedPersonnelCount = 48,
  activePersonnelCount = 42,
  onOpenPersonnel,
  onOpenStatOverlay,
  onSelectMeydan,
}) {
  const navigate = useNavigate();
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState(0);

  // If no square is selected or selectedMeydan is 'tum-meydanlar', show General Overview (Ref Image 2)
  const isGeneralOverview = !selectedMeydan || selectedMeydan.id === 'tum-meydanlar';

  // Hero visuals
  const heroImage = isGeneralOverview
    ? '/assets/dashboard/taksim-square.jpg'
    : (selectedMeydan?.heroImage || '/assets/dashboard/kadikoy-boga.jpg');

  const landmarks = selectedMeydan?.landmarks || [
    { id: 'iskele', name: 'İskele', img: '/assets/dashboard/kadikoy-iskele.jpg' },
    { id: 'boga', name: 'Boğa Heykeli', img: '/assets/dashboard/kadikoy-boga.jpg' },
    { id: 'genel', name: 'Meydan Genel', img: '/login-scenes/cult/kiz-kulesi.jpg' },
    { id: 'sahil', name: 'Sahil Hattı', img: '/login-scenes/cult/ortakoy.jpg' },
  ];

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
                  Daha düzenli, daha güvenli, daha yaşanabilir meydanlar için.
                </p>
              </div>

              <div className="dashboard-hero-decorative-slogan dashboard-hero-decorative-slogan--overview">
                <span>İstanbul Hepimizin</span>
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
            /* ═══ SPECIFIC MEYDAN HERO (REF IMAGE 1 - KADIKÖY MEYDANI) ═══ */
            <>
              <div className="dashboard-hero-card__header-row">
                <div className="dashboard-hero-title-group">
                  <div className="dashboard-hero-pin-badge">
                    <MapPinIcon width={24} height={24} />
                  </div>
                  <div>
                    <h1 className="dashboard-hero-title">{selectedMeydan?.name || 'Kadıköy Meydanı'}</h1>
                    <div className="dashboard-hero-location-row">
                      <MapPinIcon width={13} height={13} className="hero-subpin" />
                      <span className="dashboard-hero-location">{selectedMeydan?.subtitle || `${selectedMeydan?.district || 'Kadıköy'}, İstanbul`}</span>
                    </div>
                  </div>
                </div>

                {/* Decorative Slogan */}
                <div className="dashboard-hero-decorative-slogan">
                  <span>İstanbul Hepimizin</span>
                </div>
              </div>

              {/* Action Button: Meydan Personeli */}
              <div className="dashboard-hero-card__action-row">
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
                  <span>Meydan Personeli</span>
                  <ChevronRightIcon width={15} height={15} />
                </button>
              </div>

              {/* Center space is open and highlights the statue / city life! */}
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
                onClick={() => onSelectMeydan && onSelectMeydan({ id: card.id, name: `${card.name} Meydanı`, district: card.name })}
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
