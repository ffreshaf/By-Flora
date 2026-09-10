// src/utils/notifications.js

import { LocalNotifications } from '@capacitor/local-notifications';

import {
  getEventsForDog,
  logCareEvent
} from '../db/careEvents.js';

import { startOfToday } from './reminders.js';

import {
  getHouseholdSetting,
  setHouseholdSetting
} from '../db/settings.js';

import {
  getAllDogs,
  getDog,
  updateDog
} from '../db/dogs.js';

import { getRemindersForDog } from '../db/reminders.js';

import { HYGIENE_TYPES } from './hygiene.js';


// ============================================================
// CONFIG
// ============================================================

// Number of future days to keep scheduled.
//
// We deliberately do NOT use a repeating notification.
// Each occurrence gets its own one-shot notification.
const REMINDER_WINDOW_DAYS = 7;


// ============================================================
// PERMISSIONS
// ============================================================

export async function requestNotificationPermission() {
  const result = await LocalNotifications.requestPermissions();

  return result.display === 'granted';
}


// ============================================================
// ACTION TYPES
// ============================================================

export async function setupActionTypes() {
  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: 'CARE_CONFIRM',

        actions: [
          {
            id: 'yes',
            title: 'Yes, done'
          },
          {
            id: 'no',
            title: 'Not yet'
          }
        ]
      }
    ]
  });
}


// ============================================================
// NOTIFICATION IDS
// ============================================================

function hashNotificationText(text) {
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash =
      ((hash << 5) - hash) +
      text.charCodeAt(i);

    hash |= 0;
  }

  return Math.abs(hash);
}


/**
 * Normal feed/walk notification.
 *
 * dayOffset is important now because we schedule
 * each day individually.
 *
 * Example:
 *
 * dog123 + slot1 + day0
 * dog123 + slot1 + day1
 * dog123 + slot1 + day2
 */
export function notificationIdFor(
  dogId,
  slotId,
  dayOffset = 0
) {
  const text = `${dogId}:${slotId}:${dayOffset}`;

  return 1 + (hashNotificationText(text) % 900000);
}


/**
 * ID used by the OLD repeating-reminder implementation.
 *
 * We keep this only so old notifications can be cancelled
 * after the app updates.
 */
function legacyNotificationIdFor(
  dogId,
  slotId
) {
  const text = `${dogId}:${slotId}`;

  return 1 + (hashNotificationText(text) % 900000);
}


/**
 * Custom reminder IDs.
 *
 * Range: 1,000,000 - 1,899,999
 */
export function customReminderNotificationId(
  reminderId
) {
  const text = String(reminderId);

  return 1000000 +
    (hashNotificationText(text) % 900000);
}


/**
 * Hygiene notification IDs.
 *
 * Range: 2,000,000 - 2,899,999
 */
export function hygieneNotificationId(
  dogId,
  hygieneTypeId
) {
  const text =
    `hygiene:${dogId}:${hygieneTypeId}`;

  return 2000000 +
    (hashNotificationText(text) % 900000);
}


// ============================================================
// NOTIFICATION ACTION HANDLER
// ============================================================

/**
 * Handles notification button presses.
 *
 * "Yes, done" logs the care event and rebuilds that dog's
 * reminder window.
 *
 * Returns the listener handle so callers can remove it later.
 */
