import {
  SquadBuilderState,
  LayoutState,
  TacticalLayout,
  FormationId,
  SquadValidationResult,
  PlayerCard,
} from '../types';
import { getFormation } from './formationData';

export const SQUAD_STORAGE_KEY = 'bala_efoot_squad_state_v1';

export const DEFAULT_STARTING_XI_ASSIGNMENTS: Record<string, string> = {
  gk: 'P023', // Manuel Neuer (107 GK)
  lb: 'P012', // Jordi Alba (105 LB)
  lcb: 'P015', // Paolo Maldini (109 LB/CB)
  rcb: 'P022', // Marcel Desailly (107 CB)
  rb: 'P016', // Lilian Thuram (105 RB)
  ldmf: 'P011', // Patrick Vieira (106 CMF/DMF)
  rdmf: 'P005', // Ruud Gullit (106 CMF)
  amf: 'P007', // Jude Bellingham (107 AMF)
  lwf: 'P004', // Ronaldinho Gaúcho (106 LMF/LWF)
  cf: 'P001', // Zlatan Ibrahimović (109 CF)
  rwf: 'P003', // Lionel Messi (109 RMF/RWF)
};

export const DEFAULT_ATTACK_LAYOUT: LayoutState = {
  formationId: '4-2-1-3',
  assignments: { ...DEFAULT_STARTING_XI_ASSIGNMENTS },
};

export const DEFAULT_DEFENCE_LAYOUT: LayoutState = {
  formationId: '4-2-1-3',
  assignments: { ...DEFAULT_STARTING_XI_ASSIGNMENTS },
};

export const DEFAULT_SQUAD_STATE: SquadBuilderState = {
  activeLayout: 'attack',
  attack: DEFAULT_ATTACK_LAYOUT,
  defence: DEFAULT_DEFENCE_LAYOUT,
};

/**
 * Loads squad state from localStorage with safe fallbacks
 */
export function loadSquadState(): SquadBuilderState {
  try {
    const raw = localStorage.getItem(SQUAD_STORAGE_KEY);
    if (!raw) return DEFAULT_SQUAD_STATE;

    const parsed = JSON.parse(raw) as Partial<SquadBuilderState>;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SQUAD_STATE;

    const sanitizeLayout = (layout?: Partial<LayoutState>): LayoutState => {
      const formationId: FormationId =
        layout?.formationId === '4-3-3' ||
        layout?.formationId === '4-2-2-2' ||
        layout?.formationId === '4-2-1-3'
          ? layout.formationId
          : '4-2-1-3';

      const assignments: Record<string, string> = {};
      if (layout?.assignments && typeof layout.assignments === 'object') {
        for (const [k, v] of Object.entries(layout.assignments)) {
          if (typeof k === 'string' && typeof v === 'string') {
            assignments[k] = v;
          }
        }
      }

      return {
        formationId,
        assignments: Object.keys(assignments).length > 0 ? assignments : { ...DEFAULT_STARTING_XI_ASSIGNMENTS },
      };
    };

    const activeLayout: TacticalLayout =
      parsed.activeLayout === 'defence' ? 'defence' : 'attack';

    return {
      activeLayout,
      attack: sanitizeLayout(parsed.attack),
      defence: sanitizeLayout(parsed.defence),
    };
  } catch (err) {
    console.error('Error loading squad state from localStorage', err);
    return DEFAULT_SQUAD_STATE;
  }
}

/**
 * Saves squad state to localStorage
 */
export function saveSquadState(state: SquadBuilderState): void {
  try {
    localStorage.setItem(SQUAD_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving squad state to localStorage', err);
  }
}

/**
 * Validates a squad layout
 */
export function validateLayout(
  layout: LayoutState,
  allPlayers: PlayerCard[]
): SquadValidationResult {
  const formation = getFormation(layout.formationId);
  const totalSlots = formation.slots.length; // 11
  const assignments = layout.assignments;

  const playerIdsAssigned = Object.values(assignments).filter(Boolean);
  const filledCount = playerIdsAssigned.length;

  // Duplicate checks
  const counts: Record<string, number> = {};
  const duplicatePlayerIds: string[] = [];
  for (const pid of playerIdsAssigned) {
    counts[pid] = (counts[pid] || 0) + 1;
    if (counts[pid] > 1 && !duplicatePlayerIds.includes(pid)) {
      duplicatePlayerIds.push(pid);
    }
  }

  // Missing player ID validation (IDs assigned that don't exist in catalogue)
  const existingIdSet = new Set(allPlayers.map((p) => p.id));
  const missingPlayerIds = playerIdsAssigned.filter((pid) => !existingIdSet.has(pid));

  // Check goalkeeper slot
  const gkSlot = formation.slots.find((s) => s.roleCategory === 'GK');
  const hasGK = Boolean(gkSlot && assignments[gkSlot.id]);

  // Unfilled slot names
  const unfilledSlotNames = formation.slots
    .filter((s) => !assignments[s.id])
    .map((s) => s.name);

  const isValid =
    filledCount === totalSlots &&
    duplicatePlayerIds.length === 0 &&
    missingPlayerIds.length === 0 &&
    hasGK;

  return {
    isValid,
    filledCount,
    totalSlots,
    hasGK,
    duplicatePlayerIds,
    missingPlayerIds,
    unfilledSlotNames,
  };
}
