# LineupLinks

Connect two MLB players through a chain of teammates. Pick a start player and an end player, then build a path where each link shares a team and season.

## Modes

- **Daily Challenge** — A new puzzle each day with the same pairing for all players. Try to solve it in as few steps as the par.
- **Free Play** — Choose any two players and find the shortest connection.

## Setup

```bash
npm install
npm run ingest        # populate SQLite DB from MLB Stats API (1970–2025, slow due to throttling)
npm run dev           # start dev server at http://localhost:3000
```

### Optional backfill scripts

```bash
npm run backfill-team-seasons   # historical team names/abbreviations per season
npm run backfill-allstar        # All-Star appearance data
npm run backfill-positions      # player primary positions
npm run repick-daily            # regenerate today's daily challenge (or pass YYYY-MM-DD)
```

## Tech stack

- **Next.js** (App Router) with React 19
- **SQLite** via better-sqlite3 (read-only at runtime)
- **Tailwind CSS 4** with CSS custom properties for dark theme
- **TypeScript** in strict mode

## How it works

All MLB roster data from 1970–2025 is ingested into a SQLite database. On first API request, the server builds an in-memory graph where players are connected if they shared a team and season. Shortest paths are found via BFS.

The daily challenge uses a deterministic seeded PRNG so every player sees the same puzzle on a given day. Manual overrides can be set via `npm run repick-daily`.

## Deployment

Dockerized standalone Next.js on [Fly.io](https://fly.io). The SQLite database is baked into the container image at build time.

## Disclaimer

This project was built with [Claude](https://claude.ai).
