import { getDb } from '../db.js';

/** Coloanele de baza plus agregatele folosite in listari. */
const SALON_CARD = `
  SELECT
    s.id, s.slug, s.name, s.tagline, s.category, s.city, s.address,
    s.phone, s.cover_image AS coverImage,
    COALESCE(r.rating, 0)   AS rating,
    COALESCE(r.reviews, 0)  AS reviews,
    COALESCE(p.minPrice, 0) AS minPrice,
    COALESCE(p.services, 0) AS serviceCount,
    COALESCE(a.freeSlots, 0) AS freeSlots
  FROM salons s
  LEFT JOIN (
    SELECT salon_id, ROUND(AVG(rating), 1) AS rating, COUNT(*) AS reviews
    FROM reviews GROUP BY salon_id
  ) r ON r.salon_id = s.id
  LEFT JOIN (
    SELECT salon_id, MIN(price) AS minPrice, COUNT(*) AS services
    FROM services GROUP BY salon_id
  ) p ON p.salon_id = s.id
  LEFT JOIN (
    SELECT salon_id, COUNT(*) AS freeSlots
    FROM appointments
    WHERE status = 'available' AND date >= date('now')
    GROUP BY salon_id
  ) a ON a.salon_id = s.id
`;

/** Cauta saloane dupa oras, categorie sau text liber. */
export async function listSalons({ city, category, q, favoritesOf } = {}) {
  const db = await getDb();
  const where = [];
  const args = [];

  if (city) {
    where.push('s.city = ?');
    args.push(city);
  }
  if (category) {
    where.push('s.category = ?');
    args.push(category);
  }
  if (q) {
    where.push(`(
      s.name LIKE ? OR s.tagline LIKE ? OR s.city LIKE ?
      OR EXISTS (SELECT 1 FROM services sv WHERE sv.salon_id = s.id AND sv.name LIKE ?)
    )`);
    const term = `%${q}%`;
    args.push(term, term, term, term);
  }
  if (favoritesOf) {
    where.push('EXISTS (SELECT 1 FROM favorites f WHERE f.salon_id = s.id AND f.user_id = ?)');
    args.push(Number(favoritesOf));
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return db.all(`${SALON_CARD} ${clause} ORDER BY rating DESC, reviews DESC, s.name`, args);
}

export async function getSalonBySlug(slug) {
  const db = await getDb();
  const salon = await db.get(`${SALON_CARD} WHERE s.slug = ?`, [slug]);
  if (!salon) return null;

  const [services, staff, hours, description] = await Promise.all([
    listServices(salon.id),
    listStaff(salon.id),
    listHours(salon.id),
    db.get('SELECT description, email FROM salons WHERE id = ?', [salon.id])
  ]);

  return { ...salon, ...description, services, staff, hours };
}

export async function getSalonById(id) {
  const db = await getDb();
  return db.get(`${SALON_CARD} WHERE s.id = ?`, [Number(id)]);
}

export async function listServices(salonId) {
  const db = await getDb();
  return db.all(
    `SELECT id, salon_id AS salonId, slug, name, description, category,
            duration_min AS durationMin, price
     FROM services WHERE salon_id = ? ORDER BY id`,
    [Number(salonId)]
  );
}

export async function listStaff(salonId) {
  const db = await getDb();
  return db.all(
    'SELECT id, salon_id AS salonId, name, role, initials, active FROM staff WHERE salon_id = ? AND active = 1 ORDER BY id',
    [Number(salonId)]
  );
}

export async function listHours(salonId) {
  const db = await getDb();
  return db.all(
    'SELECT weekday, opens, closes, closed FROM salon_hours WHERE salon_id = ? ORDER BY weekday',
    [Number(salonId)]
  );
}

export async function listCities() {
  const db = await getDb();
  return db.all('SELECT city, COUNT(*) AS salons FROM salons GROUP BY city ORDER BY salons DESC, city');
}

export async function listCategories() {
  const db = await getDb();
  return db.all('SELECT category, COUNT(*) AS salons FROM salons GROUP BY category ORDER BY salons DESC, category');
}

export async function listSalonsByOwner(ownerId) {
  const db = await getDb();
  return db.all(`${SALON_CARD} WHERE s.owner_id = ? ORDER BY s.name`, [Number(ownerId)]);
}

export async function ownsSalon(userId, salonId) {
  const db = await getDb();
  const row = await db.get('SELECT 1 AS ok FROM salons WHERE id = ? AND owner_id = ?', [
    Number(salonId),
    Number(userId)
  ]);
  return Boolean(row);
}

/* ------------------------------------------------------------- favorite */

export async function listFavoriteIds(userId) {
  const db = await getDb();
  const rows = await db.all('SELECT salon_id AS salonId FROM favorites WHERE user_id = ?', [Number(userId)]);
  return rows.map((row) => row.salonId);
}

export async function addFavorite(userId, salonId) {
  const db = await getDb();
  await db.run('INSERT OR IGNORE INTO favorites (user_id, salon_id) VALUES (?, ?)', [
    Number(userId),
    Number(salonId)
  ]);
}

export async function removeFavorite(userId, salonId) {
  const db = await getDb();
  await db.run('DELETE FROM favorites WHERE user_id = ? AND salon_id = ?', [Number(userId), Number(salonId)]);
}

/* -------------------------------------------------------------- servicii */

export async function createService(salonId, { slug, name, description, category, durationMin, price }) {
  const db = await getDb();
  return db.get(
    `INSERT INTO services (salon_id, slug, name, description, category, duration_min, price)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     RETURNING id, salon_id AS salonId, slug, name, description, category, duration_min AS durationMin, price`,
    [Number(salonId), slug, name, description, category, Number(durationMin), Number(price)]
  );
}

export async function updateService(id, { name, description, category, durationMin, price }) {
  const db = await getDb();
  await db.run(
    'UPDATE services SET name = ?, description = ?, category = ?, duration_min = ?, price = ? WHERE id = ?',
    [name, description, category, Number(durationMin), Number(price), Number(id)]
  );
  return db.get(
    'SELECT id, salon_id AS salonId, slug, name, description, category, duration_min AS durationMin, price FROM services WHERE id = ?',
    [Number(id)]
  );
}

export async function deleteService(id) {
  const db = await getDb();
  await db.run('DELETE FROM services WHERE id = ?', [Number(id)]);
}

export async function serviceSalonId(id) {
  const db = await getDb();
  const row = await db.get('SELECT salon_id AS salonId FROM services WHERE id = ?', [Number(id)]);
  return row?.salonId ?? null;
}
