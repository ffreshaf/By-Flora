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

export function getBathStatus(lastBathTimestamp, intervalDays = 28) {
  if (!lastBathTimestamp) {
    return {
      isDue: true,
      message: 'No bath logged yet'
    };
  }

  const lastBath = new Date(lastBathTimestamp);
  const nextBath = new Date(lastBath);

  nextBath.setDate(
    nextBath.getDate() + Number(intervalDays)
  );

  const now = new Date();

  const diffMs = nextBath - now;
  const diffDays = Math.ceil(
    diffMs / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return {
      isDue: true,
      message: 'Bath is due'
    };
  }

  if (diffDays === 1) {
    return {
      isDue: false,
      message: 'Bath due tomorrow'
    };
  }

  return {
    isDue: false,
    message: `Bath due in ${diffDays} days`
  };
}

export const PLAY_TARGET = PLAY_TARGET_MINUTES;