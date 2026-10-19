/**
 * Navigation views supported by Bala EFoot
 */
export type NavigationView =
  | 'dashboard'
  | 'squad'
  | 'players'
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
