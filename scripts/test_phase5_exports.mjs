/**
 * scripts/test_phase5_exports.mjs
 *
 * Automated Unit and Integration Tests for Phase 5 Executive Briefing Exports & Presentation Mode.
 */

import { buildExecutiveBriefingDataset } from '../src/utils/executiveExportDataset.js';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('=== 1. EXECUTIVE BRIEFING DATASET INTEGRITY TEST ===');
const execData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'compiledExecutiveBasvurular.json'), 'utf8'));
const freshnessData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'dataFreshness.json'), 'utf8'));

const testShifts = [
  { meydanId: 'kadikoy', personelAdi: 'Mustafa Kaya' },
  { meydanId: 'taksim', personelAdi: 'Ahmet Yılmaz' },
];

const testMeydanlar = [
  { id: 'kadikoy', name: 'Kadıköy', ilce: 'KADIKÖY' },
  { id: 'taksim', name: 'Taksim', ilce: 'BEYOĞLU' },
  { id: 'uskudar', name: 'Üsküdar', ilce: 'ÜSKÜDAR' },
];

const dataset = buildExecutiveBriefingDataset({
  todayShifts: testShifts,
  activeMeydanlar: testMeydanlar,
  executiveData: execData,
  freshnessData,
});

assert(dataset.kpiSummary.totalUnique === 11268, `Total unique is 11268 (found: ${dataset.kpiSummary.totalUnique})`);
assert(dataset.kpiSummary.totalUnresolved === 232, `Total unresolved is 232 (found: ${dataset.kpiSummary.totalUnresolved})`);
assert(dataset.kpiSummary.totalSlaBreached === 173, `Total SLA breached is 173 (found: ${dataset.kpiSummary.totalSlaBreached})`);
assert(dataset.kpiSummary.totalAging30Plus === 147, `Total 30+ days is 147 (found: ${dataset.kpiSummary.totalAging30Plus})`);
assert(dataset.kpiSummary.activeCritical === 0, `Active critical is 0 (found: ${dataset.kpiSummary.activeCritical})`);
assert(dataset.kpiSummary.totalCritical === 32, `Total critical is 32 (found: ${dataset.kpiSummary.totalCritical})`);
assert(dataset.lastDataDate === '2026-08-14', `Snapshot date is 2026-08-14 (found: ${dataset.lastDataDate})`);
assert(dataset.generatedAtFormatted !== dataset.lastDataDateFormatted, 'Snapshot date and generation date are distinct');

console.log('\n=== 2. AGING & DISTRICTS BREAKDOWN TEST ===');
assert(dataset.agingBuckets.length === 5, 'Aging has 5 buckets');
assert(dataset.agingBuckets.find(b => b.key === '30_plus')?.count === 147, '30+ bucket count is 147');
assert(dataset.topSlaDistricts.length <= 5, 'Top SLA districts <= 5');
assert(dataset.topSlaDistricts[0].district === 'ÜSKÜDAR', 'Top SLA district is Üsküdar');
assert(dataset.slaBreachedItems.length === 173, `SLA Breached items length is 173 (found: ${dataset.slaBreachedItems.length})`);
assert(dataset.criticalItems.length === 32, `Critical items length is 32 (found: ${dataset.criticalItems.length})`);

console.log('\n=== 3. MEYDAN STAFFING & GRANULARITY NOTICE TEST ===');
assert(dataset.kpiSummary.unstaffedMeydanCount === 1, `Unstaffed meydan count is 1 (Üsküdar in test) (found: ${dataset.kpiSummary.unstaffedMeydanCount})`);
assert(dataset.granularityNotice.includes('DISTRICT_LEVEL') && dataset.granularityNotice.includes('MEYDAN_LEVEL'), 'Granularity notice declares both district and meydan levels');

console.log(`\n================================================================`);
console.log(`FAZ 5 TEST SONUÇLARI: ${passedTests} / ${totalTests} Başarılı (${passedTests === totalTests ? '🟢 ALL PASS' : '🔴 SOME FAILED'})`);
console.log(`================================================================\n`);

process.exit(passedTests === totalTests ? 0 : 1);
