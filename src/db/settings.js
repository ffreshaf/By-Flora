import { db } from '../db.js';

export async function getSetting(key) {
  const row = await db.appSettings.get(key);
  return row?.value;
}

export async function setSetting(key, value) {
  return db.appSettings.put({ key, value });
}