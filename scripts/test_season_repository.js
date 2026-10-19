import assert from 'node:assert';
import {
  loadSeasonsState,
  saveSeasonsState,
  saveSeasonDraft,
  activateSeason,
  discardDraft,
  validateSeasonDraft,
  getAllSeasons,
  getSeasonById,
  getActiveDraft,
  SEASONS_STORAGE_KEY,
  DEFAULT_SEASONS_STATE,
  AUTHENTIC_PLAYER_IDS,
  CANONICAL_STARTING_XI_IDS,
  getCanonicalPlayerRole,
  validateBaselinePlayerEntries,
  getInitialBaselineDraft,
  saveBaselineDraft,
  confirmSeasonBaseline,
  discardBaselineDraft,
  getInitialProgressDraft,
  saveProgressDraft,
  calculatePlayerStatDeltas,
  confirmProgressSnapshot,
  discardProgressDraft,
  REWARD_RANK_THRESHOLD,
  isValidRankValue,
  computeRewardEligibility,
  setSeasonRank,
  recordSeasonReward,
  getSeasonReward,
  getSeasonReviewSummary,
  closeSeason,
  getSeasonClosureSnapshot,
} from '../src/data/seasonRepository.ts';

// In-memory localStorage mock for Node.js test environment
const mockStorage = new Map();

global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

console.log('=== Running Season Workflow (Milestone 4A & 4B) Verification Suite ===\n');

// Reset storage before tests
mockStorage.clear();

// Helper to generate a valid 23-player baseline payload
function generateValidBaselinePayload(baseMatches = 10, baseGoals = 2, baseAssists = 1) {
  return AUTHENTIC_PLAYER_IDS.map((id) => ({
    playerId: id,
    roleClassification: getCanonicalPlayerRole(id),
    matches: baseMatches,
    goals: baseGoals,
    assists: baseAssists,
  }));
}

// -------------------------------------------------------------
// Test 1: Milestone 4A Season Creation and Activation
// -------------------------------------------------------------
console.log('1. Verifying Milestone 4A Season Creation & Activation...');
const createRes = saveSeasonDraft({
  id: 'Phase 1 - Season 2024',
  startDate: '2024-10-01',
  startingDivision: 4,
  notes: 'Road to Division 1 with 4-2-1-3 setup',
});
assert.strictEqual(createRes.success, true);
assert.strictEqual(createRes.season.status, 'Draft');

const activateRes = activateSeason('Phase 1 - Season 2024');
assert.strictEqual(activateRes.success, true);
assert.strictEqual(activateRes.season.status, 'Active');
console.log('   ✓ Season created and explicitly activated.');

// -------------------------------------------------------------
// Test 2: Starting XI / Substitute Classification without Duplicates
// -------------------------------------------------------------
console.log('\n2. Verifying Starting XI / Substitute Classification (No Duplicates)...');
assert.strictEqual(AUTHENTIC_PLAYER_IDS.length, 23, 'Must have exactly 23 authentic players');
assert.strictEqual(CANONICAL_STARTING_XI_IDS.size, 11, 'Must have 11 canonical starters');

const starterCount = AUTHENTIC_PLAYER_IDS.filter((id) => CANONICAL_STARTING_XI_IDS.has(id)).length;
const subCount = AUTHENTIC_PLAYER_IDS.filter((id) => !CANONICAL_STARTING_XI_IDS.has(id)).length;
assert.strictEqual(starterCount, 11, 'Exactly 11 players classified as Starting XI');
assert.strictEqual(subCount, 12, 'Exactly 12 players classified as Substitute');

// Check unique set of IDs
const uniqueIds = new Set(AUTHENTIC_PLAYER_IDS);
assert.strictEqual(uniqueIds.size, 23, 'All 23 IDs must be unique (no double-counting)');
console.log('   ✓ Exactly 23 unique cards: 11 Starting XI, 12 Substitutes with zero duplicate cards.');

// -------------------------------------------------------------
// Test 3: Distinguishing Unentered (null) vs Genuine Zero (0)
// -------------------------------------------------------------
console.log('\n3. Verifying Unentered (null) vs Genuine Zero (0)...');
const sampleDraft = getInitialBaselineDraft('Phase 1 - Season 2024');
assert.strictEqual(sampleDraft.players.length, 23);
assert.strictEqual(sampleDraft.players[0].matches, null, 'Unentered values must be null');

// Validate unentered baseline fails confirmation validation
const unenteredVal = validateBaselinePlayerEntries(sampleDraft.players);
assert.strictEqual(unenteredVal.isValid, false, 'Unentered nulls cannot be confirmed');
assert.strictEqual(unenteredVal.completedCount, 0);

// Enter genuine zeroes for one player
const partiallyFilled = sampleDraft.players.map((p, idx) => {
  if (idx === 0) {
    return { ...p, matches: 0, goals: 0, assists: 0 }; // genuine zeroes
  }
  return p;
});
const partialVal = validateBaselinePlayerEntries(partiallyFilled);
assert.strictEqual(partialVal.completedCount, 1, 'Genuine 0 is recognized as valid completed entry');
assert.strictEqual(partialVal.isValid, false, 'Incomplete baseline (1/23) cannot be confirmed');
console.log('   ✓ Unentered (null) distinguished from genuine zero (0); completion counter accurate.');

// -------------------------------------------------------------
// Test 4: Rejection of Missing, Negative, Fractional, or Invalid Stats
// -------------------------------------------------------------
console.log('\n4. Verifying Rejection of Negative, Fractional, and Invalid Stats...');
const invalidPayload = generateValidBaselinePayload();
invalidPayload[0].matches = -5; // Negative
assert.strictEqual(validateBaselinePlayerEntries(invalidPayload).isValid, false);

