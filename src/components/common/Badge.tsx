import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'blue' | 'purple' | 'gold' | 'default' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
}) => {
  const variantClass = styles[variant] || styles.default;
  const sizeClass = size === 'sm' ? styles.sizeSm : styles.sizeMd;

  return (
    <span className={`${styles.badge} ${variantClass} ${sizeClass} ${className}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
