const AUTH_SESSION_KEY = 'syp-authenticated';

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