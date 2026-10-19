import React, { useState } from 'react';
import {
  ArrowLeft,
  Pin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  BarChart3,
  Dumbbell,
  Shield,
  Crosshair,
  User,
} from 'lucide-react';
import { PlayerCard } from '../../types';
import {
  getPinnedAttributesForPlayer,
  setPinnedAttributesForPlayer,
  ALL_ATTRIBUTES,
} from '../../data/playerRepository';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { PinnedAttributesModal } from './PinnedAttributesModal';
import styles from './PlayerProfile.module.css';

export interface PlayerProfileProps {
  player: PlayerCard;
  onBack: () => void;
}

type TabCategory = 'attacking' | 'defending' | 'athleticism' | 'playerModel' | 'skills' | 'performance';

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, onBack }) => {
  const [pinnedKeys, setPinnedKeys] = useState<string[]>(() =>
    getPinnedAttributesForPlayer(player.id, player.primaryPosition)
  );
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabCategory>('attacking');

  const handleSavePinned = (newKeys: string[]) => {
    setPinnedKeys(newKeys);
    setPinnedAttributesForPlayer(player.id, newKeys);
  };

  // Helper to extract attribute value across nested bundles
  const getAttributeValue = (key: string): { val: number | string | null; isNumeric: boolean } => {
    const attacking = player.attributes.attacking as unknown as Record<string, unknown>;
    const defending = player.attributes.defending as unknown as Record<string, unknown>;
    const athleticism = player.attributes.athleticism as unknown as Record<string, unknown>;
    const goalkeeping = player.attributes.goalkeeping as unknown as Record<string, unknown> | null;
    const model = player.attributes.playerModel as unknown as Record<string, unknown>;

    let rawVal: unknown = undefined;
    if (key in attacking) rawVal = attacking[key];
    else if (key in defending) rawVal = defending[key];
    else if (key in athleticism) rawVal = athleticism[key];
    else if (goalkeeping && key in goalkeeping) rawVal = goalkeeping[key];
    else if (key in model) rawVal = model[key];

    if (rawVal === undefined || rawVal === null || rawVal === '') {
      return { val: null, isNumeric: false };
    }

    if (typeof rawVal === 'number') {
      return { val: rawVal, isNumeric: true };
    }

    const num = Number(rawVal);
    if (!isNaN(num) && typeof rawVal !== 'boolean') {
      return { val: num, isNumeric: true };
    }

    return { val: String(rawVal), isNumeric: false };
  };

  const getTierClass = (val: number | null) => {
    if (val === null) return '';
    if (val >= 90) return styles.tier90;
    if (val >= 80) return styles.tier80;
    if (val >= 70) return styles.tier70;
    return '';
  };

  const getBarFillColor = (val: number | null) => {
    if (val === null) return 'transparent';
    if (val >= 90) return 'var(--accent-lime)';
    if (val >= 80) return 'var(--accent-blue)';
    if (val >= 70) return 'var(--accent-purple)';
    return 'var(--text-muted)';
  };

  const renderAttributeRow = (key: string, label: string) => {
    const { val, isNumeric } = getAttributeValue(key);

    return (
      <div key={key} className={styles.attrRow}>
        <span className={styles.attrLabel}>{label}</span>
        <div className={styles.attrRight}>
          {isNumeric && typeof val === 'number' ? (
            <>
              <div className={styles.attrBarBg}>
                <div
                  className={styles.attrBarFill}
                  style={{
                    width: `${Math.min(100, Math.max(0, val))}%`,
                    backgroundColor: getBarFillColor(val),
                  }}
                />
              </div>
              <span className={`${styles.attrVal} ${getTierClass(val)}`}>{val}</span>
            </>
          ) : val !== null ? (
            <span className={styles.attrVal}>{String(val)}</span>
          ) : (
            <span className={styles.attrValUnverified}>— Unverified</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.profileContainer}>
      {/* Top Navigation */}
      <div className={styles.topNav}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Players Catalogue</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Badge variant="blue" size="sm">
            Stable ID: {player.id}
          </Badge>
          <Badge variant={player.isAcquired ? 'lime' : 'default'} size="sm">
            {player.isAcquired ? 'Acquired Card' : 'Not Acquired'}
          </Badge>
        </div>
      </div>

      {/* Main Identity Header Card */}
      <Card variant="glass" padding="lg">
        <div className={styles.headerCard}>
          <div className={styles.ratingBlock}>
            <span className={styles.ratingBig}>{player.overallRating ?? '—'}</span>
            <span className={styles.ratingSub}>Overall Rating</span>
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.playerName}>{player.name}</h1>
              <Badge variant="lime" size="md">
                {player.primaryPosition}
              </Badge>
            </div>

            {player.cardName && <p className={styles.cardVersion}>{player.cardName}</p>}

            <div className={styles.tagRow}>
              <Badge variant="default" size="sm">
                Style: {player.playingStyle !== 'None' ? player.playingStyle : 'Standard'}
              </Badge>
              <Badge variant="default" size="sm">
                Foot: {player.preferredFoot || 'Unrecorded'}
              </Badge>
              <Badge variant={player.inStartingXI ? 'lime' : 'default'} size="sm">
                Squad: {player.inStartingXI ? 'Starting XI' : 'Substitute'}
              </Badge>
              {player.efhubUrl && (
                <a
                  href={player.efhubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="outline" size="sm" icon={<ExternalLink size={12} />}>
                    eFHUB Reference
                  </Button>
                </a>
              )}
            </div>

            {/* Quick Details Grid */}
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Height</span>
                <span className={player.heightCm ? styles.detailValue : styles.detailValueEmpty}>
                  {player.heightCm ? `${player.heightCm} cm` : '— Unrecorded'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Weight</span>
                <span className={player.weightKg ? styles.detailValue : styles.detailValueEmpty}>
                  {player.weightKg ? `${player.weightKg} kg` : '— Unrecorded'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Squad Position</span>
                <span className={player.squadPosition ? styles.detailValue : styles.detailValueEmpty}>
                  {player.squadPosition || '—'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Manager Build</span>
                <span className={player.managerNotes ? styles.detailValue : styles.detailValueEmpty}>
                  {player.managerNotes || '— Default'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Provenance Alert */}
      <div className={styles.provenanceBanner}>
        <AlertCircle size={18} className={styles.provenanceIcon} />
        <div>
          <strong>Data Provenance Notice:</strong>{' '}
          {player.provenance.attributeNotes ||
            'Imported from user-provided player workbook. Exact card build and progression values remain pending in-game verification.'}
          {' '}Unknown or unconfirmed fields remain explicitly blank.
        </div>
      </div>

      {/* Six Pinned Key Attributes Section */}
      <section className={styles.pinnedSection} aria-label="Key Pinned Attributes">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Pin size={18} className="text-neon-lime" />
            <span>Key Attributes (6 Pinned)</span>
          </h2>

          <Button
            variant="outline"
            size="sm"
            icon={<Pin size={14} />}
            onClick={() => setIsPinModalOpen(true)}
          >
            Customize Pinned ({pinnedKeys.length}/6)
          </Button>
        </div>

        <div className={styles.pinnedGrid}>
          {pinnedKeys.map((key) => {
            const def = ALL_ATTRIBUTES.find((a) => a.key === key);
            const label = def ? def.label : key;
            const { val, isNumeric } = getAttributeValue(key);

            return (
              <div key={key} className={styles.pinnedTile}>
                <span className={styles.pinnedTileLabel} title={label}>
                  {label}
                </span>
                <span
                  className={`${styles.pinnedTileValue} ${
                    isNumeric && typeof val === 'number' ? getTierClass(val) : ''
                  }`}
                >
                  {val !== null ? val : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Groups Tabs */}
      <section aria-label="Attribute Categories">
        <div className={styles.categoryTabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'attacking'}
            className={`${styles.categoryTab} ${activeTab === 'attacking' ? styles.categoryTabActive : ''}`}
            onClick={() => setActiveTab('attacking')}
          >
            <Crosshair size={14} style={{ display: 'inline', marginRight: 6 }} />
            Attacking
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'defending'}
            className={`${styles.categoryTab} ${activeTab === 'defending' ? styles.categoryTabActive : ''}`}
            onClick={() => setActiveTab('defending')}
          >
            <Shield size={14} style={{ display: 'inline', marginRight: 6 }} />
            Defending
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'athleticism'}
            className={`${styles.categoryTab} ${activeTab === 'athleticism' ? styles.categoryTabActive : ''}`}
            onClick={() => setActiveTab('athleticism')}
          >
            <Dumbbell size={14} style={{ display: 'inline', marginRight: 6 }} />
            Athleticism
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'playerModel'}
            className={`${styles.categoryTab} ${activeTab === 'playerModel' ? styles.categoryTabActive : ''}`}
            onClick={() => setActiveTab('playerModel')}
          >
            <User size={14} style={{ display: 'inline', marginRight: 6 }} />
            Player Model
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'skills'}
            className={`${styles.categoryTab} ${activeTab === 'skills' ? styles.categoryTabActive : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <Sparkles size={14} style={{ display: 'inline', marginRight: 6 }} />
            Skills ({player.skills.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'performance'}
            className={`${styles.categoryTab} ${activeTab === 'performance' ? styles.categoryTabActive : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <BarChart3 size={14} style={{ display: 'inline', marginRight: 6 }} />
            Performance
          </button>
        </div>

        <div style={{ marginTop: 'var(--space-4)' }}>
          {activeTab === 'attacking' && (
            <div className={styles.attributeList}>
              {renderAttributeRow('offensiveAwareness', 'Offensive Awareness')}
              {renderAttributeRow('ballControl', 'Ball Control')}
              {renderAttributeRow('dribbling', 'Dribbling')}
              {renderAttributeRow('tightPossession', 'Tight Possession')}
              {renderAttributeRow('lowPass', 'Low Pass')}
              {renderAttributeRow('loftedPass', 'Lofted Pass')}
              {renderAttributeRow('finishing', 'Finishing')}
              {renderAttributeRow('heading', 'Heading')}
              {renderAttributeRow('setPieceTaking', 'Set Piece Taking')}
              {renderAttributeRow('curl', 'Curl')}
              {renderAttributeRow('weakFootUsage', 'Weak Foot Usage')}
              {renderAttributeRow('weakFootAccuracy', 'Weak Foot Accuracy')}
              {player.primaryPosition === 'GK' && (
                <>
                  {renderAttributeRow('gkAwareness', 'GK Awareness')}
                  {renderAttributeRow('gkCatching', 'GK Catching')}
                  {renderAttributeRow('gkParrying', 'GK Parrying')}
                  {renderAttributeRow('gkReflexes', 'GK Reflexes')}
                  {renderAttributeRow('gkReach', 'GK Reach')}
                  {renderAttributeRow('gkClearing', 'GK Clearing')}
                </>
              )}
            </div>
          )}

          {activeTab === 'defending' && (
            <div className={styles.attributeList}>
              {renderAttributeRow('defensiveAwareness', 'Defensive Awareness')}
              {renderAttributeRow('ballWinning', 'Ball Winning')}
              {renderAttributeRow('aggression', 'Aggression')}
              {renderAttributeRow('defensiveEngagement', 'Defensive Engagement')}
            </div>
          )}

          {activeTab === 'athleticism' && (
            <div className={styles.attributeList}>
              {renderAttributeRow('speed', 'Speed')}
              {renderAttributeRow('acceleration', 'Acceleration')}
              {renderAttributeRow('kickingPower', 'Kicking Power')}
              {renderAttributeRow('jump', 'Jump')}
              {renderAttributeRow('physicalContact', 'Physical Contact')}
              {renderAttributeRow('balance', 'Balance')}
              {renderAttributeRow('stamina', 'Stamina')}
              {renderAttributeRow('form', 'Form')}
              {renderAttributeRow('injuryResistance', 'Injury Resistance')}
            </div>
          )}

          {activeTab === 'playerModel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className={styles.attributeList}>
                {renderAttributeRow('heightCm', 'Height (cm)')}
                {renderAttributeRow('weightKg', 'Weight (kg)')}
                {renderAttributeRow('armLength', 'Arm Length')}
                {renderAttributeRow('shoulderWidth', 'Shoulder Width')}
                {renderAttributeRow('neckLength', 'Neck Length')}
                {renderAttributeRow('chestMeasurement', 'Chest Measurement')}
                {renderAttributeRow('neckSize', 'Neck Size')}
                {renderAttributeRow('shoulderHeight', 'Shoulder Height')}
                {renderAttributeRow('legLength', 'Leg Length')}
                {renderAttributeRow('thighSize', 'Thigh Size')}
                {renderAttributeRow('waistSize', 'Waist Size')}
                {renderAttributeRow('armSize', 'Arm Size')}
                {renderAttributeRow('calfSize', 'Calf Size')}
              </div>
              {player.attributes.playerModel.sourceValidation && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <strong>Source Note:</strong> {player.attributes.playerModel.sourceValidation}
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className={styles.skillsGrid}>
              <Card variant="default" padding="md">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Default Skills (Read-Only)
                  </h3>
                  <div className={styles.skillPills}>
                    {player.skills.filter((s) => s.skillType === 'Default').length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        No default skills recorded.
                      </span>
                    ) : (
                      player.skills
                        .filter((s) => s.skillType === 'Default')
                        .map((s, idx) => (
                          <span
                            key={idx}
                            className={`${styles.skillPill} ${s.isHighlightGold ? styles.skillPillGold : ''}`}
                          >
                            {s.isHighlightGold && <Sparkles size={12} />}
                            <span>{s.skillName}</span>
                          </span>
                        ))
                    )}
                  </div>
                </div>
              </Card>

              <Card variant="default" padding="md">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Additional Skills
                    </h3>
                    <Badge variant="purple" size="sm">
                      {player.skills.filter((s) => s.skillType === 'Additional').length} / 5 Slots
                    </Badge>
                  </div>
                  <div className={styles.skillPills}>
                    {player.skills.filter((s) => s.skillType === 'Additional').length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        No additional skills assigned.
                      </span>
                    ) : (
                      player.skills
                        .filter((s) => s.skillType === 'Additional')
                        .map((s, idx) => (
                          <span key={idx} className={styles.skillPill}>
                            <ShieldCheck size={12} color="var(--accent-purple)" />
                            <span>{s.skillName}</span>
                          </span>
                        ))
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'performance' && (
            <Card variant="default" padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  All-Time Performance Record
                </h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Matches</span>
                    <span className={styles.detailValue}>
                      {player.overallPerformance.matchesPlayed ?? '—'}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Goals</span>
                    <span className={styles.detailValue}>
                      {player.overallPerformance.goals ?? '—'}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Assists</span>
                    <span className={styles.detailValue}>
                      {player.overallPerformance.assists ?? '—'}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Contributions</span>
                    <span className={styles.detailValue}>
                      {player.overallPerformance.goalContributions ?? '—'}
                    </span>
                  </div>
                </div>
                {player.overallPerformance.notes && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Note: {player.overallPerformance.notes}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Pinned Attributes Customization Dialog */}
      <PinnedAttributesModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        playerId={player.id}
        position={player.primaryPosition}
        currentPinned={pinnedKeys}
        onSave={handleSavePinned}
      />
    </div>
  );
};
