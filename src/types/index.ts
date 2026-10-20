/**
 * Navigation views supported by Bala EFoot
 */
export type NavigationView =
  | 'dashboard'
  | 'squad'
  | 'players'
  | 'seasons'
  | 'skills'
  | 'stats'
  | 'wishlist';

export interface NavItemConfig {
  id: NavigationView;
  label: string;
  iconName: string;
  badge?: string;
  description: string;
}

/**
 * Division and match record statistics
 */
export interface DivisionRecord {
  seasonLabel: string;
  division: number | string;
  points: number;
  rank: number | null;
  wins: number;
  draws: number;
  losses: number;
  matches: number;
  winRate: number;
  rewardCardName?: string;
  rewardCardAcquired?: boolean;
  rewardCardImageUrl?: string;
}

/**
 * Top performer summary entry
 */
export interface TopPerformerSummary {
  cardId: string;
  playerName: string;
  position: string;
  matches: number;
  goals: number;
  assists: number;
  rating?: number;
  imageUrl?: string;
}

/**
 * Attacking attributes
 */
export interface AttackingAttributes {
  offensiveAwareness: number | null;
  ballControl: number | null;
  dribbling: number | null;
  tightPossession: number | null;
  lowPass: number | null;
  loftedPass: number | null;
  finishing: number | null;
  heading: number | null;
  setPieceTaking: number | null;
  curl: number | null;
  weakFootUsage: string | null;
  weakFootAccuracy: string | null;
}

/**
 * Goalkeeping attributes
 */
export interface GoalkeepingAttributes {
  gkAwareness: number | null;
  gkCatching: number | null;
  gkParrying: number | null;
  gkReflexes: number | null;
  gkReach: number | null;
  gkClearing: number | null;
}

/**
 * Defending attributes
 */
export interface DefendingAttributes {
  defensiveAwareness: number | null;
  ballWinning: number | null;
  aggression: number | null;
  defensiveEngagement: number | null;
}

/**
 * Athleticism attributes
 */
export interface AthleticismAttributes {
  speed: number | null;
  acceleration: number | null;
  kickingPower: number | null;
  jump: number | null;
  physicalContact: number | null;
  balance: number | null;
  stamina: number | null;
  form: string | null;
  injuryResistance: string | null;
}

/**
 * Player Model attributes
 */
export interface PlayerModelAttributes {
  heightCm: number | null;
  weightKg: number | null;
  armLength: number | null;
  shoulderWidth: number | null;
  neckLength: number | null;
  chestMeasurement: number | null;
  neckSize: number | null;
  shoulderHeight: number | null;
  legLength: number | null;
  thighSize: number | null;
  waistSize: number | null;
  armSize: number | null;
  calfSize: number | null;
  sourceValidation: string | null;
}

/**
 * Attributes collection bundle
 */
export interface PlayerAttributesBundle {
  attacking: AttackingAttributes;
  goalkeeping: GoalkeepingAttributes | null;
  defending: DefendingAttributes;
  athleticism: AthleticismAttributes;
  playerModel: PlayerModelAttributes;
}

/**
 * Player Skill item
 */
export interface PlayerSkillItem {
  skillName: string;
  skillType: 'Default' | 'Additional';
  isHighlightGold: boolean;
  isVerified: boolean;
  notes: string | null;
}

/**
 * Player Overall Performance
 */
export interface PlayerOverallPerformance {
  matchesPlayed: number | null;
  goals: number | null;
  assists: number | null;
  cleanSheets: number | null;
  goalContributions: number | null;
  goalsPerMatch: number | null;
  assistsPerMatch: number | null;
  notes: string | null;
}

/**
 * Data provenance and verification note
 */
export interface PlayerDataProvenance {
  source: string;
  attributeNotes: string | null;
  additionalBoosterNotes: string | null;
  isVerified: boolean;
}

/**
 * Complete Player Record
 */
