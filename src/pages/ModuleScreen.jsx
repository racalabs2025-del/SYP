import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';

const LOGIN_SCENES = [
  '/login-scenes/optimized/istanbul-1.webp',
  '/login-scenes/optimized/istanbul-3.webp',
  '/login-scenes/optimized/istanbul-5.webp',
  '/login-scenes/optimized/istanbul-2.webp',
  '/login-scenes/optimized/istanbul-4.webp',
];

const MODULES = [
  {
    id: 'meydan-yonetimi',
    path: '/meydan-yonetimi',
    baslik: 'Meydan Yönetimi',
    aciklama: 'Meydan takibi, vardiya planları ve kronik sorun yönetimi',
    kicker: 'Birim',
  },
];

export default function ModuleScreen({ onLogout }) {
  const navigate = useNavigate();
  const [pressedModuleId, setPressedModuleId] = useState('');
  const navigateTimerRef = useRef(null);

  useEffect(() => () => {
    if (navigateTimerRef.current) {
      window.clearTimeout(navigateTimerRef.current);
    }
  }, []);

  function handleModulePress(module) {
    if (navigateTimerRef.current) {
      window.clearTimeout(navigateTimerRef.current);
    }

    setPressedModuleId(module.id);
    navigateTimerRef.current = window.setTimeout(() => {
      navigate(module.path);
    }, 120);
  }

  return (
    <div className="module-screen">
      <div className="module-screen__backdrop" aria-hidden="true">
        {LOGIN_SCENES.map((scene, index) => (
          <span
            key={scene}
            className="module-screen__slide"
            style={{
              backgroundImage: `url(${scene})`,
              animationDelay: `${index * 6}s`,
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
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              type="button"
              className={`module-card${pressedModuleId === mod.id ? ' is-pressed' : ''}`}
              onClick={() => handleModulePress(mod)}
            >
              <strong className="module-card__title">{mod.baslik}</strong>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
