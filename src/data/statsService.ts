import type {
  PlayerStatsRow,
  SelectableSeasonItem,
  SeasonStatsResult,
  OverallStatsSummary,
  PreviousMonthStatsResult,
  MonthWindow,
  PlayerCard,
} from '../types';
import { getAllPlayers } from './playerRepository';
import {
  getAllSeasons,
  getSeasonById,
} from './seasonRepository';
import {
  getPreviousMonthStats,
  getPreviousMonthWindow,
} from './dashboardService';

// Re-export shared monthly calculations to guarantee single source of truth
export { getPreviousMonthStats, getPreviousMonthWindow };
export type { PreviousMonthStatsResult, MonthWindow };

/**
 * Derives individual and aggregate statistics for the Overall (All-Time) period.
 * Connects directly to authentic overallPerformance data in players.json.
 * Preserves unrecorded/null fields as unavailable (does not convert null to 0).
 * Indicates partial aggregates when records are incomplete.
 */
export function getOverallStats(): {
  players: PlayerStatsRow[];
  summary: OverallStatsSummary;
} {
  const allPlayers = getAllPlayers();

  const playerRows: PlayerStatsRow[] = allPlayers.map((p: PlayerCard) => {
    const op = p.overallPerformance;

    const matches =
      typeof op?.matchesPlayed === 'number' &&
      Number.isInteger(op.matchesPlayed) &&
      op.matchesPlayed >= 0
        ? op.matchesPlayed
        : null;

    const goals =
      typeof op?.goals === 'number' && Number.isInteger(op.goals) && op.goals >= 0
        ? op.goals
        : null;

    const assists =
      typeof op?.assists === 'number' && Number.isInteger(op.assists) && op.assists >= 0
        ? op.assists
        : null;

    // Goal contributions: computed as goals + assists only when both values are known
    let goalContributions: number | null = null;
    if (goals !== null && assists !== null) {
      goalContributions = goals + assists;
    } else if (typeof op?.goalContributions === 'number') {
      goalContributions = op.goalContributions;
    }

    // Per-match rates: computed only when numerator and matches are known and matches > 0
    let goalsPerMatch: number | null = null;
    if (goals !== null && matches !== null && matches > 0) {
      goalsPerMatch =
        typeof op?.goalsPerMatch === 'number'
          ? op.goalsPerMatch
          : Number((goals / matches).toFixed(2));
    }

    let assistsPerMatch: number | null = null;
    if (assists !== null && matches !== null && matches > 0) {
      assistsPerMatch =
        typeof op?.assistsPerMatch === 'number'
          ? op.assistsPerMatch
          : Number((assists / matches).toFixed(2));
    }

    const isUnavailable = matches === null && goals === null && assists === null;

    return {
      playerId: p.id,
      playerName: p.name,
      cardName: p.cardName,
      overallRating: p.overallRating,
      primaryPosition: p.primaryPosition,
      imageUrl: p.imageUrl,
      matches,
      goals,
      assists,
      goalContributions,
      goalsPerMatch,
      assistsPerMatch,
      isUnavailable,
    };
  });

  // Calculate aggregates across known values
  let totalMatches = 0;
  let totalGoals = 0;
  let totalAssists = 0;
  let totalGoalContributions = 0;
  let recordedPlayersCount = 0;

  for (const r of playerRows) {
    const hasAnyKnown = r.matches !== null || r.goals !== null || r.assists !== null;
    if (hasAnyKnown) {
      recordedPlayersCount++;
      if (r.matches !== null) totalMatches += r.matches;
      if (r.goals !== null) totalGoals += r.goals;
      if (r.assists !== null) totalAssists += r.assists;
      if (r.goalContributions !== null) totalGoalContributions += r.goalContributions;
    }
  }

  const isPartial = recordedPlayersCount < playerRows.length;
  const missingCount = playerRows.length - recordedPlayersCount;
  const notes = isPartial
    ? `Partial aggregate (${recordedPlayersCount} of ${playerRows.length} player cards recorded · ${missingCount} card${missingCount === 1 ? '' : 's'} unavailable)`
    : `Complete aggregate across all ${playerRows.length} player cards`;

  return {
    players: playerRows,
    summary: {
      totalMatches,
      totalGoals,
      totalAssists,
      totalGoalContributions,
      recordedPlayersCount,
      totalPlayersCount: playerRows.length,
      isPartial,
      notes,
    },
  };
}

/**
 * Season Ordering Rule for Last 5 Seasons Selector:
 * 1. Only relevant confirmed seasons (status === 'Active' or 'Closed') are included; unactivated 'Draft' seasons are excluded because they contain no confirmed statistics.
 * 2. Active seasons are placed first (as they represent the current, ongoing campaign).
 * 3. Closed seasons follow, ordered newest first by closure date / closedAt timestamp (or closureSnapshot.closedAt). If closure dates are equal or unavailable, seasons are ordered by startDate descending, then createdAt descending, and finally by season ID descending.
 * 4. At most 5 seasons are returned. If fewer than 5 exist, only the existing seasons are returned without fabricating historical entries.
 */
