import { db } from '../db.js';

export async function logCareEvent(dogId, type, durationMinutes = null) {
  // type: 'feed' | 'walk' | 'play' | 'bath'
  return db.careEvents.add({
    dogId,
    type,
    durationMinutes,
    timestamp: Date.now()
  });
}

export async function getLastEvent(dogId, type) {
  return db.careEvents
    .where({ dogId, type })
    .last();
}

export async function getEventsForDog(dogId) {
  const events = await db.careEvents.where('dogId').equals(dogId).toArray();
  return events.sort((a, b) => b.timestamp - a.timestamp); // most recent first
}