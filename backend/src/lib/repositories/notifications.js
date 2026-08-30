import { getDb } from '../db.js';

/**
 * Notificarile sunt stocate in baza de date si afisate in aplicatie.
 * Acelasi mesaj este scris si in log, ca sa se vada unde s-ar trimite
 * emailul sau SMS-ul atunci cand se conecteaza un furnizor extern.
 */
export async function notify(userId, { type = 'info', title, body = '', appointmentId = null }) {
  if (!userId) return;

  const db = await getDb();
  await db.run(
    'INSERT INTO notifications (user_id, type, title, body, appointment_id) VALUES (?, ?, ?, ?, ?)',
    [Number(userId), type, title, body, appointmentId ? Number(appointmentId) : null]
  );

  console.log(`[notificare] utilizator ${userId} · ${type} · ${title}`);
}

export async function listForUser(userId, { limit = 30 } = {}) {
  const db = await getDb();
  return db.all(
    `SELECT id, type, title, body, appointment_id AS appointmentId, is_read AS isRead, created_at AS createdAt
     FROM notifications WHERE user_id = ?
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT ?`,
    [Number(userId), Number(limit)]
  );
}

export async function unreadCount(userId) {
  const db = await getDb();
  const row = await db.get('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0', [
    Number(userId)
  ]);
  return row?.n ?? 0;
}

export async function markRead(userId, id) {
  const db = await getDb();
  await db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [
    Number(id),
    Number(userId)
  ]);
}

export async function markAllRead(userId) {
  const db = await getDb();
  await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [Number(userId)]);
}
