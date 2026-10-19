import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass';
  accent?: 'lime' | 'blue' | 'purple' | 'gold' | 'none';
  padding?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  accent = 'none',
  padding = 'md',
  interactive = false,
  className = '',
  ...rest
}) => {
  const variantClass = styles[variant] || styles.default;
  const paddingClass =
    padding === 'sm' ? styles.paddingSm : padding === 'lg' ? styles.paddingLg : styles.paddingMd;

  const accentClass =
    accent === 'lime'
      ? styles.accentLime
      : accent === 'blue'
      ? styles.accentBlue
      : accent === 'purple'
      ? styles.accentPurple
      : accent === 'gold'
      ? styles.accentGold
      : '';

  const interactiveClass = interactive ? styles.interactive : '';

  return (
    <div
      className={`${styles.card} ${variantClass} ${accentClass} ${paddingClass} ${interactiveClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
