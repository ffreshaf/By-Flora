import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

import { db } from '../firebase.js';

function householdSettingsRef(householdId, key) {
  return doc(
    db,
    'households',
    householdId,
    'settings',
    key
  );
}

export async function getHouseholdSetting(householdId, key) {
  const ref = householdSettingsRef(householdId, key);
  const snap = await getDoc(ref);

  return snap.exists()
    ? snap.data().value
    : undefined;
}

export async function setHouseholdSetting(
  householdId,
  key,
  value
) {
  const ref = householdSettingsRef(householdId, key);

  await setDoc(ref, {
    value
  });

  return value;
}

function settingsRef(uid) {
  return (key) =>
    doc(
      db,
      'users',
      uid,
      'settings',
      key
    );
}

export async function getSetting(uid, key) {
  const ref = settingsRef(uid)(key);
  const snap = await getDoc(ref);

  return snap.exists()
    ? snap.data().value
    : undefined;
}

export async function setSetting(uid, key, value) {
  const ref = settingsRef(uid)(key);

  await setDoc(ref, {
    value
  });

  return value;
}