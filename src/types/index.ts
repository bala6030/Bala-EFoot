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

  // Extensibility hooks for future milestones (Milestones 4B, 4C, 5):
  baselineSnapshot?: unknown;
  progressSnapshots?: unknown[];
  rewardEligibility?: unknown;
  rewardAcquired?: unknown;
  closedAt?: string;
  closureNotes?: string;
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

