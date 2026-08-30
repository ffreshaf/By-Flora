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

function remindersRef(householdId, dogId) {
  return collection(
    db,
    'households',
    householdId,
    'dogs',
    dogId,
    'reminders'
  );
}

export async function addReminder(
  householdId,
  dogId,
  reminder
) {
  const ref = await addDoc(
    remindersRef(householdId, dogId),
    reminder
  );

  return ref.id;
}

export async function updateReminder(
  householdId,
  dogId,
  reminderId,
  changes
) {
  await updateDoc(
    doc(
      db,
      'households',
      householdId,
      'dogs',
      dogId,
      'reminders',
      reminderId
    ),
    changes
  );

  return reminderId;
}

export async function deleteReminder(
  householdId,
  dogId,
  reminderId
) {
  await deleteDoc(
    doc(
      db,
      'households',
      householdId,
      'dogs',
      dogId,
      'reminders',
      reminderId
    )
  );
}

export async function getReminder(
  householdId,
  dogId,
  reminderId
) {
  const snap = await getDoc(
    doc(
      db,
      'households',
      householdId,
      'dogs',
      dogId,
      'reminders',
      reminderId
    )
  );

  return snap.exists()
    ? {
        id: snap.id,
        ...snap.data()
      }
    : null;
}

export async function getRemindersForDog(
  householdId,
  dogId
) {
  const snap = await getDocs(
    remindersRef(householdId, dogId)
  );

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function removeExpiredOneTimeReminders(
  householdId,
  dogId
) {
  const reminders = await getRemindersForDog(
    householdId,
    dogId
  );

  const now = new Date();

  for (const reminder of reminders) {
    if (!reminder.repeats && reminder.date) {
      const [year, month, day] =
        reminder.date.split('-').map(Number);

      const [hour, minute] =
        reminder.time.split(':').map(Number);

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
        await deleteReminder(
          householdId,
          dogId,
          reminder.id
        );
      }
    }
  }
}