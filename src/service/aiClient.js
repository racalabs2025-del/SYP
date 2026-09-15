import { auth } from '../firebaseAuth';

export async function fetchPanelAI(options) {
  const user = auth.currentUser;
  let token = null;
  if (!user || user.isAnonymous) {
    if (import.meta.env.DEV && (typeof window !== 'undefined' && sessionStorage.getItem('syp_dev_role'))) {
      token = 'syp-dev-token';
    } else {
      const error = new Error('Akıllı destek için yetkili hesabınızla giriş yapın.');
      error.status = 401;
      throw error;
    }
  } else {
    token = await user.getIdToken();
  }
  return fetch(import.meta.env.VITE_AI_PROXY_URL || '/api/deepseek', {
    ...options,
    headers: { ...options?.headers, 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
  });
}