export interface PlayerCard {
  id: string; // Stable ID e.g. "P001"
  name: string;
  cardName: string | null;
  overallRating: number | null;
  cardType: string | null;
  primaryPosition: string;
  secondaryPositions: string[];
  squadPosition: string | null;
  playingStyle: string;
  preferredFoot: 'Left' | 'Right' | string | null;
  club: string | null;
  nationality: string | null;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  imageUrl: string | null;
  inStartingXI: boolean;
  inSubstitutes: boolean;
  isAcquired: boolean;
  booster: string | null;
  managerNotes: string | null;
  generalNotes: string | null;
  efhubUrl: string | null;
  provenance: PlayerDataProvenance;
  attributes: PlayerAttributesBundle;
  skills: PlayerSkillItem[];
  overallPerformance: PlayerOverallPerformance;
}

/**
 * Pinned attribute definition metadata
 */
export interface AttributeDefinition {
  key: string;
  label: string;
  category: 'attacking' | 'defending' | 'athleticism' | 'goalkeeping' | 'playerModel';
  isNumeric: boolean;
}

/**
 * Wishlist entry representation
 */
export interface WishlistEntry {
  id: string;
  targetPlayerName: string;
  desiredVersion?: string;
  position: string;
  playingStyle?: string;
  priority: 'High' | 'Medium' | 'Low';
  mustHaveSkills: string[];
  notes?: string;
  isAcquired: boolean;
}

/**
 * Supported tactical formation IDs
 */
export type FormationId = '4-2-1-3' | '4-3-3' | '4-2-2-2';

/**
 * Role category for formation slots
 */
export type RoleCategory = 'GK' | 'DEF' | 'MID' | 'FWD';

/**
 * Single position slot within a formation
 */
export interface FormationSlot {
  id: string; // e.g. 'gk', 'lb', 'lcb', 'rcb', 'rb', 'ldmf', 'rdmf', 'amf', 'lwf', 'cf', 'rwf'
  name: string; // Display label: 'GK', 'LB', 'CB', 'DMF', 'AMF', 'CF', etc.
  roleCategory: RoleCategory;
  x: number; // Percentage from left of pitch (0 - 100)
  y: number; // Percentage from top of pitch (0 - 100)
}

/**
 * Complete formation structure definition
 */
export interface FormationDefinition {
  id: FormationId;
  label: string;
  description: string;
  slots: FormationSlot[];
}

/**
 * Tactical layout mode: Attack or Defence
 */
export type TacticalLayout = 'attack' | 'defence';

/**
 * State of a single tactical layout
 */
export interface LayoutState {
  formationId: FormationId;
  assignments: Record<string, string>; // slotId -> playerId
}

/**
 * Complete persisted squad builder state
 */
export interface SquadBuilderState {
  activeLayout: TacticalLayout;
  attack: LayoutState;
  defence: LayoutState;
}

/**
 * Validation summary for a squad layout
 */
export interface SquadValidationResult {
  isValid: boolean;
  filledCount: number;
  totalSlots: number;
  hasGK: boolean;
  duplicatePlayerIds: string[];
  missingPlayerIds: string[];
  unfilledSlotNames: string[];
}

/**
 * Season lifecycle status
 */
export type SeasonStatus = 'Draft' | 'Active' | 'Closed';

/**
 * Reward eligibility status based on final rank threshold (<= 100,000)
 */
export type RewardEligibilityStatus = 'Eligible' | 'Not Eligible' | 'Eligibility Unknown';

/**
 * Reward acquisition status
 */
export type RewardAcquisitionStatus = 'Acquired' | 'Not Acquired';

/**
 * Season reward player/card acquisition record (at most one per season)
 */
export interface SeasonRewardAcquisition {
  id: string; // e.g. "rew-Phase-1-1729420000000"
  seasonId: string;
  cardName: string; // Reward player/card name (e.g. "Alessandro Costacurta")
  cardDescription?: string; // Card or version description if known
  acquiredDate: string; // YYYY-MM-DD
  notes?: string;
  confirmedAt: string; // ISO 8601 timestamp
}

/**
 * Core Season entity
 */
export interface Season {
  id: string; // Unique season/phase identifier (e.g. "Phase 1 - Season 2024", "Season 1")
  startDate: string; // ISO date string (YYYY-MM-DD)
  startingDivision: number; // eFootball starting division (1-10)
  notes?: string; // Optional user notes / objectives
  status: SeasonStatus; // Draft | Active | Closed
  createdAt: string; // ISO 8601 creation timestamp
  updatedAt: string; // ISO 8601 update timestamp

