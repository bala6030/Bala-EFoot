import React from 'react';
import { Badge } from '../common/Badge';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandSide}>
          <div className={styles.brandTitle}>Bala EFoot • Squad • Skills • Seasons</div>
          <p className={styles.disclaimer}>
            This is an unofficial, personal fan project and is not affiliated with, endorsed by,
            or an official product of Konami.
          </p>
        </div>

        <div className={styles.metaSide}>
          <Badge variant="blue" size="sm">
            ₹0 Operating Cost Target
          </Badge>
          <Badge variant="default" size="sm">
            Milestone 1 — Foundation
          </Badge>
        </div>
      </div>
    </footer>
  );
};
