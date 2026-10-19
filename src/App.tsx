import { useState } from 'react';
import { Users, Shield, Sparkles, BarChart3, Bookmark } from 'lucide-react';
import { NavigationView } from './types';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { DashboardView } from './components/dashboard/DashboardView';
import { ViewPlaceholder } from './components/common/ViewPlaceholder';
import styles from './App.module.css';

export function App() {
  const [currentView, setCurrentView] = useState<NavigationView>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'squad':
        return (
          <ViewPlaceholder
            title="My Squad"
            milestoneNumber={3}
            description="Pitch formation builder with independent Attack and Defence layouts, starting XI and substitutes bench."
            features={[
              'Pitch visualization with player card slots',
              'Independent Attack and Defence layouts',
              'Substitutes bench management',
              'Duplicate player assignment prevention',
            ]}
            icon={<Users size={28} />}
          />
        );
      case 'players':
        return (
          <ViewPlaceholder
            title="Players Catalogue"
            milestoneNumber={2}
            description="Searchable player-card grid, attribute categories, and custom pinned key attributes."
            features={[
              'Stable unique card IDs for all versions',
              'Attacking, Defending, Athleticism groups',
              'Six key pinned attributes at top of profile',
              'Search and role/position filtering',
            ]}
            icon={<Shield size={28} />}
          />
        );
      case 'skills':
        return (
          <ViewPlaceholder
            title="Skills Lab"
            milestoneNumber={6}
            description="Manage player skills, assign up to 5 additional skills, and customize gold highlight glows."
            features={[
              '5 additional skill slots per card',
              'Read-only default skills protection',
              'Gold highlight glow toggle for key skills',
              'Before-save change preview and comparison',
            ]}
            icon={<Sparkles size={28} />}
          />
        );
      case 'stats':
        return (
          <ViewPlaceholder
            title="Stats & Records"
            milestoneNumber={5}
            description="Cumulative matches, goals, assists, per-match rates, and 5-season historical snapshots."
            features={[
              'Matches, goals, assists & G/A contribution rates',
              'Previous Month vs Overall (All-time) views',
              'Last 5 seasons snapshot selectors',
              'Strict validation preventing negative monthly stats',
            ]}
            icon={<BarChart3 size={28} />}
          />
        );
      case 'wishlist':
        return (
          <ViewPlaceholder
            title="Target Wishlist"
            milestoneNumber={6}
            description="Track target cards (e.g., Yamal, Varane, Pirlo, Buffon, Neymar), priority ratings, and must-have skills."
            features={[
              'Target cards with desired versions and positions',
              'Priority ranking: High, Medium, and Low',
              'Must-have skills checklist per target',
              'Acquisition status toggle',
            ]}
            icon={<Bookmark size={28} />}
          />
        );
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className={styles.appRoot}>
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
        onBrandClick={() => setCurrentView('dashboard')}
      />

      <Navigation
        currentView={currentView}
        onSelectView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      <main className={`container ${styles.mainContent}`}>{renderContent()}</main>

      <Footer />
    </div>
  );
}

export default App;
