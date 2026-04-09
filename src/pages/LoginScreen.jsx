import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import { signInAnonymouslyUser } from '../auth';

const LOGIN_SCENES = [
  '/login-scenes/optimized/istanbul-1.avif',
  '/login-scenes/optimized/istanbul-3.avif',
  '/login-scenes/optimized/istanbul-5.avif',
  '/login-scenes/optimized/istanbul-2.avif',
  '/login-scenes/optimized/istanbul-4.avif',
];

export default function LoginScreen() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleAnonymousLogin(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
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
      <div className="login-screen__backdrop" aria-hidden="true">
        {LOGIN_SCENES.map((scene, index) => (
          <span
            key={scene}
            className="login-screen__slide"
            style={{
              backgroundImage: `url(${scene})`,
              animationDelay: `${index * 6}s`,
            }}
          />
        ))}
      </div>

      <div className="login-screen__grain" aria-hidden="true" />
      <Header />

      <main className="login-screen__main">
        <section className="login-screen__hero" aria-hidden="true">
          <h1>İstanbul'ın meydanları tek ekranda.</h1>
          <p>Günlük operasyon görünürlüğü.</p>

          <div className="login-screen__chips">
            <span className="login-screen__chip">Canlı Bilgiler</span>
            <span className="login-screen__chip">Haftalık Plan Görünümü</span>
            <span className="login-screen__chip">Operasyon Detayları</span>
          </div>

          <div className="login-screen__highlights">
            <div>
              <strong>Entegre</strong>
              <span>Sahadan merkeze tek görünüm</span>
            </div>
            <div>
              <strong>7/24</strong>
              <span>Kesintisiz operasyon takibi</span>
            </div>
            <div>
              <strong>Komuta</strong>
              <span>Tüm saha elinizde</span>
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card__title-group">
            <h2>Panele Giriş Yap</h2>
            <p>Yetkili giriş için devam edin.</p>
          </div>

          <form className="login-form" onSubmit={handleAnonymousLogin}>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Bağlanıyor...' : 'Panele Giriş Yap'}
            </button>

            {error ? <div className="message message-error">{error}</div> : null}
          </form>
        </section>
      </main>
    </div>
  );
}