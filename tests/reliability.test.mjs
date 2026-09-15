import test from 'node:test';
import assert from 'node:assert/strict';
import { getPanelRole, permissionsForRole } from '../src/utils/permissions.js';
import { authorizePanelRequest } from '../server/authorize.js';
import handler from '../api/deepseek.js';
import { DEFAULT_REFERENCE_DATE, isSlaBreached, getAgingDays, computeDecisionSupportMetrics } from '../src/utils/decisionSupport.js';
import { getApplicationFreshness } from '../src/utils/dataFreshness.js';
import { buildExecutiveBriefingDataset } from '../src/utils/executiveExportDataset.js';
import { buildDailySummary } from '../src/utils/dailySummary.js';
import { getExecutiveChampionsData } from '../src/utils/executiveChampions.js';
import { getDefaultShiftDateRange } from '../src/service/dashboardService.js';

test('only password users with an assigned role can enter the panel', () => {
  for (const role of ['admin', 'editor', 'viewer']) {
    assert.equal(getPanelRole({ sypRole: role, firebase: { sign_in_provider: 'password' } }), role);
    assert.equal(getPanelRole({ sypRole: role, firebase: { sign_in_provider: 'anonymous' } }), null);
  }
  for (const claims of [null, {}, { sypRole: 'admin' }, { sypRole: 'owner', firebase: { sign_in_provider: 'password' } }]) {
    assert.equal(getPanelRole(claims), null);
  }
  assert.deepEqual(permissionsForRole('viewer'), { canRead: true, canWrite: false, canDelete: false });
  assert.deepEqual(permissionsForRole('editor'), { canRead: true, canWrite: true, canDelete: false });
  assert.deepEqual(permissionsForRole('admin'), { canRead: true, canWrite: true, canDelete: true });
  assert.equal(permissionsForRole(null).canRead, false);
});

test('AI authorization rejects missing, invalid, revoked and unassigned tokens', async () => {
  for (const authorization of [undefined, '', 'Basic abc', 'Bearer x y']) {
    assert.equal((await authorizePanelRequest({ headers: { authorization } }, () => assert.fail('must not verify'))).status, 401);
  }
  const request = { headers: { authorization: 'Bearer test-token' } };
  assert.equal((await authorizePanelRequest(request, async () => { throw new Error('revoked'); })).status, 401);
  assert.equal((await authorizePanelRequest(request, async () => ({ firebase: { sign_in_provider: 'password' } }))).status, 403);
  assert.equal((await authorizePanelRequest(request, async () => ({ sypRole: 'admin', firebase: { sign_in_provider: 'anonymous' } }))).status, 403);
  assert.equal((await authorizePanelRequest(request, async (token) => {
    assert.equal(token, 'test-token');
    return { uid: 'viewer', sypRole: 'viewer', firebase: { sign_in_provider: 'password' } };
  })).status, 200);
});

test('deployed AI handler rejects an unauthenticated request before contacting upstream', async () => {
  const response = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ method: 'POST', headers: {}, body: { messages: [] } }, response);
  assert.equal(response.code, 401);
});

test('decision support accepts omitted reference dates and empty input', () => {
  assert.equal(isSlaBreached({ durum: 'Planlama', taahhutTarihi: '2000-01-01' }), true);
  assert.equal(getAgingDays({ tarih: DEFAULT_REFERENCE_DATE }), 0);
  const metrics = computeDecisionSupportMetrics();
  assert.equal(metrics.referenceDate, DEFAULT_REFERENCE_DATE);
  assert.equal(metrics.totalUnique, 0);
  assert.equal(metrics.totalUnresolved, 0);
});

test('report date follows the dataset that produced the metrics', () => {
  const freshness = getApplicationFreshness({ metadata: { referenceDate: '2026-08-14' } }, { lastApplicationDate: '2026-09-11' }, new Date('2026-09-11T12:00:00Z'));
  assert.equal(freshness.date, '2026-08-14');
  assert.equal(freshness.isStale, true);
  assert.equal(getApplicationFreshness(null, null).date, null);
  assert.equal(getApplicationFreshness(null, null).isStale, true);
});

test('empty and zero-valued reports never substitute historical sample numbers', () => {
  for (const executiveData of [null, { metadata: { totalUnique: 0, totalUnresolved: 0, totalSlaBreached: 0, totalAging30Plus: 0 } }]) {
    const dataset = buildExecutiveBriefingDataset({ executiveData });
    assert.equal(dataset.kpiSummary.totalUnique, 0);
    assert.equal(dataset.kpiSummary.totalUnresolved, 0);
    assert.equal(dataset.kpiSummary.totalSlaBreached, 0);
    assert.equal(dataset.kpiSummary.totalAging30Plus, 0);
    assert.ok(dataset.agingBuckets.every((bucket) => bucket.count === 0 && bucket.ratio === '%0'));
  }
});

test('export aging ratios come from the supplied dataset', () => {
  const dataset = buildExecutiveBriefingDataset({ executiveData: { metadata: { referenceDate: '2026-09-01', agingBuckets: [{ id: '0_3', count: 1 }, { id: '30_plus', count: 3 }] } } });
  assert.equal(dataset.agingBuckets[0].ratio, '%25');
  assert.equal(dataset.agingBuckets[4].ratio, '%75');
  assert.equal(dataset.lastDataDate, '2026-09-01');
});

test('daily bulletin preserves empty data and counts people once across shifts', () => {
  const empty = buildDailySummary({ shiftDate: '2026-09-11' });
  assert.equal(empty.staffCount, 0);
  assert.match(empty.text, /0 vardiya, 0 farklı personel, 0 meydan/);
  assert.match(empty.text, /Başvuru özeti bulunmuyor/);
  assert.doesNotMatch(empty.text, /%98|15 personel|13 meydan/);
  const duplicate = buildDailySummary({ todayShifts: [{ personelAdi: 'Test Personel' }, { personelAdi: 'Test Personel' }] });
  assert.equal(duplicate.staffCount, 1);
});

test('personnel summaries do not invent leaders or staffing for empty data', () => {
  const data = getExecutiveChampionsData({ personelData: {} });
  assert.equal(data.generalStats.staffOnDutyToday, 0);
  assert.equal(data.generalStats.staffedMeydansToday, 0);
  assert.equal(data.generalStats.totalAllTimeResolved, 0);
  assert.equal(data.recordLeader.totalRecords, 0);
  assert.equal(data.mobilityLeader.distinctCount, 0);
  assert.equal(data.meydanSpecialist.assignmentCount, 0);
});

test('dashboard default shift date range spans 30 days and produces valid ISO dates', () => {
  const range = getDefaultShiftDateRange('2026-09-11');
  assert.equal(range.to, '2026-09-11');
  assert.equal(range.from, '2026-08-12');
  assert.match(range.from, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(range.to, /^\d{4}-\d{2}-\d{2}$/);
  const fallback = getDefaultShiftDateRange(null);
  assert.ok(fallback.from && fallback.to);
  assert.ok(fallback.from <= fallback.to);
});
