import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  Save,
  Trash2,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  History,
  AlertTriangle,
  Trophy,
  Award,
  HelpCircle,
  X,
  Edit2,
  Lock,
  Info,
} from 'lucide-react';
import {
  Season,
  SeasonDraftInput,
  SeasonValidationResult,
  BaselinePlayerRecord,
  BaselineDraftPlayerEntry,
  SeasonBaselineDraft,
  ProgressPlayerRecord,
  ProgressDraftPlayerEntry,
  SeasonProgressDraft,
  PlayerRoleClassification,
  PlayerStatDelta,
  SeasonProgressSnapshot,
  SeasonReviewSummary,
} from '../../types';
import {
  loadSeasonsState,
  saveSeasonDraft,
  activateSeason,
  discardDraft,
  validateSeasonDraft,
  getActiveDraft,
  clearActiveDraftPointer,
  validateBaselinePlayerEntries,
  getInitialBaselineDraft,
  saveBaselineDraft,
  confirmSeasonBaseline,
  getInitialProgressDraft,
  saveProgressDraft,
  calculatePlayerStatDeltas,
  confirmProgressSnapshot,
  isValidStatValue,
  setSeasonRank,
  recordSeasonReward,
  REWARD_RANK_THRESHOLD,
  getSeasonReviewSummary,
  closeSeason,
} from '../../data/seasonRepository';
import { getAllPlayers } from '../../data/playerRepository';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import styles from './SeasonsView.module.css';

export interface SeasonsViewProps {
  onSeasonActivated?: (season: Season) => void;
}

