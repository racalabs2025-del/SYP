import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, HomeIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
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
  const isHomePage = location.pathname === '/';
  const isDetailPage = location.pathname.startsWith('/meydan/') || location.pathname.startsWith('/personel/');
  const { dateLabel, timeLabel } = formatLongDateTime(now);

  return (
    <header className="app-header">
      <div className="app-header__left">
        {!isLoginPage && !isSplashPage && !isHomePage ? (
          <button
            className="app-header__icon-button"
            type="button"
            onClick={() => navigate(isDetailPage ? '/meydan-yonetimi' : -1)}
            title="Geri"
            aria-label="Geri Dön"
          >
            <ArrowLeftIcon width={18} height={18} />
          </button>
        ) : null}

        {!isLoginPage && !isSplashPage && !isHomePage ? (
          <button
            className="app-header__icon-button"
            type="button"
            onClick={() => navigate('/')}
            title="Ana sayfa"
            aria-label="Ana Sayfaya Git"
          >
            <HomeIcon width={18} height={18} />
          </button>
        ) : null}

        <div className="app-header__brand">
          <strong className="app-header__title">Saha Yönetim Paneli</strong>
        </div>
      </div>

      {!isSplashPage ? (
        <div className="app-header__right">
          <div className="app-header__datetime">
            <span className="app-header__date">{dateLabel}</span>
            <span className="app-header__clock">{timeLabel}</span>
          </div>

          {onLogout && !isLoginPage ? (
            <button
              className="app-header__logout"
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
