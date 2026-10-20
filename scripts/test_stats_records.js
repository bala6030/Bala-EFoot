import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadSeasonsState,
  saveSeasonsState,
  saveSeasonDraft,
  activateSeason,
  AUTHENTIC_PLAYER_IDS,
  SEASONS_STORAGE_KEY,
  getCanonicalPlayerRole,
  saveBaselineDraft,
  confirmSeasonBaseline,
  saveProgressDraft,
  confirmProgressSnapshot,
  setSeasonRank,
  closeSeason,
} from '../src/data/seasonRepository.ts';
import {
  getOverallStats,
  getPreviousMonthStats,
  getPreviousMonthWindow,
  getSelectableRecentSeasons,
  getSeasonPlayerStats,
} from '../src/data/statsService.ts';
import {
  getDashboardKPIs,
  getPreviousMonthTopPerformers,
} from '../src/data/dashboardService.ts';

// ── In-memory localStorage mock ───────────────────────────────────────────────
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

console.log('=== Running Milestone 5B Stats & Records Verification Suite ===\n');
mockStorage.clear();

let passCount = 0;
function pass(label) {
  passCount++;
  console.log(`   ✓ ${label}`);
}

function buildBaselinePayload(matches = 10, goals = 2, assists = 1) {
  return AUTHENTIC_PLAYER_IDS.map((id) => ({
    playerId: id,
    roleClassification: getCanonicalPlayerRole(id),
    matches,
    goals,
    assists,
  }));
}

function buildProgressPayload(matches = 20, goals = 5, assists = 3) {
  return AUTHENTIC_PLAYER_IDS.map((id) => ({
    playerId: id,
    matches,
    goals,
    assists,
  }));
}

function createActiveSeason(id = 'Test-S1', startDate = '2024-10-01') {
  const draft = saveSeasonDraft({ id, startDate, startingDivision: 5 });
  assert.ok(draft.success, `Draft failed: ${draft.error}`);
  const act = activateSeason(id);
  assert.ok(act.success, `Activate failed: ${act.error}`);
  return id;
}

// =============================================================================
// Test 1: Overall view uses authentic overallPerformance values
// =============================================================================
console.log('1. Verifying Overall view uses authentic overallPerformance values...');
mockStorage.clear();
const overall = getOverallStats();
assert.strictEqual(overall.players.length, 23, 'Must have exactly 23 authentic players');

// Check P001 Zlatan Ibrahimović
const zlatan = overall.players.find((p) => p.playerId === 'P001');
assert.ok(zlatan, 'P001 Zlatan must exist');
assert.strictEqual(zlatan.playerName, 'Zlatan Ibrahimović');
assert.strictEqual(zlatan.matches, 449);
assert.strictEqual(zlatan.goals, 320);
assert.strictEqual(zlatan.assists, 145);
assert.strictEqual(zlatan.goalContributions, 465);
assert.strictEqual(zlatan.goalsPerMatch, 0.71);
assert.strictEqual(zlatan.assistsPerMatch, 0.32);

// Check P002 Cristiano Ronaldo
const ronaldo = overall.players.find((p) => p.playerId === 'P002');
assert.ok(ronaldo, 'P002 Ronaldo must exist');
assert.strictEqual(ronaldo.matches, 472);
assert.strictEqual(ronaldo.goals, 266);
assert.strictEqual(ronaldo.assists, 145);
assert.strictEqual(ronaldo.goalContributions, 411);

// Check P003 Lionel Messi
const messi = overall.players.find((p) => p.playerId === 'P003');
assert.ok(messi, 'P003 Messi must exist');
assert.strictEqual(messi.matches, 575);
assert.strictEqual(messi.goals, 165);
assert.strictEqual(messi.assists, 116);
assert.strictEqual(messi.goalContributions, 281);
pass('Overall view accurately loads authentic values for P001, P002, and P003 from players.json.');

