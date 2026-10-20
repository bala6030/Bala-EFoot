import { useState } from 'react';
import { NavigationView, PlayerCard } from './types';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { DashboardView } from './components/dashboard/DashboardView';
import { PlayerCatalogue } from './components/players/PlayerCatalogue';
import { PlayerProfile } from './components/players/PlayerProfile';
import { SquadBuilderView } from './components/squad/SquadBuilderView';
import { SeasonsView } from './components/seasons/SeasonsView';
import { StatsRecordsView } from './components/stats/StatsRecordsView';
import { SkillPlannerView } from './components/skills/SkillPlannerView';
import { WishlistView } from './components/wishlist/WishlistView';
import { getPlayerById } from './data/playerRepository';
import styles from './App.module.css';

export function App() {
  const [currentView, setCurrentView] = useState<NavigationView>('dashboard');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedSkillPlayerId, setSelectedSkillPlayerId] = useState<string | null>(null);
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
              onOpenSkillPlanner={(playerId) => {
                setSelectedSkillPlayerId(playerId);
                setCurrentView('skills');
              }}
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
          <SkillPlannerView
            initialPlayerId={selectedSkillPlayerId || undefined}
            onSelectPlayerProfile={(playerId) => {
              setSelectedPlayerId(playerId);
              setCurrentView('players');
            }}
          />
        );
      case 'stats':
        return (
          <StatsRecordsView
            onSelectPlayer={(playerId) => {
              setSelectedPlayerId(playerId);
              setCurrentView('players');
            }}
            onNavigateToSeasons={() => setCurrentView('seasons')}
          />
        );
      case 'wishlist':
        return (
          <WishlistView
            onNavigateToCatalogue={() => {
              setSelectedPlayerId(null);
              setCurrentView('players');
            }}
            onSelectPlayerProfile={(playerId) => {
              setSelectedPlayerId(playerId);
              setCurrentView('players');
            }}
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
