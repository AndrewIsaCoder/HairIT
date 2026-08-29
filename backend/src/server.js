import { createApp } from './app.js';
import { isRemote } from './lib/db.js';
import { seed } from './seed.js';

const PORT = Number(process.env.PORT ?? 3100);

const result = await seed();
const target = isRemote ? 'Turso' : 'baza locala';

console.log(
  result.skipped
    ? `[hairit-api] ${target}: ${result.appointments} programari.`
    : `[hairit-api] ${target}: am populat baza cu ${result.appointments} programari.`
);

createApp().listen(PORT, () => {
  console.log(`[hairit-api] API disponibil pe http://localhost:${PORT}/api`);
});
