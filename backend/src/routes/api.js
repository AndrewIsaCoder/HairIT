import { Router } from 'express';
import {
  listServices,
  listStylists,
  listAppointments,
  listDays,
  getAppointment,
  reserveAppointment,
  cancelAppointment,
  createAppointment,
  stats
} from '../lib/repository.js';

export const api = Router();

const PHONE_PATTERN = /^[+]?[0-9 ().-]{9,20}$/;
const EMAIL_PATTERN = /^[^@ ]+@[^@ ]+[.][^@ ]+$/;
const DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const TIME_PATTERN = /^[0-9]{2}:[0-9]{2}$/;

function validateReservation(body = {}) {
  const errors = {};
  const clientName = String(body.clientName ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const email = String(body.email ?? '').trim();
  const notes = String(body.notes ?? '').trim();

  if (clientName.length < 3) errors.clientName = 'Numele trebuie să aibă minim 3 caractere.';
  if (clientName.length > 60) errors.clientName = 'Numele este prea lung.';
  if (!PHONE_PATTERN.test(phone)) errors.phone = 'Numărul de telefon nu este valid.';
  if (email && !EMAIL_PATTERN.test(email)) errors.email = 'Adresa de email nu este validă.';
  if (notes.length > 300) errors.notes = 'Mesajul poate avea maxim 300 de caractere.';

  return { errors, value: { clientName, phone, email, notes } };
}

api.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hairit-api', time: new Date().toISOString() });
});

api.get('/services', (req, res) => {
  res.json(listServices());
});

api.get('/stylists', (req, res) => {
  res.json(listStylists());
});

api.get('/stats', (req, res) => {
  res.json(stats());
});

api.get('/appointments/days', (req, res) => {
  res.json(listDays());
});

api.get('/appointments', (req, res) => {
  const { date, status, serviceId } = req.query;

  if (date && !DATE_PATTERN.test(String(date))) {
    return res.status(400).json({ message: 'Parametrul date trebuie să fie de forma YYYY-MM-DD.' });
  }
  if (status && !['available', 'booked'].includes(String(status))) {
    return res.status(400).json({ message: "Parametrul status accepta doar 'available' sau 'booked'." });
  }

  res.json(listAppointments({ date, status, serviceId }));
});

api.get('/appointments/:id', (req, res) => {
  const appointment = getAppointment(req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Programarea nu a fost găsită.' });
  res.json(appointment);
});

api.post('/appointments', (req, res) => {
  const { date, time, serviceId, stylistId } = req.body ?? {};

  if (!DATE_PATTERN.test(String(date ?? ''))) {
    return res.status(400).json({ message: 'Data trebuie să fie de forma YYYY-MM-DD.' });
  }
  if (!TIME_PATTERN.test(String(time ?? ''))) {
    return res.status(400).json({ message: 'Ora trebuie să fie de forma HH:MM.' });
  }
  if (!serviceId || !stylistId) {
    return res.status(400).json({ message: 'Serviciul și stilistul sunt obligatorii.' });
  }

  try {
    res.status(201).json(createAppointment({ date, time, serviceId, stylistId }));
  } catch (error) {
    res.status(409).json({ message: 'Intervalul este deja definit pentru acest stilist.', detail: error.message });
  }
});

api.post('/appointments/:id/reserve', (req, res) => {
  const { errors, value } = validateReservation(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Datele trimise nu sunt valide.', errors });
  }

  const result = reserveAppointment(req.params.id, value);
  if (result.error === 'not_found') {
    return res.status(404).json({ message: 'Programarea nu a fost găsită.' });
  }
  if (result.error === 'already_booked') {
    return res.status(409).json({ message: 'Programarea este deja rezervată.', appointment: result.appointment });
  }

  res.json(result.appointment);
});

api.post('/appointments/:id/cancel', (req, res) => {
  const result = cancelAppointment(req.params.id);
  if (result.error === 'not_found') {
    return res.status(404).json({ message: 'Programarea nu a fost găsită.' });
  }
  if (result.error === 'not_booked') {
    return res.status(409).json({ message: 'Programarea este deja liberă.', appointment: result.appointment });
  }

  res.json(result.appointment);
});
