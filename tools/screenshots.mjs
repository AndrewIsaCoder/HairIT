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
  if (!found) {
    throw new Error('Nu am gasit Chrome sau Edge. Seteaza variabila CHROME_PATH.');
  }
  return found;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Asteapta disparitia ecranului de incarcare. */
async function waitForIntro(page) {
  await page.waitForFunction(() => !document.querySelector('hairit-page-loader'), { timeout: 20000 });
  await wait(900);
}

/** Deruleaza toata pagina o data, ca sa se declanseze animatiile de intrare. */
async function primeReveals(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 130));
    }
    window.scrollTo(0, 0);
  });
  await wait(700);
}

/** Deseneaza traseul cursorului peste hero, pentru efectul de liquid reveal. */
async function paintHero(page) {
  const { width, height } = page.viewport();
  await page.mouse.move(width * 0.62, height * 0.75);
  for (let i = 0; i <= 26; i += 1) {
    const t = i / 26;
    await page.mouse.move(width * (0.62 + t * 0.3), height * (0.75 - t * 0.45), { steps: 3 });
    await wait(16);
  }
  await wait(260);
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
  await wait(700);
}

async function shoot(page, name) {
  const file = join(outDir, name + '.png');
  await page.screenshot({ path: file });
  console.log('  ✓ ' + name + '.png');
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
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    console.log('Generez capturile desktop…');
    // ecranul de incarcare, surprins in timpul animatiei
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wait(520);
    await shoot(page, '01-loader');

    await waitForIntro(page);
    await primeReveals(page);
    await paintHero(page);
    await shoot(page, '02-hero');

    await scrollTo(page, 'hairit-services-section', -40);
    await shoot(page, '03-servicii');

    await scrollTo(page, 'hairit-booking-section', 120);
    await shoot(page, '04-programari');

    // selecteaza primul interval liber si arata detaliile
    await page.evaluate(() => {
      const card = [...document.querySelectorAll('.term--available')][2];
      card?.click();
    });
    await wait(600);
    await scrollTo(page, 'hairit-booking-section', 320);
    await shoot(page, '05-detalii-rezervare');

    await scrollTo(page, 'hairit-studio-section', 40);
    await shoot(page, '06-salon');

    await scrollTo(page, 'hairit-team-section', 40);
    await shoot(page, '07-echipa');

    await scrollTo(page, 'hairit-stats-section', -40);
    await shoot(page, '08-cifre');

    await scrollTo(page, 'hairit-site-footer', 0);
    await shoot(page, '09-footer');

    // meniul principal
    await page.evaluate(() => document.querySelector('.header__menu')?.click());
    await wait(900);
    await shoot(page, '10-meniu');
    await page.keyboard.press('Escape');
    await wait(500);

    // formularul de cerere
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Cere o programare')
      );
      button?.click();
    });
    await wait(900);
    await shoot(page, '11-formular');
    await page.keyboard.press('Escape');
    await wait(400);

    console.log('Generez captura mobil…');
    const mobile = await browser.newPage();
    await mobile.setViewport(MOBILE);
    await mobile.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await waitForIntro(mobile);
    await primeReveals(mobile);
    await shoot(mobile, '12-mobil');

    console.log('Gata. Fisierele sunt in docs/screenshots.');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
