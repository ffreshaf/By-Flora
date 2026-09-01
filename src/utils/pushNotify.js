const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function notifyOtherMembers({
  household,
  loggerUid,
  loggerName,
  dogName,
  careType,
}) {
  if (!household?.memberUids) return;

  const otherUids = household.memberUids.filter(
    (uid) => uid !== loggerUid
  );

  if (otherUids.length === 0) return;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/notify-other-members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          otherUids,
          loggerName,
          dogName,
          careType,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || 'Notification request failed');
    }

    console.log('[push] Supabase notification result:', result);

    return result;
  } catch (err) {
    console.error('[push] Failed to notify household:', err);
  }
}