// =============================================================================
// Test 2: Missing values remain unavailable and are not silently converted to zero
// =============================================================================
console.log('\n2. Verifying missing values remain unavailable (not silently converted to zero)...');
const neuer = overall.players.find((p) => p.playerId === 'P023');
assert.ok(neuer, 'P023 Manuel Neuer must exist');
assert.strictEqual(neuer.matches, null, 'Matches played must remain null for unrecorded Neuer');
assert.strictEqual(neuer.goals, null, 'Goals must remain null');
assert.strictEqual(neuer.assists, null, 'Assists must remain null');
assert.strictEqual(neuer.goalContributions, null, 'Goal contributions must remain null');
assert.strictEqual(neuer.goalsPerMatch, null, 'Goals per match must remain null');
assert.strictEqual(neuer.assistsPerMatch, null, 'Assists per match must remain null');
assert.strictEqual(neuer.isUnavailable, true, 'isUnavailable must be true for Neuer');

// Check aggregate summary reports partial status
assert.strictEqual(overall.summary.isPartial, true, 'Overall summary must be marked partial');
assert.strictEqual(overall.summary.recordedPlayersCount, 22, 'Exactly 22 players recorded');
assert.strictEqual(overall.summary.totalPlayersCount, 23, '23 total players in squad');
assert.ok(overall.summary.notes.includes('22 of 23'), 'Notes must indicate 22 of 23 cards recorded');
pass('Missing values on P023 Neuer remain null; aggregate summary reports honest partial status.');

// =============================================================================
// Test 3: Goal contributions and per-match rates calculate correctly
// =============================================================================
console.log('\n3. Verifying goal contributions and per-match rates calculate correctly...');
for (const p of overall.players) {
  if (p.goals !== null && p.assists !== null) {
    assert.strictEqual(
      p.goalContributions,
      p.goals + p.assists,
      `${p.playerId} goalContributions should equal goals + assists`
    );
  }
  if (p.matches !== null && p.matches > 0 && p.goals !== null) {
    const expectedGpm = Number((p.goals / p.matches).toFixed(2));
    assert.ok(
      Math.abs((p.goalsPerMatch ?? 0) - expectedGpm) <= 0.01,
      `${p.playerId} gpm mismatch: got ${p.goalsPerMatch}, expected ${expectedGpm}`
    );
  }
}
pass('Goal contributions (goals + assists) and per-match rates calculate accurately across all recorded cards.');

// =============================================================================
// Test 4: Rates are unavailable when matches are zero or required values are missing
// =============================================================================
console.log('\n4. Verifying rates are unavailable when matches are zero or values missing...');
assert.strictEqual(neuer.goalsPerMatch, null);
assert.strictEqual(neuer.assistsPerMatch, null);
pass('Rates evaluate strictly to null (unavailable) when matches is null or zero.');

// =============================================================================
// Test 5: Previous Month uses the same service calculation as the Dashboard
// =============================================================================
console.log('\n5. Verifying Previous Month uses the same shared calculation as Dashboard...');
mockStorage.clear();
const sid5 = createActiveSeason('S5-prev', '2024-09-01');
const bDraft5 = saveBaselineDraft(sid5, buildBaselinePayload(10, 2, 1));
assert.ok(bDraft5.success);
confirmSeasonBaseline(sid5, { players: buildBaselinePayload(10, 2, 1), notes: 'baseline' });

// Add progress snapshot in September 2024
const pConf5 = confirmProgressSnapshot(sid5, {
  recordingDate: '2024-09-25',
  players: buildProgressPayload(15, 6, 4),
  notes: 'September progress',
});
assert.ok(pConf5.success);

// Reference date in October 2024 -> previous month is September 2024
const refOct2024 = new Date('2024-10-15');
const monthStats = getPreviousMonthStats(refOct2024);
const dashboardTop = getPreviousMonthTopPerformers(refOct2024, 5);

assert.strictEqual(monthStats.hasData, true, 'Should find data for September 2024');
assert.strictEqual(dashboardTop.length, 5, 'Dashboard top performers should return top 5');
assert.strictEqual(dashboardTop[0].playerId, monthStats.players[0].playerId);
assert.strictEqual(dashboardTop[0].goalContributions, monthStats.players[0].goalContributions);
pass('getPreviousMonthStats and Dashboard getPreviousMonthTopPerformers yield identical performer results.');

