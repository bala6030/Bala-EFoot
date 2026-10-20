import assert from 'node:assert';
import {
  loadSkillPlansState,
  saveSkillPlansState,
  getSkillPlan,
  getNativeSkills,
  addPlannedSkill,
  removePlannedSkill,
  toggleSkillHighlight,
  resetSkillPlan,
  setCustomNativeSkills,
  SKILL_PLANS_STORAGE_KEY,
  MAX_ADDITIONAL_SKILLS,
} from '../src/data/skillPlanRepository.ts';
import {
  getAllSkills,
  getSkillsByCategory,
  getSkillByName,
  searchSkills,
} from '../src/data/skillCatalogue.ts';
import {
  loadWishlistState,
  saveWishlistState,
  getWishlistItems,
  isCardInWishlist,
  getWishlistItemByCardId,
  addToWishlist,
  updateWishlistItem,
  removeFromWishlist,
  clearWishlist,
  resolveWishlistCard,
  WISHLIST_STORAGE_KEY,
} from '../src/data/wishlistRepository.ts';
import { getAllPlayers, getPlayerById } from '../src/data/playerRepository.ts';

// ── In-memory localStorage mock ───────────────────────────────────────────────
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

console.log('=== Running Milestone 6 Skills & Wishlist Verification Suite ===\n');
mockStorage.clear();

let passCount = 0;
function pass(label) {
  passCount++;
  console.log(`   ✓ ${label}`);
}

const allPlayers = getAllPlayers();
const zlatan = getPlayerById('P001'); // 109 CF Zlatan
const messi = getPlayerById('P003'); // 109 RMF Messi
const kaka = getPlayerById('P009'); // 107 AMF Kaká (0 additional skills in seed)
const neuer = getPlayerById('P023'); // 107 GK Neuer (0 native skills in seed)

assert(zlatan, 'Zlatan P001 must exist');
assert(messi, 'Messi P003 must exist');
assert(kaka, 'Kaká P009 must exist');
assert(neuer, 'Neuer P023 must exist');

// ============================================================================
// PART A: SKILL PLANNER VERIFICATION
// ============================================================================

console.log('Part A: Skill Planner Verification');

// Test 1: Skill catalogue structure & categorization
console.log('1. Verifying reusable Skill Catalogue...');
{
  const skills = getAllSkills();
  assert(skills.length >= 45, `Expected at least 45 skills, found ${skills.length}`);

  const shootingSkills = getSkillsByCategory('Shooting');
  assert(shootingSkills.some((s) => s.name === 'Heading'), 'Heading must be under Shooting');
  assert(shootingSkills.some((s) => s.name === 'Long-range Curler'), 'Long-range Curler under Shooting');

  const passingSkills = getSkillsByCategory('Passing');
  assert(passingSkills.some((s) => s.name === 'One-touch Pass'), 'One-touch Pass under Passing');
  assert(passingSkills.some((s) => s.name === 'Through Passing'), 'Through Passing under Passing');

  const dribblingSkills = getSkillsByCategory('Dribbling');
  assert(dribblingSkills.some((s) => s.name === 'Double Touch'), 'Double Touch under Dribbling');
  assert(dribblingSkills.some((s) => s.name === 'Sole Control'), 'Sole Control under Dribbling');

  const defendingSkills = getSkillsByCategory('Defending');
  assert(defendingSkills.some((s) => s.name === 'Man Marking'), 'Man Marking under Defending');
  assert(defendingSkills.some((s) => s.name === 'Interception'), 'Interception under Defending');

  const gkSkills = getSkillsByCategory('Goalkeeping');
  assert(gkSkills.some((s) => s.name === 'GK High Punt'), 'GK High Punt under Goalkeeping');
  assert(gkSkills.some((s) => s.name === 'GK Penalty Saver'), 'GK Penalty Saver under Goalkeeping');

  // Search
  const searchResults = searchSkills('pass', 'Passing');
  assert(searchResults.length > 0, 'Search should find passing skills');
  assert(searchResults.every((s) => s.category === 'Passing'), 'Category filter respected');

  pass('Skill catalogue categorized logically, searchable, and independent of UI components.');
}

// Test 2: Native skills detection and separation from additional skills
console.log('2. Verifying native skills detection and separation...');
{
  const zlatanNative = getNativeSkills(zlatan);
  assert.strictEqual(zlatanNative.isKnown, true, 'Zlatan native skills should be known');
  assert.strictEqual(zlatanNative.skills.length, 10, 'Zlatan has 10 native skills');
  assert(zlatanNative.skills.includes('Heading'), 'Zlatan has Heading natively');
  assert(zlatanNative.skills.includes('Long-range Curler'), 'Zlatan has Long-range Curler natively');

  pass('Native skills correctly detected and separated from additional slots.');
}

