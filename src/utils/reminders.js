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

export function getHygieneStatus(lastTimestamp, intervalDays = 28, label = 'Bath') {
  if (!lastTimestamp) {
    return {
      isDue: true,
      message: `No ${label.toLowerCase()} logged yet`
    };
  }

  const last = new Date(lastTimestamp);
  const next = new Date(last);

  next.setDate(
    next.getDate() + Number(intervalDays)
  );

  const now = new Date();

  const diffMs = next - now;
  const diffDays = Math.ceil(
    diffMs / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return {
      isDue: true,
      message: `${label} is due`
    };
  }

  if (diffDays === 1) {
    return {
      isDue: false,
      message: `${label} due tomorrow`
    };
  }

  return {
    isDue: false,
    message: `${label} due in ${diffDays} days`
  };
}

// Kept for backward compatibility with any existing callers.
export function getBathStatus(lastBathTimestamp, intervalDays = 28) {
  return getHygieneStatus(lastBathTimestamp, intervalDays, 'Bath');
}

export const PLAY_TARGET = PLAY_TARGET_MINUTES;