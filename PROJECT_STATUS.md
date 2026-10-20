# Bala EFoot — Project Status

## Identity
- **App**: Bala EFoot
- **Tagline**: Squad • Skills • Seasons
- **Repository**: https://github.com/bala6030/Bala-EFoot
- **Active Branch**: `feature/stats-records`
- **Cost Target**: ₹0; no billing-enabled usage, paid APIs, or payment method

## Git Branch Plan
- `main`: stable baseline / release branch.
- `develop`: integration branch created from `main`.
- `feature/project-foundation`: Milestone 1 foundation implementation (merged into `develop`).
- `feature/player-catalogue`: Milestone 2 player catalogue and player profile implementation (merged into `develop`).
- `feature/squad-builder`: Milestone 3 squad & pitch formation builder implementation (merged into `develop`).
- `feature/season-workflow`: Milestone 4 season workflow implementation (merged into `develop`).
- `feature/player-card-artwork`: Player card artwork integration and pitch marker enhancement (merged into `develop`).
- `feature/dashboard-integration`: Milestone 5A dashboard integration implementation.
- `feature/stats-records`: Milestone 5B stats & records implementation.
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

### Milestone 4C2 — Final Season Review & Closure (Completed)
- **Guided Final Season Review**:
  - Implemented `getSeasonReviewSummary` in `src/data/seasonRepository.ts` and `close-review` view mode in `SeasonsView.tsx`.
  - Aggregates verified season metadata: season identifier, start date, starting division, tactical notes, confirmed baseline status, confirmed snapshot count, latest confirmed cumulative statistics snapshot, and deltas.
  - Distinguishes entered zeroes from missing values; draft progress entries and unconfirmed baseline drafts are strictly excluded from confirmed review metrics.
  - Computes and displays squad-level totals and individual player stat deltas with filter tabs (All 23, Starting XI 11, Substitutes 12).
  - Evaluates data completeness and generates visible warnings for missing rank, zero progress snapshots, or unconfirmed progress drafts.
  - Requires explicit user acknowledgement checkbox ("I acknowledge the incomplete or unrecorded data listed above...") before permitting closure when non-essential data is missing.
  - Supports inline rank updates and reward claims directly within the review panel with immediate eligibility recomputation.
- **Explicit Closure Workflow & Concurrency Protection**:
  - Requires deliberate two-step closure: complete review followed by an explicit irreversible closure confirmation modal.
  - Only `Active` seasons with a confirmed baseline can be closed; `Draft` seasons and unconfirmed seasons are strictly rejected.
  - Concurrency protection via `expectedUpdatedAt`: rejects closure if the season record was modified concurrently after the review was loaded.
  - Duplicate submission prevention: disables actions during submission and domain-level rejection for already closed seasons.
  - Non-closure on inspection: loading review summary or saving drafts never triggers season closure.
- **Immutable Final Snapshot Data Model**:
  - Defined typed `SeasonClosureSnapshot` in `src/types/index.ts` with schema version `1`, unique snapshot ID (`closure-<seasonId>-<timestamp>`), closedAt, closedDate, frozen metadata, deep-copied confirmed baseline, deep-copied confirmed progress snapshots (in original chronological order), stats summary (matches, goals, assists deltas), final rank, reward eligibility, reward acquisition record, closure warnings, acknowledgement status, and closure notes.
  - Deep-copies all confirmed arrays and nested objects (`JSON.parse(JSON.stringify(...))`) ensuring subsequent in-memory mutations cannot alter saved historical snapshots.
  - Discards unconfirmed progress drafts upon closure so only verified data is retained.
- **Closed-Season Mutation Protections**:
  - Enforced comprehensive domain-level immutability guards in `seasonRepository.ts`.
  - Normal season mutations are strictly rejected on closed seasons: `saveBaselineDraft`, `confirmSeasonBaseline`, `discardBaselineDraft`, `saveProgressDraft`, `confirmProgressSnapshot`, `discardProgressDraft`, `setSeasonRank`, `recordSeasonReward`, `saveSeasonDraft`, `activateSeason`, and `discardDraft`.
  - Closed seasons cannot be reopened or closed again; duplicate closure attempts leave the original timestamp and snapshot untouched.
- **Read-Only Historical Seasons Inspection**:
  - Integrated `closed-detail` view mode in `SeasonsView.tsx`.
  - Closed season cards feature a purple `Immutable` badge, closure date, and "View Historical Record" action. Normal edit, progress entry, rank update, and reward claim controls are hidden.
  - Detailed historical view presents frozen closure metadata, snapshot ID, final rank, reward acquisition status (with recorded card details or explicit "Not Acquired"), cumulative statistics deltas table, preserved chronological progress snapshots ledger with individual snapshot inspection, and acknowledged warnings.
