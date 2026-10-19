import type { PlayerCard, AttributeDefinition } from '../types';
import rawPlayersData from './players.json';

const players: PlayerCard[] = rawPlayersData as unknown as PlayerCard[];

/**
 * All available attribute definitions for pinning and grouping
 */
export const ALL_ATTRIBUTES: AttributeDefinition[] = [
  // Attacking
  { key: 'offensiveAwareness', label: 'Offensive Awareness', category: 'attacking', isNumeric: true },
  { key: 'ballControl', label: 'Ball Control', category: 'attacking', isNumeric: true },
  { key: 'dribbling', label: 'Dribbling', category: 'attacking', isNumeric: true },
  { key: 'tightPossession', label: 'Tight Possession', category: 'attacking', isNumeric: true },
  { key: 'lowPass', label: 'Low Pass', category: 'attacking', isNumeric: true },
  { key: 'loftedPass', label: 'Lofted Pass', category: 'attacking', isNumeric: true },
  { key: 'finishing', label: 'Finishing', category: 'attacking', isNumeric: true },
  { key: 'heading', label: 'Heading', category: 'attacking', isNumeric: true },
  { key: 'setPieceTaking', label: 'Set Piece Taking', category: 'attacking', isNumeric: true },
  { key: 'curl', label: 'Curl', category: 'attacking', isNumeric: true },
  { key: 'weakFootUsage', label: 'Weak Foot Usage', category: 'attacking', isNumeric: false },
  { key: 'weakFootAccuracy', label: 'Weak Foot Accuracy', category: 'attacking', isNumeric: false },

  // Defending
  { key: 'defensiveAwareness', label: 'Defensive Awareness', category: 'defending', isNumeric: true },
  { key: 'ballWinning', label: 'Ball Winning', category: 'defending', isNumeric: true },
  { key: 'aggression', label: 'Aggression', category: 'defending', isNumeric: true },
  { key: 'defensiveEngagement', label: 'Defensive Engagement', category: 'defending', isNumeric: true },

  // Athleticism
  { key: 'speed', label: 'Speed', category: 'athleticism', isNumeric: true },
  { key: 'acceleration', label: 'Acceleration', category: 'athleticism', isNumeric: true },
  { key: 'kickingPower', label: 'Kicking Power', category: 'athleticism', isNumeric: true },
  { key: 'jump', label: 'Jump', category: 'athleticism', isNumeric: true },
  { key: 'physicalContact', label: 'Physical Contact', category: 'athleticism', isNumeric: true },
  { key: 'balance', label: 'Balance', category: 'athleticism', isNumeric: true },
  { key: 'stamina', label: 'Stamina', category: 'athleticism', isNumeric: true },
  { key: 'form', label: 'Form', category: 'athleticism', isNumeric: false },
  { key: 'injuryResistance', label: 'Injury Resistance', category: 'athleticism', isNumeric: false },

  // Goalkeeping (when applicable)
  { key: 'gkAwareness', label: 'GK Awareness', category: 'goalkeeping', isNumeric: true },
  { key: 'gkCatching', label: 'GK Catching', category: 'goalkeeping', isNumeric: true },
  { key: 'gkParrying', label: 'GK Parrying', category: 'goalkeeping', isNumeric: true },
  { key: 'gkReflexes', label: 'GK Reflexes', category: 'goalkeeping', isNumeric: true },
  { key: 'gkReach', label: 'GK Reach', category: 'goalkeeping', isNumeric: true },
  { key: 'gkClearing', label: 'GK Clearing', category: 'goalkeeping', isNumeric: true },
];

/**
 * Returns role-based default suggestions for the 6 pinned key attributes
 */
export function getRoleDefaultPinnedAttributes(position: string): string[] {
  const pos = position.toUpperCase();

  if (pos === 'GK') {
    return ['gkAwareness', 'gkCatching', 'gkParrying', 'gkReflexes', 'gkReach', 'jump'];
  }

  // Defenders (CB, LB, RB, DMF)
  if (['CB', 'LB', 'RB', 'DMF'].includes(pos)) {
    return [
      'defensiveAwareness',
      'ballWinning',
      'aggression',
      'physicalContact',
      'speed',
      'stamina',
    ];
  }

  // Midfielders / Wingers (AMF, LMF, RMF, CMF)
  if (['AMF', 'LMF', 'RMF', 'CMF'].includes(pos)) {
    return [
      'ballControl',
      'dribbling',
      'lowPass',
      'loftedPass',
      'speed',
      'stamina',
    ];
  }

  // Attackers (CF, SS, LWF, RWF)
  return [
    'offensiveAwareness',
    'finishing',
    'speed',
    'acceleration',
    'dribbling',
    'kickingPower',
  ];
}

const STORAGE_PREFIX = 'bala_efoot_pinned_attrs_';

/**
 * Get stored or default pinned attributes for a specific player
 */
export function getPinnedAttributesForPlayer(playerId: string, position: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${playerId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 6) {
        return parsed;
      }
    }
  } catch {
    // Fall back to defaults on storage failure
  }
  return getRoleDefaultPinnedAttributes(position);
}

/**
 * Persist user-selected 6 pinned attributes locally
 */
export function setPinnedAttributesForPlayer(playerId: string, keys: string[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${playerId}`, JSON.stringify(keys.slice(0, 6)));
  } catch (e) {
    console.error('Failed to save pinned attributes locally', e);
  }
}

/**
 * Reset player's pinned attributes to role default
 */
export function resetPinnedAttributesForPlayer(playerId: string, position: string): string[] {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${playerId}`);
  } catch (e) {
    console.error('Failed to clear pinned attributes locally', e);
  }
  return getRoleDefaultPinnedAttributes(position);
}

/**
 * Retrieve all players from data
 */
export function getAllPlayers(): PlayerCard[] {
  return players;
}

/**
 * Retrieve single player by stable ID
 */
export function getPlayerById(id: string): PlayerCard | undefined {
  return players.find((p) => p.id === id);
}

/**
 * Helper to get unique positions present in source data
 */
export function getDistinctPositions(): string[] {
  const set = new Set<string>();
  players.forEach((p) => {
    if (p.primaryPosition) set.add(p.primaryPosition);
  });
  return Array.from(set).sort();
}

/**
 * Helper to get unique playing styles present in source data
 */
export function getDistinctPlayingStyles(): string[] {
  const set = new Set<string>();
  players.forEach((p) => {
    if (p.playingStyle && p.playingStyle !== 'None') set.add(p.playingStyle);
  });
  return Array.from(set).sort();
}

/**
 * Helper to get unique preferred feet
 */
export function getDistinctPreferredFeet(): string[] {
  const set = new Set<string>();
  players.forEach((p) => {
    if (p.preferredFoot) set.add(p.preferredFoot);
  });
  return Array.from(set).sort();
}
