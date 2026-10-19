import React, { useState, useMemo } from 'react';
import { Search, X, Users, RotateCcw } from 'lucide-react';
import { PlayerCard } from '../../types';
import {
  getAllPlayers,
  getDistinctPositions,
  getDistinctPlayingStyles,
  getDistinctPreferredFeet,
} from '../../data/playerRepository';
import { PlayerCardTile } from './PlayerCardTile';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';
import styles from './PlayerCatalogue.module.css';

export interface PlayerCatalogueProps {
  onSelectPlayer: (player: PlayerCard) => void;
}

type SquadFilter = 'all' | 'starting' | 'subs';
type SortOption = 'ratingDesc' | 'ratingAsc' | 'nameAsc' | 'nameDesc';

export const PlayerCatalogue: React.FC<PlayerCatalogueProps> = ({ onSelectPlayer }) => {
  const allPlayers = useMemo(() => getAllPlayers(), []);
  const distinctPositions = useMemo(() => getDistinctPositions(), []);
  const distinctPlayingStyles = useMemo(() => getDistinctPlayingStyles(), []);
  const distinctFeet = useMemo(() => getDistinctPreferredFeet(), []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [squadFilter, setSquadFilter] = useState<SquadFilter>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedFoot, setSelectedFoot] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('ratingDesc');

  // Filter & Sort Logic
  const filteredPlayers = useMemo(() => {
    return allPlayers
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesId = p.id.toLowerCase().includes(q);
          const matchesPos = p.primaryPosition.toLowerCase().includes(q);
          const matchesStyle = p.playingStyle.toLowerCase().includes(q);
          const matchesCard = p.cardName ? p.cardName.toLowerCase().includes(q) : false;
          if (!matchesName && !matchesId && !matchesPos && !matchesStyle && !matchesCard) {
            return false;
          }
        }

        // Squad Filter
        if (squadFilter === 'starting' && !p.inStartingXI) return false;
        if (squadFilter === 'subs' && !p.inSubstitutes) return false;

        // Position Filter
        if (selectedPosition !== 'all' && p.primaryPosition !== selectedPosition) {
          return false;
        }

        // Playing Style Filter
        if (selectedStyle !== 'all' && p.playingStyle !== selectedStyle) {
          return false;
        }

        // Preferred Foot Filter
        if (selectedFoot !== 'all' && p.preferredFoot !== selectedFoot) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'ratingDesc') {
          return (b.overallRating ?? 0) - (a.overallRating ?? 0);
        }
        if (sortBy === 'ratingAsc') {
          return (a.overallRating ?? 0) - (b.overallRating ?? 0);
        }
        if (sortBy === 'nameAsc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'nameDesc') {
          return b.name.localeCompare(a.name);
        }
        return 0;
      });
  }, [allPlayers, searchQuery, squadFilter, selectedPosition, selectedStyle, selectedFoot, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    squadFilter !== 'all' ||
    selectedPosition !== 'all' ||
    selectedStyle !== 'all' ||
    selectedFoot !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSquadFilter('all');
    setSelectedPosition('all');
    setSelectedStyle('all');
    setSelectedFoot('all');
    setSortBy('ratingDesc');
  };

  const startingCount = allPlayers.filter((p) => p.inStartingXI).length;
  const subsCount = allPlayers.filter((p) => p.inSubstitutes).length;

  return (
    <div className={styles.catalogueContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.heading}>Players Catalogue</h1>
          <p className={styles.subheading}>
            Search, filter, and inspect player cards and attributes
          </p>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className={styles.controlsBox}>
        {/* Search Bar */}
        <div className={styles.searchRow}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, ID (e.g. P001), position, or playing style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Squad Status Filter Pills */}
        <div className={styles.squadTabs} role="group" aria-label="Squad Filter">
          <button
            type="button"
            className={`${styles.squadTab} ${squadFilter === 'all' ? styles.squadTabActive : ''}`}
            onClick={() => setSquadFilter('all')}
          >
            All Squad ({allPlayers.length})
          </button>
          <button
            type="button"
            className={`${styles.squadTab} ${
              squadFilter === 'starting' ? styles.squadTabActive : ''
            }`}
            onClick={() => setSquadFilter('starting')}
          >
            Starting XI ({startingCount})
          </button>
          <button
            type="button"
            className={`${styles.squadTab} ${squadFilter === 'subs' ? styles.squadTabActive : ''}`}
            onClick={() => setSquadFilter('subs')}
          >
            Substitutes ({subsCount})
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className={styles.selectRow}>
          {/* Position Filter */}
          <div className={styles.selectGroup}>
            <label htmlFor="filter-position" className={styles.selectLabel}>
              Pos:
            </label>
            <select
              id="filter-position"
              className={styles.selectInput}
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="all">All Positions</option>
              {distinctPositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          {/* Playing Style Filter */}
          <div className={styles.selectGroup}>
            <label htmlFor="filter-style" className={styles.selectLabel}>
              Style:
            </label>
            <select
              id="filter-style"
              className={styles.selectInput}
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
            >
              <option value="all">All Styles</option>
              {distinctPlayingStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>

          {/* Foot Filter */}
          <div className={styles.selectGroup}>
            <label htmlFor="filter-foot" className={styles.selectLabel}>
              Foot:
            </label>
            <select
              id="filter-foot"
              className={styles.selectInput}
              value={selectedFoot}
              onChange={(e) => setSelectedFoot(e.target.value)}
            >
              <option value="all">All Feet</option>
              {distinctFeet.map((foot) => (
                <option key={foot} value={foot}>
                  {foot}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Option */}
          <div className={styles.selectGroup} style={{ marginLeft: 'auto' }}>
            <label htmlFor="filter-sort" className={styles.selectLabel}>
              Sort:
            </label>
            <select
              id="filter-sort"
              className={styles.selectInput}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="ratingDesc">Overall Rating (High → Low)</option>
              <option value="ratingAsc">Overall Rating (Low → High)</option>
              <option value="nameAsc">Name (A → Z)</option>
              <option value="nameDesc">Name (Z → A)</option>
            </select>
          </div>
        </div>

        {/* Results Bar */}
        <div className={styles.metaInfoBar}>
          <span>
            Showing <strong>{filteredPlayers.length}</strong> of{' '}
            <strong>{allPlayers.length}</strong> players
          </span>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredPlayers.length > 0 ? (
        <div className={styles.playerGrid}>
          {filteredPlayers.map((player) => (
            <PlayerCardTile key={player.id} player={player} onClick={onSelectPlayer} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users size={28} />}
          title="No Players Found"
          description="No player cards match your current search and filter criteria."
          action={
            <Button variant="secondary" size="md" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          }
        />
      )}
    </div>
  );
};
