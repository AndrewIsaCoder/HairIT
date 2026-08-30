/**
 * Schema bazei de date.
 *
 * Aplicatia este un marketplace: mai multe saloane, fiecare cu propriile
 * servicii, specialisti si program de lucru. Utilizatorii au cont si isi
 * gestioneaza programarile, favoritele, recenziile si notificarile.
 */
export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    full_name     TEXT    NOT NULL,
    phone         TEXT    NOT NULL DEFAULT '',
    role          TEXT    NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'owner')),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS salons (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    tagline     TEXT    NOT NULL DEFAULT '',
    description TEXT    NOT NULL DEFAULT '',
    category    TEXT    NOT NULL DEFAULT 'Salon',
    city        TEXT    NOT NULL,
    address     TEXT    NOT NULL DEFAULT '',
    phone       TEXT    NOT NULL DEFAULT '',
    email       TEXT    NOT NULL DEFAULT '',
    cover_image TEXT    NOT NULL DEFAULT '',
    owner_id    INTEGER REFERENCES users(id),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS salon_hours (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    salon_id INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    weekday  INTEGER NOT NULL,
    opens    TEXT    NOT NULL DEFAULT '09:00',
    closes   TEXT    NOT NULL DEFAULT '19:00',
    closed   INTEGER NOT NULL DEFAULT 0,
    UNIQUE (salon_id, weekday)
  );

  CREATE TABLE IF NOT EXISTS staff (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    salon_id INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name     TEXT    NOT NULL,
    role     TEXT    NOT NULL DEFAULT 'Stilist',
    initials TEXT    NOT NULL DEFAULT '',
    active   INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS services (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    salon_id     INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    slug         TEXT    NOT NULL,
    name         TEXT    NOT NULL,
    description  TEXT    NOT NULL DEFAULT '',
    category     TEXT    NOT NULL DEFAULT 'Păr',
    duration_min INTEGER NOT NULL DEFAULT 60,
    price        INTEGER NOT NULL DEFAULT 0,
    UNIQUE (salon_id, slug)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    salon_id    INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    staff_id    INTEGER NOT NULL REFERENCES staff(id),
    service_id  INTEGER NOT NULL REFERENCES services(id),
    user_id     INTEGER REFERENCES users(id),
    date        TEXT    NOT NULL,
    time        TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'available'
                CHECK (status IN ('available', 'booked', 'completed', 'cancelled')),
    client_name TEXT    NOT NULL DEFAULT '',
    phone       TEXT    NOT NULL DEFAULT '',
    email       TEXT    NOT NULL DEFAULT '',
    notes       TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (salon_id, staff_id, date, time)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    salon_id   INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT    NOT NULL DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (salon_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    salon_id   INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, salon_id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type           TEXT    NOT NULL DEFAULT 'info',
    title          TEXT    NOT NULL,
    body           TEXT    NOT NULL DEFAULT '',
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    is_read        INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_appointments_lookup ON appointments (salon_id, date, status);
  CREATE INDEX IF NOT EXISTS idx_appointments_user   ON appointments (user_id, date);
  CREATE INDEX IF NOT EXISTS idx_services_salon      ON services (salon_id);
  CREATE INDEX IF NOT EXISTS idx_staff_salon         ON staff (salon_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_salon       ON reviews (salon_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user  ON notifications (user_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_salons_city         ON salons (city);
`;
