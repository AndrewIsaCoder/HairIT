import { db } from './db.js';

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

export function listServices() {
  return db
    .prepare('SELECT id, slug, name, description, category, duration_min AS durationMin, price FROM services ORDER BY id')
    .all();
}

export function listStylists() {
  return db.prepare('SELECT id, name, role, initials FROM stylists ORDER BY id').all();
}

export function listAppointments({ date, status, serviceId } = {}) {
  const where = [];
  const params = {};

  if (date) {
    where.push('a.date = :date');
    params.date = date;
  }
  if (status) {
    where.push('a.status = :status');
    params.status = status;
  }
  if (serviceId) {
    where.push('a.service_id = :serviceId');
    params.serviceId = Number(serviceId);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return db.prepare(`${SELECT_APPOINTMENT} ${clause} ORDER BY a.date, a.time, st.id`).all(params);
}

export function getAppointment(id) {
  return db.prepare(`${SELECT_APPOINTMENT} WHERE a.id = ?`).get(Number(id));
}

export function listDays() {
  return db
    .prepare(
      `SELECT date,
              COUNT(*)                                       AS total,
              SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available,
              SUM(CASE WHEN status = 'booked'    THEN 1 ELSE 0 END) AS booked
       FROM appointments
       GROUP BY date
       ORDER BY date`
    )
    .all();
}

export function reserveAppointment(id, { clientName, phone, email = '', notes = '' }) {
  const current = getAppointment(id);
  if (!current) return { error: 'not_found' };
  if (current.status === 'booked') return { error: 'already_booked', appointment: current };

  db.prepare(
    `UPDATE appointments
     SET status = 'booked', client_name = ?, phone = ?, email = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(clientName, phone, email, notes, Number(id));

  return { appointment: getAppointment(id) };
}

export function cancelAppointment(id) {
  const current = getAppointment(id);
  if (!current) return { error: 'not_found' };
  if (current.status === 'available') return { error: 'not_booked', appointment: current };

  db.prepare(
    `UPDATE appointments
     SET status = 'available', client_name = '', phone = '', email = '', notes = '', updated_at = datetime('now')
     WHERE id = ?`
  ).run(Number(id));

  return { appointment: getAppointment(id) };
}

export function createAppointment({ date, time, serviceId, stylistId }) {
  const info = db
    .prepare("INSERT INTO appointments (date, time, service_id, stylist_id, status) VALUES (?, ?, ?, ?, 'available')")
    .run(date, time, Number(serviceId), Number(stylistId));
  return getAppointment(info.lastInsertRowid);
}

export function stats() {
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'booked'    THEN 1 ELSE 0 END) AS booked,
              SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available
       FROM appointments`
    )
    .get();

  const revenue = db
    .prepare(
      `SELECT COALESCE(SUM(s.price), 0) AS revenue
       FROM appointments a JOIN services s ON s.id = a.service_id
       WHERE a.status = 'booked'`
    )
    .get();

  const topService = db
    .prepare(
      `SELECT s.name AS service, COUNT(*) AS bookings
       FROM appointments a JOIN services s ON s.id = a.service_id
       WHERE a.status = 'booked'
       GROUP BY s.id ORDER BY bookings DESC LIMIT 1`
    )
    .get();

  const occupancy = totals.total ? Math.round((totals.booked / totals.total) * 100) : 0;

  return {
    total: totals.total,
    booked: totals.booked,
    available: totals.available,
    occupancy,
    revenue: revenue.revenue,
    topService: topService?.service ?? null,
    services: listServices().length,
    stylists: listStylists().length
  };
}
