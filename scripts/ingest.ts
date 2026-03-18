import { initDb } from "../src/lib/db";
import path from "path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "data", "mlb.db");
const BASE_URL = "https://statsapi.mlb.com/api/v1";
const START_YEAR = 1970;
const END_YEAR = 2025;
const THROTTLE_MS = 150;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

interface MLBTeam {
  id: number;
  name: string;
  abbreviation: string;
}

interface MLBRosterEntry {
  person: { id: number; fullName: string };
  position: { abbreviation: string };
}

async function ingest() {
  console.log("Initializing database...");
  const db = initDb(DB_PATH);

  const insertTeam = db.prepare(
    "INSERT INTO teams (id, name, abbreviation) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, abbreviation=excluded.abbreviation"
  );
  const insertPlayer = db.prepare(
    "INSERT INTO players (id, full_name, primary_position) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET primary_position=COALESCE(excluded.primary_position, players.primary_position)"
  );
  const updatePlayerYears = db.prepare(
    `UPDATE players SET
       debut_year = CASE WHEN debut_year IS NULL OR ? < debut_year THEN ? ELSE debut_year END,
       last_year = CASE WHEN last_year IS NULL OR ? > last_year THEN ? ELSE last_year END
     WHERE id = ?`
  );
  const insertRoster = db.prepare(
    "INSERT OR IGNORE INTO roster_appearances (player_id, team_id, season) VALUES (?, ?, ?)"
  );
  const insertTeamSeason = db.prepare(
    "INSERT INTO team_seasons (team_id, season, name, abbreviation) VALUES (?, ?, ?, ?) ON CONFLICT(team_id, season) DO UPDATE SET name=excluded.name, abbreviation=excluded.abbreviation"
  );

  const insertMany = db.transaction(
    (entries: { playerId: number; playerName: string; position: string | null; teamId: number; season: number }[]) => {
      for (const e of entries) {
        insertPlayer.run(e.playerId, e.playerName, e.position);
        updatePlayerYears.run(e.season, e.season, e.season, e.season, e.playerId);
        insertRoster.run(e.playerId, e.teamId, e.season);
      }
    }
  );

  // Track all team IDs we've seen across seasons
  const allTeamIds = new Set<number>();

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    console.log(`\n--- Season ${year} ---`);

    // Fetch teams for this season
    const teamsUrl = `${BASE_URL}/teams?sportId=1&season=${year}`;
    let teamsData: { teams: MLBTeam[] };
    try {
      teamsData = (await fetchJson(teamsUrl)) as { teams: MLBTeam[] };
    } catch (err) {
      console.error(`  Failed to fetch teams for ${year}:`, err);
      continue;
    }
    await sleep(THROTTLE_MS);

    const teams = teamsData.teams ?? [];
    console.log(`  Found ${teams.length} teams`);

    for (const team of teams) {
      insertTeam.run(team.id, team.name, team.abbreviation ?? "");
      insertTeamSeason.run(team.id, year, team.name, team.abbreviation ?? "");
      allTeamIds.add(team.id);
    }

    // Fetch rosters for each team
    for (const team of teams) {
      const rosterUrl = `${BASE_URL}/teams/${team.id}/roster?season=${year}&rosterType=fullSeason`;
      let rosterData: { roster: MLBRosterEntry[] };
      try {
        rosterData = (await fetchJson(rosterUrl)) as { roster: MLBRosterEntry[] };
      } catch (err) {
        console.error(`  Failed to fetch roster for ${team.name} (${year}):`, err);
        await sleep(THROTTLE_MS);
        continue;
      }

      const roster = rosterData.roster ?? [];
      const entries = roster.map((r) => ({
        playerId: r.person.id,
        playerName: r.person.fullName,
        position: r.position?.abbreviation ?? null,
        teamId: team.id,
        season: year,
      }));

      insertMany(entries);
      process.stdout.write(`  ${team.abbreviation ?? team.name}: ${roster.length} players  `);
      await sleep(THROTTLE_MS);
    }
    console.log();
  }

  // Print stats
  const playerCount = (db.prepare("SELECT COUNT(*) as cnt FROM players").get() as { cnt: number })
    .cnt;
  const teamCount = (db.prepare("SELECT COUNT(*) as cnt FROM teams").get() as { cnt: number }).cnt;
  const rosterCount = (
    db.prepare("SELECT COUNT(*) as cnt FROM roster_appearances").get() as { cnt: number }
  ).cnt;

  console.log(`\n=== Ingest Complete ===`);
  console.log(`Players: ${playerCount}`);
  console.log(`Teams: ${teamCount}`);
  console.log(`Roster appearances: ${rosterCount}`);

  db.close();
}

ingest().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});
