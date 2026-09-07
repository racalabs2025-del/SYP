import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import SypCircularLogo from '../components/shared/SypCircularLogo';
import { signInAnonymouslyUser, verifyPanelPassword } from '../auth';
import {
  ShieldCheckIcon,
  ClockIcon,
  CpuChipIcon,
  ArrowRightIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const LOGIN_SCENES = [
  {
    url: '/login-scenes/cult/galata.jpg',
    title: 'Galata Kulesi & Tarihi Yarımada',
    location: 'Beyoğlu',
  },
  {
    url: '/login-scenes/cult/kiz-kulesi.jpg',
    title: 'Kız Kulesi & Boğaziçi',
    location: 'Üsküdar',
  },
  {
    url: '/login-scenes/cult/ortakoy.jpg',
    title: 'Ortaköy Camii & 15 Temmuz Köprüsü',
    location: 'Beşiktaş',
  },
  {
    url: '/login-scenes/cult/istiklal-tram.jpg',
    title: 'İstiklal Caddesi Nostaljik Tramvay',
    location: 'Taksim',
  },
  {
    url: '/login-scenes/cult/tarihi-yarimada.jpg',
    title: 'Tarihi Yarımada & Ayasofya Silueti',
    location: 'Sarayburnu',
  },
];

export default function LoginScreen() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeScene, setActiveScene] = useState(0);
  const navigate = useNavigate();

  // Smooth crossfade slideshow timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % LOGIN_SCENES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  async function handleAnonymousLogin(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      verifyPanelPassword(passwordInput);
      await signInAnonymouslyUser();
      navigate('/', { replace: true });
    } catch (authError) {
      setError(authError.message || 'Giriş başarısız oldu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      {/* Animated Cult Istanbul Background Scenes */}
      <div className="login-screen__backdrop" aria-hidden="true">
        {LOGIN_SCENES.map((scene, index) => (
          <div
            key={scene.url}
            className={`login-screen__slide ${index === activeScene ? 'is-active' : 'is-inactive'}`}
            style={{
              backgroundImage: `url(${scene.url})`,
            }}
          />
        ))}
        <div className="login-screen__overlay" />
      </div>

      <div className="login-screen__grain" aria-hidden="true" />
      <Header />

      <main className="login-screen__main">
        <section className="login-screen__hero" aria-label="Operasyon Özeti">
          <h1>Tüm saha ekipleri tek ekranda.</h1>

          <div className="login-screen__chips">
            <span className="login-screen__chip">
              <span className="login-screen__chip-dot" /> Canlı Bilgiler
            </span>
            <span className="login-screen__chip">Haftalık Plan Görünümü</span>
            <span className="login-screen__chip">Operasyon Detayları</span>
          </div>

          <div className="login-screen__highlights">
            <div className="login-highlight-card">
              <div className="login-highlight-card__icon-wrap">
                <CpuChipIcon width={20} height={20} />
              </div>
              <div>
                <strong>Entegre</strong>
                <span>Sahadan merkeze tek görünüm</span>
              </div>
            </div>

            <div className="login-highlight-card">
              <div className="login-highlight-card__icon-wrap">
                <ClockIcon width={20} height={20} />
              </div>
              <div>
                <strong>7/24</strong>
                <span>Kesintisiz operasyon takibi</span>
              </div>
            </div>

            <div className="login-highlight-card">
              <div className="login-highlight-card__icon-wrap">
                <ShieldCheckIcon width={20} height={20} />
              </div>
              <div>
                <strong>Komuta</strong>
                <span>Tüm saha elinizde</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-card" aria-label="Giriş Formu">
          <div className="login-card__logo-wrapper">
            <SypCircularLogo size={102} variant="minimal" animated={loading} />
          </div>

          <div className="login-card__title-group">
            <h2>Panele Giriş Yap</h2>
            <p>Saha Yönetim Paneli yetkili erişimi.</p>
          </div>

          <form className="login-form" onSubmit={handleAnonymousLogin}>
            <label htmlFor="panel-password-input" className="sr-only">Panel parolası</label>
            <div className="login-form__input-wrap">
              <LockClosedIcon className="login-form__input-icon" width={18} height={18} />
              <input
                id="panel-password-input"
                type="password"
                className="login-form__input"
                placeholder="Panel parolası"
                autoComplete="current-password"
                value={passwordInput}
                onChange={(event) => {
                  setPasswordInput(event.target.value);
                  if (error) {
                    setError('');
                  }
                }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block login-form__submit-btn" disabled={loading}>
              <span>{loading ? 'Bağlanıyor...' : 'Panele Giriş Yap'}</span>
              <ArrowRightIcon className="login-form__btn-arrow" width={18} height={18} />
            </button>

            {error ? <div className="message message-error">{error}</div> : null}
          </form>
        </section>
      </main>

      {/* Cultural scene caption & indicator */}
      <div className="login-screen__scene-info">
        <div className="login-screen__scene-text">
          <span className="login-screen__scene-badge">İstanbul</span>
          <span className="login-screen__scene-title">{LOGIN_SCENES[activeScene].title}</span>
        </div>
        <div className="login-screen__dots">
          {LOGIN_SCENES.map((scene, index) => (
            <button
              key={scene.url}
              type="button"
              className={`login-screen__dot ${index === activeScene ? 'is-active' : ''}`}
              onClick={() => setActiveScene(index)}
              title={scene.title}
              aria-label={scene.title}
            />
          ))}
        </div>
      </div>
    </div>
  );
}