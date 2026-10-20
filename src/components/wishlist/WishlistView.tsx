import React, { useState, useMemo, useEffect } from 'react';
import {
  Bookmark,
  Search,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  X,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { WishlistCardItem, WishlistPriority } from '../../types';
import { getAllPlayers } from '../../data/playerRepository';
import {
  getWishlistItems,
  addToWishlist,
  updateWishlistItem,
  removeFromWishlist,
  resolveWishlistCard,
  ResolvedWishlistCard,
} from '../../data/wishlistRepository';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import styles from './WishlistView.module.css';

export interface WishlistViewProps {
  onNavigateToCatalogue: () => void;
  onSelectPlayerProfile?: (playerId: string) => void;
}

type SortOption = 'priority' | 'rating' | 'name' | 'added';

export const WishlistView: React.FC<WishlistViewProps> = ({
  onNavigateToCatalogue,
  onSelectPlayerProfile,
}) => {
  const allPlayers = useMemo(() => getAllPlayers(), []);
  const [items, setItems] = useState<WishlistCardItem[]>(() => getWishlistItems());

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<WishlistPriority | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('priority');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<WishlistCardItem | null>(null);

  // Form states for Add / Edit
  const [formCardId, setFormCardId] = useState<string>('');
  const [formPriority, setFormPriority] = useState<WishlistPriority>('High');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Image error tracker
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const reloadItems = () => {
    setItems(getWishlistItems());
  };

  // Cards not yet in wishlist
  const availableCataloguePlayers = useMemo(() => {
    const wishlistedIds = new Set(items.map((i) => i.cardId));
    return allPlayers.filter((p) => !wishlistedIds.has(p.id));
  }, [allPlayers, items]);

  // Set default formCardId when modal opens
  useEffect(() => {
    if (isAddModalOpen && availableCataloguePlayers.length > 0 && !formCardId) {
      setFormCardId(availableCataloguePlayers[0].id);
    }
  }, [isAddModalOpen, availableCataloguePlayers, formCardId]);

  // Reconcile and filter cards
  const resolvedItems: ResolvedWishlistCard[] = useMemo(() => {
    return items.map((item) => resolveWishlistCard(item));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return resolvedItems
      .filter((item) => {
        // Priority filter
        if (priorityFilter !== 'All' && item.priority !== priorityFilter) {
          return false;
        }

        // Query search
        if (q) {
          const matchName = item.targetPlayerName.toLowerCase().includes(q);
          const matchCard = item.cardName ? item.cardName.toLowerCase().includes(q) : false;
          const matchPos = item.primaryPosition.toLowerCase().includes(q);
          const matchNotes = item.notes ? item.notes.toLowerCase().includes(q) : false;
          const matchId = item.cardId.toLowerCase().includes(q);
          if (!matchName && !matchCard && !matchPos && !matchNotes && !matchId) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityScore = (p: WishlistPriority) =>
            p === 'High' ? 3 : p === 'Medium' ? 2 : 1;
          const diff = priorityScore(b.priority) - priorityScore(a.priority);
          if (diff !== 0) return diff;
          return (b.overallRating ?? 0) - (a.overallRating ?? 0);
        }
        if (sortBy === 'rating') {
          return (b.overallRating ?? 0) - (a.overallRating ?? 0);
        }
        if (sortBy === 'name') {
          return a.targetPlayerName.localeCompare(b.targetPlayerName);
        }
        if (sortBy === 'added') {
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        }
        return 0;
      });
  }, [resolvedItems, searchQuery, priorityFilter, sortBy]);

  // Action handlers
  const handleOpenAddModal = () => {
    setFormCardId(availableCataloguePlayers[0]?.id || '');
    setFormPriority('High');
    setFormNotes('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: WishlistCardItem) => {
    setEditingCard(item);
    setFormPriority(item.priority);
    setFormNotes(item.notes || '');
    setFormError(null);
  };

  const handleSaveAdd = () => {
    if (!formCardId) {
      setFormError('Please select a player card.');
      return;
    }

    const res = addToWishlist(formCardId, formPriority, formNotes);
    if (res.success) {
      reloadItems();
      setIsAddModalOpen(false);
      setFormError(null);
    } else {
      setFormError(res.error || 'Failed to add to wishlist.');
    }
  };

  const handleSaveEdit = () => {
    if (!editingCard) return;

    const res = updateWishlistItem(editingCard.cardId, {
      priority: formPriority,
      notes: formNotes,
    });

    if (res.success) {
      reloadItems();
      setEditingCard(null);
      setFormError(null);
    } else {
      setFormError(res.error || 'Failed to update wishlist item.');
    }
  };

  const handleRemove = (cardId: string, playerName: string) => {
    if (window.confirm(`Remove ${playerName} from your target wishlist?`)) {
      removeFromWishlist(cardId);
      reloadItems();
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('All');
    setSortBy('priority');
  };

  const getPriorityBadgeClass = (priority: WishlistPriority) => {
    switch (priority) {
      case 'High':
        return styles.priorityBadgeHigh;
      case 'Medium':
        return styles.priorityBadgeMedium;
      case 'Low':
        return styles.priorityBadgeLow;
      default:
        return '';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={styles.wishlistContainer}>
      {/* Header */}
      <div className={styles.headerSection}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>
              <Bookmark size={28} color="var(--accent-lime)" />
              <span>Target Wishlist</span>
            </h1>
            <p className={styles.subtitle}>
              Maintain your wanted card acquisitions, assign priority rankings (High, Medium,
              Low), and document squad-building notes without fabricated costs or external APIs.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleOpenAddModal}
            disabled={availableCataloguePlayers.length === 0}
          >
            <Plus size={16} />
            <span>Add Target Card</span>
          </Button>
        </div>

        {/* Controls Bar */}
        {items.length > 0 && (
          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by player, card version, position, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterSortGroup}>
              {/* Priority Filters */}
              <div className={styles.priorityPills}>
                {(['All', 'High', 'Medium', 'Low'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.priorityPill} ${
                      priorityFilter === p ? styles.priorityPillActive : ''
                    }`}
                    onClick={() => setPriorityFilter(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort wishlist items"
              >
                <option value="priority">Sort: Priority</option>
                <option value="rating">Sort: Overall Rating</option>
                <option value="name">Sort: Player Name</option>
                <option value="added">Sort: Date Added</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={40} color="var(--accent-lime)" />}
          title="Your Wishlist is Empty"
          description="Start building your dream acquisition targets by adding player cards from your squad catalogue or scouting list."
          action={
            <Button variant="primary" size="md" onClick={onNavigateToCatalogue}>
              Browse Player Catalogue
            </Button>
          }
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Search size={36} color="var(--text-muted)" />}
          title="No Matching Wishlist Cards"
          description={`No wishlist cards found matching "${searchQuery}" with priority "${priorityFilter}".`}
          action={
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </Button>
          }
        />
      ) : (
        <div className={styles.cardsGrid}>
          {filteredItems.map((item) => {
            const hasImage = Boolean(item.imageUrl) && !imageErrors[item.cardId];

            return (
              <div key={item.id} className={styles.wishlistCard}>
                <div className={styles.cardTopRow}>
                  {/* Artwork panel */}
                  <div className={styles.artworkContainer}>
                    {hasImage ? (
                      <img
                        src={item.imageUrl!}
                        alt={item.targetPlayerName}
                        className={styles.artworkImg}
                        onError={() =>
                          setImageErrors((prev) => ({ ...prev, [item.cardId]: true }))
                        }
                      />
                    ) : (
                      <div className={styles.artworkFallback}>
                        <span className={styles.initials}>
                          {getInitials(item.targetPlayerName)}
                        </span>
                        <span style={{ fontSize: '0.6rem' }}>Card</span>
                      </div>
                    )}
                    {item.primaryPosition && (
                      <span className={styles.posOverlay}>{item.primaryPosition}</span>
                    )}
                    {item.overallRating != null && (
                      <span className={styles.ovrOverlay}>
                        OVR {item.overallRating}
                      </span>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className={styles.cardDetails}>
                    <h3 className={styles.cardPlayerName} title={item.targetPlayerName}>
                      {item.targetPlayerName}
                    </h3>
                    <span className={styles.cardVersionName} title={item.cardName || ''}>
                      {item.cardName || 'Standard Edition'}
                    </span>
                    <span className={styles.cardStyle}>{item.playingStyle}</span>

                    <div className={styles.priorityRow}>
                      <span
                        className={`${styles.priorityPill} ${getPriorityBadgeClass(
                          item.priority
                        )}`}
                      >
                        {item.priority} Priority
                      </span>
                      <Badge variant="default" size="sm">
                        ID: {item.cardId}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Missing catalogue record notice */}
                {item.isCatalogueMissing && (
                  <div className={styles.missingRecordBanner}>
                    <AlertTriangle size={14} />
                    <span>Catalogue record unavailable ({item.cardId})</span>
                  </div>
                )}

                {/* Note section */}
                <div className={styles.noteContainer}>
                  {item.notes ? (
                    <p className={styles.noteText}>{item.notes}</p>
                  ) : (
                    <span className={styles.noteEmpty}>No personal notes added yet.</span>
                  )}
                </div>

                {/* Card Actions */}
                <div className={styles.cardActions}>
                  {onSelectPlayerProfile && !item.isCatalogueMissing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectPlayerProfile(item.cardId)}
                      title="View Player Profile"
                    >
                      <ExternalLink size={14} />
                      <span>Profile</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditModal(item)}
                    title="Edit Note & Priority"
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(item.cardId, item.targetPlayerName)}
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={14} color="var(--color-danger)" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Target Card Modal */}
      {isAddModalOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Bookmark size={20} color="var(--accent-lime)" />
                <span>Add Card to Wishlist</span>
              </h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className={styles.missingRecordBanner}>
                <AlertTriangle size={14} />
                <span>{formError}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="wishlist-player-select" className={styles.formLabel}>
                Target Player Card:
              </label>
              <select
                id="wishlist-player-select"
                className={styles.formSelect}
                value={formCardId}
                onChange={(e) => setFormCardId(e.target.value)}
              >
                {availableCataloguePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.primaryPosition} · OVR {p.overallRating ?? '—'}) — {p.cardName || p.id}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="wishlist-priority-select" className={styles.formLabel}>
                Acquisition Priority:
              </label>
              <select
                id="wishlist-priority-select"
                className={styles.formSelect}
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as WishlistPriority)}
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="wishlist-notes-input" className={styles.formLabel}>
                Personal Notes (Optional):
              </label>
              <textarea
                id="wishlist-notes-input"
                className={styles.formTextarea}
                placeholder="Why do you want this card? (e.g. Tactical fit for 4-2-1-3, target skill build, booster synergy...)"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSaveAdd}>
                Add to Wishlist
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note & Priority Modal */}
      {editingCard && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Edit2 size={20} color="var(--accent-blue)" />
                <span>Edit Wishlist Card</span>
              </h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setEditingCard(null)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Card: <strong>{editingCard.targetPlayerName}</strong> ({editingCard.cardId})
            </div>

            {formError && (
              <div className={styles.missingRecordBanner}>
                <AlertTriangle size={14} />
                <span>{formError}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="edit-priority-select" className={styles.formLabel}>
                Acquisition Priority:
              </label>
              <select
                id="edit-priority-select"
                className={styles.formSelect}
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as WishlistPriority)}
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-notes-input" className={styles.formLabel}>
                Personal Notes:
              </label>
              <textarea
                id="edit-notes-input"
                className={styles.formTextarea}
                placeholder="Why do you want this card?"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setEditingCard(null)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
