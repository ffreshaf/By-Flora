import { db } from '../db.js';

export async function addReminder(reminder) {
  return await db.reminders.add(reminder);
}

export async function updateReminder(id, changes) {
  await db.reminders.update(id, changes);
  return id;
}

export async function deleteReminder(id) {
  return db.reminders.delete(id);
}

export async function getReminder(id) {
  return db.reminders.get(id);
}

export async function getRemindersForDog(dogId) {
  return db.reminders
    .where('dogId')
    .equals(dogId)
    .toArray();
}