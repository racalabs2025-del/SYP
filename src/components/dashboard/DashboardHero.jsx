import React, { useState } from 'react';
import {
  MapPinIcon,
  UserGroupIcon,
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

  // If no square is selected or selectedMeydan is 'tum-meydanlar', show General Overview
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
        {/* Background Image with Cinematic Grading & Crossfade */}
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
            /* GENERAL OVERVIEW HEAD (REF IMAGE 2) */
            <div className="dashboard-hero-card__top dashboard-hero-card__top--overview">
              <span className="hero-kicker-caps">İSTANBUL'UN KALBİ</span>
              <h1 className="dashboard-hero-title dashboard-hero-title--large">Meydanlara Genel Bakış</h1>
              <p className="dashboard-hero-lead">
                Daha düzenli, daha güvenli, daha yaşanabilir meydanlar için.
              </p>
            </div>
          ) : (
            /* SELECTED SQUARE HEAD (REF IMAGE 1) */
            <>
              <div className="dashboard-hero-card__top">
                <div className="dashboard-hero-title-group">
                  <div className="dashboard-hero-pin-badge">
                    <MapPinIcon width={22} height={22} />
                  </div>
                  <div>
                    <h1 className="dashboard-hero-title">{selectedMeydan?.name || 'Kadıköy Meydanı'}</h1>
                    <p className="dashboard-hero-location">{selectedMeydan?.subtitle || `${selectedMeydan?.district || 'Kadıköy'}, İstanbul`}</p>
                  </div>
                </div>

                {/* Decorative Slogan */}
                <div className="dashboard-hero-decorative-slogan">
                  <span>İstanbul Hepimizin</span>
                </div>
              </div>

              {/* Action Button: Meydan Personeli */}
              <div className="dashboard-hero-card__action">
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
                  <UserGroupIcon width={18} height={18} />
                  <span>Meydan Personeli</span>
                  <ChevronRightIcon width={16} height={16} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* ─── INTEGRATED 3 STAT CHIPS / CARDS (INSIDE HERO) ─── */}
        <div className="dashboard-hero-kpi-bar">
          <div
            className="hero-kpi-chip"
            onClick={() => onOpenStatOverlay && onOpenStatOverlay('meydanlar')}
            role="button"
            tabIndex={0}
          >
            <div className="hero-kpi-chip__icon hero-kpi-chip__icon--blue">
              <MapPinIcon width={18} height={18} />
            </div>
            <div className="hero-kpi-chip__text">
              <span className="hero-kpi-chip__label">Meydanlar</span>
              <strong className="hero-kpi-chip__val">{totalMeydanCount}</strong>
            </div>
            <ChevronRightIcon width={14} height={14} className="hero-kpi-chip__arrow" />
          </div>

          <div
            className="hero-kpi-chip"
            onClick={() => onOpenStatOverlay && onOpenStatOverlay('planli')}
            role="button"
            tabIndex={0}
          >
            <div className="hero-kpi-chip__icon hero-kpi-chip__icon--cyan">
              <UserGroupIcon width={18} height={18} />
            </div>
            <div className="hero-kpi-chip__text">
              <span className="hero-kpi-chip__label">Planlı Personel</span>
              <strong className="hero-kpi-chip__val">{plannedPersonnelCount}</strong>
            </div>
            <ChevronRightIcon width={14} height={14} className="hero-kpi-chip__arrow" />
          </div>

          <div
            className="hero-kpi-chip"
            onClick={() => onOpenStatOverlay && onOpenStatOverlay('aktif')}
            role="button"
            tabIndex={0}
          >
            <div className="hero-kpi-chip__icon hero-kpi-chip__icon--green">
              <span className="hero-kpi-chip__dot" />
            </div>
            <div className="hero-kpi-chip__text">
              <span className="hero-kpi-chip__label">Sahada Şu An</span>
              <strong className="hero-kpi-chip__val">{activePersonnelCount}</strong>
            </div>
            <ChevronRightIcon width={14} height={14} className="hero-kpi-chip__arrow" />
          </div>
        </div>
      </div>

      {/* ─── BOTTOM AREA: LANDMARK CAROUSEL (IMAGE 1) OR GÜNÜN İSTANBUL'U (IMAGE 2) ─── */}
      {isGeneralOverview ? (
        /* GÜNÜN İSTANBUL'U 4-CARD SHOWCASE (REF IMAGE 2) */
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
      ) : (
        /* SELECTED MEYDAN LANDMARK PREVIEWS (REF IMAGE 1) */
        <div className="dashboard-hero-landmarks">
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
                    <span className="landmark-pin-dot" />
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
                <ChevronLeftIcon width={16} height={16} />
              </button>
              <button
                type="button"
                className="landmarks-nav-btn"
                onClick={handleNext}
                title="Sonraki"
                aria-label="Sonraki"
              >
                <ChevronRightIcon width={16} height={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
