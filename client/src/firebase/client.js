import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig, firebaseEnabled } from './config.js';

export const firebaseApp = firebaseEnabled ? initializeApp(firebaseConfig) : null;
export const auth = firebaseEnabled ? getAuth(firebaseApp) : null;
export const storage = firebaseEnabled ? getStorage(firebaseApp) : null;

if (firebaseEnabled && typeof window !== 'undefined') {
  analyticsSupported().then((supported) => {
    if (supported) getAnalytics(firebaseApp);
  }).catch(() => {});
}

export const authApi = {
  onChange(callback) {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  },
  async login(email, password) {
    if (!auth) throw new Error('Firebase is not configured.');
    return signInWithEmailAndPassword(auth, email, password);
  },
  async register(email, password, username) {
    if (!auth) throw new Error('Firebase is not configured.');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: username });
    await sendEmailVerification(credential.user);
    return credential;
  },
  async resetPassword(email) {
    if (!auth) throw new Error('Firebase is not configured.');
    return sendPasswordResetEmail(auth, email);
  },
  async logout() {
    if (!auth) return;
    return signOut(auth);
  }
};
