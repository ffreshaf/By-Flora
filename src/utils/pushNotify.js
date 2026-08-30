const ONESIGNAL_APP_ID = '99029f45-35cb-484b-941f-fafa21c8fe2e';
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

const ACTION_WORDS = {
  feed: 'fed',
  walk: 'walked',
  play: 'played with',
  bath: 'bathed',
  groom: 'groomed',
  nail: 'trimmed nails for',
};

export async function notifyOtherMembers({
  household,
  loggerUid,
  loggerName,
  dogName,
  careType,
}) {
  if (!household?.memberUids) return;

  const otherUids = household.memberUids.filter((uid) => uid !== loggerUid);
  if (otherUids.length === 0) return;

  if (!ONESIGNAL_REST_API_KEY) {
    console.warn('[push] Missing OneSignal REST API key — skipping notify.');
    return;
  }

  const actionWord = ACTION_WORDS[careType] || 'cared for';

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: otherUids },
        target_channel: 'push',
        headings: { en: `${dogName} update 🐾` },
        contents: { en: `${loggerName || 'Someone'} just ${actionWord} ${dogName}.` },
      }),
    });

    const result = await response.json();
    console.log('[push] notifyOtherMembers result:', result);
  } catch (err) {
    console.error('[push] Failed to notify household:', err);
  }
}