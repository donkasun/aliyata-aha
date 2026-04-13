// src/firebase.js
import { initializeApp }              from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore }               from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getAnalytics, logEvent }     from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js';

const firebaseConfig = {
  apiKey:            'AIzaSyDmLRbBsG3TGyghODKoopV_bKpq7NdQiYg',
  authDomain:        'aliyata-aha.firebaseapp.com',
  projectId:         'aliyata-aha',
  storageBucket:     'aliyata-aha.firebasestorage.app',
  messagingSenderId: '334433846985',
  appId:             '1:334433846985:web:80347803cf9e57b22faf18',
  measurementId:     'G-MTEDTSMCW6',
};

const app       = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
export const auth = getAuth(app);
const analytics  = getAnalytics(app);  // auto-tracks page_view, session, engagement

// Silently establishes a persistent anonymous uid on every page load.
signInAnonymously(auth).catch(console.error);

// Dev = localhost, loopback, or any non-standard port (covers IP:port on mobile).
export const isDev = location.hostname === 'localhost'
  || location.hostname === '127.0.0.1'
  || (location.port !== '' && location.port !== '80' && location.port !== '443');

// Convenience wrapper — silenced in local dev to keep Analytics clean.
export const track = (event, params = {}) => {
  if (isDev) return;
  logEvent(analytics, event, params);
};
