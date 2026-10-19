import type {
  DashboardKPIs,
  TopPerformerItem,
  ClosedSeasonHistoryItem,
  DivisionProgressSnapshot,
  DivisionProgressInput,
  Season,
  SeasonProgressSnapshot,
} from '../types';
import {
  getAllSeasons,
  getLatestDivisionProgress,
  recordDivisionProgress,
  REWARD_RANK_THRESHOLD,
} from './seasonRepository';
import { getAllPlayers } from './playerRepository';

/**
 * Returns the currently active season, if any
 */
export function getActiveSeason(): Season | null {
  const seasons = getAllSeasons();
  return seasons.find((s) => s.status === 'Active') || null;
}

/**
 * Derives live KPI statistics for the Dashboard view.
 * Connects directly to confirmed active season division-progress records.
 * Renders authentic empty / unknown states when data is missing or unrecorded (no fabricated 0s).
 */
export function getDashboardKPIs(): DashboardKPIs {
  const seasons = getAllSeasons();
  const activeSeason = seasons.find((s) => s.status === 'Active');

  if (!activeSeason) {
    return {
      hasActiveSeason: false,
      activeSeasonId: undefined,
      division: null,
      divisionDisplay: '—',
      divisionSubtitle: 'No active season',
      points: null,
      pointsDisplay: '—',
      pointsSubtitle: 'No active season',
      rank: null,
      rankDisplay: '—',
      rankSubtitle: 'Top 100k qualifies',
      wins: null,
      draws: null,
      losses: null,
      matches: null,
      recordDisplay: '—',
      recordSubtitle: 'Wins • Draws • Losses',
      winRate: null,
      winRateDisplay: '—%',
      winRateSubtitle: 'No matches recorded',
      rewardStatus: '—',
      rewardSubtitle: 'No active season',
      rewardColor: 'default',
      isRewardEligible: false,
    };
  }

  const latestDiv = getLatestDivisionProgress(activeSeason.id);

  // Division
  let division: number | null = null;
  let divisionDisplay = '—';
  let divisionSubtitle = 'Active Season';

  if (latestDiv) {
    division = latestDiv.division;
    divisionDisplay = `Div ${latestDiv.division}`;
    divisionSubtitle = 'Current Standing';
  } else if (activeSeason.startingDivision) {
    division = activeSeason.startingDivision;
    divisionDisplay = `Div ${activeSeason.startingDivision}`;
    divisionSubtitle = 'Starting Division (Active)';
  }

  // Points
  let points: number | null = null;
  let pointsDisplay = '—';
  let pointsSubtitle = 'Unrecorded';

  if (latestDiv) {
    points = latestDiv.points;
    pointsDisplay = latestDiv.points.toLocaleString();
    pointsSubtitle = 'Season points';
  }

  // Rank
  const rank = latestDiv?.rank ?? activeSeason.finalRank ?? null;
  let rankDisplay = '—';
  let rankSubtitle = 'Top 100k qualifies';
  let isRewardEligible = false;

  if (rank !== null && rank !== undefined) {
    rankDisplay = `#${rank.toLocaleString()}`;
    if (rank <= REWARD_RANK_THRESHOLD) {
      rankSubtitle = 'Eligible (Top 100k)';
      isRewardEligible = true;
    } else {
      rankSubtitle = 'Not Eligible';
      isRewardEligible = false;
    }
  }

  // Record (W - D - L) & Win Rate
  let wins: number | null = null;
  let draws: number | null = null;
  let losses: number | null = null;
  let matches: number | null = null;
  let recordDisplay = '—';
  let recordSubtitle = 'Unrecorded';
  let winRate: number | null = null;
  let winRateDisplay = '—%';
  let winRateSubtitle = 'No matches recorded';

  if (latestDiv) {
    wins = latestDiv.wins;
    draws = latestDiv.draws;
    losses = latestDiv.losses;
    matches = latestDiv.matches;
    recordDisplay = `${wins} - ${draws} - ${losses}`;
    recordSubtitle = `${matches} match${matches === 1 ? '' : 'es'} completed`;

    winRate = latestDiv.winRate;
    if (matches > 0) {
      const pct = latestDiv.winRate * 100;
      winRateDisplay = Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
      winRateSubtitle = `${wins} win${wins === 1 ? '' : 's'} of ${matches}`;
    } else {
      winRateDisplay = '0%';
      winRateSubtitle = '0 matches completed';
    }
  }

  // Reward Status
  let rewardStatus = 'Pending';
  let rewardSubtitle = 'Rank unconfirmed';
  let rewardColor: 'lime' | 'blue' | 'purple' | 'default' = 'blue';

  if (activeSeason.rewardAcquisition) {
    rewardStatus = 'Acquired';
    rewardSubtitle = activeSeason.rewardAcquisition.cardName;
    rewardColor = 'purple';
  } else if (activeSeason.rewardEligibility === 'Eligible' || isRewardEligible) {
    rewardStatus = 'Eligible';
    rewardSubtitle = 'Top 100k qualifies';
    rewardColor = 'lime';
  } else if (activeSeason.rewardEligibility === 'Not Eligible') {
    rewardStatus = 'Not Eligible';
    rewardSubtitle = 'Rank > 100k';
    rewardColor = 'default';
  }

  return {
    hasActiveSeason: true,
    activeSeasonId: activeSeason.id,
    division,
    divisionDisplay,
    divisionSubtitle,
    points,
    pointsDisplay,
    pointsSubtitle,
    rank,
    rankDisplay,
    rankSubtitle,
    wins,
    draws,
    losses,
    matches,
    recordDisplay,
    recordSubtitle,
    winRate,
    winRateDisplay,
    winRateSubtitle,
    rewardStatus,
    rewardSubtitle,
    rewardColor,
    isRewardEligible,
  };
}

