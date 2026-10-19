import type {
  Season,
  SeasonDraftInput,
  SeasonsState,
  SeasonValidationResult,
  SeasonStatus,
  PlayerRoleClassification,
  BaselinePlayerRecord,
  SeasonBaselineSnapshot,
  BaselineDraftPlayerEntry,
  SeasonBaselineDraft,
  ProgressPlayerRecord,
  SeasonProgressSnapshot,
  ProgressDraftPlayerEntry,
  SeasonProgressDraft,
  PlayerStatDelta,
  RewardEligibilityStatus,
  SeasonRewardAcquisition,
} from '../types';

export const SEASONS_STORAGE_KEY = 'bala_efoot_seasons_v1';

export const DEFAULT_SEASONS_STATE: SeasonsState = {
  version: 1,
  seasons: [],
  activeDraftId: null,
};

/**
 * Authentic 23 player card IDs in Bala EFoot
 */
export const AUTHENTIC_PLAYER_IDS: readonly string[] = [
  'P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008',
  'P009', 'P010', 'P011', 'P012', 'P013', 'P014', 'P015', 'P016',
  'P017', 'P018', 'P019', 'P020', 'P021', 'P022', 'P023',
];

/**
 * Canonical 11 Starting XI player card IDs from default squad assignments
 */
export const CANONICAL_STARTING_XI_IDS: ReadonlySet<string> = new Set([
  'P023', // Manuel Neuer (GK)
  'P012', // Jordi Alba (LB)
  'P015', // Paolo Maldini (CB)
  'P022', // Marcel Desailly (CB)
  'P016', // Lilian Thuram (RB)
  'P011', // Patrick Vieira (DMF)
  'P005', // Ruud Gullit (CMF)
  'P007', // Jude Bellingham (AMF)
  'P004', // Ronaldinho Gaúcho (LWF)
  'P001', // Zlatan Ibrahimović (CF)
  'P003', // Lionel Messi (RWF)
]);

/**
 * Validates whether a value is a valid non-negative integer
 */
export function isValidStatValue(val: unknown): val is number {
  return typeof val === 'number' && Number.isInteger(val) && val >= 0;
}

/**
 * Reward rank threshold: Rank 1 through 100,000 inclusive qualifies for reward eligibility.
 */
export const REWARD_RANK_THRESHOLD = 100000;

/**
 * Validates whether a value is a valid positive integer rank (1 or greater)
 */
export function isValidRankValue(val: unknown): val is number {
  return typeof val === 'number' && Number.isInteger(val) && val >= 1;
}

/**
 * Computes reward eligibility status based on final rank.
 * - 1 to 100,000 inclusive: 'Eligible'
 * - 100,001 or greater: 'Not Eligible'
 * - null or undefined: 'Eligibility Unknown'
 * - 0, negative, fractional, or non-number: throws Error
 */
export function computeRewardEligibility(rank: number | null | undefined): RewardEligibilityStatus {
  if (rank === null || rank === undefined) {
    return 'Eligibility Unknown';
  }
  if (!isValidRankValue(rank)) {
    throw new Error('Rank must be a positive integer (1 or greater). Zero, negative, and fractional values are invalid.');
  }
  return rank <= REWARD_RANK_THRESHOLD ? 'Eligible' : 'Not Eligible';
}

/**
 * Returns canonical role classification for a player card ID
 */
export function getCanonicalPlayerRole(
  playerId: string,
  customStartingIds?: Set<string>
): PlayerRoleClassification {
  if (customStartingIds && customStartingIds.size > 0) {
    return customStartingIds.has(playerId) ? 'Starting XI' : 'Substitute';
  }
  return CANONICAL_STARTING_XI_IDS.has(playerId) ? 'Starting XI' : 'Substitute';
}

/**
 * Validates whether a value is a valid SeasonStatus
 */
function isValidSeasonStatus(status: unknown): status is SeasonStatus {
  return status === 'Draft' || status === 'Active' || status === 'Closed';
}

/**
 * Sanitizes and validates a baseline snapshot from raw storage
 */
function sanitizeBaseline(raw: unknown): SeasonBaselineSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.id !== 'string' || typeof b.confirmedAt !== 'string') return null;
  if (!Array.isArray(b.players)) return null;

  const validPlayers: BaselinePlayerRecord[] = [];
  const seenIds = new Set<string>();

  for (const p of b.players) {
    if (!p || typeof p !== 'object') continue;
    const item = p as Record<string, unknown>;
    const pid = typeof item.playerId === 'string' ? item.playerId.trim() : '';
    if (!pid || !AUTHENTIC_PLAYER_IDS.includes(pid) || seenIds.has(pid)) continue;
    if (!isValidStatValue(item.matches) || !isValidStatValue(item.goals) || !isValidStatValue(item.assists)) {
      continue;
    }
    seenIds.add(pid);
    validPlayers.push({
      playerId: pid,
      roleClassification: item.roleClassification === 'Starting XI' ? 'Starting XI' : 'Substitute',
      matches: item.matches,
      goals: item.goals,
      assists: item.assists,
    });
  }

  if (validPlayers.length !== 23) return null;

  return {
    id: b.id,
    confirmedAt: b.confirmedAt,
    confirmedDate: typeof b.confirmedDate === 'string' ? b.confirmedDate : b.confirmedAt.split('T')[0],
    players: validPlayers,
    notes: typeof b.notes === 'string' ? b.notes : undefined,
  };
}

