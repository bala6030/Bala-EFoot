import React from 'react';
import { PlayerCard } from '../../types';
import styles from './PlayerCardTile.module.css';

export interface PlayerCardTileProps {
  player: PlayerCard;
  onClick: (player: PlayerCard) => void;
}

export const PlayerCardTile: React.FC<PlayerCardTileProps> = ({ player, onClick }) => {
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

  const hasImage = Boolean(player.imageUrl);

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
      {/* Top Header Row: Rating + Position */}
      <div className={styles.topRow}>
        <div className={styles.ratingBadge}>
          <span className={styles.ratingLabel}>OVR</span>
          <span className={styles.ratingValue}>{player.overallRating ?? '—'}</span>
        </div>

        <span className={`${styles.positionBadge} ${getPositionClass(player.primaryPosition)}`}>
          {player.primaryPosition}
        </span>
      </div>

      {/* Portrait Artwork / Fallback Area */}
      <div className={styles.portraitWrapper}>
        {hasImage ? (
          <img
            src={player.imageUrl!}
            alt={player.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className={styles.portraitGraphic}>
            <span className={styles.portraitInitials}>{getInitials(player.name)}</span>
            <span className={styles.artworkStatus}>Artwork Pending</span>
          </div>
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
