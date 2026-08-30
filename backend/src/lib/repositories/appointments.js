import { getDb } from '../db.js';
import { notify } from './notifications.js';

/** Programarea, aplatizata cu datele salonului, serviciului si specialistului. */
const SELECT_APPOINTMENT = `
  SELECT
    a.id, a.date, a.time, a.status,
    a.client_name AS clientName, a.phone, a.email, a.notes,
    a.user_id     AS userId,
    sa.id         AS salonId,
    sa.slug       AS salonSlug,
    sa.name       AS salonName,
    sa.city       AS salonCity,
    sa.address    AS salonAddress,
    sa.phone      AS salonPhone,
    sv.id         AS serviceId,
    sv.name       AS service,
    sv.category   AS category,
    sv.duration_min AS durationMin,
    sv.price      AS price,
    st.id         AS staffId,
    st.name       AS staff,
    st.initials   AS staffInitials
  FROM appointments a
  JOIN salons   sa ON sa.id = a.salon_id
  JOIN services sv ON sv.id = a.service_id
  JOIN staff    st ON st.id = a.staff_id
`;

export async function getAppointment(id) {
  const db = await getDb();
  return db.get(`${SELECT_APPOINTMENT} WHERE a.id = ?`, [Number(id)]);
}

/** Intervalele unui salon pentru o zi, optional filtrate pe serviciu sau specialist. */
export async function listSlots({ salonId, date, serviceId, staffId, status }) {
  const db = await getDb();
  const where = ['a.salon_id = ?'];
  const args = [Number(salonId)];

  if (date) {
    where.push('a.date = ?');
    args.push(date);
  }
  if (serviceId) {
    where.push('a.service_id = ?');
    args.push(Number(serviceId));
  }
  if (staffId) {
    where.push('a.staff_id = ?');
    args.push(Number(staffId));
  }
  if (status) {
    where.push('a.status = ?');
    args.push(status);
  }

  return db.all(`${SELECT_APPOINTMENT} WHERE ${where.join(' AND ')} ORDER BY a.date, a.time, st.id`, args);
}

/** Zilele cu intervale, cu numarul de locuri libere pentru fiecare. */
export async function listDays(salonId, { serviceId, staffId } = {}) {
  const db = await getDb();
  const where = ['salon_id = ?', "date >= date('now')"];
  const args = [Number(salonId)];

  if (serviceId) {
    where.push('service_id = ?');
    args.push(Number(serviceId));
  }
  if (staffId) {
    where.push('staff_id = ?');
    args.push(Number(staffId));
  }

  return db.all(
    `SELECT date,
            COUNT(*)                                              AS total,
            SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available,
            SUM(CASE WHEN status = 'booked'    THEN 1 ELSE 0 END) AS booked
     FROM appointments
     WHERE ${where.join(' AND ')}
     GROUP BY date ORDER BY date`,
    args
  );
}

export async function reserve(id, { userId, clientName, phone, email = '', notes = '' }) {
  const db = await getDb();
  const current = await getAppointment(id);

  if (!current) return { error: 'not_found' };
  if (current.status !== 'available') return { error: 'already_booked', appointment: current };

  await db.run(
    `UPDATE appointments
     SET status = 'booked', user_id = ?, client_name = ?, phone = ?, email = ?, notes = ?,
         updated_at = datetime('now')
     WHERE id = ? AND status = 'available'`,
    [userId ? Number(userId) : null, clientName, phone, email, notes, Number(id)]
  );

  const appointment = await getAppointment(id);

  await notify(userId, {
    type: 'booking',
    title: 'Programare confirmată',
    body: `${appointment.service} la ${appointment.salonName}, ${appointment.date} ora ${appointment.time}.`,
    appointmentId: appointment.id
  });

  return { appointment };
}

export async function cancel(id, { actor } = {}) {
  const db = await getDb();
  const current = await getAppointment(id);

  if (!current) return { error: 'not_found' };
  if (current.status !== 'booked') return { error: 'not_booked', appointment: current };

  const previousUserId = current.userId;

  await db.run(
    `UPDATE appointments
     SET status = 'available', user_id = NULL, client_name = '', phone = '', email = '', notes = '',
         updated_at = datetime('now')
     WHERE id = ?`,
    [Number(id)]
  );

  const appointment = await getAppointment(id);

  await notify(previousUserId, {
    type: 'cancel',
    title: 'Programare anulată',
    body:
      actor === 'salon'
        ? `Salonul ${appointment.salonName} a anulat programarea din ${appointment.date}, ora ${appointment.time}.`
        : `Ai anulat programarea de la ${appointment.salonName}, ${appointment.date} ora ${appointment.time}.`,
    appointmentId: appointment.id
  });

  return { appointment };
}

