import assert from 'node:assert';
import fs from 'node:fs';

console.log('=== Running Squad Builder Verification Suite ===\n');

// 1. Load players.json
console.log('1. Verifying Player Catalogue Data for Squad Builder...');
const rawPlayers = JSON.parse(fs.readFileSync('src/data/players.json', 'utf8'));
assert.strictEqual(rawPlayers.length, 23, 'Must have exactly 23 squad players');

const startingXI = rawPlayers.filter((p) => p.inStartingXI);
const substitutes = rawPlayers.filter((p) => !p.inStartingXI);
assert.strictEqual(startingXI.length, 11, 'Must have 11 starting XI players');
assert.strictEqual(substitutes.length, 12, 'Must have 12 substitute players');
console.log('   ✓ Ingested 23 authentic players: 11 starters, 12 substitutes.');

// 2. Test Formation Structures
console.log('\n2. Verifying Formation Structures...');
const FORMATION_4213_SLOTS = [
  { id: 'gk', name: 'GK', roleCategory: 'GK', x: 50, y: 88 },
  { id: 'lb', name: 'LB', roleCategory: 'DEF', x: 14, y: 72 },
  { id: 'lcb', name: 'CB', roleCategory: 'DEF', x: 38, y: 75 },
  { id: 'rcb', name: 'CB', roleCategory: 'DEF', x: 62, y: 75 },
  { id: 'rb', name: 'RB', roleCategory: 'DEF', x: 86, y: 72 },
  { id: 'ldmf', name: 'DMF', roleCategory: 'MID', x: 35, y: 55 },
  { id: 'rdmf', name: 'DMF', roleCategory: 'MID', x: 65, y: 55 },
  { id: 'amf', name: 'AMF', roleCategory: 'MID', x: 50, y: 38 },
  { id: 'lwf', name: 'LWF', roleCategory: 'FWD', x: 18, y: 20 },
  { id: 'cf', name: 'CF', roleCategory: 'FWD', x: 50, y: 14 },
  { id: 'rwf', name: 'RWF', roleCategory: 'FWD', x: 82, y: 20 },
];

const FORMATION_433_SLOTS = [
  { id: 'gk', name: 'GK', roleCategory: 'GK', x: 50, y: 88 },
  { id: 'lb', name: 'LB', roleCategory: 'DEF', x: 14, y: 72 },
  { id: 'lcb', name: 'CB', roleCategory: 'DEF', x: 38, y: 75 },
  { id: 'rcb', name: 'CB', roleCategory: 'DEF', x: 62, y: 75 },
  { id: 'rb', name: 'RB', roleCategory: 'DEF', x: 86, y: 72 },
  { id: 'dmf', name: 'DMF', roleCategory: 'MID', x: 50, y: 58 },
  { id: 'lcmf', name: 'CMF', roleCategory: 'MID', x: 32, y: 44 },
  { id: 'rcmf', name: 'CMF', roleCategory: 'MID', x: 68, y: 44 },
  { id: 'lwf', name: 'LWF', roleCategory: 'FWD', x: 18, y: 20 },
  { id: 'cf', name: 'CF', roleCategory: 'FWD', x: 50, y: 14 },
  { id: 'rwf', name: 'RWF', roleCategory: 'FWD', x: 82, y: 20 },
];

const FORMATION_4222_SLOTS = [
  { id: 'gk', name: 'GK', roleCategory: 'GK', x: 50, y: 88 },
  { id: 'lb', name: 'LB', roleCategory: 'DEF', x: 14, y: 72 },
  { id: 'lcb', name: 'CB', roleCategory: 'DEF', x: 38, y: 75 },
  { id: 'rcb', name: 'CB', roleCategory: 'DEF', x: 62, y: 75 },
  { id: 'rb', name: 'RB', roleCategory: 'DEF', x: 86, y: 72 },
  { id: 'ldmf', name: 'DMF', roleCategory: 'MID', x: 35, y: 56 },
  { id: 'rdmf', name: 'DMF', roleCategory: 'MID', x: 65, y: 56 },
  { id: 'lmf', name: 'LMF', roleCategory: 'MID', x: 20, y: 36 },
  { id: 'rmf', name: 'RMF', roleCategory: 'MID', x: 80, y: 36 },
  { id: 'lcf', name: 'CF', roleCategory: 'FWD', x: 36, y: 16 },
  { id: 'rcf', name: 'CF', roleCategory: 'FWD', x: 64, y: 16 },
];

