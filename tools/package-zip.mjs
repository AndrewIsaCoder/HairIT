/**
 * Pregateste arhiva pentru predarea temei.
 *
 * Copiaza proiectul intr-un folder temporar (fara node_modules, dist, .git si
 * baza de date locala) si il arhiveaza cu numele cerut de assignment.
 *
 * Rulare: npm run livrabil
 *         npm run livrabil -- alt_nume_assignment06
 */
import { cpSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.angular', '.git', 'tmp', 'out-tsc']);
const EXCLUDED_FILES = new Set(['.env', '.env.local']);

const archiveName = (process.argv[2] ?? 'andrei_stoian_assignment06').replace(/[^a-zA-Z0-9_-]/g, '');
const archivePath = join(root, archiveName + '.zip');

function keep(source) {
  const rel = relative(root, source);
  if (!rel) return true;

  const parts = rel.split(sep);
  if (parts.some((part) => EXCLUDED_DIRS.has(part))) return false;
  if (EXCLUDED_FILES.has(parts[parts.length - 1])) return false;
  if (rel.endsWith('.zip')) return false;
  // baza de date locala se regenereaza la prima pornire a serverului
  if (parts[0] === 'backend' && parts[1] === 'data' && parts.length > 2) return false;

  return true;
}

function humanSize(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function compress(sourceDir, destination) {
  if (process.platform === 'win32') {
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Compress-Archive -Path "' + sourceDir + sep + '*" -DestinationPath "' + destination + '" -Force'
      ],
      { stdio: 'inherit' }
    );
    return;
  }

  execFileSync('zip', ['-r', '-q', destination, '.'], { cwd: sourceDir, stdio: 'inherit' });
}

const staging = mkdtempSync(join(tmpdir(), 'hairit-'));
const projectDir = join(staging, 'HairIT');

try {
  cpSync(root, projectDir, { recursive: true, filter: keep });

  if (existsSync(archivePath)) rmSync(archivePath);
  compress(staging, archivePath);

  console.log('Arhiva a fost creata: ' + archivePath);
  console.log('Dimensiune: ' + humanSize(statSync(archivePath).size));
  console.log('Nu contine node_modules — ruleaza `npm run setup` dupa dezarhivare.');
} finally {
  rmSync(staging, { recursive: true, force: true });
}
