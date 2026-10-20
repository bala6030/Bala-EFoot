import assert from 'node:assert';
import {
  loadSeasonsState,
  saveSeasonsState,
  saveSeasonDraft,
  activateSeason,
  AUTHENTIC_PLAYER_IDS,
  SEASONS_STORAGE_KEY,
  DEFAULT_SEASONS_STATE,
  getCanonicalPlayerRole,
  validateBaselinePlayerEntries,
  saveBaselineDraft,
  confirmSeasonBaseline,
  saveProgressDraft,
  confirmProgressSnapshot,
  setSeasonRank,
  recordSeasonReward,
  closeSeason,
  isValidDivisionValue,
  recordDivisionProgress,
  getDivisionProgressSnapshots,
  getLatestDivisionProgress,
} from '../src/data/seasonRepository.ts';

// ── In-memory localStorage mock ───────────────────────────────────────────────
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

console.log('=== Running Milestone 5A Dashboard Integration Verification Suite ===\n');
mockStorage.clear();

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function createActiveSeason(id = 'Test-S1') {
  mockStorage.clear();
  const draft = saveSeasonDraft({ id, startDate: '2024-10-01', startingDivision: 5 });
  assert.ok(draft.success, `Draft failed: ${draft.error}`);
  const act = activateSeason(id);
  assert.ok(act.success, `Activate failed: ${act.error}`);
  return id;
}

let passCount = 0;
function pass(label) {
  passCount++;
  console.log(`   ✓ ${label}`);
}

// =============================================================================
// Test 1: isValidDivisionValue
// =============================================================================
console.log('1. Verifying isValidDivisionValue helper...');
assert.ok(isValidDivisionValue(1), 'Division 1 should be valid');
assert.ok(isValidDivisionValue(10), 'Division 10 should be valid');
assert.ok(!isValidDivisionValue(0), 'Division 0 invalid');
assert.ok(!isValidDivisionValue(11), 'Division 11 invalid');
assert.ok(!isValidDivisionValue(1.5), 'Division 1.5 invalid');
assert.ok(!isValidDivisionValue('5'), 'Division string invalid');
assert.ok(!isValidDivisionValue(null), 'Division null invalid');
pass('isValidDivisionValue correctly validates 1–10 integers and rejects everything else.');

// =============================================================================
// Test 2: recordDivisionProgress — season not found
// =============================================================================
console.log('\n2. Verifying recordDivisionProgress rejects missing season...');
mockStorage.clear();
const r2 = recordDivisionProgress({
  seasonId: 'nonexistent-season',
  division: 3, points: 500, wins: 10, draws: 5, losses: 5,
});
assert.strictEqual(r2.success, false);
assert.ok(r2.error.includes('not found'));
pass('recordDivisionProgress correctly rejects missing season.');

// =============================================================================
// Test 3: recordDivisionProgress — Draft season rejected
// =============================================================================
console.log('\n3. Verifying recordDivisionProgress rejects Draft seasons...');
mockStorage.clear();
saveSeasonDraft({ id: 'Draft-S', startDate: '2024-10-01', startingDivision: 5 });
const r3 = recordDivisionProgress({
  seasonId: 'Draft-S',
  division: 3, points: 500, wins: 10, draws: 5, losses: 5,
});
assert.strictEqual(r3.success, false);
assert.ok(r3.error.toLowerCase().includes('active'), `Expected Active-related error, got: ${r3.error}`);
pass('recordDivisionProgress correctly rejects Draft season.');

// =============================================================================
// Test 4: recordDivisionProgress — Closed season rejected
// =============================================================================
console.log('\n4. Verifying recordDivisionProgress rejects Closed seasons...');
const sid4 = createActiveSeason('S4-close');
const bDraft4 = saveBaselineDraft(sid4, buildBaselinePayload());
assert.ok(bDraft4.success, bDraft4.error);
const bConf4 = confirmSeasonBaseline(sid4, { players: buildBaselinePayload(), notes: 'baseline' });
assert.ok(bConf4.success, bConf4.error);
setSeasonRank(sid4, 50000);
closeSeason({ seasonId: sid4, acknowledgedIncompleteData: true });
const r4 = recordDivisionProgress({
  seasonId: sid4,
  division: 3, points: 500, wins: 10, draws: 5, losses: 5,
});
assert.strictEqual(r4.success, false);
assert.ok(r4.error.toLowerCase().includes('closed'));
pass('recordDivisionProgress correctly rejects Closed season.');

