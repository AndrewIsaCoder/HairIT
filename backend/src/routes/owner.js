import { Router } from 'express';
import { route, DATE_PATTERN } from '../lib/route.js';
import { requireOwner } from '../lib/auth.js';
import {
  listSalonsByOwner,
  ownsSalon,
  getSalonById,
  listServices,
  listStaff,
  createService,
  updateService,
  deleteService,
  serviceSalonId
} from '../lib/repositories/salons.js';
import { agenda, salonStats, listDays } from '../lib/repositories/appointments.js';

export const owner = Router();

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
    const [salon, services, staff, stats] = await Promise.all([
      getSalonById(salonId),
      listServices(salonId),
      listStaff(salonId),
      salonStats(salonId)
    ]);

    res.json({ ...salon, services, staff, stats });
  })
);

owner.get(
  '/salons/:salonId/agenda',
  guard,
  route(async (req, res) => {
    const date = String(req.query.date ?? '').trim() || new Date().toISOString().slice(0, 10);
    if (!DATE_PATTERN.test(date)) {
      return res.status(400).json({ message: 'Data trebuie să fie de forma YYYY-MM-DD.' });
    }

    const salonId = Number(req.params.salonId);
    const [slots, days] = await Promise.all([agenda(salonId, date), listDays(salonId)]);
    res.json({ date, slots, days });
  })
);

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