invalidPayload[0].matches = 3.14; // Fractional
assert.strictEqual(validateBaselinePlayerEntries(invalidPayload).isValid, false);

invalidPayload[0].matches = '10'; // Non-number string
assert.strictEqual(validateBaselinePlayerEntries(invalidPayload).isValid, false);

// Duplicate player ID in payload
const duplicatePayload = generateValidBaselinePayload();
duplicatePayload[1].playerId = duplicatePayload[0].playerId;
assert.strictEqual(validateBaselinePlayerEntries(duplicatePayload).isValid, false);

// Only 22 players (missing one)
const shortPayload = generateValidBaselinePayload().slice(0, 22);
assert.strictEqual(validateBaselinePlayerEntries(shortPayload).isValid, false);
console.log('   ✓ Negative, fractional, non-number, duplicate, and missing players rejected.');

// -------------------------------------------------------------
// Test 5: Baseline Draft Persistence Across Reloads
// -------------------------------------------------------------
console.log('\n5. Verifying Baseline Draft Persistence Across Reloads...');
const draftToSave = {
  seasonId: 'Phase 1 - Season 2024',
  updatedAt: new Date().toISOString(),
  players: sampleDraft.players.map((p, i) => (i < 5 ? { ...p, matches: 15, goals: 3, assists: 1 } : p)),
  notes: 'Partial baseline draft test',
};
const saveDraftRes = saveBaselineDraft('Phase 1 - Season 2024', draftToSave);
assert.strictEqual(saveDraftRes.success, true);

// Reload state from storage
const stateAfterDraft = loadSeasonsState();
const reloadedSeason = stateAfterDraft.seasons.find((s) => s.id === 'Phase 1 - Season 2024');
assert.ok(reloadedSeason.baselineDraft, 'Baseline draft must persist in storage');
assert.strictEqual(reloadedSeason.baselineDraft.players[0].matches, 15);
assert.strictEqual(reloadedSeason.baselineDraft.players[10].matches, null);
console.log('   ✓ Baseline draft persists in localStorage across simulated refresh.');

// -------------------------------------------------------------
// Test 6: Baseline Confirmation and Immutability
// -------------------------------------------------------------
console.log('\n6. Verifying Baseline Confirmation & Immutability...');
const validBaseline = generateValidBaselinePayload(10, 2, 1);
const confirmBaseRes = confirmSeasonBaseline('Phase 1 - Season 2024', {
  players: validBaseline,
  notes: 'Confirmed season start baseline',
});

assert.strictEqual(confirmBaseRes.success, true);
assert.ok(confirmBaseRes.baseline);
assert.strictEqual(confirmBaseRes.baseline.players.length, 23);

const seasonAfterBase = getSeasonById('Phase 1 - Season 2024');
assert.ok(seasonAfterBase.baseline, 'Confirmed baseline must exist on season');
assert.strictEqual(seasonAfterBase.baselineDraft, null, 'Draft must be cleared after confirmation');

// Attempt duplicate confirmation or overwrite
const dupConfirmRes = confirmSeasonBaseline('Phase 1 - Season 2024', {
  players: generateValidBaselinePayload(99, 99, 99),
});
assert.strictEqual(dupConfirmRes.success, false, 'Duplicate baseline confirmation must be rejected');
assert.ok(dupConfirmRes.error.includes('immutable'), 'Error must specify immutability');

// Verify original baseline values are 100% untouched
const seasonVerified = getSeasonById('Phase 1 - Season 2024');
assert.strictEqual(seasonVerified.baseline.players[0].matches, 10, 'Baseline values must not change');
console.log('   ✓ Baseline confirmed and locked; duplicate confirmation rejected; values immutable.');

// -------------------------------------------------------------
// Test 7: Correct Positive, Zero, and Negative Delta Calculations
// -------------------------------------------------------------
console.log('\n7. Verifying Positive, Zero, and Negative Delta Calculations...');
const currentStats = generateValidBaselinePayload(10, 2, 1).map((p, idx) => {
  if (idx === 0) return { ...p, matches: 15, goals: 5, assists: 3 }; // positive deltas (+5, +3, +2)
  if (idx === 1) return { ...p, matches: 10, goals: 2, assists: 1 }; // zero deltas (+0, +0, +0)
  if (idx === 2) return { ...p, matches: 8, goals: 1, assists: 0 };  // negative deltas (-2, -1, -1)
  return p;
});

const deltaResult = calculatePlayerStatDeltas(seasonVerified, currentStats);

// Player 0: Positive deltas
assert.strictEqual(deltaResult.deltas[0].matchesDelta, 5);
assert.strictEqual(deltaResult.deltas[0].goalsDelta, 3);
assert.strictEqual(deltaResult.deltas[0].assistsDelta, 2);

// Player 1: Zero deltas
assert.strictEqual(deltaResult.deltas[1].matchesDelta, 0);
assert.strictEqual(deltaResult.deltas[1].goalsDelta, 0);
assert.strictEqual(deltaResult.deltas[1].assistsDelta, 0);

// Player 2: Negative deltas (Must NOT clamp to zero!)
assert.strictEqual(deltaResult.deltas[2].matchesDelta, -2, 'Negative matches delta must not clamp to 0');
assert.strictEqual(deltaResult.deltas[2].goalsDelta, -1, 'Negative goals delta must not clamp to 0');
assert.strictEqual(deltaResult.deltas[2].assistsDelta, -1, 'Negative assists delta must not clamp to 0');
assert.strictEqual(deltaResult.hasDecreases, true, 'Decrease must be flagged');
console.log('   ✓ Deltas calculated accurately: positive, zero, and negative values preserved.');

