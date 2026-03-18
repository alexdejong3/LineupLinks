# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run ingest` — Populate SQLite DB from MLB Stats API (1970–2025, takes a while due to API throttling)
- `npm run backfill-team-seasons` — Backfill team_seasons table

No test runner or linter is configured. TypeScript strict mode is on (`tsconfig.json`).

## Architecture

"LineupLinks" — connect MLB players through chains of teammates. Users connect two players through chains of teammates (shared team + season).

### Data layer

- **SQLite** (`data/mlb.db`) via `better-sqlite3`, opened read-only at runtime (`src/lib/db.ts`)
- Schema: `players`, `teams`, `roster_appearances(player_id, team_id, season)`, `team_seasons(team_id, season, name, abbreviation)`
- Data ingested from `statsapi.mlb.com` by `scripts/ingest.ts`
- The `.db` file is gitignored — must run `npm run ingest` to populate locally

### Graph engine (`src/lib/graph.ts`)

The core algorithm. On first request, `buildGraph()` loads all roster appearances into an in-memory adjacency list where two players are connected if they shared a team+season. This is cached as a module-level singleton. `findShortestPath` runs BFS on this graph. `validateConnection` uses a direct SQL query (not the graph) to check if two players were teammates.

### Daily challenge (`src/lib/daily.ts`)

Uses a deterministic seeded PRNG (mulberry32) keyed on the date string to pick two "notable" players (10+ seasons) with a shortest path of 2–6 steps. Same date always produces the same challenge.

### API routes (`src/app/api/`)

| Route | Method | Purpose |
|---|---|---|
| `/api/daily` | GET | Today's challenge (date, players, par) |
| `/api/players/search?q=&teammateOf=` | GET | Player autocomplete, optionally filtered to teammates |
| `/api/players/teams?playerId=&withPlayerId=` | GET | Teams a player appeared on |
| `/api/solve?startId=&endId=` | GET | Shortest path via BFS |
| `/api/validate` | POST | Check if two players were teammates `{player1Id, player2Id}` |

### Frontend

Next.js App Router with all pages as client components. Two modes:
- **Daily** (`/`) — loads challenge from `/api/daily`, saves completion stats to localStorage
- **Free Play** (`/free-play`) — user picks both players

`ChainBuilder` is the main game component. User builds a chain step-by-step; each step validated via `/api/validate`. `PlayerSearch` provides debounced autocomplete with optional teammate filtering.

### Styling

Dark theme using CSS custom properties defined in `globals.css` (e.g., `--accent`, `--card`, `--muted`). Tailwind CSS 4 with these variables referenced as `var(--*)` throughout components.

### Path alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).