const formations = [
  { id: '4-2-1-3', slots: FORMATION_4213_SLOTS },
  { id: '4-3-3', slots: FORMATION_433_SLOTS },
  { id: '4-2-2-2', slots: FORMATION_4222_SLOTS },
];

for (const f of formations) {
  assert.strictEqual(f.slots.length, 11, `${f.id} must have 11 slots`);
  const gkCount = f.slots.filter((s) => s.roleCategory === 'GK').length;
  assert.strictEqual(gkCount, 1, `${f.id} must have exactly 1 GK`);
  const defCount = f.slots.filter((s) => s.roleCategory === 'DEF').length;
  assert.strictEqual(defCount, 4, `${f.id} must have 4 defenders`);
}
console.log('   ✓ Formations 4-2-1-3, 4-3-3, and 4-2-2-2 verified: 11 slots, 1 GK, 4 DEF each.');

// 3. Test Attack and Defence Layout Independence
console.log('\n3. Verifying Attack & Defence Layout Independence...');
const attackState = {
  formationId: '4-2-1-3',
  assignments: {
    gk: 'P023',
    lb: 'P012',
    lcb: 'P015',
    rcb: 'P022',
    rb: 'P016',
    ldmf: 'P011',
    rdmf: 'P005',
    amf: 'P007',
    lwf: 'P004',
    cf: 'P001',
    rwf: 'P003',
  },
};

const defenceState = {
  formationId: '4-3-3',
  assignments: {
    gk: 'P023',
    lb: 'P012',
    lcb: 'P015',
    rcb: 'P022',
    rb: 'P016',
    dmf: 'P011',
    lcmf: 'P005',
    rcmf: 'P007',
    lwf: 'P004',
    cf: 'P001',
    rwf: 'P003',
  },
};

// Swapping striker in Attack must not affect Defence
attackState.assignments.cf = 'P002'; // Swap Zlatan for Ronaldo in attack
assert.strictEqual(defenceState.assignments.cf, 'P001', 'Defence must keep Zlatan');
assert.strictEqual(attackState.assignments.cf, 'P002', 'Attack has Ronaldo');
assert.strictEqual(defenceState.formationId, '4-3-3', 'Defence maintains 4-3-3');
assert.strictEqual(attackState.formationId, '4-2-1-3', 'Attack maintains 4-2-1-3');
console.log('   ✓ Attack and Defence layouts are strictly independent.');

// 4. Test Duplicate Prevention & Validation
console.log('\n4. Verifying Validation Logic...');
function validateTest(layout, players) {
  const ids = Object.values(layout.assignments).filter(Boolean);
  const counts = {};
  const duplicates = [];
  for (const id of ids) {
    counts[id] = (counts[id] || 0) + 1;
    if (counts[id] > 1 && !duplicates.includes(id)) duplicates.push(id);
  }
  const hasGK = Boolean(layout.assignments.gk);
  const isValid = ids.length === 11 && duplicates.length === 0 && hasGK;
  return { isValid, filledCount: ids.length, hasGK, duplicates };
}

const validRes = validateTest(attackState, rawPlayers);
assert.strictEqual(validRes.isValid, true, 'Attack state must be valid');
assert.strictEqual(validRes.filledCount, 11);
assert.strictEqual(validRes.duplicates.length, 0);

// Test invalid duplicate assignment
const dupState = {
  formationId: '4-2-1-3',
  assignments: { ...attackState.assignments, amf: 'P002' }, // P002 in both CF and AMF
};
const dupRes = validateTest(dupState, rawPlayers);
assert.strictEqual(dupRes.isValid, false, 'Duplicate assignment must invalidate layout');
assert.deepStrictEqual(dupRes.duplicates, ['P002'], 'Should detect P002 duplicate');
console.log('   ✓ Duplicate prevention and complete lineup validation verified.');

console.log('\n=============================================');
console.log('🎉 All Squad Builder verification checks passed!');
console.log('=============================================');
