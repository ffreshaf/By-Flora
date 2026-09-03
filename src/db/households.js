// src/db/households.js
import {
  doc, setDoc, getDoc, updateDoc, arrayUnion,
  query, collection, where, getDocs
} from 'firebase/firestore';
import { db } from '../firebase.js';

import { auth } from '../firebase.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function generateInviteCode() {
  // short, human-typeable, e.g. "FLORA-7QK2"
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createHousehold(uid, name) {
  const householdRef = doc(collection(db, 'households'));
  const inviteCode = generateInviteCode();

  await setDoc(householdRef, {
    name,
    inviteCode,
    memberUids: [uid]
  });

  await setDoc(
    doc(db, 'inviteCodes', inviteCode),
    {
      householdId: householdRef.id
    }
  );

  await updateDoc(
    doc(db, 'users', uid),
    {
      householdId: householdRef.id
    }
  );

  return {
    id: householdRef.id,
    inviteCode
  };
}

export async function getHouseholdMembers(householdId) {
  const household = await getHousehold(householdId);
  if (!household) return [];

  const memberDocs = await Promise.all(
    household.memberUids.map(async (uid) => {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? { uid, ...snap.data() } : { uid, name: 'Unknown', email: '' };
    })
  );

  return memberDocs;
}

export async function joinHouseholdByCode(uid, code) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to join a household.');
  }

  const idToken = await currentUser.getIdToken();

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/join-household`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ code }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error || 'Failed to join household.');
  }

  return result.householdId;
}

export async function getHousehold(householdId) {
  const snap = await getDoc(doc(db, 'households', householdId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getMyUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}