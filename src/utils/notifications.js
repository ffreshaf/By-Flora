import { LocalNotifications } from '@capacitor/local-notifications';

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

// TEMPORARY TEST VERSION — replace hour/minute below with 2-3 min from your phone's current time
export async function scheduleDailyReminders() {
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: 'Feeding time 🍖',
        body: 'Did you feed her yet?',
        schedule: { on: { hour: 4, minute: 2 } }, // ⚠️ CHANGE THIS to a couple min from now
        actionTypeId: 'CARE_CONFIRM',
        extra: { careType: 'feed' }
      }
    ]
  });
}