// -------------------------------------------------------------
// Test 8: Warning and Explicit Confirmation for Decreases
// -------------------------------------------------------------
console.log('\n8. Verifying Decrease Warnings and Explicit Confirmation...');
// Attempt to confirm snapshot with decreases WITHOUT explicit confirmation
const decreaseAttempt = confirmProgressSnapshot('Phase 1 - Season 2024', {
  recordingDate: '2024-10-15',
  players: currentStats,
  confirmDecreases: false, // User has NOT confirmed decrease
});

assert.strictEqual(decreaseAttempt.success, false, 'Must reject decreases without explicit confirmation');
assert.ok(decreaseAttempt.error.includes('Explicit confirmation is required'));
assert.ok(decreaseAttempt.decreaseWarnings.length > 0, 'Must provide detailed decrease warnings');

// Attempt with explicit confirmation checkbox enabled
const confirmedDecreaseAttempt = confirmProgressSnapshot('Phase 1 - Season 2024', {
  recordingDate: '2024-10-15',
  players: currentStats,
  confirmDecreases: true, // User explicitly confirmed correction
});

assert.strictEqual(confirmedDecreaseAttempt.success, true, 'Must succeed when decrease is explicitly confirmed');
assert.ok(confirmedDecreaseAttempt.snapshot);
assert.strictEqual(confirmedDecreaseAttempt.snapshot.hasConfirmedDecreases, true);
console.log('   ✓ Stat decreases require explicit user confirmation; warnings properly generated.');

// -------------------------------------------------------------
// Test 9: Preservation of Earlier Snapshots (Append-Only)
// -------------------------------------------------------------
console.log('\n9. Verifying Preservation of Earlier Snapshots (Append-Only)...');
// Record a second progress snapshot
const secondSnapshotStats = currentStats.map((p) => ({
  ...p,
  matches: p.matches + 2,
  goals: p.goals + 1,
  assists: p.assists + 1,
}));

const secondSnapRes = confirmProgressSnapshot('Phase 1 - Season 2024', {
  recordingDate: '2024-10-22',
  players: secondSnapshotStats,
});
assert.strictEqual(secondSnapRes.success, true);

const seasonWithTwoSnaps = getSeasonById('Phase 1 - Season 2024');
assert.strictEqual(seasonWithTwoSnaps.progressSnapshots.length, 2, 'Must have 2 snapshots');
assert.strictEqual(seasonWithTwoSnaps.progressSnapshots[0].recordingDate, '2024-10-15', 'Snapshot 1 intact');
assert.strictEqual(seasonWithTwoSnaps.progressSnapshots[1].recordingDate, '2024-10-22', 'Snapshot 2 appended');

// Verify baseline is STILL 100% intact
assert.strictEqual(seasonWithTwoSnaps.baseline.players[0].matches, 10, 'Baseline remains immutable');
console.log('   ✓ Progress snapshots are append-only; earlier snapshots and baseline preserved.');

// -------------------------------------------------------------
// Test 10: Progress Draft and Confirmed Snapshots Survive Reloads
// -------------------------------------------------------------
console.log('\n10. Verifying Storage Persistence Across Reloads...');
// Save a progress draft
const progDraft = {
  seasonId: 'Phase 1 - Season 2024',
  recordingDate: '2024-10-25',
  updatedAt: new Date().toISOString(),
  players: AUTHENTIC_PLAYER_IDS.map((id) => ({ playerId: id, matches: 20, goals: null, assists: null })),
};
saveProgressDraft('Phase 1 - Season 2024', progDraft);

// Simulate full browser reload via loadSeasonsState
const reloadedState = loadSeasonsState();
const reloadedSeasonCheck = reloadedState.seasons.find((s) => s.id === 'Phase 1 - Season 2024');

assert.ok(reloadedSeasonCheck.baseline, 'Baseline survives reload');
assert.strictEqual(reloadedSeasonCheck.progressSnapshots.length, 2, 'Snapshots survive reload');
assert.ok(reloadedSeasonCheck.progressDraft, 'Progress draft survives reload');
assert.strictEqual(reloadedSeasonCheck.progressDraft.players[0].matches, 20);
console.log('   ✓ Baseline, progress snapshots, and progress draft survive storage reloads.');

// -------------------------------------------------------------
// Test 11: Compatibility with Existing Milestone 4A Season Records
// -------------------------------------------------------------
console.log('\n11. Verifying Backward Compatibility with Milestone 4A Records...');
// Inject an older Milestone 4A season without 4B fields
const rawStorage = JSON.parse(mockStorage.get(SEASONS_STORAGE_KEY));
rawStorage.seasons.push({
  id: 'Old Season Milestone 4A',
  startDate: '2024-09-01',
  startingDivision: 5,
  status: 'Active',
  createdAt: '2024-09-01T00:00:00.000Z',
  updatedAt: '2024-09-01T00:00:00.000Z',
});
mockStorage.set(SEASONS_STORAGE_KEY, JSON.stringify(rawStorage));

const stateWithOld = loadSeasonsState();
const oldSeason = stateWithOld.seasons.find((s) => s.id === 'Old Season Milestone 4A');
assert.ok(oldSeason, 'Legacy season must load');
assert.strictEqual(oldSeason.baseline, null, 'Safe null fallback for missing baseline');
assert.deepStrictEqual(oldSeason.progressSnapshots, [], 'Safe empty array fallback for missing snapshots');
console.log('   ✓ Legacy Milestone 4A seasons load without error or data loss.');

