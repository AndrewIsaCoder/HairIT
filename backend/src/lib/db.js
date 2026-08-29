import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Acces la baza de date prin doua drivere care expun aceeasi interfata:
 *
 *  - local  -> `node:sqlite`, fisier pe disc (dezvoltare, fara dependinte externe)
 *  - turso  -> `@libsql/client/web`, SQLite gazduit (productie pe Vercel)
 *
 * Driverul se alege dupa prezenta variabilei TURSO_DATABASE_URL.
 */

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', '..', 'data');

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

export const isRemote = Boolean(TURSO_URL);

async function createLocalDriver() {
  const { DatabaseSync } = await import('node:sqlite');

  mkdirSync(dataDir, { recursive: true });
  const file = process.env.HAIRIT_DB ?? join(dataDir, 'hairit.db');
  const db = new DatabaseSync(file);

  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  return {
    kind: 'local',
    label: file,
    async all(sql, args = []) {
      return db.prepare(sql).all(...args);
    },
    async get(sql, args = []) {
      return db.prepare(sql).get(...args);
    },
    async run(sql, args = []) {
      db.prepare(sql).run(...args);
    },
    async script(sql) {
      db.exec(sql);
    },
    async batch(statements) {
      db.exec('BEGIN');
      try {
        for (const { sql, args = [] } of statements) {
          db.prepare(sql).run(...args);
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    }
  };
}

async function createTursoDriver() {
  const { createClient } = await import('@libsql/client/web');
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  return {
    kind: 'turso',
    label: TURSO_URL,
    async all(sql, args = []) {
      const result = await client.execute({ sql, args });
      return result.rows.map((row) => ({ ...row }));
    },
    async get(sql, args = []) {
      const result = await client.execute({ sql, args });
      const row = result.rows[0];
      return row ? { ...row } : undefined;
    },
    async run(sql, args = []) {
      await client.execute({ sql, args });
    },
    async script(sql) {
      await client.executeMultiple(sql);
    },
    async batch(statements) {
      await client.batch(
        statements.map(({ sql, args = [] }) => ({ sql, args })),
        'write'
      );
    }
  };
}

let driverPromise = null;

/** Returneaza driverul, creat o singura data per proces. */
export function getDb() {
  driverPromise ??= isRemote ? createTursoDriver() : createLocalDriver();
  return driverPromise;
}

const SCHEMA = `
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
`;

/** Creeaza schema daca nu exista deja. */
export async function createSchema() {
  const db = await getDb();
  await db.script(SCHEMA);
}