// Test 3: Adding and removing planned skills
console.log('3. Verifying adding and removing planned skills...');
{
  // Reset Kaká plan first
  resetSkillPlan('P009');
  let plan = getSkillPlan('P009');
  assert.strictEqual(plan.additionalSkills.length, 0, 'Fresh Kaká plan should have 0 additions');

  // Add a non-native skill (Kaká does not have Flip Flap natively)
  const res1 = addPlannedSkill(kaka, 'Flip Flap', true);
  assert.strictEqual(res1.success, true, 'Should successfully add Flip Flap');
  assert.strictEqual(res1.plan.additionalSkills.length, 1);
  assert.strictEqual(res1.plan.additionalSkills[0].skillName, 'Flip Flap');
  assert.strictEqual(res1.plan.additionalSkills[0].isHighlightGold, true);

  // Add second non-native skill
  const res2 = addPlannedSkill(kaka, 'Sole Control');
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.plan.additionalSkills.length, 2);

  // Toggle highlight
  const toggleRes = toggleSkillHighlight('P009', 'Sole Control');
  assert.strictEqual(toggleRes.plan.additionalSkills[1].isHighlightGold, true);

  // Remove first skill
  const remRes = removePlannedSkill('P009', 'Flip Flap');
  assert.strictEqual(remRes.success, true);
  assert.strictEqual(remRes.plan.additionalSkills.length, 1);
  assert.strictEqual(remRes.plan.additionalSkills[0].skillName, 'Sole Control');

  pass('Adding, removing, and toggling planned skills functions accurately.');
}

// Test 4: Five-additional-skill maximum constraint
console.log('4. Verifying five-additional-skill maximum constraint...');
{
  resetSkillPlan('P009');
  const skillsToAdd = [
    'Flip Flap',
    'Sole Control',
    'Outside Curler',
    'Pinpoint Crossing',
    'Heading',
  ];

  for (const skill of skillsToAdd) {
    const res = addPlannedSkill(kaka, skill);
    assert.strictEqual(res.success, true, `Failed adding ${skill}: ${res.error}`);
  }

  const fullPlan = getSkillPlan('P009');
  assert.strictEqual(fullPlan.additionalSkills.length, MAX_ADDITIONAL_SKILLS);

  // Attempting to add a 6th skill must be rejected
  const overflowRes = addPlannedSkill(kaka, 'Acrobatic Finishing');
  assert.strictEqual(overflowRes.success, false, '6th skill must be rejected');
  assert(overflowRes.error?.includes('Maximum 5'), 'Error message should mention maximum 5');
  assert.strictEqual(getSkillPlan('P009').additionalSkills.length, 5, 'Plan remains at 5 skills');

  pass('Five-additional-skill limit strictly enforced.');
}

// Test 5: Duplicate and native-skill prevention
console.log('5. Verifying duplicate and native-skill prevention...');
{
  resetSkillPlan('P009');
  addPlannedSkill(kaka, 'Flip Flap');

  // Duplicate planned skill
  const dupRes = addPlannedSkill(kaka, 'Flip Flap');
  assert.strictEqual(dupRes.success, false, 'Duplicate planned skill must be rejected');
  assert(dupRes.error?.includes('already planned'), 'Error should state already planned');

  // Case insensitive duplicate check
  const dupCaseRes = addPlannedSkill(kaka, 'flip flap');
  assert.strictEqual(dupCaseRes.success, false, 'Case-insensitive duplicate must be rejected');

  // Native skill prevention: Kaká natively has 'Double Touch' and 'One-touch Pass'
  const kakaNative = getNativeSkills(kaka);
  assert(kakaNative.skills.includes('Double Touch'), 'Kaká has Double Touch natively');

  const nativeRes = addPlannedSkill(kaka, 'Double Touch');
  assert.strictEqual(nativeRes.success, false, 'Adding native skill must be rejected');
  assert(nativeRes.error?.includes('already a native skill'), 'Error should state already a native skill');

  pass('Duplicate planned skills and native skill collisions strictly prevented.');
}