// -------------------------------------------------------------
// Test 12: Preservation of Subsystem Storage Keys
// -------------------------------------------------------------
console.log('\n12. Verifying Subsystem Storage Isolation...');
mockStorage.set('bala_efoot_pinned_attrs_P001', JSON.stringify(['speed']));
mockStorage.set('bala_efoot_squad_state_v1', JSON.stringify({ activeLayout: 'defence' }));

// Perform repository operations
saveBaselineDraft('Phase 1 - Season 2024', sampleDraft);

assert.strictEqual(mockStorage.get('bala_efoot_pinned_attrs_P001'), JSON.stringify(['speed']));
assert.strictEqual(mockStorage.get('bala_efoot_squad_state_v1'), JSON.stringify({ activeLayout: 'defence' }));
console.log('   ✓ Squad and player catalogue storage keys completely untouched.');

// =============================================================
// MILESTONE 4C1: REWARD ELIGIBILITY & ACQUISITION TESTS
// =============================================================

// -------------------------------------------------------------
// Test 13: Rank 1 Qualifies
// -------------------------------------------------------------
console.log('\n13. Verifying Rank 1 Qualifies for Reward Eligibility...');
assert.strictEqual(computeRewardEligibility(1), 'Eligible', 'Rank 1 must be Eligible');
const rank1Res = setSeasonRank('Phase 1 - Season 2024', 1);
assert.strictEqual(rank1Res.success, true);
assert.strictEqual(rank1Res.season.rewardEligibility, 'Eligible');
assert.strictEqual(rank1Res.season.finalRank, 1);
console.log('   ✓ Rank 1 correctly qualifies as Eligible.');

// -------------------------------------------------------------
// Test 14: Rank 100,000 Qualifies
// -------------------------------------------------------------
console.log('\n14. Verifying Rank 100,000 (Boundary) Qualifies...');
assert.strictEqual(REWARD_RANK_THRESHOLD, 100000, 'Threshold must be 100,000');
assert.strictEqual(computeRewardEligibility(100000), 'Eligible', 'Rank 100,000 must be Eligible');
const rank100kRes = setSeasonRank('Phase 1 - Season 2024', 100000);
assert.strictEqual(rank100kRes.success, true);
assert.strictEqual(rank100kRes.season.rewardEligibility, 'Eligible');
console.log('   ✓ Rank 100,000 correctly qualifies as Eligible at the boundary.');

// -------------------------------------------------------------
// Test 15: Rank 100,001 Does Not Qualify
// -------------------------------------------------------------
console.log('\n15. Verifying Rank 100,001 (Boundary + 1) Does Not Qualify...');
assert.strictEqual(computeRewardEligibility(100001), 'Not Eligible', 'Rank 100,001 must be Not Eligible');
const rank100k1Res = setSeasonRank('Phase 1 - Season 2024', 100001);
assert.strictEqual(rank100k1Res.success, true);
assert.strictEqual(rank100k1Res.season.rewardEligibility, 'Not Eligible');
console.log('   ✓ Rank 100,001 correctly marked as Not Eligible.');

// -------------------------------------------------------------
// Test 16: Missing Rank Gives Eligibility Unknown
// -------------------------------------------------------------
console.log('\n16. Verifying Missing Rank Gives Eligibility Unknown...');
assert.strictEqual(computeRewardEligibility(null), 'Eligibility Unknown');
assert.strictEqual(computeRewardEligibility(undefined), 'Eligibility Unknown');
const resetRankRes = setSeasonRank('Phase 1 - Season 2024', null);
assert.strictEqual(resetRankRes.success, true);
assert.strictEqual(resetRankRes.season.finalRank, null);
assert.strictEqual(resetRankRes.season.rewardEligibility, 'Eligibility Unknown');
console.log('   ✓ Null or undefined rank yields Eligibility Unknown.');

// -------------------------------------------------------------
// Test 17: Invalid, Negative, Zero, and Fractional Rank Rejected
// -------------------------------------------------------------
console.log('\n17. Verifying Rejection of Zero, Negative, and Fractional Ranks...');
assert.strictEqual(isValidRankValue(0), false, 'Rank 0 must be invalid');
assert.strictEqual(isValidRankValue(-5), false, 'Negative rank must be invalid');
assert.strictEqual(isValidRankValue(45.5), false, 'Fractional rank must be invalid');
assert.strictEqual(isValidRankValue('100'), false, 'String rank must be invalid');

assert.throws(() => computeRewardEligibility(0), /Rank must be a positive integer/);
assert.throws(() => computeRewardEligibility(-1), /Rank must be a positive integer/);
assert.throws(() => computeRewardEligibility(12.34), /Rank must be a positive integer/);

const invalidRankZero = setSeasonRank('Phase 1 - Season 2024', 0);
assert.strictEqual(invalidRankZero.success, false);
assert.ok(invalidRankZero.error.includes('positive whole number'));

const invalidRankNeg = setSeasonRank('Phase 1 - Season 2024', -10);
assert.strictEqual(invalidRankNeg.success, false);
console.log('   ✓ Rank 0, negative, fractional, and non-integer inputs strictly rejected.');

// -------------------------------------------------------------
// Test 18: Correcting Rank Recomputes Eligibility Immediately
// -------------------------------------------------------------
console.log('\n18. Verifying Rank Correction Recomputes Eligibility...');
// Set to Not Eligible first
setSeasonRank('Phase 1 - Season 2024', 150000);
let currentSeason = getSeasonById('Phase 1 - Season 2024');
assert.strictEqual(currentSeason.rewardEligibility, 'Not Eligible');

