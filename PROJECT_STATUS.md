# Bala EFoot — Project Status

## Identity
- **App**: Bala EFoot
- **Tagline**: Squad • Skills • Seasons
- **Repository**: https://github.com/bala6030/Bala-EFoot
- **Active Branch**: `feature/player-catalogue`
- **Cost Target**: ₹0; no billing-enabled usage, paid APIs, or payment method

## Git Branch Plan
- `main`: stable baseline / release branch.
- `develop`: integration branch created from `main`.
- `feature/project-foundation`: Milestone 1 foundation implementation.
- `feature/player-catalogue`: Milestone 2 player catalogue and player profile implementation.
- Feature branches merge into `develop` after review.

## Milestones Status

### Milestone 1 — Project Foundation (Completed)
- React 18 + TypeScript + Vite project scaffolded in repository root.
- Reusable UI component library created: `Button`, `Badge`, `Card`, `EmptyState`, `ViewPlaceholder`.
- Design tokens defined in `src/styles/variables.css` with dark charcoal/black surfaces and neon lime (`#39ff14`), electric blue (`#00e5ff`), and electric purple (`#a855f7`) accents.
- Responsive layout with desktop top navigation, mobile drawer, and iPhone thumb-accessible bottom navigation bar.
- Branded Dashboard shell with division standings grid, Chelsea FC emblem beside Win Rate, and separated Previous Month / Overall Top Performers sections.
- Zero fabricated player statistics or fake records.

### Milestone 2 — Player Catalogue & Player Profile (Completed)
- **Source Inspection & Ingestion**:
  - Source data ingested from `data/Bala_EFoot_Player_Data_Template_v1.xlsx` (sheets: `Players`, `Player Attributes`, `Player Skills`, `Player Model`, `Overall Performance`).
  - Repeatable, non-destructive extraction script: `scripts/import_player_data.py` (`npm run import-data`), generating typed data in `src/data/players.json`.
  - Ingested 23 authentic squad players (11 Starting XI, 12 Substitutes) with stable card identifiers (`P001` through `P023`).
  - Source provenance and validation notes preserved on every card.
- **Player Catalogue**:
  - Responsive player card grid with stable card IDs, rating badges, position chips, and playing styles.
  - Search by player name, stable card ID, primary position, or playing style.
  - Multi-criteria filtering: Squad status (All / Starting XI / Substitutes), Position, Playing Style, and Preferred Foot.
  - Sorting by Overall Rating (High-Low / Low-High) and Player Name (A-Z / Z-A).
  - Elegant missing-image fallback with player initials, rating badge, and "Artwork Pending" indicator; no random web scraping or fabricated card artwork.
  - No separate Club or Overall tabs created (per requirements).
- **Player Profile**:
  - Detailed card identity with ratings, positions, physical metrics (height/weight), manager build notes, and eFHUB reference links.
  - Six Pinned Key Attributes: default suggestions based on role (Forward, Midfielder, Defender, Goalkeeper) with interactive customization dialog and `localStorage` persistence.
  - Structured attribute groups: **Attacking**, **Defending**, **Athleticism**, and **Player Model** (plus Goalkeeping for GK).
  - Visual rating progress bars with tier coloration (90+ lime, 80-89 blue, 70-79 purple, <70 dark).
  - Clear distinction between verified values and missing/unverified values (rendered as "— Unverified").
  - Skills breakdown (Default with gold highlight vs Additional with slot occupation counter) and all-time performance statistics.
  - Position familiarity excluded (per requirements).

## Next Action
Review Milestone 2 and prepare for **Milestone 3: Squad & Pitch Formation Builder** (interactive pitch, starting XI and substitutes bench, independent Attack/Defence layouts, and drag-and-drop squad positioning).
