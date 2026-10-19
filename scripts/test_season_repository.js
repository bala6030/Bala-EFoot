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
} from '../src/data/seasonRepository.ts';

// In-memory localStorage mock for Node.js test environment
const mockStorage = new Map();

global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

console.log('=== Running Season Workflow (Milestone 4A) Verification Suite ===\n');

// Reset storage before tests
mockStorage.clear();

// -------------------------------------------------------------
// Test 1: Creation and Saving of Draft Season
// -------------------------------------------------------------
console.log('1. Verifying Draft Season Creation and Properties...');
const createRes = saveSeasonDraft({
  id: 'Phase 1 - Season 2024',
  startDate: '2024-10-01',
  startingDivision: 4,
  notes: 'Road to Division 1 with 4-2-1-3 setup',
});

assert.strictEqual(createRes.success, true, 'Draft creation must succeed');
assert.ok(createRes.season, 'Must return created season');
assert.strictEqual(createRes.season.id, 'Phase 1 - Season 2024');
assert.strictEqual(createRes.season.status, 'Draft', 'New season must have Draft status');
assert.strictEqual(createRes.season.startingDivision, 4);
assert.strictEqual(createRes.season.startDate, '2024-10-01');
assert.strictEqual(createRes.season.notes, 'Road to Division 1 with 4-2-1-3 setup');
assert.ok(createRes.season.createdAt, 'Must have createdAt timestamp');
assert.ok(createRes.season.updatedAt, 'Must have updatedAt timestamp');

// Verify active draft retrieval
const activeDraft = getActiveDraft();
assert.ok(activeDraft, 'Active draft must be found');
assert.strictEqual(activeDraft.id, 'Phase 1 - Season 2024');
console.log('   ✓ Season draft created with Draft status and correct properties.');

// -------------------------------------------------------------
// Test 2: Draft Persistence across simulated browser refresh
// -------------------------------------------------------------
console.log('\n2. Verifying Draft Persistence Across Reloads...');
// Verify that raw localStorage contains the draft
const rawStored = mockStorage.get(SEASONS_STORAGE_KEY);
assert.ok(rawStored, 'Storage key must be populated');
const parsedStored = JSON.parse(rawStored);
assert.strictEqual(parsedStored.seasons.length, 1);
assert.strictEqual(parsedStored.activeDraftId, 'Phase 1 - Season 2024');
assert.strictEqual(parsedStored.seasons[0].status, 'Draft', 'Must not be silently activated');

// Reload via repository
const reloadedState = loadSeasonsState();
assert.strictEqual(reloadedState.seasons.length, 1);
assert.strictEqual(reloadedState.seasons[0].id, 'Phase 1 - Season 2024');
assert.strictEqual(reloadedState.seasons[0].status, 'Draft');
console.log('   ✓ Draft persists in storage across reload and remains in Draft status.');

// -------------------------------------------------------------
// Test 3: Reject Duplicate Season Identifiers
// -------------------------------------------------------------
console.log('\n3. Verifying Duplicate Season Identifier Rejection...');
// Attempt to create another draft with the exact same identifier
const dupExactRes = saveSeasonDraft({
  id: 'Phase 1 - Season 2024',
  startDate: '2024-10-15',
  startingDivision: 5,
});
// Since originalId wasn't passed, this should detect conflict or update same draft if existing.
// Let's test distinct draft creation with conflicting ID:
const dupCaseRes = saveSeasonDraft(
  {
    id: '   phase 1 - season 2024   ', // Case-insensitive and trimmed collision
    startDate: '2024-11-01',
    startingDivision: 6,
  },
  'Different-Draft-ID'
);
assert.strictEqual(dupCaseRes.success, false, 'Duplicate identifier must be rejected');
assert.ok(dupCaseRes.error.includes('already exists'), 'Error must specify identifier collision');

// Verify existing season was NOT modified or corrupted
const existingSeason = getSeasonById('Phase 1 - Season 2024');
assert.ok(existingSeason, 'Original season must still exist');
assert.strictEqual(existingSeason.startingDivision, 4, 'Original data must be intact');
console.log('   ✓ Duplicate season identifier rejected (case-insensitive & trimmed); existing data preserved.');

// -------------------------------------------------------------
// Test 4: Explicit Activation Workflow and Validation
// -------------------------------------------------------------
console.log('\n4. Verifying Explicit Activation and Validation...');

// 4a. Attempt to activate non-existent season
const nonExistentRes = activateSeason('Ghost-Season');
assert.strictEqual(nonExistentRes.success, false);
assert.ok(nonExistentRes.error.includes('not found'));

