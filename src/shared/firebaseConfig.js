const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDdk7vIwd0wjB3Ccf7h6tgAtqLn90GNfYg',
  authDomain: 'foodsense-e1bf6.firebaseapp.com',
  projectId: 'foodsense-e1bf6',
  storageBucket: 'foodsense-e1bf6.firebasestorage.app',
  messagingSenderId: '737504845000',
  appId: '1:737504845000:web:8963d6571cc7f47f5319fd',
  measurementId: 'G-FM5NNE1JRX',
};

const nodeProcess = typeof globalThis !== 'undefined' ? globalThis.process : undefined;

function readEnvValue(viteKey, nodeKey, fallback = '') {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[viteKey]) {
    return import.meta.env[viteKey];
  }

  if (nodeProcess?.env?.[nodeKey]) {
    return nodeProcess.env[nodeKey];
  }

  return fallback;
}

export const firebaseConfig = {
  apiKey: readEnvValue('VITE_FIREBASE_API_KEY', 'FIREBASE_API_KEY', DEFAULT_FIREBASE_CONFIG.apiKey),
  authDomain: readEnvValue('VITE_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN', DEFAULT_FIREBASE_CONFIG.authDomain),
  projectId: readEnvValue('VITE_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID', DEFAULT_FIREBASE_CONFIG.projectId),
  storageBucket: readEnvValue('VITE_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET', DEFAULT_FIREBASE_CONFIG.storageBucket),
  messagingSenderId: readEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID', DEFAULT_FIREBASE_CONFIG.messagingSenderId),
  appId: readEnvValue('VITE_FIREBASE_APP_ID', 'FIREBASE_APP_ID', DEFAULT_FIREBASE_CONFIG.appId),
  measurementId: readEnvValue('VITE_FIREBASE_MEASUREMENT_ID', 'FIREBASE_MEASUREMENT_ID', DEFAULT_FIREBASE_CONFIG.measurementId),
};

export function readAppSecret(key, fallback = '') {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key];
  }

  if (nodeProcess?.env?.[key]) {
    return nodeProcess.env[key];
  }

  return fallback;
}