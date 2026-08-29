import { createApp } from './app.js';
import { createSchema } from './lib/db.js';
import { seed } from './seed.js';

const PORT = Number(process.env.PORT ?? 3100);

createSchema();
const result = seed();
if (result.skipped) {
  console.log(`[hairit-api] Baza de date contine ${result.appointments} programari.`);
} else {
  console.log(`[hairit-api] Am populat baza de date cu ${result.appointments} programari.`);
}

createApp().listen(PORT, () => {
  console.log(`[hairit-api] API disponibil pe http://localhost:${PORT}/api`);
});