// 4b. Validation failure: missing starting division or out of bounds (1-10)
const invalidDraftRes = saveSeasonDraft({
  id: 'Draft Invalid Div',
  startDate: '2024-10-01',
  startingDivision: 15, // Invalid division > 10
});
assert.strictEqual(invalidDraftRes.success, false, 'Draft with invalid division must fail validation');

// 4c. Successful explicit activation
const activateRes = activateSeason('Phase 1 - Season 2024');
assert.strictEqual(activateRes.success, true, 'Activation must succeed');
assert.ok(activateRes.season);
assert.strictEqual(activateRes.season.status, 'Active', 'Status must now be Active');

// Verify active draft pointer is cleared
const stateAfterActivation = loadSeasonsState();
assert.strictEqual(stateAfterActivation.activeDraftId, null, 'Active draft ID must be cleared after activation');
console.log('   ✓ Explicit activation requires valid data and transitions status from Draft to Active.');

// -------------------------------------------------------------
// Test 5: Reject Duplicate Against Active Season
// -------------------------------------------------------------
console.log('\n5. Verifying Duplicate Prevention Against Active Season...');
const dupActiveRes = saveSeasonDraft(
  {
    id: 'phase 1 - season 2024',
    startDate: '2024-10-20',
    startingDivision: 1,
  },
  'New-Draft-ID'
);
assert.strictEqual(dupActiveRes.success, false, 'Cannot duplicate active season identifier');
console.log('   ✓ New drafts cannot reuse active season identifier.');

// -------------------------------------------------------------
// Test 6: Corrupted / Malformed Storage Handling
// -------------------------------------------------------------
console.log('\n6. Verifying Resilience Against Corrupted Storage...');

// 6a. Malformed JSON
mockStorage.set(SEASONS_STORAGE_KEY, '{ invalid json syntax ...');
const fallbackState = loadSeasonsState();
assert.deepStrictEqual(fallbackState, DEFAULT_SEASONS_STATE, 'Must return default state on JSON error');

// 6b. Malformed array objects (missing required fields)
mockStorage.set(
  SEASONS_STORAGE_KEY,
  JSON.stringify({
    version: 1,
    seasons: [
      { id: '' }, // empty ID
      { id: 'Valid Season', startDate: '2024-10-01', startingDivision: 3, status: 'Active' },
      null,
      'a string instead of object',
      { id: 'Another Valid', startDate: '2024-10-02', startingDivision: 7, status: 'Draft' },
    ],
    activeDraftId: 'Another Valid',
  })
);

const sanitizedState = loadSeasonsState();
assert.strictEqual(sanitizedState.seasons.length, 2, 'Only the 2 valid seasons should be kept');
assert.strictEqual(sanitizedState.seasons[0].id, 'Valid Season');
assert.strictEqual(sanitizedState.seasons[1].id, 'Another Valid');
console.log('   ✓ Corrupted JSON and malformed records safely handled without crashes.');

// -------------------------------------------------------------
// Test 7: Preservation of Other Subsystems' Storage Keys
// -------------------------------------------------------------
console.log('\n7. Verifying Preservation of Other Storage Keys...');
// Set dummy keys for squad and player pinned attributes
mockStorage.set('bala_efoot_pinned_attrs_P001', JSON.stringify(['speed', 'finishing']));
mockStorage.set('bala_efoot_squad_state_v1', JSON.stringify({ activeLayout: 'attack' }));

// Perform season operations
saveSeasonDraft({
  id: 'Phase 2 - Winter',
  startDate: '2024-12-01',
  startingDivision: 2,
});

// Verify other keys are 100% intact
assert.strictEqual(
  mockStorage.get('bala_efoot_pinned_attrs_P001'),
  JSON.stringify(['speed', 'finishing']),
  'Pinned attributes storage must remain intact'
);
assert.strictEqual(
  mockStorage.get('bala_efoot_squad_state_v1'),
  JSON.stringify({ activeLayout: 'attack' }),
  'Squad builder storage must remain intact'
);
console.log('   ✓ Squad and player catalogue storage keys remain completely untouched.');

// -------------------------------------------------------------
// Test 8: Discarding Drafts Safely
// -------------------------------------------------------------
console.log('\n8. Verifying Draft Discard...');
const discardRes = discardDraft('Phase 2 - Winter');
assert.strictEqual(discardRes.success, true);
assert.strictEqual(getSeasonById('Phase 2 - Winter'), undefined, 'Draft should be removed');
console.log('   ✓ Discarding draft removes record and clears draft pointer.');

console.log('\n======================================================');
console.log('🎉 All Season Workflow (Milestone 4A) tests passed!');
console.log('======================================================');
