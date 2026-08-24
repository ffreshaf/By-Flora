import { db } from '../db.js';
import { getSetting, setSetting } from './settings.js';

export async function addDog(dog) {
  return db.dogs.add(dog); // resolves to the new id
}

export async function updateDog(id, changes) {
  await db.dogs.update(id, changes);
  return id;
}

export async function deleteDog(id) {
  return db.dogs.delete(id);
}

export async function getDog(id) {
  return db.dogs.get(id);
}

export async function getAllDogs() {
  return db.dogs.toArray();
}

// Used outside React components (e.g. App.jsx notification setup)
export async function getActiveDog() {
  const dogs = await getAllDogs();
  if (dogs.length === 0) return null;

  const activeId = await getSetting('activeDogId');
  return dogs.find((d) => d.id === activeId) || dogs[0];
}