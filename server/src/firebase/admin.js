import admin from 'firebase-admin';
import { env } from '../config/env.js';

let app = null;

export function getFirebaseAdmin() {
  if (app) return app;

  const { projectId, clientEmail, privateKey, databaseURL } = env.firebase;
  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    }),
    databaseURL
  });

  return app;
}

export async function verifyFirebaseToken(token) {
  const firebaseApp = getFirebaseAdmin();
  if (!firebaseApp || !token) return null;

  try {
    return await admin.auth(firebaseApp).verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function writeMatchResult(matchResult) {
  const firebaseApp = getFirebaseAdmin();
  if (!firebaseApp) return;

  const db = admin.firestore(firebaseApp);
  await db.collection('matches').doc(matchResult.roundId).set(matchResult, { merge: true });
}

export async function upsertProfile(profile) {
  const firebaseApp = getFirebaseAdmin();
  if (!firebaseApp || profile.isGuest) return;

  const db = admin.firestore(firebaseApp);
  await db.collection('profiles').doc(profile.id).set({
    username: profile.username,
    avatar: profile.avatar,
    level: profile.level,
    xp: profile.xp,
    rankPoints: profile.rankPoints,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}
