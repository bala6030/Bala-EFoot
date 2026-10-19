import React from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  CalendarDays,
  Sparkles,
  BarChart3,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import { NavigationView } from '../../types';
import styles from './Navigation.module.css';

export interface NavigationProps {
  currentView: NavigationView;
  onSelectView: (view: NavigationView) => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

interface NavItem {
  id: NavigationView;
  label: string;
  icon: React.ReactNode;
  shortLabel: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: 'squad',
    label: 'My Squad',
    shortLabel: 'Squad',
    icon: <Users size={18} />,
  },
  {
    id: 'players',
    label: 'Players',
    shortLabel: 'Players',
    icon: <Shield size={18} />,
  },
  {
    id: 'seasons',
    label: 'Seasons',
    shortLabel: 'Seasons',
    icon: <CalendarDays size={18} />,
  },
  {
    id: 'stats',
    label: 'Stats & Records',
    shortLabel: 'Stats',
    icon: <BarChart3 size={18} />,
  },
  {
    id: 'skills',
    label: 'Skills Lab',
    shortLabel: 'Skills',
    icon: <Sparkles size={18} />,
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    shortLabel: 'Wishlist',
    icon: <Bookmark size={18} />,
  },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  isMobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const handleItemClick = (view: NavigationView) => {
    onSelectView(view);
    onCloseMobileMenu();
  };

  return (
    <>
      {/* Desktop / iPad Top Sub-Navigation */}
      <nav className={styles.desktopNav} aria-label="Main Navigation">
        <div className={`container ${styles.navInner}`}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                className={`${styles.navTab} ${isActive ? styles.navTabActive : ''}`}
                onClick={() => handleItemClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer (Accessible via hamburger) */}
      <div
        className={`${styles.drawerOverlay} ${isMobileMenuOpen ? styles.drawerOverlayOpen : ''}`}
        onClick={onCloseMobileMenu}
        aria-hidden="true"
      />
      <div
        className={`${styles.drawer} ${isMobileMenuOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className={styles.drawerTitle}>Navigation</div>
        <div className={styles.drawerList}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                className={`${styles.drawerItem} ${isActive ? styles.drawerItemActive : ''}`}
                onClick={() => handleItemClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={styles.drawerItemLeft}>
                  {item.icon}
                  <span className={styles.drawerItemLabel}>{item.label}</span>
                </div>
                <ChevronRight size={16} opacity={isActive ? 1 : 0.4} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Thumb Navigation */}
      <nav className={styles.mobileBottomNav} aria-label="Mobile Navigation">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`}
              onClick={() => handleItemClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={styles.bottomNavIconWrapper}>{item.icon}</div>
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
