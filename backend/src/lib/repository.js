import { getDb } from './db.js';

/** Coloanele returnate catre frontend, aplatizate intr-un singur obiect. */
const SELECT_APPOINTMENT = `
  SELECT
    a.id            AS id,
    a.date          AS date,
    a.time          AS time,
    a.status        AS status,
    a.client_name   AS clientName,
    a.phone         AS phone,
    a.email         AS email,
    a.notes         AS notes,
    s.id            AS serviceId,
    s.name          AS service,
    s.category      AS category,
    s.duration_min  AS durationMin,
    s.price         AS price,
    st.id           AS stylistId,
    st.name         AS stylist,
    st.initials     AS stylistInitials
  FROM appointments a
  JOIN services s  ON s.id  = a.service_id
  JOIN stylists st ON st.id = a.stylist_id
`;

export async function listServices() {
  const db = await getDb();
  return db.all(
    'SELECT id, slug, name, description, category, duration_min AS durationMin, price FROM services ORDER BY id'
  );
}

export async function listStylists() {
  const db = await getDb();
  return db.all('SELECT id, name, role, initials FROM stylists ORDER BY id');
}

export async function listAppointments({ date, status, serviceId } = {}) {
  const db = await getDb();
  const where = [];
  const args = [];

  if (date) {
    where.push('a.date = ?');
    args.push(date);
  }
  if (status) {
    where.push('a.status = ?');
    args.push(status);
  }
  if (serviceId) {
    where.push('a.service_id = ?');
    args.push(Number(serviceId));
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return db.all(`${SELECT_APPOINTMENT} ${clause} ORDER BY a.date, a.time, st.id`, args);
}

export async function getAppointment(id) {
  const db = await getDb();
  return db.get(`${SELECT_APPOINTMENT} WHERE a.id = ?`, [Number(id)]);
}

export async function listDays() {
  const db = await getDb();
  return db.all(
    `SELECT date,
            COUNT(*)                                             AS total,
            SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available,
            SUM(CASE WHEN status = 'booked'    THEN 1 ELSE 0 END) AS booked
     FROM appointments
     GROUP BY date
     ORDER BY date`
  );
}

export async function reserveAppointment(id, { clientName, phone, email = '', notes = '' }) {
  const db = await getDb();
  const current = await getAppointment(id);

  if (!current) return { error: 'not_found' };
  if (current.status === 'booked') return { error: 'already_booked', appointment: current };

  await db.run(
    `UPDATE appointments
     SET status = 'booked', client_name = ?, phone = ?, email = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ? AND status = 'available'`,
    [clientName, phone, email, notes, Number(id)]
  );

  return { appointment: await getAppointment(id) };
}

export async function cancelAppointment(id) {
  const db = await getDb();
  const current = await getAppointment(id);

  if (!current) return { error: 'not_found' };
  if (current.status === 'available') return { error: 'not_booked', appointment: current };

  await db.run(
    `UPDATE appointments
     SET status = 'available', client_name = '', phone = '', email = '', notes = '', updated_at = datetime('now')
     WHERE id = ?`,
    [Number(id)]
  );

  return { appointment: await getAppointment(id) };
}

export async function createAppointment({ date, time, serviceId, stylistId }) {
  const db = await getDb();
  const created = await db.get(
    `INSERT INTO appointments (date, time, service_id, stylist_id, status)
     VALUES (?, ?, ?, ?, 'available')
     RETURNING id`,
    [date, time, Number(serviceId), Number(stylistId)]
  );

  return getAppointment(created.id);
}

export async function stats() {
  const db = await getDb();

  const totals = await db.get(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'booked'    THEN 1 ELSE 0 END) AS booked,
            SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available
     FROM appointments`
  );

  const revenue = await db.get(
    `SELECT COALESCE(SUM(s.price), 0) AS revenue
     FROM appointments a JOIN services s ON s.id = a.service_id
     WHERE a.status = 'booked'`
  );

  const topService = await db.get(
    `SELECT s.name AS service, COUNT(*) AS bookings
     FROM appointments a JOIN services s ON s.id = a.service_id
     WHERE a.status = 'booked'
     GROUP BY s.id ORDER BY bookings DESC LIMIT 1`
  );

  const counts = await db.get('SELECT (SELECT COUNT(*) FROM services) AS services, (SELECT COUNT(*) FROM stylists) AS stylists');

  const occupancy = totals.total ? Math.round((totals.booked / totals.total) * 100) : 0;

  return {
    total: totals.total,
    booked: totals.booked ?? 0,
    available: totals.available ?? 0,
    occupancy,
    revenue: revenue.revenue,
    topService: topService?.service ?? null,
    services: counts.services,
    stylists: counts.stylists
  };
}
