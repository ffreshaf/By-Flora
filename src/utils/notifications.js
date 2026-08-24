import { LocalNotifications } from '@capacitor/local-notifications';
import { getEventsForDog } from '../db/careEvents.js';
import { startOfToday } from './reminders.js';
import { getSetting, setSetting } from '../db/settings.js';

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

const DEFAULT_REMINDER_DEFS = [
  { id: 1, careType: 'feed', hour: 8, minute: 0, title: 'Feeding time 🍖', body: 'Did you feed her yet?' },
  { id: 2, careType: 'feed', hour: 18, minute: 0, title: 'Feeding time 🍖', body: 'Second meal — did you feed her yet?' },
  { id: 3, careType: 'walk', hour: 17, minute: 0, title: 'Walk time 🐾', body: 'Have you taken her for a walk today?' }
];

const REMINDER_TIMES_KEY = 'reminderTimes';

// Returns the current reminder definitions, with any custom hour/minute the user saved
export async function getReminderDefs() {
  const saved = await getSetting(REMINDER_TIMES_KEY);
  if (!saved) return DEFAULT_REMINDER_DEFS;

  return DEFAULT_REMINDER_DEFS.map((def) => {
    const override = saved.find((s) => s.id === def.id);
    return override ? { ...def, hour: override.hour, minute: override.minute } : def;
  });
}

// Saves just the times (id, hour, minute) — titles/bodies/careType stay fixed
export async function saveReminderTimes(times) {
  await setSetting(REMINDER_TIMES_KEY, times);
}

function getNextReminderDate(hour, minute) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export async function scheduleSmartReminders(dogId) {
  const REMINDER_DEFS = await getReminderDefs();

  const events = await getEventsForDog(dogId);
  const todayEvents = events.filter((e) => e.timestamp >= startOfToday());
  const feedCountToday = todayEvents.filter((e) => e.type === 'feed').length;
  const walkedToday = todayEvents.some((e) => e.type === 'walk');

  await LocalNotifications.cancel({
    notifications: REMINDER_DEFS.map((reminder) => ({ id: reminder.id }))
  });

  const toSchedule = [];

  for (const reminder of REMINDER_DEFS) {
    if (reminder.careType === 'feed' && feedCountToday >= 2) continue;
    if (reminder.careType === 'walk' && walkedToday) continue;

    const nextDate = getNextReminderDate(reminder.hour, reminder.minute);

    toSchedule.push({
      id: reminder.id,
      title: reminder.title,
      body: reminder.body,
      schedule: {
        at: nextDate,
        repeats: true,
        every: 'day',
        allowWhileIdle: true
      },
      actionTypeId: 'CARE_CONFIRM',
      extra: { careType: reminder.careType }
    });
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: toSchedule });
  }
}