# Bala EFoot — Project Status

## Identity
- **App**: Bala EFoot
- **Tagline**: Squad • Skills • Seasons
- **Repository**: https://github.com/bala6030/Bala-EFoot
- **Active Branch**: `feature/season-workflow`
- **Cost Target**: ₹0; no billing-enabled usage, paid APIs, or payment method

## Git Branch Plan
- `main`: stable baseline / release branch.
- `develop`: integration branch created from `main`.
- `feature/project-foundation`: Milestone 1 foundation implementation (merged into `develop`).
- `feature/player-catalogue`: Milestone 2 player catalogue and player profile implementation (merged into `develop`).
- `feature/squad-builder`: Milestone 3 squad & pitch formation builder implementation (merged into `develop`).
- `feature/season-workflow`: Milestone 4 season workflow implementation.
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
- **Source Ingestion**:
  - Extracted 23 authentic squad players from `data/Bala_EFoot_Player_Data_Template_v1.xlsx` via `scripts/import_player_data.py` (`npm run import-data`), emitting typed JSON to `src/data/players.json`.
  - Source provenance and notes preserved on every card.
- **Player Catalogue**:
  - Responsive card grid with stable card IDs (`P001` - `P023`), rating badges, and position chips.
  - Multi-criteria filtering (All / Starting XI / Substitutes, Position, Playing Style, Preferred Foot) and sorting.
  - Elegant missing-image fallback with player initials, rating badge, and "Artwork Pending" indicator.
  - No separate Club or Overall tabs.
- **Player Profile**:
  - Card identity with ratings, positions, physical metrics (height/weight), manager build notes, and eFHUB reference links.
  - Six Pinned Key Attributes with role defaults and `localStorage` persistence.
  - Structured attribute categories: Attacking, Defending, Athleticism, Player Model, Skills, and Performance.
  - Position familiarity excluded (per requirements).

### Milestone 3 — Squad & Pitch Formation Builder (Completed)
- **Pitch Visualization**:
  - Interactive football pitch rendered with pitch markings (penalty areas, 6-yard boxes, center circle, halfway line, penalty arcs, and corner arcs) styled in dark charcoal turf with electric-blue and neon-lime accents.
  - Responsive card markers displaying player position tag, OVR rating, surname, and quick bench action button.
- **Formation Engine**:
  - Structured formation definitions for `4-2-1-3`, `4-3-3`, and `4-2-2-2` with normalized percentage coordinates.
  - Formation change transition algorithm (`rearrangeAssignmentsOnFormationChange`) that preserves assigned starters across tactical adjustments with zero silent loss and informative change notifications.
- **Independent Attack & Defence Layouts**:
  - Dedicated Attack (`⚔️ Attack`) and Defence (`🛡️ Defence`) layout switcher.
  - Each layout maintains its own formation and player assignments independently; edits to Attack do not mutate Defence and vice versa.
  - Persisted to browser storage via `localStorage` key `bala_efoot_squad_state_v1`.
- **Dual Assignment Interactions**:
  - Desktop: HTML5 drag-and-drop between bench and pitch slots, swapping starters on pitch, and dragging starters to the bench.
  - Touch / Accessible: Tap-to-select bench player or pitch starter, followed by tapping destination slot to place or swap.
- **Substitutes Bench**:
  - Positioned at the bottom of the squad screen (no separate tab).
  - Dynamically lists all unassigned squad players with position category filters (All, FWD, MID, DEF, GK).
  - Acts as an active drop target to return starters to the bench.
- **Validation**:
  - Enforces exactly 11 slots, exactly 1 GK, and prevents duplicate player assignments within a layout.
  - Displays clear status badges (`11/11 Starting XI Complete` or `X/11 Slots Filled (Y slots open)`).
- **Automated Verification**:
  - Dedicated test suite in `scripts/test_squad_builder.js` (`npm run test:squad`) verifying formation structures, layout independence, transition mappings, and validation logic.

### Milestone 4A — Season Foundation (Completed)
- **Typed Season Model**:
  - Created `Season`, `SeasonStatus` (`Draft` | `Active` | `Closed`), `SeasonDraftInput`, `SeasonsState`, and `SeasonValidationResult` models in `src/types/index.ts`.
  - Structured with extensible fields for starting baselines, progress snapshots, reward eligibility, acquisition records, and final closure data.
- **Season Storage & Repository Layer**:
  - Dedicated `seasonRepository.ts` utilizing versioned `localStorage` key `bala_efoot_seasons_v1`.
  - Comprehensive data validation and corruption recovery (recovers gracefully from malformed JSON or corrupted records without crashing or data loss).
  - Strict duplicate season identifier prevention (case-insensitive and trimmed checking) that preserves existing data on collision.
  - Separate draft persistence (`activeDraftId`) ensuring drafts survive page refresh without silent activation.
  - Explicit activation requiring full validation (non-empty identifier, valid start date, starting division between 1 and 10).
  - Completely isolated storage: preserves existing player catalogue and squad builder storage keys.
- **Seasons Screen & Guided Workflow**:
  - Full Seasons screen (`SeasonsView.tsx` + `SeasonsView.module.css`) integrated into desktop, mobile drawer, and mobile bottom navigation.
  - Connected Dashboard CTA ("Add Match Stats") directly to Seasons view.
  - Guided 2-step season creation wizard:
    - **Step 1 (Season Setup)**: Inputs for unique identifier, start date, starting division (1-10), and optional tactical notes, with inline validation errors and explicit "Save Draft" action.
    - **Step 2 (Review & Activation)**: Comprehensive review card with explicit "Activate Season" confirmation.
  - Responsive saved seasons grid showing status badges (`Active` neon lime, `Draft` electric blue, `Closed` purple), metadata, and resume/discard controls.
- **Automated Verification**:
  - Dedicated test suite `scripts/test_season_repository.js` (`npm run test:season`) verifying creation, reload persistence, duplicate rejection, explicit activation, corrupted storage resilience, and subsystem storage isolation.

## Known Limitations
- Milestone 4A implements the season foundation only; starting baselines, cumulative player stats entry, deltas, reward eligibility, and season closure will be added in subsequent milestones (4B/4C).
- Position familiarity is intentionally not tracked (per specification).
- Tactician/manager auto-arrange and tactical instruction controls are excluded (per milestone scope).
- Card artwork currently displays clean initials and rating badges until official image assets are added to the repository.

## Commands Executed & Results
- `npm run lint`: ESLint check passed with 0 errors and 0 warnings (Exit 0).
- `npm run build`: Production build via `tsc -b && vite build` bundled successfully in 1.90s (Exit 0).
- `npm run test:squad`: Node.js unit test suite for formations, independence, and validation passed (Exit 0).
- `npm run test:season`: Node.js unit test suite for season repository, persistence, duplicate rejection, and activation validation passed (Exit 0).

## Next Action
Review Milestone 4A and prepare for **Milestone 4B: Starting Baselines & Progress Entry** (Starting XI / substitutes baseline capture, cumulative player statistics, delta calculation, decrease warnings, and progress snapshots).
