export const PANEL_ROLES = ['admin', 'editor', 'viewer'];

export function getPanelRole(claims) {
  return claims?.firebase?.sign_in_provider === 'password' && PANEL_ROLES.includes(claims?.sypRole)
    ? claims.sypRole : null;
}

export function permissionsForRole(role) {
  return {
    canRead: PANEL_ROLES.includes(role),
    canWrite: role === 'admin' || role === 'editor',
    canDelete: role === 'admin',
  };
}
