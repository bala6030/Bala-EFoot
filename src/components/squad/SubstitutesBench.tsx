import React, { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { PlayerCard } from '../../types';
import { Badge } from '../common/Badge';
import styles from './SubstitutesBench.module.css';

export interface SubstitutesBenchProps {
  benchPlayers: PlayerCard[];
  selectedPlayerId: string | null;
  onSelectPlayer: (player: PlayerCard) => void;
  onDropOnBench: (sourceData: { type: 'bench' | 'pitch'; id: string; slotId?: string }) => void;
  onDragStartBench: (player: PlayerCard) => void;
}

type BenchFilterCategory = 'ALL' | 'FWD' | 'MID' | 'DEF' | 'GK';

// -------------------------------------------------------------
// Small inner component: compact bench card content with artwork
// -------------------------------------------------------------
interface BenchCardContentProps {
  player: PlayerCard;
  badgeVariant: 'lime' | 'blue' | 'purple' | 'gold' | 'default';
}

const BenchCardContent: React.FC<BenchCardContentProps> = ({ player, badgeVariant }) => {
  const [imgError, setImgError] = useState(false);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const showImage = Boolean(player.imageUrl) && !imgError;

  return (
    <>
      {/* Compact artwork thumbnail */}
      <div className={styles.benchThumbWrapper}>
        {showImage ? (
          <img
            src={player.imageUrl!}
            alt={player.name}
            className={styles.benchThumbImage}
            onError={() => setImgError(true)}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className={styles.benchThumbFallback}>
            <span className={styles.benchThumbInitials}>{getInitials(player.name)}</span>
          </div>
        )}
      </div>

      <div className={styles.benchCardHeader}>
        <Badge variant={badgeVariant} size="sm">
          {player.primaryPosition}
        </Badge>
        <span className={styles.benchCardOvr}>{player.overallRating ?? '—'}</span>
      </div>

      <span className={styles.benchCardName} title={player.name}>
        {player.name}
      </span>

      <div className={styles.benchCardFooter}>
        <span>{player.playingStyle !== 'None' ? player.playingStyle : 'Standard'}</span>
        <span>{player.id}</span>
      </div>
    </>
  );
};

export const SubstitutesBench: React.FC<SubstitutesBenchProps> = ({
  benchPlayers,
  selectedPlayerId,
  onSelectPlayer,
  onDropOnBench,
  onDragStartBench,
}) => {
  const [filterCat, setFilterCat] = useState<BenchFilterCategory>('ALL');
  const [isDragOverBench, setIsDragOverBench] = useState(false);

  const getPositionCategory = (pos: string): BenchFilterCategory => {
    const p = pos.toUpperCase();
    if (['CF', 'SS', 'LWF', 'RWF'].includes(p)) return 'FWD';
    if (['AMF', 'LMF', 'RMF', 'CMF', 'DMF'].includes(p)) return 'MID';
    if (['CB', 'LB', 'RB'].includes(p)) return 'DEF';
    if (p === 'GK') return 'GK';
    return 'MID';
  };

  const filteredBench = useMemo(() => {
    if (filterCat === 'ALL') return benchPlayers;
    return benchPlayers.filter((p) => getPositionCategory(p.primaryPosition) === filterCat);
  }, [benchPlayers, filterCat]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOverBench) setIsDragOverBench(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only leave if exiting container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverBench(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverBench(false);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        onDropOnBench(parsed);
      }
    } catch (err) {
      console.error('Failed to parse bench drop data', err);
    }
  };

  const handlePlayerDragStart = (e: React.DragEvent, player: PlayerCard) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'bench', id: player.id })
    );
    e.dataTransfer.effectAllowed = 'move';
    onDragStartBench(player);
  };

  const getPositionBadgeVariant = (pos: string): BenchCardContentProps['badgeVariant'] => {
    const cat = getPositionCategory(pos);
    switch (cat) {
      case 'FWD':
        return 'lime';
      case 'MID':
        return 'blue';
      case 'DEF':
        return 'purple';
      case 'GK':
        return 'gold';
      default:
        return 'default';
    }
  };

  return (
    <div
      className={`${styles.benchContainer} ${isDragOverBench ? styles.benchContainerDragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label="Substitutes bench: drop pitch players here to return them to the bench"
    >
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            <Users size={18} className="text-neon-blue" />
            <span>Substitutes Bench</span>
          </h2>
          <Badge variant="blue" size="sm">
            {benchPlayers.length} Available
          </Badge>
          <span className={styles.benchInstruction}>
            (Drag to pitch or click to select; drop starters here to bench)
          </span>
        </div>

        {/* Filter pills */}
        <div className={styles.filterRow} role="group" aria-label="Filter bench by position">
          {(['ALL', 'FWD', 'MID', 'DEF', 'GK'] as BenchFilterCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.filterPill} ${filterCat === cat ? styles.filterPillActive : ''}`}
              onClick={() => setFilterCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of bench players */}
      {filteredBench.length > 0 ? (
        <div className={styles.benchGrid}>
          {filteredBench.map((player) => {
            const isSelected = selectedPlayerId === player.id;
            const badgeVariant = getPositionBadgeVariant(player.primaryPosition);

            return (
              <div
                key={player.id}
                className={`${styles.benchCard} ${isSelected ? styles.benchCardSelected : ''}`}
                draggable={true}
                onDragStart={(e) => handlePlayerDragStart(e, player)}
                onClick={() => onSelectPlayer(player)}
                role="button"
                tabIndex={0}
                aria-label={`Bench player: ${player.name}, position ${player.primaryPosition}, rating ${player.overallRating || 'unrated'}. Click or drag to assign to pitch.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPlayer(player);
                  }
                }}
              >
                <BenchCardContent player={player} badgeVariant={badgeVariant} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.benchDropPrompt}>
          <span>No substitutes matching this filter. Drop a starter here to return them to the bench.</span>
        </div>
      )}
    </div>
  );
};
