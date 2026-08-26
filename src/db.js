import Dexie from 'dexie';

export const db = new Dexie('ByFloraDB');

db.version(1).stores({
  dogs: '++id, name',
  careEvents: '++id, dogId, type, timestamp'
});

// careEvents.type will be one of: 'feed' | 'walk' | 'play' | 'bath'

db.version(2).stores({
  dogs: '++id, name',
  careEvents: '++id, dogId, type, timestamp',
  appSettings: '&key' // simple key-value store for app-level settings
});

db.version(3).stores({
  dogs: '++id',
  careEvents: '++id, dogId, type, timestamp',
  settings: 'key',
  reminders: '++id, dogId, enabled'
});