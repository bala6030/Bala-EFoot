import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Award,
  Hash,
  Activity,
  Gift,
  PlusCircle,
  Users2,
  CalendarDays,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Medal,
  BarChart2,
  Pencil,
  CheckCircle,
  X,
} from 'lucide-react';
import { StatCard } from './StatCard';
import { ChelseaBadge } from './ChelseaBadge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import {
  getDashboardKPIs,
  getOverallTopPerformers,
  getPreviousMonthTopPerformers,
  getClosedSeasonHistory,
  recordActiveDivisionProgress,
  getActiveSeason,
} from '../../data/dashboardService';
import type {
  DashboardKPIs,
  TopPerformerItem,
  ClosedSeasonHistoryItem,
  DivisionProgressInput,
} from '../../types';
import styles from './DashboardView.module.css';

export interface DashboardViewProps {
  onAddMatchStats?: () => void;
}

// ─── Record Standing Modal ────────────────────────────────────────────────────

interface RecordStandingFormState {
  division: string;
  points: string;
  rank: string;
  wins: string;
  draws: string;
  losses: string;
  notes: string;
}

const EMPTY_FORM: RecordStandingFormState = {
  division: '',
  points: '',
  rank: '',
  wins: '',
  draws: '',
  losses: '',
  notes: '',
};

interface RecordStandingModalProps {
  seasonId: string;
  onSave: () => void;
  onClose: () => void;
}

