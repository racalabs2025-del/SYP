import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  ArrowLeftIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { formatLongDateTime } from './utils/date';

export default function Header({ onLogout = null }) {
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isLoginPage = location.pathname === '/login';
  const isSplashPage = location.pathname === '/splash';
  const isDashboardPage = location.pathname === '/' || location.pathname === '/meydan-yonetimi';
  const isDetailPage = location.pathname.startsWith('/meydan/') || location.pathname.startsWith('/personel/');
  const { dateLabel, timeLabel } = formatLongDateTime(now);

  return (
    <header className="app-header app-header--executive">
      {/* Background Bosphorus Silhouette */}
      <div
        className="app-header__bridge-bg"
        style={{ backgroundImage: 'url(/assets/dashboard/bosphorus-bridge-sketch.svg)' }}
        aria-hidden="true"
      />

      <div className="app-header__left">
        {/* On detail pages, show back button; on dashboard, show hamburger menu */}
        {!isLoginPage && !isSplashPage && !isDashboardPage ? (
          <>
            <button
              className="app-header__icon-button"
              type="button"
              onClick={() => navigate(-1)}
              title="Geri"
              aria-label="Geri Dön"
            >
              <ArrowLeftIcon width={18} height={18} />
            </button>
            <button
              className="app-header__icon-button"
              type="button"
              onClick={() => navigate('/')}
              title="Ana sayfa"
              aria-label="Ana Sayfaya Git"
            >
              <HomeIcon width={18} height={18} />
            </button>
          </>
        ) : (
          <button
            className="app-header__menu-btn"
            type="button"
            title="Menü"
            aria-label="Menü"
          >
            <Bars3Icon width={22} height={22} />
          </button>
        )}

        {/* SYP Corporate Logo Badge */}
        <div
          className="app-header__brand"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          title="Ana Sayfaya Git"
        >
          <div className="syp-header-badge">
            <span className="syp-header-badge__text">SYP</span>
          </div>
          <strong className="app-header__title">Saha Yönetim Paneli</strong>
        </div>
      </div>

      {!isSplashPage ? (
        <div className="app-header__right">
          <div className="app-header__datetime">
            <div className="app-header__datetime-row">
              <CalendarDaysIcon width={16} height={16} className="app-header__calendar-icon" />
              <span className="app-header__date">{dateLabel}</span>
            </div>
            <span className="app-header__clock">{timeLabel}</span>
          </div>

          {onLogout && !isLoginPage ? (
            <button
              className="app-header__logout app-header__logout--pill"
              type="button"
              onClick={onLogout}
              title="Çıkış Yap"
              aria-label="Güvenli Çıkış"
            >
              <span className="app-header__logout-text">Çıkış</span>
              <ArrowRightOnRectangleIcon className="app-header__logout-icon" width={16} height={16} />
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
