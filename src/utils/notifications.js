import { LocalNotifications } from '@capacitor/local-notifications';

import { getEventsForDog, logCareEvent } from '../db/careEvents.js';
import { startOfToday } from './reminders.js';
import {
  getHouseholdSetting,
  setHouseholdSetting
} from '../db/settings.js';
import { getAllDogs, getDog, updateDog } from '../db/dogs.js';
import { getRemindersForDog } from '../db/reminders.js';

export async function requestNotificationPermission() {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

export async function setupActionTypes() {
  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: 'CARE_CONFIRM',
        actions: [
          { id: 'yes', title: 'Yes, done' },
          { id: 'no', title: 'Not yet' }
        ]
      }
    ]
  });
}

/*
 * Handles notification button presses.
 *
 * "Yes, done" logs the care event in Firestore.
 *
 * householdId is passed in from main.jsx because the notification
 * itself only contains the dogId/careType.
 */
export async function setupNotificationActionHandler(getHouseholdId) {
  await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    async (event) => {
      try {
        console.log('Notification action received:', event);

        const actionId = event.actionId;
        const notification = event.notification;

        if (actionId !== 'yes') {
          console.log('Notification action was not "yes":', actionId);
          return;
        }

        const careType = notification.extra?.careType;
        const dogId = notification.extra?.dogId;

        if (!careType || !dogId) {
          console.error(
            'Notification is missing careType or dogId:',
            notification
          );
          return;
        }

        const householdId = await getHouseholdId();

        if (!householdId) {
          console.error(
            'Could not log notification action: no household ID.'
          );
          return;
        }

        console.log('Logging care event from notification:', {
          householdId,
          dogId,
          careType
        });

        await logCareEvent(
          householdId,
          dogId,
          careType
        );

        console.log('Care event logged successfully.');

        /*
         * Reschedule this dog's reminders.
         *
         * This is important because scheduleSmartReminders()
         * checks today's logged events before scheduling.
         */
        await scheduleSmartReminders(
          householdId,
          dogId
        );

        console.log(
          'Reminders rescheduled after notification confirmation.'
        );

      } catch (error) {
        console.error(
          'Failed to handle notification action:',
          error
        );
      }
    }
  );
}

const DEFAULT_SLOTS = [
  {
    id: 1,
    careType: 'feed',
    hour: 8,
    minute: 0,
    title: 'Feeding time 🍖',
    body: (name) => `Did you feed ${name} yet?`
  },

  {
    id: 2,
    careType: 'feed',
    hour: 18,
    minute: 0,
    title: 'Feeding time 🍖',
    body: (name) => `Second meal — did you feed ${name} yet?`
  },

  {
    id: 3,
    careType: 'walk',
    hour: 17,
    minute: 0,
    title: 'Walk time 🐾',
    body: (name) => `Have you taken ${name} for a walk today?`
  }
];

const GLOBAL_REMINDER_TIMES_KEY = 'reminderTimes';

function mergeTimes(overrides) {
  if (!overrides) return DEFAULT_SLOTS;

  return DEFAULT_SLOTS.map((slot) => {
    const override = overrides.find(
      (o) => o.id === slot.id
    );

    return override
      ? {
          ...slot,
          hour: override.hour,
          minute: override.minute
        }
      : slot;
  });
}

// =========================
// REMINDER TIMES
// =========================

export async function getGlobalReminderSlots(householdId) {
  const saved = await getHouseholdSetting(
    householdId,
    GLOBAL_REMINDER_TIMES_KEY
  );

  return mergeTimes(saved);
}

export async function saveGlobalReminderTimes(
  householdId,
  times
) {
  await setHouseholdSetting(
    householdId,
    GLOBAL_REMINDER_TIMES_KEY,
    times
  );
}

export async function getReminderSlotsForDog(
  householdId,
  dogId
) {
  const dog = await getDog(
    householdId,
    dogId
  );

  if (dog?.reminderTimes) {
    return mergeTimes(dog.reminderTimes);
  }

  return getGlobalReminderSlots(householdId);
}

export async function saveDogReminderTimes(
  householdId,
  dogId,
  times
) {
  await updateDog(
    householdId,
    dogId,
    {
      reminderTimes: times
    }
  );
}

export async function clearDogReminderOverride(
  householdId,
  dogId
) {
  await updateDog(
    householdId,
    dogId,
    {
      reminderTimes: null
    }
  );
}

// =========================
// NOTIFICATION IDs
// =========================

export function customReminderNotificationId(reminderId) {
  const text = String(reminderId);

  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash =
      ((hash << 5) - hash) +
      text.charCodeAt(i);

    hash |= 0;
  }

  return 1000000 + Math.abs(hash % 900000);
}

export function notificationIdFor(
  dogId,
  slotId
) {
  const text = `${dogId}:${slotId}`;

  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash =
      ((hash << 5) - hash) +
      text.charCodeAt(i);

    hash |= 0;
  }

  return 1 + Math.abs(hash % 900000);
}

// =========================
// CANCEL
// =========================