- **Automated Verification**:
  - Expanded `scripts/test_season_repository.js` (`npm run test:season`) with 14 new test suites (Tests 25–38, 38 total) verifying confirmed snapshot isolation, missing rank handling, rank boundary conditions, active closure, draft rejection, explicit confirmation requirement, duplicate closure rejection, closed-season mutation rejection, deep-copy immutability, reward preservation, acknowledgement requirement, concurrency mismatch rejection, storage reload persistence, and backward compatibility with new seasons.

### Player Card Artwork Integration — Pitch Artwork Size Enhancement & Second Visual Refinement (Completed)
- **Substantially Larger & Prominent Pitch Artwork**:
  - Transformed pitch player markers into large, prominent rectangular eFootball-style cards.
  - Desktop pitch container optimized to 540 px width × 720 px height (`max-width: 540px; aspect-ratio: 540 / 720`), providing generous vertical separation between defensive, midfield, and forward lines.
  - Final desktop marker dimensions: 84 px wide × 124 px tall (within target range 80–95 px wide × 115–140 px tall).
  - Visible artwork container: 76 px wide × 98 px tall, displaying a rendered card artwork of approximately 69 px wide × 98 px tall (within target range 60–75 px wide × 80–100 px tall). Full 240 × 340 vertical card composition, glowing frames, national flags, and player portraits preserved with `object-fit: contain` and zero unnecessary padding.
- **Overlaid Position & Rating Badges**:
  - Role-colored position badge (`tagFWD` lime, `tagMID` electric blue, `tagDEF` purple, `tagGK` gold) overlaid at top-left corner.
  - Overall rating (OVR) badge overlaid at top-right corner with high-contrast translucent dark backdrop (`rgba(10, 14, 23, 0.88)`).
  - Badges positioned precisely to avoid obscuring centered player faces while remaining legible.
- **Formation Slot Layout Optimization & Zero Collisions**:
  - Refined slot percentage coordinates in `src/data/formationData.ts` across all three supported formations (`4-2-1-3`, `4-3-3`, and `4-2-2-2`) to eliminate congestion between goalkeeper, centre-backs, and midfield pivots.
  - Verified 0 collisions across all 11 starting slots in all 3 formations across every desktop, tablet, and mobile viewport.
- **Readable Player Name Label**:
  - Player surname / display name centered below artwork with subtle typography and ellipsis overflow.
- **Responsive Scaling & Drag-and-Drop Preservation**:
  - Smooth multi-tier responsive scaling:
    - Tablet (≤ 560px): 70 × 104 px marker, 64 × 82 px artwork wrapper.
    - Mobile (≤ 440px): 56 × 82 px marker, 50 × 64 px artwork wrapper.
    - Small Mobile (≤ 360px): 46 × 68 px marker, 42 × 52 px artwork wrapper.
  - Sub-elements use `pointer-events: none` and `draggable={false}` ensuring unhindered drag-and-drop, tap-to-select, and tap-to-swap on the marker.
  - Retained move-to-bench button (`X`), Attack and Defence layout independence, and image fallback initials.

### Milestone 5A — Dashboard Integration (Completed)
- **Division Progress Tracking Data Model**:
  - Implemented typed `DivisionProgressSnapshot` and `DivisionProgressInput` in `src/types/index.ts`.
  - Each snapshot records: `id`, `seasonId`, `recordingDate`, `recordedAt`, `division` (1–10), `points`, `wins`, `draws`, `losses`, computed `matches` (wins + draws + losses), computed `winRate` (safe against zero division), optional `rank`, and optional `notes`.
  - Append-only ledger per active season; historical snapshots are never mutated.
- **Season Repository Extensions**:
  - `isValidDivisionValue`: validates integer 1–10 inclusive.
  - `recordDivisionProgress`: strict guards — season must exist, be Active, division integer 1–10, stats non-negative integers, rank (if supplied) positive integer ≥ 1. Synchronizes `finalRank` and `rewardEligibility` when rank is provided. Returns the new snapshot.
  - `getDivisionProgressSnapshots`: reads append-only snapshot list for a season; returns `[]` for unknown or fresh seasons.
  - `getLatestDivisionProgress`: returns the most recent snapshot or `null`.
  - `sanitizeDivisionProgressSnapshots`: sanitizes and validates division progress arrays from raw localStorage, preventing corruption from invalid data.
  - Division progress deep-copied into `SeasonClosureSnapshot` on season closure for permanent immutable history.
  - Closed seasons reject new `recordDivisionProgress` entries (immutability enforced).
