import { FormationId, FormationDefinition, PlayerCard } from '../types';

export const FORMATION_4213: FormationDefinition = {
  id: '4-2-1-3',
  label: '4-2-1-3',
  description: 'Balanced wide attacking setup with double pivot and central playmaker',
  slots: [
    { id: 'gk', name: 'GK', roleCategory: 'GK', x: 50, y: 90 },
    { id: 'lb', name: 'LB', roleCategory: 'DEF', x: 13, y: 73 },
    { id: 'lcb', name: 'CB', roleCategory: 'DEF', x: 34, y: 74 },
    { id: 'rcb', name: 'CB', roleCategory: 'DEF', x: 66, y: 74 },
    { id: 'rb', name: 'RB', roleCategory: 'DEF', x: 87, y: 73 },
    { id: 'ldmf', name: 'DMF', roleCategory: 'MID', x: 32, y: 55 },
    { id: 'rdmf', name: 'DMF', roleCategory: 'MID', x: 68, y: 55 },
    { id: 'amf', name: 'AMF', roleCategory: 'MID', x: 50, y: 38 },
    { id: 'lwf', name: 'LWF', roleCategory: 'FWD', x: 16, y: 20 },
    { id: 'cf', name: 'CF', roleCategory: 'FWD', x: 50, y: 12 },
    { id: 'rwf', name: 'RWF', roleCategory: 'FWD', x: 84, y: 20 },
  ],
};

export const FORMATION_433: FormationDefinition = {
  id: '4-3-3',
  label: '4-3-3',
  description: 'Classic possession triangle with deep playmaker and roaming interior midfielders',
  slots: [
    { id: 'gk', name: 'GK', roleCategory: 'GK', x: 50, y: 90 },
    { id: 'lb', name: 'LB', roleCategory: 'DEF', x: 13, y: 73 },
    { id: 'lcb', name: 'CB', roleCategory: 'DEF', x: 34, y: 74 },
    { id: 'rcb', name: 'CB', roleCategory: 'DEF', x: 66, y: 74 },
    { id: 'rb', name: 'RB', roleCategory: 'DEF', x: 87, y: 73 },
    { id: 'dmf', name: 'DMF', roleCategory: 'MID', x: 50, y: 58 },
    { id: 'lcmf', name: 'CMF', roleCategory: 'MID', x: 30, y: 43 },
    { id: 'rcmf', name: 'CMF', roleCategory: 'MID', x: 70, y: 43 },
    { id: 'lwf', name: 'LWF', roleCategory: 'FWD', x: 16, y: 20 },
    { id: 'cf', name: 'CF', roleCategory: 'FWD', x: 50, y: 12 },
    { id: 'rwf', name: 'RWF', roleCategory: 'FWD', x: 84, y: 20 },
  ],
};

export const FORMATION_4222: FormationDefinition = {
  id: '4-2-2-2',
  label: '4-2-2-2',
  description: 'Twin strike force supported by wide playmakers and solid double pivot',
  slots: [
    { id: 'gk', name: 'GK', roleCategory: 'GK', x: 50, y: 90 },
    { id: 'lb', name: 'LB', roleCategory: 'DEF', x: 13, y: 73 },
    { id: 'lcb', name: 'CB', roleCategory: 'DEF', x: 34, y: 74 },
    { id: 'rcb', name: 'CB', roleCategory: 'DEF', x: 66, y: 74 },
    { id: 'rb', name: 'RB', roleCategory: 'DEF', x: 87, y: 73 },
    { id: 'ldmf', name: 'DMF', roleCategory: 'MID', x: 33, y: 55 },
    { id: 'rdmf', name: 'DMF', roleCategory: 'MID', x: 67, y: 55 },
    { id: 'lmf', name: 'LMF', roleCategory: 'MID', x: 18, y: 36 },
    { id: 'rmf', name: 'RMF', roleCategory: 'MID', x: 82, y: 36 },
    { id: 'lcf', name: 'CF', roleCategory: 'FWD', x: 34, y: 14 },
    { id: 'rcf', name: 'CF', roleCategory: 'FWD', x: 66, y: 14 },
  ],
};

export const FORMATIONS: Record<FormationId, FormationDefinition> = {
  '4-2-1-3': FORMATION_4213,
  '4-3-3': FORMATION_433,
  '4-2-2-2': FORMATION_4222,
};

export const SUPPORTED_FORMATIONS: FormationId[] = ['4-2-1-3', '4-3-3', '4-2-2-2'];

export function getFormation(id: FormationId): FormationDefinition {
  return FORMATIONS[id] || FORMATION_4213;
}

