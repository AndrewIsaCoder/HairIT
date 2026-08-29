/**
 * Punctul de intrare pentru functia serverless de pe Vercel.
 *
 * Toate cererile catre /api/* sunt directionate aici prin `vercel.json`,
 * iar aplicatia Express din backend le trateaza mai departe.
 */
import { createApp } from '../backend/src/app.js';
import { createSchema } from '../backend/src/lib/db.js';

const app = createApp();

// schema se creeaza o singura data per instanta, nu la fiecare cerere
let ready = null;
const ensureReady = () => (ready ??= createSchema());

export default async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}