- **Dashboard Service** (`src/data/dashboardService.ts`):
  - `getDashboardKPIs`: derives KPI card values from the latest confirmed `DivisionProgressSnapshot` of the active season. Falls back to `startingDivision` for division display only. Renders honest `—` / unknown states where data is not recorded — no fabricated zeros.
  - `getOverallTopPerformers`: builds ranked performer list exclusively from authentic `players.json` `overallPerformance` data; no fabricated stat totals.
  - `getPreviousMonthTopPerformers`: computes deltas exclusively from confirmed progress snapshots recorded in the previous calendar month. Returns empty list if no snapshots exist for that month — never falls back to all-time totals.
  - `getClosedSeasonHistory`: aggregates all closed seasons using their frozen closure snapshots; reads division progress, stats deltas, rank, and reward records directly from immutable closure data.
  - `recordActiveDivisionProgress`: convenience wrapper that resolves the active season and delegates to `recordDivisionProgress`.
- **Dashboard View** (`DashboardView.tsx` + `DashboardView.module.css`):
  - Live KPI cards for Current Division, Season Points, Global Rank, Match Record (W·D·L), Win Rate, and Reward Status — all sourced from saved data.
  - "Record Standing" modal with full validation (division 1–10, non-negative stats, optional rank ≥ 1) saves a new division-progress snapshot.
  - Overall Top Performers section from real player catalogue performance data.
  - Previous Month Top Performers section from confirmed progress snapshot deltas; hidden (not blank/fabricated) when no prior-month data is available.
  - Closed Season History section displaying immutable closure records with division, points, record, win rate, rank, and reward status.
- **No Fabrication Policy**:
  - Previous-month totals are never synthesized from all-time data.
  - Missing division or stats are displayed as `—` (unavailable) not `0`.
  - Reward eligibility is derived only from confirmed recorded rank values.
- **Automated Verification** (`scripts/test_dashboard_integration.js`, `npm run test:dashboard`):
  - 17 tests covering: `isValidDivisionValue` boundary checks, reject on missing/Draft/Closed season, invalid division, negative/fractional stats, invalid rank values, successful snapshot creation with computed fields, rank→`finalRank` synchronization, zero-match safe winRate, append-only behavior, localStorage persistence, closure snapshot deep copy, reload persistence, closed-season immutability, null rank acceptance, and empty snapshots for fresh seasons.
  - All 17 tests pass (Exit 0).

### Milestone 5B — Stats & Records (Completed)
- **Three Core Statistics Views & Period Navigation**:
  - Replaced `ViewPlaceholder` in `src/App.tsx` with a responsive, high-contrast `StatsRecordsView.tsx` component.
  - Navigation segmented control providing strictly three main views:
    1. **Overall (All-Time)**
    2. **Previous Month**
    3. **Seasons — Last 5**
  - **Zero "By Position" View Policy**: strictly verified that no "By Position" tab, view, or filter exists in the navigation or data model.
- **Overall (All-Time) Statistics**:
  - Uses authentic `overallPerformance` data directly from `src/data/players.json`.
  - Displays individual player cards/rows: artwork, player name, stable card ID (`P001`–`P023`), card version (`cardName`), primary position, overall rating, matches played, goals, assists, goal contributions, and per-match rates.
  - Quick player-name and card-name search filter.
  - Multi-column sorting by matches, goals, assists, and goal contributions (toggling between desc/asc with active chevron indicator).
  - Derived calculations:
    - Goal contributions computed as `goals + assists` only when both values are known numbers.
    - Goals per match and Assists per match computed only when matches played > 0 and the respective numerator is known; formatted to 2 decimal places.
  - Honest missing-value representation:
    - P023 Manuel Neuer's missing performance metrics remain strictly unavailable (`—`, `null`), never silently converted to zero.
    - Rates evaluate to `null` (`—`) when matches played is zero or unrecorded.
    - Aggregate summary displays total squad goals (1,805), assists (1,118), goal contributions (2,923), and appearances (8,110) accompanied by an explicit data integrity banner: *"Partial aggregate (22 of 23 player cards recorded · 1 card unavailable)"*.
- **Previous Month Statistics**:
  - Reuses the exact previous-calendar-month calculation from `src/data/dashboardService.ts` (`getPreviousMonthStats` and `getPreviousMonthWindow`) as the single source of truth.
  - Recomputes month window using local calendar dates: handles month rollover (January → December of prior year) and leap years (e.g. February 2024 has 29 days vs 28 in 2025).
  - Clear period header indicating exact month name, year, and date range (`YYYY-MM-01` to `YYYY-MM-lastDay`).
  - Derives deltas exclusively from confirmed progress snapshots recorded in that calendar month relative to the appropriate preceding reference (prior snapshot or confirmed baseline).
  - Clean empty state with explanation and direct navigation button to Seasons when no snapshots exist in that calendar month.
  - Never displays all-time career totals as monthly results.
  - Preserves negative deltas resulting from verified source corrections (never clamps to 0).