/** Muta o rezervare pe alt interval liber, pastrand datele clientului. */
export async function reschedule(id, targetId) {
  const db = await getDb();
  const [current, target] = await Promise.all([getAppointment(id), getAppointment(targetId)]);

  if (!current || !target) return { error: 'not_found' };
  if (current.status !== 'booked') return { error: 'not_booked' };
  if (target.status !== 'available') return { error: 'already_booked' };
  if (current.salonId !== target.salonId) return { error: 'other_salon' };

  await db.batch([
    {
      sql: `UPDATE appointments
            SET status = 'booked', user_id = ?, client_name = ?, phone = ?, email = ?, notes = ?,
                updated_at = datetime('now')
            WHERE id = ?`,
      args: [current.userId, current.clientName, current.phone, current.email, current.notes, Number(targetId)]
    },
    {
      sql: `UPDATE appointments
            SET status = 'available', user_id = NULL, client_name = '', phone = '', email = '', notes = '',
                updated_at = datetime('now')
            WHERE id = ?`,
      args: [Number(id)]
    }
  ]);

  const appointment = await getAppointment(targetId);

  await notify(current.userId, {
    type: 'reschedule',
    title: 'Programare mutată',
    body: `Noua oră: ${appointment.date}, ${appointment.time}, la ${appointment.salonName}.`,
    appointmentId: appointment.id
  });

  return { appointment };
}

/** Programarile unui utilizator, impartite in viitoare si trecute. */
export async function listForUser(userId) {
  const db = await getDb();
  const rows = await db.all(
    `${SELECT_APPOINTMENT} WHERE a.user_id = ? AND a.status IN ('booked', 'completed')
     ORDER BY a.date DESC, a.time DESC`,
    [Number(userId)]
  );

  const today = new Date().toISOString().slice(0, 10);
  return {
    upcoming: rows.filter((row) => row.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    past: rows.filter((row) => row.date < today)
  };
}

/** Agenda unui salon pentru o zi, folosita in panoul proprietarului. */
export async function agenda(salonId, date) {
  return listSlots({ salonId, date });
}

/** Prima zi din viitor care are intervale; folosita cand nu se cere o data anume. */
export async function firstAgendaDate(salonId) {
  const db = await getDb();
  const row = await db.get(
    "SELECT MIN(date) AS date FROM appointments WHERE salon_id = ? AND date >= date('now')",
    [Number(salonId)]
  );
  return row?.date ?? new Date().toISOString().slice(0, 10);
}

export async function salonStats(salonId) {
  const db = await getDb();

  const totals = await db.get(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'booked'    THEN 1 ELSE 0 END) AS booked,
            SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available
     FROM appointments WHERE salon_id = ? AND date >= date('now')`,
    [Number(salonId)]
  );

  const revenue = await db.get(
    `SELECT COALESCE(SUM(sv.price), 0) AS revenue
     FROM appointments a JOIN services sv ON sv.id = a.service_id
     WHERE a.salon_id = ? AND a.status = 'booked' AND a.date >= date('now')`,
    [Number(salonId)]
  );

  const booked = totals.booked ?? 0;
  const total = totals.total ?? 0;

  return {
    total,
    booked,
    available: totals.available ?? 0,
    occupancy: total ? Math.round((booked / total) * 100) : 0,
    revenue: revenue.revenue
  };
}

/** Cifrele afisate pe pagina principala a marketplace-ului. */
export async function platformStats() {
  const db = await getDb();
  const row = await db.get(`
    SELECT
      (SELECT COUNT(*) FROM salons)                                        AS salons,
      (SELECT COUNT(*) FROM services)                                      AS services,
      (SELECT COUNT(*) FROM staff WHERE active = 1)                        AS specialists,
      (SELECT COUNT(*) FROM appointments WHERE status = 'available'
        AND date >= date('now'))                                           AS freeSlots,
      (SELECT COUNT(*) FROM users)                                         AS users,
      (SELECT COUNT(*) FROM appointments WHERE status IN ('booked','completed')) AS bookings
  `);
  return row;
}
