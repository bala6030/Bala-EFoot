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

### Milestone 4B — Player Statistics Baselines & Progress Tracking (Completed)
- **Baseline Data Model & Immutability**:
  - Implemented typed `SeasonBaselineSnapshot`, `BaselinePlayerRecord`, `SeasonBaselineDraft`, and `PlayerRoleClassification` ('Starting XI' | 'Substitute') in `src/types/index.ts`.
  - Captures cumulative matches, goals, and assists for all 23 authentic player cards using stable IDs (`P001` - `P023`).
  - Distinguishes unentered values (`null`) from genuine zeroes (`0`).
  - Enforces strict validation requiring all 23 cards to be filled with non-negative integers before confirmation.
  - Immutability guarantee: confirmed baseline cannot be overwritten by progress updates, re-confirmation, or duplicate submissions.
  - Canonical Starting XI (11 cards) and Substitutes (12 cards) classification locked into the baseline snapshot.
- **Progress Snapshots & Append-Only History**:
  - Implemented typed `SeasonProgressSnapshot`, `ProgressPlayerRecord`, `SeasonProgressDraft`, and `PlayerStatDelta`.
  - Append-only snapshot ledger with stable snapshot IDs, recording date, and user notes.
  - Draft saving for incomplete data that survives browser reloads.
- **Delta Calculations & Decrease Warning Safeguard**:
  - Exact deltas calculated as `current cumulative − baseline`.
  - Positive, zero, and negative deltas displayed accurately without silent clamping.
  - Stat decrease detection compared against the latest reference record (most recent snapshot or baseline).
  - Prominent decrease warning banner and mandatory explicit confirmation checkbox ("I confirm that these decreased values are intentional source corrections") required before confirmation.
- **User Interface Integration**:
  - Extended `SeasonsView.tsx` with dedicated Baseline setup/review, Progress entry/review, and Snapshot detail inspection views.
  - Filterable tabs for All Players (23), Starting XI (11), and Substitutes (12).
  - Real-time completion progress indicators (`X/23 Completed`).
  - Responsive tables with dark theme styling, delta pills (green positive, gray zero, red negative), and accessible inputs.
- **Automated Verification**:
  - Expanded `scripts/test_season_repository.js` (`npm run test:season`) with 12 comprehensive test suites covering 23-card creation, null vs 0 distinction, negative/fractional stat rejection, duplicate prevention, baseline immutability, exact delta calculation (positive/zero/negative), decrease warnings, append-only history, reload persistence, and backward compatibility.

### Milestone 4C1 — Reward Eligibility & Acquisition (Completed)
- **Rank-Based Eligibility**:
  - Implemented explicit threshold logic (`REWARD_RANK_THRESHOLD = 100000`).
  - Final rank 1 through 100,000 inclusive: `Eligible`.
  - Final rank 100,001 or greater: `Not Eligible`.
  - Missing rank (null/undefined): `Eligibility Unknown`.
  - Zero, negative numbers, fractional values, and invalid rank inputs are strictly rejected.
  - Immediate recomputation of eligibility upon rank entry or correction.
- **Strict Decoupling of Eligibility and Acquisition**:
  - Eligibility status (`Eligible` | `Not Eligible` | `Eligibility Unknown`) is maintained independently from acquisition state.
  - Being `Eligible` never automatically implies a reward has been acquired.
  - Recording a reward card is strictly prohibited when the season status is `Not Eligible` or `Eligibility Unknown`.
- **Enforce Limit of At Most One Reward Card Per Season**:
  - Exactly at most one reward card can be acquired and recorded per season.
  - Once a reward card has been acquired, recording a second reward card is rejected.
  - Duplicate or repeated submissions are prevented; existing acquisition and season records are preserved intact upon rejection.
- **Manual Acquisition Recording & Modal Interface**:
  - Explicit modal workflow for claiming/recording reward card with required card name, valid acquisition date (`YYYY-MM-DD`), optional card version/details, optional notes, and mandatory confirmation checkbox.
  - Clear rank modal with live eligibility preview (`Rank ≤ 100,000: Eligible` in neon lime, `Rank > 100,000: Not Eligible` in danger, blank: `Eligibility Unknown`).
  - Dedicated Phase Rank & Rewards section on each season card displaying rank, eligibility badge, acquisition badge, acquired card details, and contextual actions.
- **Persistence & Regression Safety**:
  - Rank, eligibility, and acquisition data persist cleanly in `localStorage` under `bala_efoot_seasons_v1` and survive browser refresh.
  - Baseline records, progress snapshots, player catalogue, and squad builder data are fully preserved without mutation.
- **Automated Verification**:
  - Expanded `scripts/test_season_repository.js` (`npm run test:season`) with 12 new test suites (Tests 13–24, 24 total) covering boundary conditions (100,000 vs 100,001), missing rank, invalid rank rejection, rank corrections, acquisition decoupling, 1-card limit enforcement, duplicate prevention, and reload persistence.

## Known Limitations
- Milestone 4C1 implements rank-based reward eligibility and reward acquisition tracking. Season closure, final closure review, and immutable closed season snapshots will be implemented in Milestone 4C2.
- Position familiarity is intentionally not tracked (per specification).
- Tactician/manager auto-arrange and tactical instruction controls are excluded (per milestone scope).
- Card artwork currently displays clean initials and rating badges until official image assets are added to the repository.

## Commands Executed & Results
- `npm run lint`: ESLint check passed with 0 errors and 0 warnings (Exit 0).
- `npm run build`: Production build via `tsc -b && vite build` bundled successfully in 1.11s (Exit 0).
- `npm run test:squad`: Node.js unit test suite for formations, independence, and validation passed (Exit 0).
- `npm run test:season`: Node.js unit test suite for season baseline creation, validation, immutability, deltas, decreases, drafts, rank eligibility (100k boundary), and 1-card reward acquisition passed (24 tests, Exit 0).

## Next Action
Review Milestone 4C1 and prepare for **Milestone 4C2: Season Closure Workflow** (final season closure review, confirmation step, immutable closed snapshots, closed season browsing, and reopening prevention).
