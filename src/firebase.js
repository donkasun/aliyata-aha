// src/firebase.js
import { initializeApp }             from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore }              from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const firebaseConfig = {
  apiKey:            'AIzaSyDmLRbBsG3TGyghODKoopV_bKpq7NdQiYg',
  authDomain:        'aliyata-aha.firebaseapp.com',
  projectId:         'aliyata-aha',
  storageBucket:     'aliyata-aha.firebasestorage.app',
  messagingSenderId: '334433846985',
  appId:             '1:334433846985:web:80347803cf9e57b22faf18',
};

const app = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);

// Silently establishes a persistent anonymous uid on every page load.
signInAnonymously(auth).catch(console.error);
