import OneSignal from '@onesignal/capacitor-plugin';

const APP_ID = '99029f45-35cb-484b-941f-fafa21c8fe2e';

let initialized = false;

export async function initPush(uid) {
  if (!uid || initialized) return;

  try {
    console.log('[OneSignal] Starting initialization...');
    console.log('[OneSignal] UID:', uid);

    await OneSignal.initialize(APP_ID);

    console.log('[OneSignal] Initialized successfully');

    const granted =
      await OneSignal.Notifications.requestPermission(true);

    console.log(
      '[OneSignal] Notification permission:',
      granted
    );

    await OneSignal.login(uid);

    console.log(
      '[OneSignal] Logged in with external ID:',
      uid
    );

    const onesignalId =
      await OneSignal.User.getOnesignalId();

    const externalId =
      await OneSignal.User.getExternalId();

    const subscriptionId =
      await OneSignal.User.pushSubscription.getIdAsync();

    const pushToken =
      await OneSignal.User.pushSubscription.getTokenAsync();

    const optedIn =
      await OneSignal.User.pushSubscription.getOptedInAsync();

    console.log('[OneSignal] User ID:', onesignalId);
    console.log('[OneSignal] External ID:', externalId);
    console.log('[OneSignal] Subscription ID:', subscriptionId);
    console.log('[OneSignal] Push token:', pushToken);
    console.log('[OneSignal] Opted in:', optedIn);

    initialized = true;

    return {
      onesignalId,
      externalId,
      subscriptionId,
      pushToken,
      optedIn,
    };
  } catch (err) {
    console.error(
      '[OneSignal] INITIALIZATION ERROR:',
      err
    );
  }
}