// Correct rank to 45,000 (Eligible)
const correctedRes = setSeasonRank('Phase 1 - Season 2024', 45000);
assert.strictEqual(correctedRes.success, true);
currentSeason = getSeasonById('Phase 1 - Season 2024');
assert.strictEqual(currentSeason.finalRank, 45000);
assert.strictEqual(currentSeason.rewardEligibility, 'Eligible');
console.log('   ✓ Rank correction immediately updates finalRank and recomputes eligibility.');

// -------------------------------------------------------------
// Test 19: Eligibility Does NOT Automatically Mark Acquisition
// -------------------------------------------------------------
console.log('\n19. Verifying Eligibility Does NOT Automatically Mark Acquisition...');
assert.strictEqual(currentSeason.rewardEligibility, 'Eligible');
assert.strictEqual(currentSeason.rewardAcquisition, null, 'Reward must NOT be acquired automatically');
assert.strictEqual(getSeasonReward('Phase 1 - Season 2024'), null);
console.log('   ✓ Eligible rank does not automatically grant or mark reward as Acquired.');

// -------------------------------------------------------------
// Test 20: Explicit Eligible Reward Acquisition
// -------------------------------------------------------------
console.log('\n20. Verifying Explicit Reward Acquisition for Eligible Season...');
// Attempting acquisition on ineligible season fails
saveSeasonDraft({ id: 'Ineligible Season', startDate: '2024-10-01', startingDivision: 5 });
activateSeason('Ineligible Season');
setSeasonRank('Ineligible Season', 120000); // Not eligible
const failAcquire = recordSeasonReward('Ineligible Season', {
  cardName: 'Test Card',
  acquiredDate: '2024-10-20',
});
assert.strictEqual(failAcquire.success, false, 'Must reject reward acquisition on ineligible season');
assert.ok(failAcquire.error.includes('not eligible'));

// Missing required fields rejected
const missingName = recordSeasonReward('Phase 1 - Season 2024', {
  cardName: '',
  acquiredDate: '2024-10-20',
});
assert.strictEqual(missingName.success, false);
assert.ok(missingName.error.includes('name is required'));

// Successful explicit acquisition
const successfulAcquire = recordSeasonReward('Phase 1 - Season 2024', {
  cardName: 'Alessandro Costacurta',
  cardDescription: 'Epic Booster (National Teams)',
  acquiredDate: '2024-10-20',
  notes: 'Earned for rank 45,000 division finish',
});
assert.strictEqual(successfulAcquire.success, true);
assert.ok(successfulAcquire.acquisition);
assert.strictEqual(successfulAcquire.acquisition.cardName, 'Alessandro Costacurta');
assert.strictEqual(successfulAcquire.acquisition.seasonId, 'Phase 1 - Season 2024');
assert.ok(successfulAcquire.acquisition.id);
assert.ok(successfulAcquire.acquisition.confirmedAt);
console.log('   ✓ Explicit reward acquisition succeeded with required details and stable ID.');

// -------------------------------------------------------------
// Test 21: Second Acquisition in Same Season Rejected (Max 1 per season)
// -------------------------------------------------------------
console.log('\n21. Verifying Enforce One Reward Per Season...');
const secondAcquireAttempt = recordSeasonReward('Phase 1 - Season 2024', {
  cardName: 'Franck Ribéry',
  acquiredDate: '2024-10-21',
});
assert.strictEqual(secondAcquireAttempt.success, false, 'Second acquisition must be rejected');
assert.ok(secondAcquireAttempt.error.includes('already been acquired'));

// Verify original acquisition is preserved intact
const preservedSeason = getSeasonById('Phase 1 - Season 2024');
assert.strictEqual(preservedSeason.rewardAcquisition.cardName, 'Alessandro Costacurta');
console.log('   ✓ Second reward acquisition strictly rejected; original acquisition preserved.');

// -------------------------------------------------------------
// Test 22: Duplicate Submission Prevention
// -------------------------------------------------------------
console.log('\n22. Verifying Duplicate Submission Prevention...');
const repeatCall = recordSeasonReward('Phase 1 - Season 2024', {
  cardName: 'Alessandro Costacurta',
  acquiredDate: '2024-10-20',
});
assert.strictEqual(repeatCall.success, false, 'Repeat submission must be safely rejected');
console.log('   ✓ Repeated click or duplicate submission prevented.');

// -------------------------------------------------------------
// Test 23: Acquisition Persistence Across Page Refreshes
// -------------------------------------------------------------
console.log('\n23. Verifying Reward Persistence Across Storage Reloads...');
const stateAfterReload = loadSeasonsState();
const reloadedRewardSeason = stateAfterReload.seasons.find((s) => s.id === 'Phase 1 - Season 2024');
assert.ok(reloadedRewardSeason.rewardAcquisition, 'Reward acquisition must survive storage reload');
assert.strictEqual(reloadedRewardSeason.rewardAcquisition.cardName, 'Alessandro Costacurta');
assert.strictEqual(reloadedRewardSeason.finalRank, 45000);
assert.strictEqual(reloadedRewardSeason.rewardEligibility, 'Eligible');
console.log('   ✓ Reward acquisition and rank eligibility survive full localStorage reload.');

// -------------------------------------------------------------
// Test 24: Baselines and Progress Snapshots Remain 100% Intact
// -------------------------------------------------------------
console.log('\n24. Verifying Baselines & Progress Snapshots Intact After Reward...');
assert.ok(reloadedRewardSeason.baseline, 'Baseline must remain intact');
assert.strictEqual(reloadedRewardSeason.baseline.players[0].matches, 10, 'Baseline stats unmodified');
assert.strictEqual(reloadedRewardSeason.progressSnapshots.length, 2, 'All progress snapshots unmodified');
console.log('   ✓ Baseline snapshots and progress history completely untouched.');

