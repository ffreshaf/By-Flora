// src/db/households.js
import {
  doc, setDoc, getDoc, updateDoc, arrayUnion,
  query, collection, where, getDocs
} from 'firebase/firestore';
import { db } from '../firebase.js';

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
  const normalizedCode = code.trim().toUpperCase();

  const inviteSnap = await getDoc(
    doc(db, 'inviteCodes', normalizedCode)
  );

  if (!inviteSnap.exists()) {
    throw new Error('No household found with that invite code.');
  }

  const { householdId } = inviteSnap.data();

  await updateDoc(
    doc(db, 'households', householdId),
    {
      memberUids: arrayUnion(uid)
    }
  );

  await updateDoc(
    doc(db, 'users', uid),
    {
      householdId
    }
  );

  return householdId;
}

export async function getHousehold(householdId) {
  const snap = await getDoc(doc(db, 'households', householdId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getMyUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}