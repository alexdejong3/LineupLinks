import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "mlb.db");
const BASE_URL = "https://statsapi.mlb.com/api/v1";
const START_YEAR = 1970;
const END_YEAR = 2025;

interface MLBTeam {
  id: number;
  name: string;
  abbreviation: string;
}

async function backfill() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS team_seasons (
      team_id INTEGER,
      season INTEGER,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      PRIMARY KEY (team_id, season)
    );
  `);

  const insertTeamSeason = db.prepare(
    "INSERT INTO team_seasons (team_id, season, name, abbreviation) VALUES (?, ?, ?, ?) ON CONFLICT(team_id, season) DO UPDATE SET name=excluded.name, abbreviation=excluded.abbreviation"
  );

  // Get distinct seasons from roster_appearances to know which years have data
  const seasons = db
    .prepare("SELECT DISTINCT season FROM roster_appearances ORDER BY season")
    .all() as { season: number }[];

  console.log(`Found ${seasons.length} seasons to backfill`);

  let count = 0;
  for (const { season } of seasons) {
    const url = `${BASE_URL}/teams?sportId=1&season=${season}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch teams for ${season}: HTTP ${res.status}`);
      continue;
    }
    const data = (await res.json()) as { teams: MLBTeam[] };
    const teams = data.teams ?? [];

    for (const team of teams) {
      insertTeamSeason.run(team.id, season, team.name, team.abbreviation ?? "");
    }

    count += teams.length;
    console.log(`  ${season}: ${teams.length} teams`);
  }

  console.log(`\nBackfill complete: ${count} team-season rows inserted`);
  db.close();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
