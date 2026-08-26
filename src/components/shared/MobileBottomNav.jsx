import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('meydanlar');

  const isLoginPage = location.pathname === '/login';
  const isSplashPage = location.pathname === '/splash';

  // Do not render on login or splash
  if (isLoginPage || isSplashPage) {
    return null;
  }

  const pathname = location.pathname;
  const isHome = pathname === '/';

  const dispatchNavEvent = (sectionKey) => {
    window.dispatchEvent(
      new CustomEvent('syp:navigate-section', {
        detail: { sectionKey },
      })
    );

    // Direct scroll helper
    setTimeout(() => {
      let targetId = `section-${sectionKey}`;
      if (sectionKey === 'personel-listesi') {
        targetId = 'section-meydan-yonetimi-grup';
      }
      const el = document.getElementById(targetId);
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 65;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }, 150);
  };

  const triggerSectionNav = (sectionKey) => {
    setActiveTab(sectionKey);

    if (location.pathname !== '/meydan-yonetimi') {
      navigate('/meydan-yonetimi');
      setTimeout(() => {
        dispatchNavEvent(sectionKey);
      }, 200);
    } else {
      dispatchNavEvent(sectionKey);
    }
  };

  const handleHomeClick = () => {
    setActiveTab('home');
    navigate('/');
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobil Hızlı Menü">
      {/* 1. Ana Sayfa */}
      <button
        type="button"
        className={`mobile-bottom-nav__item ${isHome ? 'is-active' : ''}`}
        onClick={handleHomeClick}
        title="Modüller"
      >
        <span className="mobile-bottom-nav__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </span>
        <span className="mobile-bottom-nav__label">Ana Sayfa</span>
      </button>

      {/* 2. Meydanlar */}
      <button
        type="button"
        className={`mobile-bottom-nav__item ${!isHome && activeTab === 'active-meydanlar' ? 'is-active' : ''}`}
        onClick={() => triggerSectionNav('active-meydanlar')}
        title="Meydanlar"
      >
        <span className="mobile-bottom-nav__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span className="mobile-bottom-nav__label">Meydanlar</span>
      </button>

      {/* 3. Brifing */}
      <button
        type="button"
        className={`mobile-bottom-nav__item ${!isHome && activeTab === 'akilli-brifing' ? 'is-active' : ''}`}
        onClick={() => triggerSectionNav('akilli-brifing')}
        title="Akıllı Bülten"
      >
        <span className="mobile-bottom-nav__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </span>
        <span className="mobile-bottom-nav__label">Brifing</span>
      </button>

      {/* 4. Özet */}
      <button
        type="button"
        className={`mobile-bottom-nav__item ${!isHome && activeTab === 'yonetim-paneli' ? 'is-active' : ''}`}
        onClick={() => triggerSectionNav('yonetim-paneli')}
        title="Yönetim Özeti"
      >
        <span className="mobile-bottom-nav__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </span>
        <span className="mobile-bottom-nav__label">Özet</span>
      </button>

      {/* 5. Personel */}
      <button
        type="button"
        className={`mobile-bottom-nav__item ${!isHome && activeTab === 'personel-listesi' ? 'is-active' : ''}`}
        onClick={() => triggerSectionNav('personel-listesi')}
        title="Personel Listesi"
      >
        <span className="mobile-bottom-nav__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <span className="mobile-bottom-nav__label">Personel</span>
      </button>
    </nav>
  );
}
