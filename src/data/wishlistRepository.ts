import type {
  PlayerCard,
  WishlistCardItem,
  WishlistPriority,
  WishlistState,
} from '../types';
import { getPlayerById } from './playerRepository';

export const WISHLIST_STORAGE_KEY = 'bala_efoot_wishlist_v1';

export function createDefaultWishlistState(): WishlistState {
  return {
    version: 1,
    items: [],
  };
}

export const DEFAULT_WISHLIST_STATE: WishlistState = {
  version: 1,
  items: [],
};

export const VALID_PRIORITIES: readonly WishlistPriority[] = ['High', 'Medium', 'Low'] as const;

export function isValidPriority(priority: unknown): priority is WishlistPriority {
  return typeof priority === 'string' && VALID_PRIORITIES.includes(priority as WishlistPriority);
}

/**
 * Loads wishlist state from localStorage with corruption protection
 */
export function loadWishlistState(): WishlistState {
  try {
    if (typeof localStorage === 'undefined') {
      return createDefaultWishlistState();
    }

    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) {
      return createDefaultWishlistState();
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.items)) {
      return createDefaultWishlistState();
    }

    const sanitizedItems: WishlistCardItem[] = parsed.items
      .filter((item: unknown): item is Partial<WishlistCardItem> => {
        return Boolean(item && typeof item === 'object' && typeof (item as WishlistCardItem).cardId === 'string');
      })
      .map((item: Partial<WishlistCardItem>): WishlistCardItem => ({
        id: typeof item.id === 'string' ? item.id : `wishlist-${item.cardId}`,
        cardId: item.cardId!,
        targetPlayerName: typeof item.targetPlayerName === 'string' ? item.targetPlayerName : `Card ${item.cardId}`,
        cardName: typeof item.cardName === 'string' ? item.cardName : null,
        primaryPosition: typeof item.primaryPosition === 'string' ? item.primaryPosition : '—',
        overallRating: typeof item.overallRating === 'number' ? item.overallRating : null,
        imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : null,
        playingStyle: typeof item.playingStyle === 'string' ? item.playingStyle : 'Standard Play',
        priority: isValidPriority(item.priority) ? item.priority : 'Medium',
        notes: typeof item.notes === 'string' ? item.notes : '',
        addedAt: typeof item.addedAt === 'string' ? item.addedAt : new Date().toISOString(),
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
      }));

    return {
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      items: sanitizedItems,
    };
  } catch (err) {
    console.error('Error loading wishlist from localStorage:', err);
    return createDefaultWishlistState();
  }
}

/**
 * Persists wishlist state to localStorage
 */
export function saveWishlistState(state: WishlistState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving wishlist to localStorage:', err);
  }
}

/**
 * Returns all current wishlist items
 */
export function getWishlistItems(): WishlistCardItem[] {
  return loadWishlistState().items;
}

/**
 * Checks whether a card ID is currently in the wishlist
 */
export function isCardInWishlist(cardId: string): boolean {
  const items = getWishlistItems();
  return items.some((i) => i.cardId === cardId);
}

/**
 * Finds a single wishlist item by card ID
 */
export function getWishlistItemByCardId(cardId: string): WishlistCardItem | undefined {
  const items = getWishlistItems();
  return items.find((i) => i.cardId === cardId);
}

export interface AddWishlistResult {
  success: boolean;
  error?: string;
  item?: WishlistCardItem;
}

/**
 * Adds a card to the wishlist with duplicate prevention and graceful handling
 * of catalogue records.
 */
