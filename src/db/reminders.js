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

export async function removeExpiredOneTimeReminders(dogId) {
  const reminders = await getRemindersForDog(dogId);

  const now = new Date();

  for (const reminder of reminders) {
    if (!reminder.repeats && reminder.date) {
      const [year, month, day] = reminder.date.split('-').map(Number);
      const [hour, minute] = reminder.time.split(':').map(Number);

      const reminderDate = new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        0,
        0
      );

      if (reminderDate <= now) {
        await deleteReminder(reminder.id);
      }
    }
  }
}