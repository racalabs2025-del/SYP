/**
 * scripts/test_terminology_neutrality.mjs
 *
 * Automated Test for User-Facing Terminology Neutrality.
 * Asserts that user-visible strings do not display "DeepSeek", "Yapay Zeka", "AI Desteği", "AI Yönetici".
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(ROOT, 'src');

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

console.log('=== 1. USER-FACING JSX / UI TERMINOLOGY AUDIT ===');

const UI_FILES = [
  path.join(SRC_DIR, 'components', 'dashboard', 'AIDailyExecutiveSummary.jsx'),
  path.join(SRC_DIR, 'components', 'dashboard', 'ExcelWizardModal.jsx'),
  path.join(SRC_DIR, 'components', 'dashboard', 'DataManagementSection.jsx'),
  path.join(SRC_DIR, 'components', 'dashboard', 'SectionToggleBar.jsx'),
  path.join(SRC_DIR, 'components', 'dashboard', 'ExecutiveBriefingCenter.jsx'),
  path.join(SRC_DIR, 'pages', 'Dashboard.jsx'),
  path.join(SRC_DIR, 'utils', 'pdfExport.js'),
  path.join(SRC_DIR, 'utils', 'excelExport.js'),
];

const FORBIDDEN_UI_STRINGS = [
  'DeepSeek AI',
  'DeepSeek Bülteni',
  'DeepSeek Çözümlüyor',
  'DeepSeek yapay zekası',
  'AI COPILOT',
  'Günlük AI Bülteni',
  'AI Desteği',
  'AI içerikleri',
  'Yapay Zeka Yönetici',
];

for (const filePath of UI_FILES) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  const baseName = path.basename(filePath);

  for (const forbidden of FORBIDDEN_UI_STRINGS) {
    const hasForbidden = content.includes(forbidden);
    assert(!hasForbidden, `${baseName} does not contain user-facing '${forbidden}'`);
  }
}

console.log('\n=== 2. POSITIVE CORPORATE TERMINOLOGY AUDIT ===');
const aiSummaryContent = fs.readFileSync(path.join(SRC_DIR, 'components', 'dashboard', 'AIDailyExecutiveSummary.jsx'), 'utf8');
assert(aiSummaryContent.includes('Günlük Akıllı Yönetici Bülteni'), 'AIDailyExecutiveSummary has "Günlük Akıllı Yönetici Bülteni"');
assert(aiSummaryContent.includes('AKILLI BRİFİNG'), 'AIDailyExecutiveSummary has "AKILLI BRİFİNG"');
assert(aiSummaryContent.includes('Günlük Akıllı Bülten Üret'), 'AIDailyExecutiveSummary button says "Günlük Akıllı Bülten Üret"');

const sectionToggleContent = fs.readFileSync(path.join(SRC_DIR, 'components', 'dashboard', 'SectionToggleBar.jsx'), 'utf8');
assert(sectionToggleContent.includes('Akıllı Destek'), 'SectionToggleBar has "Akıllı Destek"');

console.log(`\n================================================================`);
console.log(`TERMINOLOGY TEST SONUÇLARI: ${passedTests} / ${totalTests} Başarılı (${passedTests === totalTests ? '🟢 ALL PASS' : '🔴 SOME FAILED'})`);
console.log(`================================================================\n`);

process.exit(passedTests === totalTests ? 0 : 1);
