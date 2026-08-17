/**
 * scripts/test_privacy_boundary.mjs
 *
 * Automated Privacy Regression Test Suite for SYP Phase 6.1.
 * Tests synthetic fixtures, compiled JSONs, AI boundaries, and export datasets.
 */

import {
  toPrivacySafeApplication,
  validateNoCitizenPII,
  ALLOWED_APPLICATION_FIELDS,
  FORBIDDEN_CITIZEN_FIELDS,
} from '../src/utils/privacySafeApplication.js';
import { buildExecutiveBriefingDataset } from '../src/utils/executiveExportDataset.js';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(ROOT, 'src', 'data');

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

console.log('=== 1. SYNTHETIC FIXTURE PRIVACY SANITIZATION TEST ===');
const syntheticRawRecord = {
  docId: '1-99999999999',
  basvuruNo: '1-99999999999',
  tarih: '2026-08-10',
  taahhutTarihi: '2026-08-18',
  ilce: 'KADIKÖY',
  mahalle: 'MODA',
  meydanId: 'kadikoy',
  durum: 'Planlama',
  konu: 'Park Bahçe',
  altKonu: 'Bank Onarımı',
  onemDerecesi: '4-Düşük',
  personelAdi: 'MUSTAFA KAYA',
  // SENSITIVE / FORBIDDEN CITIZEN FIELDS:
  basvuruSahibi: 'Vatandaş Ahmet Yılmaz',
  vatandas: 'Ahmet Yılmaz',
  aciklama: 'Boya dökülmüş telefonum 05321112233 adresim no:12 daire:4',
  ozet: 'Ahmet Yılmaz 05321112233',
  telefon: '05321112233',
  email: 'ahmet@example.com',
  tckn: '12345678901',
  kapiNo: '12',
};

const sanitized = toPrivacySafeApplication(syntheticRawRecord);

assert(sanitized.basvuruNo === '1-99999999999', 'Operational basvuruNo is preserved');
assert(sanitized.ilce === 'KADIKÖY', 'Operational ilce is preserved');
assert(sanitized.personelAdi === 'MUSTAFA KAYA', 'Personnel name is preserved');
assert(sanitized.aciklama === undefined, 'Raw citizen aciklama is dropped');
assert(sanitized.basvuruSahibi === undefined, 'Citizen name basvuruSahibi is dropped');
assert(sanitized.telefon === undefined, 'Citizen phone is dropped');
assert(sanitized.email === undefined, 'Citizen email is dropped');
assert(sanitized.tckn === undefined, 'Citizen TCKN is dropped');
assert(sanitized.kapiNo === undefined, 'Citizen door number is dropped');
assert(validateNoCitizenPII(sanitized) === true, 'Sanitized record validates as 100% PII-free');

console.log('\n=== 2. COMPILED JSON DATASETS PRIVACY AUDIT ===');
const execData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'compiledExecutiveBasvurular.json'), 'utf8'));

let execForbiddenCount = 0;
for (const item of execData.unresolvedItems) {
  for (const forbidden of FORBIDDEN_CITIZEN_FIELDS) {
    if (forbidden in item) {
      execForbiddenCount++;
    }
  }
}
assert(execForbiddenCount === 0, `compiledExecutiveBasvurular.json has 0 forbidden citizen fields (found: ${execForbiddenCount})`);

const mStats = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'compiledMeydanStats.json'), 'utf8'));
let mStatsForbiddenCount = 0;
for (const [mId, mObj] of Object.entries(mStats)) {
  for (const sb of (mObj.sonBasvurular || [])) {
    for (const forbidden of FORBIDDEN_CITIZEN_FIELDS) {
      if (forbidden in sb) {
        mStatsForbiddenCount++;
      }
    }
  }
}
assert(mStatsForbiddenCount === 0, `compiledMeydanStats.json has 0 forbidden citizen fields (found: ${mStatsForbiddenCount})`);

console.log('\n=== 3. AI PROMPT BOUNDARY TEST ===');
const aiCode = fs.readFileSync(path.join(ROOT, 'src', 'components', 'dashboard', 'AIDailyExecutiveSummary.jsx'), 'utf8');
assert(!aiCode.includes('basvuruAciklamasi') && !aiCode.includes('item.aciklama'), 'AI prompt does not consume raw application aciklama');

console.log('\n=== 4. EXPORT DATASET BOUNDARY TEST ===');
const freshnessData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'dataFreshness.json'), 'utf8'));
const exportDataset = buildExecutiveBriefingDataset({
  todayShifts: [],
  activeMeydanlar: [],
  executiveData: execData,
  freshnessData,
});

let exportForbiddenCount = 0;
for (const item of exportDataset.slaBreachedItems) {
  for (const forbidden of FORBIDDEN_CITIZEN_FIELDS) {
    if (forbidden in item) {
      exportForbiddenCount++;
    }
  }
}
assert(exportForbiddenCount === 0, `Export dataset slaBreachedItems has 0 forbidden citizen fields (found: ${exportForbiddenCount})`);

console.log(`\n================================================================`);
console.log(`PRIVACY TEST SONUÇLARI: ${passedTests} / ${totalTests} Başarılı (${passedTests === totalTests ? '🟢 ALL PASS' : '🔴 SOME FAILED'})`);
console.log(`================================================================\n`);

process.exit(passedTests === totalTests ? 0 : 1);