- **Seasons — Last 5 Campaigns**:
  - Selector providing up to the 5 most recent relevant seasons (Active or Closed); unactivated Draft seasons are strictly excluded.
  - **Season Ordering Rule**:
    1. Active campaigns placed first (representing ongoing season).
    2. Closed campaigns follow, sorted newest first by closure date (`closedAt` / `closureSnapshot.closedAt`), then `startDate` descending, `createdAt` descending, and season ID descending.
    3. At most 5 seasons returned. If fewer exist, only recorded seasons are displayed with an informative count label (no fabricated historical seasons).
  - Active seasons use confirmed baseline and latest confirmed progress snapshot from `seasonRepository.ts`.
  - Closed seasons use the frozen, immutable `SeasonClosureSnapshot` as the sole source of truth.
  - Preserves the baseline's Starting XI / Substitute role classification for each player card.
  - Distinguishes seasons without confirmed progress snapshots: displays an informative empty state explaining that baseline is set but no progress snapshots have been recorded yet, rather than inventing zero deltas.
  - Preserves negative deltas from verified corrections without silent zero-clamping.
  - Prevents duplicate counting across formations: each authentic player card (`P001`–`P023`) contributes at most once per season.
- **Player Profile Integration**:
  - Clicking any player row or card in Overall, Previous Month, or Seasons views triggers `onSelectPlayer(playerId)` in `App.tsx`, seamlessly navigating to that player's comprehensive Player Profile with back button returning to catalogue.
- **Automated Verification** (`scripts/test_stats_records.js`, `npm run test:stats`):
  - 16 comprehensive unit tests covering:
    1. Overall view authentic `overallPerformance` data loading (Zlatan, Ronaldo, Messi verified).
    2. Missing values on P023 Neuer remain `null` (not 0); partial aggregate notice verified.
    3. Goal contributions (`goals + assists`) and per-match rates accurate.
    4. Rates evaluate strictly to `null` when matches is 0 or missing.
    5. Shared calculation with Dashboard `getPreviousMonthTopPerformers`.
    6. Previous Month unavailable state with 0 deltas when no snapshots exist (no all-time fallback).
    7. Missing reference baseline produces clean unavailable state.
    8. Leap year (Feb 2024, 29 days), non-leap year (Feb 2025, 28 days), and Jan→Dec rollover.
    9. Unconfirmed drafts strictly excluded from statistics.
    10. 5-season selector orders Active first, newest closed next, excludes drafts.
    11. Active season deltas and per-match rates against confirmed baseline.
    12. Closed seasons read from immutable closure snapshots.
    13. Negative deltas (-1) preserved without zero-clamping.
    14. Exactly 23 unique cards per season with zero duplicate counting.
    15. Zero "By Position" tab or filter verified in view and types.
    16. Dashboard, season, squad, and artwork subsystems preserved without regression.
  - All 16 tests pass (Exit 0).

## Known Limitations
- Position familiarity is intentionally not tracked (per specification).
- Tactician/manager auto-arrange and tactical instruction controls are excluded (per milestone scope).
- Cross-season broad analytics dashboards, cloud sync, authentication, and automatic/date-based season closure are excluded (per ₹0 budget and milestone scope).

## Commands Executed & Results
- `npm run lint`: ESLint check passed with 0 errors and 0 warnings (Exit 0).
- `npm run build`: Production build via `tsc -b && vite build` bundled successfully in 1.50s (Exit 0).
- `npm run test:squad`: Node.js unit test suite for formations, independence, and validation passed (Exit 0).
- `npm run test:season`: Node.js unit test suite for season workflows passed (38 tests covering Milestones 4A, 4B, 4C1, and 4C2, Exit 0).
- `npm run test:dashboard`: Node.js unit test suite for Milestone 5A dashboard integration passed (17 tests, Exit 0).
- `npm run test:stats`: Node.js unit test suite for Milestone 5B stats & records passed (16 tests, Exit 0).
- `node scripts/test_pitch_artwork.js`: Pitch artwork suite verifying 23 image files, CSS classes, contain sizing, pointer event safety, and zero collisions across formations passed (Exit 0).

## Next Action
Milestone 5B Stats & Records is complete and verified on branch `feature/stats-records`. Awaiting user review before any commit, merge, or push.


