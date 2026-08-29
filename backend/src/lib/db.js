import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', '..', 'data');

mkdirSync(dataDir, { recursive: true });

export const dbPath = process.env.HAIRIT_DB ?? join(dataDir, 'hairit.db');

export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

/** Creeaza schema daca nu exista deja. Se apeleaza la fiecare pornire. */
export function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      slug         TEXT    NOT NULL UNIQUE,
      name         TEXT    NOT NULL,
      description  TEXT    NOT NULL DEFAULT '',
      category     TEXT    NOT NULL DEFAULT 'Par',
      duration_min INTEGER NOT NULL DEFAULT 60,
      price        INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS stylists (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT NOT NULL,
      role     TEXT NOT NULL DEFAULT 'Hair stylist',
      initials TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT    NOT NULL,
      time        TEXT    NOT NULL,
      service_id  INTEGER NOT NULL REFERENCES services(id),
      stylist_id  INTEGER NOT NULL REFERENCES stylists(id),
      status      TEXT    NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked')),
      client_name TEXT    NOT NULL DEFAULT '',
      phone       TEXT    NOT NULL DEFAULT '',
      email       TEXT    NOT NULL DEFAULT '',
      notes       TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE (date, time, stylist_id)
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_date   ON appointments (date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
  `);
}

export function closeDb() {
  db.close();
}
