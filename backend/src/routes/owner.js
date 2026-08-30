import { Router } from 'express';
import { route, validate, DATE_PATTERN, PHONE_PATTERN, EMAIL_PATTERN } from '../lib/route.js';
import { requireAuth, requireOwner } from '../lib/auth.js';
import {
  listSalonsByOwner,
  ownsSalon,
  getSalonById,
  listServices,
  listStaff,
  listHours,
  createSalon,
  updateSalon,
  setHours,
  createService,
  updateService,
  deleteService,
  serviceSalonId,
  createStaff,
  deleteStaff,
  staffSalonId
} from '../lib/repositories/salons.js';
import {
  agenda,
  salonStats,
  listDays,
  firstAgendaDate,
  generateSlots,
  clearFreeSlots
} from '../lib/repositories/appointments.js';
import { promoteToOwner } from '../lib/repositories/users.js';
import { notify } from '../lib/repositories/notifications.js';

export const owner = Router();

const SALON_RULES = {
  name: {
    required: true,
    min: 3,
    max: 60,
    messages: { required: 'Numele salonului este obligatoriu.', min: 'Numele trebuie să aibă minim 3 caractere.' }
  },
  city: { required: true, min: 2, max: 40, messages: { required: 'Orașul este obligatoriu.' } },
  category: { required: true, min: 3, max: 40, messages: { required: 'Alege o categorie.' } },
  address: { max: 120 },
  tagline: { max: 120 },
  description: { max: 1000 },
  phone: { pattern: PHONE_PATTERN, messages: { pattern: 'Numărul de telefon nu este valid.' } },
  email: { pattern: EMAIL_PATTERN, messages: { pattern: 'Adresa de email nu este validă.' } },
  coverImage: { max: 300 }
};

/* ------------------------------------------------------ salon nou (client) */

/**
 * Adaugarea unui salon este deschisa oricarui utilizator autentificat;
 * la primul salon, contul devine automat de tip proprietar.
 */
owner.post(
  '/salons',
  requireAuth,
  route(async (req, res) => {
    const { errors, value } = validate(req.body, SALON_RULES);
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ message: 'Verifică datele salonului.', errors });
    }

    const created = await createSalon(req.user.id, value);
    await promoteToOwner(req.user.id);

    await notify(req.user.id, {
      type: 'salon',
      title: 'Salonul tău a fost creat',
      body: `${value.name} apare acum în catalog. Adaugă servicii și specialiști, apoi generează intervalele.`
    });

    const salon = await getSalonById(created.id);
    res.status(201).json(salon);
  })
);

/* --------------------------------------------- restul cere rol de owner */

owner.use(requireOwner);

/** Verifica faptul ca salonul din ruta ii apartine utilizatorului. */
const guard = route(async (req, res, next) => {
  const salonId = Number(req.params.salonId);
  if (!(await ownsSalon(req.user.id, salonId))) {
    return res.status(403).json({ message: 'Nu administrezi acest salon.' });
  }
  next();
});

owner.get(
  '/salons',
  route(async (req, res) => res.json(await listSalonsByOwner(req.user.id)))
);

owner.get(
  '/salons/:salonId',
  guard,
  route(async (req, res) => {
    const salonId = Number(req.params.salonId);
    const [salon, services, staff, hours, stats] = await Promise.all([
      getSalonById(salonId),
      listServices(salonId),
      listStaff(salonId),
      listHours(salonId),
      salonStats(salonId)
    ]);

    res.json({ ...salon, services, staff, hours, stats });
  })
);

owner.patch(
  '/salons/:salonId',
  guard,
  route(async (req, res) => {
    const { errors, value } = validate(req.body, SALON_RULES);
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ message: 'Verifică datele salonului.', errors });
    }

    res.json(await updateSalon(Number(req.params.salonId), value));
  })
);

owner.put(
  '/salons/:salonId/hours',
  guard,
  route(async (req, res) => {
    const hours = Array.isArray(req.body?.hours) ? req.body.hours : [];
    if (hours.length !== 7) {
      return res.status(422).json({ message: 'Programul trebuie să acopere toate cele șapte zile.' });
    }

    const invalid = hours.some(
      (hour) => !/^[0-9]{2}:[0-9]{2}$/.test(String(hour.opens)) || !/^[0-9]{2}:[0-9]{2}$/.test(String(hour.closes))
    );
    if (invalid) {
      return res.status(422).json({ message: 'Orele trebuie să fie de forma HH:MM.' });
    }

    res.json(await setHours(Number(req.params.salonId), hours));
  })
);

/* --------------------------------------------------------------- agenda */

owner.get(
  '/salons/:salonId/agenda',
  guard,
  route(async (req, res) => {
    const salonId = Number(req.params.salonId);
    const requested = String(req.query.date ?? '').trim();

    if (requested && !DATE_PATTERN.test(requested)) {
      return res.status(400).json({ message: 'Data trebuie să fie de forma YYYY-MM-DD.' });
    }

    // fara data explicita deschidem prima zi care are intervale
    const date = requested || (await firstAgendaDate(salonId));
    const [slots, days] = await Promise.all([agenda(salonId, date), listDays(salonId)]);
    res.json({ date, slots, days });
  })
);

