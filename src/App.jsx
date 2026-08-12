import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import './App.css';
import './MeydanCard.css';
import './MeydanGrid.css';
import { signOutAdmin } from './auth';
import { auth } from './firebaseAuth';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const LoginScreen = lazy(() => import('./pages/LoginScreen'));
const MeydanDetail = lazy(() => import('./pages/MeydanDetail'));
const MeydanNoteRead = lazy(() => import('./pages/MeydanNoteRead'));
const ModuleScreen = lazy(() => import('./pages/ModuleScreen'));
const PersonelDetail = lazy(() => import('./pages/PersonelDetail'));
const SplashScreen = lazy(() => import('./pages/SplashScreen'));

function RouteLoading() {
  return <div className="page"><div className="message message-loading">Sayfa yükleniyor...</div></div>;
}

function NavigationGuard({ authenticated }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.history.pushState({ syp: true, path: location.pathname }, '', window.location.href);

    function handlePopState() {
      if (!authenticated) {
        navigate('/login', { replace: true });
        window.history.pushState({ syp: true, path: '/login' }, '', window.location.href);
        return;
      }

      if (location.pathname.startsWith('/meydan/') || location.pathname.startsWith('/personel/')) {
        navigate('/meydan-yonetimi', { replace: true });
        window.history.pushState({ syp: true, path: '/meydan-yonetimi' }, '', window.location.href);
        return;
      }

      if (location.pathname === '/meydan-yonetimi') {
        navigate('/', { replace: true });
        window.history.pushState({ syp: true, path: '/' }, '', window.location.href);
        return;
      }

      if (location.pathname === '/') {
        window.history.pushState({ syp: true, path: '/' }, '', window.location.href);
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
    <>
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
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}