// =============================================================
// MILESTONE 4C2: FINAL SEASON REVIEW & CLOSURE TESTS
// =============================================================

// -------------------------------------------------------------
// Test 25: Review Data Uses Confirmed Snapshots Only
// -------------------------------------------------------------
console.log('\n25. Verifying Review Data Uses Confirmed Snapshots Only...');
// Add an unconfirmed progress draft to Phase 1
saveProgressDraft('Phase 1 - Season 2024', {
  seasonId: 'Phase 1 - Season 2024',
  recordingDate: '2024-10-30',
  updatedAt: new Date().toISOString(),
  players: AUTHENTIC_PLAYER_IDS.map((id) => ({
    playerId: id,
    matches: 999, // Unconfirmed draft value
    goals: 999,
    assists: 999,
  })),
});

const reviewSummary1 = getSeasonReviewSummary('Phase 1 - Season 2024');
assert.ok(reviewSummary1);
assert.strictEqual(reviewSummary1.snapshotCount, 2, 'Must count only 2 confirmed snapshots');
assert.strictEqual(reviewSummary1.hasUnconfirmedProgressDraft, true, 'Draft must be flagged as unconfirmed');
// Verify latest confirmed snapshot values are used, NOT draft values
assert.strictEqual(reviewSummary1.deltas[0].currentMatches !== 999, true, 'Draft values must not be used in review');
assert.strictEqual(reviewSummary1.deltas[0].currentMatches, 17, 'Confirmed snapshot values used');
console.log('   ✓ Review data exclusively uses confirmed baseline and snapshots; drafts excluded.');

// -------------------------------------------------------------
// Test 26: Missing Rank Remains Eligibility Unknown
// -------------------------------------------------------------
console.log('\n26. Verifying Missing Rank Remains Eligibility Unknown...');
// Create a separate active season with baseline but NO rank
saveSeasonDraft({ id: 'Unranked Season', startDate: '2024-10-01', startingDivision: 6 });
activateSeason('Unranked Season');
confirmSeasonBaseline('Unranked Season', { players: generateValidBaselinePayload(5, 1, 0) });

const unrankedReview = getSeasonReviewSummary('Unranked Season');
assert.strictEqual(unrankedReview.finalRank, null);
assert.strictEqual(unrankedReview.rewardEligibility, 'Eligibility Unknown');
assert.strictEqual(unrankedReview.warnings.some((w) => w.includes('Eligibility Unknown')), true);
console.log('   ✓ Missing rank correctly evaluated as Eligibility Unknown with warning.');

// -------------------------------------------------------------
// Test 27: Rank Boundary Conditions (100,000 vs 100,001)
// -------------------------------------------------------------
console.log('\n27. Verifying Rank Boundary Rules for Closure Review...');
saveSeasonDraft({ id: 'Boundary 100k Season', startDate: '2024-10-01', startingDivision: 3 });
activateSeason('Boundary 100k Season');
confirmSeasonBaseline('Boundary 100k Season', { players: generateValidBaselinePayload(5, 1, 0) });
setSeasonRank('Boundary 100k Season', 100000);
const review100k = getSeasonReviewSummary('Boundary 100k Season');
assert.strictEqual(review100k.rewardEligibility, 'Eligible');

saveSeasonDraft({ id: 'Boundary 100k1 Season', startDate: '2024-10-01', startingDivision: 3 });
activateSeason('Boundary 100k1 Season');
confirmSeasonBaseline('Boundary 100k1 Season', { players: generateValidBaselinePayload(5, 1, 0) });
setSeasonRank('Boundary 100k1 Season', 100001);
const review100k1 = getSeasonReviewSummary('Boundary 100k1 Season');
assert.strictEqual(review100k1.rewardEligibility, 'Not Eligible');
console.log('   ✓ Rank 100,000 qualifies as Eligible; Rank 100,001 is Not Eligible.');

// -------------------------------------------------------------
// Test 28: Active Seasons Can Be Closed With Valid Essential Data
// -------------------------------------------------------------
console.log('\n28. Verifying Active Season Closure With Valid Essential Data...');
// Phase 1 - Season 2024 is Active, has baseline, 2 snapshots, rank 45,000, reward acquired
const closeResult = closeSeason({
  seasonId: 'Phase 1 - Season 2024',
  acknowledgedIncompleteData: true,
  closureNotes: 'Successfully completed division campaign with all objectives met.',
});

assert.strictEqual(closeResult.success, true);
assert.strictEqual(closeResult.season.status, 'Closed');
assert.ok(closeResult.season.closedAt);
assert.ok(closeResult.closureSnapshot);
assert.strictEqual(closeResult.closureSnapshot.seasonId, 'Phase 1 - Season 2024');
console.log('   ✓ Active season with confirmed baseline closed successfully with frozen snapshot.');

// -------------------------------------------------------------
// Test 29: Draft or Invalid Seasons Cannot Be Closed
// -------------------------------------------------------------
console.log('\n29. Verifying Draft or Incomplete Seasons Cannot Be Closed...');
// Draft season
saveSeasonDraft({ id: 'Pending Draft Season', startDate: '2024-10-01', startingDivision: 5 });
const closeDraftAttempt = closeSeason({ seasonId: 'Pending Draft Season' });
assert.strictEqual(closeDraftAttempt.success, false);
assert.ok(closeDraftAttempt.error.includes('Only Active seasons can be closed'));

// Active season without confirmed baseline
saveSeasonDraft({ id: 'Active No Baseline', startDate: '2024-10-01', startingDivision: 5 });
activateSeason('Active No Baseline');
const closeNoBaseAttempt = closeSeason({ seasonId: 'Active No Baseline' });
assert.strictEqual(closeNoBaseAttempt.success, false);
assert.ok(closeNoBaseAttempt.error.includes('confirmed baseline snapshot is required'));
console.log('   ✓ Draft seasons and seasons lacking confirmed baseline rejected from closure.');