const RecordStandingModal: React.FC<RecordStandingModalProps> = ({
  seasonId,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<RecordStandingFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<RecordStandingFormState>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const parseIntOrNull = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isInteger(n) ? n : null;
  };

  const validate = (): boolean => {
    const errs: Partial<RecordStandingFormState> = {};
    const div = parseIntOrNull(form.division);
    if (div === null || div < 1 || div > 10) errs.division = 'Must be 1–10';
    const pts = parseIntOrNull(form.points);
    if (pts === null || pts < 0) errs.points = 'Must be ≥ 0';
    const w = parseIntOrNull(form.wins);
    if (w === null || w < 0) errs.wins = 'Must be ≥ 0';
    const d = parseIntOrNull(form.draws);
    if (d === null || d < 0) errs.draws = 'Must be ≥ 0';
    const l = parseIntOrNull(form.losses);
    if (l === null || l < 0) errs.losses = 'Must be ≥ 0';
    if (form.rank.trim()) {
      const r = parseIntOrNull(form.rank);
      if (r === null || r < 1) errs.rank = 'Must be ≥ 1 if provided';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setServerError(null);

    const input: Omit<DivisionProgressInput, 'seasonId'> = {
      division: parseIntOrNull(form.division)!,
      points: parseIntOrNull(form.points)!,
      wins: parseIntOrNull(form.wins)!,
      draws: parseIntOrNull(form.draws)!,
      losses: parseIntOrNull(form.losses)!,
      rank: form.rank.trim() ? parseIntOrNull(form.rank) ?? undefined : undefined,
      notes: form.notes.trim() || undefined,
    };

    const result = recordActiveDivisionProgress({ ...input, seasonId });
    setSaving(false);

    if (result.success) {
      onSave();
    } else {
      setServerError(result.error || 'Failed to record standing.');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Record Division Standing</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {serverError && (
            <p className={styles.modalError}>{serverError}</p>
          )}

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Division <span className={styles.req}>*</span></label>
              <input
                type="number"
                min={1}
                max={10}
                className={`${styles.formInput} ${errors.division ? styles.inputError : ''}`}
                value={form.division}
                onChange={(e) => setForm({ ...form, division: e.target.value })}
                placeholder="1–10"
              />
              {errors.division && <span className={styles.fieldError}>{errors.division}</span>}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Points <span className={styles.req}>*</span></label>
              <input
                type="number"
                min={0}
                className={`${styles.formInput} ${errors.points ? styles.inputError : ''}`}
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
                placeholder="e.g. 1200"
              />
              {errors.points && <span className={styles.fieldError}>{errors.points}</span>}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Wins <span className={styles.req}>*</span></label>
              <input
                type="number"
                min={0}
                className={`${styles.formInput} ${errors.wins ? styles.inputError : ''}`}
                value={form.wins}
                onChange={(e) => setForm({ ...form, wins: e.target.value })}
                placeholder="0"
              />
              {errors.wins && <span className={styles.fieldError}>{errors.wins}</span>}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Draws <span className={styles.req}>*</span></label>
              <input
                type="number"
                min={0}
                className={`${styles.formInput} ${errors.draws ? styles.inputError : ''}`}
                value={form.draws}
                onChange={(e) => setForm({ ...form, draws: e.target.value })}
                placeholder="0"
              />
              {errors.draws && <span className={styles.fieldError}>{errors.draws}</span>}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Losses <span className={styles.req}>*</span></label>
              <input
                type="number"
                min={0}
                className={`${styles.formInput} ${errors.losses ? styles.inputError : ''}`}
                value={form.losses}
                onChange={(e) => setForm({ ...form, losses: e.target.value })}
                placeholder="0"
              />
              {errors.losses && <span className={styles.fieldError}>{errors.losses}</span>}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Rank <span className={styles.opt}>(optional)</span></label>
              <input
                type="number"
                min={1}
                className={`${styles.formInput} ${errors.rank ? styles.inputError : ''}`}
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: e.target.value })}
                placeholder="e.g. 45000"
              />
              {errors.rank && <span className={styles.fieldError}>{errors.rank}</span>}
              <span className={styles.fieldHint}>Top 100,000 qualifies for reward</span>
            </div>
          </div>

          <div className={styles.formField} style={{ marginTop: '0.75rem' }}>
            <label className={styles.formLabel}>Notes <span className={styles.opt}>(optional)</span></label>
            <textarea
              className={styles.formTextarea}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Mid-season checkpoint"
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            icon={<CheckCircle size={15} />}
          >
            Save Standing
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Top Performers Table ─────────────────────────────────────────────────────

interface PerformersTableProps {
  items: TopPerformerItem[];
}

const PerformersTable: React.FC<PerformersTableProps> = ({ items }) => (
  <div className={styles.performersTable}>
    <div className={styles.performersHeader}>
      <span className={styles.phRank}>#</span>
      <span className={styles.phPlayer}>Player</span>
      <span className={styles.phStat}>MP</span>
      <span className={styles.phStat}>G</span>
      <span className={styles.phStat}>A</span>
      <span className={styles.phStat}>G+A</span>
      <span className={styles.phRate}>G/M</span>
    </div>
    {items.map((p) => (
      <div key={p.playerId} className={styles.performersRow}>
        <span className={styles.pRank}>
          {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `${p.rank}`}
        </span>
        <span className={styles.pPlayer}>
          <span className={styles.pName}>{p.playerName}</span>
          <span className={styles.pPos}>{p.primaryPosition}</span>
        </span>
        <span className={styles.pStat}>{p.matches ?? '—'}</span>
        <span className={styles.pStat}>{p.goals ?? '—'}</span>
        <span className={styles.pStat}>{p.assists ?? '—'}</span>
        <span className={`${styles.pStat} ${styles.pContrib}`}>{p.goalContributions ?? '—'}</span>
        <span className={styles.pRate}>{p.goalsPerMatch !== null ? p.goalsPerMatch.toFixed(2) : '—'}</span>
      </div>
    ))}
  </div>
);

// ─── Division History Card ────────────────────────────────────────────────────

interface HistoryCardProps {
  item: ClosedSeasonHistoryItem;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const rewardBadgeVariant =
    item.rewardStatus === 'Acquired'
      ? 'purple'
      : item.rewardStatus === 'Eligible'
      ? 'lime'
      : item.rewardStatus === 'Eligibility Unknown'
      ? 'default'
      : 'default';

  return (
    <Card variant="glass" padding="md" className={styles.historyCard}>
      <div className={styles.historyCardHeader} onClick={() => setExpanded((v) => !v)}>
        <div className={styles.historySummary}>
          <span className={styles.historyId}>{item.id}</span>
          <div className={styles.historyMeta}>
            <span className={styles.historyDate}>{item.startDate} → {item.closedDate}</span>
            <span className={styles.historyDiv}>
              Div {item.startingDivision}
              {item.finalDivision !== null && item.finalDivision !== item.startingDivision && (
                <span className={styles.historyDivArrow}> → Div {item.finalDivision}</span>
              )}
            </span>
          </div>
        </div>
        <div className={styles.historyBadges}>
          <Badge variant={rewardBadgeVariant} size="sm" icon={<Gift size={11} />}>
            {item.rewardStatus}
          </Badge>
          {item.finalRank !== null && (
            <Badge variant="blue" size="sm" icon={<Hash size={11} />}>
              #{item.finalRank.toLocaleString()}
            </Badge>
          )}
          <button
            className={styles.historyExpand}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.historyDetails}>
          <div className={styles.historyStatsGrid}>
            <div className={styles.historyStatBlock}>
              <span className={styles.hStatLabel}>Record</span>
              <span className={styles.hStatValue}>{item.record}</span>
              {item.matches !== null && <span className={styles.hStatSub}>{item.matches} matches</span>}
            </div>
            <div className={styles.historyStatBlock}>
              <span className={styles.hStatLabel}>Win Rate</span>
              <span className={styles.hStatValue}>{item.winRate}</span>
            </div>
            {item.points !== null && (
              <div className={styles.historyStatBlock}>
                <span className={styles.hStatLabel}>Points</span>
                <span className={styles.hStatValue}>{item.points.toLocaleString()}</span>
              </div>
            )}
            <div className={styles.historyStatBlock}>
              <span className={styles.hStatLabel}>Goals (+A)</span>
              <span className={styles.hStatValue}>+{item.totalGoalsDelta}</span>
              <span className={styles.hStatSub}>+{item.totalAssistsDelta} assists</span>
            </div>
            <div className={styles.historyStatBlock}>
              <span className={styles.hStatLabel}>Matches Δ</span>
              <span className={styles.hStatValue}>+{item.totalMatchesDelta}</span>
            </div>
          </div>

          {item.rewardCardName && (
            <div className={styles.historyReward}>
              <Gift size={14} />
              <span>Reward: <strong>{item.rewardCardName}</strong></span>
            </div>
          )}
          {item.closureNotes && (
            <p className={styles.historyNotes}>{item.closureNotes}</p>
          )}
        </div>
      )}
    </Card>
  );
};