/** Genereaza intervalele libere pornind de la program si de la specialisti. */
owner.post(
  '/salons/:salonId/slots',
  guard,
  route(async (req, res) => {
    const days = Math.min(Math.max(Number(req.body?.days) || 14, 1), 60);
    const stepMin = Math.min(Math.max(Number(req.body?.stepMin) || 90, 15), 240);
    const serviceId = req.body?.serviceId ? Number(req.body.serviceId) : null;

    const result = await generateSlots(Number(req.params.salonId), { days, stepMin, serviceId });

    if (result.reason === 'no_staff') {
      return res.status(422).json({ message: 'Adaugă întâi cel puțin un specialist.' });
    }
    if (result.reason === 'no_services') {
      return res.status(422).json({ message: 'Adaugă întâi cel puțin un serviciu.' });
    }

    res.json({ ...result, message: `Am adăugat ${result.created} intervale noi.` });
  })
);

/** Sterge intervalele libere din viitor; rezervarile raman neatinse. */
owner.delete(
  '/salons/:salonId/slots',
  guard,
  route(async (req, res) => {
    await clearFreeSlots(Number(req.params.salonId));
    res.json({ message: 'Intervalele libere au fost șterse.' });
  })
);

/* ------------------------------------------------------------- servicii */

owner.post(
  '/salons/:salonId/services',
  guard,
  route(async (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    const durationMin = Number(req.body?.durationMin);
    const price = Number(req.body?.price);

    if (name.length < 3) {
      return res.status(422).json({ message: 'Verifică datele.', errors: { name: 'Numele serviciului este prea scurt.' } });
    }
    if (!Number.isFinite(durationMin) || durationMin < 10 || durationMin > 480) {
      return res.status(422).json({ message: 'Verifică datele.', errors: { durationMin: 'Durata trebuie să fie între 10 și 480 de minute.' } });
    }
    if (!Number.isFinite(price) || price < 0) {
      return res.status(422).json({ message: 'Verifică datele.', errors: { price: 'Prețul nu este valid.' } });
    }

    const slug =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `serviciu-${Date.now()}`;

    try {
      const service = await createService(Number(req.params.salonId), {
        slug,
        name,
        description: String(req.body?.description ?? '').trim(),
        category: String(req.body?.category ?? 'Păr').trim(),
        durationMin,
        price
      });
      res.status(201).json(service);
    } catch (error) {
      res.status(409).json({ message: 'Există deja un serviciu cu acest nume.', detail: error.message });
    }
  })
);

owner.patch(
  '/services/:id',
  route(async (req, res) => {
    const salonId = await serviceSalonId(req.params.id);
    if (!salonId) return res.status(404).json({ message: 'Serviciul nu a fost găsit.' });
    if (!(await ownsSalon(req.user.id, salonId))) {
      return res.status(403).json({ message: 'Nu administrezi acest salon.' });
    }

    res.json(
      await updateService(req.params.id, {
        name: String(req.body?.name ?? '').trim(),
        description: String(req.body?.description ?? '').trim(),
        category: String(req.body?.category ?? 'Păr').trim(),
        durationMin: Number(req.body?.durationMin),
        price: Number(req.body?.price)
      })
    );
  })
);

owner.delete(
  '/services/:id',
  route(async (req, res) => {
    const salonId = await serviceSalonId(req.params.id);
    if (!salonId) return res.status(404).json({ message: 'Serviciul nu a fost găsit.' });
    if (!(await ownsSalon(req.user.id, salonId))) {
      return res.status(403).json({ message: 'Nu administrezi acest salon.' });
    }

    try {
      await deleteService(req.params.id);
      res.json({ message: 'Serviciul a fost șters.' });
    } catch (error) {
      res.status(409).json({
        message: 'Serviciul are programări și nu poate fi șters.',
        detail: error.message
      });
    }
  })
);

/* ---------------------------------------------------------- specialisti */

owner.post(
  '/salons/:salonId/staff',
  guard,
  route(async (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    if (name.length < 3) {
      return res.status(422).json({ message: 'Verifică datele.', errors: { name: 'Numele este prea scurt.' } });
    }

    const member = await createStaff(Number(req.params.salonId), {
      name,
      role: String(req.body?.role ?? '').trim(),
      initials: String(req.body?.initials ?? '').trim().slice(0, 3).toUpperCase()
    });

    res.status(201).json(member);
  })
);

owner.delete(
  '/staff/:id',
  route(async (req, res) => {
    const salonId = await staffSalonId(req.params.id);
    if (!salonId) return res.status(404).json({ message: 'Specialistul nu a fost găsit.' });
    if (!(await ownsSalon(req.user.id, salonId))) {
      return res.status(403).json({ message: 'Nu administrezi acest salon.' });
    }

    try {
      await deleteStaff(req.params.id);
      res.json({ message: 'Specialistul a fost șters.' });
    } catch (error) {
      res.status(409).json({
        message: 'Specialistul are programări în agendă și nu poate fi șters.',
        detail: error.message
      });
    }
  })
);
