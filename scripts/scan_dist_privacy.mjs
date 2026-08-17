/**
 * scripts/scan_dist_privacy.mjs
 *
 * Production Build (dist/) Privacy Scanner.
 * Verifies that zero citizen PII or forbidden fields are present in the final bundled artifacts.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT, 'dist');

if (!fs.existsSync(DIST_DIR)) {
  console.error('dist/ klasörü bulunamadı. Lütfen önce "npm run build" çalıştırın.');
  process.exit(1);
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const allDistFiles = getAllFiles(DIST_DIR);
console.log(`=== DIST/ PRODUCTION PRIVACY SCAN ===`);
console.log(`Taranan Dosya Sayısı: ${allDistFiles.length}`);

const FORBIDDEN_DIST_PATTERNS = [
  { name: 'basvuruSahibi', regex: /"basvuruSahibi"/i },
  { name: 'raw aciklama in JSON', regex: /"aciklama":\s*"[^"]{20,}"/i },
  { name: 'email address pattern', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
];

let totalViolations = 0;

allDistFiles.forEach((f) => {
  const ext = path.extname(f);
  if (!['.js', '.html', '.json', '.css'].includes(ext)) return;
  const content = fs.readFileSync(f, 'utf8');

  FORBIDDEN_DIST_PATTERNS.forEach(({ name, regex }) => {
    if (regex.test(content)) {
      // Exclude standard vite/react internal license emails and internal mock credentials
      const match = content.match(regex)[0];
      if (name === 'email address pattern' && (
        match.includes('github') ||
        match.includes('example.com') ||
        match.includes('w3.org') ||
        match.includes('admin@syp.local') ||
        match.includes('syp.local')
      )) {
        return;
      }
      console.error(`  ✗ RİSK: ${path.relative(DIST_DIR, f)} içinde ${name} (${match}) tespit edildi!`);
      totalViolations++;
    }
  });
});

if (totalViolations === 0) {
  console.log('\n🟢 DIST PRIVACY SCAN: PASS (0 Citizen PII in Production Bundle)');
  process.exit(0);
} else {
  console.error(`\n🔴 DIST PRIVACY SCAN: FAIL (${totalViolations} violations found)`);
  process.exit(1);
}
