import Dexie from 'dexie';

export const db = new Dexie('ByFloraDB');

db.version(1).stores({
  dogs: '++id, name',
  careEvents: '++id, dogId, type, timestamp'
});

// careEvents.type will be one of: 'feed' | 'walk' | 'play' | 'bath'