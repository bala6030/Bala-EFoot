import type {
  Season,
  SeasonDraftInput,
  SeasonsState,
  SeasonValidationResult,
  SeasonStatus,
} from '../types';

export const SEASONS_STORAGE_KEY = 'bala_efoot_seasons_v1';

export const DEFAULT_SEASONS_STATE: SeasonsState = {
  version: 1,
  seasons: [],
  activeDraftId: null,
};

/**
 * Validates whether a value is a valid SeasonStatus
 */
function isValidSeasonStatus(status: unknown): status is SeasonStatus {
  return status === 'Draft' || status === 'Active' || status === 'Closed';
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

  return {
    id,
    startDate,
    startingDivision,
    notes,
    status,
    createdAt,
    updatedAt,
    baselineSnapshot: candidate.baselineSnapshot,
    progressSnapshots: Array.isArray(candidate.progressSnapshots)
      ? candidate.progressSnapshots
      : undefined,
    rewardEligibility: candidate.rewardEligibility,
    rewardAcquired: candidate.rewardAcquired,
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
 *
 * @param draft Input form values
 * @param isActivating Whether this validation is for explicit activation (stricter checks)
 * @param existingSeasons List of seasons already saved
 * @param currentId ID of the season currently being edited (if updating an existing draft)
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
    // Check if any season is in Draft status
    return state.seasons.find((s) => s.status === 'Draft');
  }
  return state.seasons.find((s) => s.id === state.activeDraftId);
}

/**
 * Saves or updates a season draft
 * Preserves existing seasons and rejects duplicate identifiers.
 * Never silently activates the season.
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
 * Requires full validation (required identifier, start date, starting division).
 * Prevents duplicate identifiers and protects closed seasons.
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

  // Full validation for activation
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

  // Clear active draft if it was this season
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
