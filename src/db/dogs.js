import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

import { db } from '../firebase.js';

function dogsRef(householdId) {
  return collection(
    db,
    'households',
    householdId,
    'dogs'
  );
}

export async function addDog(householdId, dog) {
  const ref = await addDoc(
    dogsRef(householdId),
    dog
  );

  return ref.id;
}

export async function updateDog(householdId, dogId, changes) {
  await updateDoc(
    doc(db, 'households', householdId, 'dogs', dogId),
    changes
  );

  return dogId;
}

export async function deleteDog(householdId, dogId) {
  await deleteDoc(
    doc(db, 'households', householdId, 'dogs', dogId)
  );
}

export async function getDog(householdId, dogId) {
  const snap = await getDoc(
    doc(db, 'households', householdId, 'dogs', dogId)
  );

  return snap.exists()
    ? { id: snap.id, ...snap.data() }
    : null;
}

export async function getAllDogs(householdId) {
  const snap = await getDocs(
    dogsRef(householdId)
  );

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}