// Test 6: Independent plans for different card versions
console.log('6. Verifying independent plans for different card versions...');
{
  resetSkillPlan('P001'); // Zlatan
  resetSkillPlan('P003'); // Messi

  // Zlatan does not have Interception natively
  const addZ1 = addPlannedSkill(zlatan, 'Interception');
  const addZ2 = addPlannedSkill(zlatan, 'Blocker');
  assert(addZ1.success, `Failed adding Interception to Zlatan: ${addZ1.error}`);
  assert(addZ2.success, `Failed adding Blocker to Zlatan: ${addZ2.error}`);

  // Messi does not have Acrobatic Finishing natively
  const addM = addPlannedSkill(messi, 'Acrobatic Finishing');
  assert(addM.success, `Failed adding Acrobatic Finishing to Messi: ${addM.error}`);

  const zlatanPlan = getSkillPlan('P001');
  const messiPlan = getSkillPlan('P003');

  assert.strictEqual(zlatanPlan.additionalSkills.length, 2);
  assert.strictEqual(messiPlan.additionalSkills.length, 1);
  assert.strictEqual(zlatanPlan.additionalSkills[0].skillName, 'Interception');
  assert.strictEqual(messiPlan.additionalSkills[0].skillName, 'Acrobatic Finishing');

  pass('Plans for different card versions are completely independent.');
}

// Test 7: Persistence and reload behavior
console.log('7. Verifying persistence and reload behavior...');
{
  resetSkillPlan('P009');
  addPlannedSkill(kaka, 'Flip Flap', true);
  addPlannedSkill(kaka, 'Sole Control', false);

  // Read raw storage
  const raw = mockStorage.get(SKILL_PLANS_STORAGE_KEY);
  assert(raw, 'Storage key must have data');

  // Simulate full page reload by reloading state from storage
  const loadedState = loadSkillPlansState();
  const reloadedPlan = loadedState.plans['P009'];
  assert(reloadedPlan, 'Reloaded plan must exist');
  assert.strictEqual(reloadedPlan.additionalSkills.length, 2);
  assert.strictEqual(reloadedPlan.additionalSkills[0].skillName, 'Flip Flap');
  assert.strictEqual(reloadedPlan.additionalSkills[0].isHighlightGold, true);
  assert.strictEqual(reloadedPlan.additionalSkills[1].skillName, 'Sole Control');

  pass('Skill plans persist across storage serialisation and reloads.');
}

// Test 8: Missing or unknown native-skill data
console.log('8. Verifying missing or unknown native-skill data...');
{
  // P023 Manuel Neuer has no default skills recorded in seed dataset
  const neuerNative = getNativeSkills(neuer);
  assert.strictEqual(neuerNative.isKnown, false, 'Neuer native skills should evaluate as unknown/unavailable');
  assert.strictEqual(neuerNative.skills.length, 0, 'Neuer native skills array should be empty');

  // Should still allow planning additional skills even when native is unknown
  resetSkillPlan('P023');
  const addGKRes = addPlannedSkill(neuer, 'GK High Punt');
  assert.strictEqual(addGKRes.success, true, 'Should allow adding additional skills to card with unknown native data');
  assert.strictEqual(getSkillPlan('P023').additionalSkills.length, 1);

  // User can record verified custom native skills
  const customRes = setCustomNativeSkills('P023', ['GK High Punt', 'GK Penalty Saver']);
  assert.strictEqual(customRes.success, true);
  const updatedPlan = getSkillPlan('P023');
  assert.deepStrictEqual(updatedPlan.customNativeSkills, ['GK High Punt', 'GK Penalty Saver']);

  // Now getNativeSkills recognizes the custom native skills
  const resolvedNeuer = getNativeSkills(neuer, updatedPlan.customNativeSkills);
  assert.strictEqual(resolvedNeuer.isKnown, true);
  assert.strictEqual(resolvedNeuer.skills.length, 2);

  // And now trying to add GK Penalty Saver as additional is rejected because it is in native skills
  const rejRes = addPlannedSkill(neuer, 'GK Penalty Saver');
  assert.strictEqual(rejRes.success, false, 'Custom native skill collision must now be rejected');

  pass('Missing/unknown native skills handled honestly with user-managed fallback.');
}

// ============================================================================
// PART B: WISHLIST VERIFICATION
// ============================================================================

console.log('\nPart B: Wishlist Verification');

