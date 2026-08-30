import { Router } from 'express';
import { route, validate, PHONE_PATTERN, EMAIL_PATTERN } from '../lib/route.js';
import { requireAuth } from '../lib/auth.js';
import { getAppointment, reserve, cancel, reschedule } from '../lib/repositories/appointments.js';
import { ownsSalon } from '../lib/repositories/salons.js';

export const appointments = Router();

const RESERVE_RULES = {
  clientName: {
    required: true,
    min: 3,
    max: 60,
    messages: { required: 'Numele este obligatoriu.', min: 'Numele trebuie să aibă minim 3 caractere.' }
  },
  phone: {
    required: true,
    pattern: PHONE_PATTERN,
    messages: { required: 'Telefonul este obligatoriu.', pattern: 'Numărul de telefon nu este valid.' }
  },
  email: { pattern: EMAIL_PATTERN, messages: { pattern: 'Adresa de email nu este validă.' } },
  notes: { max: 300, messages: { max: 'Mesajul poate avea maxim 300 de caractere.' } }
};

appointments.get(
  '/:id',
  route(async (req, res) => {
    const appointment = await getAppointment(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Programarea nu a fost găsită.' });
    res.json(appointment);
  })
);

appointments.post(
  '/:id/reserve',
  requireAuth,
  route(async (req, res) => {
    const { errors, value } = validate(req.body, RESERVE_RULES);
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ message: 'Verifică datele introduse.', errors });
    }

    const result = await reserve(req.params.id, { ...value, userId: req.user.id });

    if (result.error === 'not_found') {
      return res.status(404).json({ message: 'Programarea nu a fost găsită.' });
    }
    if (result.error === 'already_booked') {
      return res.status(409).json({
        message: 'Intervalul tocmai a fost rezervat de altcineva. Alege altă oră.',
        appointment: result.appointment
      });
    }

    res.json(result.appointment);
  })
);

/** Anuleaza rezervarea: fie clientul care a facut-o, fie proprietarul salonului. */
appointments.post(
  '/:id/cancel',
  requireAuth,
  route(async (req, res) => {
    const current = await getAppointment(req.params.id);
    if (!current) return res.status(404).json({ message: 'Programarea nu a fost găsită.' });

    const isClient = current.userId === req.user.id;
    const isOwner = req.user.role === 'owner' && (await ownsSalon(req.user.id, current.salonId));

    if (!isClient && !isOwner) {
      return res.status(403).json({ message: 'Poți anula doar propriile programări.' });
    }

    const result = await cancel(req.params.id, { actor: isClient ? 'client' : 'salon' });
    if (result.error === 'not_booked') {
      return res.status(409).json({ message: 'Programarea este deja liberă.', appointment: result.appointment });
    }

    res.json(result.appointment);
  })
);

/** Muta rezervarea pe alt interval liber din acelasi salon. */
appointments.post(
  '/:id/reschedule',
  requireAuth,
  route(async (req, res) => {
    const targetId = Number(req.body?.targetId);
    if (!targetId) return res.status(400).json({ message: 'Alege intervalul nou.' });

    const current = await getAppointment(req.params.id);
    if (!current) return res.status(404).json({ message: 'Programarea nu a fost găsită.' });

    const isClient = current.userId === req.user.id;
    const isOwner = req.user.role === 'owner' && (await ownsSalon(req.user.id, current.salonId));
    if (!isClient && !isOwner) {
      return res.status(403).json({ message: 'Poți reprograma doar propriile programări.' });
    }

    const result = await reschedule(req.params.id, targetId);

    if (result.error === 'not_found') return res.status(404).json({ message: 'Intervalul ales nu există.' });
    if (result.error === 'already_booked') {
      return res.status(409).json({ message: 'Intervalul ales tocmai a fost ocupat.' });
    }
    if (result.error === 'other_salon') {
      return res.status(400).json({ message: 'Reprogramarea se poate face doar în același salon.' });
    }
    if (result.error === 'not_booked') {
      return res.status(409).json({ message: 'Programarea nu este activă.' });
    }

    res.json(result.appointment);
  })
);
