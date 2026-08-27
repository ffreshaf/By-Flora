// src/auth/authService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase.js'; // wherever your initializeApp() lives

const googleProvider = new GoogleAuthProvider();

export async function signUpWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await ensureUserDoc(cred.user, displayName);
  return cred.user;
}

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithGoogle() {
  // NOTE: on native iOS/Android this popup flow doesn't work reliably in a
  // Capacitor WebView. For native builds, swap this for the
  // @capacitor-firebase/authentication plugin's signInWithGoogle(), which
  // uses native Google Sign-In and then hands Firebase a credential.
  // Keep this version for web/dev testing.
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(cred.user, cred.user.displayName);
  return cred.user;
}

export async function logOut() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return auth.onAuthStateChanged(callback);
}

async function ensureUserDoc(user, displayName) {
  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      name: displayName || user.email,
      email: user.email,
      householdId: null
    });
  }
}