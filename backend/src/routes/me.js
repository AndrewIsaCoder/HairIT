import { Router } from 'express';
import { route } from '../lib/route.js';
import { requireAuth } from '../lib/auth.js';
import { listForUser } from '../lib/repositories/appointments.js';
import {
  listSalons,
  addFavorite,
  removeFavorite,
  listFavoriteIds,
  getSalonBySlug
} from '../lib/repositories/salons.js';
import { listForUser as listNotifications, unreadCount, markRead, markAllRead } from '../lib/repositories/notifications.js';
import { hasVisited, upsert, remove, findByUser } from '../lib/repositories/reviews.js';

export const me = Router();

me.use(requireAuth);

/* --------------------------------------------------------- programarile mele */

me.get(
  '/appointments',
  route(async (req, res) => res.json(await listForUser(req.user.id)))
);

/* ------------------------------------------------------------------ favorite */

me.get(
  '/favorites',
  route(async (req, res) => {
    const list = await listSalons({ favoritesOf: req.user.id });
    res.json(list.map((salon) => ({ ...salon, isFavorite: true })));
  })
);

me.post(
  '/favorites/:salonId',
  route(async (req, res) => {
    await addFavorite(req.user.id, req.params.salonId);
    res.json({ favorites: await listFavoriteIds(req.user.id) });
  })
);

me.delete(
  '/favorites/:salonId',
  route(async (req, res) => {
    await removeFavorite(req.user.id, req.params.salonId);
    res.json({ favorites: await listFavoriteIds(req.user.id) });
  })
);

/* -------------------------------------------------------------- notificari */

me.get(
  '/notifications',
  route(async (req, res) => {
    const [items, unread] = await Promise.all([listNotifications(req.user.id), unreadCount(req.user.id)]);
    res.json({ items, unread });
  })
);

me.post(
  '/notifications/read-all',
  route(async (req, res) => {
    await markAllRead(req.user.id);
    res.json({ unread: 0 });
  })
);

me.post(
  '/notifications/:id/read',
  route(async (req, res) => {
    await markRead(req.user.id, req.params.id);
    res.json({ unread: await unreadCount(req.user.id) });
  })
);

/* ----------------------------------------------------------------- recenzii */

me.put(
  '/reviews/:slug',
  route(async (req, res) => {
    const salon = await getSalonBySlug(req.params.slug);
    if (!salon) return res.status(404).json({ message: 'Salonul nu a fost găsit.' });

    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment ?? '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(422).json({ message: 'Alege un punctaj între 1 și 5.', errors: { rating: 'Punctaj invalid.' } });
    }
    if (comment.length > 500) {
      return res.status(422).json({ message: 'Comentariul este prea lung.', errors: { comment: 'Maxim 500 de caractere.' } });
    }
    if (!(await hasVisited(salon.id, req.user.id))) {
      return res.status(403).json({ message: 'Poți lăsa o recenzie doar după o programare la acest salon.' });
    }

    res.json(await upsert(salon.id, req.user.id, { rating, comment }));
  })
);

me.delete(
  '/reviews/:slug',
  route(async (req, res) => {
    const salon = await getSalonBySlug(req.params.slug);
    if (!salon) return res.status(404).json({ message: 'Salonul nu a fost găsit.' });

    await remove(salon.id, req.user.id);
    res.json({ review: await findByUser(salon.id, req.user.id) ?? null });
  })
);