/**
 * Sanitizes a baseline draft from raw storage
 */
function sanitizeBaselineDraft(raw: unknown): SeasonBaselineDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.seasonId !== 'string' || !Array.isArray(d.players)) return null;

  const validEntries: BaselineDraftPlayerEntry[] = [];
  for (const p of d.players) {
    if (!p || typeof p !== 'object') continue;
    const item = p as Record<string, unknown>;
    const pid = typeof item.playerId === 'string' ? item.playerId.trim() : '';
    if (!pid || !AUTHENTIC_PLAYER_IDS.includes(pid)) continue;

    validEntries.push({
      playerId: pid,
      roleClassification: item.roleClassification === 'Starting XI' ? 'Starting XI' : 'Substitute',
      matches: isValidStatValue(item.matches) ? item.matches : null,
      goals: isValidStatValue(item.goals) ? item.goals : null,
      assists: isValidStatValue(item.assists) ? item.assists : null,
    });
  }

  return {
    seasonId: d.seasonId,
    updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString(),
    players: validEntries,
    notes: typeof d.notes === 'string' ? d.notes : undefined,
  };
}

/**
 * Sanitizes progress snapshots from raw storage
 */
function sanitizeProgressSnapshots(raw: unknown): SeasonProgressSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const validSnapshots: SeasonProgressSnapshot[] = [];

  for (const s of raw) {
    if (!s || typeof s !== 'object') continue;
    const snap = s as Record<string, unknown>;
    if (typeof snap.id !== 'string' || typeof snap.recordedAt !== 'string') continue;
    if (!Array.isArray(snap.players)) continue;

    const validPlayers: ProgressPlayerRecord[] = [];
    const seenIds = new Set<string>();

    for (const p of snap.players) {
      if (!p || typeof p !== 'object') continue;
      const item = p as Record<string, unknown>;
      const pid = typeof item.playerId === 'string' ? item.playerId.trim() : '';
      if (!pid || !AUTHENTIC_PLAYER_IDS.includes(pid) || seenIds.has(pid)) continue;
      if (!isValidStatValue(item.matches) || !isValidStatValue(item.goals) || !isValidStatValue(item.assists)) {
        continue;
      }
      seenIds.add(pid);
      validPlayers.push({
        playerId: pid,
        matches: item.matches,
        goals: item.goals,
        assists: item.assists,
      });
    }

    if (validPlayers.length !== 23) continue;

    validSnapshots.push({
      id: snap.id,
      recordingDate: typeof snap.recordingDate === 'string' ? snap.recordingDate : snap.recordedAt.split('T')[0],
      recordedAt: snap.recordedAt,
      players: validPlayers,
      notes: typeof snap.notes === 'string' ? snap.notes : undefined,
      hasConfirmedDecreases: Boolean(snap.hasConfirmedDecreases),
    });
  }

  return validSnapshots;
}

/**
 * Sanitizes a progress draft from raw storage
 */
function sanitizeProgressDraft(raw: unknown): SeasonProgressDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.seasonId !== 'string' || !Array.isArray(d.players)) return null;

  const validEntries: ProgressDraftPlayerEntry[] = [];
  for (const p of d.players) {
    if (!p || typeof p !== 'object') continue;
    const item = p as Record<string, unknown>;
    const pid = typeof item.playerId === 'string' ? item.playerId.trim() : '';
    if (!pid || !AUTHENTIC_PLAYER_IDS.includes(pid)) continue;

    validEntries.push({
      playerId: pid,
      matches: isValidStatValue(item.matches) ? item.matches : null,
      goals: isValidStatValue(item.goals) ? item.goals : null,
      assists: isValidStatValue(item.assists) ? item.assists : null,
    });
  }

  return {
    seasonId: d.seasonId,
    recordingDate: typeof d.recordingDate === 'string' ? d.recordingDate : new Date().toISOString().split('T')[0],
    updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString(),
    players: validEntries,
    notes: typeof d.notes === 'string' ? d.notes : undefined,
  };
}

/**
 * Sanitizes a reward acquisition record from raw storage
 */
function sanitizeRewardAcquisition(raw: unknown): SeasonRewardAcquisition | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.seasonId !== 'string' || typeof r.cardName !== 'string') return null;
  const cardName = r.cardName.trim();
  if (!cardName) return null;

  return {
    id: r.id,
    seasonId: r.seasonId,
    cardName,
    cardDescription: typeof r.cardDescription === 'string' ? r.cardDescription.trim() || undefined : undefined,
    acquiredDate: typeof r.acquiredDate === 'string' ? r.acquiredDate : new Date().toISOString().split('T')[0],
    notes: typeof r.notes === 'string' ? r.notes.trim() || undefined : undefined,
    confirmedAt: typeof r.confirmedAt === 'string' ? r.confirmedAt : new Date().toISOString(),
  };
}

/**
 * Validates and sanitizes a raw season object loaded from storage
 */