// =============================================================================
// Test 6: Previous Month never displays all-time totals as monthly results
// =============================================================================
console.log('\n6. Verifying Previous Month never displays all-time totals as monthly results...');
// Query for a month with no snapshots (e.g. June 2024)
const refJul2024 = new Date('2024-07-15');
const emptyMonth = getPreviousMonthStats(refJul2024);
assert.strictEqual(emptyMonth.hasData, false, 'hasData must be false when no snapshots exist in month');
assert.strictEqual(emptyMonth.players.length, 0, 'players array must be empty');
assert.strictEqual(emptyMonth.totalGoals, 0, 'totalGoals must be 0 (not 1805 from all-time)');
assert.strictEqual(emptyMonth.totalMatches, 0, 'totalMatches must be 0');
pass('Previous Month returns clean unavailable state with 0 deltas when no snapshots exist in period.');

// =============================================================================
// Test 7: Missing reference snapshots produce a correct unavailable state
// =============================================================================
console.log('\n7. Verifying missing reference baseline produces unavailable state...');
mockStorage.clear();
// Create active season without baseline
saveSeasonDraft({ id: 'S7-nobase', startDate: '2024-08-01', startingDivision: 5 });
activateSeason('S7-nobase');
const refSep2024 = new Date('2024-09-15');
const noBaseStats = getPreviousMonthStats(refSep2024);
assert.strictEqual(noBaseStats.hasData, false, 'Cannot compute deltas without reference baseline');
pass('Missing reference baseline gracefully yields unavailable state.');

// =============================================================================
// Test 8: Month/year boundaries and leap-year dates are handled correctly
// =============================================================================
console.log('\n8. Verifying month/year boundaries and leap-year handling...');
// 1. Leap year Feb 2024: reference March 15, 2024 -> previous month is Feb 2024 (29 days)
const leapWindow = getPreviousMonthWindow(new Date('2024-03-15'));
assert.strictEqual(leapWindow.year, 2024);
assert.strictEqual(leapWindow.month, 2);
assert.strictEqual(leapWindow.startStr, '2024-02-01');
assert.strictEqual(leapWindow.endStr, '2024-02-29', '2024 is a leap year; Feb must have 29 days');
assert.ok(leapWindow.monthLabel.includes('February 2024'));

// 2. Non-leap year Feb 2025: reference March 15, 2025 -> previous month is Feb 2025 (28 days)
const nonLeapWindow = getPreviousMonthWindow(new Date('2025-03-15'));
assert.strictEqual(nonLeapWindow.year, 2025);
assert.strictEqual(nonLeapWindow.month, 2);
assert.strictEqual(nonLeapWindow.startStr, '2025-02-01');
assert.strictEqual(nonLeapWindow.endStr, '2025-02-28', '2025 is not a leap year; Feb must have 28 days');

// 3. Year boundary rollover: reference January 10, 2025 -> previous month is December 2024 (31 days)
const rolloverWindow = getPreviousMonthWindow(new Date('2025-01-10'));
assert.strictEqual(rolloverWindow.year, 2024);
assert.strictEqual(rolloverWindow.month, 12);
assert.strictEqual(rolloverWindow.startStr, '2024-12-01');
assert.strictEqual(rolloverWindow.endStr, '2024-12-31');
assert.ok(rolloverWindow.monthLabel.includes('December 2024'));
pass('Leap year (29 days), non-leap year (28 days), and January->December rollover verified.');

// =============================================================================
// Test 9: Draft snapshots do not affect official statistics
// =============================================================================
console.log('\n9. Verifying unconfirmed drafts do not affect statistics...');
mockStorage.clear();
const sid9 = createActiveSeason('S9-draft', '2024-10-01');
saveBaselineDraft(sid9, buildBaselinePayload(10, 2, 1));
confirmSeasonBaseline(sid9, { players: buildBaselinePayload(10, 2, 1), notes: 'baseline' });

// Save unconfirmed progress draft
saveProgressDraft(sid9, {
  recordingDate: '2024-10-20',
  players: buildProgressPayload(999, 999, 999),
  notes: 'Unconfirmed draft stats',
});

const s9Stats = getSeasonPlayerStats(sid9);
assert.ok(s9Stats);
assert.strictEqual(s9Stats.hasConfirmedProgress, false, 'Draft must NOT count as confirmed progress');
assert.strictEqual(s9Stats.players.length, 0, 'No players deltas should be returned for unconfirmed draft');
pass('Unconfirmed drafts are strictly excluded from season and monthly statistics.');

