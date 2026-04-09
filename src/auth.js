import { signInAnonymously, signOut } from 'firebase/auth';
import { auth } from './firebaseAuth';
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