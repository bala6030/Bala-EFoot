import React from 'react';
import { Bookmark } from 'lucide-react';
import { PlayerCard } from '../../types';
import styles from './PlayerCardTile.module.css';

export interface PlayerCardTileProps {
  player: PlayerCard;
  onClick: (player: PlayerCard) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (player: PlayerCard) => void;
}

export const PlayerCardTile: React.FC<PlayerCardTileProps> = ({
  player,
  onClick,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Helper for position color coding
  const getPositionClass = (pos: string) => {
    const p = pos.toUpperCase();
    if (['CF', 'SS', 'LWF', 'RWF'].includes(p)) return styles.posForward;
    if (['AMF', 'LMF', 'RMF', 'CMF'].includes(p)) return styles.posMidfield;
    if (['CB', 'LB', 'RB', 'DMF'].includes(p)) return styles.posDefender;
    if (p === 'GK') return styles.posGK;
    return styles.posMidfield;
  };

  // Extract initials for portrait fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const hasImage = Boolean(player.imageUrl) && !imageError;

  return (
    <div
      className={styles.cardTile}
      onClick={() => onClick(player)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(player);
        }
      }}
      aria-label={`View profile for ${player.name}, rating ${player.overallRating || 'unrated'}, position ${player.primaryPosition}`}
    >
      {/* Portrait Artwork / Fallback Area with Overlays */}
      <div className={styles.portraitWrapper}>
        {hasImage ? (
          <img
            src={player.imageUrl!}
            alt={player.name}
            className={styles.cardArtworkImage}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className={styles.portraitGraphic}>
            <span className={styles.portraitInitials}>{getInitials(player.name)}</span>
            <span className={styles.artworkStatus}>Artwork Pending</span>
          </div>
        )}

        {/* Position & Overall Rating Overlay (Non-obscuring top-left placement above national flag) */}
        <div className={styles.cardArtworkOverlay}>
          {player.primaryPosition && (
            <span className={`${styles.overlayPositionBadge} ${getPositionClass(player.primaryPosition)}`}>
              {player.primaryPosition}
            </span>
          )}
          {player.overallRating != null && (
            <div className={styles.overlayRatingBadge}>
              <span className={styles.overlayRatingLabel}>OVR</span>
              <span className={styles.overlayRatingValue}>{player.overallRating}</span>
            </div>
          )}
        </div>

        {/* Quick Wishlist Action */}
        {onToggleWishlist && (
          <button
            type="button"
            className={`${styles.wishlistButton} ${isWishlisted ? styles.wishlistButtonActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(player);
            }}
            title={isWishlisted ? 'In Wishlist (Click to remove)' : 'Add to Wishlist'}
            aria-label={isWishlisted ? `Remove ${player.name} from wishlist` : `Add ${player.name} to wishlist`}
          >
            <Bookmark size={13} fill={isWishlisted ? 'var(--accent-lime)' : 'none'} />
          </button>
        )}
      </div>

      {/* Identity */}
      <div className={styles.identity}>
        <h3 className={styles.playerName} title={player.name}>
          {player.name}
        </h3>
        <p className={styles.playingStyle}>
          {player.playingStyle !== 'None' ? player.playingStyle : 'Standard Play'}
        </p>
      </div>

      {/* Meta Footer Row */}
      <div className={styles.metaRow}>
        <div className={styles.squadStatus}>
          <span
            className={player.inStartingXI ? styles.dotStarting : styles.dotSub}
            aria-hidden="true"
          />
          <span>{player.inStartingXI ? 'Starting XI' : 'Substitute'}</span>
        </div>

        <span className={styles.idTag} title={`Stable Card ID: ${player.id}`}>
          {player.id}
        </span>
      </div>
    </div>
  );
};
