import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import './App.css';
import './MeydanCard.css';
import './MeydanGrid.css';
import { signOutAdmin } from './auth';
import { auth } from './firebaseAuth';

function safeLazy(importFn) {
  return lazy(async () => {
    try {
      const module = await importFn();
      sessionStorage.removeItem('syp_chunk_reload_attempt');
      return module;
    } catch (error) {
      console.error('Lazy chunk load failed:', error);
      const chunkReloadKey = 'syp_chunk_reload_attempt';
      const hasReloaded = sessionStorage.getItem(chunkReloadKey);
      if (!hasReloaded) {
        sessionStorage.setItem(chunkReloadKey, 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}

const Dashboard = safeLazy(() => import('./pages/Dashboard'));
const LoginScreen = safeLazy(() => import('./pages/LoginScreen'));
const MeydanDetail = safeLazy(() => import('./pages/MeydanDetail'));
const MeydanNoteRead = safeLazy(() => import('./pages/MeydanNoteRead'));
const ModuleScreen = safeLazy(() => import('./pages/ModuleScreen'));
const PersonelDetail = safeLazy(() => import('./pages/PersonelDetail'));
const SplashScreen = safeLazy(() => import('./pages/SplashScreen'));

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Sistem Hatası Yakalandı:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem', background: '#1e293b', color: '#f8fafc', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1rem', color: '#f43f5e' }}>Arayüz Yükleme Hatası</h2>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginBottom: '1.5rem', wordBreak: 'break-word', lineHeight: '1.5' }}>
              {this.state.error?.message || 'Uygulama çalıştırılırken beklenmeyen bir hata meydana geldi.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', cursor: 'pointer' }}
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteLoading() {
  return <div className="page"><div className="message message-loading">Sayfa yükleniyor...</div></div>;
}

function NavigationGuard({ authenticated }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function handlePopState() {
      if (!authenticated && location.pathname !== '/login' && location.pathname !== '/splash') {
        navigate('/login', { replace: true });
      }
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [authenticated, location.pathname, navigate]);

  return null;
}

function ProtectedRoute({ authenticated, authReady, children }) {
  if (!authReady) {
    return <div className="page"><div className="message message-loading">Oturum kontrol ediliyor...</div></div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ authenticated, authReady, children }) {
  if (!authReady) {
    return <div className="page"><div className="message message-loading">Oturum kontrol ediliyor...</div></div>;
  }

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(Boolean(user));
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    await signOutAdmin();
  }

  return (
    <ErrorBoundary>
      <NavigationGuard authenticated={authenticated} />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute authenticated={authenticated} authReady={authReady}>
                <ModuleScreen onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meydan-yonetimi"
            element={
              <ProtectedRoute authenticated={authenticated} authReady={authReady}>
                <Dashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/splash"
            element={
              <PublicRoute authenticated={authenticated} authReady={authReady}>
                <SplashScreen />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute authenticated={authenticated} authReady={authReady}>
                <LoginScreen />
              </PublicRoute>
            }
          />
          <Route
            path="/meydan/:id"
            element={
              <ProtectedRoute authenticated={authenticated} authReady={authReady}>
                <MeydanDetail onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meydan/:id/not"
            element={
              <ProtectedRoute authenticated={authenticated} authReady={authReady}>
                <MeydanNoteRead onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personel/:personelAdi"
            element={
              <ProtectedRoute authenticated={authenticated} authReady={authReady}>
                <PersonelDetail onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={authenticated ? '/' : '/splash'} replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}