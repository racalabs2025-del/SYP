import { browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signInAnonymously, signOut } from 'firebase/auth';
import { auth } from './firebaseAuth';
import { getPanelRole } from './utils/permissions.js';

export async function signInPanel(email, password) {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
    const token = await user.getIdTokenResult(true);
    if (!getPanelRole(token.claims)) {
      await signOut(auth);
      throw new Error('Bu hesaba panel erişimi tanımlanmamış. Yöneticinizle iletişime geçin.');
    }
  } catch (error) {
    if (error.code === 'auth/network-request-failed') throw new Error('Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.');
    if (error.code === 'auth/too-many-requests') throw new Error('Çok fazla giriş denemesi yapıldı. Bir süre sonra yeniden deneyin.');
    if (error.code) throw new Error('Giriş yapılamadı. E-posta ve parolanızı kontrol edin.');
    throw error;
  }
}

export async function signInDevBypass(role = 'admin') {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('syp_dev_role', role);
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.warn('Dev bypass anonymous auth failed or disabled:', error?.message);
    }
    window.dispatchEvent(new CustomEvent('syp_auth_change', { detail: { role } }));
  }
}

export function getDevRole() {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('syp_dev_role') || null;
  }
  return null;
}

export async function signOutAdmin() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('syp_dev_role');
    window.dispatchEvent(new CustomEvent('syp_auth_change', { detail: { role: null } }));
  }
  await signOut(auth);
}
