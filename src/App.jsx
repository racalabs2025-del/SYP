import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { onIdTokenChanged } from 'firebase/auth';
import './App.css';
import './MeydanCard.css';
import './MeydanGrid.css';
import MobileBottomNav from './components/shared/MobileBottomNav';
import { SypCircularLoader } from './components/shared/SypCircularLogo';
import { getDevRole, signOutAdmin } from './auth';
import { auth } from './firebaseAuth';
import { PanelAccessContext } from './hooks/usePanelAccess';
import { getPanelRole, permissionsForRole } from './utils/permissions.js';

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
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <SypCircularLoader text="Sayfa hazırlanıyor..." size="md" />
    </div>
  );
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
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <SypCircularLoader text="Oturum doğrulanıyor..." size="md" />
      </div>
    );
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
  const [authReady, setAuthReady] = useState(() => Boolean(getDevRole()));
  const [role, setRole] = useState(() => getDevRole() || null);
  const authenticated = Boolean(role);

  useEffect(() => {
    function handleCustomAuth(event) {
      const newRole = event.detail?.role || null;
      setRole(newRole);
      setAuthReady(true);
    }

    window.addEventListener('syp_auth_change', handleCustomAuth);

    let revision = 0;
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      const currentRevision = ++revision;
      setAuthReady(false);
      try {
        const token = user && !user.isAnonymous ? await user.getIdTokenResult() : null;
        if (currentRevision === revision) {
          const userRole = getPanelRole(token?.claims);
          setRole(userRole || getDevRole() || null);
        }
      } catch {
        if (currentRevision === revision) setRole(getDevRole() || null);
      } finally {
        if (currentRevision === revision) setAuthReady(true);
      }
    });

    return () => {
      revision++;
      unsubscribe();
      window.removeEventListener('syp_auth_change', handleCustomAuth);
    };
  }, []);

  async function handleLogout() {
    await signOutAdmin();
  }

  return (
    <PanelAccessContext.Provider value={{ role, ...permissionsForRole(role) }}>
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
      {authenticated ? <MobileBottomNav /> : null}
    </ErrorBoundary>
    </PanelAccessContext.Provider>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}