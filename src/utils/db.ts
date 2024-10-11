import { openDB, DBSchema, IDBPDatabase } from "idb";
import { StatsEntry } from "../types";

interface TelegramStats extends DBSchema {
  "telegram-stats": {
    key: string;
    value: StatsEntry;
  };
}

const DB_NAME = "TelegramStatsDB";
const STORE_NAME = "telegram-stats";

let db: IDBPDatabase<TelegramStats> | null = null;

export async function openDatabase() {
  if (!db) {
    db = await openDB<TelegramStats>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return db;
}

export async function saveStats(stats: StatsEntry) {
  const db = await openDatabase();
  await db.put(STORE_NAME, stats, stats.id);
}

export async function getStats(id: string) {
  const db = await openDatabase();
  return await db.get(STORE_NAME, id);
}

export async function getAllStats() {
  const db = await openDatabase();
  return await db.getAll(STORE_NAME);
}

export async function deleteStats(id: string) {
  const db = await openDatabase();
  await db.delete(STORE_NAME, id);
}

function generateUniqueId(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export { generateUniqueId };