export function getSelectableRecentSeasons(limit: number = 5): SelectableSeasonItem[] {
  const allSeasons = getAllSeasons();

  // Exclude unactivated draft seasons
  const relevantSeasons = allSeasons.filter(
    (s) => s.status === 'Active' || s.status === 'Closed'
  );

  relevantSeasons.sort((a, b) => {
    // 1. Active seasons first
    if (a.status === 'Active' && b.status !== 'Active') return -1;
    if (a.status !== 'Active' && b.status === 'Active') return 1;

    // 2. Closed seasons sorted newest first by closure date / closedAt
    if (a.status === 'Closed' && b.status === 'Closed') {
      const dateA = a.closureSnapshot?.closedAt || a.closedAt || a.updatedAt;
      const dateB = b.closureSnapshot?.closedAt || b.closedAt || b.updatedAt;
      const cmp = dateB.localeCompare(dateA);
      if (cmp !== 0) return cmp;
    }

    // 3. Fall back to startDate descending
    const startCmp = (b.startDate || '').localeCompare(a.startDate || '');
    if (startCmp !== 0) return startCmp;

    // 4. Fall back to createdAt descending
    const createdCmp = (b.createdAt || '').localeCompare(a.createdAt || '');
    if (createdCmp !== 0) return createdCmp;

    // 5. Tie breaker by ID
    return b.id.localeCompare(a.id);
  });

  const selected = relevantSeasons.slice(0, limit);

  return selected.map((s) => {
    const snap = s.closureSnapshot;
    const divSnaps = snap?.divisionProgressSnapshots || s.divisionProgressSnapshots || [];
    const latestDiv = divSnaps.length > 0 ? divSnaps[divSnaps.length - 1] : null;

    const progressSnaps = snap?.progressSnapshots || s.progressSnapshots || [];
    const hasConfirmedBaseline = Boolean(snap?.baseline || s.baseline);
    const hasConfirmedProgress = progressSnaps.length > 0;
    const snapshotCount = progressSnaps.length;
    const latestSnapshotDate =
      snapshotCount > 0 ? progressSnaps[snapshotCount - 1].recordingDate : undefined;

    const closedDate =
      snap?.closedDate || (s.closedAt ? s.closedAt.split('T')[0] : undefined);

    const finalRank = snap?.finalRank ?? s.finalRank ?? latestDiv?.rank ?? null;
    const finalDivision = latestDiv?.division ?? null;

    return {
      id: s.id,
      status: s.status as 'Active' | 'Closed',
      startDate: snap?.metadata.startDate || s.startDate,
      closedDate,
      startingDivision: snap?.metadata.startingDivision ?? s.startingDivision,
      finalDivision,
      finalRank,
      hasConfirmedBaseline,
      hasConfirmedProgress,
      snapshotCount,
      latestSnapshotDate,
      closureSnapshotId: snap?.id,
      closureNotes: snap?.closureNotes || s.closureNotes,
    };
  });
}

/**
 * Computes individual player statistics and deltas for a specific selectable season.
 * - Active seasons: uses confirmed baseline and latest confirmed progress snapshot.
 * - Closed seasons: uses immutable closureSnapshot as the source of truth.
 * - If no progress snapshots exist, does not invent deltas (returns hasConfirmedProgress: false).
 * - Preserves baseline Starting XI / Substitute classification.
 * - Preserves negative deltas resulting from verified source corrections (never clamps to 0).
 * - Each player card ID contributes at most once (no duplicate counting).
 */
export function getSeasonPlayerStats(seasonId: string): SeasonStatsResult | null {
  const season = getSeasonById(seasonId);
  if (!season || season.status === 'Draft') {
    return null;
  }

  const allPlayers = getAllPlayers();
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

  const selectableList = getSelectableRecentSeasons(50);
  const selectableItem =
    selectableList.find((s) => s.id === season.id) || {
      id: season.id,
      status: season.status as 'Active' | 'Closed',
      startDate: season.startDate,
      startingDivision: season.startingDivision,
      hasConfirmedBaseline: Boolean(season.baseline),
      hasConfirmedProgress: (season.progressSnapshots || []).length > 0,
      snapshotCount: (season.progressSnapshots || []).length,
    };

  // 1. Closed seasons: source of truth is immutable closureSnapshot
  if (season.status === 'Closed') {
    const snap = season.closureSnapshot;
    if (!snap) {
      // In case of legacy closed season without closureSnapshot, fallback to season confirmed data
      return getActiveOrLegacySeasonStats(season, selectableItem, playerMap);
    }

    const baseline = snap.baseline;
    const progressSnaps = snap.progressSnapshots || [];

    if (progressSnaps.length === 0) {
      return {
        season: selectableItem,
        hasConfirmedProgress: false,
        players: [],
        totalMatchesDelta: null,
        totalGoalsDelta: null,
        totalAssistsDelta: null,
        totalGoalContributions: null,
        notes:
          'This season was closed with baseline statistics only. No progress snapshots were recorded prior to closure.',
      };
    }

    const latest = progressSnaps[progressSnaps.length - 1];
    return computePlayerDeltasForSeason(
      selectableItem,
      baseline.players,
      latest.players,
      playerMap,
      snap.closureNotes
    );
  }

  // 2. Active seasons: confirmed baseline & latest confirmed progress snapshot
  return getActiveOrLegacySeasonStats(season, selectableItem, playerMap);
}