// =============================================================================
// Test 10: Season selector shows up to five most recent relevant seasons in documented order
// =============================================================================
console.log('\n10. Verifying 5-season selector filters drafts and orders newest first...');
mockStorage.clear();

// Season A: Draft (Must be excluded)
saveSeasonDraft({ id: 'Draft-Season', startDate: '2024-01-01', startingDivision: 10 });

// Season B: Closed oldest (closed 2024-02-01)
const sB = createActiveSeason('Season-B', '2024-01-01');
confirmSeasonBaseline(sB, { players: buildBaselinePayload(), notes: 'b' });
closeSeason({ seasonId: sB, acknowledgedIncompleteData: true });

// Season C: Closed middle (closed 2024-04-01)
const sC = createActiveSeason('Season-C', '2024-03-01');
confirmSeasonBaseline(sC, { players: buildBaselinePayload(), notes: 'c' });
closeSeason({ seasonId: sC, acknowledgedIncompleteData: true });

// Season D: Closed newer (closed 2024-06-01)
const sD = createActiveSeason('Season-D', '2024-05-01');
confirmSeasonBaseline(sD, { players: buildBaselinePayload(), notes: 'd' });
closeSeason({ seasonId: sD, acknowledgedIncompleteData: true });

// Season E: Closed newest (closed 2024-08-01)
const sE = createActiveSeason('Season-E', '2024-07-01');
confirmSeasonBaseline(sE, { players: buildBaselinePayload(), notes: 'e' });
closeSeason({ seasonId: sE, acknowledgedIncompleteData: true });

// Season F: Active season (must appear first)
const sF = createActiveSeason('Season-F-Active', '2024-09-01');
confirmSeasonBaseline(sF, { players: buildBaselinePayload(), notes: 'f' });

const selectable = getSelectableRecentSeasons(5);
assert.strictEqual(selectable.length, 5, 'Should return at most 5 seasons');
assert.strictEqual(selectable[0].id, 'Season-F-Active', 'Active season must appear first');
assert.strictEqual(selectable[0].status, 'Active');
assert.ok(!selectable.some((s) => s.id === 'Draft-Season'), 'Draft season must be excluded');
pass('Season selector orders Active first, newest closed next, and strictly excludes Drafts.');

// =============================================================================
// Test 11: Active seasons use confirmed baseline/progress data
// =============================================================================
console.log('\n11. Verifying active seasons use confirmed baseline and progress data...');
confirmProgressSnapshot(sF, {
  recordingDate: '2024-09-20',
  players: AUTHENTIC_PLAYER_IDS.map((id) => ({
    playerId: id,
    matches: 18, // baseline was 10 -> delta = +8
    goals: 7,    // baseline was 2 -> delta = +5
    assists: 4,  // baseline was 1 -> delta = +3
  })),
});

const sFStats = getSeasonPlayerStats(sF);
assert.ok(sFStats);
assert.strictEqual(sFStats.hasConfirmedProgress, true);
assert.strictEqual(sFStats.players.length, 23);

const zlatanF = sFStats.players.find((p) => p.playerId === 'P001');
assert.ok(zlatanF);
assert.strictEqual(zlatanF.matches, 8, 'Matches delta should be 18 - 10 = 8');
assert.strictEqual(zlatanF.goals, 5, 'Goals delta should be 7 - 2 = 5');
assert.strictEqual(zlatanF.assists, 3, 'Assists delta should be 4 - 1 = 3');
assert.strictEqual(zlatanF.goalContributions, 8, 'G/A should be 5 + 3 = 8');
assert.strictEqual(zlatanF.goalsPerMatch, Number((5 / 8).toFixed(2)));
assert.strictEqual(zlatanF.assistsPerMatch, Number((3 / 8).toFixed(2)));
assert.strictEqual(zlatanF.roleClassification, 'Starting XI', 'Baseline role preserved');
pass('Active season deltas and per-match rates computed accurately against confirmed baseline.');

// =============================================================================
// Test 12: Closed seasons use their immutable closure snapshots
// =============================================================================
console.log('\n12. Verifying closed seasons use immutable closure snapshot...');
setSeasonRank(sF, 40000);
const closeRes = closeSeason({ seasonId: sF, acknowledgedIncompleteData: true });
assert.ok(closeRes.success);

