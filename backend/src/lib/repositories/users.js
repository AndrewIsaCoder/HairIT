import { getDb } from '../db.js';
import { hashPassword } from '../auth.js';

const PUBLIC_COLUMNS = 'id, email, full_name AS fullName, phone, role, created_at AS createdAt';

export async function findByEmail(email) {
  const db = await getDb();
  return db.get('SELECT id, email, password_hash AS passwordHash, full_name AS fullName, phone, role FROM users WHERE email = ?', [
    String(email).toLowerCase()
  ]);
}

export async function findById(id) {
  const db = await getDb();
  return db.get(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [Number(id)]);
}

export async function createUser({ email, password, fullName, phone = '', role = 'client' }) {
  const db = await getDb();
  const passwordHash = await hashPassword(password);

  const created = await db.get(
    `INSERT INTO users (email, password_hash, full_name, phone, role)
     VALUES (?, ?, ?, ?, ?)
     RETURNING ${PUBLIC_COLUMNS}`,
    [String(email).toLowerCase(), passwordHash, fullName, phone, role]
  );

  return created;
}

export async function updateProfile(id, { fullName, phone }) {
  const db = await getDb();
  await db.run('UPDATE users SET full_name = ?, phone = ? WHERE id = ?', [fullName, phone, Number(id)]);
  return findById(id);
}

export async function updatePassword(id, password) {
  const db = await getDb();
  const passwordHash = await hashPassword(password);
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, Number(id)]);
  // toate sesiunile vechi devin invalide dupa schimbarea parolei
  await db.run('DELETE FROM sessions WHERE user_id = ?', [Number(id)]);
}

export { PUBLIC_COLUMNS };

/** Un client care isi adauga primul salon devine proprietar. */
export async function promoteToOwner(id) {
  const db = await getDb();
  await db.run("UPDATE users SET role = 'owner' WHERE id = ? AND role = 'client'", [Number(id)]);
  return findById(id);
}