export async function setupNotificationActionHandler(
  getHouseholdId
) {
  const listener =
    await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      async (event) => {
        try {
          console.log(
            'Notification action received:',
            event
          );

          const actionId =
            event.actionId;

          const notification =
            event.notification;

          if (actionId !== 'yes') {
            console.log(
              'Notification action was not "yes":',
              actionId
            );

            return;
          }

          const careType =
            notification.extra?.careType;

          const dogId =
            notification.extra?.dogId;

          if (!careType || !dogId) {
            console.error(
              'Notification is missing careType or dogId:',
              notification
            );

            return;
          }

          const householdId =
            await getHouseholdId();

          if (!householdId) {
            console.error(
              'Could not log notification action: no household ID.'
            );

            return;
          }

          console.log(
            'Logging care event from notification:',
            {
              householdId,
              dogId,
              careType
            }
          );

          await logCareEvent(
            householdId,
            dogId,
            careType
          );

          console.log(
            'Care event logged successfully.'
          );

          // Rebuild the reminder window.
          //
          // This will see the newly logged event and
          // avoid scheduling reminders that are no longer
          // necessary today.
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

  return listener;
}


// ============================================================
// DEFAULT REMINDER SLOTS
// ============================================================

const DEFAULT_SLOTS = [
  {
    id: 1,

    careType: 'feed',

    hour: 8,
    minute: 0,

    title: 'Feeding time 🍖',

    body: (name) =>
      `Did you feed ${name} yet?`
  },

  {
    id: 2,

    careType: 'feed',

    hour: 18,
    minute: 0,

    title: 'Feeding time 🍖',

    body: (name) =>
      `Second meal — did you feed ${name} yet?`
  },

  {
    id: 3,

    careType: 'walk',

    hour: 17,
    minute: 0,

    title: 'Walk time 🐾',

    body: (name) =>
      `Have you taken ${name} for a walk today?`
  }
];

const GLOBAL_REMINDER_TIMES_KEY =
  'reminderTimes';


// ============================================================
// REMINDER TIMES
// ============================================================

function mergeTimes(overrides) {
  if (!overrides) {
    return DEFAULT_SLOTS;
  }

  return DEFAULT_SLOTS.map((slot) => {
    const override =
      overrides.find(
        (item) => item.id === slot.id
      );

    if (!override) {
      return slot;
    }

    return {
      ...slot,
      hour: override.hour,
      minute: override.minute
    };
  });
}


export async function getGlobalReminderSlots(
  householdId
) {
  const saved =
    await getHouseholdSetting(
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
  const dog =
    await getDog(
      householdId,
      dogId
    );

  if (dog?.reminderTimes) {
    return mergeTimes(
      dog.reminderTimes
    );
  }

  return getGlobalReminderSlots(
    householdId
  );
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


// ============================================================
// CANCEL REMINDERS FOR ONE DOG
// ============================================================

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

  const ids = [];

  // New 7-day normal reminder IDs.
  for (const slot of slots) {
    for (
      let dayOffset = 0;
      dayOffset < REMINDER_WINDOW_DAYS;
      dayOffset++
    ) {
      ids.push({
        id: notificationIdFor(
          dogId,
          slot.id,
          dayOffset
        )
      });
    }

    // Old repeating reminder ID.
    //
    // This prevents the old version from continuing
    // to fire after the app has been updated.
    ids.push({
      id: legacyNotificationIdFor(
        dogId,
        slot.id
      )
    });
  }

  // Custom reminders.
  ids.push(
    ...reminders.map((reminder) => ({
      id: customReminderNotificationId(
        reminder.id
      )
    }))
  );

  // Hygiene reminders.
  ids.push(
    ...HYGIENE_TYPES.map((hygiene) => ({
      id: hygieneNotificationId(
        dogId,
        hygiene.id
      )
    }))
  );

  if (ids.length === 0) {
    return;
  }

  try {
    await LocalNotifications.cancel({
      notifications: ids
    });
  } catch (error) {
    console.warn(
      'cancelRemindersForDog failed:',
      error
    );
  }
}


// ============================================================
// CUSTOM REMINDERS
// ============================================================

function getReminderDate(reminder) {
  const [hour, minute] =
    reminder.time
      .split(':')
      .map(Number);

  if (reminder.repeats) {
    const date = new Date();

    date.setHours(
      hour,
      minute,
      0,
      0
    );

    const now = new Date();

    if (date <= now) {
      date.setDate(
        date.getDate() +
        Number(
          reminder.intervalDays || 1
        )
      );
    }

    return date;
  }

  const [year, month, day] =
    reminder.date
      .split('-')
      .map(Number);

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

  // Never schedule something already in the past.
  if (at <= new Date()) {
    return;
  }

  // Replace any existing notification with
  // this reminder's ID.
  try {
    await LocalNotifications.cancel({
      notifications: [
        {
          id: notificationId
        }
      ]
    });
  } catch {
    // Nothing to cancel is fine.
  }

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
    notifications: [
      notification
    ]
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

  if (!dog) {
    return;
  }

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


// ============================================================
// HYGIENE REMINDERS
// ============================================================

export async function scheduleHygieneReminders(
  householdId,
  dogId
) {
  const dog =
    await getDog(
      householdId,
      dogId
    );

  if (!dog) {
    return;
  }

  const events =
    await getEventsForDog(
      householdId,
      dogId
    );

  const ids =
    HYGIENE_TYPES.map(
      (hygiene) => ({
        id: hygieneNotificationId(
          dogId,
          hygiene.id
        )
      })
    );

  try {
    await LocalNotifications.cancel({
      notifications: ids
    });
  } catch {
    // Nothing to cancel is fine.
  }

  const toSchedule = [];

  for (const hygieneType of HYGIENE_TYPES) {
    const intervalDays =
      dog[hygieneType.intervalField] ||
      hygieneType.defaultInterval;

    const lastEvent =
      events
        .filter(
          (event) =>
            event.type === hygieneType.id
        )
        .sort(
          (a, b) =>
            b.timestamp - a.timestamp
        )[0];

    // If never logged, start counting from today.
    const baseTimestamp =
      lastEvent
        ? lastEvent.timestamp
        : Date.now();

    const dueDate =
      new Date(
        baseTimestamp +
        intervalDays *
          24 *
          60 *
          60 *
          1000
      );

    // Hygiene reminders are intentionally at 09:00.
    dueDate.setHours(
      9,
      0,
      0,
      0
    );

    const now = new Date();

    // If already due, schedule tomorrow at 09:00.
    if (dueDate <= now) {
      dueDate.setDate(
        dueDate.getDate() + 1
      );
    }

    toSchedule.push({
      id: hygieneNotificationId(
        dogId,
        hygieneType.id
      ),

      title: hygieneType.notifTitle,

      body:
        hygieneType.notifBody(
          dog.name
        ),

      schedule: {
        at: dueDate,
        allowWhileIdle: true
      },

      extra: {
        careType: hygieneType.id,
        dogId
      }
    });
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({
      notifications: toSchedule
    });
  }
}


// ============================================================
// DATE HELPERS
// ============================================================

function getReminderDateForDay(
  hour,
  minute,
  dayOffset
) {
  const date = new Date();

  date.setHours(
    hour,
    minute,
    0,
    0
  );

  date.setDate(
    date.getDate() + dayOffset
  );

  return date;
}


// ============================================================
// SMART FEED / WALK REMINDERS
// ============================================================

export async function scheduleSmartReminders(
  householdId,
  dogId
) {
  const dog =
    await getDog(
      householdId,
      dogId
    );

  if (!dog) {
    return;
  }

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

  const todayStart =
    startOfToday();

  const todayEvents =
    events.filter(
      (event) =>
        event.timestamp >= todayStart
    );

  const feedCountToday =
    todayEvents.filter(
      (event) =>
        event.type === 'feed'
    ).length;

  const walkedToday =
    todayEvents.some(
      (event) =>
        event.type === 'walk'
    );


  // ----------------------------------------------------------
  // CANCEL OLD + NEW NORMAL REMINDERS
  // ----------------------------------------------------------

  const idsToCancel = [];

  for (const slot of slots) {
    // New one-shot window.
    for (
      let dayOffset = 0;
      dayOffset < REMINDER_WINDOW_DAYS;
      dayOffset++
    ) {
      idsToCancel.push({
        id: notificationIdFor(
          dogId,
          slot.id,
          dayOffset
        )
      });
    }

    // Old repeating ID.
    idsToCancel.push({
      id: legacyNotificationIdFor(
        dogId,
        slot.id
      )
    });
  }

  if (idsToCancel.length > 0) {
    try {
      await LocalNotifications.cancel({
        notifications: idsToCancel
      });
    } catch (error) {
      console.warn(
        'Failed cancelling previous smart reminders:',
        error
      );
    }
  }


  // ----------------------------------------------------------
  // BUILD NEW 7-DAY WINDOW
  // ----------------------------------------------------------

  const now = new Date();

  const toSchedule = [];

  for (const slot of slots) {

    // If the care requirement is already fulfilled
    // today, don't schedule today's occurrence.
    //
    // Future days still get scheduled normally.
    const skipToday =
      (
        slot.careType === 'feed' &&
        feedCountToday >= 2
      ) ||
      (
        slot.careType === 'walk' &&
        walkedToday
      );


    for (
      let dayOffset = 0;
      dayOffset < REMINDER_WINDOW_DAYS;
      dayOffset++
    ) {
      const fireDate =
        getReminderDateForDay(
          slot.hour,
          slot.minute,
          dayOffset
        );

      // Never schedule a notification in the past.
      if (fireDate <= now) {
        continue;
      }

      // Only skip the current day's reminder.
      if (
        dayOffset === 0 &&
        skipToday
      ) {
        continue;
      }

      toSchedule.push({
        id: notificationIdFor(
          dogId,
          slot.id,
          dayOffset
        ),

        title: slot.title,

        body:
          slot.body(dog.name),

        schedule: {
          at: fireDate,
          allowWhileIdle: true
        },

        extra: {
          careType: slot.careType,
          dogId
        }
      });
    }
  }


  // ----------------------------------------------------------
  // SCHEDULE IN ONE BATCH
  // ----------------------------------------------------------

  if (toSchedule.length > 0) {
    console.log(
      `Scheduling ${toSchedule.length} smart notifications for dog ${dogId}`
    );

    console.log(
      'Smart notification schedule:',
      toSchedule.map(
        (notification) => ({
          id: notification.id,
          at:
            notification.schedule.at,
          careType:
            notification.extra.careType,
          dogId:
            notification.extra.dogId
        })
      )
    );

    await LocalNotifications.schedule({
      notifications: toSchedule
    });
  }


  // Keep custom reminders scheduled.
  await scheduleCustomRemindersForDog(
    householdId,
    dogId
  );
}


// ============================================================
// ALL DOGS
// ============================================================

export async function scheduleRemindersForAllDogs(
  householdId,
  dogs
) {
  const allDogs =
    dogs ||
    await getAllDogs(
      householdId
    );

  // Do the dogs sequentially.
  //
  // This is intentional: it avoids firing many native
  // LocalNotifications.schedule calls simultaneously.
  for (const dog of allDogs) {
    await scheduleSmartReminders(
      householdId,
      dog.id
    );

    await scheduleHygieneReminders(
      householdId,
      dog.id
    );
  }
}


// ============================================================
// REMOVE NOTIFICATIONS FOR DOGS THAT NO LONGER EXIST
// ============================================================

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

  if (orphaned.length === 0) {
    return;
  }

  console.log(
    `Cancelling ${orphaned.length} orphaned notifications`
  );

  await LocalNotifications.cancel({
    notifications:
      orphaned.map(
        (notification) => ({
          id: notification.id
        })
      )
  });
}