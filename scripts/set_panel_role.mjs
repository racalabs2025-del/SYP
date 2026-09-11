import { getServerAuth } from '../server/firebase-admin.js';
import { PANEL_ROLES } from '../src/utils/permissions.js';

const [uid, role, ...flags] = process.argv.slice(2);
if (!uid || ![...PANEL_ROLES, 'none'].includes(role) || flags.some((flag) => flag !== '--apply')) {
  console.error('Usage: node scripts/set_panel_role.mjs <Firebase UID> <admin|editor|viewer|none> [--apply]');
  process.exit(1);
}
const auth = getServerAuth();
const user = await auth.getUser(uid);
if (!user.providerData.some((provider) => provider.providerId === 'password') && role !== 'none') {
  throw new Error('Role assignment requires an email/password account.');
}
if (!flags.includes('--apply')) {
  console.log('Dry run: role assignment validated. Add --apply to save the claim and revoke existing sessions.');
} else {
  const claims = { ...user.customClaims };
  if (role === 'none') delete claims.sypRole;
  else claims.sypRole = role;
  await auth.setCustomUserClaims(uid, claims);
  await auth.revokeRefreshTokens(uid);
  console.log('Role saved; user must sign in again. Existing Firestore tokens may remain valid until expiry (up to one hour).');
}
