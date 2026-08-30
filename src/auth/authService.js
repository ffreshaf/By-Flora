import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { db, auth } from '../firebase.js';

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
  // Native Google Sign-In via the Capacitor plugin — signInWithPopup
  // doesn't work in a native WebView, so this replaces it entirely.
  const result = await FirebaseAuthentication.signInWithGoogle();

  const idToken = result.credential?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in did not return a valid credential.');
  }

  // Feed that native credential into the JS Firebase Auth SDK so the
  // rest of the app (which reads `auth.currentUser` via onAuthChange)
  // sees a normal, consistent user object.
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);

  await ensureUserDoc(cred.user, cred.user.displayName);
  return cred.user;
}

export async function logOut() {
  await FirebaseAuthentication.signOut();
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