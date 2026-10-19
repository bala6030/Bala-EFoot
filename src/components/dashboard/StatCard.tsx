import React from 'react';
import styles from './StatCard.module.css';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accessory?: React.ReactNode;
  color?: 'lime' | 'blue' | 'purple' | 'default';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accessory,
  color = 'default',
  className = '',
}) => {
  const valueColorClass =
    color === 'lime'
      ? styles.valueLime
      : color === 'blue'
      ? styles.valueBlue
      : color === 'purple'
      ? styles.valuePurple
      : '';

  return (
    <div className={`${styles.statCard} ${className}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
      </div>

      <div className={styles.valueRow}>
        <span className={`${styles.value} ${valueColorClass}`}>{value}</span>
        {accessory && <div className={styles.accessory}>{accessory}</div>}
      </div>

      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  );
};
