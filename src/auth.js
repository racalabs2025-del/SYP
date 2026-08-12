import { signInAnonymously, signOut } from 'firebase/auth';
import { auth } from './firebaseAuth';

const PANEL_LOGIN_PASSWORD = String(import.meta.env.VITE_PANEL_LOGIN_PASSWORD || '');

export function verifyPanelPassword(passwordInput) {
  const normalizedInput = String(passwordInput || '');

  if (!PANEL_LOGIN_PASSWORD) {
    throw new Error('Panel parolasi tanimli degil. .env.local dosyasina VITE_PANEL_LOGIN_PASSWORD ekleyin.');
  }

  if (normalizedInput !== PANEL_LOGIN_PASSWORD) {
    throw new Error('Parola hatali.');
  }

  return true;
}

export async function signInAnonymouslyUser() {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error('[Auth] Firebase error code:', error?.code, error?.message);

    if (error?.code === 'auth/admin-restricted-operation') {
      throw new Error('Firebase Console\'da Anonim giriş etkinleştirilmemiş. Authentication → Sign-in method → Anonymous → Enable.');
    }

    if (error?.code === 'auth/network-request-failed') {
      throw new Error('Ağ hatası oluştu. İnternet bağlantınızı kontrol edin.');
    }

    if (error?.code === 'auth/configuration-not-found') {
      throw new Error('Firebase Authentication yapılandırması bulunamadı. Firebase Console\'da Authentication etkinleştirilmeli.');
    }

    throw new Error(`Giriş başarısız: ${error?.code || 'bilinmeyen hata'}`);
  }
}

export async function signOutAdmin() {
  await signOut(auth);
}