// -------------------------------------------------------------
// Test 30: Closure Requires Explicit Confirmation Operation
// -------------------------------------------------------------
console.log('\n30. Verifying Closure Requires Explicit Operation...');
// Simply retrieving review summary does NOT close the season
const unrankedBefore = getSeasonById('Unranked Season');
assert.strictEqual(unrankedBefore.status, 'Active');
getSeasonReviewSummary('Unranked Season');
const unrankedAfter = getSeasonById('Unranked Season');
assert.strictEqual(unrankedAfter.status, 'Active', 'Loading review must not close season');
assert.strictEqual(unrankedAfter.closedAt, undefined);
console.log('   ✓ Inspecting review summary or saving drafts does not trigger season closure.');

// -------------------------------------------------------------
// Test 31: Duplicate Closure Requests Rejected
// -------------------------------------------------------------
console.log('\n31. Verifying Duplicate Closure Requests Are Rejected...');
const originalClosedSeason = getSeasonById('Phase 1 - Season 2024');
const originalClosedAt = originalClosedSeason.closedAt;
const originalSnapshotId = originalClosedSeason.closureSnapshot.id;

// Attempt to close again
const duplicateClose = closeSeason({
  seasonId: 'Phase 1 - Season 2024',
});
assert.strictEqual(duplicateClose.success, false);
assert.ok(duplicateClose.error.includes('already closed'));

const checkSeasonAfterDup = getSeasonById('Phase 1 - Season 2024');
assert.strictEqual(checkSeasonAfterDup.closedAt, originalClosedAt, 'Timestamp unchanged');
assert.strictEqual(checkSeasonAfterDup.closureSnapshot.id, originalSnapshotId, 'Snapshot ID unchanged');
console.log('   ✓ Duplicate closure rejected; timestamp and frozen snapshot unmodified.');

// -------------------------------------------------------------
// Test 32: Closed Seasons Reject All Mutations
// -------------------------------------------------------------
console.log('\n32. Verifying Closed Seasons Reject All Mutations...');
// 1. saveBaselineDraft
const baseDraftMut = saveBaselineDraft('Phase 1 - Season 2024', { seasonId: 'Phase 1 - Season 2024', players: [] });
assert.strictEqual(baseDraftMut.success, false);
assert.ok(baseDraftMut.error.includes('closed'));

// 2. confirmSeasonBaseline
const baseConfMut = confirmSeasonBaseline('Phase 1 - Season 2024', { players: generateValidBaselinePayload() });
assert.strictEqual(baseConfMut.success, false);
assert.ok(baseConfMut.error.includes('closed'));

// 3. saveProgressDraft
const progDraftMut = saveProgressDraft('Phase 1 - Season 2024', { seasonId: 'Phase 1 - Season 2024', recordingDate: '2024-10-31', players: [] });
assert.strictEqual(progDraftMut.success, false);
assert.ok(progDraftMut.error.includes('closed'));

// 4. confirmProgressSnapshot
const progConfMut = confirmProgressSnapshot('Phase 1 - Season 2024', { recordingDate: '2024-10-31', players: generateValidBaselinePayload(20, 5, 2) });
assert.strictEqual(progConfMut.success, false);
assert.ok(progConfMut.error.includes('closed'));

// 5. setSeasonRank
const rankMut = setSeasonRank('Phase 1 - Season 2024', 10);
assert.strictEqual(rankMut.success, false);
assert.ok(rankMut.error.includes('closed'));

// 6. recordSeasonReward
const rewardMut = recordSeasonReward('Phase 1 - Season 2024', { cardName: 'Duplicate Test', acquiredDate: '2024-10-31' });
assert.strictEqual(rewardMut.success, false);
assert.ok(rewardMut.error.includes('closed'));

// 7. saveSeasonDraft
const seasonDraftMut = saveSeasonDraft({ id: 'Phase 1 - Season 2024', startingDivision: 1 }, 'Phase 1 - Season 2024');
assert.strictEqual(seasonDraftMut.success, false);
assert.ok(seasonDraftMut.error.includes('Closed seasons are immutable'));

// 8. activateSeason
const activateMut = activateSeason('Phase 1 - Season 2024');
assert.strictEqual(activateMut.success, false);
assert.ok(activateMut.error.includes('closed'));

// 9. discardDraft
const deleteMut = discardDraft('Phase 1 - Season 2024');
assert.strictEqual(deleteMut.success, false);
assert.ok(deleteMut.error.includes('Closed seasons cannot be deleted'));

console.log('   ✓ Baseline, progress, rank, reward, edit, activation, and delete mutations all rejected.');

// -------------------------------------------------------------
// Test 33: Final Snapshot Preserves Baseline and Every Progress Snapshot
// -------------------------------------------------------------
console.log('\n33. Verifying Final Snapshot Preserves Complete History...');
const closedSnap = getSeasonClosureSnapshot('Phase 1 - Season 2024');
assert.ok(closedSnap);
assert.strictEqual(closedSnap.baseline.players.length, 23);
assert.strictEqual(closedSnap.baseline.players[0].matches, 10);
assert.strictEqual(closedSnap.progressSnapshots.length, 2);
assert.strictEqual(closedSnap.progressSnapshots[0].recordingDate, '2024-10-15');
assert.strictEqual(closedSnap.progressSnapshots[1].recordingDate, '2024-10-22');

