const AUTH_SESSION_KEY = 'syp-authenticated';
const ACTIVE_MEYDAN_EXPANDED_KEY = 'syp-active-meydan-expanded';

export function isAuthenticated() {
  return window.sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
}

export function setAuthenticated(value) {
  if (value) {
    window.sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    return;
  }

  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function getExpandedActiveMeydanId() {
  return window.sessionStorage.getItem(ACTIVE_MEYDAN_EXPANDED_KEY) || '';
}

export function setExpandedActiveMeydanId(value) {
  const normalized = String(value || '').trim();

  if (normalized) {
    window.sessionStorage.setItem(ACTIVE_MEYDAN_EXPANDED_KEY, normalized);
    return;
  }

  window.sessionStorage.removeItem(ACTIVE_MEYDAN_EXPANDED_KEY);
}