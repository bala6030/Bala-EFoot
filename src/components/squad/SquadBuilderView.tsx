import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield,
  Swords,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  X,
  ArrowDownCircle,
} from 'lucide-react';
import {
  TacticalLayout,
  FormationId,
  PlayerCard,
  SquadBuilderState,
} from '../../types';
import { getAllPlayers, getPlayerById } from '../../data/playerRepository';
import {
  getFormation,
  SUPPORTED_FORMATIONS,
  rearrangeAssignmentsOnFormationChange,
} from '../../data/formationData';
import {
  loadSquadState,
  saveSquadState,
  validateLayout,
  DEFAULT_ATTACK_LAYOUT,
  DEFAULT_DEFENCE_LAYOUT,
} from '../../data/squadRepository';
import { FootballPitch } from './FootballPitch';
import { SubstitutesBench } from './SubstitutesBench';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import styles from './SquadBuilderView.module.css';

interface SelectedSource {
  type: 'bench' | 'pitch';
  id: string; // playerId
  slotId?: string; // if pitch
}

export const SquadBuilderView: React.FC = () => {
  const allPlayers = useMemo(() => getAllPlayers(), []);
  const allPlayersById = useMemo(() => {
    const map: Record<string, PlayerCard> = {};
    for (const p of allPlayers) {
      map[p.id] = p;
    }
    return map;
  }, [allPlayers]);

  // Squad State
  const [squadState, setSquadState] = useState<SquadBuilderState>(() => loadSquadState());
  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Persist whenever state changes
  useEffect(() => {
    saveSquadState(squadState);
  }, [squadState]);

  const activeLayout = squadState.activeLayout;
  const currentLayoutState = squadState[activeLayout];
  const currentFormation = getFormation(currentLayoutState.formationId);

  // Validation
  const validation = useMemo(
    () => validateLayout(currentLayoutState, allPlayers),
    [currentLayoutState, allPlayers]
  );

  // Unassigned players for current layout (Substitutes)
  const benchPlayers = useMemo(() => {
    const assignedIds = new Set(Object.values(currentLayoutState.assignments).filter(Boolean));
    return allPlayers.filter((p) => !assignedIds.has(p.id));
  }, [allPlayers, currentLayoutState.assignments]);

  const showFeedback = useCallback((msg: string) => {
    setFeedbackMessage(msg);
  }, []);

  // Switch tactical layout
  const handleSwitchLayout = (layout: TacticalLayout) => {
    if (layout === squadState.activeLayout) return;
    setSelectedSource(null);
    setSquadState((prev) => ({
      ...prev,
      activeLayout: layout,
    }));
    showFeedback(`Switched to ${layout === 'attack' ? 'Attack' : 'Defence'} layout.`);
  };

  // Change formation
  const handleChangeFormation = (newFormationId: FormationId) => {
    if (newFormationId === currentLayoutState.formationId) return;

    const { assignments: newAssignments, notes } = rearrangeAssignmentsOnFormationChange(
      currentLayoutState.formationId,
      newFormationId,
      currentLayoutState.assignments,
      getPlayerById
    );

    setSelectedSource(null);

    setSquadState((prev) => ({
      ...prev,
      [prev.activeLayout]: {
        formationId: newFormationId,
        assignments: newAssignments,
      },
    }));

    if (notes.length > 0) {
      showFeedback(`Changed to ${newFormationId}: ${notes.slice(0, 2).join('; ')}`);
    } else {
      showFeedback(`Changed formation to ${newFormationId}.`);
    }
  };

  // Assign player to pitch slot
  const assignPlayerToSlot = useCallback(
    (playerId: string, targetSlotId: string, sourceSlotId?: string) => {
      const player = allPlayersById[playerId];
      const playerName = player ? player.name : playerId;
      const targetSlot = currentFormation.slots.find((s) => s.id === targetSlotId);
      const targetSlotName = targetSlot ? targetSlot.name : targetSlotId;

      setSquadState((prev) => {
        const layout = prev[prev.activeLayout];
        const newAssignments = { ...layout.assignments };
        const existingOccupantId = newAssignments[targetSlotId];

        // If source was pitch and we have an occupant: swap
        if (sourceSlotId && sourceSlotId !== targetSlotId) {
          if (existingOccupantId) {
            newAssignments[sourceSlotId] = existingOccupantId;
            newAssignments[targetSlotId] = playerId;
            const displacedPlayer = allPlayersById[existingOccupantId];
            showFeedback(
              `Swapped ${playerName} with ${displacedPlayer ? displacedPlayer.name : existingOccupantId}.`
            );
          } else {
            delete newAssignments[sourceSlotId];
            newAssignments[targetSlotId] = playerId;
            showFeedback(`Moved ${playerName} to ${targetSlotName}.`);
          }
        } else {
          // Source was bench
          newAssignments[targetSlotId] = playerId;
          if (existingOccupantId) {
            const displacedPlayer = allPlayersById[existingOccupantId];
            showFeedback(
              `Assigned ${playerName} to ${targetSlotName} (displaced ${
                displacedPlayer ? displacedPlayer.name : existingOccupantId
              } to bench).`
            );
          } else {
            showFeedback(`Assigned ${playerName} to ${targetSlotName}.`);
          }
        }

        return {
          ...prev,
          [prev.activeLayout]: {
            ...layout,
            assignments: newAssignments,
          },
        };
      });

      setSelectedSource(null);
    },
    [allPlayersById, currentFormation.slots, showFeedback]
  );

  // Remove player from slot (move to bench)
  const handleRemoveFromSlot = useCallback(
    (slotId: string) => {
      const occupantId = currentLayoutState.assignments[slotId];
      if (!occupantId) return;

      const player = allPlayersById[occupantId];
      const playerName = player ? player.name : occupantId;

      setSquadState((prev) => {
        const layout = prev[prev.activeLayout];
        const newAssignments = { ...layout.assignments };
        delete newAssignments[slotId];
        return {
          ...prev,
          [prev.activeLayout]: {
            ...layout,
            assignments: newAssignments,
          },
        };
      });

      setSelectedSource(null);
      showFeedback(`Moved ${playerName} back to substitutes bench.`);
    },
    [allPlayersById, currentLayoutState.assignments, showFeedback]
  );

  // Click on a pitch slot
  const handleSlotClick = (slotId: string) => {
    const occupantId = currentLayoutState.assignments[slotId];

    // If nothing currently selected:
    if (!selectedSource) {
      if (occupantId) {
        setSelectedSource({ type: 'pitch', id: occupantId, slotId });
      } else {
        showFeedback('Empty slot selected. Click or drag a bench player to place them here.');
      }
      return;
    }

    // If something was already selected:
    if (selectedSource.type === 'bench') {
      assignPlayerToSlot(selectedSource.id, slotId);
    } else if (selectedSource.type === 'pitch') {
      if (selectedSource.slotId === slotId) {
        // Deselect if clicking same slot
        setSelectedSource(null);
      } else {
        // Move or swap
        assignPlayerToSlot(selectedSource.id, slotId, selectedSource.slotId);
      }
    }
  };

  // Click on a bench player
  const handleSelectBenchPlayer = (player: PlayerCard) => {
    // If a pitch player was selected, clicking a bench player swaps them!
    if (selectedSource && selectedSource.type === 'pitch' && selectedSource.slotId) {
      assignPlayerToSlot(player.id, selectedSource.slotId);
      return;
    }

    // Toggle selection
    if (selectedSource && selectedSource.id === player.id) {
      setSelectedSource(null);
    } else {
      setSelectedSource({ type: 'bench', id: player.id });
    }
  };

  // Drop on pitch slot
  const handleDropOnSlot = (
    targetSlotId: string,
    source: { type: 'bench' | 'pitch'; id: string; slotId?: string }
  ) => {
    assignPlayerToSlot(source.id, targetSlotId, source.slotId);
  };

  // Drop on bench area
  const handleDropOnBench = (source: { type: 'bench' | 'pitch'; id: string; slotId?: string }) => {
    if (source.type === 'pitch' && source.slotId) {
      handleRemoveFromSlot(source.slotId);
    }
  };

  // Reset layout to default Starting XI
  const handleResetLayout = () => {
    const defaultLayout =
      activeLayout === 'attack' ? DEFAULT_ATTACK_LAYOUT : DEFAULT_DEFENCE_LAYOUT;

    setSquadState((prev) => ({
      ...prev,
      [activeLayout]: {
        formationId: defaultLayout.formationId,
        assignments: { ...defaultLayout.assignments },
      },
    }));

    setSelectedSource(null);
    showFeedback(`Reset ${activeLayout === 'attack' ? 'Attack' : 'Defence'} to authentic Starting XI.`);
  };

  // Selected player entity
  const selectedPlayer = selectedSource ? allPlayersById[selectedSource.id] : null;

  return (
    <div className={styles.squadContainer}>
      {/* Top Header & Layout Toggle */}
      <div className={styles.topBar}>
        <div className={styles.headingArea}>
          <h1 className={styles.title}>Squad & Pitch Builder</h1>
          <p className={styles.subtitle}>
            Independent Attack and Defence layouts with drag-and-drop and touch assignment
          </p>
        </div>

        {/* Tactical Layout Switcher */}
        <div className={styles.layoutToggleGroup} role="tablist" aria-label="Tactical Layouts">
          <button
            role="tab"
            aria-selected={activeLayout === 'attack'}
            className={`${styles.layoutToggleButton} ${
              activeLayout === 'attack' ? styles.layoutToggleAttackActive : ''
            }`}
            onClick={() => handleSwitchLayout('attack')}
          >
            <Swords size={16} />
            <span>Attack Layout</span>
          </button>

          <button
            role="tab"
            aria-selected={activeLayout === 'defence'}
            className={`${styles.layoutToggleButton} ${
              activeLayout === 'defence' ? styles.layoutToggleDefenceActive : ''
            }`}
            onClick={() => handleSwitchLayout('defence')}
          >
            <Shield size={16} />
            <span>Defence Layout</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Formations, Validation Status, and Reset */}
      <div className={styles.controlsCard}>
        {/* Formation Selector */}
        <div className={styles.formationSelectorArea}>
          <span className={styles.selectorLabel}>Formation:</span>
          <div className={styles.formationButtons} role="group" aria-label="Formation Selector">
            {SUPPORTED_FORMATIONS.map((fId) => (
              <button
                key={fId}
                type="button"
                className={`${styles.formationBtn} ${
                  currentLayoutState.formationId === fId ? styles.formationBtnActive : ''
                }`}
                onClick={() => handleChangeFormation(fId)}
              >
                {fId}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ({currentFormation.description})
          </span>
        </div>

        {/* Validation and Reset Actions */}
        <div className={styles.validationStatusArea}>
          {validation.isValid ? (
            <Badge variant="lime" size="md" icon={<CheckCircle2 size={14} />}>
              11 / 11 Starting XI Complete
            </Badge>
          ) : (
            <Badge variant="purple" size="md" icon={<AlertTriangle size={14} />}>
              {validation.filledCount} / {validation.totalSlots} Slots Filled
              {!validation.hasGK && ' • Missing GK'}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={14} />}
            onClick={handleResetLayout}
            title="Reset this layout to authentic starting XI"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div className={styles.feedbackBanner} role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} className="text-neon-blue" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Selected Player Action Bar */}
      {selectedPlayer && (
        <div className={styles.selectionBar} role="region" aria-label="Selection toolbar">
          <div className={styles.selectionText}>
            <span style={{ color: 'var(--accent-lime)' }}>●</span>
            <span>
              Selected: <strong>{selectedPlayer.name}</strong> ({selectedPlayer.primaryPosition},{' '}
              {selectedPlayer.overallRating ?? '—'} OVR)
              {selectedSource?.type === 'pitch' ? ' from Pitch' : ' from Bench'}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              — Tap any pitch slot to place or swap
            </span>
          </div>

          <div className={styles.selectionActions}>
            {selectedSource?.type === 'pitch' && selectedSource.slotId && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowDownCircle size={14} />}
                onClick={() => handleRemoveFromSlot(selectedSource.slotId!)}
              >
                Move to Bench
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setSelectedSource(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Center: Interactive Football Pitch */}
      <section className={styles.pitchSection} aria-label="Football Pitch">
        <FootballPitch
          formation={currentFormation}
          assignments={currentLayoutState.assignments}
          allPlayersById={allPlayersById}
          selectedSlotId={selectedSource?.type === 'pitch' ? selectedSource.slotId ?? null : null}
          onSlotClick={handleSlotClick}
          onRemovePlayerFromSlot={handleRemoveFromSlot}
          onDropOnSlot={handleDropOnSlot}
          onDragStartSlot={(slotId, playerId) =>
            setSelectedSource({ type: 'pitch', id: playerId, slotId })
          }
        />
      </section>

      {/* Bottom: Substitutes Bench */}
      <section aria-label="Substitutes Bench">
        <SubstitutesBench
          benchPlayers={benchPlayers}
          selectedPlayerId={selectedSource?.type === 'bench' ? selectedSource.id : null}
          onSelectPlayer={handleSelectBenchPlayer}
          onDropOnBench={handleDropOnBench}
          onDragStartBench={(player) =>
            setSelectedSource({ type: 'bench', id: player.id })
          }
        />
      </section>
    </div>
  );
};
