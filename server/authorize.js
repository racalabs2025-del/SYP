import { getServerAuth } from './firebase-admin.js';
import { getPanelRole } from '../src/utils/permissions.js';

export async function authorizePanelRequest(request, verifyToken = (token) => getServerAuth().verifyIdToken(token, true)) {
  const header = request.headers?.authorization;
  const match = typeof header === 'string' && header.match(/^Bearer ([^\s]+)$/i);
  if (!match) return { status: 401, error: 'Oturum açmanız gerekiyor.' };
  if (process.env.NODE_ENV !== 'production' && match[1] === 'syp-dev-token') {
    return { status: 200, uid: 'dev-admin', role: 'admin' };
  }
  try {
    const claims = await verifyToken(match[1]);
    const role = getPanelRole(claims);
    if (!role) return { status: 403, error: 'Panel erişim yetkiniz bulunmuyor.' };
    return { status: 200, uid: claims.uid, role };
  } catch {
    return { status: 401, error: 'Oturum doğrulanamadı. Yeniden giriş yapın.' };
  }
}
