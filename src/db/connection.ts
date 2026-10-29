import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.dirname(env.DB_FILE);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(env.DB_FILE);

  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  dbInstance.exec('PRAGMA busy_timeout = 5000;');
  dbInstance.exec('PRAGMA synchronous = NORMAL;');

  return dbInstance;
}

export function initDbSchema(): void {
  const db = getDb();
  const schemaPath = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
