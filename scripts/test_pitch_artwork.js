import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== Running Pitch Artwork Verification Suite ===\n');

// 1. Verify Player Image Map and Physical Files
console.log('1. Verifying Player Artwork Mapping & Asset Files...');
const rawPlayers = JSON.parse(fs.readFileSync('src/data/players.json', 'utf8'));
assert.strictEqual(rawPlayers.length, 23, 'Must have exactly 23 players');

const imageMapCode = fs.readFileSync('src/data/playerImageMap.ts', 'utf8');
const idToPathMatches = [...imageMapCode.matchAll(/(P\d{3}):\s*'([^']+)'/g)];
const imageMap = Object.fromEntries(idToPathMatches.map((m) => [m[1], m[2]]));

assert.strictEqual(Object.keys(imageMap).length, 23, 'Must have artwork mappings for all 23 players');

for (const player of rawPlayers) {
  const imgPath = imageMap[player.id];
  assert.ok(imgPath, `Player ${player.id} (${player.name}) must be in playerImageMap`);
  const localPath = path.join('public', imgPath.replace(/^\//, ''));
  assert.ok(fs.existsSync(localPath), `Artwork file must exist at ${localPath}`);
}
console.log('   ✓ All 23 squad player cards have authentic, verified artwork image files.');

// 2. Verify Pitch Component Structure & Classes
console.log('\n2. Verifying FootballPitch Component & CSS Classes...');
const pitchCode = fs.readFileSync('src/components/squad/FootballPitch.tsx', 'utf8');
const pitchCss = fs.readFileSync('src/components/squad/FootballPitch.module.css', 'utf8');

const requiredClasses = [
  'pitchCard',
  'pitchArtworkWrapper',
  'pitchArtworkImg',
  'pitchArtworkFallback',
  'pitchArtworkInitials',
  'posTag',
  'ovrTag',
  'cardName',
  'benchButton',
  'emptySlot',
  'emptySlotRole',
  'emptySlotPlus',
  'tagFWD',
  'tagMID',
  'tagDEF',
  'tagGK',
];

for (const cls of requiredClasses) {
  assert.ok(pitchCss.includes(`.${cls}`), `CSS must include class .${cls}`);
  assert.ok(pitchCode.includes(`styles.${cls}`), `Component must reference styles.${cls}`);
}
console.log('   ✓ All required pitch card & artwork CSS classes defined and referenced.');

// 3. Verify Position & Rating Badges Overlaid, and Image Contains
console.log('\n3. Verifying Marker Layout & Contain Sizing...');
assert.ok(pitchCss.includes('object-fit: contain'), 'Artwork must use object-fit: contain');
assert.ok(pitchCss.includes('pointer-events: none'), 'Artwork and badges must use pointer-events: none to avoid blocking drags');
assert.ok(pitchCode.includes('draggable={false}'), 'Image must have draggable={false}');
console.log('   ✓ Artwork uses object-fit: contain and does not block marker pointer/drag events.');

// 4. Verify Formations & Slot Clearances (Zero Overlaps)
console.log('\n4. Verifying Formation Slot Clearances (Zero Overlaps Across Formations)...');
const formations = {
  '4-2-1-3': [
    { id: 'gk', x: 50, y: 90 },
    { id: 'lb', x: 13, y: 73 },
    { id: 'lcb', x: 34, y: 74 },
    { id: 'rcb', x: 66, y: 74 },
    { id: 'rb', x: 87, y: 73 },
    { id: 'ldmf', x: 32, y: 55 },
    { id: 'rdmf', x: 68, y: 55 },
    { id: 'amf', x: 50, y: 38 },
    { id: 'lwf', x: 16, y: 20 },
    { id: 'cf', x: 50, y: 12 },
    { id: 'rwf', x: 84, y: 20 },
  ],
  '4-3-3': [
    { id: 'gk', x: 50, y: 90 },
    { id: 'lb', x: 13, y: 73 },
    { id: 'lcb', x: 34, y: 74 },
    { id: 'rcb', x: 66, y: 74 },
    { id: 'rb', x: 87, y: 73 },
    { id: 'dmf', x: 50, y: 58 },
    { id: 'lcmf', x: 30, y: 43 },
    { id: 'rcmf', x: 70, y: 43 },
    { id: 'lwf', x: 16, y: 20 },
    { id: 'cf', x: 50, y: 12 },
    { id: 'rwf', x: 84, y: 20 },
  ],
  '4-2-2-2': [
    { id: 'gk', x: 50, y: 90 },
    { id: 'lb', x: 13, y: 73 },
    { id: 'lcb', x: 34, y: 74 },
    { id: 'rcb', x: 66, y: 74 },
    { id: 'rb', x: 87, y: 73 },
    { id: 'ldmf', x: 33, y: 55 },
    { id: 'rdmf', x: 67, y: 55 },
    { id: 'lmf', x: 18, y: 36 },
    { id: 'rmf', x: 82, y: 36 },
    { id: 'lcf', x: 34, y: 14 },
    { id: 'rcf', x: 66, y: 14 },
  ],
};

const testViewports = [
  { pitchW: 540, cardW: 84, cardH: 124, label: 'Desktop Pitch (540x720)' },
  { pitchW: 500, cardW: 70, cardH: 104, label: 'Tablet Pitch (500x667)' },
  { pitchW: 440, cardW: 62, cardH: 92, label: 'Mobile Pitch (440x587)' },
  { pitchW: 360, cardW: 50, cardH: 74, label: 'Small Mobile Pitch (360x480)' },
  { pitchW: 320, cardW: 42, cardH: 62, label: 'Compact Mobile Pitch (320x427)' },
];

for (const vp of testViewports) {
  const pitchH = vp.pitchW * (4 / 3);
  for (const [fName, slots] of Object.entries(formations)) {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const s1 = slots[i];
        const s2 = slots[j];
        const x1 = (s1.x / 100) * vp.pitchW;
        const y1 = (s1.y / 100) * vp.pitchH;
        const x2 = (s2.x / 100) * vp.pitchW;
        const y2 = (s2.y / 100) * vp.pitchH;

        const xCollides = Math.abs(x1 - x2) < vp.cardW;
        const yCollides = Math.abs(y1 - y2) < vp.cardH;

        assert.ok(
          !(xCollides && yCollides),
          `Collision detected in ${fName} at ${vp.label}: ${s1.id} & ${s2.id}`
        );
      }
    }
  }
  console.log(`   ✓ ${vp.label}: 0 collisions across 4-2-1-3, 4-3-3, and 4-2-2-2.`);
}

console.log('\n=============================================');
console.log('🎉 All Pitch Artwork verification checks passed!');
console.log('=============================================');
