import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SypCircularLogo from '../components/shared/SypCircularLogo';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth fast progress fill animation
    const startTime = Date.now();
    const duration = 1400;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 150);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-screen__glow splash-screen__glow--left" />
      <div className="splash-screen__glow splash-screen__glow--right" />
      <div className="splash-screen__orb" aria-hidden="true" />
      <div className="splash-screen__grid" aria-hidden="true" />

      <div className="splash-screen__content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {/* Animated Circular SYP Logo */}
        <div style={{ marginBottom: '1.25rem' }}>
          <SypCircularLogo size={110} animated={true} progress={progress} />
        </div>

        <div className="splash-screen__badge">İstanbul Büyükşehir Belediyesi</div>
        <h1 style={{ margin: '0.35rem 0' }}>Saha Yönetim Paneli</h1>
        <p style={{ margin: '0 0 1rem 0', maxWidth: '380px', fontSize: '0.9rem', color: '#94a3b8' }}>
          Meydan operasyonları, vardiya takibi ve saha koordinasyonu tek panelde.
        </p>

        {/* Progress Bar & Percentage */}
        <div style={{ width: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <div
            style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                borderRadius: '999px',
                transition: 'width 0.05s linear',
              }}
            />
          </div>
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
            {progress}% Yükleniyor
          </span>
        </div>
      </div>
    </div>
  );
}