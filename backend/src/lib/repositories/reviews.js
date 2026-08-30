import { getDb } from '../db.js';

export async function listForSalon(salonId, { limit = 20 } = {}) {
  const db = await getDb();
  return db.all(
    `SELECT r.id, r.rating, r.comment, r.created_at AS createdAt,
            u.full_name AS author
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.salon_id = ?
     ORDER BY datetime(r.created_at) DESC, r.id DESC
     LIMIT ?`,
    [Number(salonId), Number(limit)]
  );
}

export async function findByUser(salonId, userId) {
  const db = await getDb();
  return db.get('SELECT id, rating, comment FROM reviews WHERE salon_id = ? AND user_id = ?', [
    Number(salonId),
    Number(userId)
  ]);
}

/** Un utilizator poate lasa recenzie doar daca a avut o programare la salon. */
export async function hasVisited(salonId, userId) {
  const db = await getDb();
  const row = await db.get(
    `SELECT 1 AS ok FROM appointments
     WHERE salon_id = ? AND user_id = ? AND status IN ('booked', 'completed') LIMIT 1`,
    [Number(salonId), Number(userId)]
  );
  return Boolean(row);
}

export async function upsert(salonId, userId, { rating, comment = '' }) {
  const db = await getDb();
  await db.run(
    `INSERT INTO reviews (salon_id, user_id, rating, comment)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (salon_id, user_id)
     DO UPDATE SET rating = excluded.rating, comment = excluded.comment, created_at = datetime('now')`,
    [Number(salonId), Number(userId), Number(rating), comment]
  );

  return findByUser(salonId, userId);
}

export async function remove(salonId, userId) {
  const db = await getDb();
  await db.run('DELETE FROM reviews WHERE salon_id = ? AND user_id = ?', [Number(salonId), Number(userId)]);
}