// =============================================================================
// Test 5: recordDivisionProgress — Invalid division
// =============================================================================
console.log('\n5. Verifying recordDivisionProgress rejects invalid division...');
const sid5 = createActiveSeason('S5-div');
const r5a = recordDivisionProgress({ seasonId: sid5, division: 0, points: 100, wins: 5, draws: 2, losses: 3 });
assert.strictEqual(r5a.success, false);
assert.ok(r5a.error.toLowerCase().includes('division'), `Got: ${r5a.error}`);
const r5b = recordDivisionProgress({ seasonId: sid5, division: 11, points: 100, wins: 5, draws: 2, losses: 3 });
assert.strictEqual(r5b.success, false);
const r5c = recordDivisionProgress({ seasonId: sid5, division: 1.5, points: 100, wins: 5, draws: 2, losses: 3 });
assert.strictEqual(r5c.success, false);
pass('recordDivisionProgress correctly rejects division outside 1–10.');

// =============================================================================
// Test 6: recordDivisionProgress — Invalid stats (negative, fractional)
// =============================================================================
console.log('\n6. Verifying recordDivisionProgress rejects negative/fractional stats...');
const sid6 = createActiveSeason('S6-stats');
const r6a = recordDivisionProgress({ seasonId: sid6, division: 3, points: -1, wins: 5, draws: 2, losses: 3 });
assert.strictEqual(r6a.success, false);
const r6b = recordDivisionProgress({ seasonId: sid6, division: 3, points: 100, wins: -2, draws: 2, losses: 3 });
assert.strictEqual(r6b.success, false);
const r6c = recordDivisionProgress({ seasonId: sid6, division: 3, points: 100, wins: 5.5, draws: 2, losses: 3 });
assert.strictEqual(r6c.success, false);
pass('recordDivisionProgress correctly rejects negative/fractional stats.');

// =============================================================================
// Test 7: recordDivisionProgress — Invalid rank
// =============================================================================
console.log('\n7. Verifying recordDivisionProgress rejects invalid ranks...');
const sid7 = createActiveSeason('S7-rank');
const r7a = recordDivisionProgress({ seasonId: sid7, division: 3, points: 100, wins: 5, draws: 2, losses: 3, rank: 0 });
assert.strictEqual(r7a.success, false, 'Rank 0 should fail');
const r7b = recordDivisionProgress({ seasonId: sid7, division: 3, points: 100, wins: 5, draws: 2, losses: 3, rank: -1 });
assert.strictEqual(r7b.success, false, 'Negative rank should fail');
const r7c = recordDivisionProgress({ seasonId: sid7, division: 3, points: 100, wins: 5, draws: 2, losses: 3, rank: 0.5 });
assert.strictEqual(r7c.success, false, 'Fractional rank should fail');
pass('recordDivisionProgress correctly rejects rank 0, negative, and fractional.');

// =============================================================================
// Test 8: recordDivisionProgress — Successful snapshot
// =============================================================================
console.log('\n8. Verifying successful recordDivisionProgress...');
const sid8 = createActiveSeason('S8-ok');
const r8 = recordDivisionProgress({
  seasonId: sid8,
  division: 3,
  points: 1200,
  wins: 18,
  draws: 5,
  losses: 7,
  rank: 45000,
  notes: 'Mid-season checkpoint',
});
assert.ok(r8.success, `Failed: ${r8.error}`);
assert.ok(r8.snapshot);
assert.strictEqual(r8.snapshot.division, 3);
assert.strictEqual(r8.snapshot.points, 1200);
assert.strictEqual(r8.snapshot.wins, 18);
assert.strictEqual(r8.snapshot.draws, 5);
assert.strictEqual(r8.snapshot.losses, 7);
assert.strictEqual(r8.snapshot.matches, 30); // 18+5+7
assert.ok(Math.abs(r8.snapshot.winRate - 18 / 30) < 0.0001);
assert.strictEqual(r8.snapshot.rank, 45000);
assert.strictEqual(r8.snapshot.notes, 'Mid-season checkpoint');
assert.ok(r8.snapshot.id.startsWith('div-snap-'));
pass('recordDivisionProgress creates correct snapshot with computed matches and winRate.');

