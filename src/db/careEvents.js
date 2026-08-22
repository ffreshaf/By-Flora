import { db } from '../db.js';

export async function logCareEvent(dogId, type) {
  // type: 'feed' | 'walk' | 'play' | 'bath'
  return db.careEvents.add({
    dogId,
    type,
    timestamp: Date.now()
  });
}

export async function getLastEvent(dogId, type) {
  return db.careEvents
    .where({ dogId, type })
    .last();
}

export async function getEventsForDog(dogId) {
  return db.careEvents
    .where('dogId')
    .equals(dogId)
    .reverse()
    .sortBy('timestamp');
}