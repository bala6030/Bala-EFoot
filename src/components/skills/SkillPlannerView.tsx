import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Star,
  X,
  Search,
  Plus,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Check,
  HelpCircle,
} from 'lucide-react';
import { SkillCategory, SkillDefinition } from '../../types';
import { getAllPlayers, getPlayerById } from '../../data/playerRepository';
import {
  ALL_SKILL_CATEGORIES,
  searchSkills,
} from '../../data/skillCatalogue';
import {
  getSkillPlan,
  getNativeSkills,
  addPlannedSkill,
  removePlannedSkill,
  toggleSkillHighlight,
  resetSkillPlan,
  setCustomNativeSkills,
  MAX_ADDITIONAL_SKILLS,
} from '../../data/skillPlanRepository';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import styles from './SkillPlannerView.module.css';

export interface SkillPlannerViewProps {
  initialPlayerId?: string;
  onSelectPlayerProfile?: (playerId: string) => void;
}

export const SkillPlannerView: React.FC<SkillPlannerViewProps> = ({
  initialPlayerId,
  onSelectPlayerProfile,
}) => {
  const allPlayers = useMemo(() => getAllPlayers(), []);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    initialPlayerId && allPlayers.some((p) => p.id === initialPlayerId)
      ? initialPlayerId
      : allPlayers[0]?.id || 'P001'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'All'>('All');
  const [imageError, setImageError] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Custom native skills entry state for cards with missing native data (e.g. P023 Neuer)
  const [customNativeInput, setCustomNativeInput] = useState('');
  const [isEditingCustomNative, setIsEditingCustomNative] = useState(false);

  // Sync when initialPlayerId changes from outside
  useEffect(() => {
    if (initialPlayerId && allPlayers.some((p) => p.id === initialPlayerId)) {
      setSelectedPlayerId(initialPlayerId);
      setImageError(false);
    }
  }, [initialPlayerId, allPlayers]);

  // Current selected player
  const player = useMemo(() => {
    return getPlayerById(selectedPlayerId) || allPlayers[0];
  }, [selectedPlayerId, allPlayers]);

  // Current skill plan from storage
  const [planState, setPlanState] = useState(() => getSkillPlan(player.id));

  // Reload plan state whenever selected player changes
  useEffect(() => {
    setPlanState(getSkillPlan(player.id));
    setImageError(false);
    setFeedback(null);
    setIsEditingCustomNative(false);
  }, [player.id]);

  // Native skills calculation
  const nativeSkillsData = useMemo(() => {
    return getNativeSkills(player, planState.customNativeSkills);
  }, [player, planState.customNativeSkills]);

  // Categorized catalogue skills matching search & filter
  const filteredSkills = useMemo(() => {
    return searchSkills(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  // Clear feedback after 4 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Additional skills list
  const additionalSkills = planState.additionalSkills;
  const usedSlots = additionalSkills.length;
  const remainingSlots = MAX_ADDITIONAL_SKILLS - usedSlots;

  // Set of native skill names lowercase
  const nativeNamesSet = useMemo(() => {
    return new Set(nativeSkillsData.skills.map((s) => s.toLowerCase()));
  }, [nativeSkillsData.skills]);

  // Set of planned skill names lowercase
  const plannedNamesSet = useMemo(() => {
    return new Set(additionalSkills.map((s) => s.skillName.toLowerCase()));
  }, [additionalSkills]);

  // Missing recommended skills for the player's role
  const recommendedSkills = useMemo(() => {
    const pos = player.primaryPosition.toUpperCase();
    let targets: string[] = [];

    if (['CF', 'SS', 'LWF', 'RWF'].includes(pos)) {
      targets = [
        'First-time Shot',
        'Acrobatic Finishing',
        'Long-range Curler',
        'Double Touch',
        'Outside Curler',
        'One-touch Pass',
        'Through Passing',
      ];
    } else if (['AMF', 'CMF', 'DMF', 'LMF', 'RMF'].includes(pos)) {
      targets = [
        'One-touch Pass',
        'Through Passing',
        'Weighted Pass',
        'Interception',
        'Sole Control',
        'Double Touch',
      ];
    } else if (['CB', 'LB', 'RB'].includes(pos)) {
      targets = [
        'Interception',
        'Man Marking',
        'Blocker',
        'Aerial Superiority',
        'Acrobatic Clearance',
        'Sliding Tackle',
      ];
    } else if (pos === 'GK') {
      targets = [
        'GK High Punt',
        'GK Low Punt',
        'GK Long Throw',
        'GK Penalty Saver',
      ];
    }

    // Filter to those the player currently lacks natively and additionally
    return targets.filter(
      (skill) =>
        !nativeNamesSet.has(skill.toLowerCase()) &&
        !plannedNamesSet.has(skill.toLowerCase())
    );
  }, [player.primaryPosition, nativeNamesSet, plannedNamesSet]);

  // Handlers
  const handleSelectPlayer = (id: string) => {
    setSelectedPlayerId(id);
  };

  const handleAddSkill = (skillName: string) => {
    const res = addPlannedSkill(player, skillName);
    if (res.success && res.plan) {
      setPlanState(res.plan);
      setFeedback({
        type: 'success',
        message: `Added "${skillName}" to ${player.name}'s planned skills.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to add skill.',
      });
    }
  };

  const handleRemoveSkill = (skillName: string) => {
    const res = removePlannedSkill(player.id, skillName);
    setPlanState(res.plan);
    setFeedback({
      type: 'success',
      message: `Removed "${skillName}".`,
    });
  };

  const handleToggleHighlight = (skillName: string) => {
    const res = toggleSkillHighlight(player.id, skillName);
    setPlanState(res.plan);
  };

  const handleResetPlan = () => {
    if (usedSlots === 0) return;
    if (window.confirm(`Reset all planned additional skills for ${player.name}?`)) {
      const res = resetSkillPlan(player.id);
      setPlanState(res.plan);
      setFeedback({
        type: 'success',
        message: `Reset planned additional skills for ${player.name}.`,
      });
    }
  };

  const handleSaveCustomNative = () => {
    const skills = customNativeInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (skills.length === 0) {
      setFeedback({ type: 'error', message: 'Enter at least one skill name.' });
      return;
    }

    const res = setCustomNativeSkills(player.id, skills);
    setPlanState(res.plan);
    setIsEditingCustomNative(false);
    setFeedback({
      type: 'success',
      message: `Saved ${skills.length} verified native skills for ${player.name}.`,
    });
  };

  // Helper for category tag styling
  const getCategoryClass = (cat: SkillCategory) => {
    switch (cat) {
      case 'Shooting':
        return styles.catShooting;
      case 'Passing':
        return styles.catPassing;
      case 'Dribbling':
        return styles.catDribbling;
      case 'Defending':
        return styles.catDefending;
      case 'Goalkeeping':
        return styles.catGoalkeeping;
      case 'Physical & Mental':
        return styles.catPhysicalMental;
      default:
        return '';
    }
  };

  // Initials for image fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={styles.skillsContainer}>
      {/* Header */}
      <div className={styles.headerSection}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>
              <Sparkles size={28} color="var(--accent-lime)" />
              <span>Player Skill Planner</span>
            </h1>
            <p className={styles.subtitle}>
              Configure and preview up to 5 additional eFootball skills per card. Native
              skills are protected, duplicates are prevented, and plans persist locally across reloads.
            </p>
          </div>
        </div>

        {/* Player Selector Bar */}
        <div className={styles.selectorBar}>
          <label htmlFor="player-picker" className={styles.selectorLabel}>
            Select Player Card:
          </label>
          <select
            id="player-picker"
            className={styles.playerSelect}
            value={selectedPlayerId}
            onChange={(e) => handleSelectPlayer(e.target.value)}
          >
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.primaryPosition} · OVR {p.overallRating ?? '—'}) — {p.cardName || p.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`${styles.feedbackBanner} ${
            feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
          }`}
          role="status"
        >
          {feedback.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Selected Player Identity Card */}
      <Card variant="glass" padding="md">
        <div className={styles.playerHeroCard}>
          <div className={styles.artworkContainer}>
            {player.imageUrl && !imageError ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className={styles.artworkImg}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={styles.artworkFallback}>
                <span className={styles.initials}>{getInitials(player.name)}</span>
                <span style={{ fontSize: '0.65rem' }}>No Artwork</span>
              </div>
            )}
            <div className={styles.artworkOverlay}>
              <span className={styles.ovrBadge}>
                {player.primaryPosition} · {player.overallRating ?? '—'}
              </span>
            </div>
          </div>

          <div className={styles.heroDetails}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 className={styles.playerName}>{player.name}</h2>
                <span className={styles.cardVersion}>
                  {player.cardName || 'Standard Edition'}
                </span>
              </div>
              {onSelectPlayerProfile && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelectPlayerProfile(player.id)}
                >
                  View Profile
                </Button>
              )}
            </div>

            <div className={styles.playerMetaRow}>
              <Badge variant="blue" size="sm">
                ID: {player.id}
              </Badge>
              <Badge variant="purple" size="sm">
                {player.playingStyle !== 'None' ? player.playingStyle : 'Standard Play'}
              </Badge>
              {player.preferredFoot && (
                <Badge variant="default" size="sm">
                  Foot: {player.preferredFoot}
                </Badge>
              )}
              {player.club && (
                <Badge variant="default" size="sm">
                  {player.club}
                </Badge>
              )}
              {player.nationality && (
                <Badge variant="default" size="sm">
                  {player.nationality}
                </Badge>
              )}
            </div>

            {/* Recommended missing skills helper */}
            {recommendedSkills.length > 0 && (
              <div className={styles.recommendedSection}>
                <div className={styles.recommendedTitle}>
                  Recommended Missing Skills for {player.primaryPosition}:
                </div>
                <div className={styles.recommendedChips}>
                  {recommendedSkills.map((skillName) => (
                    <button
                      key={skillName}
                      type="button"
                      className={styles.recommendedChip}
                      onClick={() => handleAddSkill(skillName)}
                      disabled={remainingSlots === 0}
                      title={remainingSlots === 0 ? 'Slots are full' : `Add ${skillName}`}
                    >
                      <Plus size={12} />
                      <span>{skillName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Main Two-Column Workspace */}
      <div className={styles.workspaceGrid}>
        {/* Left Column: Planned Additional Slots & Native Skills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Planned Additional Skills Card */}
          <Card variant="default" padding="lg">
            <div className={styles.slotsCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <Sparkles size={18} color="var(--accent-purple)" />
                  <span>Planned Additional Skills</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant={remainingSlots === 0 ? 'purple' : 'lime'} size="sm">
                    {usedSlots} / {MAX_ADDITIONAL_SKILLS} Slots Used
                  </Badge>
                  {usedSlots > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetPlan}
                      title="Clear planned skills"
                    >
                      <RotateCcw size={14} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Visual 5-Slot Rack */}
              <div className={styles.slotRack}>
                {Array.from({ length: MAX_ADDITIONAL_SKILLS }).map((_, index) => {
                  const planned = additionalSkills[index];
                  if (planned) {
                    return (
                      <div
                        key={planned.skillName}
                        className={`${styles.slotItem} ${
                          planned.isHighlightGold ? styles.slotItemGold : ''
                        }`}
                      >
                        <div className={styles.slotLeft}>
                          <span
                            className={`${styles.slotIndex} ${styles.slotIndexFilled}`}
                          >
                            {index + 1}
                          </span>
                          <span className={styles.slotSkillName}>
                            {planned.skillName}
                          </span>
                        </div>
                        <div className={styles.slotActions}>
                          <button
                            type="button"
                            className={`${styles.goldToggleBtn} ${
                              planned.isHighlightGold ? styles.goldToggleActive : ''
                            }`}
                            onClick={() => handleToggleHighlight(planned.skillName)}
                            title={
                              planned.isHighlightGold
                                ? 'Remove gold highlight glow'
                                : 'Toggle gold highlight glow'
                            }
                            aria-label={`Toggle highlight for ${planned.skillName}`}
                          >
                            <Star
                              size={15}
                              fill={planned.isHighlightGold ? '#ffd700' : 'none'}
                            />
                          </button>
                          <button
                            type="button"
                            className={styles.removeSlotBtn}
                            onClick={() => handleRemoveSkill(planned.skillName)}
                            title={`Remove ${planned.skillName}`}
                            aria-label={`Remove ${planned.skillName}`}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={`empty-${index}`} className={styles.emptySlotItem}>
                      <span className={styles.slotIndex}>{index + 1}</span>
                      <span>Slot {index + 1}: Empty — Select a skill from catalogue to assign</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Native Skills Card */}
          <Card variant="default" padding="lg">
            <div className={styles.slotsCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <ShieldCheck size={18} color="var(--accent-blue)" />
                  <span>Native Card Skills (Source)</span>
                </div>
                <Badge variant={nativeSkillsData.isKnown ? 'blue' : 'default'} size="sm">
                  {nativeSkillsData.isKnown
                    ? `${nativeSkillsData.skills.length} Native Skills (Read-Only)`
                    : 'Data Unavailable'}
                </Badge>
              </div>

              {nativeSkillsData.isKnown ? (
                <div className={styles.nativeList}>
                  {nativeSkillsData.skills.map((skillName, idx) => (
                    <span key={idx} className={styles.nativePill}>
                      <ShieldCheck size={12} color="var(--accent-blue)" />
                      <span>{skillName}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className={styles.unknownNotice}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                    <HelpCircle size={16} />
                    <span>Native skills unavailable for this card</span>
                  </div>
                  <p>
                    No native skill records exist in the verified project data for {player.name}.
                    You can still assign up to 5 additional skills, or record verified native skills manually.
                  </p>
                  {!isEditingCustomNative ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditingCustomNative(true)}
                    >
                      Record Verified Native Skills
                    </Button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        placeholder="Comma-separated skills (e.g. GK High Punt, GK Penalty Saver)"
                        value={customNativeInput}
                        onChange={(e) => setCustomNativeInput(e.target.value)}
                        className={styles.searchInput}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="primary" size="sm" onClick={handleSaveCustomNative}>
                          Save Native Skills
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingCustomNative(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Reusable Skill Catalogue Explorer */}
        <Card variant="default" padding="lg">
          <div className={styles.catalogueCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Search size={18} color="var(--accent-lime)" />
                <span>Skill Catalogue ({filteredSkills.length})</span>
              </div>
            </div>

            {/* Search Box */}
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search skills by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Category Filter Pills */}
            <div className={styles.categoryPills}>
              <button
                type="button"
                className={`${styles.catPill} ${
                  selectedCategory === 'All' ? styles.catPillActive : ''
                }`}
                onClick={() => setSelectedCategory('All')}
              >
                All
              </button>
              {ALL_SKILL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.catPill} ${
                    selectedCategory === cat ? styles.catPillActive : ''
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scrollable Skills List */}
            <div className={styles.skillsScrollList}>
              {filteredSkills.map((skill: SkillDefinition) => {
                const isNative = nativeNamesSet.has(skill.name.toLowerCase());
                const isAdded = plannedNamesSet.has(skill.name.toLowerCase());
                const isSlotsFull = remainingSlots === 0 && !isAdded;

                return (
                  <div key={skill.id} className={styles.skillRow}>
                    <div className={styles.skillInfo}>
                      <div className={styles.skillTopLine}>
                        <span className={styles.skillTitle}>{skill.name}</span>
                        <span
                          className={`${styles.skillCatTag} ${getCategoryClass(
                            skill.category
                          )}`}
                        >
                          {skill.category}
                        </span>
                      </div>
                      <p className={styles.skillDesc}>{skill.description}</p>
                    </div>

                    <div className={styles.actionButton}>
                      {isNative ? (
                        <Badge variant="blue" size="sm">
                          Native
                        </Badge>
                      ) : isAdded ? (
                        <Badge variant="lime" size="sm">
                          Added ✓
                        </Badge>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isSlotsFull}
                          onClick={() => handleAddSkill(skill.name)}
                          title={isSlotsFull ? '5 additional skill slots full' : `Add ${skill.name}`}
                        >
                          {isSlotsFull ? 'Slots Full' : '+ Add'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