export function addToWishlist(
  cardId: string,
  priority: WishlistPriority = 'Medium',
  notes = ''
): AddWishlistResult {
  const cleanCardId = cardId.trim();
  if (!cleanCardId) {
    return { success: false, error: 'Valid card ID is required' };
  }

  const state = loadWishlistState();

  // Prevent duplicate entries for the same card ID
  if (state.items.some((i) => i.cardId === cleanCardId)) {
    return {
      success: false,
      error: `Card ID "${cleanCardId}" is already in your wishlist`,
    };
  }

  const validPriority: WishlistPriority = isValidPriority(priority) ? priority : 'Medium';
  const player = getPlayerById(cleanCardId);

  const now = new Date().toISOString();
  const newItem: WishlistCardItem = {
    id: `wishlist-${cleanCardId}-${Date.now()}`,
    cardId: cleanCardId,
    targetPlayerName: player ? player.name : `Missing Card (${cleanCardId})`,
    cardName: player ? player.cardName : null,
    primaryPosition: player ? player.primaryPosition : '—',
    overallRating: player ? player.overallRating : null,
    imageUrl: player ? player.imageUrl : null,
    playingStyle: player ? player.playingStyle : 'Standard Play',
    priority: validPriority,
    notes: notes.trim(),
    addedAt: now,
    updatedAt: now,
  };

  const updatedState: WishlistState = {
    ...state,
    items: [newItem, ...state.items],
  };

  saveWishlistState(updatedState);

  return {
    success: true,
    item: newItem,
  };
}

/**
 * Updates priority and/or note on an existing wishlist item
 */
export function updateWishlistItem(
  cardId: string,
  updates: { priority?: WishlistPriority; notes?: string }
): { success: boolean; error?: string; item?: WishlistCardItem } {
  const state = loadWishlistState();
  const index = state.items.findIndex((i) => i.cardId === cardId);

  if (index === -1) {
    return {
      success: false,
      error: `Card "${cardId}" not found in wishlist`,
    };
  }

  const existing = state.items[index];
  const priority = updates.priority && isValidPriority(updates.priority)
    ? updates.priority
    : existing.priority;
  const notes = updates.notes !== undefined ? updates.notes.trim() : existing.notes;

  const updatedItem: WishlistCardItem = {
    ...existing,
    priority,
    notes,
    updatedAt: new Date().toISOString(),
  };

  const updatedItems = [...state.items];
  updatedItems[index] = updatedItem;

  const updatedState: WishlistState = {
    ...state,
    items: updatedItems,
  };

  saveWishlistState(updatedState);

  return {
    success: true,
    item: updatedItem,
  };
}

/**
 * Removes a card from the wishlist
 */
export function removeFromWishlist(cardId: string): { success: boolean; error?: string } {
  const state = loadWishlistState();
  const exists = state.items.some((i) => i.cardId === cardId);

  if (!exists) {
    return {
      success: false,
      error: `Card "${cardId}" not found in wishlist`,
    };
  }

  const updatedState: WishlistState = {
    ...state,
    items: state.items.filter((i) => i.cardId !== cardId),
  };

  saveWishlistState(updatedState);

  return { success: true };
}

/**
 * Clears all items in the wishlist
 */
export function clearWishlist(): void {
  saveWishlistState({ version: 1, items: [] });
}

export interface ResolvedWishlistCard extends WishlistCardItem {
  isCatalogueMissing: boolean;
  livePlayer?: PlayerCard;
}

/**
 * Reconciles a wishlist item against current catalogue data.
 * Gracefully handles missing or deleted catalogue records without crashing.
 */
export function resolveWishlistCard(item: WishlistCardItem): ResolvedWishlistCard {
  if (!item || !item.cardId) {
    return {
      id: 'missing-record',
      cardId: 'unknown',
      targetPlayerName: 'Unknown Card',
      cardName: null,
      primaryPosition: '—',
      overallRating: null,
      imageUrl: null,
      playingStyle: 'Standard Play',
      priority: 'Medium',
      notes: '',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCatalogueMissing: true,
    };
  }

  const livePlayer = getPlayerById(item.cardId);

  if (!livePlayer) {
    return {
      ...item,
      isCatalogueMissing: true,
    };
  }

  return {
    ...item,
    targetPlayerName: livePlayer.name,
    cardName: livePlayer.cardName,
    primaryPosition: livePlayer.primaryPosition,
    overallRating: livePlayer.overallRating,
    imageUrl: livePlayer.imageUrl,
    playingStyle: livePlayer.playingStyle,
    isCatalogueMissing: false,
    livePlayer,
  };
}
