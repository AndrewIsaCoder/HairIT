import { createSchema, getDb, isRemote } from './lib/db.js';
import { hashPassword } from './lib/auth.js';

/* ------------------------------------------------------------- utilizatori */

const DEMO_PASSWORD = 'parola123';

const USERS = [
  { email: 'ana@exemplu.ro',      fullName: 'Ana Petrescu',     phone: '+40760123456', role: 'client' },
  { email: 'maria@exemplu.ro',    fullName: 'Maria Ionescu',    phone: '+40721445890', role: 'client' },
  { email: 'diana@exemplu.ro',    fullName: 'Diana Constantin', phone: '+40733901224', role: 'client' },
  { email: 'raluca@exemplu.ro',   fullName: 'Raluca Neagu',     phone: '+40745120987', role: 'client' },
  { email: 'cristina@exemplu.ro', fullName: 'Cristina Vlad',    phone: '+40766334512', role: 'client' },
  { email: 'bianca@exemplu.ro',   fullName: 'Bianca Radu',      phone: '+40799652108', role: 'client' },
  { email: 'owner@hairit.ro',     fullName: 'Andrei Stoian',    phone: '+40213334455', role: 'owner'  },
  { email: 'contact@urbancut.ro', fullName: 'Vlad Marinescu',   phone: '+40264111222', role: 'owner'  }
];

/* ----------------------------------------------------------------- saloane */