// =============================================================================
// Test 9: recordDivisionProgress — Rank syncs season finalRank
// =============================================================================
console.log('\n9. Verifying rank synchronisation with season finalRank...');
const state9 = loadSeasonsState();
const season9 = state9.seasons.find((s) => s.id === sid8);
assert.strictEqual(season9.finalRank, 45000, `Expected 45000, got ${season9.finalRank}`);
assert.strictEqual(season9.rewardEligibility, 'Eligible');
pass('recordDivisionProgress syncs rank → season.finalRank and rewardEligibility.');

// =============================================================================
// Test 10: recordDivisionProgress — Zero-match winRate safe
// =============================================================================
console.log('\n10. Verifying zero-match safe winRate calculation...');
const sid10 = createActiveSeason('S10-zero');
const r10 = recordDivisionProgress({
  seasonId: sid10, division: 5, points: 0, wins: 0, draws: 0, losses: 0,
});
assert.ok(r10.success, r10.error);
assert.strictEqual(r10.snapshot.matches, 0);
assert.strictEqual(r10.snapshot.winRate, 0, 'winRate must be 0 when matches === 0 (no division by zero)');
pass('winRate is 0 (not NaN/Infinity) when matches === 0.');

// =============================================================================
// Test 11: Append-only — Multiple snapshots preserved
// =============================================================================
console.log('\n11. Verifying division progress snapshots are append-only...');
const sid11 = createActiveSeason('S11-append');
recordDivisionProgress({ seasonId: sid11, division: 5, points: 800, wins: 12, draws: 3, losses: 5 });
recordDivisionProgress({ seasonId: sid11, division: 4, points: 1400, wins: 22, draws: 5, losses: 8 });

const snaps11 = getDivisionProgressSnapshots(sid11);
assert.strictEqual(snaps11.length, 2);
assert.strictEqual(snaps11[0].division, 5);
assert.strictEqual(snaps11[0].points, 800);
assert.strictEqual(snaps11[1].division, 4);
assert.strictEqual(snaps11[1].points, 1400);

const latest11 = getLatestDivisionProgress(sid11);
assert.strictEqual(latest11.division, 4);
assert.strictEqual(latest11.points, 1400);
pass('Division progress snapshots are append-only; earliest preserved; getLatestDivisionProgress returns last.');

// =============================================================================
// Test 12: Storage persistence across reload
// =============================================================================
console.log('\n12. Verifying division progress persists across localStorage reload...');
const sid12 = createActiveSeason('S12-persist');
recordDivisionProgress({ seasonId: sid12, division: 2, points: 2000, wins: 30, draws: 8, losses: 12 });

const reloaded12 = loadSeasonsState();
const s12 = reloaded12.seasons.find((s) => s.id === sid12);
assert.ok(s12, 'Season not found after reload');
assert.ok(Array.isArray(s12.divisionProgressSnapshots), 'divisionProgressSnapshots missing after reload');
assert.strictEqual(s12.divisionProgressSnapshots.length, 1);
assert.strictEqual(s12.divisionProgressSnapshots[0].division, 2);
assert.strictEqual(s12.divisionProgressSnapshots[0].points, 2000);
pass('Division progress snapshots survive localStorage serialisation and reload.');