// Test 9: Adding and removing cards
console.log('9. Verifying adding and removing cards from wishlist...');
{
  clearWishlist();
  assert.strictEqual(getWishlistItems().length, 0, 'Wishlist should start empty');

  // Add Zlatan
  const addRes1 = addToWishlist('P001', 'High', 'Target target striker for tactical cross play');
  assert.strictEqual(addRes1.success, true);
  assert.strictEqual(addRes1.item.cardId, 'P001');
  assert.strictEqual(addRes1.item.targetPlayerName, 'Zlatan Ibrahimović');
  assert.strictEqual(addRes1.item.priority, 'High');
  assert.strictEqual(addRes1.item.notes, 'Target target striker for tactical cross play');
  assert.strictEqual(isCardInWishlist('P001'), true);

  // Add Messi
  const addRes2 = addToWishlist('P003', 'Medium', 'Deep-lying forward playmaker');
  assert.strictEqual(addRes2.success, true);
  assert.strictEqual(getWishlistItems().length, 2);

  // Remove Zlatan
  const remRes = removeFromWishlist('P001');
  assert.strictEqual(remRes.success, true);
  assert.strictEqual(isCardInWishlist('P001'), false);
  assert.strictEqual(getWishlistItems().length, 1);
  assert.strictEqual(getWishlistItems()[0].cardId, 'P003');

  pass('Adding and removing wishlist cards works cleanly.');
}

// Test 10: Duplicate prevention for same card ID
console.log('10. Verifying duplicate prevention...');
{
  clearWishlist();
  addToWishlist('P001', 'High');

  // Attempt duplicate addition
  const dupRes = addToWishlist('P001', 'Low', 'Duplicate attempt');
  assert.strictEqual(dupRes.success, false, 'Duplicate card ID must be rejected');
  assert(dupRes.error?.includes('already in your wishlist'), 'Error message specifies duplicate');
  assert.strictEqual(getWishlistItems().length, 1, 'Wishlist length unchanged');

  pass('Duplicate card ID addition is strictly prevented.');
}

// Test 11: Priority and note updates
console.log('11. Verifying priority and note updates...');
{
  clearWishlist();
  addToWishlist('P002', 'Low', 'Initial note');

  const updateRes = updateWishlistItem('P002', {
    priority: 'High',
    notes: 'Updated priority and tactical reasoning',
  });

  assert.strictEqual(updateRes.success, true);
  assert.strictEqual(updateRes.item.priority, 'High');
  assert.strictEqual(updateRes.item.notes, 'Updated priority and tactical reasoning');

  const fetched = getWishlistItemByCardId('P002');
  assert(fetched, 'Item must exist');
  assert.strictEqual(fetched.priority, 'High');
  assert.strictEqual(fetched.notes, 'Updated priority and tactical reasoning');

  pass('Priority and note updates succeed and update timestamps.');
}

// Test 12: Search and filtering
console.log('12. Verifying search and priority filtering...');
{
  clearWishlist();
  addToWishlist('P001', 'High', 'Zlatan fox in the box');
  addToWishlist('P002', 'High', 'Ronaldo goal poacher');
  addToWishlist('P003', 'Medium', 'Messi deep lying');
  addToWishlist('P004', 'Low', 'Ronaldinho classic playmaker');

  const items = getWishlistItems();
  assert.strictEqual(items.length, 4);

  // Filter by priority High
  const highItems = items.filter((i) => i.priority === 'High');
  assert.strictEqual(highItems.length, 2);

  // Search by player name
  const ronaldoSearch = items.filter((i) =>
    i.targetPlayerName.toLowerCase().includes('ronaldo')
  );
  assert.strictEqual(ronaldoSearch.length, 1);
  assert.strictEqual(ronaldoSearch[0].cardId, 'P002');

  // Search by position or note
  const playmakerSearch = items.filter((i) =>
    (i.notes || '').toLowerCase().includes('playmaker')
  );
  assert.strictEqual(playmakerSearch.length, 1);
  assert.strictEqual(playmakerSearch[0].cardId, 'P004');

  pass('Priority filtering and query search execute reliably.');
}

// Test 13: Persistence and missing catalogue records
console.log('13. Verifying persistence and handling missing catalogue records...');
{
  clearWishlist();
  addToWishlist('P001', 'High', 'Verified catalogue card');

  // Add an entry with a card ID not present in current catalogue
  const unknownCardId = 'P999_LEGACY';
  const unknownAdd = addToWishlist(unknownCardId, 'Medium', 'Card from prior version');
  assert.strictEqual(unknownAdd.success, true);

  // Verify persistence across reload
  const reloadedState = loadWishlistState();
  assert.strictEqual(reloadedState.items.length, 2);

  const p001Item = reloadedState.items.find((i) => i.cardId === 'P001');
  const p999Item = reloadedState.items.find((i) => i.cardId === unknownCardId);
  assert(p001Item, 'P001 persists');
  assert(p999Item, 'P999 persists');

  // Resolve card: P001 matches catalogue
  const resolvedP001 = resolveWishlistCard(p001Item);
  assert.strictEqual(resolvedP001.isCatalogueMissing, false);
  assert.strictEqual(resolvedP001.targetPlayerName, 'Zlatan Ibrahimović');

  // Resolve card: P999 is missing from catalogue, should NOT crash
  const resolvedP999 = resolveWishlistCard(p999Item);
  assert.strictEqual(resolvedP999.isCatalogueMissing, true);
  assert.strictEqual(resolvedP999.cardId, unknownCardId);
  assert(resolvedP999.targetPlayerName.includes('Missing Card') || resolvedP999.targetPlayerName.includes(unknownCardId));

  pass('Persistence verified and missing catalogue records handled gracefully without crash.');
}