// ─── Main Dashboard View ──────────────────────────────────────────────────────

export const DashboardView: React.FC<DashboardViewProps> = ({ onAddMatchStats }) => {
  const [performersPeriod, setPerformersPeriod] = useState<'previous' | 'overall'>('previous');
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [overallPerformers, setOverallPerformers] = useState<TopPerformerItem[]>([]);
  const [previousPerformers, setPreviousPerformers] = useState<TopPerformerItem[]>([]);
  const [historyItems, setHistoryItems] = useState<ClosedSeasonHistoryItem[]>([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [previousMonthLabel, setPreviousMonthLabel] = useState('');

  const loadData = useCallback(() => {
    setKpis(getDashboardKPIs());
    setOverallPerformers(getOverallTopPerformers(5));
    setPreviousPerformers(getPreviousMonthTopPerformers(new Date(), 5));
    setHistoryItems(getClosedSeasonHistory());

    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setPreviousMonthLabel(
      prevMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
    );
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeSeason = getActiveSeason();

  const handleModalSaved = () => {
    setShowRecordModal(false);
    loadData(); // Refresh all dashboard data after saving
  };

  const performers = performersPeriod === 'overall' ? overallPerformers : previousPerformers;

  return (
    <div className={styles.dashboard}>
      {/* Record Standing Modal */}
      {showRecordModal && activeSeason && (
        <RecordStandingModal
          seasonId={activeSeason.id}
          onSave={handleModalSaved}
          onClose={() => setShowRecordModal(false)}
        />
      )}

      {/* Top Header & Quick Actions */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <h1 className={styles.heading}>Division Dashboard</h1>
          <p className={styles.subheading}>
            Live division standing, season rewards, and player metrics
          </p>
        </div>

        <div className={styles.actionArea}>
          <Button
            variant="primary"
            icon={<PlusCircle size={18} />}
            onClick={onAddMatchStats}
            title="Add Match Stats — Guided season update flow"
          >
            Add Match Stats
          </Button>
          {kpis?.hasActiveSeason && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil size={15} />}
              onClick={() => setShowRecordModal(true)}
              title="Record current division standing and match record"
            >
              Record Standing
            </Button>
          )}
          <span className={styles.actionNote}>Guided season update flow</span>
        </div>
      </div>

      {/* Active Season Notice (if no season) */}
      {kpis && !kpis.hasActiveSeason && (
        <Card variant="glass" padding="md" className={styles.noSeasonBanner}>
          <div className={styles.noSeasonInner}>
            <Target size={20} className={styles.noSeasonIcon} />
            <div>
              <p className={styles.noSeasonTitle}>No Active Season</p>
              <p className={styles.noSeasonDesc}>
                Create or activate a season in the Seasons tab to track your division standing, match record, and progress here.
              </p>
            </div>
            <Button
              variant="blue"
              size="sm"
              onClick={onAddMatchStats}
            >
              Go to Seasons
            </Button>
          </div>
        </Card>
      )}

      {/* Primary KPI Tiles */}
      <section aria-label="Division Statistics" className={styles.statsGrid}>
        <StatCard
          title="Division"
          value={kpis?.divisionDisplay ?? '—'}
          subtitle={kpis?.divisionSubtitle ?? 'No active season'}
          icon={<Trophy size={16} />}
          color="blue"
        />

        <StatCard
          title="Points"
          value={kpis?.pointsDisplay ?? '—'}
          subtitle={kpis?.pointsSubtitle ?? 'Unrecorded'}
          icon={<Activity size={16} />}
        />

        <StatCard
          title="Rank"
          value={kpis?.rankDisplay ?? '—'}
          subtitle={kpis?.rankSubtitle ?? 'Top 100k qualifies'}
          icon={<Hash size={16} />}
          color={kpis?.isRewardEligible ? 'lime' : 'default'}
        />

        <StatCard
          title="Record"
          value={kpis?.recordDisplay ?? '—'}
          subtitle={kpis?.recordSubtitle ?? 'Wins • Draws • Losses'}
          icon={<Award size={16} />}
        />

        <StatCard
          title="Win Rate"
          value={kpis?.winRateDisplay ?? '—%'}
          subtitle={kpis?.winRateSubtitle ?? 'No matches recorded'}
          accessory={<ChelseaBadge size={22} />}
          color="lime"
        />

        <StatCard
          title="Reward Status"
          value={kpis?.rewardStatus ?? '—'}
          subtitle={kpis?.rewardSubtitle ?? 'No active season'}
          icon={<Gift size={16} />}
          color={kpis?.rewardColor ?? 'default'}
        />
      </section>

      {/* Division Progress Update Hint */}
      {kpis?.hasActiveSeason && kpis.points === null && (
        <div className={styles.progressHint}>
          <TrendingUp size={15} />
          <span>
            Points, match record, and win rate are not yet recorded for this season.{' '}
            <button className={styles.hintLink} onClick={() => setShowRecordModal(true)}>
              Record your current standing
            </button>{' '}
            to see live metrics here.
          </span>
        </div>
      )}

      {/* Top Performers Section */}
      <section aria-labelledby="performers-heading">
        <div className={styles.sectionHeader}>
          <h2 id="performers-heading" className={styles.sectionTitle}>
            <Users2 size={20} className="text-neon-lime" />
            <span>Top Performers</span>
          </h2>

          <div className={styles.tabGroup} role="tablist" aria-label="Performers time period">
            <button
              role="tab"
              aria-selected={performersPeriod === 'previous'}
              className={`${styles.tabButton} ${
                performersPeriod === 'previous' ? styles.tabButtonActive : ''
              }`}
              onClick={() => setPerformersPeriod('previous')}
            >
              {previousMonthLabel || 'Previous Month'}
            </button>
            <button
              role="tab"
              aria-selected={performersPeriod === 'overall'}
              className={`${styles.tabButton} ${
                performersPeriod === 'overall' ? styles.tabButtonActive : ''
              }`}
              onClick={() => setPerformersPeriod('overall')}
            >
              Overall (All-Time)
            </button>
          </div>
        </div>

        {performers.length > 0 ? (
          <Card variant="glass" padding="md">
            {performersPeriod === 'previous' && (
              <p className={styles.performersPeriodNote}>
                Showing match deltas recorded in {previousMonthLabel || 'the previous month'} from confirmed progress snapshots.
              </p>
            )}
            {performersPeriod === 'overall' && (
              <p className={styles.performersPeriodNote}>
                All-time statistics from authentic player records. Ranked by goal contributions.
              </p>
            )}
            <PerformersTable items={performers} />
          </Card>
        ) : (
          <Card variant="glass" padding="lg">
            {performersPeriod === 'previous' ? (
              <EmptyState
                icon={<BarChart2 size={24} />}
                title={`No Data for ${previousMonthLabel || 'Previous Month'}`}
                description="Previous Month shows only stats from progress snapshots recorded in that specific calendar month. Record a progress update in the Seasons tab, then return here to see the breakdown."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<PlusCircle size={15} />}
                    onClick={onAddMatchStats}
                  >
                    Add Progress Update
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<Medal size={24} />}
                title="No All-Time Performance Records"
                description="Player performance statistics will appear here once players have goals, assists, or matches in their all-time records."
              />
            )}
          </Card>
        )}
      </section>

      {/* Division History Section */}
      <section aria-labelledby="history-heading">
        <div className={styles.sectionHeader}>
          <h2 id="history-heading" className={styles.sectionTitle}>
            <CalendarDays size={20} className="text-neon-blue" />
            <span>Division History & Season Rewards</span>
          </h2>
        </div>

        {historyItems.length > 0 ? (
          <div className={styles.historyList}>
            {historyItems.map((item) => (
              <HistoryCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Card variant="glass" padding="lg">
            <EmptyState
              icon={<Trophy size={24} />}
              title="No Closed Seasons Yet"
              description="Historical seasons, final ranks, match ratios, and reward card acquisition statuses will appear here once you close a season in the Seasons tab."
            />
          </Card>
        )}
      </section>
    </div>
  );
};
