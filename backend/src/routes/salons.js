import { Router } from 'express';
import { route, DATE_PATTERN } from '../lib/route.js';
import {
  listSalons,
  getSalonBySlug,
  listCities,
  listCategories,
  listFavoriteIds
} from '../lib/repositories/salons.js';
import { listDays, listSlots, platformStats } from '../lib/repositories/appointments.js';
import { listForSalon, findByUser, hasVisited } from '../lib/repositories/reviews.js';

export const salons = Router();

salons.get(
  '/',
  route(async (req, res) => {
    const { city, category, q } = req.query;
    const list = await listSalons({ city, category, q: q ? String(q).trim() : undefined });

    if (req.user) {
      const favorites = new Set(await listFavoriteIds(req.user.id));
      return res.json(list.map((salon) => ({ ...salon, isFavorite: favorites.has(salon.id) })));
    }

    res.json(list.map((salon) => ({ ...salon, isFavorite: false })));
  })
);

salons.get(
  '/filters',
  route(async (req, res) => {
    const [cities, categories, stats] = await Promise.all([listCities(), listCategories(), platformStats()]);
    res.json({ cities, categories, stats });
  })
);

salons.get(
  '/:slug',
  route(async (req, res) => {
    const salon = await getSalonBySlug(req.params.slug);
    if (!salon) return res.status(404).json({ message: 'Salonul nu a fost găsit.' });

    const reviews = await listForSalon(salon.id);
    let isFavorite = false;
    let myReview = null;
    let canReview = false;

    if (req.user) {
      const favorites = await listFavoriteIds(req.user.id);
      isFavorite = favorites.includes(salon.id);
      myReview = (await findByUser(salon.id, req.user.id)) ?? null;
      canReview = await hasVisited(salon.id, req.user.id);
    }

    res.json({ ...salon, reviews, isFavorite, myReview, canReview });
  })
);

salons.get(
  '/:slug/days',
  route(async (req, res) => {
    const salon = await getSalonBySlug(req.params.slug);
    if (!salon) return res.status(404).json({ message: 'Salonul nu a fost găsit.' });

    const { serviceId, staffId } = req.query;
    res.json(await listDays(salon.id, { serviceId, staffId }));
  })
);

salons.get(
  '/:slug/slots',
  route(async (req, res) => {
    const salon = await getSalonBySlug(req.params.slug);
    if (!salon) return res.status(404).json({ message: 'Salonul nu a fost găsit.' });

    const { date, serviceId, staffId, status } = req.query;
    if (date && !DATE_PATTERN.test(String(date))) {
      return res.status(400).json({ message: 'Data trebuie să fie de forma YYYY-MM-DD.' });
    }
    if (status && !['available', 'booked'].includes(String(status))) {
      return res.status(400).json({ message: "Statusul acceptă doar 'available' sau 'booked'." });
    }

    res.json(await listSlots({ salonId: salon.id, date, serviceId, staffId, status }));
  })
);

salons.get(
  '/:slug/reviews',
  route(async (req, res) => {
    const salon = await getSalonBySlug(req.params.slug);
    if (!salon) return res.status(404).json({ message: 'Salonul nu a fost găsit.' });
    res.json(await listForSalon(salon.id, { limit: 50 }));
  })
);
