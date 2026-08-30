import { Router } from 'express';
import { withUser } from '../lib/auth.js';
import { auth } from './auth.js';
import { salons } from './salons.js';
import { appointments } from './appointments.js';
import { me } from './me.js';
import { owner } from './owner.js';

export const api = Router();

// toate rutele stiu cine este utilizatorul curent, daca exista o sesiune
api.use(withUser);

api.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hairit-api', time: new Date().toISOString() });
});

api.use('/auth', auth);
api.use('/salons', salons);
api.use('/appointments', appointments);
api.use('/me', me);
api.use('/owner', owner);
