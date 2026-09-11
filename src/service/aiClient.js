import { auth } from '../firebaseAuth';

export async function fetchPanelAI(options) {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    const error = new Error('Akıllı destek için yetkili hesabınızla giriş yapın.');
    error.status = 401;
    throw error;
  }
  const token = await user.getIdToken();
  return fetch(import.meta.env.VITE_AI_PROXY_URL || '/api/deepseek', {
    ...options,
    headers: { ...options?.headers, 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
  });
}