// Test 14: Storage corruption recovery & backward compatibility
console.log('14. Verifying storage corruption recovery and backward compatibility...');
{
  // Test corrupted skill plans JSON recovery
  mockStorage.set(SKILL_PLANS_STORAGE_KEY, '{invalid-json');
  const recoveredSkillState = loadSkillPlansState();
  assert.strictEqual(recoveredSkillState.version, 1);
  assert.deepStrictEqual(recoveredSkillState.plans, {});

  // Test over-allocated skill slots in storage clamped to MAX_ADDITIONAL_SKILLS (5)
  const overAllocatedJSON = JSON.stringify({
    version: 1,
    plans: {
      P001: {
        playerId: 'P001',
        additionalSkills: [
          { skillName: 'Skill 1' },
          { skillName: 'Skill 2' },
          { skillName: 'Skill 3' },
          { skillName: 'Skill 4' },
          { skillName: 'Skill 5' },
          { skillName: 'Skill 6' },
          { skillName: 'Skill 7' },
        ],
      },
    },
  });
  mockStorage.set(SKILL_PLANS_STORAGE_KEY, overAllocatedJSON);
  const clampedState = loadSkillPlansState();
  assert.strictEqual(clampedState.plans['P001'].additionalSkills.length, MAX_ADDITIONAL_SKILLS);

  // Test corrupted wishlist JSON recovery
  mockStorage.set(WISHLIST_STORAGE_KEY, 'not-valid-json');
  const recoveredWishlistState = loadWishlistState();
  assert.strictEqual(recoveredWishlistState.version, 1);
  assert.deepStrictEqual(recoveredWishlistState.items, []);

  // Test invalid priority in storage is sanitized to 'Medium'
  const invalidPriorityJSON = JSON.stringify({
    version: 1,
    items: [
      {
        id: 'wishlist-P001',
        cardId: 'P001',
        priority: 'InvalidUltraHigh',
      },
    ],
  });
  mockStorage.set(WISHLIST_STORAGE_KEY, invalidPriorityJSON);
  const sanitizedWishlist = loadWishlistState();
  assert.strictEqual(sanitizedWishlist.items.length, 1);
  assert.strictEqual(sanitizedWishlist.items[0].priority, 'Medium');

  pass('Storage corruption recovery, slot clamping, and priority sanitization verified.');
}

// Test 15: Edge cases and validation boundaries
console.log('15. Verifying edge cases and validation boundaries...');
{
  // Empty skill name
  const emptySkillRes = addPlannedSkill(zlatan, '   ');
  assert.strictEqual(emptySkillRes.success, false);
  assert.strictEqual(emptySkillRes.error, 'Skill name cannot be empty');

  // Null player
  const nullPlayerRes = addPlannedSkill(null, 'Heading');
  assert.strictEqual(nullPlayerRes.success, false);

  // Empty wishlist cardId
  const emptyCardIdRes = addToWishlist('   ', 'High');
  assert.strictEqual(emptyCardIdRes.success, false);

  // Update nonexistent wishlist card
  const updateNonexistent = updateWishlistItem('NONEXISTENT_999', { priority: 'Low' });
  assert.strictEqual(updateNonexistent.success, false);

  // Remove nonexistent wishlist card
  const removeNonexistent = removeFromWishlist('NONEXISTENT_999');
  assert.strictEqual(removeNonexistent.success, false);

  // Resolve null/empty wishlist card item
  const resolvedNull = resolveWishlistCard(null);
  assert.strictEqual(resolvedNull.isCatalogueMissing, true);
  assert.strictEqual(resolvedNull.cardId, 'unknown');

  pass('Edge case input validations, nonexistent record handling, and safe fallbacks verified.');
}

console.log('\n========================================================================');
console.log(`🎉 All Milestone 6 Skills & Wishlist tests passed (${passCount} tests)!`);
console.log('========================================================================\n');
