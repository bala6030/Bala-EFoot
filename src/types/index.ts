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
 * Top performer summary entry (for Previous Month and Overall sections)
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
 * Player Card representation
 */
export interface PlayerCard {
  cardId: string;
  playerName: string;
  rating: number;
  cardType: string;
  primaryPosition: string;
  secondaryPositions: string[];
  playingStyle: string;
  strongFoot: 'Left' | 'Right';
  club: string;
  nationality: string;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  imageUrl?: string;
  isAcquired: boolean;
  booster?: string;
  notes?: string;
}

/**
 * Player Skill representation
 */
export interface PlayerSkill {
  id: string;
  cardId: string;
  skillName: string;
  isDefault: boolean;
  isHighlightGold?: boolean;
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