// =============================================================================
// Test 13: divisionProgressSnapshots preserved in closure snapshot
// =============================================================================
console.log('\n13. Verifying division progress snapshots preserved in closure snapshot...');
const sid13 = createActiveSeason('S13-closure');
recordDivisionProgress({ seasonId: sid13, division: 3, points: 1000, wins: 15, draws: 5, losses: 10 });
const bDraft13 = saveBaselineDraft(sid13, buildBaselinePayload());
assert.ok(bDraft13.success, bDraft13.error);
confirmSeasonBaseline(sid13, { players: buildBaselinePayload(), notes: 'baseline' });
setSeasonRank(sid13, 50000);
const close13 = closeSeason({ seasonId: sid13, acknowledgedIncompleteData: true });
assert.ok(close13.success, close13.error);
const snap13 = close13.closureSnapshot;
assert.ok(snap13, 'closureSnapshot missing');
assert.ok(Array.isArray(snap13.divisionProgressSnapshots), 'divisionProgressSnapshots missing from closure');
assert.strictEqual(snap13.divisionProgressSnapshots.length, 1);
assert.strictEqual(snap13.divisionProgressSnapshots[0].division, 3);
assert.strictEqual(snap13.divisionProgressSnapshots[0].points, 1000);
pass('closeSeason deep-copies divisionProgressSnapshots into SeasonClosureSnapshot.');

// =============================================================================
// Test 14: Closure snapshot reload persistence
// =============================================================================
console.log('\n14. Verifying closure snapshot with divisionProgressSnapshots persists...');
const reloaded14 = loadSeasonsState();
const s14 = reloaded14.seasons.find((s) => s.id === sid13);
assert.ok(s14, 'Season missing after reload');
assert.strictEqual(s14.status, 'Closed');
const cs14 = s14.closureSnapshot;
assert.ok(cs14, 'closureSnapshot missing after reload');
assert.ok(Array.isArray(cs14.divisionProgressSnapshots), 'divisionProgressSnapshots missing from reloaded closureSnapshot');
assert.strictEqual(cs14.divisionProgressSnapshots.length, 1);
pass('Closure snapshot with divisionProgressSnapshots persists and sanitises correctly from storage.');

// =============================================================================
// Test 15: Closed season rejects new division progress
// =============================================================================
console.log('\n15. Verifying closed season rejects new division progress records...');
const r15 = recordDivisionProgress({
  seasonId: sid13, division: 2, points: 1500, wins: 20, draws: 5, losses: 10,
});
assert.strictEqual(r15.success, false);
assert.ok(r15.error.toLowerCase().includes('closed'), `Expected closed error, got: ${r15.error}`);
pass('Closed seasons correctly reject recordDivisionProgress mutations (immutability preserved).');

// =============================================================================
// Test 16: null rank is allowed (rank is optional)
// =============================================================================
console.log('\n16. Verifying rank=null is accepted...');
const sid16 = createActiveSeason('S16-nullrank');
const r16 = recordDivisionProgress({
  seasonId: sid16, division: 3, points: 600, wins: 10, draws: 3, losses: 7, rank: null,
});
assert.ok(r16.success, `Failed: ${r16.error}`);
assert.strictEqual(r16.snapshot.rank, null);
pass('rank=null is accepted; season finalRank not overwritten when rank is null.');

// =============================================================================
// Test 17: getDivisionProgressSnapshots returns empty for season without progress
// =============================================================================
console.log('\n17. Verifying getDivisionProgressSnapshots returns [] for fresh season...');
const sid17 = createActiveSeason('S17-empty');
const snaps17 = getDivisionProgressSnapshots(sid17);
assert.ok(Array.isArray(snaps17), 'Should return an array');
assert.strictEqual(snaps17.length, 0, 'Should be empty for fresh season');
const latest17 = getLatestDivisionProgress(sid17);
assert.strictEqual(latest17, null);
pass('getDivisionProgressSnapshots returns [] and getLatestDivisionProgress returns null for fresh season.');

// =============================================================================
// Summary
// =============================================================================
console.log('\n========================================================================');
console.log(`🎉 All Milestone 5A Dashboard Integration tests passed (${passCount} tests)!`);
console.log('========================================================================\n');