  // Milestone 4B: Baseline & Progress tracking
  baseline?: SeasonBaselineSnapshot | null;
  baselineDraft?: SeasonBaselineDraft | null;
  progressSnapshots?: SeasonProgressSnapshot[];
  progressDraft?: SeasonProgressDraft | null;

  // Backward compatibility alias:
  baselineSnapshot?: unknown;

  // Milestone 4C1: Reward Eligibility & Acquisition
  finalRank?: number | null; // Entered final rank (1 to 100,000 qualifies)
  rewardEligibility?: RewardEligibilityStatus;
  rewardAcquisition?: SeasonRewardAcquisition | null;

  // Milestone 5A: Division Progress tracking (append-only)
  divisionProgressSnapshots?: DivisionProgressSnapshot[];

  // Extensibility hooks for future milestones (Milestones 4C2, 5):
  rewardAcquired?: unknown;
  closedAt?: string;
  closureNotes?: string;
  closureSnapshot?: SeasonClosureSnapshot | null;
}

/**
 * Draft input model for creating or editing a season
 */
export interface SeasonDraftInput {
  id?: string;
  startDate?: string;
  startingDivision?: number;
  notes?: string;
}

/**
 * Player role classification in baseline
 */
export type PlayerRoleClassification = 'Starting XI' | 'Substitute';

/**
 * Single player's statistics in baseline
 */
export interface BaselinePlayerRecord {
  playerId: string; // Stable ID e.g. "P001"
  roleClassification: PlayerRoleClassification;
  matches: number; // Non-negative integer
  goals: number; // Non-negative integer
  assists: number; // Non-negative integer
}

/**
 * Baseline snapshot for a season (immutable once confirmed)
 */
export interface SeasonBaselineSnapshot {
  id: string; // e.g. "baseline-Phase-1-1729420000000"
  confirmedAt: string; // ISO 8601 timestamp
  confirmedDate: string; // YYYY-MM-DD
  players: BaselinePlayerRecord[]; // Exactly 23 player records
  notes?: string;
}

/**
 * Draft entry for a player in a baseline draft (null represents unentered)
 */
export interface BaselineDraftPlayerEntry {
  playerId: string;
  roleClassification: PlayerRoleClassification;
  matches: number | null; // null represents unentered, 0 represents genuine zero
  goals: number | null;
  assists: number | null;
}

/**
 * Draft for season baseline before confirmation
 */
export interface SeasonBaselineDraft {
  seasonId: string;
  updatedAt: string;
  players: BaselineDraftPlayerEntry[];
  notes?: string;
}

/**
 * Single player's cumulative statistics in a progress snapshot
 */
export interface ProgressPlayerRecord {
  playerId: string;
  matches: number;
  goals: number;
  assists: number;
}

/**
 * Confirmed progress snapshot (append-only)
 */
export interface SeasonProgressSnapshot {
  id: string; // e.g. "snap-1729420000000"
  recordingDate: string; // YYYY-MM-DD
  recordedAt: string; // ISO timestamp
  players: ProgressPlayerRecord[]; // Exactly 23 player records
  notes?: string;
  hasConfirmedDecreases?: boolean;
}

/**
 * Draft entry for progress snapshot
 */
export interface ProgressDraftPlayerEntry {
  playerId: string;
  matches: number | null;
  goals: number | null;
  assists: number | null;
}

/**
 * Draft for in-progress snapshot
 */
export interface SeasonProgressDraft {
  seasonId: string;
  recordingDate: string;
  updatedAt: string;
  players: ProgressDraftPlayerEntry[];
  notes?: string;
}

/**
 * Computed delta record for display and analysis
 */
export interface PlayerStatDelta {
  playerId: string;
  playerName: string;
  position: string;
  roleClassification: PlayerRoleClassification;
  baselineMatches: number;
  baselineGoals: number;
  baselineAssists: number;
  currentMatches: number;
  currentGoals: number;
  currentAssists: number;
  matchesDelta: number; // currentMatches - baselineMatches
  goalsDelta: number; // currentGoals - baselineGoals
  assistsDelta: number; // currentAssists - baselineAssists
  matchesDecreased: boolean;
  goalsDecreased: boolean;
  assistsDecreased: boolean;
  referenceMatches: number;
  referenceGoals: number;
  referenceAssists: number;
}

