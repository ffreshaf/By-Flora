const PLAY_TARGET_MINUTES = 20; // baseline daily enrichment/play guideline
const BATH_INTERVAL_DAYS = 28;

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function daysSince(timestamp) {
  if (!timestamp) return null;
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

export function getBathStatus(lastBathTimestamp) {
  const since = daysSince(lastBathTimestamp);
  if (since === null) {
    return { isDue: true, message: 'No bath logged yet' };
  }
  const dueInDays = BATH_INTERVAL_DAYS - since;
  return {
    isDue: dueInDays <= 0,
    message: dueInDays <= 0
      ? `Overdue by ${Math.abs(dueInDays)} day${Math.abs(dueInDays) === 1 ? '' : 's'}`
      : `Due in ${dueInDays} day${dueInDays === 1 ? '' : 's'} · last: ${since}d ago`
  };
}

export const PLAY_TARGET = PLAY_TARGET_MINUTES;