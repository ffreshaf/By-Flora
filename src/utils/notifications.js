import { LocalNotifications } from '@capacitor/local-notifications';
import { getEventsForDog } from '../db/careEvents.js';
import { startOfToday } from './reminders.js';

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

const REMINDER_DEFS = [
  { id: 1, careType: 'feed', hour: 8, minute: 0, title: 'Feeding time 🍖', body: 'Did you feed her yet?' },
  { id: 2, careType: 'feed', hour: 18, minute: 0, title: 'Feeding time 🍖', body: 'Second meal — did you feed her yet?' },
  { id: 3, careType: 'walk', hour: 17, minute: 0, title: 'Walk time 🐾', body: 'Have you taken her for a walk today?' }
];

// Call this on app load AND right after any manual log, so scheduling always reflects reality
export async function scheduleSmartReminders(dogId) {
  const events = await getEventsForDog(dogId);
  const todayEvents = events.filter((e) => e.timestamp >= startOfToday());

  const feedCountToday = todayEvents.filter((e) => e.type === 'feed').length;
  const walkedToday = todayEvents.some((e) => e.type === 'walk');

  // Cancel everything first, then only re-schedule what's still actually needed
  await LocalNotifications.cancel({ notifications: REMINDER_DEFS.map((r) => ({ id: r.id })) });

  const toSchedule = [];

  for (const reminder of REMINDER_DEFS) {
    // Skip meal reminders once 2 meals are already logged today
    if (reminder.careType === 'feed' && feedCountToday >= 2) continue;
    // Skip walk reminder if a walk's already logged today
    if (reminder.careType === 'walk' && walkedToday) continue;

    toSchedule.push({
      id: reminder.id,
      title: reminder.title,
      body: reminder.body,
      schedule: { on: { hour: reminder.hour, minute: reminder.minute }, every: 'day' },
      actionTypeId: 'CARE_CONFIRM',
      extra: { careType: reminder.careType }
    });
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: toSchedule });
  }
}