// Verify deep copy: mutate an in-memory object and verify closed snapshot is unmutated
const loadedClosed = getSeasonById('Phase 1 - Season 2024');
loadedClosed.baseline.players[0].matches = 9999;
const freshCheck = getSeasonClosureSnapshot('Phase 1 - Season 2024');
assert.strictEqual(freshCheck.baseline.players[0].matches, 10, 'Final snapshot must be completely decoupled from in-memory mutations');
console.log('   ✓ Baseline and progress history fully preserved in original order and deep-copied.');

// -------------------------------------------------------------
// Test 34: Final Snapshot Preserves Reward Eligibility and Acquisition Details
// -------------------------------------------------------------
console.log('\n34. Verifying Reward Eligibility & Acquisition in Snapshot...');
assert.strictEqual(closedSnap.finalRank, 45000);
assert.strictEqual(closedSnap.rewardEligibility, 'Eligible');
assert.strictEqual(closedSnap.rewardAcquisitionStatus, 'Acquired');
assert.ok(closedSnap.rewardAcquisition);
assert.strictEqual(closedSnap.rewardAcquisition.cardName, 'Alessandro Costacurta');
assert.strictEqual(closedSnap.rewardAcquisition.seasonId, 'Phase 1 - Season 2024');
console.log('   ✓ Reward eligibility and acquisition details cleanly preserved.');

// -------------------------------------------------------------
// Test 35: Incomplete Non-Essential Information Requires & Records Acknowledgement
// -------------------------------------------------------------
console.log('\n35. Verifying Incomplete Data Acknowledgement Requirement...');
// Unranked Season has no rank and 0 snapshots (warnings exist)
const unackClose = closeSeason({
  seasonId: 'Unranked Season',
  acknowledgedIncompleteData: false, // Not acknowledged
});
assert.strictEqual(unackClose.success, false);
assert.ok(unackClose.error.includes('Explicit acknowledgement'));

// Now close WITH acknowledgement
const ackClose = closeSeason({
  seasonId: 'Unranked Season',
  acknowledgedIncompleteData: true,
  closureNotes: 'Closed without final rank or snapshots.',
});
assert.strictEqual(ackClose.success, true);
assert.strictEqual(ackClose.closureSnapshot.incompleteDataAcknowledged, true);
assert.ok(ackClose.closureSnapshot.warnings.length > 0);
assert.strictEqual(ackClose.closureSnapshot.rewardEligibility, 'Eligibility Unknown');
assert.strictEqual(ackClose.closureSnapshot.rewardAcquisitionStatus, 'Not Acquired');
console.log('   ✓ Incomplete data requires acknowledgement; recorded in closure snapshot.');

// -------------------------------------------------------------
// Test 36: Concurrency Protection (Changed Season Rejects Closure)
// -------------------------------------------------------------
console.log('\n36. Verifying Concurrency Protection on Season Closure...');
saveSeasonDraft({ id: 'Concurrency Season', startDate: '2024-10-01', startingDivision: 4 });
activateSeason('Concurrency Season');
confirmSeasonBaseline('Concurrency Season', { players: generateValidBaselinePayload(10, 2, 1) });

const concSeasonBefore = getSeasonById('Concurrency Season');
const oldUpdatedAt = '2020-01-01T00:00:00.000Z'; // Stale timestamp

const staleClose = closeSeason({
  seasonId: 'Concurrency Season',
  expectedUpdatedAt: oldUpdatedAt,
  acknowledgedIncompleteData: true,
});
assert.strictEqual(staleClose.success, false);
assert.ok(staleClose.error.includes('Season data has changed'));
console.log('   ✓ Stale closure attempt rejected when season was modified concurrently.');

// -------------------------------------------------------------
// Test 37: Reload Persistence of Closed State and Historical Snapshot
// -------------------------------------------------------------
console.log('\n37. Verifying Reload Persistence of Closed State & Snapshot...');
const reloadedStatePostClose = loadSeasonsState();
const reloadedClosed = reloadedStatePostClose.seasons.find((s) => s.id === 'Phase 1 - Season 2024');
assert.ok(reloadedClosed);
assert.strictEqual(reloadedClosed.status, 'Closed');
assert.ok(reloadedClosed.closedAt);
assert.ok(reloadedClosed.closureSnapshot);
assert.strictEqual(reloadedClosed.closureSnapshot.metadata.id, 'Phase 1 - Season 2024');
assert.strictEqual(reloadedClosed.closureSnapshot.rewardAcquisition.cardName, 'Alessandro Costacurta');
console.log('   ✓ Closed season and closure snapshot persist accurately across reloads.');

// -------------------------------------------------------------
// Test 38: Creating a New Season Leaves Earlier Closed Records Unchanged
// -------------------------------------------------------------
console.log('\n38. Verifying New Season Creation Preserves Closed Records...');
const createNewRes = saveSeasonDraft({
  id: 'Phase 2 - Season 2025',
  startDate: '2025-01-01',
  startingDivision: 2,
  notes: 'New campaign',
});
assert.strictEqual(createNewRes.success, true);
activateSeason('Phase 2 - Season 2025');

// Verify Phase 1 is completely untouched
const phase1AfterNew = getSeasonById('Phase 1 - Season 2024');
assert.strictEqual(phase1AfterNew.status, 'Closed');
assert.strictEqual(phase1AfterNew.closureSnapshot.rewardAcquisition.cardName, 'Alessandro Costacurta');
assert.strictEqual(phase1AfterNew.closureSnapshot.progressSnapshots.length, 2);
console.log('   ✓ New season creation and activation leaves earlier closed records untouched.');

console.log('\n========================================================================');
console.log('🎉 All Season Workflow (Milestone 4A, 4B, 4C1 & 4C2) tests passed (38 tests)!');
console.log('========================================================================');


