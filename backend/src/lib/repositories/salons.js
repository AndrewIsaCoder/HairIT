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

  // `reviews` din card este numarul de recenzii; il pastram separat,
  // pentru ca ruta adauga peste el lista propriu-zisa de recenzii
  return { ...salon, ...description, reviewCount: salon.reviews, services, staff, hours };
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

/* --------------------------------------------------------------- saloane */

/** Transforma un nume in slug: "Salonul Meu" -> "salonul-meu". */
export function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Gaseste un slug liber, adaugand un sufix numeric daca este nevoie. */
export async function uniqueSlug(base) {
  const db = await getDb();
  const root = slugify(base) || 'salon';

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const taken = await db.get('SELECT 1 AS ok FROM salons WHERE slug = ?', [candidate]);
    if (!taken) return candidate;
  }

  return `${root}-${Date.now()}`;
}

/** Programul implicit: luni-vineri 09:00-19:30, sambata pana la 16:00, duminica inchis. */
const DEFAULT_HOURS = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  opens: '09:00',
  closes: weekday === 6 ? '16:00' : '19:30',
  closed: weekday === 0 ? 1 : 0
}));

export async function createSalon(ownerId, salon) {
  const db = await getDb();
  const slug = await uniqueSlug(salon.name);

  const created = await db.get(
    `INSERT INTO salons (slug, name, tagline, description, category, city, address, phone, email, cover_image, owner_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id, slug`,
    [
      slug,
      salon.name,
      salon.tagline ?? '',
      salon.description ?? '',
      salon.category ?? 'Salon de coafură',
      salon.city,
      salon.address ?? '',
      salon.phone ?? '',
      salon.email ?? '',
      salon.coverImage || 'images/studio-interior.jpg',
      Number(ownerId)
    ]
  );

  await db.batch(
    DEFAULT_HOURS.map((hour) => ({
      sql: 'INSERT INTO salon_hours (salon_id, weekday, opens, closes, closed) VALUES (?, ?, ?, ?, ?)',
      args: [created.id, hour.weekday, hour.opens, hour.closes, hour.closed]
    }))
  );

  return created;
}

export async function updateSalon(id, salon) {
  const db = await getDb();
  await db.run(
    `UPDATE salons
     SET name = ?, tagline = ?, description = ?, category = ?, city = ?, address = ?, phone = ?, email = ?, cover_image = ?
     WHERE id = ?`,
    [
      salon.name,
      salon.tagline ?? '',
      salon.description ?? '',
      salon.category ?? 'Salon de coafură',
      salon.city,
      salon.address ?? '',
      salon.phone ?? '',
      salon.email ?? '',
      salon.coverImage || 'images/studio-interior.jpg',
      Number(id)
    ]
  );

  return getSalonById(id);
}

/** Inlocuieste programul de lucru al salonului. */
export async function setHours(salonId, hours) {
  const db = await getDb();
  await db.run('DELETE FROM salon_hours WHERE salon_id = ?', [Number(salonId)]);
  await db.batch(
    hours.map((hour) => ({
      sql: 'INSERT INTO salon_hours (salon_id, weekday, opens, closes, closed) VALUES (?, ?, ?, ?, ?)',
      args: [Number(salonId), Number(hour.weekday), hour.opens, hour.closes, hour.closed ? 1 : 0]
    }))
  );

  return listHours(salonId);
}

/* ----------------------------------------------------------- specialisti */

export async function createStaff(salonId, { name, role, initials }) {
  const db = await getDb();
  return db.get(
    `INSERT INTO staff (salon_id, name, role, initials)
     VALUES (?, ?, ?, ?)
     RETURNING id, salon_id AS salonId, name, role, initials, active`,
    [Number(salonId), name, role || 'Stilist', initials || autoInitials(name)]
  );
}

export async function deleteStaff(id) {
  const db = await getDb();
  await db.run('DELETE FROM staff WHERE id = ?', [Number(id)]);
}

export async function staffSalonId(id) {
  const db = await getDb();
  const row = await db.get('SELECT salon_id AS salonId FROM staff WHERE id = ?', [Number(id)]);
  return row?.salonId ?? null;
}

/** "Ana Petrescu" -> "AP" */
export function autoInitials(name) {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