export async function cancelRemindersForDog(
  householdId,
  dogId
) {
  const slots =
    await getReminderSlotsForDog(
      householdId,
      dogId
    );

  const reminders =
    await getRemindersForDog(
      householdId,
      dogId
    );

  const ids = [
    ...slots.map((slot) => ({
      id: notificationIdFor(
        dogId,
        slot.id
      )
    })),

    ...reminders.map((reminder) => ({
      id: customReminderNotificationId(
        reminder.id
      )
    }))
  ];

  if (ids.length > 0) {
    await LocalNotifications.cancel({
      notifications: ids
    });
  }
}

// =========================
// CUSTOM REMINDERS
// =========================

function getReminderDate(reminder) {
  const [hour, minute] =
    reminder.time.split(':').map(Number);

  if (reminder.repeats) {
    const date = new Date();

    date.setHours(
      hour,
      minute,
      0,
      0
    );

    if (date <= new Date()) {
      date.setDate(
        date.getDate() +
        Number(reminder.intervalDays || 1)
      );
    }

    return date;
  }

  const [year, month, day] =
    reminder.date.split('-').map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );
}

export async function scheduleCustomReminder(
  reminder,
  dog
) {
  const notificationId =
    customReminderNotificationId(
      reminder.id
    );

  const at =
    getReminderDate(reminder);

  await LocalNotifications.cancel({
    notifications: [
      {
        id: notificationId
      }
    ]
  });

  const notification = {
    id: notificationId,
    title: reminder.title,
    body: `${dog.name}'s reminder`,

    schedule: {
      at,
      allowWhileIdle: true
    },

    extra: {
      type: 'custom-reminder',
      reminderId: reminder.id,
      dogId: dog.id
    }
  };

  await LocalNotifications.schedule({
    notifications: [notification]
  });
}

export async function scheduleCustomRemindersForDog(
  householdId,
  dogId
) {
  const dog =
    await getDog(
      householdId,
      dogId
    );

  if (!dog) return;

  const reminders =
    await getRemindersForDog(
      householdId,
      dogId
    );

  for (const reminder of reminders) {
    await scheduleCustomReminder(
      reminder,
      dog
    );
  }
}

// =========================
// SMART REMINDERS
// =========================

function getNextReminderDate(
  hour,
  minute
) {
  const now = new Date();

  const next = new Date();

  next.setHours(
    hour,
    minute,
    0,
    0
  );

  if (next <= now) {
    next.setDate(
      next.getDate() + 1
    );
  }

  return next;
}

export async function scheduleSmartReminders(
  householdId,
  dogId
) {
  const dog =
    await getDog(
      householdId,
      dogId
    );

  if (!dog) return;

  const slots =
    await getReminderSlotsForDog(
      householdId,
      dogId
    );

  const events =
    await getEventsForDog(
      householdId,
      dogId
    );

  const todayEvents =
    events.filter(
      (e) =>
        e.timestamp >=
        startOfToday()
    );

  const feedCountToday =
    todayEvents.filter(
      (e) => e.type === 'feed'
    ).length;

  const walkedToday =
    todayEvents.some(
      (e) => e.type === 'walk'
    );

  await LocalNotifications.cancel({
    notifications:
      slots.map((slot) => ({
        id: notificationIdFor(
          dogId,
          slot.id
        )
      }))
  });

  const toSchedule = [];

  for (const slot of slots) {

    if (
      slot.careType === 'feed' &&
      feedCountToday >= 2
    ) {
      continue;
    }

    if (
      slot.careType === 'walk' &&
      walkedToday
    ) {
      continue;
    }

    const nextDate =
      getNextReminderDate(
        slot.hour,
        slot.minute
      );

    toSchedule.push({
      id: notificationIdFor(
        dogId,
        slot.id
      ),

      title: slot.title,

      body: slot.body(
        dog.name
      ),

      schedule: {
        at: nextDate,
        repeats: true,
        every: 'day',
        allowWhileIdle: true
      },

      extra: {
        careType: slot.careType,
        dogId
      }
    });
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({
      notifications: toSchedule
    });
  }

  await scheduleCustomRemindersForDog(
    householdId,
    dogId
  );
}

export async function scheduleRemindersForAllDogs(
  householdId,
  dogs
) {
  const allDogs =
    dogs ||
    await getAllDogs(
      householdId
    );

  for (const dog of allDogs) {
    await scheduleSmartReminders(
      householdId,
      dog.id
    );
  }
}

export async function cancelOrphanedReminders(
  householdId
) {
  const dogs =
    await getAllDogs(
      householdId
    );

  const validDogIds =
    new Set(
      dogs.map(
        (dog) => dog.id
      )
    );

  const pending =
    await LocalNotifications.getPending();

  const orphaned =
    pending.notifications.filter(
      (notification) => {
        const dogId =
          notification.extra?.dogId;

        return (
          dogId &&
          !validDogIds.has(dogId)
        );
      }
    );

  if (orphaned.length > 0) {
    await LocalNotifications.cancel({
      notifications:
        orphaned.map(
          (notification) => ({
            id: notification.id
          })
        )
    });
  }
}

