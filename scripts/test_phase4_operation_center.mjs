/**
 * scripts/test_phase4_operation_center.mjs
 *
 * Automated Unit and Integration Tests for Phase 4 Operation Map & Executive Briefing.
 */

import {
  classifyMeydanRisk,
  generateExecutiveBriefingData,
  MEYDAN_OPERATIONAL_STATUSES,
} from '../src/utils/executiveBriefing.js';

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

console.log('=== 1. UNIT TESTS: MEYDAN RISK CLASSIFICATION ===');
const r1 = classifyMeydanRisk({ activeCriticalCount: 1, slaBreachedCount: 20, openCount: 30, plannedStaffCount: 0 });
assert(r1.id === MEYDAN_OPERATIONAL_STATUSES.CRITICAL_ACTIVE.id, 'Active critical takes top priority (CRITICAL_ACTIVE)');

const r2 = classifyMeydanRisk({ activeCriticalCount: 0, slaBreachedCount: 15, openCount: 20, plannedStaffCount: 2 });
assert(r2.id === MEYDAN_OPERATIONAL_STATUSES.SLA_RISK.id, 'SLA breach >= 10 -> SLA_RISK');

const r3 = classifyMeydanRisk({ activeCriticalCount: 0, slaBreachedCount: 2, openCount: 4, plannedStaffCount: 0 });
assert(r3.id === MEYDAN_OPERATIONAL_STATUSES.NO_STAFF.id, 'Planned staff 0 with low SLA -> NO_STAFF');

const r4 = classifyMeydanRisk({ activeCriticalCount: 0, slaBreachedCount: 4, openCount: 9, plannedStaffCount: 2 });
assert(r4.id === MEYDAN_OPERATIONAL_STATUSES.HIGH_OPEN_VOLUME.id, 'Open count >= 8 with staff -> HIGH_OPEN_VOLUME');

const r5 = classifyMeydanRisk({ activeCriticalCount: 0, slaBreachedCount: 1, openCount: 2, plannedStaffCount: 2 });
assert(r5.id === MEYDAN_OPERATIONAL_STATUSES.NORMAL.id, 'Low counts with staff -> NORMAL');

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const execData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'compiledExecutiveBasvurular.json'), 'utf8'));
const freshnessData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'dataFreshness.json'), 'utf8'));

console.log('\n=== 2. INTEGRATION TESTS: EXECUTIVE BRIEFING DATA MODEL ===');
const briefingData = generateExecutiveBriefingData({
  todayShifts: [{ meydanId: 'kadikoy', personelAdi: 'Mustafa Kaya' }],
  activeMeydanlar: [{ id: 'kadikoy', isim: 'Kadıköy' }, { id: 'uskudar', isim: 'Üsküdar' }],
  executiveData: execData,
  freshnessData,
});

const kpi = briefingData.kpiSummary;
assert(kpi.totalUnresolved === 232, `KPI totalUnresolved is 232 (found: ${kpi.totalUnresolved})`);
assert(kpi.totalSlaBreached === 173, `KPI totalSlaBreached is 173 (found: ${kpi.totalSlaBreached})`);
assert(kpi.totalAging30Plus === 147, `KPI totalAging30Plus is 147 (found: ${kpi.totalAging30Plus})`);
assert(kpi.activeCritical === 0, `KPI activeCritical is 0 (found: ${kpi.activeCritical})`);
assert(kpi.totalCritical === 32, `KPI totalCritical is 32 (found: ${kpi.totalCritical})`);
assert(briefingData.topSlaDistricts.length <= 5, 'topSlaDistricts length <= 5');
assert(briefingData.topSlaDistricts[0].district === 'ÜSKÜDAR', `topSlaDistricts #1 is ÜSKÜDAR (found: ${briefingData.topSlaDistricts[0]?.district})`);
assert(briefingData.actionItems.length <= 3, `Action items length is <= 3 (found: ${briefingData.actionItems.length})`);
assert(briefingData.lastDataDateFormatted === '14 Ağustos 2026', `Data date is 14 Ağustos 2026 (found: ${briefingData.lastDataDateFormatted})`);

console.log(`\n================================================================`);
console.log(`FAZ 4 TEST SONUÇLARI: ${passedTests} / ${totalTests} Başarılı (${passedTests === totalTests ? '🟢 ALL PASS' : '🔴 SOME FAILED'})`);
console.log(`================================================================\n`);

process.exit(passedTests === totalTests ? 0 : 1);
