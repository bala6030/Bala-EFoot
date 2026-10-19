import { useState } from 'react';
import { Sparkles, BarChart3, Bookmark } from 'lucide-react';
import { NavigationView, PlayerCard } from './types';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { DashboardView } from './components/dashboard/DashboardView';
import { ViewPlaceholder } from './components/common/ViewPlaceholder';
import { PlayerCatalogue } from './components/players/PlayerCatalogue';
import { PlayerProfile } from './components/players/PlayerProfile';
import { SquadBuilderView } from './components/squad/SquadBuilderView';
import { SeasonsView } from './components/seasons/SeasonsView';
import { getPlayerById } from './data/playerRepository';
import styles from './App.module.css';

export function App() {
  const [currentView, setCurrentView] = useState<NavigationView>('dashboard');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const selectedPlayer = selectedPlayerId ? getPlayerById(selectedPlayerId) : undefined;

  const handleSelectView = (view: NavigationView) => {
    setCurrentView(view);
    // Reset player selection when changing main tabs unless staying in players
    if (view !== 'players') {
      setSelectedPlayerId(null);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onAddMatchStats={() => setCurrentView('seasons')} />;
      case 'squad':
        return <SquadBuilderView />;
      case 'seasons':
        return <SeasonsView />;
      case 'players':
        if (selectedPlayer) {
          return (
            <PlayerProfile
              player={selectedPlayer}
              onBack={() => setSelectedPlayerId(null)}
            />
          );
        }
        return (
          <PlayerCatalogue
            onSelectPlayer={(p: PlayerCard) => setSelectedPlayerId(p.id)}
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
        onBrandClick={() => {
          setSelectedPlayerId(null);
          setCurrentView('dashboard');
        }}
      />

      <Navigation
        currentView={currentView}
        onSelectView={handleSelectView}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      <main className={`container ${styles.mainContent}`}>{renderContent()}</main>

      <Footer />
    </div>
  );
}

export default App;
