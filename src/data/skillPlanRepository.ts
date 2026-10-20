import type {
  PlayerCard,
  PlayerSkillPlan,
  PlannedSkill,
  SkillPlanState,
} from '../types';
import rawPlayersData from './players.json';

export const SKILL_PLANS_STORAGE_KEY = 'bala_efoot_skill_plans_v1';
export const MAX_ADDITIONAL_SKILLS = 5;

const rawPlayers = rawPlayersData as unknown as PlayerCard[];

export function createDefaultSkillPlansState(): SkillPlanState {
  return {
    version: 1,
    plans: {},
  };
}

export const DEFAULT_SKILL_PLANS_STATE: SkillPlanState = {
  version: 1,
  plans: {},
};

/**
 * Loads skill plans state from localStorage with corruption protection
 */
export function loadSkillPlansState(): SkillPlanState {
  try {
    if (typeof localStorage === 'undefined') {
      return createDefaultSkillPlansState();
    }

    const raw = localStorage.getItem(SKILL_PLANS_STORAGE_KEY);
    if (!raw) {
      return createDefaultSkillPlansState();
    }

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      !parsed.plans ||
      typeof parsed.plans !== 'object' ||
      Array.isArray(parsed.plans)
    ) {
      return createDefaultSkillPlansState();
    }

    const sanitizedPlans: Record<string, PlayerSkillPlan> = {};
    for (const [playerId, plan] of Object.entries(parsed.plans)) {
      if (!plan || typeof plan !== 'object') continue;
      const p = plan as Partial<PlayerSkillPlan>;
      const additionalSkills: PlannedSkill[] = Array.isArray(p.additionalSkills)
        ? p.additionalSkills
            .filter((s): s is PlannedSkill => Boolean(s && typeof s.skillName === 'string'))
            .slice(0, MAX_ADDITIONAL_SKILLS)
        : [];

      sanitizedPlans[playerId] = {
        playerId,
        additionalSkills,
        customNativeSkills: Array.isArray(p.customNativeSkills)
          ? p.customNativeSkills.filter((s): s is string => typeof s === 'string')
          : undefined,
        notes: typeof p.notes === 'string' ? p.notes : undefined,
        updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
      };
    }

    return {
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      plans: sanitizedPlans,
    };
  } catch (err) {
    console.error('Error loading skill plans from localStorage:', err);
    return createDefaultSkillPlansState();
  }
}

/**
 * Persists skill plans state into localStorage
 */
export function saveSkillPlansState(state: SkillPlanState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SKILL_PLANS_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving skill plans to localStorage:', err);
  }
}

/**
 * Returns native skills for a player card.
 * Distinguishes verified native skills from unavailable/unknown state.
 */
export function getNativeSkills(
  player: PlayerCard,
  customNativeSkills?: string[]
): { skills: string[]; isKnown: boolean } {
  // If user provided custom verified native skills for cards with unknown data:
  if (customNativeSkills && customNativeSkills.length > 0) {
    return { skills: customNativeSkills, isKnown: true };
  }

  // Check default skills from catalogue record
  if (player.skills && Array.isArray(player.skills)) {
    const defaultSkills = player.skills
      .filter((s) => s.skillType === 'Default')
      .map((s) => s.skillName.trim());

    if (defaultSkills.length > 0) {
      return { skills: defaultSkills, isKnown: true };
    }
  }

  // Missing or unknown native skills (e.g. P023 Neuer in seed dataset)
  return { skills: [], isKnown: false };
}

/**
 * Returns default initial additional skills from seed player data if available
 */
function getSeedAdditionalSkills(playerId: string): PlannedSkill[] {
  const p = rawPlayers.find((player) => player.id === playerId);
  if (!p || !p.skills || !Array.isArray(p.skills)) return [];

  return p.skills
    .filter((s) => s.skillType === 'Additional')
    .slice(0, MAX_ADDITIONAL_SKILLS)
    .map((s) => ({
      skillName: s.skillName.trim(),
      isHighlightGold: Boolean(s.isHighlightGold),
      addedAt: new Date().toISOString(),
    }));
}

/**
 * Retrieves the skill plan for a specific player card
 */
export function getSkillPlan(playerId: string): PlayerSkillPlan {
  const state = loadSkillPlansState();
  if (state.plans[playerId]) {
    return state.plans[playerId];
  }

  // Not yet saved: initialize with seed additional skills
  const initialAdditional = getSeedAdditionalSkills(playerId);
  return {
    playerId,
    additionalSkills: initialAdditional,
    updatedAt: new Date().toISOString(),
  };
}

export interface AddSkillResult {
  success: boolean;
  error?: string;
  plan?: PlayerSkillPlan;
}

/**
 * Adds a planned additional skill to a player's card
 */
