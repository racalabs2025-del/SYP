import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-screen__glow splash-screen__glow--left" />
      <div className="splash-screen__glow splash-screen__glow--right" />
      <div className="splash-screen__orb" aria-hidden="true" />
      <div className="splash-screen__grid" aria-hidden="true" />

      <div className="splash-screen__content">
        <div className="splash-screen__badge">İstanbul Operasyon Ağı</div>
        <h1>Saha Yönetim Portalı</h1>
        <p>Meydan operasyonları, vardiya takibi ve saha koordinasyonu tek panelde.</p>

        <div className="splash-screen__meta" aria-hidden="true">
          <span>Gerçek Zamanlı Vardiya</span>
          <span>Kurumsal Mobil Deneyim</span>
          <span>İBB Saha Operasyonları</span>
        </div>

        <div className="splash-screen__bridge" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}