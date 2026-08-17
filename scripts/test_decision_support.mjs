/**
 * scripts/test_decision_support.mjs
 *
 * Automated Unit and Edge-Case Tests for Executive Decision Support System.
 */

import {
  getStatusCategory,
  isOpenOrInProgress,
  isSlaBreached,
  getAgingDays,
  getAgingBucket,
  isCriticalApplication,
  computeDecisionSupportMetrics,
  STATUS_CATEGORIES,
} from '../src/utils/decisionSupport.js';
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

console.log('=== 1. UNIT TESTS: STATUS CLASSIFICATION ===');
assert(getStatusCategory('Kapandı') === STATUS_CATEGORIES.CLOSED, 'Kapandı -> closed');
assert(getStatusCategory('Çözüldü') === STATUS_CATEGORIES.CLOSED, 'Çözüldü -> closed');
assert(getStatusCategory('Planlama') === STATUS_CATEGORIES.IN_PROGRESS, 'Planlama -> in_progress');
assert(getStatusCategory('Beklemede') === STATUS_CATEGORIES.IN_PROGRESS, 'Beklemede -> in_progress');
assert(getStatusCategory('Çalışılıyor') === STATUS_CATEGORIES.IN_PROGRESS, 'Çalışılıyor -> in_progress');
assert(getStatusCategory('Değerlendirme') === STATUS_CATEGORIES.IN_PROGRESS, 'Değerlendirme -> in_progress');
assert(getStatusCategory('Atama Bekliyor') === STATUS_CATEGORIES.OPEN, 'Atama Bekliyor -> open');
assert(getStatusCategory('Yeni Başvuru') === STATUS_CATEGORIES.OPEN, 'Yeni Başvuru -> open');
assert(isOpenOrInProgress('Planlama') === true, 'Planlama isOpenOrInProgress');
assert(isOpenOrInProgress('Kapandı') === false, 'Kapandı !isOpenOrInProgress');

console.log('\n=== 2. UNIT TESTS: SLA BREACH RULES ===');
const ref = '2026-08-14';
assert(isSlaBreached({ durum: 'Planlama', taahhutTarihi: '2026-08-10' }, ref) === true, 'Past commitment date -> breached');
assert(isSlaBreached({ durum: 'Planlama', taahhutTarihi: '2026-08-20' }, ref) === false, 'Future commitment date -> not breached');
assert(isSlaBreached({ durum: 'Planlama', taahhutTarihi: '2026-08-14' }, ref) === false, 'Today commitment date -> not breached');
assert(isSlaBreached({ durum: 'Planlama', taahhutTarihi: null }, ref) === false, 'Missing commitment date -> not breached');
assert(isSlaBreached({ durum: 'Kapandı', taahhutTarihi: '2026-08-01' }, ref) === false, 'Closed record -> not breached');

console.log('\n=== 3. UNIT TESTS: AGING & BUCKETS ===');
assert(getAgingDays({ tarih: '2026-08-14' }, ref) === 0, 'Same day -> 0 days');
assert(getAgingDays({ tarih: '2026-08-10' }, ref) === 4, '4 days difference');
assert(getAgingDays({ tarih: '2026-07-14' }, ref) === 31, '31 days difference');
assert(getAgingBucket(2) === '0_3', '2 days -> 0_3');
assert(getAgingBucket(5) === '4_7', '5 days -> 4_7');
assert(getAgingBucket(10) === '8_14', '10 days -> 8_14');
assert(getAgingBucket(20) === '15_30', '20 days -> 15_30');
assert(getAgingBucket(35) === '30_plus', '35 days -> 30_plus');

console.log('\n=== 4. UNIT TESTS: CRITICAL APPLICATION ===');
assert(isCriticalApplication({ onemDerecesi: '2-Yüksek' }) === true, '2-Yüksek -> critical');
assert(isCriticalApplication({ onemDerecesi: '4-Düşük' }) === false, '4-Düşük -> not critical');
assert(isCriticalApplication({ onemDerecesi: null }) === false, 'null -> not critical');

console.log('\n=== 5. INTEGRATION TEST: REAL COMPILED EXECUTIVE DATASET ===');
const execPath = path.join(ROOT, 'src', 'data', 'compiledExecutiveBasvurular.json');
assert(fs.existsSync(execPath), 'compiledExecutiveBasvurular.json exists');

const execData = JSON.parse(fs.readFileSync(execPath, 'utf8'));
const meta = execData.metadata;

assert(meta.totalUnique === 11268, `Total unique is 11268 (found: ${meta.totalUnique})`);
assert(meta.totalUnresolved === 232, `Total unresolved is 232 (found: ${meta.totalUnresolved})`);
assert(meta.totalSlaBreached === 173, `Total SLA breached is 173 (found: ${meta.totalSlaBreached})`);
assert(meta.totalAging30Plus === 147, `Total 30+ days is 147 (found: ${meta.totalAging30Plus})`);
assert(meta.totalCritical === 32, `Total critical is 32 (found: ${meta.totalCritical})`);
assert(execData.slaBreachedItems.length === 173, `slaBreachedItems length is 173 (found: ${execData.slaBreachedItems.length})`);
assert(execData.criticalItems.length === 32, `criticalItems length is 32 (found: ${execData.criticalItems.length})`);

console.log(`\n================================================================`);
console.log(`TEST SONUÇLARI: ${passedTests} / ${totalTests} Başarılı (${passedTests === totalTests ? '🟢 ALL PASS' : '🔴 SOME FAILED'})`);
console.log(`================================================================\n`);

process.exit(passedTests === totalTests ? 0 : 1);