const SALONS = [
  {
    slug: 'hairit-studio',
    name: 'HairIT Studio',
    tagline: 'Coafură și culoare, cu programări limitate pe zi',
    description:
      'Salon independent din 2014, cu o echipă mică și atentă la detalii. Lucrăm cu un număr limitat de programări zilnice, ca fiecare client să primească timpul de care are nevoie.',
    category: 'Salon de coafură',
    city: 'București',
    address: 'Str. Dorobanți 42',
    phone: '+40 21 555 0142',
    email: 'salut@hairit.ro',
    coverImage: 'images/hero-primary.jpg',
    owner: 'owner@hairit.ro',
    staff: [
      { name: 'Ioana Marin', role: 'Senior hair stylist', initials: 'IM' },
      { name: 'Andrei Popescu', role: 'Color specialist', initials: 'AP' },
      { name: 'Elena Dobre', role: 'Beauty therapist', initials: 'ED' }
    ],
    services: [
      { slug: 'tuns-styling', name: 'Tuns & Styling', category: 'Păr', durationMin: 60, price: 150, description: 'Consultație, tuns personalizat și styling final cu produse premium.' },
      { slug: 'coafat-eveniment', name: 'Coafat de Eveniment', category: 'Păr', durationMin: 90, price: 240, description: 'Coafuri elaborate pentru nunți, botezuri și ședințe foto.' },
      { slug: 'vopsit-balayage', name: 'Vopsit & Balayage', category: 'Culoare', durationMin: 180, price: 480, description: 'Tehnică de balayage cu tranziții naturale și toner personalizat.' },
      { slug: 'tratament-keratina', name: 'Tratament cu Keratină', category: 'Îngrijire', durationMin: 120, price: 350, description: 'Îndreptare și reconstrucție a fibrei capilare, efect de până la 4 luni.' },
      { slug: 'tratament-facial', name: 'Tratament Facial', category: 'Ten', durationMin: 60, price: 220, description: 'Curățare profundă, exfoliere și mască hidratantă adaptată tenului.' }
    ]
  },
  {
    slug: 'barber-bros',
    name: 'Barber Bros',
    tagline: 'Frizerie clasică, lame calde și bărbi impecabile',
    description:
      'Frizerie de cartier cu atmosferă relaxată. Tuns clasic, aranjat de barbă cu prosop cald și produse de îngrijire alese cu grijă.',
    category: 'Barbershop',
    city: 'București',
    address: 'Bd. Unirii 18',
    phone: '+40 21 444 8890',
    email: 'salut@barberbros.ro',
    coverImage: 'images/salon-barber.jpg',
    owner: 'owner@hairit.ro',
    staff: [
      { name: 'Mihai Dumitru', role: 'Master barber', initials: 'MD' },
      { name: 'George Anton', role: 'Barber', initials: 'GA' }
    ],
    services: [
      { slug: 'tuns-clasic', name: 'Tuns Clasic', category: 'Păr', durationMin: 45, price: 80, description: 'Tuns cu mașina și foarfeca, spălat și styling.' },
      { slug: 'barba-completa', name: 'Aranjat Barbă', category: 'Barbă', durationMin: 30, price: 60, description: 'Conturare, tuns și hidratare cu prosop cald.' },
      { slug: 'pachet-complet', name: 'Tuns & Barbă', category: 'Păr', durationMin: 75, price: 130, description: 'Pachetul complet, de la tuns până la aranjatul bărbii.' },
      { slug: 'ras-traditional', name: 'Ras Tradițional', category: 'Barbă', durationMin: 40, price: 70, description: 'Ras cu brici, spumă caldă și after shave.' }
    ]
  },
  {
    slug: 'nova-nails',
    name: 'Nova Nails',
    tagline: 'Manichiură și pedichiură, în liniște și curat',
    description:
      'Studio dedicat îngrijirii unghiilor, cu sterilizare completă a instrumentelor și o paletă largă de culori sezoniere.',
    category: 'Salon de unghii',
    city: 'București',
    address: 'Str. Floreasca 21',
    phone: '+40 21 700 2211',
    email: 'salut@novanails.ro',
    coverImage: 'images/salon-nails.jpg',
    owner: null,
    staff: [
      { name: 'Alexandra Toma', role: 'Nail artist', initials: 'AT' },
      { name: 'Sorina Enache', role: 'Nail technician', initials: 'SE' }
    ],
    services: [
      { slug: 'manichiura-semi', name: 'Manichiură Semipermanentă', category: 'Unghii', durationMin: 90, price: 130, description: 'Manichiură completă cu ojă semipermanentă și întărirea unghiei.' },
      { slug: 'constructie-gel', name: 'Construcție cu Gel', category: 'Unghii', durationMin: 120, price: 190, description: 'Construcție și modelare cu gel, finisaj mat sau lucios.' },
      { slug: 'pedichiura', name: 'Pedichiură Completă', category: 'Unghii', durationMin: 75, price: 140, description: 'Pedichiură cu tratament hidratant și masaj scurt.' }
    ]
  },
  {
    slug: 'atelier-blond',
    name: 'Atelier Blond',
    tagline: 'Specialiști în blond și corecții de culoare',
    description:
      'Atelier axat pe transformări de culoare. Facem consultație gratuită înainte de orice decolorare, ca rezultatul să fie previzibil.',
    category: 'Salon de coafură',
    city: 'Cluj-Napoca',
    address: 'Str. Napoca 14',
    phone: '+40 264 330 118',
    email: 'salut@atelierblond.ro',
    coverImage: 'images/studio-interior.jpg',
    owner: null,
    staff: [
      { name: 'Carmen Pop', role: 'Colorist', initials: 'CP' },
      { name: 'Ruxandra Ilie', role: 'Hair stylist', initials: 'RI' },
      { name: 'Teodora Man', role: 'Asistent colorist', initials: 'TM' }
    ],
    services: [
      { slug: 'blond-integral', name: 'Blond Integral', category: 'Culoare', durationMin: 210, price: 620, description: 'Decolorare completă, toner și tratament de refacere.' },
      { slug: 'corectie-culoare', name: 'Corecție de Culoare', category: 'Culoare', durationMin: 180, price: 520, description: 'Reparăm o culoare nereușită, în una sau două ședințe.' },
      { slug: 'tuns-femei', name: 'Tuns & Coafat', category: 'Păr', durationMin: 60, price: 160, description: 'Tuns adaptat formei feței și styling final.' },
      { slug: 'tratament-olaplex', name: 'Tratament Olaplex', category: 'Îngrijire', durationMin: 45, price: 180, description: 'Reconstrucția legăturilor din fibra capilară după decolorare.' }
    ]
  },
  {
    slug: 'urban-cut',
    name: 'Urban Cut',
    tagline: 'Frizerie modernă, fade-uri curate',
    description:
      'Frizerie contemporană, cu accent pe fade-uri și texturi. Rezervări rapide și program prelungit joia și vinerea.',
    category: 'Barbershop',
    city: 'Cluj-Napoca',
    address: 'Str. Horea 5',
    phone: '+40 264 550 900',
    email: 'contact@urbancut.ro',
    coverImage: 'images/salon-fade.jpg',
    owner: 'contact@urbancut.ro',
    staff: [
      { name: 'Vlad Marinescu', role: 'Master barber', initials: 'VM' },
      { name: 'Robert Sava', role: 'Barber', initials: 'RS' }
    ],
    services: [
      { slug: 'fade', name: 'Fade', category: 'Păr', durationMin: 45, price: 90, description: 'Fade curat, la alegere: low, mid sau high.' },
      { slug: 'tuns-copii', name: 'Tuns Copii', category: 'Păr', durationMin: 30, price: 55, description: 'Tuns pentru cei mici, cu răbdare și fără grabă.' },
      { slug: 'styling-barba', name: 'Styling Barbă', category: 'Barbă', durationMin: 30, price: 65, description: 'Conturare și produse de fixare pentru barbă.' }
    ]
  },
  {
    slug: 'lumina-beauty',
    name: 'Lumina Beauty',
    tagline: 'Îngrijirea tenului și tratamente faciale',
    description:
      'Cabinet de cosmetică cu aparatură modernă și protocoale adaptate fiecărui tip de ten.',
    category: 'Salon de înfrumusețare',
    city: 'Timișoara',
    address: 'Bd. Take Ionescu 30',
    phone: '+40 256 220 440',
    email: 'salut@luminabeauty.ro',
    coverImage: 'images/editorial-portrait.jpg',
    owner: null,
    staff: [
      { name: 'Daniela Vasile', role: 'Cosmetician', initials: 'DV' },
      { name: 'Iulia Barbu', role: 'Terapeut', initials: 'IB' }
    ],
    services: [
      { slug: 'curatare-faciala', name: 'Curățare Facială', category: 'Ten', durationMin: 75, price: 230, description: 'Curățare profundă cu extracție manuală și mască calmantă.' },
      { slug: 'hidrafacial', name: 'Tratament Hidratant', category: 'Ten', durationMin: 60, price: 280, description: 'Hidratare intensă cu acid hialuronic și masaj facial.' },
      { slug: 'epilare-definitiva', name: 'Epilare Definitivă', category: 'Corp', durationMin: 45, price: 200, description: 'Ședință de epilare cu laser, pe zona aleasă.' }
    ]
  },
  {
    slug: 'casa-coafurii',
    name: 'Casa Coafurii',
    tagline: 'Coafuri clasice, într-un spațiu cald',
    description:
      'Salon de familie, deschis de peste 20 de ani. Coafuri clasice, tuns și îngrijire, la prețuri corecte.',
    category: 'Salon de coafură',
    city: 'Iași',
    address: 'Str. Lăpușneanu 9',
    phone: '+40 232 210 330',
    email: 'salut@casacoafurii.ro',
    coverImage: 'images/hero-reveal.jpg',
    owner: null,
    staff: [
      { name: 'Mihaela Ursu', role: 'Hair stylist', initials: 'MU' },
      { name: 'Gabriela Chiriac', role: 'Coafeză', initials: 'GC' }
    ],
    services: [
      { slug: 'tuns-spalat', name: 'Tuns & Spălat', category: 'Păr', durationMin: 45, price: 90, description: 'Tuns clasic, spălat și uscat cu peria.' },
      { slug: 'coafat-clasic', name: 'Coafat Clasic', category: 'Păr', durationMin: 60, price: 110, description: 'Coafat pentru evenimente de zi cu zi.' },
      { slug: 'vopsit-radacina', name: 'Vopsit Rădăcină', category: 'Culoare', durationMin: 90, price: 200, description: 'Acoperirea rădăcinii, cu nuanța potrivită.' }
    ]
  }
];

