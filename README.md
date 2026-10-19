# Bala EFoot

**Squad • Skills • Seasons**

Bala EFoot is a personal, unofficial eFootball companion for managing a Dream Team squad, player skills, performance records, season history, and wishlist.

> This is a fan-made project and is not affiliated with, endorsed by, or an official product of Konami.

## Project goals

- Responsive web app for Mac, iPhone, and iPad.
- React + TypeScript + Vite frontend; potential installable PWA.
- Track squad formations, player profiles, skills, performance, and season snapshots.
- JSON and Excel backup/restore.
- Plan cross-device cloud sync from the beginning.
- Keep operating cost at **₹0**. Do not introduce paid services, billing-enabled overages, or usage-billed dependencies.
- Use attributable source data; leave unknown or unverified values blank rather than inventing them.

## Repository workflow

- `main`: stable baseline / releases.
- `develop`: integration branch for ongoing work, created from `main`.
- `feature/<short-name>`: future feature branches created from `develop` and merged back into `develop` after review.

## Project structure

- `docs/`: product requirements and implementation specification.
- `data/`: player data workbook and supplied source CSV files.
- `PROJECT_STATUS.md`: concise handoff/status notes for development across Antigravity sessions.

## Cost and safety constraints

- Single-user personal app.
- No Java/Spring Boot backend unless explicitly approved later.
- No secrets, access tokens, or database credentials in this repository.
- Any cloud database, authentication, hosting, or sync provider must be checked for free-tier limits and charge behavior before adoption. Do not add a payment method or enable billing.
- This repository is public, so its code, documentation, and committed data can be viewed and copied by anyone. Do not commit private or sensitive information.
