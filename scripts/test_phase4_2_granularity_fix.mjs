/**
 * scripts/test_phase4_2_granularity_fix.mjs
 *
 * Automated Unit and Integration Tests for Phase 4.2 Granularity and Presentation Accuracy Fix.
 */

import {
  classifyMeydanRisk,
  generateExecutiveBriefingData,
  MEYDAN_OPERATIONAL_STATUSES,
  RISK_THRESHOLDS,
} from '../src/utils/executiveBriefing.js';
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

console.log('=== 1. RISK STATUSES GRANULARITY & LABELS AUDIT ===');
assert(MEYDAN_OPERATIONAL_STATUSES.CRITICAL_ACTIVE.granularity === 'DISTRICT_LEVEL', 'CRITICAL_ACTIVE is DISTRICT_LEVEL');
assert(MEYDAN_OPERATIONAL_STATUSES.CRITICAL_ACTIVE.label === 'İlçede Aktif Kritik İş', 'CRITICAL_ACTIVE label is "İlçede Aktif Kritik İş"');
assert(MEYDAN_OPERATIONAL_STATUSES.SLA_RISK.granularity === 'DISTRICT_LEVEL', 'SLA_RISK is DISTRICT_LEVEL');
assert(MEYDAN_OPERATIONAL_STATUSES.SLA_RISK.label === 'İlçe SLA Riski Yüksek', 'SLA_RISK label is "İlçe SLA Riski Yüksek"');
assert(MEYDAN_OPERATIONAL_STATUSES.HIGH_OPEN_VOLUME.granularity === 'DISTRICT_LEVEL', 'HIGH_OPEN_VOLUME is DISTRICT_LEVEL');
assert(MEYDAN_OPERATIONAL_STATUSES.HIGH_OPEN_VOLUME.label === 'İlçede Açık İş Yoğunluğu', 'HIGH_OPEN_VOLUME label is "İlçede Açık İş Yoğunluğu"');
assert(MEYDAN_OPERATIONAL_STATUSES.NO_STAFF.granularity === 'MEYDAN_LEVEL', 'NO_STAFF is MEYDAN_LEVEL');
assert(MEYDAN_OPERATIONAL_STATUSES.NO_STAFF.label === 'Meydan Nöbetçisi Yok', 'NO_STAFF label is "Meydan Nöbetçisi Yok"');
assert(MEYDAN_OPERATIONAL_STATUSES.NORMAL.granularity === 'MEYDAN_LEVEL', 'NORMAL is MEYDAN_LEVEL');

console.log('\n=== 2. CENTRALIZED THRESHOLDS AUDIT ===');
assert(RISK_THRESHOLDS.SLA_RISK_THRESHOLD === 10, 'SLA_RISK_THRESHOLD is centralized as 10 (P85)');
assert(RISK_THRESHOLDS.HIGH_OPEN_VOLUME_THRESHOLD === 8, 'HIGH_OPEN_VOLUME_THRESHOLD is centralized as 8 (P70)');

console.log('\n=== 3. MULTI-MEYDAN DISTRICTS & SHIFT ISOLATION AUDIT ===');
const execData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'compiledExecutiveBasvurular.json'), 'utf8'));
const freshnessData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'dataFreshness.json'), 'utf8'));

// Sample shifts: Taksim has 2 staff, Şişhane has 0 staff. Both in Beyoğlu.
const testShifts = [
  { meydanId: 'taksim', personelAdi: 'Ahmet Yılmaz', saatAraligi: '09:00 - 18:00' },
  { meydanId: 'taksim', personelAdi: 'Mehmet Demir', saatAraligi: '09:00 - 18:00' },
];

const testMeydanlar = [
  { id: 'taksim', name: 'Taksim', ilce: 'BEYOĞLU' },
  { id: 'sishane', name: 'Şişhane', ilce: 'BEYOĞLU' },
];

const bData = generateExecutiveBriefingData({
  todayShifts: testShifts,
  activeMeydanlar: testMeydanlar,
  executiveData: execData,
  freshnessData,
});

assert(bData.staffByMeydan.get('taksim') === 2, 'Taksim has 2 planned staff (Meydan level)');
assert((bData.staffByMeydan.get('sishane') || 0) === 0, 'Şişhane has 0 planned staff (Meydan level)');
assert(bData.unstaffedMeydanlar.some(m => m.id === 'sishane'), 'Şişhane correctly identified in unstaffed list');
assert(bData.slaByDistrict['BEYOĞLU'] === 21, 'Beyoğlu district SLA breaches is 21 (District level shared)');

console.log('\n=== 4. AI PROMPT GRANULARITY SAFETY RULE AUDIT ===');
const aiFileContent = fs.readFileSync(path.join(ROOT, 'src', 'components', 'dashboard', 'AIDailyExecutiveSummary.jsx'), 'utf8');
assert(aiFileContent.includes('KRİTİK GRANÜLERLİK KURALI'), 'AI prompt contains KRİTİK GRANÜLERLİK KURALI');
assert(aiFileContent.includes('Başvuru, SLA ve kritik iş verileri İLÇE seviyesindedir'), 'AI prompt warns that application/SLA is district level');

console.log(`\n================================================================`);
console.log(`FAZ 4.2 TEST SONUÇLARI: ${passedTests} / ${totalTests} Başarılı (${passedTests === totalTests ? '🟢 ALL PASS' : '🔴 SOME FAILED'})`);
console.log(`================================================================\n`);

process.exit(passedTests === totalTests ? 0 : 1);