const REVIEWS = [
  { salon: 'hairit-studio', user: 'ana@exemplu.ro',      rating: 5, comment: 'Cea mai bună tunsoare din ultimii ani. Ioana chiar ascultă ce vrei.' },
  { salon: 'hairit-studio', user: 'maria@exemplu.ro',    rating: 5, comment: 'Balayage impecabil, iar culoarea a ținut foarte bine.' },
  { salon: 'hairit-studio', user: 'diana@exemplu.ro',    rating: 4, comment: 'Rezultat foarte bun, dar am așteptat puțin peste ora programată.' },
  { salon: 'barber-bros',   user: 'raluca@exemplu.ro',   rating: 5, comment: 'L-am dus pe soțul meu și s-a întors încântat. Atmosferă super.' },
  { salon: 'barber-bros',   user: 'cristina@exemplu.ro', rating: 4, comment: 'Tuns bun și rapid, exact ce căutam.' },
  { salon: 'nova-nails',    user: 'bianca@exemplu.ro',   rating: 5, comment: 'Curat, ordonat și manichiura a rezistat trei săptămâni.' },
  { salon: 'nova-nails',    user: 'ana@exemplu.ro',      rating: 4, comment: 'Foarte drăguțe, dar programul se umple repede.' },
  { salon: 'atelier-blond', user: 'maria@exemplu.ro',    rating: 5, comment: 'Mi-au corectat o culoare făcută prost în altă parte. Recomand.' },
  { salon: 'atelier-blond', user: 'diana@exemplu.ro',    rating: 5, comment: 'Consultația de la început face toată diferența.' },
  { salon: 'urban-cut',     user: 'cristina@exemplu.ro', rating: 4, comment: 'Fade curat, prețuri corecte.' },
  { salon: 'lumina-beauty', user: 'raluca@exemplu.ro',   rating: 5, comment: 'Tenul meu arată vizibil mai bine după trei ședințe.' },
  { salon: 'casa-coafurii', user: 'bianca@exemplu.ro',   rating: 4, comment: 'Salon de cartier, primitor și cu prețuri bune.' }
];