/**
 * Computes Top Performers for the Overall (All-Time) period from authentic players.json data.
 * Displays matches, goals, assists, goal contributions, and per-match rates.
 */
export function getOverallTopPerformers(limit: number = 5): TopPerformerItem[] {
  const players = getAllPlayers();

  const scored = players.map((p) => {
    const op = p.overallPerformance;
    const hasStats =
      op &&
      (op.goalContributions !== null ||
        op.goals !== null ||
        op.assists !== null ||
        op.matchesPlayed !== null);

    return {
      playerId: p.id,
      playerName: p.name,
      cardName: p.cardName,
      primaryPosition: p.primaryPosition,
      imageUrl: p.imageUrl,
      matches: op?.matchesPlayed ?? null,
      goals: op?.goals ?? null,
      assists: op?.assists ?? null,
      goalContributions: op?.goalContributions ?? null,
      goalsPerMatch: op?.goalsPerMatch ?? null,
      assistsPerMatch: op?.assistsPerMatch ?? null,
      hasStats,
    };
  });

  scored.sort((a, b) => {
    if (a.hasStats && !b.hasStats) return -1;
    if (!a.hasStats && b.hasStats) return 1;
    if (!a.hasStats && !b.hasStats) return 0;

    const contribA = a.goalContributions ?? 0;
    const contribB = b.goalContributions ?? 0;
    if (contribB !== contribA) return contribB - contribA;

    const goalsA = a.goals ?? 0;
    const goalsB = b.goals ?? 0;
    if (goalsB !== goalsA) return goalsB - goalsA;

    const assistsA = a.assists ?? 0;
    const assistsB = b.assists ?? 0;
    if (assistsB !== assistsA) return assistsB - assistsA;

    const matchesA = a.matches ?? 0;
    const matchesB = b.matches ?? 0;
    return matchesB - matchesA;
  });

  return scored.slice(0, limit).map((p, idx) => ({
    rank: idx + 1,
    playerId: p.playerId,
    playerName: p.playerName,
    cardName: p.cardName,
    primaryPosition: p.primaryPosition,
    imageUrl: p.imageUrl,
    matches: p.matches,
    goals: p.goals,
    assists: p.assists,
    goalContributions: p.goalContributions,
    goalsPerMatch: p.goalsPerMatch,
    assistsPerMatch: p.assistsPerMatch,
  }));
}

/**
 * Computes Top Performers for the Previous Month period.
 * Derives statistics exclusively from confirmed progress snapshots recorded in that calendar month.
 * If no snapshots exist for the previous month, returns an empty array.
 * NEVER falls back to all-time totals as previous-month totals.
 */
