// src/score.js — score calculation, Firestore submission, leaderboard subscription.
import { db, auth, isDev } from './firebase.js';
import {
  doc, collection, query, where, orderBy, limit, getDocs,
  onSnapshot, setDoc, runTransaction, increment, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// Accuracy (max 1000) + speed bonus (max 100, for completing within 10s).
export function calcScore(distance, timeTaken) {
  const accuracy   = Math.max(0, 1000 - distance * 5);
  const speedBonus = Math.round(Math.max(0, (10 - Math.min(timeTaken, 10)) * 10));
  return accuracy + speedBonus;
}

// Returns true if `name` is already used by a player with a different uid.
export async function isNameTaken(name, uid) {
  if (isDev) return false;
  const q = query(
    collection(db, 'players'),
    where('displayName', '==', name),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return false;
  // Taken only if the matching doc belongs to someone else.
  return snap.docs[0].id !== uid;
}

// Each player has one document in `players/` keyed by uid.
// We update it transactionally so only the personal best is kept.
export async function submitScore({ displayName, distance, timeTaken, seed }) {
  if (isDev) { console.log('[dev] score not submitted:', { displayName, distance, timeTaken }); return null; }
  const uid = auth.currentUser?.uid;
  if (!uid || !displayName) return null;

  const score      = calcScore(distance, timeTaken);
  const playerRef  = doc(db, 'players', uid);

  await runTransaction(db, async (tx) => {
    const snap    = await tx.get(playerRef);
    const current = snap.exists() ? (snap.data().bestScore ?? 0) : 0;

    if (score > current) {
      tx.set(playerRef, {
        displayName,
        bestScore:    score,
        bestDistance: distance,
        lastPlayed:   serverTimestamp(),
        totalAttempts: increment(1),
      }, { merge: true });
    } else {
      tx.set(playerRef, {
        displayName,          // keep name up to date
        lastPlayed:   serverTimestamp(),
        totalAttempts: increment(1),
      }, { merge: true });
    }
  });

  return score;
}

// Returns an unsubscribe function. Calls callback with top-50 array on every change.
export function subscribeLeaderboard(callback) {
  const q = query(
    collection(db, 'players'),
    orderBy('bestScore', 'desc'),
    limit(50),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
  });
}