/**
 * Intelligently maps assignments when changing formations to preserve players without silent loss.
 */
export function rearrangeAssignmentsOnFormationChange(
  oldFormationId: FormationId,
  newFormationId: FormationId,
  currentAssignments: Record<string, string>,
  getPlayerFn?: (id: string) => PlayerCard | undefined
): { assignments: Record<string, string>; notes: string[] } {
  if (oldFormationId === newFormationId) {
    return { assignments: { ...currentAssignments }, notes: [] };
  }

  const newFormation = getFormation(newFormationId);
  const newAssignments: Record<string, string> = {};
  const notes: string[] = [];

  // Track remaining unplaced players from old formation
  const unplacedPlayers: Array<{ oldSlotId: string; playerId: string }> = [];

  for (const [oldSlotId, playerId] of Object.entries(currentAssignments)) {
    if (!playerId) continue;

    // Direct identical slot ID matching
    const matchingSlot = newFormation.slots.find((s) => s.id === oldSlotId);
    if (matchingSlot) {
      newAssignments[oldSlotId] = playerId;
    } else {
      unplacedPlayers.push({ oldSlotId, playerId });
    }
  }

  // Pre-configured sensible positional transition maps
  const slotTransitionMap: Record<string, Record<string, string>> = {
    // 4-2-1-3 to 4-3-3
    '4-2-1-3->4-3-3': {
      ldmf: 'dmf',
      rdmf: 'rcmf',
      amf: 'lcmf',
    },
    // 4-3-3 to 4-2-1-3
    '4-3-3->4-2-1-3': {
      dmf: 'ldmf',
      rcmf: 'rdmf',
      lcmf: 'amf',
    },
    // 4-2-1-3 to 4-2-2-2
    '4-2-1-3->4-2-2-2': {
      cf: 'lcf',
      amf: 'rcf',
      lwf: 'lmf',
      rwf: 'rmf',
    },
    // 4-2-2-2 to 4-2-1-3
    '4-2-2-2->4-2-1-3': {
      lcf: 'cf',
      rcf: 'amf',
      lmf: 'lwf',
      rmf: 'rwf',
    },
    // 4-3-3 to 4-2-2-2
    '4-3-3->4-2-2-2': {
      cf: 'lcf',
      dmf: 'ldmf',
      rcmf: 'rdmf',
      lcmf: 'rcf',
      lwf: 'lmf',
      rwf: 'rmf',
    },
    // 4-2-2-2 to 4-3-3
    '4-2-2-2->4-3-3': {
      lcf: 'cf',
      rcf: 'lcmf',
      ldmf: 'dmf',
      rdmf: 'rcmf',
      lmf: 'lwf',
      rmf: 'rwf',
    },
  };

  const transitionKey = `${oldFormationId}->${newFormationId}`;
  const ruleMap = slotTransitionMap[transitionKey] || {};

  // Apply mapped transitions for unplaced players
  const stillUnplaced: Array<{ oldSlotId: string; playerId: string }> = [];

  for (const item of unplacedPlayers) {
    const candidateSlot = ruleMap[item.oldSlotId];
    if (candidateSlot && !newAssignments[candidateSlot]) {
      newAssignments[candidateSlot] = item.playerId;
    } else {
      stillUnplaced.push(item);
    }
  }

  // Find remaining empty slots in new formation
  const emptySlots = newFormation.slots.filter((s) => !newAssignments[s.id]);

  // Attempt to place remaining unplaced players into compatible role categories
  const finalBenchDisplaced: Array<{ oldSlotId: string; playerId: string }> = [];

  for (const unplaced of stillUnplaced) {
    const player = getPlayerFn ? getPlayerFn(unplaced.playerId) : undefined;
    const playerName = player ? player.name : unplaced.playerId;

    // Find first empty slot of same role category
    const sameCatIndex = emptySlots.findIndex(
      (s) => !newAssignments[s.id] && player && s.name === player.primaryPosition
    );

    if (sameCatIndex >= 0) {
      const slot = emptySlots[sameCatIndex];
      newAssignments[slot.id] = unplaced.playerId;
      emptySlots.splice(sameCatIndex, 1);
      notes.push(`${playerName} adjusted to ${slot.name}`);
    } else if (emptySlots.length > 0) {
      const slot = emptySlots.shift()!;
      newAssignments[slot.id] = unplaced.playerId;
      notes.push(`${playerName} assigned to ${slot.name}`);
    } else {
      finalBenchDisplaced.push(unplaced);
      notes.push(`${playerName} moved to substitutes bench`);
    }
  }

  return { assignments: newAssignments, notes };
}