function sanitizeSeason(raw: unknown): Season | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Record<string, unknown>;

  const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
  if (!id) return null;

  const status = isValidSeasonStatus(candidate.status) ? candidate.status : 'Draft';
  const startDate = typeof candidate.startDate === 'string' ? candidate.startDate : '';
  const startingDivision =
    typeof candidate.startingDivision === 'number' &&
    Number.isInteger(candidate.startingDivision) &&
    candidate.startingDivision >= 1 &&
    candidate.startingDivision <= 10
      ? candidate.startingDivision
      : 10;

  const notes = typeof candidate.notes === 'string' ? candidate.notes : undefined;
  const createdAt =
    typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString();
  const updatedAt =
    typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString();

  // Milestone 4B: Baseline & Progress sanitization
  const baseline = sanitizeBaseline(candidate.baseline || candidate.baselineSnapshot);
  const baselineDraft = sanitizeBaselineDraft(candidate.baselineDraft);
  const progressSnapshots = sanitizeProgressSnapshots(candidate.progressSnapshots);
  const progressDraft = sanitizeProgressDraft(candidate.progressDraft);

  // Milestone 4C1: Reward Eligibility & Acquisition sanitization
  const finalRank = isValidRankValue(candidate.finalRank) ? candidate.finalRank : null;
  let rewardEligibility: RewardEligibilityStatus = 'Eligibility Unknown';
  if (finalRank !== null) {
    rewardEligibility = computeRewardEligibility(finalRank);
  } else if (
    candidate.rewardEligibility === 'Eligible' ||
    candidate.rewardEligibility === 'Not Eligible' ||
    candidate.rewardEligibility === 'Eligibility Unknown'
  ) {
    rewardEligibility = candidate.rewardEligibility;
  }
  const rewardAcquisition = sanitizeRewardAcquisition(candidate.rewardAcquisition);

  return {
    id,
    startDate,
    startingDivision,
    notes,
    status,
    createdAt,
    updatedAt,
    baseline,
    baselineDraft,
    progressSnapshots,
    progressDraft,
    baselineSnapshot: baseline, // compatibility alias
    finalRank,
    rewardEligibility,
    rewardAcquisition,
    rewardAcquired: Boolean(rewardAcquisition), // legacy compatibility
    closedAt: typeof candidate.closedAt === 'string' ? candidate.closedAt : undefined,
    closureNotes: typeof candidate.closureNotes === 'string' ? candidate.closureNotes : undefined,
  };
}

/**
 * Loads seasons state from localStorage with comprehensive corruption protection
 */
export function loadSeasonsState(): SeasonsState {
  try {
    const raw = localStorage.getItem(SEASONS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SEASONS_STATE };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_SEASONS_STATE };
    }

    const version = typeof parsed.version === 'number' ? parsed.version : 1;
    const rawSeasons = Array.isArray(parsed.seasons) ? parsed.seasons : [];

    const seasons: Season[] = [];
    for (const item of rawSeasons) {
      const sanitized = sanitizeSeason(item);
      if (sanitized) {
        seasons.push(sanitized);
      }
    }

    const activeDraftId =
      typeof parsed.activeDraftId === 'string' ? parsed.activeDraftId : null;

    return {
      version,
      seasons,
      activeDraftId,
    };
  } catch (err) {
    console.error('Error loading seasons state from localStorage:', err);
    return { ...DEFAULT_SEASONS_STATE };
  }
}

/**
 * Persists seasons state into localStorage
 */