export const SeasonsView: React.FC<SeasonsViewProps> = ({ onSeasonActivated }) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeDraftSeason, setActiveDraftSeason] = useState<Season | null>(null);

  // View state: 'list' | 'create' | 'baseline' | 'progress' | 'snapshot-detail' | 'close-review' | 'closed-detail'
  const [viewMode, setViewMode] = useState<
    'list' | 'create' | 'baseline' | 'progress' | 'snapshot-detail' | 'close-review' | 'closed-detail'
  >('list');

  // Milestone 4C2: Closure Review State
  const [reviewSeasonId, setReviewSeasonId] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<SeasonReviewSummary | null>(null);
  const [reviewTab, setReviewTab] = useState<'all' | 'starters' | 'subs'>('all');
  const [acknowledgedIncompleteChecked, setAcknowledgedIncompleteChecked] = useState<boolean>(false);
  const [closureNotesInput, setClosureNotesInput] = useState<string>('');
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [closureError, setClosureError] = useState<string | null>(null);

  // Milestone 4C2: Historical Closed Season Detail State
  const [closedDetailSeasonId, setClosedDetailSeasonId] = useState<string | null>(null);
  const [closedDetailTab, setClosedDetailTab] = useState<'all' | 'starters' | 'subs'>('all');

  // Currently selected season for baseline or progress
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  // Guided step (1: Input/Setup | 2: Review & Confirmation)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State (Season Creation)
  const [formId, setFormId] = useState<string>('');
  const [originalDraftId, setOriginalDraftId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [startingDivision, setStartingDivision] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');

  // Milestone 4B: Baseline State
  const [baselinePlayers, setBaselinePlayers] = useState<BaselineDraftPlayerEntry[]>([]);
  const [baselineNotes, setBaselineNotes] = useState<string>('');
  const [baselineTab, setBaselineTab] = useState<'all' | 'starters' | 'subs'>('all');

  // Milestone 4B: Progress State
  const [progressDate, setProgressDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [progressNotes, setProgressNotes] = useState<string>('');
  const [progressPlayers, setProgressPlayers] = useState<ProgressDraftPlayerEntry[]>([]);
  const [progressTab, setProgressTab] = useState<'all' | 'starters' | 'subs'>('all');
  const [confirmDecreasesChecked, setConfirmDecreasesChecked] = useState<boolean>(false);
  const [calculatedDeltas, setCalculatedDeltas] = useState<PlayerStatDelta[]>([]);
  const [decreaseWarnings, setDecreaseWarnings] = useState<string[]>([]);

  // Selected snapshot for detail view
  const [selectedSnapshot, setSelectedSnapshot] = useState<SeasonProgressSnapshot | null>(null);

  // Milestone 4C1: Rank & Reward State
  const [rankModalSeason, setRankModalSeason] = useState<Season | null>(null);
  const [rankInputValue, setRankInputValue] = useState<string>('');
  const [rankModalError, setRankModalError] = useState<string | null>(null);

  const [rewardModalSeason, setRewardModalSeason] = useState<Season | null>(null);
  const [rewardCardName, setRewardCardName] = useState<string>('');
  const [rewardCardDescription, setRewardCardDescription] = useState<string>('');
  const [rewardAcquiredDate, setRewardAcquiredDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [rewardNotes, setRewardNotes] = useState<string>('');
  const [rewardConfirmedCheckbox, setRewardConfirmedCheckbox] = useState<boolean>(false);
  const [rewardModalError, setRewardModalError] = useState<string | null>(null);

  // Computed live rank preview for rank modal
  const liveRankParsed = useMemo(() => {
    const trimmed = rankInputValue.trim();
    if (trimmed === '') return null;
    const num = Number(trimmed);
    if (isNaN(num) || !Number.isInteger(num) || num < 1) return 'invalid';
    return num;
  }, [rankInputValue]);

  // Validation & Feedback state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [baselineErrors, setBaselineErrors] = useState<string[]>([]);
  const [progressErrors, setProgressErrors] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info' | 'warning' | 'danger';
    text: string;
  } | null>(null);

  // Player catalogue reference map
  const allPlayers = useMemo(() => getAllPlayers(), []);
  const playerMap = useMemo(() => {
    const map = new Map<string, (typeof allPlayers)[0]>();
    allPlayers.forEach((p) => map.set(p.id, p));
    return map;
  }, [allPlayers]);

  const playerMetaMap = useMemo(() => {
    const map: Record<string, { name: string; position: string }> = {};
    allPlayers.forEach((p) => {
      map[p.id] = { name: p.name, position: p.primaryPosition };
    });
    return map;
  }, [allPlayers]);

  // Reload data from repository
  const refreshData = () => {
    const state = loadSeasonsState();
    setSeasons(state.seasons);
    const draft = getActiveDraft();
    setActiveDraftSeason(draft || null);

    if (reviewSeasonId) {
      const updatedSummary = getSeasonReviewSummary(reviewSeasonId, playerMetaMap);
      setReviewSummary(updatedSummary);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const currentSelectedSeason = useMemo(() => {
    if (!selectedSeasonId) return null;
    return seasons.find((s) => s.id === selectedSeasonId) || null;
  }, [seasons, selectedSeasonId]);

  const currentClosedSeason = useMemo(() => {
    if (!closedDetailSeasonId) return null;
    return seasons.find((s) => s.id === closedDetailSeasonId) || null;
  }, [seasons, closedDetailSeasonId]);

  const filteredReviewDeltas = useMemo(() => {
    if (!reviewSummary) return [];
    if (reviewTab === 'starters') {
      return reviewSummary.deltas.filter((d) => d.roleClassification === 'Starting XI');
    }
    if (reviewTab === 'subs') {
      return reviewSummary.deltas.filter((d) => d.roleClassification === 'Substitute');
    }
    return reviewSummary.deltas;
  }, [reviewSummary, reviewTab]);

  const closedSeasonDeltas = useMemo(() => {
    if (!currentClosedSeason) return [];
    const snap = currentClosedSeason.closureSnapshot;
    const baseline = snap ? snap.baseline : currentClosedSeason.baseline;
    if (!baseline) return [];
    const progressSnaps = snap
      ? snap.progressSnapshots
      : currentClosedSeason.progressSnapshots || [];
    const latest = progressSnaps.length > 0 ? progressSnaps[progressSnaps.length - 1] : null;

    if (latest) {
      const fakeSeason: Season = {
        ...currentClosedSeason,
        baseline,
        progressSnapshots: progressSnaps,
      };
      return calculatePlayerStatDeltas(fakeSeason, latest.players, playerMetaMap).deltas;
    }

    return baseline.players.map((p) => {
      const meta = playerMetaMap[p.playerId] || { name: p.playerId, position: 'N/A' };
      return {
        playerId: p.playerId,
        playerName: meta.name,
        position: meta.position,
        roleClassification: p.roleClassification,
        baselineMatches: p.matches,
        baselineGoals: p.goals,
        baselineAssists: p.assists,
        currentMatches: p.matches,
        currentGoals: p.goals,
        currentAssists: p.assists,
        matchesDelta: 0,
        goalsDelta: 0,
        assistsDelta: 0,
        matchesDecreased: false,
        goalsDecreased: false,
        assistsDecreased: false,
        referenceMatches: p.matches,
        referenceGoals: p.goals,
        referenceAssists: p.assists,
      };
    });
  }, [currentClosedSeason, playerMetaMap]);

  const filteredClosedDeltas = useMemo(() => {
    if (closedDetailTab === 'starters') {
      return closedSeasonDeltas.filter((d) => d.roleClassification === 'Starting XI');
    }
    if (closedDetailTab === 'subs') {
      return closedSeasonDeltas.filter((d) => d.roleClassification === 'Substitute');
    }
    return closedSeasonDeltas;
  }, [closedSeasonDeltas, closedDetailTab]);

  // Helper to pre-populate form with existing draft data
  const populateFormWithDraft = (draft: Season) => {
    setFormId(draft.id);
    setOriginalDraftId(draft.id);
    setStartDate(draft.startDate || new Date().toISOString().split('T')[0]);
    setStartingDivision(draft.startingDivision || 10);
    setNotes(draft.notes || '');
    setFormErrors({});
    setCurrentStep(1);
    setViewMode('create');
  };

  // Start fresh creation flow
  const handleStartNewSeason = () => {
    setFormId('');
    setOriginalDraftId(undefined);
    setStartDate(new Date().toISOString().split('T')[0]);
    setStartingDivision(10);
    setNotes('');
    setFormErrors({});
    setCurrentStep(1);
    setViewMode('create');
  };

  // Resume active draft
  const handleResumeDraft = () => {
    if (activeDraftSeason) {
      populateFormWithDraft(activeDraftSeason);
    }
  };

  // Validate form before proceeding
  const runValidation = (isActivating: boolean): SeasonValidationResult => {
    const draftInput: SeasonDraftInput = {
      id: formId,
      startDate,
      startingDivision,
      notes,
    };
    return validateSeasonDraft(draftInput, isActivating, seasons, originalDraftId);
  };

  // Save current progress as a Draft
  const handleSaveDraft = () => {
    const validation = runValidation(false);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    const res = saveSeasonDraft(
      {
        id: formId.trim() || undefined,
        startDate,
        startingDivision,
        notes: notes.trim() || undefined,
      },
      originalDraftId
    );

    if (res.success && res.season) {
      setStatusMessage({
        type: 'info',
        text: `Draft "${res.season.id}" saved successfully. You can safely close or refresh your browser.`,
      });
      setOriginalDraftId(res.season.id);
      setFormId(res.season.id);
      setFormErrors({});
      refreshData();
    } else {
      setStatusMessage({
        type: 'danger',
        text: res.error || 'Failed to save season draft.',
      });
      if (res.validationErrors) {
        setFormErrors(res.validationErrors);
      }
    }
  };

  // Proceed from Step 1 to Step 2 (Review)
  const handleProceedToReview = () => {
    const validation = runValidation(true);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    const res = saveSeasonDraft(
      {
        id: formId.trim(),
        startDate,
        startingDivision,
        notes: notes.trim() || undefined,
      },
      originalDraftId
    );

    if (res.success && res.season) {
      setOriginalDraftId(res.season.id);
      refreshData();
      setCurrentStep(2);
    } else {
      setStatusMessage({
        type: 'danger',
        text: res.error || 'Please correct errors before reviewing.',
      });
      if (res.validationErrors) {
        setFormErrors(res.validationErrors);
      }
    }
  };

  // Explicit Activation Confirmation
  const handleActivateSeason = () => {
    const seasonIdToActivate = originalDraftId || formId.trim();

    if (!seasonIdToActivate) {
      setStatusMessage({
        type: 'danger',
        text: 'Season identifier is missing.',
      });
      return;
    }

    const res = activateSeason(seasonIdToActivate);

    if (res.success && res.season) {
      setStatusMessage({
        type: 'success',
        text: `Season "${res.season.id}" has been activated successfully!`,
      });
      refreshData();
      setViewMode('list');
      setCurrentStep(1);
      if (onSeasonActivated) {
        onSeasonActivated(res.season);
      }
    } else {
      setStatusMessage({
        type: 'danger',
        text: res.error || 'Failed to activate season.',
      });
      if (res.validationErrors) {
        setFormErrors(res.validationErrors);
        setCurrentStep(1);
      }
    }
  };

  // Discard draft with confirmation
  const handleDiscardDraft = (id: string) => {
    if (window.confirm(`Are you sure you want to discard draft "${id}"? This action cannot be undone.`)) {
      const res = discardDraft(id);
      if (res.success) {
        setStatusMessage({
          type: 'info',
          text: `Draft "${id}" discarded.`,
        });
        if (viewMode === 'create' && originalDraftId === id) {
          setViewMode('list');
        }
        refreshData();
      } else {
        setStatusMessage({
          type: 'danger',
          text: res.error || 'Failed to discard draft.',
        });
      }
    }
  };

  // ==========================================================================
  // MILESTONE 4B: BASELINE WORKFLOW HANDLERS
  // ==========================================================================

  const handleOpenBaselineSetup = (season: Season) => {
    setSelectedSeasonId(season.id);
    const initialDraft = getInitialBaselineDraft(season.id);
    setBaselinePlayers(initialDraft.players);
    setBaselineNotes(initialDraft.notes || '');
    setBaselineErrors([]);
    setCurrentStep(1);
    setViewMode('baseline');
  };

  const handleBaselineStatChange = (
    playerId: string,
    field: 'matches' | 'goals' | 'assists',
    rawVal: string
  ) => {
    const trimmed = rawVal.trim();
    const val = trimmed === '' ? null : Number(trimmed);

    setBaselinePlayers((prev) =>
      prev.map((p) => {
        if (p.playerId !== playerId) return p;
        return {
          ...p,
          [field]: val !== null && !isNaN(val) && val >= 0 && Number.isInteger(val) ? val : val === null ? null : val,
        };
      })
    );
  };

  const handleBaselineRoleChange = (playerId: string, role: PlayerRoleClassification) => {
    setBaselinePlayers((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, roleClassification: role } : p))
    );
  };

  const handleSaveBaselineDraft = () => {
    if (!selectedSeasonId) return;
    const draft: SeasonBaselineDraft = {
      seasonId: selectedSeasonId,
      updatedAt: new Date().toISOString(),
      players: baselinePlayers,
      notes: baselineNotes.trim() || undefined,
    };

    const res = saveBaselineDraft(selectedSeasonId, draft);
    if (res.success) {
      setStatusMessage({
        type: 'info',
        text: 'Baseline draft saved. You can safely close or refresh without losing progress.',
      });
      refreshData();
    } else {
      setStatusMessage({
        type: 'danger',
        text: res.error || 'Failed to save baseline draft.',
      });
    }
  };

  const handleProceedToBaselineReview = () => {
    const validation = validateBaselinePlayerEntries(baselinePlayers);
    if (!validation.isValid) {
      setBaselineErrors(validation.errors);
      setStatusMessage({
        type: 'warning',
        text: `Please enter valid non-negative statistics for all 23 players (${validation.completedCount}/23 completed).`,
      });
      return;
    }

    setBaselineErrors([]);
    // Auto-save draft before proceeding
    if (selectedSeasonId) {
      saveBaselineDraft(selectedSeasonId, {
        seasonId: selectedSeasonId,
        updatedAt: new Date().toISOString(),
        players: baselinePlayers,
        notes: baselineNotes.trim() || undefined,
      });
    }
    setCurrentStep(2);
  };

  const handleConfirmBaseline = () => {
    if (!selectedSeasonId) return;

    // Cast entries to BaselinePlayerRecord
    const records: BaselinePlayerRecord[] = baselinePlayers.map((p) => ({
      playerId: p.playerId,
      roleClassification: p.roleClassification,
      matches: Number(p.matches),
      goals: Number(p.goals),
      assists: Number(p.assists),
    }));

    const res = confirmSeasonBaseline(selectedSeasonId, {
      players: records,
      notes: baselineNotes.trim() || undefined,
    });

    if (res.success && res.baseline) {
      setStatusMessage({
        type: 'success',
        text: `Baseline for "${selectedSeasonId}" confirmed and locked. It is now immutable.`,
      });
      refreshData();
      setViewMode('list');
      setCurrentStep(1);
    } else {
      setStatusMessage({
        type: 'danger',
        text: res.error || 'Failed to confirm baseline.',
      });
      if (res.errors) {
        setBaselineErrors(res.errors);
      }
    }
  };

  // ==========================================================================
  // MILESTONE 4B: PROGRESS TRACKING WORKFLOW HANDLERS
  // ==========================================================================

  const handleOpenProgressEntry = (season: Season) => {
    if (!season.baseline) {
      setStatusMessage({
        type: 'warning',
        text: 'A confirmed baseline is required before recording progress.',
      });
      return;
    }

    setSelectedSeasonId(season.id);
    const initialDraft = getInitialProgressDraft(season.id);
    if (initialDraft) {
      setProgressDate(initialDraft.recordingDate || new Date().toISOString().split('T')[0]);
      setProgressNotes(initialDraft.notes || '');
      setProgressPlayers(initialDraft.players);
    }
    setProgressErrors([]);
    setConfirmDecreasesChecked(false);
    setCurrentStep(1);
    setViewMode('progress');
  };

  const handleProgressStatChange = (
    playerId: string,
    field: 'matches' | 'goals' | 'assists',
    rawVal: string
  ) => {
    const trimmed = rawVal.trim();
    const val = trimmed === '' ? null : Number(trimmed);

    setProgressPlayers((prev) =>
      prev.map((p) => {
        if (p.playerId !== playerId) return p;
        return {
          ...p,
          [field]: val !== null && !isNaN(val) && val >= 0 && Number.isInteger(val) ? val : val === null ? null : val,
        };
      })
    );
  };

  const handleSaveProgressDraft = () => {
    if (!selectedSeasonId) return;
    const draft: SeasonProgressDraft = {
      seasonId: selectedSeasonId,
      recordingDate: progressDate,
      updatedAt: new Date().toISOString(),
      players: progressPlayers,
      notes: progressNotes.trim() || undefined,
    };

    const res = saveProgressDraft(selectedSeasonId, draft);
    if (res.success) {
      setStatusMessage({
        type: 'info',
        text: 'Progress draft saved successfully.',
      });
      refreshData();
    } else {
      setStatusMessage({
        type: 'danger',
        text: res.error || 'Failed to save progress draft.',
      });
    }
  };

  const handleProceedToProgressReview = () => {
    if (!currentSelectedSeason || !currentSelectedSeason.baseline) return;

    // Check all 23 cards entered
    const invalidList: string[] = [];
    for (const p of progressPlayers) {
      if (!isValidStatValue(p.matches) || !isValidStatValue(p.goals) || !isValidStatValue(p.assists)) {
        const name = playerMap.get(p.playerId)?.name || p.playerId;
        invalidList.push(`${name} (${p.playerId}) has incomplete or invalid values.`);
      }
    }

    if (invalidList.length > 0) {
      setProgressErrors(invalidList);
      setStatusMessage({
        type: 'warning',
        text: `Please enter valid cumulative values for all 23 players (${23 - invalidList.length}/23 completed).`,
      });
      return;
    }

    // Calculate deltas and check for decreases
    const records: ProgressPlayerRecord[] = progressPlayers.map((p) => ({
      playerId: p.playerId,
      matches: Number(p.matches),
      goals: Number(p.goals),
      assists: Number(p.assists),
    }));

    const deltaResult = calculatePlayerStatDeltas(
      currentSelectedSeason,
      records,
      playerMetaMap
    );

    setCalculatedDeltas(deltaResult.deltas);
    setDecreaseWarnings(deltaResult.decreaseWarnings);
    setProgressErrors([]);
    setConfirmDecreasesChecked(false);
    setCurrentStep(2);
  };

  const handleConfirmProgressSnapshot = () => {
    if (!selectedSeasonId) return;

    const records: ProgressPlayerRecord[] = progressPlayers.map((p) => ({
      playerId: p.playerId,
      matches: Number(p.matches),
      goals: Number(p.goals),
      assists: Number(p.assists),
    }));

    const res = confirmProgressSnapshot(selectedSeasonId, {
      recordingDate: progressDate,
      players: records,
      notes: progressNotes.trim() || undefined,
      confirmDecreases: confirmDecreasesChecked,
      playerMetadataMap: playerMetaMap,
    });

    if (res.success && res.snapshot) {
      setStatusMessage({
        type: 'success',
        text: `Progress snapshot for ${res.snapshot.recordingDate} recorded successfully!`,
      });
      refreshData();
      setViewMode('list');
      setCurrentStep(1);
    } else {
      setStatusMessage({
        type: 'danger',
        text: res.error || 'Failed to confirm progress snapshot.',
      });
      if (res.decreaseWarnings) {
        setDecreaseWarnings(res.decreaseWarnings);
      }
    }
  };

  const handleViewSnapshotDetail = (snapshot: SeasonProgressSnapshot) => {
    if (!currentSelectedSeason || !currentSelectedSeason.baseline) return;

    const deltaResult = calculatePlayerStatDeltas(
      currentSelectedSeason,
      snapshot.players,
      playerMetaMap
    );

    setSelectedSnapshot(snapshot);
    setCalculatedDeltas(deltaResult.deltas);
    setViewMode('snapshot-detail');
  };

  // ==========================================================================
  // MILESTONE 4C1: RANK & REWARD WORKFLOW HANDLERS
  // ==========================================================================

  const handleOpenRankModal = (season: Season) => {
    setRankModalSeason(season);
    setRankInputValue(season.finalRank != null ? String(season.finalRank) : '');
    setRankModalError(null);
  };

  const handleCloseRankModal = () => {
    setRankModalSeason(null);
    setRankInputValue('');
    setRankModalError(null);
  };

  const handleSaveRank = () => {
    if (!rankModalSeason) return;

    const trimmed = rankInputValue.trim();
    if (trimmed === '') {
      // Clear final rank
      const res = setSeasonRank(rankModalSeason.id, null);
      if (res.success && res.season) {
        setStatusMessage({
          type: 'info',
          text: `Final rank cleared for season "${rankModalSeason.id}". Eligibility reset to Eligibility Unknown.`,
        });
        refreshData();
        handleCloseRankModal();
      } else {
        setRankModalError(res.error || 'Failed to update rank.');
      }
      return;
    }

    const rankNum = Number(trimmed);
    if (isNaN(rankNum) || !Number.isInteger(rankNum) || rankNum < 1) {
      setRankModalError(
        'Rank must be a positive whole number (1 or greater). Zero, negative, and fractional values are invalid.'
      );
      return;
    }

    const res = setSeasonRank(rankModalSeason.id, rankNum);
    if (res.success && res.season) {
      const eligibilityStatus = res.season.rewardEligibility;
      setStatusMessage({
        type: 'success',
        text: `Final rank for "${rankModalSeason.id}" updated to #${rankNum.toLocaleString()} (${eligibilityStatus}).`,
      });
      refreshData();
      handleCloseRankModal();
    } else {
      setRankModalError(res.error || 'Failed to update rank.');
    }
  };

  const handleOpenRewardModal = (season: Season) => {
    if (season.rewardEligibility !== 'Eligible') {
      setStatusMessage({
        type: 'danger',
        text: 'Reward claim unavailable: season final rank does not qualify (must be rank 1–100,000).',
      });
      return;
    }

    if (season.rewardAcquisition) {
      setStatusMessage({
        type: 'warning',
        text: 'A reward card has already been acquired for this season (limit 1).',
      });
      return;
    }

    setRewardModalSeason(season);
    setRewardCardName('');
    setRewardCardDescription('');
    setRewardAcquiredDate(new Date().toISOString().split('T')[0]);
    setRewardNotes('');
    setRewardConfirmedCheckbox(false);
    setRewardModalError(null);
  };

  const handleCloseRewardModal = () => {
    setRewardModalSeason(null);
    setRewardCardName('');
    setRewardCardDescription('');
    setRewardNotes('');
    setRewardConfirmedCheckbox(false);
    setRewardModalError(null);
  };

  const handleSaveReward = () => {
    if (!rewardModalSeason) return;

    const trimmedCardName = rewardCardName.trim();
    if (!trimmedCardName) {
      setRewardModalError('Reward card name is required.');
      return;
    }

    const trimmedDate = rewardAcquiredDate.trim();
    if (!trimmedDate || isNaN(new Date(trimmedDate).getTime())) {
      setRewardModalError('A valid acquisition date (YYYY-MM-DD) is required.');
      return;
    }

    if (!rewardConfirmedCheckbox) {
      setRewardModalError('Please check the confirmation box to verify this reward acquisition.');
      return;
    }

    const res = recordSeasonReward(rewardModalSeason.id, {
      cardName: trimmedCardName,
      cardDescription: rewardCardDescription.trim() || undefined,
      acquiredDate: trimmedDate,
      notes: rewardNotes.trim() || undefined,
    });

    if (res.success && res.acquisition) {
      setStatusMessage({
        type: 'success',
        text: `Reward card "${res.acquisition.cardName}" recorded successfully for season "${rewardModalSeason.id}"!`,
      });
      refreshData();
      handleCloseRewardModal();
    } else {
      setRewardModalError(res.error || 'Failed to record reward.');
    }
  };

  // ==========================================================================
  // MILESTONE 4C2: FINAL SEASON REVIEW & CLOSURE WORKFLOW HANDLERS
  // ==========================================================================

  const handleOpenClosureReview = (season: Season) => {
    setSelectedSeasonId(season.id);
    setReviewSeasonId(season.id);
    const summary = getSeasonReviewSummary(season.id, playerMetaMap);
    setReviewSummary(summary);
    setReviewTab('all');
    setAcknowledgedIncompleteChecked(false);
    setClosureNotesInput('');
    setClosureError(null);
    setViewMode('close-review');
  };

  const handleOpenClosedDetail = (season: Season) => {
    setSelectedSeasonId(season.id);
    setClosedDetailSeasonId(season.id);
    setClosedDetailTab('all');
    setViewMode('closed-detail');
  };

  const handleConfirmClosure = () => {
    if (!reviewSeasonId || !reviewSummary) return;

    setIsClosing(true);
    setClosureError(null);

    const currentSeason = seasons.find((s) => s.id === reviewSeasonId);
    const result = closeSeason({
      seasonId: reviewSeasonId,
      expectedUpdatedAt: currentSeason?.updatedAt,
      acknowledgedIncompleteData: acknowledgedIncompleteChecked,
      closureNotes: closureNotesInput.trim() || undefined,
    });

    setIsClosing(false);

    if (result.success && result.season) {
      setIsConfirmCloseModalOpen(false);
      setStatusMessage({
        type: 'success',
        text: `Season "${result.season.id}" has been successfully closed and frozen into an immutable historical record.`,
      });
      refreshData();
      setClosedDetailSeasonId(result.season.id);
      setViewMode('closed-detail');
    } else {
      setClosureError(result.error || 'Failed to close season.');
    }
  };

  // Counters
  const activeSeasonCount = seasons.filter((s) => s.status === 'Active').length;
  const baselineCompletedCount = baselinePlayers.filter(
    (p) => isValidStatValue(p.matches) && isValidStatValue(p.goals) && isValidStatValue(p.assists)
  ).length;
  const progressCompletedCount = progressPlayers.filter(
    (p) => isValidStatValue(p.matches) && isValidStatValue(p.goals) && isValidStatValue(p.assists)
  ).length;

  return (
    <div className={styles.container}>
      {/* Top Header & Context Actions */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className={styles.heading}>
              {viewMode === 'close-review'
                ? 'Season Review & Closure'
                : viewMode === 'closed-detail'
                ? 'Historical Season Record'
                : 'Seasons & Phases'}
            </h1>
            {viewMode === 'list' && activeSeasonCount > 0 && (
              <Badge variant="lime" size="sm">
                {activeSeasonCount} Active
              </Badge>
            )}
            {viewMode === 'closed-detail' && (
              <Badge variant="purple" size="sm" icon={<Lock size={12} />}>
                Frozen / Immutable
              </Badge>
            )}
          </div>
          <p className={styles.subheading}>
            {viewMode === 'close-review'
              ? 'Inspect confirmed records and review closure summary before final confirmation'
              : viewMode === 'closed-detail'
              ? 'Read-only frozen snapshot of closed eFootball season'
              : 'Manage eFootball competition phases, player statistics baselines, and progress deltas'}
          </p>
        </div>

        <div className={styles.actionsArea}>
          {viewMode === 'list' ? (
            <Button
              variant="primary"
              icon={<PlusCircle size={18} />}
              onClick={handleStartNewSeason}
            >
              Start New Season
            </Button>
          ) : (
            <Button
              variant="secondary"
              icon={<ArrowLeft size={18} />}
              onClick={() => {
                clearActiveDraftPointer();
                setViewMode('list');
              }}
            >
              Back to Seasons
            </Button>
          )}
        </div>
      </div>

      {/* Dynamic Status / Feedback Alert Banner */}
      {statusMessage && (
        <div
          className={`${styles.banner} ${
            statusMessage.type === 'success'
              ? styles.bannerSuccess
              : statusMessage.type === 'warning'
              ? styles.bannerWarning
              : statusMessage.type === 'danger'
              ? styles.bannerDanger
              : styles.bannerInfo
          }`}
          role="alert"
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-neon-lime" />
          ) : (
            <AlertCircle size={18} />
          )}
          <div className={styles.bannerContent}>{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-muted hover:text-white"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}

      {/* In-Progress Season Creation Draft Banner (List Mode) */}
      {viewMode === 'list' && activeDraftSeason && (
        <div className={`${styles.banner} ${styles.bannerInfo}`} role="status">
          <Clock size={18} className="text-neon-blue" />
          <div className={styles.bannerContent}>
            <strong>Draft in Progress:</strong> You have an uncompleted season draft (
            <em>{activeDraftSeason.id}</em>). You can resume editing or review it anytime.
          </div>
          <div className={styles.bannerActions}>
            <Button
              variant="blue"
              size="sm"
              icon={<Sparkles size={14} />}
              onClick={handleResumeDraft}
            >
              Resume Draft
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => handleDiscardDraft(activeDraftSeason.id)}
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 1: GUIDED SEASON CREATION FLOW (Milestone 4A)
          ===================================================================== */}
      {viewMode === 'create' && (
        <Card variant="glass" padding="lg" className={styles.formCard}>
          <div className={styles.stepIndicator}>
            <div className={styles.stepPills}>
              <div
                className={`${styles.stepPill} ${
                  currentStep === 1 ? styles.stepPillActive : styles.stepPillCompleted
                }`}
              >
                <span className={styles.stepNumber}>1</span>
                <span>Season Setup</span>
              </div>
              <ArrowRight size={14} className="text-muted" />
              <div
                className={`${styles.stepPill} ${
                  currentStep === 2 ? styles.stepPillActive : ''
                }`}
              >
                <span className={styles.stepNumber}>2</span>
                <span>Review & Activation</span>
              </div>
            </div>

            <Badge variant={currentStep === 1 ? 'blue' : 'lime'} size="sm">
              {currentStep === 1 ? 'Step 1 of 2' : 'Final Step'}
            </Badge>
          </div>

          {currentStep === 1 ? (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="seasonId" className={styles.label}>
                  <span>
                    Season / Phase Identifier
                    <span className={styles.requiredMark}>*</span>
                  </span>
                </label>
                <input
                  id="seasonId"
                  type="text"
                  className={`${styles.input} ${formErrors.id ? styles.inputError : ''}`}
                  placeholder="e.g. Phase 1 - Season 2024, Phase 2, Season 1"
                  value={formId}
                  onChange={(e) => {
                    setFormId(e.target.value);
                    if (formErrors.id) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.id;
                        return next;
                      });
                    }
                  }}
                  autoFocus
                />
                <span className={styles.helperText}>
                  Unique name for this competition phase. Cannot duplicate existing seasons.
                </span>
                {formErrors.id && (
                  <div className={styles.errorMessage} role="alert">
                    <AlertCircle size={14} />
                    <span>{formErrors.id}</span>
                  </div>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="startDate" className={styles.label}>
                    <span>
                      Start Date
                      <span className={styles.requiredMark}>*</span>
                    </span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className={`${styles.input} ${
                      formErrors.startDate ? styles.inputError : ''
                    }`}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (formErrors.startDate) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.startDate;
                          return next;
                        });
                      }
                    }}
                  />
                  <span className={styles.helperText}>Date when this season begins</span>
                  {formErrors.startDate && (
                    <div className={styles.errorMessage} role="alert">
                      <AlertCircle size={14} />
                      <span>{formErrors.startDate}</span>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="startingDivision" className={styles.label}>
                    <span>
                      Starting Division
                      <span className={styles.requiredMark}>*</span>
                    </span>
                  </label>
                  <select
                    id="startingDivision"
                    className={`${styles.select} ${
                      formErrors.startingDivision ? styles.selectError : ''
                    }`}
                    value={startingDivision}
                    onChange={(e) => {
                      setStartingDivision(Number(e.target.value));
                      if (formErrors.startingDivision) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.startingDivision;
                          return next;
                        });
                      }
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((div) => (
                      <option key={div} value={div}>
                        Division {div}
                      </option>
                    ))}
                  </select>
                  <span className={styles.helperText}>
                    Initial eFootball division assigned at phase reset
                  </span>
                  {formErrors.startingDivision && (
                    <div className={styles.errorMessage} role="alert">
                      <AlertCircle size={14} />
                      <span>{formErrors.startingDivision}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="notes" className={styles.label}>
                  <span>Optional Notes & Strategy</span>
                </label>
                <textarea
                  id="notes"
                  className={styles.textarea}
                  placeholder="Record tactical plans, target division, key player targets, or custom milestones..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <span className={styles.helperText}>
                  Private notes for reference during this season
                </span>
              </div>

              <div className={styles.formFooterActions}>
                <div className={styles.leftGroup}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setViewMode('list')}
                  >
                    Cancel
                  </Button>
                </div>

                <div className={styles.rightGroup}>
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<Save size={16} />}
                    onClick={handleSaveDraft}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    iconRight={<ArrowRight size={16} />}
                    onClick={handleProceedToReview}
                  >
                    Review Details
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.formGrid}>
              <div className={styles.reviewBox}>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Season / Phase Identifier</span>
                  <span className={styles.reviewValue}>{formId}</span>
                </div>

                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Start Date</span>
                  <span className={styles.reviewValue}>{startDate}</span>
                </div>

                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Starting Division</span>
                  <span className={styles.reviewValue}>Division {startingDivision}</span>
                </div>

                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Status Upon Activation</span>
                  <Badge variant="lime" size="sm">
                    Active
                  </Badge>
                </div>

                {notes && (
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Notes</span>
                    <span
                      className={styles.reviewValue}
                      style={{ fontWeight: 400, textAlign: 'left' }}
                    >
                      {notes}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.calloutCard}>
                <Sparkles size={20} className="text-neon-lime" style={{ flexShrink: 0 }} />
                <div className={styles.calloutText}>
                  <span className={styles.calloutHighlight}>Ready to activate:</span>{' '}
                  Confirming activation will mark this season as{' '}
                  <strong>Active</strong>. Starting baseline snapshots and division progress
                  tracking will be linked to this season.
                </div>
              </div>

              <div className={styles.formFooterActions}>
                <div className={styles.leftGroup}>
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<ArrowLeft size={16} />}
                    onClick={() => setCurrentStep(1)}
                  >
                    Edit Details
                  </Button>
                </div>

                <div className={styles.rightGroup}>
                  <Button
                    type="button"
                    variant="outline"
                    icon={<Save size={16} />}
                    onClick={() => {
                      handleSaveDraft();
                      setViewMode('list');
                    }}
                  >
                    Keep as Draft
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    icon={<CheckCircle2 size={16} />}
                    onClick={handleActivateSeason}
                  >
                    Activate Season
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* =====================================================================
          VIEW 2: BASELINE SETUP & REVIEW FLOW (Milestone 4B)
          ===================================================================== */}
      {viewMode === 'baseline' && currentSelectedSeason && (
        <Card variant="glass" padding="lg">
          <div className={styles.subHeaderBar}>
            <div>
              <h2 className={styles.heading}>
                Starting Baseline: {currentSelectedSeason.id}
              </h2>
              <p className={styles.subheading}>
                Record cumulative statistics at season start for all 23 player cards
              </p>
            </div>

            <div
              className={`${styles.completionPill} ${
                baselineCompletedCount === 23 ? styles.completionPillComplete : ''
              }`}
            >
              <CheckCircle2 size={16} />
              <span>
                {baselineCompletedCount}/23 Players Completed
              </span>
            </div>
          </div>

          {currentStep === 1 ? (
            /* Baseline Step 1: Input Table */
            <div>
              <div className={styles.sectionTabs}>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${
                    baselineTab === 'all' ? styles.sectionTabActive : ''
                  }`}
                  onClick={() => setBaselineTab('all')}
                >
                  All Players (23)
                </button>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${
                    baselineTab === 'starters' ? styles.sectionTabActive : ''
                  }`}
                  onClick={() => setBaselineTab('starters')}
                >
                  Starting XI ({baselinePlayers.filter((p) => p.roleClassification === 'Starting XI').length})
                </button>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${
                    baselineTab === 'subs' ? styles.sectionTabActive : ''
                  }`}
                  onClick={() => setBaselineTab('subs')}
                >
                  Substitutes ({baselinePlayers.filter((p) => p.roleClassification === 'Substitute').length})
                </button>
              </div>

              {baselineErrors.length > 0 && (
                <div className={`${styles.banner} ${styles.bannerDanger}`} style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={18} />
                  <div className={styles.bannerContent}>
                    <strong>Validation errors encountered:</strong>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      {baselineErrors.slice(0, 4).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {baselineErrors.length > 4 && <li>...and {baselineErrors.length - 4} more.</li>}
                    </ul>
                  </div>
                </div>
              )}

              <div className={styles.tableContainer}>
                <table className={styles.statsTable}>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Baseline Role</th>
                      <th style={{ textAlign: 'right' }}>Matches</th>
                      <th style={{ textAlign: 'right' }}>Goals</th>
                      <th style={{ textAlign: 'right' }}>Assists</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baselinePlayers
                      .filter((p) => {
                        if (baselineTab === 'starters') return p.roleClassification === 'Starting XI';
                        if (baselineTab === 'subs') return p.roleClassification === 'Substitute';
                        return true;
                      })
                      .map((p) => {
                        const player = playerMap.get(p.playerId);

                        return (
                          <tr key={p.playerId}>
                            <td>
                              <div className={styles.playerCell}>
                                <div className={styles.playerIdentity}>
                                  <span className={styles.playerNameText}>
                                    {player?.name || p.playerId}
                                  </span>
                                  <div className={styles.playerMetaRow}>
                                    <span className={styles.idBadge}>{p.playerId}</span>
                                    <span className={styles.posChip}>{player?.primaryPosition || '—'}</span>
                                    {player?.overallRating && (
                                      <span className="text-neon-lime" style={{ fontWeight: 700 }}>
                                        {player.overallRating}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <select
                                className={styles.roleSelect}
                                value={p.roleClassification}
                                onChange={(e) =>
                                  handleBaselineRoleChange(
                                    p.playerId,
                                    e.target.value as PlayerRoleClassification
                                  )
                                }
                              >
                                <option value="Starting XI">Starting XI</option>
                                <option value="Substitute">Substitute</option>
                              </select>
                            </td>

                            <td style={{ textAlign: 'right' }}>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="—"
                                className={`${styles.statInput} ${
                                  p.matches !== null ? styles.statInputFilled : styles.statInputEmpty
                                }`}
                                value={p.matches !== null ? p.matches : ''}
                                onChange={(e) =>
                                  handleBaselineStatChange(p.playerId, 'matches', e.target.value)
                                }
                              />
                            </td>

                            <td style={{ textAlign: 'right' }}>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="—"
                                className={`${styles.statInput} ${
                                  p.goals !== null ? styles.statInputFilled : styles.statInputEmpty
                                }`}
                                value={p.goals !== null ? p.goals : ''}
                                onChange={(e) =>
                                  handleBaselineStatChange(p.playerId, 'goals', e.target.value)
                                }
                              />
                            </td>

                            <td style={{ textAlign: 'right' }}>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="—"
                                className={`${styles.statInput} ${
                                  p.assists !== null ? styles.statInputFilled : styles.statInputEmpty
                                }`}
                                value={p.assists !== null ? p.assists : ''}
                                onChange={(e) =>
                                  handleBaselineStatChange(p.playerId, 'assists', e.target.value)
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <label htmlFor="baseNotes" className={styles.label}>
                  Optional Baseline Notes
                </label>
                <textarea
                  id="baseNotes"
                  className={styles.textarea}
                  placeholder="Record baseline source notes (e.g. In-game card records on Oct 20, 2024)..."
                  value={baselineNotes}
                  onChange={(e) => setBaselineNotes(e.target.value)}
                />
              </div>

              <div className={styles.formFooterActions}>
                <div className={styles.leftGroup}>
                  <Button variant="ghost" onClick={() => setViewMode('list')}>
                    Back to Seasons
                  </Button>
                </div>

                <div className={styles.rightGroup}>
                  <Button
                    variant="secondary"
                    icon={<Save size={16} />}
                    onClick={handleSaveBaselineDraft}
                  >
                    Save Baseline Draft
                  </Button>
                  <Button
                    variant="primary"
                    iconRight={<ArrowRight size={16} />}
                    onClick={handleProceedToBaselineReview}
                  >
                    Review Baseline
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Baseline Step 2: Review and Confirmation */
            <div>
              <div className={styles.calloutCard} style={{ marginBottom: '1.5rem' }}>
                <ShieldCheck size={24} className="text-neon-lime" style={{ flexShrink: 0 }} />
                <div className={styles.calloutText}>
                  <span className={styles.calloutHighlight}>Immutable Reference:</span> Confirming
                  this baseline locks cumulative starting statistics for all 23 authentic player cards.
                  Once confirmed, normal progress updates will calculate deltas against these values and
                  cannot overwrite them.
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.statsTable}>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'right' }}>Starting Matches</th>
                      <th style={{ textAlign: 'right' }}>Starting Goals</th>
                      <th style={{ textAlign: 'right' }}>Starting Assists</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baselinePlayers.map((p) => {
                      const player = playerMap.get(p.playerId);
                      return (
                        <tr key={p.playerId}>
                          <td>
                            <div className={styles.playerCell}>
                              <div className={styles.playerIdentity}>
                                <span className={styles.playerNameText}>
                                  {player?.name || p.playerId}
                                </span>
                                <div className={styles.playerMetaRow}>
                                  <span className={styles.idBadge}>{p.playerId}</span>
                                  <span className={styles.posChip}>{player?.primaryPosition || '—'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <Badge
                              variant={p.roleClassification === 'Starting XI' ? 'blue' : 'purple'}
                              size="sm"
                            >
                              {p.roleClassification}
                            </Badge>
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.matches}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.goals}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.assists}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.formFooterActions}>
                <div className={styles.leftGroup}>
                  <Button
                    variant="secondary"
                    icon={<ArrowLeft size={16} />}
                    onClick={() => setCurrentStep(1)}
                  >
                    Edit Baseline
                  </Button>
                </div>

                <div className={styles.rightGroup}>
                  <Button
                    variant="primary"
                    icon={<CheckCircle2 size={16} />}
                    onClick={handleConfirmBaseline}
                  >
                    Confirm & Lock Baseline
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* =====================================================================
          VIEW 3: PROGRESS TRACKING FLOW (Milestone 4B)
          ===================================================================== */}
      {viewMode === 'progress' && currentSelectedSeason && currentSelectedSeason.baseline && (
        <Card variant="glass" padding="lg">
          <div className={styles.subHeaderBar}>
            <div>
              <h2 className={styles.heading}>
                Record Season Progress: {currentSelectedSeason.id}
              </h2>
              <p className={styles.subheading}>
                Enter updated cumulative statistics for all 23 cards to compute season deltas
              </p>
            </div>

            <div
              className={`${styles.completionPill} ${
                progressCompletedCount === 23 ? styles.completionPillComplete : ''
              }`}
            >
              <CheckCircle2 size={16} />
              <span>{progressCompletedCount}/23 Cards Entered</span>
            </div>
          </div>

          {currentStep === 1 ? (
            /* Progress Step 1: Input Table */
            <div>
              <div className={styles.formRow} style={{ marginBottom: '1.25rem' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="progDate" className={styles.label}>
                    Recording Date
                  </label>
                  <input
                    id="progDate"
                    type="date"
                    className={styles.input}
                    value={progressDate}
                    onChange={(e) => setProgressDate(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="progNotes" className={styles.label}>
                    Snapshot Notes
                  </label>
                  <input
                    id="progNotes"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Division 2 promotion milestone, Weekend league results..."
                    value={progressNotes}
                    onChange={(e) => setProgressNotes(e.target.value)}
                  />
                </div>
              </div>

              {progressErrors.length > 0 && (
                <div className={`${styles.banner} ${styles.bannerDanger}`} style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={18} />
                  <div className={styles.bannerContent}>
                    <strong>Validation errors:</strong>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      {progressErrors.slice(0, 4).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className={styles.sectionTabs}>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${
                    progressTab === 'all' ? styles.sectionTabActive : ''
                  }`}
                  onClick={() => setProgressTab('all')}
                >
                  All Players (23)
                </button>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${
                    progressTab === 'starters' ? styles.sectionTabActive : ''
                  }`}
                  onClick={() => setProgressTab('starters')}
                >
                  Starting XI ({progressPlayers.filter((p) => {
                    const baseP = currentSelectedSeason.baseline?.players.find((bp) => bp.playerId === p.playerId);
                    return baseP?.roleClassification === 'Starting XI';
                  }).length})
                </button>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${
                    progressTab === 'subs' ? styles.sectionTabActive : ''
                  }`}
                  onClick={() => setProgressTab('subs')}
                >
                  Substitutes ({progressPlayers.filter((p) => {
                    const baseP = currentSelectedSeason.baseline?.players.find((bp) => bp.playerId === p.playerId);
                    return baseP?.roleClassification === 'Substitute';
                  }).length})
                </button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.statsTable}>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'right' }}>Cumulative Matches</th>
                      <th style={{ textAlign: 'right' }}>Cumulative Goals</th>
                      <th style={{ textAlign: 'right' }}>Cumulative Assists</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressPlayers
                      .filter((p) => {
                        const baseP = currentSelectedSeason.baseline?.players.find(
                          (bp) => bp.playerId === p.playerId
                        );
                        if (progressTab === 'starters') return baseP?.roleClassification === 'Starting XI';
                        if (progressTab === 'subs') return baseP?.roleClassification === 'Substitute';
                        return true;
                      })
                      .map((p) => {
                      const player = playerMap.get(p.playerId);
                      const baseP = currentSelectedSeason.baseline?.players.find(
                        (bp) => bp.playerId === p.playerId
                      );

                      return (
                        <tr key={p.playerId}>
                          <td>
                            <div className={styles.playerCell}>
                              <div className={styles.playerIdentity}>
                                <span className={styles.playerNameText}>
                                  {player?.name || p.playerId}
                                </span>
                                <div className={styles.playerMetaRow}>
                                  <span className={styles.idBadge}>{p.playerId}</span>
                                  <span className={styles.posChip}>{player?.primaryPosition || '—'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <Badge
                              variant={baseP?.roleClassification === 'Starting XI' ? 'blue' : 'purple'}
                              size="sm"
                            >
                              {baseP?.roleClassification || '—'}
                            </Badge>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="—"
                              className={`${styles.statInput} ${
                                p.matches !== null ? styles.statInputFilled : styles.statInputEmpty
                              }`}
                              value={p.matches !== null ? p.matches : ''}
                              onChange={(e) =>
                                handleProgressStatChange(p.playerId, 'matches', e.target.value)
                              }
                            />
                            <span className={styles.statReferenceVal}>
                              Base: {baseP?.matches ?? 0}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="—"
                              className={`${styles.statInput} ${
                                p.goals !== null ? styles.statInputFilled : styles.statInputEmpty
                              }`}
                              value={p.goals !== null ? p.goals : ''}
                              onChange={(e) =>
                                handleProgressStatChange(p.playerId, 'goals', e.target.value)
                              }
                            />
                            <span className={styles.statReferenceVal}>
                              Base: {baseP?.goals ?? 0}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="—"
                              className={`${styles.statInput} ${
                                p.assists !== null ? styles.statInputFilled : styles.statInputEmpty
                              }`}
                              value={p.assists !== null ? p.assists : ''}
                              onChange={(e) =>
                                handleProgressStatChange(p.playerId, 'assists', e.target.value)
                              }
                            />
                            <span className={styles.statReferenceVal}>
                              Base: {baseP?.assists ?? 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.formFooterActions}>
                <div className={styles.leftGroup}>
                  <Button variant="ghost" onClick={() => setViewMode('list')}>
                    Back to Seasons
                  </Button>
                </div>

                <div className={styles.rightGroup}>
                  <Button
                    variant="secondary"
                    icon={<Save size={16} />}
                    onClick={handleSaveProgressDraft}
                  >
                    Save Progress Draft
                  </Button>
                  <Button
                    variant="primary"
                    iconRight={<ArrowRight size={16} />}
                    onClick={handleProceedToProgressReview}
                  >
                    Review Deltas
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Progress Step 2: Deltas Review & Confirmation */
            <div>
              {/* Decrease Warning Box if any stat decreased */}
              {decreaseWarnings.length > 0 && (
                <div className={styles.decreaseWarningBox}>
                  <div className={styles.decreaseWarningHeader}>
                    <AlertTriangle size={20} />
                    <span>Stat Decrease Warning</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    One or more cumulative statistics are lower than the previous record.
                    This may represent a data-entry error or a corrected source value.
                  </p>
                  <ul className={styles.decreaseList}>
                    {decreaseWarnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                  <label className={styles.decreaseCheckboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.decreaseCheckbox}
                      checked={confirmDecreasesChecked}
                      onChange={(e) => setConfirmDecreasesChecked(e.target.checked)}
                    />
                    <span>I confirm that these decreased values are intentional source corrections.</span>
                  </label>
                </div>
              )}

              <div className={styles.tableContainer} style={{ marginTop: '1rem' }}>
                <table className={styles.statsTable}>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'center' }}>Matches (Delta)</th>
                      <th style={{ textAlign: 'center' }}>Goals (Delta)</th>
                      <th style={{ textAlign: 'center' }}>Assists (Delta)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedDeltas.map((d) => (
                      <tr key={d.playerId}>
                        <td>
                          <div className={styles.playerCell}>
                            <div className={styles.playerIdentity}>
                              <span className={styles.playerNameText}>{d.playerName}</span>
                              <div className={styles.playerMetaRow}>
                                <span className={styles.idBadge}>{d.playerId}</span>
                                <span className={styles.posChip}>{d.position}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <Badge
                            variant={d.roleClassification === 'Starting XI' ? 'blue' : 'purple'}
                            size="sm"
                          >
                            {d.roleClassification}
                          </Badge>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                            {d.currentMatches}
                          </span>
                          <span
                            className={`${styles.deltaPill} ${
                              d.matchesDelta > 0
                                ? styles.deltaPositive
                                : d.matchesDelta < 0
                                ? styles.deltaNegative
                                : styles.deltaZero
                            }`}
                          >
                            {d.matchesDelta > 0 ? `+${d.matchesDelta}` : d.matchesDelta}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                            {d.currentGoals}
                          </span>
                          <span
                            className={`${styles.deltaPill} ${
                              d.goalsDelta > 0
                                ? styles.deltaPositive
                                : d.goalsDelta < 0
                                ? styles.deltaNegative
                                : styles.deltaZero
                            }`}
                          >
                            {d.goalsDelta > 0 ? `+${d.goalsDelta}` : d.goalsDelta}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                            {d.currentAssists}
                          </span>
                          <span
                            className={`${styles.deltaPill} ${
                              d.assistsDelta > 0
                                ? styles.deltaPositive
                                : d.assistsDelta < 0
                                ? styles.deltaNegative
                                : styles.deltaZero
                            }`}
                          >
                            {d.assistsDelta > 0 ? `+${d.assistsDelta}` : d.assistsDelta}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.formFooterActions}>
                <div className={styles.leftGroup}>
                  <Button
                    variant="secondary"
                    icon={<ArrowLeft size={16} />}
                    onClick={() => setCurrentStep(1)}
                  >
                    Edit Values
                  </Button>
                </div>

                <div className={styles.rightGroup}>
                  <Button
                    variant="primary"
                    icon={<CheckCircle2 size={16} />}
                    disabled={decreaseWarnings.length > 0 && !confirmDecreasesChecked}
                    onClick={handleConfirmProgressSnapshot}
                  >
                    Confirm Progress Snapshot
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* =====================================================================
          VIEW 4: SNAPSHOT DETAIL VIEW (Milestone 4B)
          ===================================================================== */}
      {viewMode === 'snapshot-detail' && selectedSnapshot && currentSelectedSeason && (
        <Card variant="glass" padding="lg">
          <div className={styles.subHeaderBar}>
            <div>
              <h2 className={styles.heading}>
                Progress Snapshot: {selectedSnapshot.recordingDate}
              </h2>
              <p className={styles.subheading}>
                Recorded on {new Date(selectedSnapshot.recordedAt).toLocaleString()} • {currentSelectedSeason.id}
              </p>
            </div>

            <Button
              variant="secondary"
              icon={<ArrowLeft size={16} />}
              onClick={() => setViewMode('list')}
            >
              Back to Seasons
            </Button>
          </div>

          {selectedSnapshot.notes && (
            <div className={styles.notesSnippet} style={{ marginBottom: '1rem' }}>
              "{selectedSnapshot.notes}"
            </div>
          )}

          <div className={styles.tableContainer}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'center' }}>Matches (Season Delta)</th>
                  <th style={{ textAlign: 'center' }}>Goals (Season Delta)</th>
                  <th style={{ textAlign: 'center' }}>Assists (Season Delta)</th>
                </tr>
              </thead>
              <tbody>
                {calculatedDeltas.map((d) => (
                  <tr key={d.playerId}>
                    <td>
                      <div className={styles.playerCell}>
                        <div className={styles.playerIdentity}>
                          <span className={styles.playerNameText}>{d.playerName}</span>
                          <div className={styles.playerMetaRow}>
                            <span className={styles.idBadge}>{d.playerId}</span>
                            <span className={styles.posChip}>{d.position}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <Badge
                        variant={d.roleClassification === 'Starting XI' ? 'blue' : 'purple'}
                        size="sm"
                      >
                        {d.roleClassification}
                      </Badge>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                        {d.currentMatches}
                      </span>
                      <span
                        className={`${styles.deltaPill} ${
                          d.matchesDelta > 0
                            ? styles.deltaPositive
                            : d.matchesDelta < 0
                            ? styles.deltaNegative
                            : styles.deltaZero
                        }`}
                      >
                        {d.matchesDelta > 0 ? `+${d.matchesDelta}` : d.matchesDelta}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                        {d.currentGoals}
                      </span>
                      <span
                        className={`${styles.deltaPill} ${
                          d.goalsDelta > 0
                            ? styles.deltaPositive
                            : d.goalsDelta < 0
                            ? styles.deltaNegative
                            : styles.deltaZero
                        }`}
                      >
                        {d.goalsDelta > 0 ? `+${d.goalsDelta}` : d.goalsDelta}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                        {d.currentAssists}
                      </span>
                      <span
                        className={`${styles.deltaPill} ${
                          d.assistsDelta > 0
                            ? styles.deltaPositive
                            : d.assistsDelta < 0
                            ? styles.deltaNegative
                            : styles.deltaZero
                        }`}
                      >
                        {d.assistsDelta > 0 ? `+${d.assistsDelta}` : d.assistsDelta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* =====================================================================
          VIEW 5: SEASONS LIST OVERVIEW
          ===================================================================== */}
      {viewMode === 'list' && (
        <>
          {seasons.length === 0 ? (
            <Card variant="glass" padding="lg">
              <EmptyState
                icon={<CalendarDays size={28} className="text-neon-blue" />}
                title="No Seasons Created Yet"
                description="Start your first eFootball season to record division campaigns, starting baselines, and performance rewards."
                action={
                  <Button
                    variant="primary"
                    icon={<PlusCircle size={18} />}
                    onClick={handleStartNewSeason}
                  >
                    Start New Season
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className={styles.seasonsGrid}>
              {seasons.map((season) => {
                const isActive = season.status === 'Active';
                const isDraft = season.status === 'Draft';
                const isClosed = season.status === 'Closed';
                const hasBaseline = Boolean(season.baseline);
                const snapshotCount = season.progressSnapshots?.length || 0;

                return (
                  <Card
                    key={season.id}
                    variant="glass"
                    padding="md"
                    className={`${styles.seasonCard} ${
                      isActive ? styles.seasonCardActive : isDraft ? styles.seasonCardDraft : isClosed ? styles.seasonCardClosed : ''
                    }`}
                  >
                    <div>
                      <div className={styles.seasonHeader}>
                        <h2 className={styles.seasonTitle}>{season.id}</h2>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <Badge
                            variant={isActive ? 'lime' : isDraft ? 'blue' : 'purple'}
                            size="sm"
                          >
                            {season.status}
                          </Badge>
                          {isClosed ? (
                            <Badge variant="purple" size="sm" icon={<Lock size={12} />}>
                              Immutable
                            </Badge>
                          ) : hasBaseline ? (
                            <Badge variant="lime" size="sm" icon={<ShieldCheck size={12} />}>
                              Baseline Locked
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              No Baseline
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className={styles.seasonMetaList}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>
                            <Layers size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Starting Division:
                          </span>
                          <span className={styles.metaVal}>Division {season.startingDivision}</span>
                        </div>

                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>
                            <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Start Date:
                          </span>
                          <span className={styles.metaVal}>{season.startDate}</span>
                        </div>

                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>
                            <History size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Snapshots:
                          </span>
                          <span className={styles.metaVal}>
                            {snapshotCount} recorded
                          </span>
                        </div>

                        {isClosed && season.closedAt && (
                          <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>
                              <Lock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              Closed Date:
                            </span>
                            <span className={styles.metaVal}>{season.closedAt.split('T')[0]}</span>
                          </div>
                        )}

                        {season.notes && (
                          <div className={styles.notesSnippet}>"{season.notes}"</div>
                        )}
                      </div>

                      {/* Milestone 4C1: Rank & Division Phase Reward Section */}
                      <div className={styles.rewardSection}>
                        <div className={styles.rewardHeader}>
                          <div className={styles.rewardTitleRow}>
                            <Trophy size={16} className={styles.rewardIcon} />
                            <span className={styles.rewardTitleText}>Phase Rank & Reward</span>
                          </div>
                          <div className={styles.rewardBadges}>
                            {/* Eligibility Badge */}
                            {season.rewardEligibility === 'Eligible' ? (
                              <Badge variant="lime" size="sm" icon={<Award size={12} />}>
                                Eligible
                              </Badge>
                            ) : season.rewardEligibility === 'Not Eligible' ? (
                              <Badge variant="danger" size="sm" icon={<AlertCircle size={12} />}>
                                Not Eligible
                              </Badge>
                            ) : (
                              <Badge variant="default" size="sm" icon={<HelpCircle size={12} />}>
                                Eligibility Unknown
                              </Badge>
                            )}

                            {/* Acquisition Badge */}
                            {season.rewardAcquisition ? (
                              <Badge variant="purple" size="sm" icon={<CheckCircle2 size={12} />}>
                                Reward Acquired
                              </Badge>
                            ) : (
                              <Badge variant="default" size="sm">
                                Not Acquired
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className={styles.rewardBody}>
                          <div className={styles.rewardRankRow}>
                            <span className={styles.rewardRankLabel}>Final Rank:</span>
                            <span className={styles.rewardRankValue}>
                              {season.finalRank != null ? `#${season.finalRank.toLocaleString()}` : 'Not Recorded'}
                            </span>
                            {!isClosed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Edit2 size={12} />}
                                onClick={() => handleOpenRankModal(season)}
                                title="Set or update season rank"
                              >
                                {season.finalRank != null ? 'Update' : 'Set Rank'}
                              </Button>
                            )}
                          </div>

                          {/* Inline Explanation */}
                          <div className={styles.rewardExplainText}>
                            {season.rewardEligibility === 'Eligible' ? (
                              <span className={styles.textSuccess}>
                                Rank qualifies for phase reward (≤ {REWARD_RANK_THRESHOLD.toLocaleString()}).
                              </span>
                            ) : season.rewardEligibility === 'Not Eligible' ? (
                              <span className={styles.textDanger}>
                                Rank exceeds {REWARD_RANK_THRESHOLD.toLocaleString()} threshold (Not eligible for reward card).
                              </span>
                            ) : (
                              <span className={styles.textMuted}>
                                Final rank not entered yet. Record rank to determine reward eligibility.
                              </span>
                            )}
                          </div>

                          {/* Acquired Card Detail or Claim Action */}
                          {season.rewardAcquisition ? (
                            <div className={styles.rewardAcquiredCard}>
                              <div className={styles.rewardAcquiredHeader}>
                                <Sparkles size={14} className={styles.sparkleIcon} />
                                <span className={styles.rewardAcquiredName}>
                                  {season.rewardAcquisition.cardName}
                                </span>
                                {season.rewardAcquisition.cardDescription && (
                                  <span className={styles.rewardAcquiredDesc}>
                                    ({season.rewardAcquisition.cardDescription})
                                  </span>
                                )}
                              </div>
                              <div className={styles.rewardAcquiredDetails}>
                                <span>Acquired: {season.rewardAcquisition.acquiredDate}</span>
                                {season.rewardAcquisition.notes && (
                                  <span className={styles.rewardAcquiredNotes}>
                                    • "{season.rewardAcquisition.notes}"
                                  </span>
                                )}
                              </div>
                              <div className={styles.rewardAcquiredLimitBadge}>
                                1 of 1 reward card claimed for this season
                              </div>
                            </div>
                          ) : isClosed ? (
                            <div className={styles.rewardActionRow}>
                              <span className={styles.rewardDisabledNotice}>
                                Season closed without reward claim ({season.rewardEligibility === 'Eligible' ? 'Unclaimed' : 'Not Eligible'}).
                              </span>
                            </div>
                          ) : (
                            <div className={styles.rewardActionRow}>
                              {season.rewardEligibility === 'Eligible' ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<Trophy size={14} />}
                                  onClick={() => handleOpenRewardModal(season)}
                                >
                                  Claim / Record Reward
                                </Button>
                              ) : (
                                <span className={styles.rewardDisabledNotice}>
                                  {season.rewardEligibility === 'Not Eligible'
                                    ? 'Reward claim unavailable (Rank does not qualify).'
                                    : 'Reward claim unavailable (Enter qualifying final rank first).'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Snapshots History Accordion (if any recorded) */}
                      {snapshotCount > 0 && (
                        <div className={styles.snapshotsSection}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Recorded Progress Snapshots:
                          </span>
                          {season.progressSnapshots!.map((snap, idx) => (
                            <div key={snap.id} className={styles.snapshotCard}>
                              <div className={styles.snapshotInfo}>
                                <span className={styles.snapshotDate}>
                                  Snapshot #{idx + 1} — {snap.recordingDate}
                                </span>
                                <span className={styles.snapshotMeta}>
                                  {snap.notes || 'No notes'}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSeasonId(season.id);
                                  handleViewSnapshotDetail(snap);
                                }}
                              >
                                View Deltas
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.dateFootnote}>
                        Created {new Date(season.createdAt).toLocaleDateString()}
                      </span>

                      {isDraft ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button
                            variant="blue"
                            size="sm"
                            onClick={() => populateFormWithDraft(season)}
                          >
                            Resume
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDiscardDraft(season.id)}
                            title="Discard Draft"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ) : isClosed ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<History size={14} />}
                            onClick={() => handleOpenClosedDetail(season)}
                          >
                            View Historical Record
                          </Button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {!hasBaseline ? (
                            <Button
                              variant="blue"
                              size="sm"
                              icon={<ShieldCheck size={14} />}
                              onClick={() => handleOpenBaselineSetup(season)}
                            >
                              Setup Baseline
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                icon={<TrendingUp size={14} />}
                                onClick={() => handleOpenProgressEntry(season)}
                              >
                                + Record Progress
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Lock size={14} />}
                                onClick={() => handleOpenClosureReview(season)}
                              >
                                Review & Close Season
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          VIEW 6: FINAL SEASON REVIEW & CLOSURE (MILESTONE 4C2)
          ===================================================================== */}
      {viewMode === 'close-review' && reviewSummary && (
        <div className={styles.reviewContainer}>
          {/* Irreversible notice */}
          <div className={styles.closureIrreversibleBox}>
            <div className={styles.closureIrreversibleTitle}>
              <AlertTriangle size={18} />
              <span>Irreversible Season Closure Warning</span>
            </div>
            <div>
              Closing a season permanently freezes all confirmed statistics, starting baseline, deltas, final rank, and reward acquisition records into an immutable historical snapshot.
              Once closed, <strong>this season cannot be reopened or edited</strong>, and no further progress snapshots can be recorded.
            </div>
          </div>

          {/* Season Overview Card */}
          <Card variant="glass" padding="lg">
            <div className={styles.reviewSectionHeader}>
              <h2 className={styles.reviewSectionTitle}>
                <Layers size={18} className="text-neon-lime" />
                Season Setup & Confirmed Baseline
              </h2>
              <Badge variant="lime" size="sm">Active Phase</Badge>
            </div>

            <div className={styles.summaryGrid} style={{ marginTop: '1rem' }}>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Season Identifier</span>
                <span className={styles.summaryStatVal} style={{ fontSize: '1.1rem' }}>{reviewSummary.seasonId}</span>
              </div>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Start Date</span>
                <span className={styles.summaryStatVal} style={{ fontSize: '1.1rem' }}>{reviewSummary.startDate}</span>
              </div>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Starting Division</span>
                <span className={styles.summaryStatVal}>Division {reviewSummary.startingDivision}</span>
              </div>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Baseline Status</span>
                <span
                  className={styles.summaryStatVal}
                  style={{
                    fontSize: '1rem',
                    color: reviewSummary.hasBaseline ? 'var(--accent-lime)' : 'var(--danger)',
                  }}
                >
                  {reviewSummary.hasBaseline ? 'Confirmed (23/23 Cards)' : 'Missing Baseline'}
                </span>
              </div>
            </div>

            {reviewSummary.notes && (
              <div className={styles.notesSnippet} style={{ marginTop: '1rem' }}>
                "{reviewSummary.notes}"
              </div>
            )}
          </Card>

          {/* Rank & Reward Section */}
          <Card variant="glass" padding="lg">
            <div className={styles.reviewSectionHeader}>
              <h2 className={styles.reviewSectionTitle}>
                <Trophy size={18} className="text-neon-lime" />
                Phase Rank & Division Reward
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {reviewSummary.rewardEligibility === 'Eligible' ? (
                  <Badge variant="lime" size="sm" icon={<Award size={12} />}>Eligible</Badge>
                ) : reviewSummary.rewardEligibility === 'Not Eligible' ? (
                  <Badge variant="danger" size="sm" icon={<AlertCircle size={12} />}>Not Eligible</Badge>
                ) : (
                  <Badge variant="default" size="sm" icon={<HelpCircle size={12} />}>Eligibility Unknown</Badge>
                )}

                {reviewSummary.isRewardAcquired ? (
                  <Badge variant="purple" size="sm" icon={<CheckCircle2 size={12} />}>Reward Acquired</Badge>
                ) : (
                  <Badge variant="default" size="sm">Not Acquired</Badge>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.rewardRankRow}>
                <span className={styles.rewardRankLabel}>Final Rank:</span>
                <span className={styles.rewardRankValue}>
                  {reviewSummary.finalRank != null ? `#${reviewSummary.finalRank.toLocaleString()}` : 'Not Recorded'}
                </span>
                {currentSelectedSeason && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 size={12} />}
                    onClick={() => handleOpenRankModal(currentSelectedSeason)}
                  >
                    {reviewSummary.finalRank != null ? 'Correct Rank' : 'Record Rank'}
                  </Button>
                )}
              </div>

              <div className={styles.rewardExplainText}>
                {reviewSummary.rewardEligibility === 'Eligible' ? (
                  <span className={styles.textSuccess}>
                    Rank qualifies for phase reward (≤ {REWARD_RANK_THRESHOLD.toLocaleString()}).
                  </span>
                ) : reviewSummary.rewardEligibility === 'Not Eligible' ? (
                  <span className={styles.textDanger}>
                    Rank exceeds {REWARD_RANK_THRESHOLD.toLocaleString()} threshold (Not eligible for reward card).
                  </span>
                ) : (
                  <span className={styles.textMuted}>
                    Final rank not recorded. Reward eligibility will remain 'Eligibility Unknown' upon closure.
                  </span>
                )}
              </div>

              {reviewSummary.rewardAcquisition ? (
                <div className={styles.rewardAcquiredCard}>
                  <div className={styles.rewardAcquiredHeader}>
                    <Sparkles size={14} className={styles.sparkleIcon} />
                    <span className={styles.rewardAcquiredName}>{reviewSummary.rewardAcquisition.cardName}</span>
                    {reviewSummary.rewardAcquisition.cardDescription && (
                      <span className={styles.rewardAcquiredDesc}>({reviewSummary.rewardAcquisition.cardDescription})</span>
                    )}
                  </div>
                  <div className={styles.rewardAcquiredDetails}>
                    <span>Acquired: {reviewSummary.rewardAcquisition.acquiredDate}</span>
                    {reviewSummary.rewardAcquisition.notes && (
                      <span className={styles.rewardAcquiredNotes}>• "{reviewSummary.rewardAcquisition.notes}"</span>
                    )}
                  </div>
                </div>
              ) : reviewSummary.rewardEligibility === 'Eligible' && currentSelectedSeason ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                  <span className={styles.textMuted} style={{ fontSize: '0.85rem' }}>
                    Eligible for division reward card:
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Trophy size={14} />}
                    onClick={() => handleOpenRewardModal(currentSelectedSeason)}
                  >
                    Claim / Record Reward Before Closure
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>

          {/* Cumulative Stats & Deltas Section */}
          <Card variant="glass" padding="lg">
            <div className={styles.reviewSectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} className="text-neon-lime" />
                <h2 className={styles.reviewSectionTitle}>
                  Confirmed Cumulative Statistics & Deltas
                </h2>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {reviewSummary.snapshotCount} Confirmed Snapshot{reviewSummary.snapshotCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Squad totals summary */}
            <div className={styles.summaryGrid} style={{ marginTop: '1rem' }}>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Total Match Delta</span>
                <span
                  className={styles.summaryStatVal}
                  style={{ color: reviewSummary.totalMatchesDelta > 0 ? 'var(--accent-lime)' : undefined }}
                >
                  {reviewSummary.totalMatchesDelta > 0 ? `+${reviewSummary.totalMatchesDelta}` : reviewSummary.totalMatchesDelta}
                </span>
              </div>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Total Goals Delta</span>
                <span
                  className={styles.summaryStatVal}
                  style={{ color: reviewSummary.totalGoalsDelta > 0 ? 'var(--accent-lime)' : undefined }}
                >
                  {reviewSummary.totalGoalsDelta > 0 ? `+${reviewSummary.totalGoalsDelta}` : reviewSummary.totalGoalsDelta}
                </span>
              </div>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Total Assists Delta</span>
                <span
                  className={styles.summaryStatVal}
                  style={{ color: reviewSummary.totalAssistsDelta > 0 ? 'var(--accent-lime)' : undefined }}
                >
                  {reviewSummary.totalAssistsDelta > 0 ? `+${reviewSummary.totalAssistsDelta}` : reviewSummary.totalAssistsDelta}
                </span>
              </div>
            </div>

            {reviewSummary.snapshotCount === 0 && (
              <div className={`${styles.banner} ${styles.bannerInfo}`} style={{ marginTop: '1rem' }}>
                <Info size={16} />
                <span>No progress snapshots were recorded for this season. Final statistics will reflect only the starting baseline.</span>
              </div>
            )}

            {/* Unconfirmed draft warning */}
            {reviewSummary.hasUnconfirmedProgressDraft && (
              <div className={`${styles.banner} ${styles.bannerWarning}`} style={{ marginTop: '0.75rem' }}>
                <AlertTriangle size={16} />
                <span>An unconfirmed progress draft exists. Closure freezes only confirmed data; unconfirmed drafts will be discarded.</span>
              </div>
            )}

            {/* Player stats table */}
            {reviewSummary.deltas.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div className={styles.sectionTabs}>
                  <button
                    type="button"
                    className={`${styles.sectionTab} ${reviewTab === 'all' ? styles.sectionTabActive : ''}`}
                    onClick={() => setReviewTab('all')}
                  >
                    All Players (23)
                  </button>
                  <button
                    type="button"
                    className={`${styles.sectionTab} ${reviewTab === 'starters' ? styles.sectionTabActive : ''}`}
                    onClick={() => setReviewTab('starters')}
                  >
                    Starting XI (11)
                  </button>
                  <button
                    type="button"
                    className={`${styles.sectionTab} ${reviewTab === 'subs' ? styles.sectionTabActive : ''}`}
                    onClick={() => setReviewTab('subs')}
                  >
                    Substitutes (12)
                  </button>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.statsTable}>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Role</th>
                        <th>Baseline (M / G / A)</th>
                        <th>Latest Confirmed (M / G / A)</th>
                        <th>Matches Δ</th>
                        <th>Goals Δ</th>
                        <th>Assists Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReviewDeltas.map((d) => (
                        <tr key={d.playerId}>
                          <td>
                            <div className={styles.playerInfo}>
                              <span className={styles.posChip}>{d.position}</span>
                              <span className={styles.playerName}>{d.playerName}</span>
                              <span className={styles.idBadge}>{d.playerId}</span>
                            </div>
                          </td>
                          <td>
                            <Badge variant={d.roleClassification === 'Starting XI' ? 'lime' : 'default'} size="sm">
                              {d.roleClassification}
                            </Badge>
                          </td>
                          <td>
                            <span className={styles.statReferenceVal}>
                              {d.baselineMatches} / {d.baselineGoals} / {d.baselineAssists}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>
                              {d.currentMatches} / {d.currentGoals} / {d.currentAssists}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.deltaPill} ${
                                d.matchesDelta > 0
                                  ? styles.deltaPositive
                                  : d.matchesDelta < 0
                                  ? styles.deltaNegative
                                  : styles.deltaZero
                              }`}
                            >
                              {d.matchesDelta > 0 ? `+${d.matchesDelta}` : d.matchesDelta}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.deltaPill} ${
                                d.goalsDelta > 0
                                  ? styles.deltaPositive
                                  : d.goalsDelta < 0
                                  ? styles.deltaNegative
                                  : styles.deltaZero
                              }`}
                            >
                              {d.goalsDelta > 0 ? `+${d.goalsDelta}` : d.goalsDelta}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.deltaPill} ${
                                d.assistsDelta > 0
                                  ? styles.deltaPositive
                                  : d.assistsDelta < 0
                                  ? styles.deltaNegative
                                  : styles.deltaZero
                              }`}
                            >
                              {d.assistsDelta > 0 ? `+${d.assistsDelta}` : d.assistsDelta}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          {/* Closure Validation & Acknowledgements */}
          {reviewSummary.blockingReasons.length > 0 ? (
            <div className={`${styles.banner} ${styles.bannerDanger}`}>
              <AlertCircle size={20} />
              <div className={styles.bannerContent}>
                <strong>Closure Blocked:</strong>
                <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                  {reviewSummary.blockingReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : reviewSummary.warnings.length > 0 ? (
            <div className={styles.acknowledgementBox}>
              <div className={styles.acknowledgementTitle}>
                <AlertTriangle size={18} />
                <span>Incomplete Season Information Notice</span>
              </div>
              <ul className={styles.warningList}>
                {reviewSummary.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
              <label className={styles.ackCheckboxLabel}>
                <input
                  type="checkbox"
                  className={styles.ackCheckbox}
                  checked={acknowledgedIncompleteChecked}
                  onChange={(e) => setAcknowledgedIncompleteChecked(e.target.checked)}
                />
                <span>
                  I acknowledge that the non-essential information listed above is incomplete, and I understand this season cannot be reopened, updated, or modified after closure.
                </span>
              </label>
            </div>
          ) : null}

          {/* Optional Closure Remarks */}
          <Card variant="glass" padding="md">
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Final Season Remarks / Notes
                <span className={styles.helperText}>(Optional)</span>
              </label>
              <textarea
                className={styles.textarea}
                rows={2}
                placeholder="e.g. Completed division campaign; solid defense with Maldini and Desailly."
                value={closureNotesInput}
                onChange={(e) => setClosureNotesInput(e.target.value)}
              />
            </div>
          </Card>

          {/* Footer Actions */}
          <div className={styles.formFooterActions}>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={16} />}
              onClick={() => setViewMode('list')}
            >
              Cancel & Return to Seasons
            </Button>

            <Button
              variant="primary"
              icon={<Lock size={16} />}
              disabled={!reviewSummary.canClose || (reviewSummary.warnings.length > 0 && !acknowledgedIncompleteChecked)}
              onClick={() => setIsConfirmCloseModalOpen(true)}
            >
              Proceed to Final Closure...
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 7: HISTORICAL CLOSED SEASON DETAIL (MILESTONE 4C2)
          ===================================================================== */}
      {viewMode === 'closed-detail' && currentClosedSeason && (
        <div className={styles.reviewContainer}>
          {/* Historical Banner */}
          <div className={styles.historicalHeaderBanner}>
            <div className={styles.historicalHeaderLeft}>
              <Lock size={24} className="text-accent-purple" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f3e8ff' }}>
                  Historical Season Record • Closed & Immutable
                </div>
                <div style={{ fontSize: '0.8rem', color: '#d8b4fe' }}>
                  Closed on {currentClosedSeason.closureSnapshot?.closedDate || currentClosedSeason.closedAt?.split('T')[0] || 'N/A'} • This record is permanently locked and cannot be edited.
                </div>
              </div>
            </div>
            {currentClosedSeason.closureSnapshot?.id && (
              <span className={styles.historicalSnapshotId}>
                Snapshot ID: {currentClosedSeason.closureSnapshot.id}
              </span>
            )}
          </div>

          {/* Metadata Card */}
          <Card variant="glass" padding="lg">
            <div className={styles.reviewSectionHeader}>
              <h2 className={styles.reviewSectionTitle}>
                <Layers size={18} className="text-accent-purple" />
                Season Identity & Parameters
              </h2>
              <Badge variant="purple" size="sm" icon={<Lock size={12} />}>
                Closed
              </Badge>
            </div>

            <div className={styles.summaryGrid} style={{ marginTop: '1rem' }}>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Season Identifier</span>
                <span className={styles.summaryStatVal} style={{ fontSize: '1.1rem' }}>{currentClosedSeason.id}</span>
              </div>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Start Date</span>
                <span className={styles.summaryStatVal} style={{ fontSize: '1.1rem' }}>{currentClosedSeason.startDate}</span>
              </div>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Starting Division</span>
                <span className={styles.summaryStatVal}>Division {currentClosedSeason.startingDivision}</span>
              </div>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Closed Timestamp</span>
                <span className={styles.summaryStatVal} style={{ fontSize: '0.85rem' }}>
                  {currentClosedSeason.closedAt ? new Date(currentClosedSeason.closedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            {currentClosedSeason.notes && (
              <div className={styles.notesSnippet} style={{ marginTop: '1rem' }}>
                <strong>Original Notes:</strong> "{currentClosedSeason.notes}"
              </div>
            )}

            {currentClosedSeason.closureNotes && (
              <div className={styles.closureRemarksBox} style={{ marginTop: '0.75rem' }}>
                <strong>Final Closure Remarks:</strong> "{currentClosedSeason.closureNotes}"
              </div>
            )}
          </Card>

          {/* Final Rank & Reward Status Card */}
          <Card variant="glass" padding="lg">
            <div className={styles.reviewSectionHeader}>
              <h2 className={styles.reviewSectionTitle}>
                <Trophy size={18} className="text-accent-purple" />
                Final Rank & Reward Result
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {currentClosedSeason.rewardEligibility === 'Eligible' ? (
                  <Badge variant="lime" size="sm" icon={<Award size={12} />}>Eligible</Badge>
                ) : currentClosedSeason.rewardEligibility === 'Not Eligible' ? (
                  <Badge variant="danger" size="sm" icon={<AlertCircle size={12} />}>Not Eligible</Badge>
                ) : (
                  <Badge variant="default" size="sm" icon={<HelpCircle size={12} />}>Eligibility Unknown</Badge>
                )}

                {currentClosedSeason.rewardAcquisition ? (
                  <Badge variant="purple" size="sm" icon={<CheckCircle2 size={12} />}>Reward Acquired</Badge>
                ) : (
                  <Badge variant="default" size="sm">Not Acquired</Badge>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className={styles.rewardRankRow}>
                <span className={styles.rewardRankLabel}>Final Rank:</span>
                <span className={styles.rewardRankValue}>
                  {currentClosedSeason.finalRank != null ? `#${currentClosedSeason.finalRank.toLocaleString()}` : 'Not Recorded (Eligibility Unknown)'}
                </span>
              </div>

              {currentClosedSeason.rewardAcquisition ? (
                <div className={styles.rewardAcquiredCard}>
                  <div className={styles.rewardAcquiredHeader}>
                    <Sparkles size={14} className={styles.sparkleIcon} />
                    <span className={styles.rewardAcquiredName}>{currentClosedSeason.rewardAcquisition.cardName}</span>
                    {currentClosedSeason.rewardAcquisition.cardDescription && (
                      <span className={styles.rewardAcquiredDesc}>({currentClosedSeason.rewardAcquisition.cardDescription})</span>
                    )}
                  </div>
                  <div className={styles.rewardAcquiredDetails}>
                    <span>Acquired: {currentClosedSeason.rewardAcquisition.acquiredDate}</span>
                    {currentClosedSeason.rewardAcquisition.notes && (
                      <span className={styles.rewardAcquiredNotes}>• "{currentClosedSeason.rewardAcquisition.notes}"</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.textMuted} style={{ fontSize: '0.85rem' }}>
                  {currentClosedSeason.rewardEligibility === 'Eligible'
                    ? 'Season was Eligible for a reward card, but no reward was claimed before closure.'
                    : currentClosedSeason.rewardEligibility === 'Not Eligible'
                    ? `Rank exceeded ${REWARD_RANK_THRESHOLD.toLocaleString()} threshold. Reward not eligible.`
                    : 'Final rank was not entered. Reward eligibility is unknown.'}
                </div>
              )}
            </div>
          </Card>

          {/* Frozen Statistics Summary */}
          <Card variant="glass" padding="lg">
            <div className={styles.reviewSectionHeader}>
              <h2 className={styles.reviewSectionTitle}>
                <TrendingUp size={18} className="text-accent-purple" />
                Frozen Player Statistics & Cumulative Deltas
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {currentClosedSeason.closureSnapshot?.statsSummary.totalSnapshots ?? (currentClosedSeason.progressSnapshots?.length || 0)} Confirmed Snapshots
              </span>
            </div>

            <div className={styles.summaryGrid} style={{ marginTop: '1rem' }}>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Total Match Delta</span>
                <span className={styles.summaryStatVal}>
                  {currentClosedSeason.closureSnapshot?.statsSummary.totalMatchesDelta !== undefined
                    ? (currentClosedSeason.closureSnapshot.statsSummary.totalMatchesDelta > 0
                        ? `+${currentClosedSeason.closureSnapshot.statsSummary.totalMatchesDelta}`
                        : currentClosedSeason.closureSnapshot.statsSummary.totalMatchesDelta)
                    : 0}
                </span>
              </div>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Total Goals Delta</span>
                <span className={styles.summaryStatVal}>
                  {currentClosedSeason.closureSnapshot?.statsSummary.totalGoalsDelta !== undefined
                    ? (currentClosedSeason.closureSnapshot.statsSummary.totalGoalsDelta > 0
                        ? `+${currentClosedSeason.closureSnapshot.statsSummary.totalGoalsDelta}`
                        : currentClosedSeason.closureSnapshot.statsSummary.totalGoalsDelta)
                    : 0}
                </span>
              </div>
              <div className={styles.summaryStatCard}>
                <span className={styles.summaryStatLabel}>Total Assists Delta</span>
                <span className={styles.summaryStatVal}>
                  {currentClosedSeason.closureSnapshot?.statsSummary.totalAssistsDelta !== undefined
                    ? (currentClosedSeason.closureSnapshot.statsSummary.totalAssistsDelta > 0
                        ? `+${currentClosedSeason.closureSnapshot.statsSummary.totalAssistsDelta}`
                        : currentClosedSeason.closureSnapshot.statsSummary.totalAssistsDelta)
                    : 0}
                </span>
              </div>
            </div>

            {/* Historical Player Stats Table */}
            {closedSeasonDeltas.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div className={styles.sectionTabs}>
                  <button
                    type="button"
                    className={`${styles.sectionTab} ${closedDetailTab === 'all' ? styles.sectionTabActive : ''}`}
                    onClick={() => setClosedDetailTab('all')}
                  >
                    All Players (23)
                  </button>
                  <button
                    type="button"
                    className={`${styles.sectionTab} ${closedDetailTab === 'starters' ? styles.sectionTabActive : ''}`}
                    onClick={() => setClosedDetailTab('starters')}
                  >
                    Starting XI (11)
                  </button>
                  <button
                    type="button"
                    className={`${styles.sectionTab} ${closedDetailTab === 'subs' ? styles.sectionTabActive : ''}`}
                    onClick={() => setClosedDetailTab('subs')}
                  >
                    Substitutes (12)
                  </button>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.statsTable}>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Role</th>
                        <th>Baseline (M / G / A)</th>
                        <th>Final Cumulative (M / G / A)</th>
                        <th>Matches Δ</th>
                        <th>Goals Δ</th>
                        <th>Assists Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClosedDeltas.map((d) => (
                        <tr key={d.playerId}>
                          <td>
                            <div className={styles.playerInfo}>
                              <span className={styles.posChip}>{d.position}</span>
                              <span className={styles.playerName}>{d.playerName}</span>
                              <span className={styles.idBadge}>{d.playerId}</span>
                            </div>
                          </td>
                          <td>
                            <Badge variant={d.roleClassification === 'Starting XI' ? 'lime' : 'default'} size="sm">
                              {d.roleClassification}
                            </Badge>
                          </td>
                          <td>
                            <span className={styles.statReferenceVal}>
                              {d.baselineMatches} / {d.baselineGoals} / {d.baselineAssists}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>
                              {d.currentMatches} / {d.currentGoals} / {d.currentAssists}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.deltaPill} ${
                                d.matchesDelta > 0
                                  ? styles.deltaPositive
                                  : d.matchesDelta < 0
                                  ? styles.deltaNegative
                                  : styles.deltaZero
                              }`}
                            >
                              {d.matchesDelta > 0 ? `+${d.matchesDelta}` : d.matchesDelta}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.deltaPill} ${
                                d.goalsDelta > 0
                                  ? styles.deltaPositive
                                  : d.goalsDelta < 0
                                  ? styles.deltaNegative
                                  : styles.deltaZero
                              }`}
                            >
                              {d.goalsDelta > 0 ? `+${d.goalsDelta}` : d.goalsDelta}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.deltaPill} ${
                                d.assistsDelta > 0
                                  ? styles.deltaPositive
                                  : d.assistsDelta < 0
                                  ? styles.deltaNegative
                                  : styles.deltaZero
                              }`}
                            >
                              {d.assistsDelta > 0 ? `+${d.assistsDelta}` : d.assistsDelta}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          {/* Preserved Progress Snapshots Ledger */}
          {((currentClosedSeason.closureSnapshot?.progressSnapshots?.length || currentClosedSeason.progressSnapshots?.length || 0) > 0) && (
            <Card variant="glass" padding="lg">
              <div className={styles.reviewSectionHeader}>
                <h2 className={styles.reviewSectionTitle}>
                  <History size={18} className="text-accent-purple" />
                  Preserved Progress Snapshots
                </h2>
              </div>

              <div className={styles.snapshotsSection} style={{ marginTop: '1rem' }}>
                {(currentClosedSeason.closureSnapshot?.progressSnapshots || currentClosedSeason.progressSnapshots || []).map((snap, idx) => (
                  <div key={snap.id} className={styles.snapshotCard}>
                    <div className={styles.snapshotInfo}>
                      <span className={styles.snapshotDate}>
                        Snapshot #{idx + 1} — {snap.recordingDate}
                      </span>
                      <span className={styles.snapshotMeta}>
                        {snap.notes || 'No notes'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSeasonId(currentClosedSeason.id);
                        handleViewSnapshotDetail(snap);
                      }}
                    >
                      View Deltas
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Acknowledged Warnings Card if present */}
          {currentClosedSeason.closureSnapshot?.warnings && currentClosedSeason.closureSnapshot.warnings.length > 0 && (
            <div className={styles.acknowledgementBox}>
              <div className={styles.acknowledgementTitle}>
                <Info size={18} />
                <span>Incomplete Data Acknowledged at Closure</span>
              </div>
              <ul className={styles.warningList}>
                {currentClosedSeason.closureSnapshot.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Back Button */}
          <div className={styles.formFooterActions}>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={16} />}
              onClick={() => setViewMode('list')}
            >
              Back to Seasons List
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MILESTONE 4C1: RANK ENTRY MODAL
          ===================================================================== */}
      {rankModalSeason && (
        <div className={styles.modalOverlay} onClick={handleCloseRankModal}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleArea}>
                <h3 className={styles.modalTitle}>Set Season Final Rank</h3>
                <p className={styles.modalSubtitle}>
                  {rankModalSeason.id} • Reward Threshold: Rank ≤ {REWARD_RANK_THRESHOLD.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={handleCloseRankModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {rankModalError && (
                <div className={styles.modalError}>
                  <AlertCircle size={16} />
                  <span>{rankModalError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Final Rank Number
                  <span className={styles.helperText}>(e.g. 45000 or 105200)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={styles.input}
                  placeholder="Enter rank (leave blank to clear)"
                  value={rankInputValue}
                  onChange={(e) => {
                    setRankInputValue(e.target.value);
                    if (rankModalError) setRankModalError(null);
                  }}
                  autoFocus
                />
                <span className={styles.helperText}>
                  Rule: Rank 1 through 100,000 qualifies as Eligible. Rank 100,001 or greater is Not Eligible.
                </span>
              </div>

              {/* Live Preview */}
              {liveRankParsed === 'invalid' ? (
                <div className={`${styles.livePreviewCard} ${styles.previewNotEligible}`}>
                  <AlertCircle size={16} />
                  <span>Rank must be a positive whole number (≥ 1). Non-integers, zeros, and negative values are invalid.</span>
                </div>
              ) : typeof liveRankParsed === 'number' ? (
                liveRankParsed <= REWARD_RANK_THRESHOLD ? (
                  <div className={`${styles.livePreviewCard} ${styles.previewEligible}`}>
                    <CheckCircle2 size={16} />
                    <span>
                      Rank #{liveRankParsed.toLocaleString()} is <strong>Eligible</strong> for phase rewards (≤ {REWARD_RANK_THRESHOLD.toLocaleString()}).
                    </span>
                  </div>
                ) : (
                  <div className={`${styles.livePreviewCard} ${styles.previewNotEligible}`}>
                    <AlertCircle size={16} />
                    <span>
                      Rank #{liveRankParsed.toLocaleString()} is <strong>Not Eligible</strong> for phase rewards (&gt; {REWARD_RANK_THRESHOLD.toLocaleString()}).
                    </span>
                  </div>
                )
              ) : (
                <div className={`${styles.livePreviewCard} ${styles.previewNeutral}`}>
                  <HelpCircle size={16} />
                  <span>Leaving rank empty will set eligibility to <strong>Eligibility Unknown</strong>.</span>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={handleCloseRankModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Save size={16} />}
                disabled={liveRankParsed === 'invalid'}
                onClick={handleSaveRank}
              >
                Save Rank
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MILESTONE 4C1: REWARD ACQUISITION MODAL
          ===================================================================== */}
      {rewardModalSeason && (
        <div className={styles.modalOverlay} onClick={handleCloseRewardModal}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleArea}>
                <h3 className={styles.modalTitle}>Record Acquired Phase Reward</h3>
                <p className={styles.modalSubtitle}>
                  {rewardModalSeason.id} • Rank: #{rewardModalSeason.finalRank?.toLocaleString()} (Eligible)
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={handleCloseRewardModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {rewardModalError && (
                <div className={styles.modalError}>
                  <AlertCircle size={16} />
                  <span>{rewardModalError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Reward Card Name <span className={styles.requiredMark}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Epic Lionel Messi, Highlight L. Modric"
                  value={rewardCardName}
                  onChange={(e) => {
                    setRewardCardName(e.target.value);
                    if (rewardModalError) setRewardModalError(null);
                  }}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Card Details / Version
                  <span className={styles.helperText}>(Optional)</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Booster Edition, Phase 1 Reward"
                  value={rewardCardDescription}
                  onChange={(e) => setRewardCardDescription(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Acquisition Date <span className={styles.requiredMark}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.input}
                  value={rewardAcquiredDate}
                  onChange={(e) => setRewardAcquiredDate(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Notes
                  <span className={styles.helperText}>(Optional)</span>
                </label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  placeholder="e.g. Claimed from Division 1 Top 100k rewards box"
                  value={rewardNotes}
                  onChange={(e) => setRewardNotes(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.decreaseCheckboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.decreaseCheckbox}
                    checked={rewardConfirmedCheckbox}
                    onChange={(e) => setRewardConfirmedCheckbox(e.target.checked)}
                  />
                  <span>
                    I confirm this reward card was acquired for this season. (Limit of 1 reward card per season; cannot be duplicated).
                  </span>
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={handleCloseRewardModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Trophy size={16} />}
                disabled={!rewardCardName.trim() || !rewardConfirmedCheckbox}
                onClick={handleSaveReward}
              >
                Confirm & Record Reward
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MILESTONE 4C2: SEASON CLOSURE CONFIRMATION MODAL
          ===================================================================== */}
      {isConfirmCloseModalOpen && reviewSummary && (
        <div
          className={styles.modalOverlay}
          onClick={() => !isClosing && setIsConfirmCloseModalOpen(false)}
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleArea}>
                <h3 className={styles.modalTitle}>Confirm Permanent Season Closure</h3>
                <p className={styles.modalSubtitle}>{reviewSummary.seasonId}</p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => !isClosing && setIsConfirmCloseModalOpen(false)}
                aria-label="Close"
                disabled={isClosing}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {closureError && (
                <div className={styles.modalError}>
                  <AlertCircle size={16} />
                  <span>{closureError}</span>
                </div>
              )}

              <div className={styles.closureIrreversibleBox}>
                <div className={styles.closureIrreversibleTitle}>
                  <AlertTriangle size={18} />
                  <span>Permanent & Irreversible Action</span>
                </div>
                <div>
                  You are about to permanently close <strong>{reviewSummary.seasonId}</strong>.
                  This freezes all statistics, starting baseline, deltas, final rank, and reward acquisition into an immutable historical snapshot.
                  Duplicate closures, reopenings, and further mutations will be permanently rejected.
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div>
                  • <strong>Baseline:</strong> Confirmed ({reviewSummary.baseline?.players.length || 0} players)
                </div>
                <div>
                  • <strong>Progress Snapshots:</strong> {reviewSummary.snapshotCount} confirmed snapshot
                  {reviewSummary.snapshotCount !== 1 ? 's' : ''}
                </div>
                <div>
                  • <strong>Final Rank:</strong>{' '}
                  {reviewSummary.finalRank != null
                    ? `#${reviewSummary.finalRank.toLocaleString()}`
                    : 'Not Recorded (Eligibility Unknown)'}
                </div>
                <div>
                  • <strong>Phase Reward:</strong>{' '}
                  {reviewSummary.isRewardAcquired
                    ? `Acquired (${reviewSummary.rewardAcquisition?.cardName})`
                    : 'Not Acquired'}
                </div>
                {reviewSummary.warnings.length > 0 && (
                  <div>
                    • <strong>Incomplete Data:</strong> Explicitly acknowledged by user
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button
                variant="secondary"
                onClick={() => setIsConfirmCloseModalOpen(false)}
                disabled={isClosing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Lock size={16} />}
                disabled={isClosing}
                onClick={handleConfirmClosure}
              >
                {isClosing ? 'Closing Season...' : 'Confirm & Permanently Close Season'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