export function getPreviousMonthTopPerformers(
  referenceDate: Date = new Date(),
  limit: number = 5
): TopPerformerItem[] {
  const ref = new Date(referenceDate);
  const prevMonthDate = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth() + 1; // 1-12
  const monthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const startStr = `${monthStr}-01`;
  const lastDay = new Date(prevYear, prevMonth, 0).getDate();
  const endStr = `${monthStr}-${String(lastDay).padStart(2, '0')}`;

  const seasons = getAllSeasons();
  interface SnapshotEntry {
    season: Season;
    snapshot: SeasonProgressSnapshot;
  }
  const prevMonthSnapshots: SnapshotEntry[] = [];

  for (const season of seasons) {
    const snaps = season.progressSnapshots || [];
    for (const snap of snaps) {
      if (snap.recordingDate >= startStr && snap.recordingDate <= endStr) {
        prevMonthSnapshots.push({ season, snapshot: snap });
      }
    }
  }

  // If no snapshots were recorded in the previous month, return empty list (do not fallback!)
  if (prevMonthSnapshots.length === 0) {
    return [];
  }

  const players = getAllPlayers();
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const bySeason = new Map<string, { season: Season; snaps: SeasonProgressSnapshot[] }>();
  for (const entry of prevMonthSnapshots) {
    if (!bySeason.has(entry.season.id)) {
      bySeason.set(entry.season.id, { season: entry.season, snaps: [] });
    }
    bySeason.get(entry.season.id)!.snaps.push(entry.snapshot);
  }

  const playerDeltas = new Map<
    string,
    { matches: number; goals: number; assists: number; contributions: number }
  >();

  for (const { season, snaps } of bySeason.values()) {
    snaps.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    const latestInMonth = snaps[snaps.length - 1];

    const priorSnaps = (season.progressSnapshots || []).filter(
      (s) => s.recordingDate < startStr
    );
    let basePlayers: { playerId: string; matches: number; goals: number; assists: number }[] = [];

    if (priorSnaps.length > 0) {
      priorSnaps.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
      basePlayers = priorSnaps[priorSnaps.length - 1].players;
    } else if (season.baseline) {
      basePlayers = season.baseline.players;
    }

    const baseMap = new Map(basePlayers.map((p) => [p.playerId, p]));

    for (const cur of latestInMonth.players) {
      const base = baseMap.get(cur.playerId);
      const matchesDelta = base ? Math.max(0, cur.matches - base.matches) : cur.matches;
      const goalsDelta = base ? Math.max(0, cur.goals - base.goals) : cur.goals;
      const assistsDelta = base ? Math.max(0, cur.assists - base.assists) : cur.assists;
      const contributions = goalsDelta + assistsDelta;

      const existing = playerDeltas.get(cur.playerId) || {
        matches: 0,
        goals: 0,
        assists: 0,
        contributions: 0,
      };
      playerDeltas.set(cur.playerId, {
        matches: existing.matches + matchesDelta,
        goals: existing.goals + goalsDelta,
        assists: existing.assists + assistsDelta,
        contributions: existing.contributions + contributions,
      });
    }
  }

  const results: TopPerformerItem[] = [];
  for (const [playerId, delta] of playerDeltas.entries()) {
    if (delta.matches > 0 || delta.contributions > 0) {
      const p = playerMap.get(playerId);
      const gpm = delta.matches > 0 ? Number((delta.goals / delta.matches).toFixed(2)) : 0;
      const apm = delta.matches > 0 ? Number((delta.assists / delta.matches).toFixed(2)) : 0;

      results.push({
        rank: 0,
        playerId,
        playerName: p?.name || playerId,
        cardName: p?.cardName || null,
        primaryPosition: p?.primaryPosition || 'N/A',
        imageUrl: p?.imageUrl || null,
        matches: delta.matches,
        goals: delta.goals,
        assists: delta.assists,
        goalContributions: delta.contributions,
        goalsPerMatch: gpm,
        assistsPerMatch: apm,
      });
    }
  }

  results.sort((a, b) => {
    const contribDiff = (b.goalContributions ?? 0) - (a.goalContributions ?? 0);
    if (contribDiff !== 0) return contribDiff;
    const goalsDiff = (b.goals ?? 0) - (a.goals ?? 0);
    if (goalsDiff !== 0) return goalsDiff;
    const assistsDiff = (b.assists ?? 0) - (a.assists ?? 0);
    if (assistsDiff !== 0) return assistsDiff;
    return (b.matches ?? 0) - (a.matches ?? 0);
  });

  return results.slice(0, limit).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

/**
 * Returns historical closed seasons and their closure snapshots for the Division History section.
 */
export function getClosedSeasonHistory(): ClosedSeasonHistoryItem[] {
  const seasons = getAllSeasons();
  const closedSeasons = seasons.filter((s) => s.status === 'Closed');

  closedSeasons.sort((a, b) => {
    const dateA = a.closedAt || a.closureSnapshot?.closedAt || a.updatedAt;
    const dateB = b.closedAt || b.closureSnapshot?.closedAt || b.updatedAt;
    return dateB.localeCompare(dateA);
  });

  return closedSeasons.map((season) => {
    const snap = season.closureSnapshot;
    const divSnaps = snap?.divisionProgressSnapshots || season.divisionProgressSnapshots || [];
    const latestDiv = divSnaps.length > 0 ? divSnaps[divSnaps.length - 1] : null;

    const startDate = snap?.metadata.startDate || season.startDate;
    const closedDate = snap?.closedDate || (season.closedAt ? season.closedAt.split('T')[0] : '—');
    const startingDivision = snap?.metadata.startingDivision ?? season.startingDivision;
    const finalDivision = latestDiv?.division ?? startingDivision;
    const points = latestDiv?.points ?? null;
    const finalRank = snap?.finalRank ?? season.finalRank ?? null;

    let record = '—';
    let wins: number | null = null;
    let draws: number | null = null;
    let losses: number | null = null;
    let matches: number | null = null;
    let winRate = '—%';

    if (latestDiv) {
      wins = latestDiv.wins;
      draws = latestDiv.draws;
      losses = latestDiv.losses;
      matches = latestDiv.matches;
      record = `${wins} - ${draws} - ${losses}`;

      if (matches > 0) {
        const pct = latestDiv.winRate * 100;
        winRate = Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
      } else {
        winRate = '0%';
      }
    }

    const totalMatchesDelta = snap?.statsSummary.totalMatchesDelta ?? 0;
    const totalGoalsDelta = snap?.statsSummary.totalGoalsDelta ?? 0;
    const totalAssistsDelta = snap?.statsSummary.totalAssistsDelta ?? 0;

    let rewardStatus = 'Not Eligible';
    let rewardCardName: string | undefined;

    if (snap?.rewardAcquisition || season.rewardAcquisition) {
      const rew = snap?.rewardAcquisition || season.rewardAcquisition;
      rewardStatus = 'Acquired';
      rewardCardName = rew?.cardName;
    } else if (
      snap?.rewardEligibility === 'Eligible' ||
      season.rewardEligibility === 'Eligible' ||
      (finalRank !== null && finalRank <= REWARD_RANK_THRESHOLD)
    ) {
      rewardStatus = 'Eligible';
    } else if (finalRank === null) {
      rewardStatus = 'Eligibility Unknown';
    }

    return {
      id: season.id,
      startDate,
      closedDate,
      startingDivision,
      finalDivision,
      points,
      finalRank,
      record,
      wins,
      draws,
      losses,
      matches,
      winRate,
      totalMatchesDelta,
      totalGoalsDelta,
      totalAssistsDelta,
      rewardStatus,
      rewardCardName,
      closureNotes: snap?.closureNotes || season.closureNotes,
    };
  });
}

/**
 * Records a division-progress snapshot for the active season.
 */
export function recordActiveDivisionProgress(
  input: Omit<DivisionProgressInput, 'seasonId'> & { seasonId?: string }
): {
  success: boolean;
  snapshot?: DivisionProgressSnapshot;
  season?: Season;
  error?: string;
} {
  let targetSeasonId = input.seasonId;
  if (!targetSeasonId) {
    const active = getActiveSeason();
    if (!active) {
      return {
        success: false,
        error: 'No Active season found. Create or activate a season before recording division progress.',
      };
    }
    targetSeasonId = active.id;
  }

  return recordDivisionProgress({
    ...input,
    seasonId: targetSeasonId,
  });
}
