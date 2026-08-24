import { LocalNotifications } from '@capacitor/local-notifications';
import { getEventsForDog } from '../db/careEvents.js';
import { startOfToday } from './reminders.js';
import { getSetting, setSetting } from '../db/settings.js';
import { getAllDogs, getDog, updateDog } from '../db/dogs.js';

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

const DEFAULT_SLOTS = [
  { id: 1, careType: 'feed', hour: 8, minute: 0, title: 'Feeding time 🍖', body: (name) => `Did you feed ${name} yet?` },
  { id: 2, careType: 'feed', hour: 18, minute: 0, title: 'Feeding time 🍖', body: (name) => `Second meal — did you feed ${name} yet?` },
  { id: 3, careType: 'walk', hour: 17, minute: 0, title: 'Walk time 🐾', body: (name) => `Have you taken ${name} for a walk today?` }
];

const GLOBAL_REMINDER_TIMES_KEY = 'reminderTimes';

function mergeTimes(overrides) {
  if (!overrides) return DEFAULT_SLOTS;
  return DEFAULT_SLOTS.map((slot) => {
    const override = overrides.find((o) => o.id === slot.id);
    return override ? { ...slot, hour: override.hour, minute: override.minute } : slot;
  });
}

// The app-wide default times (used by any dog without its own override)
export async function getGlobalReminderSlots() {
  const saved = await getSetting(GLOBAL_REMINDER_TIMES_KEY);
  return mergeTimes(saved);
}

export async function saveGlobalReminderTimes(times) {
  await setSetting(GLOBAL_REMINDER_TIMES_KEY, times);
}

// The times that actually apply to a SPECIFIC dog — its own override if set, else the global default
export async function getReminderSlotsForDog(dogId) {
  const dog = await getDog(dogId);
  if (dog?.reminderTimes) {
    return mergeTimes(dog.reminderTimes);
  }
  return getGlobalReminderSlots();
}

export async function saveDogReminderTimes(dogId, times) {
  await updateDog(dogId, { reminderTimes: times });
}

export async function clearDogReminderOverride(dogId) {
  await updateDog(dogId, { reminderTimes: null });
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

function notificationIdFor(dogId, slotId) {
  return dogId * 100 + slotId;
}

export async function scheduleSmartReminders(dogId) {
  const dog = await getDog(dogId);
  if (!dog) return;

  const slots = await getReminderSlotsForDog(dogId);

  const events = await getEventsForDog(dogId);
  const todayEvents = events.filter((e) => e.timestamp >= startOfToday());
  const feedCountToday = todayEvents.filter((e) => e.type === 'feed').length;
  const walkedToday = todayEvents.some((e) => e.type === 'walk');

  await LocalNotifications.cancel({
    notifications: slots.map((slot) => ({ id: notificationIdFor(dogId, slot.id) }))
  });

  const toSchedule = [];

  for (const slot of slots) {
    if (slot.careType === 'feed' && feedCountToday >= 2) continue;
    if (slot.careType === 'walk' && walkedToday) continue;

    const nextDate = getNextReminderDate(slot.hour, slot.minute);

    toSchedule.push({
      id: notificationIdFor(dogId, slot.id),
      title: slot.title,
      body: slot.body(dog.name),
      schedule: { at: nextDate, repeats: true, every: 'day', allowWhileIdle: true },
      actionTypeId: 'CARE_CONFIRM',
      extra: { careType: slot.careType, dogId }
    });
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: toSchedule });
  }
}

export async function scheduleRemindersForAllDogs() {
  const dogs = await getAllDogs();
  for (const dog of dogs) {
    await scheduleSmartReminders(dog.id);
  }
}