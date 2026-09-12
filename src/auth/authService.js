import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  updateProfile,
  verifyBeforeUpdateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { db, auth } from '../firebase.js';

export async function signUpWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await ensureUserDoc(cred.user, displayName);

  await sendEmailVerification(cred.user);
  return cred.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function sendVerificationEmail() {
  if (!auth.currentUser) {
    throw new Error('No signed-in user.');
  }

  await sendEmailVerification(auth.currentUser);
}

export async function reloadCurrentUser() {
  if (!auth.currentUser) return null;

  await auth.currentUser.reload();

  return auth.currentUser;
}

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  await cred.user.reload();

  if (!cred.user.emailVerified) {
    await signOut(auth);

    throw new Error(
      'Please verify your email address before signing in.'
    );
  }

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

async function reauthenticate(currentPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error('No signed-in user.');

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
}

export async function updateNickname(nickname) {
  if (!auth.currentUser) throw new Error('No signed-in user.');

  await updateProfile(auth.currentUser, { displayName: nickname });

  const ref = doc(db, 'users', auth.currentUser.uid);
  await updateDoc(ref, { name: nickname });
}

export async function requestEmailChange(newEmail, currentPassword) {
  if (!auth.currentUser) throw new Error('No signed-in user.');

  await reauthenticate(currentPassword);

  // Sends a verification link to the NEW address. The email only
  // actually changes once the user clicks that link — auth.currentUser.email
  // stays the old address until then. Don't update Firestore's `email`
  // field here, since it would go stale until the user verifies.
  await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
}

export async function updateUserPassword(currentPassword, newPassword) {
  if (!auth.currentUser) throw new Error('No signed-in user.');

  await reauthenticate(currentPassword);
  await updatePassword(auth.currentUser, newPassword);
}