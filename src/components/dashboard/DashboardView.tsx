import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Hash,
  Activity,
  Gift,
  PlusCircle,
  Users2,
  CalendarDays,
} from 'lucide-react';
import { StatCard } from './StatCard';
import { ChelseaBadge } from './ChelseaBadge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import styles from './DashboardView.module.css';

export interface DashboardViewProps {
  onAddMatchStats?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onAddMatchStats }) => {
  const [performersPeriod, setPerformersPeriod] = useState<'previous' | 'overall'>('previous');

  return (
    <div className={styles.dashboard}>
      {/* Top Header & Quick Action */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <h1 className={styles.heading}>Division Dashboard</h1>
          <p className={styles.subheading}>
            Real-time division standing, season rewards, and player metrics
          </p>
        </div>

        <div className={styles.actionArea}>
          <Button
            variant="primary"
            icon={<PlusCircle size={18} />}
            onClick={onAddMatchStats}
            title="Add Match Stats — Guided season update flow"
          >
            Add Match Stats
          </Button>
          <span className={styles.actionNote}>Guided season update flow</span>
        </div>
      </div>

      {/* Primary KPI Tiles */}
      <section aria-label="Division Statistics" className={styles.statsGrid}>
        <StatCard
          title="Division"
          value="—"
          subtitle="Not enrolled"
          icon={<Trophy size={16} />}
          color="blue"
        />

        <StatCard
          title="Points"
          value="—"
          subtitle="Season points"
          icon={<Activity size={16} />}
        />

        <StatCard
          title="Rank"
          value="—"
          subtitle="Top 100k qualifies"
          icon={<Hash size={16} />}
        />

        <StatCard
          title="Record"
          value="0 - 0 - 0"
          subtitle="Wins • Draws • Losses"
          icon={<Award size={16} />}
        />

        <StatCard
          title="Win Rate"
          value="—%"
          subtitle="Matches completed"
          accessory={<ChelseaBadge size={22} />}
          color="lime"
        />

        <StatCard
          title="Reward Status"
          value="Pending"
          subtitle="Eligible rank required"
          icon={<Gift size={16} />}
          color="purple"
        />
      </section>

      {/* Top Performers Section */}
      <section aria-labelledby="performers-heading">
        <div className={styles.sectionHeader}>
          <h2 id="performers-heading" className={styles.sectionTitle}>
            <Users2 size={20} className="text-neon-lime" />
            <span>Top Performers</span>
          </h2>

          <div className={styles.tabGroup} role="tablist" aria-label="Performers time period">
            <button
              role="tab"
              aria-selected={performersPeriod === 'previous'}
              className={`${styles.tabButton} ${
                performersPeriod === 'previous' ? styles.tabButtonActive : ''
              }`}
              onClick={() => setPerformersPeriod('previous')}
            >
              Previous Month
            </button>
            <button
              role="tab"
              aria-selected={performersPeriod === 'overall'}
              className={`${styles.tabButton} ${
                performersPeriod === 'overall' ? styles.tabButtonActive : ''
              }`}
              onClick={() => setPerformersPeriod('overall')}
            >
              Overall (All-Time)
            </button>
          </div>
        </div>

        <Card variant="glass" padding="lg">
          <EmptyState
            icon={<Users2 size={24} />}
            title={`No ${
              performersPeriod === 'previous' ? 'Previous Month' : 'All-Time'
            } Performer Records`}
            description="Player performance statistics will automatically populate here after your first cumulative season update."
          />
        </Card>
      </section>

      {/* Division History Section */}
      <section aria-labelledby="history-heading">
        <div className={styles.sectionHeader}>
          <h2 id="history-heading" className={styles.sectionTitle}>
            <CalendarDays size={20} className="text-neon-blue" />
            <span>Division History & Season Rewards</span>
          </h2>
        </div>

        <Card variant="glass" padding="lg">
          <EmptyState
            icon={<Trophy size={24} />}
            title="No Closed Seasons Yet"
            description="Historical seasons, final ranks, match ratios, and reward card acquisition statuses will appear here once you close a season."
          />
        </Card>
      </section>
    </div>
  );
};
