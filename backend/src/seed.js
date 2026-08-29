import { db, createSchema } from './lib/db.js';

const SERVICES = [
  { slug: 'tuns-styling',       name: 'Tuns & Styling',            category: 'Păr',       durationMin: 60,  price: 150, description: 'Consultație, tuns personalizat și styling final cu produse premium.' },
  { slug: 'coafat-eveniment',   name: 'Coafat de Eveniment',       category: 'Păr',       durationMin: 90,  price: 240, description: 'Coafuri elaborate pentru nunți, botezuri și ședințe foto.' },
  { slug: 'vopsit-balayage',    name: 'Vopsit & Balayage',         category: 'Culoare',   durationMin: 180, price: 480, description: 'Tehnică de balayage cu tranziții naturale și toner personalizat.' },
  { slug: 'tratament-keratina', name: 'Tratament cu Keratină',     category: 'Îngrijire', durationMin: 120, price: 350, description: 'Îndreptare și reconstrucție a fibrei capilare, efect de până la 4 luni.' },
  { slug: 'manichiura',         name: 'Manichiură Semipermanentă', category: 'Unghii',    durationMin: 90,  price: 130, description: 'Manichiură completă cu ojă semipermanentă și întărirea unghiei.' },
  { slug: 'tratament-facial',   name: 'Tratament Facial',          category: 'Ten',       durationMin: 60,  price: 220, description: 'Curățare profundă, exfoliere și mască hidratantă adaptată tenului.' }
];

const STYLISTS = [
  { name: 'Ioana Marin',    role: 'Senior hair stylist',  initials: 'IM' },
  { name: 'Andrei Popescu', role: 'Color specialist',     initials: 'AP' },
  { name: 'Elena Dobre',    role: 'Beauty therapist',     initials: 'ED' }
];

const CLIENTS = [
  { clientName: 'Ana Petrescu',    phone: '+40760123456' },
  { clientName: 'Maria Ionescu',   phone: '+40721445890' },
  { clientName: 'Diana Constantin',phone: '+40733901224' },
  { clientName: 'Raluca Neagu',    phone: '+40745120987' },
  { clientName: 'Cristina Vlad',   phone: '+40766334512' },
  { clientName: 'Alexandra Toma',  phone: '+40711876340' },
  { clientName: 'Bianca Radu',     phone: '+40799652108' },
  { clientName: 'Sorina Enache',   phone: '+40755410273' }
];

const HOURS = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];
const DAYS_AHEAD = 12;

/** Generator pseudo-aleator determinist, ca seed-ul sa fie reproductibil. */
function makeRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function isoDate(offsetDays) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function reset() {
  db.exec('DELETE FROM appointments; DELETE FROM services; DELETE FROM stylists;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('appointments', 'services', 'stylists')");
}

export function seed({ force = false } = {}) {
  createSchema();

  const existing = db.prepare('SELECT COUNT(*) AS n FROM appointments').get().n;
  if (existing > 0 && !force) {
    return { skipped: true, appointments: existing };
  }
  reset();

  const insertService = db.prepare(
    'INSERT INTO services (slug, name, description, category, duration_min, price) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const s of SERVICES) {
    insertService.run(s.slug, s.name, s.description, s.category, s.durationMin, s.price);
  }

  const insertStylist = db.prepare('INSERT INTO stylists (name, role, initials) VALUES (?, ?, ?)');
  for (const s of STYLISTS) {
    insertStylist.run(s.name, s.role, s.initials);
  }

  const serviceIds = db.prepare('SELECT id FROM services ORDER BY id').all().map((r) => r.id);
  const stylistIds = db.prepare('SELECT id FROM stylists ORDER BY id').all().map((r) => r.id);

  const insertAppointment = db.prepare(
    `INSERT INTO appointments (date, time, service_id, stylist_id, status, client_name, phone, email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const random = makeRandom(20260510);
  let created = 0;

  for (let offset = 0; offset < DAYS_AHEAD; offset += 1) {
    const date = isoDate(offset);
    // salonul este inchis duminica
    if (new Date(`${date}T12:00:00`).getDay() === 0) continue;

    for (const [index, stylistId] of stylistIds.entries()) {
      for (const time of HOURS) {
        // fiecare stilist are un program usor diferit
        if (index === 2 && time === '09:00') continue;
        if (index === 1 && time === '18:00') continue;

        const serviceId = serviceIds[Math.floor(random() * serviceIds.length)];
        const booked = random() < 0.38;
        const client = CLIENTS[Math.floor(random() * CLIENTS.length)];

        insertAppointment.run(
          date,
          time,
          serviceId,
          stylistId,
          booked ? 'booked' : 'available',
          booked ? client.clientName : '',
          booked ? client.phone : '',
          booked ? `${client.clientName.split(' ')[0].toLowerCase()}@example.com` : ''
        );
        created += 1;
      }
    }
  }

  return { skipped: false, appointments: created, services: SERVICES.length, stylists: STYLISTS.length };
}

// rulare directa: `npm run seed`
if (process.argv[1] && process.argv[1].includes('seed.js')) {
  const result = seed({ force: process.argv.includes('--reset') });
  console.log(result.skipped
    ? `Baza de date contine deja ${result.appointments} programari. Foloseste --reset pentru regenerare.`
    : `Am generat ${result.appointments} programari, ${result.services} servicii si ${result.stylists} stilisti.`);
}
