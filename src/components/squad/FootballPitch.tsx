import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { FormationDefinition, FormationSlot, PlayerCard } from '../../types';
import styles from './FootballPitch.module.css';

export interface FootballPitchProps {
  formation: FormationDefinition;
  assignments: Record<string, string>; // slotId -> playerId
  allPlayersById: Record<string, PlayerCard>;
  selectedSlotId: string | null;
  onSlotClick: (slotId: string) => void;
  onRemovePlayerFromSlot: (slotId: string) => void;
  onDropOnSlot: (targetSlotId: string, sourceData: { type: 'bench' | 'pitch'; id: string; slotId?: string }) => void;
  onDragStartSlot: (slotId: string, playerId: string) => void;
}

export const FootballPitch: React.FC<FootballPitchProps> = ({
  formation,
  assignments,
  allPlayersById,
  selectedSlotId,
  onSlotClick,
  onRemovePlayerFromSlot,
  onDropOnSlot,
  onDragStartSlot,
}) => {
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  // Track image errors per player so broken images fall back gracefully
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleImgError = useCallback((playerId: string) => {
    setImgErrors((prev) => ({ ...prev, [playerId]: true }));
  }, []);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getDisplayName = (fullName: string): string => {
    if (fullName === 'Ronaldinho Gaúcho') return 'Ronaldinho';
    if (fullName === 'Kevin De Bruyne') return 'De Bruyne';
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(-1)[0] || fullName;
  };

  const getRoleClass = (roleCategory: FormationSlot['roleCategory']) => {
    switch (roleCategory) {
      case 'FWD':
        return styles.tagFWD;
      case 'MID':
        return styles.tagMID;
      case 'DEF':
        return styles.tagDEF;
      case 'GK':
        return styles.tagGK;
      default:
        return styles.tagMID;
    }
  };

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlotId !== slotId) {
      setDragOverSlotId(slotId);
    }
  };

  const handleDragLeave = () => {
    setDragOverSlotId(null);
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setDragOverSlotId(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        onDropOnSlot(slotId, parsed);
      }
    } catch (err) {
      console.error('Failed to parse drag-and-drop payload', err);
    }
  };

  const handleCardDragStart = (e: React.DragEvent, slotId: string, playerId: string) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'pitch', id: playerId, slotId })
    );
    e.dataTransfer.effectAllowed = 'move';
    onDragStartSlot(slotId, playerId);
  };

  return (
    <div className={styles.pitchContainer} aria-label="Football pitch formation view">
      {/* Pitch Grass Stripes */}
      <div className={styles.pitchStripes} />

      {/* SVG Markings Overlay */}
      <svg
        className={styles.pitchMarkings}
        viewBox="0 0 100 133.33"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer pitch boundary */}
        <rect
          x="3"
          y="3"
          width="94"
          height="127.33"
          stroke="rgba(0, 229, 255, 0.28)"
          strokeWidth="0.8"
        />

        {/* Halfway line */}
        <line
          x1="3"
          y1="66.66"
          x2="97"
          y2="66.66"
          stroke="rgba(0, 229, 255, 0.28)"
          strokeWidth="0.8"
        />

        {/* Center circle */}
        <circle
          cx="50"
          cy="66.66"
          r="13"
          stroke="rgba(0, 229, 255, 0.28)"
          strokeWidth="0.8"
        />
        {/* Center spot */}
        <circle cx="50" cy="66.66" r="0.8" fill="rgba(57, 255, 20, 0.5)" />

        {/* Top Goal Box (Penalty area) */}
        <rect
          x="22"
          y="3"
          width="56"
          height="22"
          stroke="rgba(0, 229, 255, 0.28)"
          strokeWidth="0.8"
        />
        {/* Top 6-yard box */}
        <rect
          x="34"
          y="3"
          width="32"
          height="8"
          stroke="rgba(0, 229, 255, 0.22)"
          strokeWidth="0.8"
        />
        {/* Top penalty spot */}
        <circle cx="50" cy="16" r="0.8" fill="rgba(57, 255, 20, 0.5)" />
        {/* Top penalty arc */}
        <path
          d="M 40 25 A 10 10 0 0 0 60 25"
          stroke="rgba(0, 229, 255, 0.24)"
          strokeWidth="0.8"
        />

        {/* Bottom Goal Box (Penalty area) */}
        <rect
          x="22"
          y="108.33"
          width="56"
          height="22"
          stroke="rgba(0, 229, 255, 0.28)"
          strokeWidth="0.8"
        />
        {/* Bottom 6-yard box */}
        <rect
          x="34"
          y="122.33"
          width="32"
          height="8"
          stroke="rgba(0, 229, 255, 0.22)"
          strokeWidth="0.8"
        />
        {/* Bottom penalty spot */}
        <circle cx="50" cy="117.33" r="0.8" fill="rgba(57, 255, 20, 0.5)" />
        {/* Bottom penalty arc */}
        <path
          d="M 40 108.33 A 10 10 0 0 1 60 108.33"
          stroke="rgba(0, 229, 255, 0.24)"
          strokeWidth="0.8"
        />

        {/* Corner arcs */}
        <path d="M 3 6 A 3 3 0 0 0 6 3" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="0.8" />
        <path d="M 94 3 A 3 3 0 0 0 97 6" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="0.8" />
        <path d="M 3 127.33 A 3 3 0 0 1 6 130.33" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="0.8" />
        <path d="M 94 130.33 A 3 3 0 0 1 97 127.33" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="0.8" />
      </svg>

      {/* Render 11 Formation Slots */}
      {formation.slots.map((slot) => {
        const assignedPlayerId = assignments[slot.id];
        const player = assignedPlayerId ? allPlayersById[assignedPlayerId] : undefined;
        const isSelected = selectedSlotId === slot.id;
        const isDropHover = dragOverSlotId === slot.id;

        return (
          <div
            key={slot.id}
            className={styles.slotPositioner}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            {player ? (
              <div
                className={`${styles.pitchCard} ${isSelected ? styles.cardSelected : ''} ${
                  isDropHover ? styles.cardDropHover : ''
                }`}
                draggable={true}
                onDragStart={(e) => handleCardDragStart(e, slot.id, player.id)}
                onDragOver={(e) => handleDragOver(e, slot.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, slot.id)}
                onClick={() => onSlotClick(slot.id)}
                role="button"
                tabIndex={0}
                aria-label={`Position ${slot.name}: ${player.name}, OVR ${player.overallRating || 'unrated'}. Click to select or swap.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSlotClick(slot.id);
                  }
                }}
              >
                <button
                  className={styles.benchButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePlayerFromSlot(slot.id);
                  }}
                  title={`Move ${player.name} back to substitutes bench`}
                  aria-label={`Move ${player.name} back to substitutes bench`}
                >
                  <X size={12} />
                </button>

                {/* Rectangular Artwork Container with Overlaid Badges */}
                <div className={styles.pitchArtworkWrapper}>
                  {/* Position Badge overlaid top-left */}
                  <span className={`${styles.posTag} ${getRoleClass(slot.roleCategory)}`}>
                    {slot.name}
                  </span>

                  {/* Overall Rating Badge overlaid top-right */}
                  <span className={styles.ovrTag}>{player.overallRating ?? '—'}</span>

                  {/* Card Artwork Image or Fallback */}
                  {player.imageUrl && !imgErrors[player.id] ? (
                    <img
                      src={player.imageUrl}
                      alt=""
                      aria-hidden="true"
                      className={styles.pitchArtworkImg}
                      onError={() => handleImgError(player.id)}
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <div className={styles.pitchArtworkFallback} aria-hidden="true">
                      <span className={styles.pitchArtworkInitials}>{getInitials(player.name)}</span>
                    </div>
                  )}
                </div>

                {/* Readable Player Name Label */}
                <span className={styles.cardName} title={player.name}>
                  {getDisplayName(player.name)}
                </span>
              </div>
            ) : (
              <div
                className={`${styles.emptySlot} ${isSelected ? styles.emptySlotActiveTarget : ''} ${
                  isDropHover ? styles.cardDropHover : ''
                }`}
                onDragOver={(e) => handleDragOver(e, slot.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, slot.id)}
                onClick={() => onSlotClick(slot.id)}
                role="button"
                tabIndex={0}
                aria-label={`Empty ${slot.name} slot. Tap or drag a player here to assign.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSlotClick(slot.id);
                  }
                }}
              >
                <span className={styles.emptySlotRole}>{slot.name}</span>
                <span className={styles.emptySlotPlus}>+ Place</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