function getActiveOrLegacySeasonStats(
  season: NonNullable<ReturnType<typeof getSeasonById>>,
  selectableItem: SelectableSeasonItem,
  playerMap: Map<string, PlayerCard>
): SeasonStatsResult {
  const baseline = season.baseline;
  const progressSnaps = season.progressSnapshots || [];

  if (!baseline) {
    return {
      season: selectableItem,
      hasConfirmedProgress: false,
      players: [],
      totalMatchesDelta: null,
      totalGoalsDelta: null,
      totalAssistsDelta: null,
      totalGoalContributions: null,
      notes:
        'Season does not have a confirmed baseline. Baseline confirmation is required before statistics can be calculated.',
    };
  }

  if (progressSnaps.length === 0) {
    return {
      season: selectableItem,
      hasConfirmedProgress: false,
      players: [],
      totalMatchesDelta: null,
      totalGoalsDelta: null,
      totalAssistsDelta: null,
      totalGoalContributions: null,
      notes:
        'No confirmed progress snapshots have been recorded for this season yet. Season statistics will be calculated once progress updates are confirmed.',
    };
  }

  const latest = progressSnaps[progressSnaps.length - 1];
  return computePlayerDeltasForSeason(
    selectableItem,
    baseline.players,
    latest.players,
    playerMap,
    season.notes
  );
}

function computePlayerDeltasForSeason(
  selectableItem: SelectableSeasonItem,
  baselinePlayers: {
    playerId: string;
    roleClassification: 'Starting XI' | 'Substitute';
    matches: number;
    goals: number;
    assists: number;
  }[],
  latestPlayers: {
    playerId: string;
    matches: number;
    goals: number;
    assists: number;
  }[],
  playerMap: Map<string, PlayerCard>,
  notes?: string
): SeasonStatsResult {
  const latestMap = new Map(latestPlayers.map((p) => [p.playerId, p]));
  const seenPlayerIds = new Set<string>();

  const rows: PlayerStatsRow[] = [];
  let totalMatchesDelta = 0;
  let totalGoalsDelta = 0;
  let totalAssistsDelta = 0;
  let totalGoalContributions = 0;

  for (const base of baselinePlayers) {
    if (seenPlayerIds.has(base.playerId)) {
      continue; // Guarantee each player card ID contributes at most once
    }
    seenPlayerIds.add(base.playerId);

    const p = playerMap.get(base.playerId);
    const cur = latestMap.get(base.playerId);

    if (!cur) {
      rows.push({
        playerId: base.playerId,
        playerName: p?.name || base.playerId,
        cardName: p?.cardName || null,
        overallRating: p?.overallRating || null,
        primaryPosition: p?.primaryPosition || 'N/A',
        imageUrl: p?.imageUrl || null,
        roleClassification: base.roleClassification,
        matches: null,
        goals: null,
        assists: null,
        goalContributions: null,
        goalsPerMatch: null,
        assistsPerMatch: null,
        isUnavailable: true,
      });
      continue;
    }

    // Preserve actual deltas including negative corrections (never clamp silently to 0)
    const matchesDelta = cur.matches - base.matches;
    const goalsDelta = cur.goals - base.goals;
    const assistsDelta = cur.assists - base.assists;
    const goalContributions = goalsDelta + assistsDelta;

    totalMatchesDelta += matchesDelta;
    totalGoalsDelta += goalsDelta;
    totalAssistsDelta += assistsDelta;
    totalGoalContributions += goalContributions;

    const goalsPerMatch =
      matchesDelta > 0 ? Number((goalsDelta / matchesDelta).toFixed(2)) : null;
    const assistsPerMatch =
      matchesDelta > 0 ? Number((assistsDelta / matchesDelta).toFixed(2)) : null;

    rows.push({
      playerId: base.playerId,
      playerName: p?.name || base.playerId,
      cardName: p?.cardName || null,
      overallRating: p?.overallRating || null,
      primaryPosition: p?.primaryPosition || 'N/A',
      imageUrl: p?.imageUrl || null,
      roleClassification: base.roleClassification,
      matches: matchesDelta,
      goals: goalsDelta,
      assists: assistsDelta,
      goalContributions,
      goalsPerMatch,
      assistsPerMatch,
      isUnavailable: false,
    });
  }

  return {
    season: selectableItem,
    hasConfirmedProgress: true,
    players: rows,
    totalMatchesDelta,
    totalGoalsDelta,
    totalAssistsDelta,
    totalGoalContributions,
    notes,
  };
}