/**
 * Persisted seasons storage state container
 */
export interface SeasonsState {
  version: number;
  seasons: Season[];
  activeDraftId: string | null;
}

/**
 * Validation result for season form inputs
 */
export interface SeasonValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Frozen, immutable snapshot of the season at time of closure (Milestone 4C2)
 */
export interface SeasonClosureSnapshot {
  id: string; // e.g. "closure-Phase-1-1729420000000"
  seasonId: string;
  version: number; // Snapshot schema version (e.g. 1)
  closedAt: string; // ISO 8601 timestamp
  closedDate: string; // YYYY-MM-DD
  metadata: {
    id: string;
    startDate: string;
    startingDivision: number;
    notes?: string;
    createdAt: string;
  };
  baseline: SeasonBaselineSnapshot;
  progressSnapshots: SeasonProgressSnapshot[];
  divisionProgressSnapshots?: DivisionProgressSnapshot[];
  statsSummary: {
    totalSnapshots: number;
    latestSnapshotDate?: string;
    totalMatchesDelta: number;
    totalGoalsDelta: number;
    totalAssistsDelta: number;
  };
  finalRank: number | null;
  rewardEligibility: RewardEligibilityStatus;
  rewardAcquisitionStatus: RewardAcquisitionStatus;
  rewardAcquisition: SeasonRewardAcquisition | null;
  warnings: string[];
  incompleteDataAcknowledged: boolean;
  acknowledgedWarnings: string[];
  closureNotes?: string;
}

/**
 * Comprehensive review summary for an active season prior to closure
 */
export interface SeasonReviewSummary {
  seasonId: string;
  startDate: string;
  startingDivision: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  status: SeasonStatus;

  // Baseline confirmation status
  hasBaseline: boolean;
  baseline: SeasonBaselineSnapshot | null;
  hasUnconfirmedBaselineDraft: boolean;

  // Snapshots & Cumulative statistics
  snapshotCount: number;
  hasUnconfirmedProgressDraft: boolean;
  latestSnapshot: SeasonProgressSnapshot | null;
  deltas: PlayerStatDelta[];
  totalMatchesDelta: number;
  totalGoalsDelta: number;
  totalAssistsDelta: number;

  // Division Progress (Milestone 5A)
  divisionProgressSnapshotsCount?: number;
  latestDivisionProgress?: DivisionProgressSnapshot | null;

  // Rank & Reward status
  finalRank: number | null;
  rewardEligibility: RewardEligibilityStatus;
  isRewardAcquired: boolean;
  rewardAcquisition: SeasonRewardAcquisition | null;

  // Closure eligibility & checks
  canClose: boolean;
  blockingReasons: string[];
  warnings: string[];
}

/**
 * Input parameters for explicit season closure
 */
export interface CloseSeasonInput {
  seasonId: string;
  expectedUpdatedAt?: string;
  acknowledgedIncompleteData?: boolean;
  closureNotes?: string;
}

/**
 * Result of season closure operation
 */
export interface CloseSeasonResult {
  success: boolean;
  season?: Season;
  closureSnapshot?: SeasonClosureSnapshot;
  error?: string;
  warnings?: string[];
}

/**
 * Single division-progress snapshot for an active season (append-only) (Milestone 5A)
 */
export interface DivisionProgressSnapshot {
  id: string; // e.g. "div-snap-Phase-1-1729420000000"
  seasonId: string;
  recordingDate: string; // YYYY-MM-DD
  recordedAt: string; // ISO 8601 timestamp
  division: number; // 1-10 integer
  points: number; // non-negative integer
  rank: number | null; // positive integer or null
  wins: number; // non-negative integer
  draws: number; // non-negative integer
  losses: number; // non-negative integer
  matches: number; // wins + draws + losses
  winRate: number; // wins / matches (or 0 if matches === 0)
  notes?: string;
}

/**
 * Input for recording a division-progress snapshot
 */
export interface DivisionProgressInput {
  seasonId: string;
  recordingDate?: string;
  division: number; // 1-10
  points: number; // >= 0
  rank?: number | null; // >= 1 or null
  wins: number; // >= 0
  draws: number; // >= 0
  losses: number; // >= 0
  notes?: string;
}

