import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseConfig } from './shared/firebaseConfig';

const app = initializeApp(firebaseConfig);
let analytics = null;

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (!supported) {
        return;
      }

      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.warn('Firebase Analytics baslatilamadi.', error);
      }
    })
    .catch(() => {});
}

export { app, analytics };