export function saveSeasonsState(state: SeasonsState): void {
  try {
    localStorage.setItem(SEASONS_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving seasons state to localStorage:', err);
  }
}

/**
 * Validates a season draft input
 */
export function validateSeasonDraft(
  draft: SeasonDraftInput,
  isActivating: boolean,
  existingSeasons: Season[],
  currentId?: string
): SeasonValidationResult {
  const errors: Record<string, string> = {};

  const trimmedId = (draft.id || '').trim();

  // Identifier checks
  if (isActivating && !trimmedId) {
    errors.id = 'Season/phase identifier is required.';
  } else if (trimmedId) {
    // Uniqueness check (case-insensitive, trimmed)
    const normalizedTarget = trimmedId.toLowerCase();
    const duplicate = existingSeasons.find(
      (s) =>
        s.id.toLowerCase() === normalizedTarget &&
        (!currentId || s.id.toLowerCase() !== currentId.toLowerCase())
    );

    if (duplicate) {
      errors.id = `A season with identifier "${trimmedId}" already exists. Please choose a unique identifier.`;
    }
  }

  // Start Date checks
  if (isActivating && !draft.startDate) {
    errors.startDate = 'Start date is required to activate a season.';
  } else if (draft.startDate) {
    const parsedDate = new Date(draft.startDate);
    if (isNaN(parsedDate.getTime())) {
      errors.startDate = 'Please enter a valid start date (YYYY-MM-DD).';
    }
  }

  // Starting Division checks
  if (isActivating && (draft.startingDivision === undefined || draft.startingDivision === null)) {
    errors.startingDivision = 'Starting division is required to activate a season.';
  } else if (draft.startingDivision !== undefined && draft.startingDivision !== null) {
    const div = Number(draft.startingDivision);
    if (!Number.isInteger(div) || div < 1 || div > 10) {
      errors.startingDivision = 'Starting division must be an integer between 1 and 10.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Retrieves all saved seasons
 */
export function getAllSeasons(): Season[] {
  const state = loadSeasonsState();
  return state.seasons;
}

/**
 * Retrieves a single season by its identifier
 */
export function getSeasonById(id: string): Season | undefined {
  const seasons = getAllSeasons();
  const normalized = id.trim().toLowerCase();
  return seasons.find((s) => s.id.toLowerCase() === normalized);
}

/**
 * Retrieves the currently active draft, if any
 */
export function getActiveDraft(): Season | undefined {
  const state = loadSeasonsState();
  if (!state.activeDraftId) {
    return state.seasons.find((s) => s.status === 'Draft');
  }
  return state.seasons.find((s) => s.id === state.activeDraftId);
}

/**
 * Saves or updates a season draft
 */
export function saveSeasonDraft(
  draft: SeasonDraftInput,
  originalId?: string
): {
  success: boolean;
  season?: Season;
  error?: string;
  validationErrors?: Record<string, string>;
} {
  const state = loadSeasonsState();
  const validation = validateSeasonDraft(draft, false, state.seasons, originalId);

  if (!validation.isValid) {
    return {
      success: false,
      validationErrors: validation.errors,
      error: Object.values(validation.errors)[0],
    };
  }

  const rawId = (draft.id || '').trim();
  const targetId = rawId || originalId || `Draft-${Date.now()}`;
  const now = new Date().toISOString();

  const existingIndex = originalId
    ? state.seasons.findIndex((s) => s.id === originalId)
    : state.seasons.findIndex((s) => s.id.toLowerCase() === targetId.toLowerCase());

  let updatedSeason: Season;

  if (existingIndex >= 0) {
    const existing = state.seasons[existingIndex];
    if (existing.status === 'Closed') {
      return {
        success: false,
        error: 'Closed seasons are immutable and cannot be updated.',
      };
    }

    updatedSeason = {
      ...existing,
      id: targetId,
      startDate: draft.startDate ?? existing.startDate,
      startingDivision: draft.startingDivision ?? existing.startingDivision,
      notes: draft.notes !== undefined ? draft.notes : existing.notes,
      updatedAt: now,
    };

    state.seasons[existingIndex] = updatedSeason;
  } else {
    updatedSeason = {
      id: targetId,
      startDate: draft.startDate ?? new Date().toISOString().split('T')[0],
      startingDivision: draft.startingDivision ?? 10,
      notes: draft.notes,
      status: 'Draft',
      createdAt: now,
      updatedAt: now,
    };

    state.seasons.push(updatedSeason);
  }

  state.activeDraftId = updatedSeason.id;
  saveSeasonsState(state);

  return {
    success: true,
    season: updatedSeason,
  };
}

/**
 * Explicitly activates a draft season
 */
export function activateSeason(
  id: string
): {
  success: boolean;
  season?: Season;
  error?: string;
  validationErrors?: Record<string, string>;
} {
  const state = loadSeasonsState();
  const seasonIndex = state.seasons.findIndex((s) => s.id === id);

  if (seasonIndex < 0) {
    return {
      success: false,
      error: `Season "${id}" was not found.`,
    };
  }

  const season = state.seasons[seasonIndex];

  if (season.status === 'Closed') {
    return {
      success: false,
      error: `Season "${id}" is closed and cannot be reactivated.`,
    };
  }

  const validation = validateSeasonDraft(
    {
      id: season.id,
      startDate: season.startDate,
      startingDivision: season.startingDivision,
      notes: season.notes,
    },
    true,
    state.seasons,
    season.id
  );

  if (!validation.isValid) {
    return {
      success: false,
      validationErrors: validation.errors,
      error: Object.values(validation.errors)[0],
    };
  }

  const now = new Date().toISOString();
  const activatedSeason: Season = {
    ...season,
    status: 'Active',
    updatedAt: now,
  };

  state.seasons[seasonIndex] = activatedSeason;

  if (state.activeDraftId === id) {
    state.activeDraftId = null;
  }

  saveSeasonsState(state);

  return {
    success: true,
    season: activatedSeason,
  };
}

/**
 * Discards or deletes an un-activated draft season
 */
export function discardDraft(id: string): { success: boolean; error?: string } {
  const state = loadSeasonsState();
  const season = state.seasons.find((s) => s.id === id);

  if (!season) {
    return { success: false, error: `Season "${id}" not found.` };
  }

  if (season.status === 'Closed') {
    return {
      success: false,
      error: 'Closed seasons cannot be deleted.',
    };
  }

  state.seasons = state.seasons.filter((s) => s.id !== id);
  if (state.activeDraftId === id) {
    state.activeDraftId = null;
  }

  saveSeasonsState(state);
  return { success: true };
}

/**
 * Clears the active draft pointer without deleting the season record
 */
export function clearActiveDraftPointer(): void {
  const state = loadSeasonsState();
  state.activeDraftId = null;
  saveSeasonsState(state);
}

// ============================================================================
// MILESTONE 4B: BASELINES & PROGRESS TRACKING BUSINESS LOGIC
// ============================================================================

/**
 * Validates baseline player entries for confirmation
 * Requires all 23 authentic player cards to have valid, non-negative integer stats.
 * Distinguishes unentered (null) from genuine zero (0).
 */
export function validateBaselinePlayerEntries(
  players: (BaselineDraftPlayerEntry | BaselinePlayerRecord)[]
): {
  isValid: boolean;
  completedCount: number;
  totalCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  let completedCount = 0;

  if (!Array.isArray(players) || players.length !== 23) {
    errors.push(`Baseline requires exactly 23 authentic player cards (received ${players?.length || 0}).`);
  }

  for (const entry of players || []) {
    if (!entry || typeof entry !== 'object') {
      errors.push('Malformed player entry encountered.');
      continue;
    }

    const pid = entry.playerId;
    if (!pid || !AUTHENTIC_PLAYER_IDS.includes(pid)) {
      errors.push(`Invalid or unrecognized player card ID: "${pid}".`);
      continue;
    }

    if (seenIds.has(pid)) {
      errors.push(`Duplicate player card ID in baseline: "${pid}".`);
      continue;
    }
    seenIds.add(pid);

    const matchesValid = isValidStatValue(entry.matches);
    const goalsValid = isValidStatValue(entry.goals);
    const assistsValid = isValidStatValue(entry.assists);

    if (matchesValid && goalsValid && assistsValid) {
      completedCount++;
    } else {
      const missingFields: string[] = [];
      if (!matchesValid) missingFields.push('Matches');
      if (!goalsValid) missingFields.push('Goals');
      if (!assistsValid) missingFields.push('Assists');
      errors.push(`Player ${pid}: Missing or invalid non-negative statistics (${missingFields.join(', ')}).`);
    }

    if (entry.roleClassification !== 'Starting XI' && entry.roleClassification !== 'Substitute') {
      errors.push(`Player ${pid}: Role classification must be 'Starting XI' or 'Substitute'.`);
    }
  }

  // Ensure all 23 IDs are present
  for (const requiredId of AUTHENTIC_PLAYER_IDS) {
    if (!seenIds.has(requiredId)) {
      errors.push(`Missing authentic player card: "${requiredId}".`);
    }
  }

  return {
    isValid: completedCount === 23 && errors.length === 0,
    completedCount,
    totalCount: 23,
    errors,
  };
}

/**
 * Retrieves initial baseline draft for a season, or creates a new one with canonical classifications
 */
export function getInitialBaselineDraft(
  seasonId: string,
  customStartingIds?: Set<string>
): SeasonBaselineDraft {
  const state = loadSeasonsState();
  const season = state.seasons.find((s) => s.id === seasonId);

  if (season?.baselineDraft) {
    return season.baselineDraft;
  }

  return {
    seasonId,
    updatedAt: new Date().toISOString(),
    players: AUTHENTIC_PLAYER_IDS.map((id) => ({
      playerId: id,
      roleClassification: getCanonicalPlayerRole(id, customStartingIds),
      matches: null, // null represents unentered
      goals: null,
      assists: null,
    })),
  };
}

/**
 * Saves an in-progress baseline draft without confirming it
 */
export function saveBaselineDraft(
  seasonId: string,
  draft: SeasonBaselineDraft
): { success: boolean; error?: string } {
  const state = loadSeasonsState();
  const seasonIndex = state.seasons.findIndex((s) => s.id === seasonId);

  if (seasonIndex < 0) {
    return { success: false, error: `Season "${seasonId}" was not found.` };
  }

  const season = state.seasons[seasonIndex];
  if (season.baseline) {
    return {
      success: false,
      error: 'A confirmed baseline already exists and is immutable.',
    };
  }

  // Sanitize player entries
  const sanitizedPlayers: BaselineDraftPlayerEntry[] = [];
  for (const p of draft.players || []) {
    if (AUTHENTIC_PLAYER_IDS.includes(p.playerId)) {
      sanitizedPlayers.push({
        playerId: p.playerId,
        roleClassification: p.roleClassification === 'Starting XI' ? 'Starting XI' : 'Substitute',
        matches: isValidStatValue(p.matches) ? p.matches : null,
        goals: isValidStatValue(p.goals) ? p.goals : null,
        assists: isValidStatValue(p.assists) ? p.assists : null,
      });
    }
  }

  const updatedDraft: SeasonBaselineDraft = {
    seasonId,
    updatedAt: new Date().toISOString(),
    players: sanitizedPlayers,
    notes: draft.notes?.trim() || undefined,
  };

  season.baselineDraft = updatedDraft;
  season.updatedAt = new Date().toISOString();
  saveSeasonsState(state);

  return { success: true };
}

/**
 * Confirms a season baseline, making it immutable
 * Rejects duplicate confirmations, incomplete data, and negative numbers.
 */
export function confirmSeasonBaseline(
  seasonId: string,
  baselineData: {
    players: BaselinePlayerRecord[];
    notes?: string;
  }
): {
  success: boolean;
  baseline?: SeasonBaselineSnapshot;
  error?: string;
  errors?: string[];
} {
  const state = loadSeasonsState();
  const seasonIndex = state.seasons.findIndex((s) => s.id === seasonId);

  if (seasonIndex < 0) {
    return { success: false, error: `Season "${seasonId}" was not found.` };
  }

  const season = state.seasons[seasonIndex];

  // Prevent duplicate baseline confirmation
  if (season.baseline) {
    return {
      success: false,
      error: `A confirmed baseline already exists for season "${seasonId}" and is immutable. Re-confirmation is prevented.`,
    };
  }

  // Validate all 23 player entries
  const validation = validateBaselinePlayerEntries(baselineData.players);
  if (!validation.isValid) {
    return {
      success: false,
      error: 'All 23 players must have valid non-negative integer statistics.',
      errors: validation.errors,
    };
  }

  const now = new Date().toISOString();
  const snapshot: SeasonBaselineSnapshot = {
    id: `baseline-${season.id}-${Date.now()}`,
    confirmedAt: now,
    confirmedDate: now.split('T')[0],
    players: baselineData.players.map((p) => ({
      playerId: p.playerId,
      roleClassification: p.roleClassification,
      matches: p.matches,
      goals: p.goals,
      assists: p.assists,
    })),
    notes: baselineData.notes?.trim() || undefined,
  };

  season.baseline = snapshot;
  season.baselineSnapshot = snapshot;
  season.baselineDraft = null; // Clear draft upon confirmation
  season.updatedAt = now;

  saveSeasonsState(state);

  return {
    success: true,
    baseline: snapshot,
  };
}

/**
 * Discards baseline draft for a season
 */
export function discardBaselineDraft(seasonId: string): { success: boolean; error?: string } {
  const state = loadSeasonsState();
  const season = state.seasons.find((s) => s.id === seasonId);
  if (!season) return { success: false, error: 'Season not found' };

  season.baselineDraft = null;
  season.updatedAt = new Date().toISOString();
  saveSeasonsState(state);
  return { success: true };
}

/**
 * Retrieves initial progress draft for a season
 */
export function getInitialProgressDraft(seasonId: string): SeasonProgressDraft | null {
  const state = loadSeasonsState();
  const season = state.seasons.find((s) => s.id === seasonId);
  if (!season || !season.baseline) return null;

  if (season.progressDraft) {
    return season.progressDraft;
  }

  // Default to values from most recent progress snapshot or baseline
  const reference = season.progressSnapshots && season.progressSnapshots.length > 0
    ? season.progressSnapshots[season.progressSnapshots.length - 1]
    : season.baseline;

  return {
    seasonId,
    recordingDate: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    players: AUTHENTIC_PLAYER_IDS.map((id) => {
      const refP = reference.players.find((p) => p.playerId === id);
      return {
        playerId: id,
        matches: refP ? refP.matches : null,
        goals: refP ? refP.goals : null,
        assists: refP ? refP.assists : null,
      };
    }),
  };
}

/**
 * Saves an in-progress progress snapshot draft
 */
export function saveProgressDraft(
  seasonId: string,
  draft: SeasonProgressDraft
): { success: boolean; error?: string } {
  const state = loadSeasonsState();
  const seasonIndex = state.seasons.findIndex((s) => s.id === seasonId);

  if (seasonIndex < 0) {
    return { success: false, error: `Season "${seasonId}" was not found.` };
  }

  const season = state.seasons[seasonIndex];
  if (!season.baseline) {
    return { success: false, error: 'Cannot record progress without a confirmed baseline.' };
  }

  const sanitizedPlayers: ProgressDraftPlayerEntry[] = [];
  for (const p of draft.players || []) {
    if (AUTHENTIC_PLAYER_IDS.includes(p.playerId)) {
      sanitizedPlayers.push({
        playerId: p.playerId,
        matches: isValidStatValue(p.matches) ? p.matches : null,
        goals: isValidStatValue(p.goals) ? p.goals : null,
        assists: isValidStatValue(p.assists) ? p.assists : null,
      });
    }
  }

  season.progressDraft = {
    seasonId,
    recordingDate: draft.recordingDate || new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    players: sanitizedPlayers,
    notes: draft.notes?.trim() || undefined,
  };
  season.updatedAt = new Date().toISOString();
  saveSeasonsState(state);

  return { success: true };
}

/**
 * Discards progress draft for a season
 */
export function discardProgressDraft(seasonId: string): { success: boolean; error?: string } {
  const state = loadSeasonsState();
  const season = state.seasons.find((s) => s.id === seasonId);
  if (!season) return { success: false, error: 'Season not found' };

  season.progressDraft = null;
  season.updatedAt = new Date().toISOString();
  saveSeasonsState(state);
  return { success: true };
}

/**
 * Calculates deltas and checks for decreases against previous reference
 */
export function calculatePlayerStatDeltas(
  season: Season,
  currentStats: { playerId: string; matches: number; goals: number; assists: number }[],
  playerMetadataMap?: Record<string, { name: string; position: string }>
): {
  deltas: PlayerStatDelta[];
  hasDecreases: boolean;
  decreaseWarnings: string[];
} {
  if (!season.baseline) {
    throw new Error('Cannot calculate deltas without a confirmed baseline.');
  }

  // Determine latest reference snapshot (most recent progress snapshot or baseline)
  const reference = season.progressSnapshots && season.progressSnapshots.length > 0
    ? season.progressSnapshots[season.progressSnapshots.length - 1]
    : season.baseline;

  const deltas: PlayerStatDelta[] = [];
  const decreaseWarnings: string[] = [];
  let hasDecreases = false;

  for (const curr of currentStats) {
    const baselineP = season.baseline.players.find((p) => p.playerId === curr.playerId);
    const refP = reference.players.find((p) => p.playerId === curr.playerId);

    if (!baselineP || !refP) continue;

    const matchesDelta = curr.matches - baselineP.matches;
    const goalsDelta = curr.goals - baselineP.goals;
    const assistsDelta = curr.assists - baselineP.assists;

    const matchesDecreased = curr.matches < refP.matches;
    const goalsDecreased = curr.goals < refP.goals;
    const assistsDecreased = curr.assists < refP.assists;

    const meta = playerMetadataMap?.[curr.playerId] || { name: curr.playerId, position: 'N/A' };

    if (matchesDecreased || goalsDecreased || assistsDecreased) {
      hasDecreases = true;
      const decreasesList: string[] = [];
      if (matchesDecreased) decreasesList.push(`Matches (${refP.matches} → ${curr.matches})`);
      if (goalsDecreased) decreasesList.push(`Goals (${refP.goals} → ${curr.goals})`);
      if (assistsDecreased) decreasesList.push(`Assists (${refP.assists} → ${curr.assists})`);

      decreaseWarnings.push(
        `${meta.name} (${curr.playerId}): ${decreasesList.join(', ')} decreased compared to previous record.`
      );
    }

    deltas.push({
      playerId: curr.playerId,
      playerName: meta.name,
      position: meta.position,
      roleClassification: baselineP.roleClassification,
      baselineMatches: baselineP.matches,
      baselineGoals: baselineP.goals,
      baselineAssists: baselineP.assists,
      currentMatches: curr.matches,
      currentGoals: curr.goals,
      currentAssists: curr.assists,
      matchesDelta,
      goalsDelta,
      assistsDelta,
      matchesDecreased,
      goalsDecreased,
      assistsDecreased,
      referenceMatches: refP.matches,
      referenceGoals: refP.goals,
      referenceAssists: refP.assists,
    });
  }

  return {
    deltas,
    hasDecreases,
    decreaseWarnings,
  };
}

/**
 * Confirms a new progress snapshot (Append-only)
 * Never modifies baseline or previous snapshots.
 * Requires explicit confirmation if decreases are detected.
 */
export function confirmProgressSnapshot(
  seasonId: string,
  snapshotData: {
    recordingDate: string;
    players: ProgressPlayerRecord[];
    notes?: string;
    confirmDecreases?: boolean;
    playerMetadataMap?: Record<string, { name: string; position: string }>;
  }
): {
  success: boolean;
  snapshot?: SeasonProgressSnapshot;
  error?: string;
  decreaseWarnings?: string[];
  errors?: string[];
} {
  const state = loadSeasonsState();
  const seasonIndex = state.seasons.findIndex((s) => s.id === seasonId);

  if (seasonIndex < 0) {
    return { success: false, error: `Season "${seasonId}" was not found.` };
  }

  const season = state.seasons[seasonIndex];
  if (!season.baseline) {
    return { success: false, error: 'Cannot record progress snapshot without a confirmed baseline.' };
  }

  // Validate all 23 players have valid non-negative integer values
  const errors: string[] = [];
  const seenIds = new Set<string>();

  if (!Array.isArray(snapshotData.players) || snapshotData.players.length !== 23) {
    errors.push(`Progress snapshot requires exactly 23 authentic players (received ${snapshotData.players?.length || 0}).`);
  }

  for (const p of snapshotData.players || []) {
    if (!p || typeof p !== 'object') {
      errors.push('Malformed player progress entry.');
      continue;
    }

    if (!p.playerId || !AUTHENTIC_PLAYER_IDS.includes(p.playerId)) {
      errors.push(`Unrecognized player ID in progress: "${p.playerId}".`);
      continue;
    }

    if (seenIds.has(p.playerId)) {
      errors.push(`Duplicate player ID in progress: "${p.playerId}".`);
      continue;
    }
    seenIds.add(p.playerId);

    if (!isValidStatValue(p.matches) || !isValidStatValue(p.goals) || !isValidStatValue(p.assists)) {
      errors.push(`Player ${p.playerId}: All statistics must be valid non-negative integers.`);
    }
  }

  for (const id of AUTHENTIC_PLAYER_IDS) {
    if (!seenIds.has(id)) {
      errors.push(`Missing statistics for authentic player "${id}".`);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: 'All 23 players must have valid non-negative integer cumulative statistics.',
      errors,
    };
  }

  // Delta calculation and decrease check against reference
  const deltaResult = calculatePlayerStatDeltas(
    season,
    snapshotData.players,
    snapshotData.playerMetadataMap
  );

  if (deltaResult.hasDecreases && !snapshotData.confirmDecreases) {
    return {
      success: false,
      error: 'One or more player statistics decreased compared to the previous record. Explicit confirmation is required before proceeding.',
      decreaseWarnings: deltaResult.decreaseWarnings,
    };
  }

  const now = new Date().toISOString();
  const newSnapshot: SeasonProgressSnapshot = {
    id: `snap-${Date.now()}`,
    recordingDate: snapshotData.recordingDate || now.split('T')[0],
    recordedAt: now,
    players: snapshotData.players.map((p) => ({
      playerId: p.playerId,
      matches: p.matches,
      goals: p.goals,
      assists: p.assists,
    })),
    notes: snapshotData.notes?.trim() || undefined,
    hasConfirmedDecreases: Boolean(snapshotData.confirmDecreases && deltaResult.hasDecreases),
  };

  // Append-only: never overwrites baseline or previous snapshots
  if (!season.progressSnapshots) {
    season.progressSnapshots = [];
  }
  season.progressSnapshots.push(newSnapshot);

  // Clear progress draft upon confirmation
  season.progressDraft = null;
  season.updatedAt = now;

  saveSeasonsState(state);

  return {
    success: true,
    snapshot: newSnapshot,
  };
}

// ============================================================================
// MILESTONE 4C1: REWARD ELIGIBILITY & ACQUISITION BUSINESS LOGIC
// ============================================================================

/**
 * Sets or updates the final rank for a season and recomputes reward eligibility.
 * - Rank must be a positive integer (>= 1) or null to reset.
 * - Rejects 0, negative numbers, decimals, non-numbers.
 * - Recomputes eligibility immediately (Rank <= 100,000: 'Eligible', > 100,000: 'Not Eligible').
 * - Preserves existing baseline, progress snapshots, and reward records.
 */
export function setSeasonRank(
  seasonId: string,
  rank: number | null
): {
  success: boolean;
  season?: Season;
  error?: string;
} {
  const state = loadSeasonsState();
  const seasonIndex = state.seasons.findIndex((s) => s.id === seasonId);

  if (seasonIndex < 0) {
    return { success: false, error: `Season "${seasonId}" was not found.` };
  }

  const season = state.seasons[seasonIndex];

  if (rank !== null && !isValidRankValue(rank)) {
    return {
      success: false,
      error: 'Rank must be a positive whole number (1 or greater). Zero, negative, and fractional values are invalid.',
    };
  }

  const eligibility = computeRewardEligibility(rank);
  const now = new Date().toISOString();

  const updatedSeason: Season = {
    ...season,
    finalRank: rank,
    rewardEligibility: eligibility,
    updatedAt: now,
  };

  state.seasons[seasonIndex] = updatedSeason;
  saveSeasonsState(state);

  return {
    success: true,
    season: updatedSeason,
  };
}

/**
 * Records an acquired reward card for a season.
 * - Requires season to be in 'Eligible' status (Rank 1 - 100,000).
 * - Enforces exactly at most ONE reward acquisition per season.
 * - Validates required cardName and valid acquiredDate.
 * - Rejects second acquisitions, preserving existing records.
 */
export function recordSeasonReward(
  seasonId: string,
  acquisitionData: {
    cardName: string;
    cardDescription?: string;
    acquiredDate: string;
    notes?: string;
  }
): {
  success: boolean;
  acquisition?: SeasonRewardAcquisition;
  error?: string;
} {
  const state = loadSeasonsState();
  const seasonIndex = state.seasons.findIndex((s) => s.id === seasonId);

  if (seasonIndex < 0) {
    return { success: false, error: `Season "${seasonId}" was not found.` };
  }

  const season = state.seasons[seasonIndex];

  // 1. Enforce eligibility rule: rank must be Eligible
  if (season.rewardEligibility !== 'Eligible') {
    return {
      success: false,
      error: 'Cannot record reward acquisition: season is not eligible. A verified final rank of 100,000 or better is required.',
    };
  }

  // 2. Enforce one reward per season: reject second acquisition
  if (season.rewardAcquisition) {
    return {
      success: false,
      error: `A reward card ("${season.rewardAcquisition.cardName}") has already been acquired for this season. At most one reward card acquisition is permitted per season.`,
    };
  }

  // 3. Validate required fields
  const cardName = acquisitionData.cardName?.trim();
  if (!cardName) {
    return {
      success: false,
      error: 'Reward player/card name is required.',
    };
  }

  const acquiredDate = acquisitionData.acquiredDate?.trim();
  if (!acquiredDate || isNaN(new Date(acquiredDate).getTime())) {
    return {
      success: false,
      error: 'A valid acquisition date (YYYY-MM-DD) is required.',
    };
  }

  const now = new Date().toISOString();
  const newAcquisition: SeasonRewardAcquisition = {
    id: `rew-${season.id}-${Date.now()}`,
    seasonId: season.id,
    cardName,
    cardDescription: acquisitionData.cardDescription?.trim() || undefined,
    acquiredDate,
    notes: acquisitionData.notes?.trim() || undefined,
    confirmedAt: now,
  };

  season.rewardAcquisition = newAcquisition;
  season.rewardAcquired = true;
  season.updatedAt = now;

  saveSeasonsState(state);

  return {
    success: true,
    acquisition: newAcquisition,
  };
}

/**
 * Retrieves the reward acquisition record for a season, if any
 */
export function getSeasonReward(seasonId: string): SeasonRewardAcquisition | null {
  const season = getSeasonById(seasonId);
  return season?.rewardAcquisition || null;
}

