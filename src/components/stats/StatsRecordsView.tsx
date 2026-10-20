import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  CalendarDays,
  History,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
  Target,
  Share2,
  Users,
  Trophy,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import {
  getOverallStats,
  getPreviousMonthStats,
  getSelectableRecentSeasons,
  getSeasonPlayerStats,
} from '../../data/statsService';
import type {
  StatsPeriodTab,
  PlayerStatsRow,
  SelectableSeasonItem,
  SeasonStatsResult,
  OverallStatsSummary,
  PreviousMonthStatsResult,
} from '../../types';
import styles from './StatsRecordsView.module.css';

export interface StatsRecordsViewProps {
  onSelectPlayer?: (playerId: string) => void;
  onNavigateToSeasons?: () => void;
}

type SortField = 'matches' | 'goals' | 'assists' | 'goalContributions';
type SortDirection = 'asc' | 'desc';

export const StatsRecordsView: React.FC<StatsRecordsViewProps> = ({
  onSelectPlayer,
  onNavigateToSeasons,
}) => {
  const [currentTab, setCurrentTab] = useState<StatsPeriodTab>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('goalContributions');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Overall State
  const [overallData, setOverallData] = useState<{
    players: PlayerStatsRow[];
    summary: OverallStatsSummary;
  } | null>(null);

  // Previous Month State
  const [prevMonthData, setPrevMonthData] = useState<PreviousMonthStatsResult | null>(null);

  // Seasons State
  const [selectableSeasons, setSelectableSeasons] = useState<SelectableSeasonItem[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [seasonStats, setSeasonStats] = useState<SeasonStatsResult | null>(null);

  // Initial Data Loading
  useEffect(() => {
    // 1. Overall
    setOverallData(getOverallStats());

    // 2. Previous Month
    setPrevMonthData(getPreviousMonthStats(new Date()));

    // 3. Selectable Seasons (Last 5)
    const recent = getSelectableRecentSeasons(5);
    setSelectableSeasons(recent);
    if (recent.length > 0) {
      setSelectedSeasonId(recent[0].id);
    }
  }, []);

  // Update selected season stats when selectedSeasonId changes
  useEffect(() => {
    if (selectedSeasonId) {
      setSeasonStats(getSeasonPlayerStats(selectedSeasonId));
    } else {
      setSeasonStats(null);
    }
  }, [selectedSeasonId]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Determine current active rows based on tab
  const rawRows: PlayerStatsRow[] = useMemo(() => {
    if (currentTab === 'overall') {
      return overallData?.players || [];
    }
    if (currentTab === 'previous-month') {
      return prevMonthData?.allPlayerRows || [];
    }
    if (currentTab === 'seasons') {
      return seasonStats?.players || [];
    }
    return [];
  }, [currentTab, overallData, prevMonthData, seasonStats]);

  // Filter and Sort Rows
  const displayedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = rawRows.filter((r) => {
      if (!q) return true;
      const matchName = r.playerName.toLowerCase().includes(q);
      const matchCard = r.cardName?.toLowerCase().includes(q);
      const matchId = r.playerId.toLowerCase().includes(q);
      return matchName || matchCard || matchId;
    });

    return filtered.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      // Keep unavailable (null) values at bottom
      if (valA === null && valB !== null) return 1;
      if (valA !== null && valB === null) return -1;
      if (valA === null && valB === null) return a.playerId.localeCompare(b.playerId);

      const diff = (valA as number) - (valB as number);
      if (diff !== 0) {
        return sortDirection === 'desc' ? -diff : diff;
      }

      // Tie breaker by goals desc, then assists desc, then ID
      const goalsDiff = (b.goals ?? 0) - (a.goals ?? 0);
      if (goalsDiff !== 0) return goalsDiff;

      return a.playerId.localeCompare(b.playerId);
    });
  }, [rawRows, searchQuery, sortField, sortDirection]);

  // Position Styling Helper
  const getPosClass = (pos: string) => {
    const p = pos.toUpperCase();
    if (['CF', 'SS', 'LWF', 'RWF'].includes(p)) return styles.posFWD;
    if (['AMF', 'LMF', 'RMF', 'CMF', 'DMF'].includes(p)) return styles.posMID;
    if (['CB', 'LB', 'RB'].includes(p)) return styles.posDEF;
    if (p === 'GK') return styles.posGK;
    return styles.posMID;
  };

  // Delta Pill Helper
  const renderDelta = (val: number | null, isContribution: boolean = false) => {
    if (val === null) {
      return <span className={styles.unavailableStat}>—</span>;
    }
    if (val > 0) {
      return (
        <span
          className={`${styles.deltaPositive} ${
            isContribution ? styles.highlightCol : ''
          }`}
        >
          +{val}
        </span>
      );
    }
    if (val < 0) {
      return <span className={styles.deltaNegative}>{val}</span>;
    }
    return <span className={styles.deltaZero}>0</span>;
  };

  // Rate Formatter
  const renderRate = (val: number | null) => {
    if (val === null) {
      return <span className={styles.unavailableStat}>—</span>;
    }
    return val.toFixed(2);
  };

  return (
    <div className={styles.statsView}>
      {/* ── Top Header & Tab Navigation ─────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <h1 className={styles.heading}>
            <BarChart3 size={28} className="text-neon-lime" />
            <span>Stats & Records</span>
          </h1>
          <p className={styles.subheading}>
            Authentic player metrics, monthly progress, and 5-season historical deltas
          </p>
        </div>

        {/* Primary Period Navigation: overall, previous-month, and seasons */}
        <nav
          className={styles.periodNav}
          role="tablist"
          aria-label="Statistics time period selector"
        >
          <button
            role="tab"
            aria-selected={currentTab === 'overall'}
            className={`${styles.periodTab} ${
              currentTab === 'overall'
                ? `${styles.periodTabActive} ${styles.periodTabActiveLime}`
                : ''
            }`}
            onClick={() => setCurrentTab('overall')}
          >
            <Flame size={16} />
            <span>Overall (All-Time)</span>
          </button>

          <button
            role="tab"
            aria-selected={currentTab === 'previous-month'}
            className={`${styles.periodTab} ${
              currentTab === 'previous-month'
                ? `${styles.periodTabActive} ${styles.periodTabActiveBlue}`
                : ''
            }`}
            onClick={() => setCurrentTab('previous-month')}
          >
            <CalendarDays size={16} />
            <span>Previous Month</span>
          </button>

          <button
            role="tab"
            aria-selected={currentTab === 'seasons'}
            className={`${styles.periodTab} ${
              currentTab === 'seasons'
                ? `${styles.periodTabActive} ${styles.periodTabActivePurple}`
                : ''
            }`}
            onClick={() => setCurrentTab('seasons')}
          >
            <History size={16} />
            <span>Seasons — Last 5</span>
          </button>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════
          TAB 1: OVERALL (ALL-TIME)
          ═══════════════════════════════════════════════════ */}
      {currentTab === 'overall' && overallData && (
        <>
          {/* Summary KPI Cards */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>
                <Target size={14} className="text-neon-lime" />
                <span>Squad Goals</span>
              </span>
              <span className={`${styles.summaryValue} ${styles.summaryValueLime}`}>
                {overallData.summary.totalGoals.toLocaleString()}
              </span>
              <span className={styles.summarySub}>All-time cumulative</span>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>
                <Share2 size={14} className="text-electric-blue" />
                <span>Squad Assists</span>
              </span>
              <span className={`${styles.summaryValue} ${styles.summaryValueBlue}`}>
                {overallData.summary.totalAssists.toLocaleString()}
              </span>
              <span className={styles.summarySub}>All-time cumulative</span>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>
                <Flame size={14} className="text-electric-purple" />
                <span>Goal Contributions</span>
              </span>
              <span className={`${styles.summaryValue} ${styles.summaryValuePurple}`}>
                {overallData.summary.totalGoalContributions.toLocaleString()}
              </span>
              <span className={styles.summarySub}>Goals + Assists total</span>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>
                <Users size={14} />
                <span>Appearances</span>
              </span>
              <span className={styles.summaryValue}>
                {overallData.summary.totalMatches.toLocaleString()}
              </span>
              <span className={styles.summarySub}>Sum across player cards</span>
            </div>
          </div>

          {/* Partial Data Notice (Explicit integrity: Neuer stats are null, not 0) */}
          {overallData.summary.isPartial && (
            <div className={styles.partialNotice} role="status">
              <AlertTriangle size={18} className={styles.partialNoticeIcon} />
              <span>
                <strong>Data Provenance Notice:</strong> {overallData.summary.notes}.
                Missing or unrecorded stats are honestly preserved as unavailable (—) rather than converted to zero.
              </span>
            </div>
          )}

          {/* Search & Results Meta */}
          <div className={styles.controlsRow}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by player name or card..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Search all-time players"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <span className={styles.resultsMeta}>
              Showing {displayedRows.length} of {overallData.players.length} player cards · Sorted by{' '}
              <strong>{sortField}</strong> ({sortDirection})
            </span>
          </div>

          {/* Player Statistics Table */}
          <div className={styles.tableContainer}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th scope="col">Player Card</th>
                  <th scope="col">Pos / OVR</th>
                  <th
                    scope="col"
                    className={styles.sortableHeader}
                    onClick={() => handleSort('matches')}
                    aria-sort={sortField === 'matches' ? (sortDirection === 'desc' ? 'descending' : 'ascending') : 'none'}
                  >
                    <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                      <span>Matches</span>
                      {sortField === 'matches' && (
                        <span className={styles.sortIcon}>
                          {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className={styles.sortableHeader}
                    onClick={() => handleSort('goals')}
                    aria-sort={sortField === 'goals' ? (sortDirection === 'desc' ? 'descending' : 'ascending') : 'none'}
                  >
                    <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                      <span>Goals</span>
                      {sortField === 'goals' && (
                        <span className={styles.sortIcon}>
                          {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className={styles.sortableHeader}
                    onClick={() => handleSort('assists')}
                    aria-sort={sortField === 'assists' ? (sortDirection === 'desc' ? 'descending' : 'ascending') : 'none'}
                  >
                    <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                      <span>Assists</span>
                      {sortField === 'assists' && (
                        <span className={styles.sortIcon}>
                          {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className={styles.sortableHeader}
                    onClick={() => handleSort('goalContributions')}
                    aria-sort={sortField === 'goalContributions' ? (sortDirection === 'desc' ? 'descending' : 'ascending') : 'none'}
                  >
                    <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                      <span>G/A</span>
                      {sortField === 'goalContributions' && (
                        <span className={styles.sortIcon}>
                          {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" style={{ textAlign: 'right' }}>Goals / M</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Assists / M</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row) => (
                  <tr
                    key={row.playerId}
                    className={styles.clickableRow}
                    onClick={() => onSelectPlayer?.(row.playerId)}
                    title={`View ${row.playerName} profile`}
                  >
                    <td>
                      <div className={styles.playerCell}>
                        <div className={styles.avatarWrapper}>
                          {row.imageUrl ? (
                            <img
                              src={row.imageUrl}
                              alt={row.playerName}
                              className={styles.avatarImage}
                              loading="lazy"
                            />
                          ) : (
                            <span className={styles.avatarFallback}>
                              {row.playerName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className={styles.playerInfo}>
                          <span className={styles.playerName}>{row.playerName}</span>
                          <div className={styles.playerMetaRow}>
                            <span className={styles.cardIdTag}>{row.playerId}</span>
                            {row.cardName && (
                              <span className={styles.cardNameText}>{row.cardName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`${styles.posChip} ${getPosClass(row.primaryPosition)}`}>
                          {row.primaryPosition}
                        </span>
                        {row.overallRating && (
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {row.overallRating}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={styles.numCol}>
                      {row.matches !== null ? row.matches.toLocaleString() : <span className={styles.unavailableStat}>—</span>}
                    </td>
                    <td className={styles.numCol}>
                      {row.goals !== null ? row.goals.toLocaleString() : <span className={styles.unavailableStat}>—</span>}
                    </td>
                    <td className={styles.numCol}>
                      {row.assists !== null ? row.assists.toLocaleString() : <span className={styles.unavailableStat}>—</span>}
                    </td>
                    <td className={`${styles.numCol} ${styles.highlightCol}`}>
                      {row.goalContributions !== null ? row.goalContributions.toLocaleString() : <span className={styles.unavailableStat}>—</span>}
                    </td>
                    <td className={styles.rateCol}>{renderRate(row.goalsPerMatch)}</td>
                    <td className={styles.rateCol}>{renderRate(row.assistsPerMatch)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 2: PREVIOUS MONTH
          ═══════════════════════════════════════════════════ */}
      {currentTab === 'previous-month' && prevMonthData && (
        <>
          {/* Period Label Card */}
          <div className={styles.periodNoteCard}>
            <p className={styles.periodNoteText}>
              <CalendarDays size={18} className="text-electric-blue" />
              <span>
                Displaying confirmed progress snapshot deltas recorded during{' '}
                <strong>{prevMonthData.window.monthLabel}</strong> ({prevMonthData.window.startStr} to {prevMonthData.window.endStr}).
              </span>
            </p>
            <span className={styles.periodNoteBadge}>
              {prevMonthData.hasData ? 'Active Records Found' : 'No Snapshots in Period'}
            </span>
          </div>

          {!prevMonthData.hasData ? (
            <Card variant="glass" padding="lg">
              <EmptyState
                icon={<CalendarDays size={32} />}
                title={`No Activity in ${prevMonthData.window.monthLabel}`}
                description={`Previous Month statistics show only match deltas from progress snapshots recorded in that specific calendar month. No progress snapshots were dated between ${prevMonthData.window.startStr} and ${prevMonthData.window.endStr}. All-time totals are never displayed as monthly results.`}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<BarChart3 size={16} />}
                    onClick={onNavigateToSeasons}
                  >
                    Go to Seasons
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              {/* Previous Month KPI Summary */}
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>
                    <Target size={14} className="text-neon-lime" />
                    <span>Monthly Goals</span>
                  </span>
                  <span className={`${styles.summaryValue} ${styles.summaryValueLime}`}>
                    {prevMonthData.totalGoals > 0 ? `+${prevMonthData.totalGoals}` : prevMonthData.totalGoals}
                  </span>
                  <span className={styles.summarySub}>Delta in {prevMonthData.window.monthLabel}</span>
                </div>

                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>
                    <Share2 size={14} className="text-electric-blue" />
                    <span>Monthly Assists</span>
                  </span>
                  <span className={`${styles.summaryValue} ${styles.summaryValueBlue}`}>
                    {prevMonthData.totalAssists > 0 ? `+${prevMonthData.totalAssists}` : prevMonthData.totalAssists}
                  </span>
                  <span className={styles.summarySub}>Delta in {prevMonthData.window.monthLabel}</span>
                </div>

                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>
                    <Flame size={14} className="text-electric-purple" />
                    <span>Monthly G/A</span>
                  </span>
                  <span className={`${styles.summaryValue} ${styles.summaryValuePurple}`}>
                    {prevMonthData.totalGoalContributions > 0 ? `+${prevMonthData.totalGoalContributions}` : prevMonthData.totalGoalContributions}
                  </span>
                  <span className={styles.summarySub}>Goals + Assists in period</span>
                </div>

                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>
                    <Users size={14} />
                    <span>Monthly Appearances</span>
                  </span>
                  <span className={styles.summaryValue}>
                    {prevMonthData.totalMatches > 0 ? `+${prevMonthData.totalMatches}` : prevMonthData.totalMatches}
                  </span>
                  <span className={styles.summarySub}>Matches delta</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className={styles.controlsRow}>
                <div className={styles.searchWrapper}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search by player name or card..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                    aria-label="Search monthly players"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={styles.clearSearchBtn}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <span className={styles.resultsMeta}>
                  Showing {displayedRows.length} player cards in {prevMonthData.window.monthLabel}
                </span>
              </div>

              {/* Table */}
              <div className={styles.tableContainer}>
                <table className={styles.statsTable}>
                  <thead>
                    <tr>
                      <th scope="col">Player Card</th>
                      <th scope="col">Pos / OVR</th>
                      <th
                        scope="col"
                        className={styles.sortableHeader}
                        onClick={() => handleSort('matches')}
                      >
                        <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                          <span>Matches</span>
                          {sortField === 'matches' && (
                            <span className={styles.sortIcon}>
                              {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className={styles.sortableHeader}
                        onClick={() => handleSort('goals')}
                      >
                        <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                          <span>Goals</span>
                          {sortField === 'goals' && (
                            <span className={styles.sortIcon}>
                              {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className={styles.sortableHeader}
                        onClick={() => handleSort('assists')}
                      >
                        <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                          <span>Assists</span>
                          {sortField === 'assists' && (
                            <span className={styles.sortIcon}>
                              {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className={styles.sortableHeader}
                        onClick={() => handleSort('goalContributions')}
                      >
                        <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                          <span>G/A</span>
                          {sortField === 'goalContributions' && (
                            <span className={styles.sortIcon}>
                              {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" style={{ textAlign: 'right' }}>Goals / M</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Assists / M</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.map((row) => (
                      <tr
                        key={row.playerId}
                        className={styles.clickableRow}
                        onClick={() => onSelectPlayer?.(row.playerId)}
                        title={`View ${row.playerName} profile`}
                      >
                        <td>
                          <div className={styles.playerCell}>
                            <div className={styles.avatarWrapper}>
                              {row.imageUrl ? (
                                <img
                                  src={row.imageUrl}
                                  alt={row.playerName}
                                  className={styles.avatarImage}
                                  loading="lazy"
                                />
                              ) : (
                                <span className={styles.avatarFallback}>
                                  {row.playerName.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className={styles.playerInfo}>
                              <span className={styles.playerName}>{row.playerName}</span>
                              <div className={styles.playerMetaRow}>
                                <span className={styles.cardIdTag}>{row.playerId}</span>
                                {row.cardName && (
                                  <span className={styles.cardNameText}>{row.cardName}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.posChip} ${getPosClass(row.primaryPosition)}`}>
                            {row.primaryPosition}
                          </span>
                        </td>
                        <td className={styles.numCol}>{renderDelta(row.matches)}</td>
                        <td className={styles.numCol}>{renderDelta(row.goals)}</td>
                        <td className={styles.numCol}>{renderDelta(row.assists)}</td>
                        <td className={styles.numCol}>{renderDelta(row.goalContributions, true)}</td>
                        <td className={styles.rateCol}>{renderRate(row.goalsPerMatch)}</td>
                        <td className={styles.rateCol}>{renderRate(row.assistsPerMatch)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 3: SEASONS — LAST 5
          ═══════════════════════════════════════════════════ */}
      {currentTab === 'seasons' && (
        <>
          {selectableSeasons.length === 0 ? (
            <Card variant="glass" padding="lg">
              <EmptyState
                icon={<Trophy size={32} />}
                title="No Active or Closed Seasons"
                description="Seasons statistics require a confirmed starting baseline and progress snapshots. Create or activate a season in the Seasons tab to start tracking season records."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<BarChart3 size={16} />}
                    onClick={onNavigateToSeasons}
                  >
                    Go to Seasons
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              {/* Season Selector Card */}
              <div className={styles.seasonSelectorCard}>
                <div className={styles.seasonSelectorHeader}>
                  <span className={styles.seasonSelectorTitle}>Select Season (Last 5)</span>
                  <span className={styles.seasonSelectorNote}>
                    Displaying {selectableSeasons.length} of max 5 recorded campaigns (newest first)
                  </span>
                </div>

                <div className={styles.seasonPillsList} role="tablist" aria-label="Recent seasons">
                  {selectableSeasons.map((s) => {
                    const isSelected = s.id === selectedSeasonId;
                    const isActiveSeason = s.status === 'Active';

                    return (
                      <button
                        key={s.id}
                        role="tab"
                        aria-selected={isSelected}
                        className={`${styles.seasonPill} ${
                          isSelected
                            ? isActiveSeason
                              ? styles.seasonPillActiveActiveSeason
                              : styles.seasonPillActive
                            : ''
                        }`}
                        onClick={() => setSelectedSeasonId(s.id)}
                      >
                        <Badge
                          variant={isActiveSeason ? 'lime' : 'purple'}
                          size="sm"
                        >
                          {s.status}
                        </Badge>
                        <span>{s.id}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {s.closedDate || s.startDate}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Season Overview Banner */}
              {seasonStats && (
                <div className={styles.seasonBanner}>
                  <div className={styles.seasonBannerHeader}>
                    <div className={styles.seasonBannerTitleArea}>
                      <h2 className={styles.seasonBannerTitle}>{seasonStats.season.id}</h2>
                      <Badge
                        variant={seasonStats.season.status === 'Active' ? 'lime' : 'purple'}
                      >
                        {seasonStats.season.status === 'Closed' ? 'Closed · Immutable Record' : 'Active Campaign'}
                      </Badge>
                      <Badge variant="blue" size="sm">
                        Start Div {seasonStats.season.startingDivision}
                      </Badge>
                      {seasonStats.season.finalRank && (
                        <Badge variant="lime" size="sm">
                          Rank #{seasonStats.season.finalRank.toLocaleString()}
                        </Badge>
                      )}
                    </div>

                    <div className={styles.seasonBannerMetaGrid}>
                      <span className={styles.metaItem}>
                        <span>Started:</span>
                        <strong className={styles.metaHighlight}>{seasonStats.season.startDate}</strong>
                      </span>
                      {seasonStats.season.closedDate && (
                        <span className={styles.metaItem}>
                          <span>Closed:</span>
                          <strong className={styles.metaHighlight}>{seasonStats.season.closedDate}</strong>
                        </span>
                      )}
                      <span className={styles.metaItem}>
                        <span>Snapshots:</span>
                        <strong className={styles.metaHighlight}>{seasonStats.season.snapshotCount}</strong>
                      </span>
                    </div>
                  </div>

                  {seasonStats.notes && (
                    <p className={styles.seasonBannerNotes}>{seasonStats.notes}</p>
                  )}
                </div>
              )}

              {/* Season Content: Either Missing Progress Notice or Stats Table */}
              {seasonStats && !seasonStats.hasConfirmedProgress ? (
                <Card variant="glass" padding="lg">
                  <EmptyState
                    icon={<History size={32} />}
                    title="No Confirmed Progress Recorded"
                    description={
                      seasonStats.notes ||
                      'This season does not have confirmed progress snapshots. Performance deltas will appear once snapshots are submitted and confirmed.'
                    }
                    action={
                      seasonStats.season.status === 'Active' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={onNavigateToSeasons}
                        >
                          Record Progress in Seasons
                        </Button>
                      ) : undefined
                    }
                  />
                </Card>
              ) : seasonStats && seasonStats.hasConfirmedProgress ? (
                <>
                  {/* Season Aggregate Summary Cards */}
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>
                        <Target size={14} className="text-neon-lime" />
                        <span>Squad Goals Delta</span>
                      </span>
                      <span className={`${styles.summaryValue} ${styles.summaryValueLime}`}>
                        {(seasonStats.totalGoalsDelta ?? 0) > 0
                          ? `+${seasonStats.totalGoalsDelta}`
                          : seasonStats.totalGoalsDelta ?? 0}
                      </span>
                      <span className={styles.summarySub}>Campaign goals above baseline</span>
                    </div>

                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>
                        <Share2 size={14} className="text-electric-blue" />
                        <span>Squad Assists Delta</span>
                      </span>
                      <span className={`${styles.summaryValue} ${styles.summaryValueBlue}`}>
                        {(seasonStats.totalAssistsDelta ?? 0) > 0
                          ? `+${seasonStats.totalAssistsDelta}`
                          : seasonStats.totalAssistsDelta ?? 0}
                      </span>
                      <span className={styles.summarySub}>Campaign assists above baseline</span>
                    </div>

                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>
                        <Flame size={14} className="text-electric-purple" />
                        <span>Goal Contributions</span>
                      </span>
                      <span className={`${styles.summaryValue} ${styles.summaryValuePurple}`}>
                        {(seasonStats.totalGoalContributions ?? 0) > 0
                          ? `+${seasonStats.totalGoalContributions}`
                          : seasonStats.totalGoalContributions ?? 0}
                      </span>
                      <span className={styles.summarySub}>Total G/A delta</span>
                    </div>

                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>
                        <Users size={14} />
                        <span>Matches Delta</span>
                      </span>
                      <span className={styles.summaryValue}>
                        {(seasonStats.totalMatchesDelta ?? 0) > 0
                          ? `+${seasonStats.totalMatchesDelta}`
                          : seasonStats.totalMatchesDelta ?? 0}
                      </span>
                      <span className={styles.summarySub}>Appearances in season</span>
                    </div>
                  </div>

                  {/* Search */}
                  <div className={styles.controlsRow}>
                    <div className={styles.searchWrapper}>
                      <Search size={16} className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Search players in this season..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                        aria-label="Search season players"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className={styles.clearSearchBtn}
                          aria-label="Clear search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <span className={styles.resultsMeta}>
                      Showing {displayedRows.length} player cards in {seasonStats.season.id} · Preserving Starting XI / Sub baseline roles
                    </span>
                  </div>

                  {/* Season Table */}
                  <div className={styles.tableContainer}>
                    <table className={styles.statsTable}>
                      <thead>
                        <tr>
                          <th scope="col">Player Card</th>
                          <th scope="col">Baseline Role</th>
                          <th
                            scope="col"
                            className={styles.sortableHeader}
                            onClick={() => handleSort('matches')}
                          >
                            <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                              <span>Matches Δ</span>
                              {sortField === 'matches' && (
                                <span className={styles.sortIcon}>
                                  {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className={styles.sortableHeader}
                            onClick={() => handleSort('goals')}
                          >
                            <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                              <span>Goals Δ</span>
                              {sortField === 'goals' && (
                                <span className={styles.sortIcon}>
                                  {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className={styles.sortableHeader}
                            onClick={() => handleSort('assists')}
                          >
                            <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                              <span>Assists Δ</span>
                              {sortField === 'assists' && (
                                <span className={styles.sortIcon}>
                                  {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className={styles.sortableHeader}
                            onClick={() => handleSort('goalContributions')}
                          >
                            <div className={styles.headerContent} style={{ justifyContent: 'flex-end' }}>
                              <span>G/A Δ</span>
                              {sortField === 'goalContributions' && (
                                <span className={styles.sortIcon}>
                                  {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </span>
                              )}
                            </div>
                          </th>
                          <th scope="col" style={{ textAlign: 'right' }}>Goals / M</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Assists / M</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedRows.map((row) => (
                          <tr
                            key={row.playerId}
                            className={styles.clickableRow}
                            onClick={() => onSelectPlayer?.(row.playerId)}
                            title={`View ${row.playerName} profile`}
                          >
                            <td>
                              <div className={styles.playerCell}>
                                <div className={styles.avatarWrapper}>
                                  {row.imageUrl ? (
                                    <img
                                      src={row.imageUrl}
                                      alt={row.playerName}
                                      className={styles.avatarImage}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className={styles.avatarFallback}>
                                      {row.playerName.slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className={styles.playerInfo}>
                                  <span className={styles.playerName}>{row.playerName}</span>
                                  <div className={styles.playerMetaRow}>
                                    <span className={styles.cardIdTag}>{row.playerId}</span>
                                    <span className={`${styles.posChip} ${getPosClass(row.primaryPosition)}`}>
                                      {row.primaryPosition}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={
                                  row.roleClassification === 'Starting XI'
                                    ? styles.roleBadgeStarter
                                    : styles.roleBadgeSub
                                }
                              >
                                {row.roleClassification || 'Substitute'}
                              </span>
                            </td>
                            <td className={styles.numCol}>{renderDelta(row.matches)}</td>
                            <td className={styles.numCol}>{renderDelta(row.goals)}</td>
                            <td className={styles.numCol}>{renderDelta(row.assists)}</td>
                            <td className={styles.numCol}>{renderDelta(row.goalContributions, true)}</td>
                            <td className={styles.rateCol}>{renderRate(row.goalsPerMatch)}</td>
                            <td className={styles.rateCol}>{renderRate(row.assistsPerMatch)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
};
