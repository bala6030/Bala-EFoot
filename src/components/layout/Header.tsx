import React from 'react';
import { Menu, X, ShieldAlert } from 'lucide-react';
import { Badge } from '../common/Badge';
import styles from './Header.module.css';

export interface HeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onBrandClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  onBrandClick,
}) => {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandGroup} onClick={onBrandClick} role="button" tabIndex={0}>
          <div className={styles.logoIcon}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>
              Bala <span className={styles.brandAccent}>EFoot</span>
            </span>
            <span className={styles.tagline}>Squad • Skills • Seasons</span>
          </div>
        </div>

        <div className={styles.actionsGroup}>
          <div className={styles.disclaimerBadge}>
            <Badge variant="default" size="sm" icon={<ShieldAlert size={12} />}>
              Unofficial Companion
            </Badge>
          </div>

          <button
            className={styles.menuButton}
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
};
