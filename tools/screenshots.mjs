/**
 * Genereaza capturile de ecran folosite in README.
 *
 * Cerinte: backend-ul pe http://localhost:3100 si frontend-ul pe http://localhost:4200.
 * Rulare: npm run screenshots
 */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'docs', 'screenshots');

const BASE_URL = process.env.HAIRIT_URL ?? 'http://localhost:4200';
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

function findBrowser() {
  const found = CHROME_CANDIDATES.find((path) => existsSync(path));
  if (!found) throw new Error('Nu am gasit Chrome sau Edge. Seteaza variabila CHROME_PATH.');
  return found;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function open(page, path) {
  await page.goto(BASE_URL + path, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => !document.querySelector('hairit-page-loader'), { timeout: 20000 }).catch(() => {});
  await wait(700);
}

/** Deruleaza pagina o data, ca sa se declanseze animatiile de intrare. */
async function primeReveals(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await wait(600);
}

/** Deseneaza traseul cursorului peste hero, pentru efectul de liquid reveal. */
async function paintHero(page) {
  const { width, height } = page.viewport();
  await page.mouse.move(width * 0.68, height * 0.8);
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    await page.mouse.move(width * (0.68 + t * 0.26), height * (0.8 - t * 0.5), { steps: 3 });
    await wait(16);
  }
  await wait(250);
}

async function scrollTo(page, selector, offset = 0) {
  await page.evaluate(
    (sel, off) => {
      const target = document.querySelector(sel);
      if (target) window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY + off);
    },
    selector,
    offset
  );
  await wait(650);
}

async function shoot(page, name) {
  await page.screenshot({ path: join(outDir, name + '.png') });
  console.log('  ✓ ' + name + '.png');
}

/** Autentificare prin formularul paginii, folosind conturile demo. */
async function login(page, which) {
  await open(page, '/autentificare');
  await page.evaluate((index) => {
    document.querySelectorAll('.login__demo-buttons button')[index]?.click();
  }, which === 'owner' ? 1 : 0);
  await wait(300);
  await page.evaluate(() => document.querySelector('.login__submit')?.click());
  await wait(2200);
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: 'new',
    defaultViewport: DESKTOP,
    args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--font-render-hinting=none']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(DESKTOP);

    console.log('Capturi desktop…');

    // ecranul de incarcare, surprins in timpul animatiei
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await wait(520);
    await shoot(page, '01-loader');

    await open(page, '/');
    await primeReveals(page);
    await paintHero(page);
    await shoot(page, '02-acasa');

    await scrollTo(page, '.featured', -30);
    await shoot(page, '03-saloane-recomandate');

    await open(page, '/saloane');
    await primeReveals(page);
    await shoot(page, '04-cautare');

    await open(page, '/salon/hairit-studio');
    await primeReveals(page);
    await shoot(page, '05-salon');

    await scrollTo(page, '#rezervare', -30);
    await shoot(page, '06-rezervare');

    // autentificare ca și client
    await login(page, 'client');
    await shoot(page, '07-contul-meu');

    await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('.account__tabs button')];
      tabs.find((b) => b.textContent.includes('Notificări'))?.click();
    });
    await wait(900);
    await shoot(page, '08-notificari');

    // fluxul de rezervare cu cont
    await open(page, '/salon/nova-nails');
    await scrollTo(page, '#rezervare', -30);
    await page.evaluate(() => document.querySelector('.slot--available')?.click());
    await wait(600);
    await shoot(page, '09-rezumat');

    await page.evaluate(() => document.querySelector('.summary__form button[type=submit]')?.click());
    await wait(2200);
    await shoot(page, '10-confirmare');

    // panoul proprietarului
    await login(page, 'owner');
    await open(page, '/salonul-meu');
    await wait(1200);
    await shoot(page, '11-panou-salon');

    await scrollTo(page, '.agenda', -140);
    await shoot(page, '12-agenda');

    await open(page, '/autentificare');
    await shoot(page, '13-autentificare');

    console.log('Captura mobil…');
    const guest = await browser.createBrowserContext();
    const mobile = await guest.newPage();
    await mobile.setViewport(MOBILE);
    await open(mobile, '/');
    await primeReveals(mobile);
    await mobile.evaluate(() => window.scrollTo(0, 0));
    await wait(500);
    await shoot(mobile, '14-mobil');

    await open(mobile, '/saloane');
    await wait(600);
    await shoot(mobile, '15-mobil-cautare');

    console.log('Gata. Fisierele sunt in docs/screenshots.');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
