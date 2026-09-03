import { auth } from '../firebase.js'; 

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function notifyOtherMembers({
  household,
  loggerName,
  dogName,
  careType,
}) {
  if (!household?.id) return;

  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const idToken = await currentUser.getIdToken();

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/notify-other-members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          householdId: household.id,
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