const HOURS = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];
const DAYS_AHEAD = 10;

/* ------------------------------------------------------------------ ajutor */

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

async function reset(db) {
  await db.script(`
    DELETE FROM notifications;
    DELETE FROM favorites;
    DELETE FROM reviews;
    DELETE FROM appointments;
    DELETE FROM services;
    DELETE FROM staff;
    DELETE FROM salon_hours;
    DELETE FROM salons;
    DELETE FROM sessions;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN
      ('notifications','reviews','appointments','services','staff','salon_hours','salons','users');
  `);
}

/* -------------------------------------------------------------------- seed */

export async function seed({ force = false } = {}) {
  await createSchema();
  const db = await getDb();

  const existing = await db.get('SELECT COUNT(*) AS n FROM salons');
  if (existing.n > 0 && !force) {
    const slots = await db.get('SELECT COUNT(*) AS n FROM appointments');
    return { skipped: true, salons: existing.n, appointments: slots.n };
  }

  await reset(db);

  // utilizatori (toti au aceeasi parola demo)
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await db.batch(
    USERS.map((user) => ({
      sql: 'INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?)',
      args: [user.email, passwordHash, user.fullName, user.phone, user.role]
    }))
  );

  const userRows = await db.all('SELECT id, email FROM users');
  const userId = Object.fromEntries(userRows.map((row) => [row.email, row.id]));

  // saloane
  await db.batch(
    SALONS.map((salon) => ({
      sql: `INSERT INTO salons (slug, name, tagline, description, category, city, address, phone, email, cover_image, owner_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        salon.slug,
        salon.name,
        salon.tagline,
        salon.description,
        salon.category,
        salon.city,
        salon.address,
        salon.phone,
        salon.email,
        salon.coverImage,
        salon.owner ? userId[salon.owner] : null
      ]
    }))
  );

  const salonRows = await db.all('SELECT id, slug FROM salons');
  const salonId = Object.fromEntries(salonRows.map((row) => [row.slug, row.id]));

  // program de lucru: luni-sambata deschis, duminica inchis
  const hourRows = [];
  for (const salon of SALONS) {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      hourRows.push({
        sql: 'INSERT INTO salon_hours (salon_id, weekday, opens, closes, closed) VALUES (?, ?, ?, ?, ?)',
        args: [salonId[salon.slug], weekday, '09:00', weekday === 6 ? '16:00' : '19:30', weekday === 0 ? 1 : 0]
      });
    }
  }
  await db.batch(hourRows);

  // specialisti si servicii
  const staffRows = [];
  const serviceRows = [];
  for (const salon of SALONS) {
    for (const member of salon.staff) {
      staffRows.push({
        sql: 'INSERT INTO staff (salon_id, name, role, initials) VALUES (?, ?, ?, ?)',
        args: [salonId[salon.slug], member.name, member.role, member.initials]
      });
    }
    for (const service of salon.services) {
      serviceRows.push({
        sql: `INSERT INTO services (salon_id, slug, name, description, category, duration_min, price)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          salonId[salon.slug],
          service.slug,
          service.name,
          service.description,
          service.category,
          service.durationMin,
          service.price
        ]
      });
    }
  }
  await db.batch(staffRows);
  await db.batch(serviceRows);

  const staffBySalon = new Map();
  for (const row of await db.all('SELECT id, salon_id AS salonId FROM staff ORDER BY id')) {
    if (!staffBySalon.has(row.salonId)) staffBySalon.set(row.salonId, []);
    staffBySalon.get(row.salonId).push(row.id);
  }

  const servicesBySalon = new Map();
  for (const row of await db.all('SELECT id, salon_id AS salonId FROM services ORDER BY id')) {
    if (!servicesBySalon.has(row.salonId)) servicesBySalon.set(row.salonId, []);
    servicesBySalon.get(row.salonId).push(row.id);
  }

  // intervale disponibile, o parte deja rezervate de clientii demo
  const random = makeRandom(20260510);
  const clientEmails = USERS.filter((user) => user.role === 'client').map((user) => user.email);
  const slotRows = [];

  for (const salon of SALONS) {
    const id = salonId[salon.slug];
    const staffIds = staffBySalon.get(id) ?? [];
    const serviceIds = servicesBySalon.get(id) ?? [];

    for (let offset = 0; offset < DAYS_AHEAD; offset += 1) {
      const date = isoDate(offset);
      if (new Date(`${date}T12:00:00`).getDay() === 0) continue; // duminica inchis

      for (const [index, staffId] of staffIds.entries()) {
        for (const [hourIndex, time] of HOURS.entries()) {
          // program usor diferit intre specialisti
          if (index === 1 && hourIndex === 0) continue;
          if (index === 2 && hourIndex === HOURS.length - 1) continue;

          const serviceId = serviceIds[Math.floor(random() * serviceIds.length)];
          const booked = random() < 0.32;
          const email = clientEmails[Math.floor(random() * clientEmails.length)];
          const client = USERS.find((user) => user.email === email);

          slotRows.push({
            sql: `INSERT INTO appointments (salon_id, staff_id, service_id, user_id, date, time, status, client_name, phone, email)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              id,
              staffId,
              serviceId,
              booked ? userId[email] : null,
              date,
              time,
              booked ? 'booked' : 'available',
              booked ? client.fullName : '',
              booked ? client.phone : '',
              booked ? email : ''
            ]
          });
        }
      }
    }
  }

  const chunkSize = 100;
  for (let i = 0; i < slotRows.length; i += chunkSize) {
    await db.batch(slotRows.slice(i, i + chunkSize));
  }

  // recenzii si cateva favorite
  await db.batch(
    REVIEWS.map((review) => ({
      sql: 'INSERT INTO reviews (salon_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      args: [salonId[review.salon], userId[review.user], review.rating, review.comment]
    }))
  );

  await db.batch([
    { sql: 'INSERT INTO favorites (user_id, salon_id) VALUES (?, ?)', args: [userId['ana@exemplu.ro'], salonId['hairit-studio']] },
    { sql: 'INSERT INTO favorites (user_id, salon_id) VALUES (?, ?)', args: [userId['ana@exemplu.ro'], salonId['nova-nails']] },
    { sql: 'INSERT INTO favorites (user_id, salon_id) VALUES (?, ?)', args: [userId['maria@exemplu.ro'], salonId['atelier-blond']] }
  ]);

  return {
    skipped: false,
    users: USERS.length,
    salons: SALONS.length,
    staff: staffRows.length,
    services: serviceRows.length,
    appointments: slotRows.length,
    reviews: REVIEWS.length
  };
}

// rulare directa: `npm run seed`
if (process.argv[1] && process.argv[1].includes('seed.js')) {
  const result = await seed({ force: process.argv.includes('--reset') });
  const target = isRemote ? 'Turso' : 'baza locala';

  console.log(
    result.skipped
      ? `${target}: exista deja ${result.salons} saloane si ${result.appointments} intervale. Foloseste --reset pentru regenerare.`
      : `${target}: ${result.salons} saloane, ${result.services} servicii, ${result.staff} specialisti, ` +
        `${result.appointments} intervale, ${result.users} utilizatori, ${result.reviews} recenzii.`
  );
  if (!result.skipped) console.log(`Conturi demo: ana@exemplu.ro / owner@hairit.ro — parola: ${DEMO_PASSWORD}`);
}

export { DEMO_PASSWORD };
