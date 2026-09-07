import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import {
  MapPinIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const SCENES = [
  '/login-scenes/cult/galata.jpg',
  '/login-scenes/cult/kiz-kulesi.jpg',
  '/login-scenes/cult/ortakoy.jpg',
  '/login-scenes/cult/istiklal-tram.jpg',
  '/login-scenes/cult/tarihi-yarimada.jpg',
];

export default function ModuleScreen({ onLogout }) {
  const navigate = useNavigate();
  const [pressedModuleId, setPressedModuleId] = useState('');
  const [activeScene, setActiveScene] = useState(0);
  const navigateTimerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % SCENES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (navigateTimerRef.current) {
      window.clearTimeout(navigateTimerRef.current);
    }
  }, []);

  function handleNavigate(path, id) {
    if (navigateTimerRef.current) {
      window.clearTimeout(navigateTimerRef.current);
    }

    setPressedModuleId(id);
    navigateTimerRef.current = window.setTimeout(() => {
      navigate(path);
    }, 120);
  }

  return (
    <div className="module-screen">
      <div className="module-screen__backdrop" aria-hidden="true">
        {SCENES.map((scene, index) => (
          <div
            key={scene}
            className={`module-screen__slide ${index === activeScene ? 'is-active' : 'is-inactive'}`}
            style={{
              backgroundImage: `url(${scene})`,
            }}
          />
        ))}
      </div>

      <Header onLogout={onLogout} />

      <main className="module-screen__main">
        <div className="module-screen__intro">
          <h1 className="module-screen__title">Saha Yönetim Paneli</h1>
        </div>

        <div className="module-screen__grid">
          {/* Ana Modül: Meydan Yönetimi */}
          <button
            type="button"
            className={`module-card module-card--hero${pressedModuleId === 'meydan-yonetimi' ? ' is-pressed' : ''}`}
            onClick={() => handleNavigate('/meydan-yonetimi', 'meydan-yonetimi')}
          >
            <div className="module-card__main-content">
              <div className="module-card__icon-wrap">
                <MapPinIcon className="module-card__icon" />
              </div>
              <div className="module-card__body">
                <strong className="module-card__title">Meydan Yönetimi</strong>
                <p className="module-card__desc">
                  Meydan bazlı canlı takip, günlük ve haftalık vardiya planları
                </p>
              </div>
              <div className="module-card__arrow">
                <ArrowRightIcon className="module-card__arrow-icon" />
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
