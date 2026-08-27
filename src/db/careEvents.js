import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';

import { db } from '../firebase.js';

function careEventsRef(householdId, dogId) {
  return collection(
    db,
    'households',
    householdId,
    'dogs',
    dogId,
    'careEvents'
  );
}

export async function logCareEvent(
  householdId,
  dogId,
  type,
  durationMinutes = null
) {
  const ref = await addDoc(
    careEventsRef(householdId, dogId),
    {
      dogId,
      type,
      durationMinutes,
      timestamp: Date.now()
    }
  );

  return ref.id;
}

export async function getLastEvent(
  householdId,
  dogId,
  type
) {
  const q = query(
    careEventsRef(householdId, dogId),
    where('type', '==', type),
    orderBy('timestamp', 'desc')
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    return null;
  }

  const eventDoc = snap.docs[0];

  return {
    id: eventDoc.id,
    ...eventDoc.data()
  };
}

export async function getEventsForDog(
  householdId,
  dogId
) {
  const q = query(
    careEventsRef(householdId, dogId),
    orderBy('timestamp', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}