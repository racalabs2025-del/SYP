/**
 * scripts/eval_faz4_metrics.mjs
 *
 * Evaluates district SLA breaches, open volumes, and meydan coverage.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const execData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'compiledExecutiveBasvurular.json'), 'utf8'));
const mStats = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'compiledMeydanStats.json'), 'utf8'));

console.log('=== SLA BREACHES BY DISTRICT ===');
const slaByDistrict = {};
for (const item of execData.slaBreachedItems) {
  const d = item.ilce || 'DİĞER';
  slaByDistrict[d] = (slaByDistrict[d] || 0) + 1;
}

const sortedSlaDistricts = Object.entries(slaByDistrict)
  .map(([district, count]) => ({ district, count }))
  .sort((a, b) => b.count - a.count);

console.table(sortedSlaDistricts);

console.log('\n=== OPEN ITEMS BY DISTRICT ===');
const openByDistrict = {};
for (const item of execData.unresolvedItems) {
  const d = item.ilce || 'DİĞER';
  openByDistrict[d] = (openByDistrict[d] || 0) + 1;
}

const sortedOpenDistricts = Object.entries(openByDistrict)
  .map(([district, count]) => ({ district, count }))
  .sort((a, b) => b.count - a.count);

console.table(sortedOpenDistricts);

console.log('\n=== CRITICAL ITEMS ===');
console.log(`Total Critical: ${execData.criticalItems.length}`);
console.log(`Active Critical: ${execData.criticalItems.filter(i => i.durum !== 'Kapandı' && i.durum !== 'Çözüldü').length}`);

process.exit(0);
