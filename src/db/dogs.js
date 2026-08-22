import { db } from '../db.js';

export async function addDog(dog) {
  // dog = { name, ageMonths, weightKg, size, activityLevel }
  return db.dogs.add(dog);
}

export async function getDog(id) {
  return db.dogs.get(id);
}

export async function updateDog(id, changes) {
  return db.dogs.update(id, changes);
}

export async function getAllDogs() {
  return db.dogs.toArray();
}