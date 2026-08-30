import { Router } from 'express';
import { route, validate, EMAIL_PATTERN, PHONE_PATTERN } from '../lib/route.js';
import {
  createSession,
  destroySession,
  pruneSessions,
  readSessionToken,
  setSessionCookie,
  clearSessionCookie,
  verifyPassword,
  requireAuth
} from '../lib/auth.js';
import { createUser, findByEmail, findById, updateProfile, updatePassword } from '../lib/repositories/users.js';
import { notify } from '../lib/repositories/notifications.js';

export const auth = Router();

const REGISTER_RULES = {
  fullName: { required: true, min: 3, max: 60, messages: { required: 'Numele este obligatoriu.', min: 'Numele trebuie să aibă minim 3 caractere.' } },
  email: { required: true, pattern: EMAIL_PATTERN, messages: { required: 'Emailul este obligatoriu.', pattern: 'Adresa de email nu este validă.' } },
  phone: { required: true, pattern: PHONE_PATTERN, messages: { required: 'Telefonul este obligatoriu.', pattern: 'Numărul de telefon nu este valid.' } },
  password: { required: true, min: 8, max: 72, messages: { required: 'Parola este obligatorie.', min: 'Parola trebuie să aibă minim 8 caractere.' } }
};

auth.post(
  '/register',
  route(async (req, res) => {
    const { errors, value } = validate(req.body, REGISTER_RULES);
    const role = req.body?.role === 'owner' ? 'owner' : 'client';

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ message: 'Verifică datele introduse.', errors });
    }

    const existing = await findByEmail(value.email);
    if (existing) {
      return res.status(409).json({
        message: 'Există deja un cont cu acest email.',
        errors: { email: 'Există deja un cont cu acest email.' }
      });
    }

    const user = await createUser({ ...value, role });
    const token = await createSession(user.id);
    setSessionCookie(res, token);

    await notify(user.id, {
      type: 'welcome',
      title: 'Bine ai venit pe HairIT',
      body: 'Caută un salon, alege un serviciu și rezervă în câteva secunde.'
    });

    res.status(201).json(user);
  })
);

auth.post(
  '/login',
  route(async (req, res) => {
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');

    const record = await findByEmail(email);
    const valid = record ? await verifyPassword(password, record.passwordHash) : false;

    if (!record || !valid) {
      return res.status(401).json({ message: 'Email sau parolă greșită.' });
    }

    await pruneSessions();
    const token = await createSession(record.id);
    setSessionCookie(res, token);

    res.json(await findById(record.id));
  })
);

auth.post(
  '/logout',
  route(async (req, res) => {
    await destroySession(readSessionToken(req));
    clearSessionCookie(res);
    res.json({ message: 'Te-ai deconectat.' });
  })
);

auth.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Nu ești autentificat.' });
  res.json(req.user);
});

auth.patch(
  '/me',
  requireAuth,
  route(async (req, res) => {
    const { errors, value } = validate(req.body, {
      fullName: REGISTER_RULES.fullName,
      phone: REGISTER_RULES.phone
    });

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ message: 'Verifică datele introduse.', errors });
    }

    res.json(await updateProfile(req.user.id, value));
  })
);

auth.post(
  '/me/password',
  requireAuth,
  route(async (req, res) => {
    const current = String(req.body?.currentPassword ?? '');
    const next = String(req.body?.newPassword ?? '');

    if (next.length < 8) {
      return res.status(422).json({
        message: 'Parola nouă este prea scurtă.',
        errors: { newPassword: 'Parola trebuie să aibă minim 8 caractere.' }
      });
    }

    const record = await findByEmail(req.user.email);
    const valid = await verifyPassword(current, record.passwordHash);
    if (!valid) {
      return res.status(422).json({
        message: 'Parola actuală este greșită.',
        errors: { currentPassword: 'Parola actuală este greșită.' }
      });
    }

    await updatePassword(req.user.id, next);
    clearSessionCookie(res);
    res.json({ message: 'Parola a fost schimbată. Autentifică-te din nou.' });
  })
);