/**
 * Aggregated live KPI data for the Dashboard view
 */
export interface DashboardKPIs {
  hasActiveSeason: boolean;
  activeSeasonId?: string;
  division: number | null;
  divisionDisplay: string;
  divisionSubtitle: string;
  points: number | null;
  pointsDisplay: string;
  pointsSubtitle: string;
  rank: number | null;
  rankDisplay: string;
  rankSubtitle: string;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  matches: number | null;
  recordDisplay: string;
  recordSubtitle: string;
  winRate: number | null;
  winRateDisplay: string;
  winRateSubtitle: string;
  rewardStatus: string;
  rewardSubtitle: string;
  rewardColor: 'lime' | 'blue' | 'purple' | 'default';
  isRewardEligible: boolean;
}

/**
 * Top performer entry for Overall or Previous Month views
 */
export interface TopPerformerItem {
  rank: number;
  playerId: string;
  playerName: string;
  cardName: string | null;
  primaryPosition: string;
  imageUrl: string | null;
  matches: number | null;
  goals: number | null;
  assists: number | null;
  goalContributions: number | null;
  goalsPerMatch: number | null;
  assistsPerMatch: number | null;
}

/**
 * Historical closed season record for Division History section
 */
export interface ClosedSeasonHistoryItem {
  id: string;
  startDate: string;
  closedDate: string;
  startingDivision: number;
  finalDivision: number | null;
  points: number | null;
  finalRank: number | null;
  record: string;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  matches: number | null;
  winRate: string;
  totalMatchesDelta: number;
  totalGoalsDelta: number;
  totalAssistsDelta: number;
  rewardStatus: string;
  rewardCardName?: string;
  closureNotes?: string;
}

// ============================================================================
// MILESTONE 5B: STATS & RECORDS TYPES
// ============================================================================

/**
 * Tab/Period navigation options for Stats & Records view
 */
export type StatsPeriodTab = 'overall' | 'previous-month' | 'seasons';

/**
 * Calendar month date window representation
 */
export interface MonthWindow {
  year: number;
  month: number; // 1-12
  monthLabel: string; // e.g. "September 2026"
  startStr: string; // YYYY-MM-01
  endStr: string; // YYYY-MM-lastDay
}

/**
 * Unified player stats row representation for Overall, Previous Month, and Season views
 */
export interface PlayerStatsRow {
  playerId: string;
  playerName: string;
  cardName: string | null;
  overallRating: number | null;
  primaryPosition: string;
  imageUrl: string | null;
  roleClassification?: PlayerRoleClassification;
  matches: number | null;
  goals: number | null;
  assists: number | null;
  goalContributions: number | null;
  goalsPerMatch: number | null;
  assistsPerMatch: number | null;
  isUnavailable?: boolean;
}

/**
 * Item in the 5-season selector
 */
export interface SelectableSeasonItem {
  id: string;
  status: 'Active' | 'Closed';
  startDate: string;
  closedDate?: string;
  startingDivision: number;
  finalDivision?: number | null;
  finalRank?: number | null;
  hasConfirmedBaseline: boolean;
  hasConfirmedProgress: boolean;
  snapshotCount: number;
  latestSnapshotDate?: string;
  closureSnapshotId?: string;
  closureNotes?: string;
}

/**
 * Season statistics result bundle
 */
export interface SeasonStatsResult {
  season: SelectableSeasonItem;
  hasConfirmedProgress: boolean;
  players: PlayerStatsRow[];
  totalMatchesDelta: number | null;
  totalGoalsDelta: number | null;
  totalAssistsDelta: number | null;
  totalGoalContributions: number | null;
  notes?: string;
}

/**
 * Overall (All-Time) statistics aggregate summary
 */
export interface OverallStatsSummary {
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  totalGoalContributions: number;
  recordedPlayersCount: number;
  totalPlayersCount: number;
  isPartial: boolean;
  notes: string;
}

/**
 * Previous Month statistics result bundle
 */
export interface PreviousMonthStatsResult {
  window: MonthWindow;
  hasData: boolean;
  players: TopPerformerItem[];
  allPlayerRows: PlayerStatsRow[];
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  totalGoalContributions: number;
}


