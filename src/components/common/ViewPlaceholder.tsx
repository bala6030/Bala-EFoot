import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { EmptyState } from './EmptyState';

export interface ViewPlaceholderProps {
  title: string;
  milestoneNumber: number;
  description: string;
  features: string[];
  icon: React.ReactNode;
}

export const ViewPlaceholder: React.FC<ViewPlaceholderProps> = ({
  title,
  milestoneNumber,
  description,
  features,
  icon,
}) => {
  return (
    <div style={{ padding: 'var(--space-8) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{title}</h1>
        <Badge variant="purple" size="md">
          Scheduled: Milestone {milestoneNumber}
        </Badge>
      </div>

      <Card variant="glass" padding="lg">
        <EmptyState
          icon={icon}
          title={title}
          description={description}
          action={
            <div style={{ marginTop: 'var(--space-4)', textAlign: 'left', width: '100%', maxWidth: '400px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                Upcoming Capabilities
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {features.map((feature, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <span style={{ color: 'var(--accent-lime)' }}>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          }
        />
      </Card>
    </div>
  );
};
