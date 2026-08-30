import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { getDb } from './db.js';

const scryptAsync = promisify(scrypt);

const COOKIE_NAME = 'hairit_session';
const SESSION_DAYS = 30;
const KEY_LENGTH = 64;

/* ---------------------------------------------------------------- parole */

/** Hash de parola in forma `scrypt:salt:hash`, ambele in hexazecimal. */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

/** Compara parola primita cu hash-ul salvat, in timp constant. */
export async function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;

  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, 'hex');

  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

/* -------------------------------------------------------------- sesiuni */

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

function expiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DAYS);
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

/** Creeaza o sesiune noua si returneaza token-ul care ajunge in cookie. */
export async function createSession(userId) {
  const db = await getDb();
  const token = randomBytes(32).toString('hex');

  await db.run('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [
    hashToken(token),
    userId,
    expiryDate()
  ]);

  return token;
}

export async function destroySession(token) {
  if (!token) return;
  const db = await getDb();
  await db.run('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
}

/** Sterge sesiunile expirate; se apeleaza ocazional, la autentificare. */
export async function pruneSessions() {
  const db = await getDb();
  await db.run("DELETE FROM sessions WHERE expires_at < datetime('now')");
}

/* -------------------------------------------------------------- cookies */

export function parseCookies(header = '') {
  return Object.fromEntries(
    String(header)
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return index === -1
          ? [part, '']
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

const isProduction = () => process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export function setSessionCookie(res, token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`
  ];
  if (isProduction()) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res) {
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProduction()) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export const readSessionToken = (req) => parseCookies(req.headers.cookie)[COOKIE_NAME];

/* ----------------------------------------------------------- middleware */

const PUBLIC_USER_COLUMNS = 'id, email, full_name AS fullName, phone, role, created_at AS createdAt';

/** Incarca utilizatorul curent in `req.user`, daca sesiunea este valida. */
export async function loadUser(req) {
  const token = readSessionToken(req);
  if (!token) return null;

  const db = await getDb();
  const user = await db.get(
    `SELECT u.id, u.email, u.full_name AS fullName, u.phone, u.role, u.created_at AS createdAt
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
    [hashToken(token)]
  );

  return user ?? null;
}

/** Middleware optional: ataseaza utilizatorul daca exista, fara sa blocheze. */
export const withUser = async (req, res, next) => {
  try {
    req.user = await loadUser(req);
    next();
  } catch (error) {
    next(error);
  }
};

/** Middleware care cere autentificare. */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Trebuie să fii autentificat pentru această acțiune.' });
  }
  next();
};

/** Middleware care cere rol de proprietar de salon. */
export const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Trebuie să fii autentificat pentru această acțiune.' });
  }
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Această zonă este disponibilă doar proprietarilor de saloane.' });
  }
  next();
};

export { COOKIE_NAME, PUBLIC_USER_COLUMNS };