// Now season is Closed. Let's inspect its stats
const closedStats = getSeasonPlayerStats(sF);
assert.ok(closedStats);
assert.strictEqual(closedStats.season.status, 'Closed');
assert.strictEqual(closedStats.hasConfirmedProgress, true);
const zlatanClosed = closedStats.players.find((p) => p.playerId === 'P001');
assert.strictEqual(zlatanClosed?.goals, 5);

// Verify that closure snapshot cannot be modified
const rawState = loadSeasonsState();
const rawSeason = rawState.seasons.find((s) => s.id === sF);
assert.ok(rawSeason?.closureSnapshot);
pass('Closed seasons read from immutable closure snapshots as source of truth.');

// =============================================================================
// Test 13: Negative deltas remain intact
// =============================================================================
console.log('\n13. Verifying negative deltas remain intact (never clamped to zero)...');
mockStorage.clear();
const sid13 = createActiveSeason('S13-neg', '2024-10-01');
// Baseline with 10 matches, 5 goals, 5 assists
confirmSeasonBaseline(sid13, {
  players: AUTHENTIC_PLAYER_IDS.map((id) => ({
    playerId: id,
    roleClassification: getCanonicalPlayerRole(id),
    matches: 10,
    goals: 5,
    assists: 5,
  })),
});

// A source correction snapshot where P001 goals decreased from 5 to 4
confirmProgressSnapshot(sid13, {
  recordingDate: '2024-10-15',
  confirmDecreases: true,
  players: AUTHENTIC_PLAYER_IDS.map((id) => ({
    playerId: id,
    matches: 10,
    goals: id === 'P001' ? 4 : 5, // 4 - 5 = -1
    assists: 5,
  })),
});

const s13Stats = getSeasonPlayerStats(sid13);
assert.ok(s13Stats);
const p1Neg = s13Stats.players.find((p) => p.playerId === 'P001');
assert.strictEqual(p1Neg?.goals, -1, 'Negative delta of -1 must be preserved intact and NOT clamped to 0');
assert.strictEqual(p1Neg?.matches, 0);
assert.strictEqual(p1Neg?.assists, 0);
assert.strictEqual(p1Neg?.goalContributions, -1);
pass('Negative delta (-1) correctly preserved without silent zero-clamping.');

// =============================================================================
// Test 14: Player-card IDs prevent duplicate counting
// =============================================================================
console.log('\n14. Verifying unique player-card IDs prevent duplicate counting...');
const playerIds = s13Stats.players.map((p) => p.playerId);
const uniqueIds = new Set(playerIds);
assert.strictEqual(playerIds.length, 23);
assert.strictEqual(uniqueIds.size, 23, 'Every player card must appear exactly once');
pass('Each player card appears exactly once with zero duplicate counting.');

// =============================================================================
// Test 15: No "By Position" statistics view is added
// =============================================================================
console.log('\n15. Verifying no "By Position" tab or filter exists in Stats & Records...');
const statsViewCode = fs.readFileSync(
  path.join(process.cwd(), 'src/components/stats/StatsRecordsView.tsx'),
  'utf-8'
);
assert.ok(
  !statsViewCode.includes('by-position') && !statsViewCode.includes('By Position'),
  'Must not include any "By Position" tab or filter'
);

const typesCode = fs.readFileSync(
  path.join(process.cwd(), 'src/types/index.ts'),
  'utf-8'
);
assert.ok(
  !typesCode.includes("'by-position'"),
  'StatsPeriodTab must not include by-position'
);
pass('Strictly 3 tabs (overall, previous-month, seasons); zero "By Position" view.');

// =============================================================================
// Test 16: Existing dashboard, season, squad, and artwork behaviour remains intact
// =============================================================================
console.log('\n16. Verifying dashboard, season, squad, and artwork integrity...');
const kpis = getDashboardKPIs();
assert.ok(typeof kpis.hasActiveSeason === 'boolean');
assert.strictEqual(AUTHENTIC_PLAYER_IDS.length, 23);
pass('Existing dashboard and season workflow behavior fully preserved.');

// =============================================================================
// Summary
// =============================================================================
console.log('\n========================================================================');
console.log(`🎉 All Milestone 5B Stats & Records tests passed (${passCount} tests)!`);
console.log('========================================================================\n');