export function addPlannedSkill(
  player: PlayerCard,
  skillName: string,
  isHighlightGold = false
): AddSkillResult {
  if (!player || !player.id) {
    return { success: false, error: 'Valid player card is required' };
  }
  const cleanSkillName = (skillName || '').trim();
  if (!cleanSkillName) {
    return { success: false, error: 'Skill name cannot be empty' };
  }

  const state = loadSkillPlansState();
  const existingPlan = state.plans[player.id] || getSkillPlan(player.id);

  // Check 5 additional skills limit
  if (existingPlan.additionalSkills.length >= MAX_ADDITIONAL_SKILLS) {
    return {
      success: false,
      error: `Maximum ${MAX_ADDITIONAL_SKILLS} additional skills allowed per player card`,
    };
  }

  // Check if skill is already in planned additions
  const isDuplicateAddition = existingPlan.additionalSkills.some(
    (s) => s.skillName.toLowerCase() === cleanSkillName.toLowerCase()
  );
  if (isDuplicateAddition) {
    return {
      success: false,
      error: `Skill "${cleanSkillName}" is already planned for this card`,
    };
  }

  // Check if skill is already a native skill
  const native = getNativeSkills(player, existingPlan.customNativeSkills);
  if (
    native.isKnown &&
    native.skills.some((s) => s.toLowerCase() === cleanSkillName.toLowerCase())
  ) {
    return {
      success: false,
      error: `Skill "${cleanSkillName}" is already a native skill for this card`,
    };
  }

  const updatedPlan: PlayerSkillPlan = {
    ...existingPlan,
    additionalSkills: [
      ...existingPlan.additionalSkills,
      {
        skillName: cleanSkillName,
        isHighlightGold: Boolean(isHighlightGold),
        addedAt: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  state.plans[player.id] = updatedPlan;
  saveSkillPlansState(state);

  return {
    success: true,
    plan: updatedPlan,
  };
}

/**
 * Removes a planned additional skill from a player's card
 */
export function removePlannedSkill(
  playerId: string,
  skillName: string
): { success: boolean; plan: PlayerSkillPlan } {
  const cleanSkillName = skillName.trim().toLowerCase();
  const state = loadSkillPlansState();
  const currentPlan = state.plans[playerId] || getSkillPlan(playerId);

  const updatedPlan: PlayerSkillPlan = {
    ...currentPlan,
    additionalSkills: currentPlan.additionalSkills.filter(
      (s) => s.skillName.toLowerCase() !== cleanSkillName
    ),
    updatedAt: new Date().toISOString(),
  };

  state.plans[playerId] = updatedPlan;
  saveSkillPlansState(state);

  return { success: true, plan: updatedPlan };
}

/**
 * Toggles gold highlight status for a planned skill
 */
export function toggleSkillHighlight(
  playerId: string,
  skillName: string
): { success: boolean; plan: PlayerSkillPlan } {
  const cleanSkillName = skillName.trim().toLowerCase();
  const state = loadSkillPlansState();
  const currentPlan = state.plans[playerId] || getSkillPlan(playerId);

  const updatedPlan: PlayerSkillPlan = {
    ...currentPlan,
    additionalSkills: currentPlan.additionalSkills.map((s) => {
      if (s.skillName.toLowerCase() === cleanSkillName) {
        return { ...s, isHighlightGold: !s.isHighlightGold };
      }
      return s;
    }),
    updatedAt: new Date().toISOString(),
  };

  state.plans[playerId] = updatedPlan;
  saveSkillPlansState(state);

  return { success: true, plan: updatedPlan };
}

/**
 * Resets all planned additional skills for a player card
 */
export function resetSkillPlan(playerId: string): { success: boolean; plan: PlayerSkillPlan } {
  const state = loadSkillPlansState();
  const currentPlan = state.plans[playerId] || getSkillPlan(playerId);

  const updatedPlan: PlayerSkillPlan = {
    ...currentPlan,
    additionalSkills: [],
    updatedAt: new Date().toISOString(),
  };

  state.plans[playerId] = updatedPlan;
  saveSkillPlansState(state);

  return { success: true, plan: updatedPlan };
}

/**
 * Sets user-managed custom native skills for cards where native skills are unavailable
 */
export function setCustomNativeSkills(
  playerId: string,
  skills: string[]
): { success: boolean; plan: PlayerSkillPlan } {
  const cleanSkills = Array.from(new Set(skills.map((s) => s.trim()).filter(Boolean)));
  const state = loadSkillPlansState();
  const currentPlan = state.plans[playerId] || getSkillPlan(playerId);

  const updatedPlan: PlayerSkillPlan = {
    ...currentPlan,
    customNativeSkills: cleanSkills,
    // Filter out any planned additional skills that now collide with custom native skills
    additionalSkills: currentPlan.additionalSkills.filter(
      (p) => !cleanSkills.some((n) => n.toLowerCase() === p.skillName.toLowerCase())
    ),
    updatedAt: new Date().toISOString(),
  };

  state.plans[playerId] = updatedPlan;
  saveSkillPlansState(state);

  return { success: true, plan: updatedPlan };
}
