import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "mlb.db");
const BASE_URL = "https://statsapi.mlb.com/api/v1";
const START_YEAR = 1970;
const END_YEAR = 2025;

interface AwardRecipient {
  player: { id: number; nameFirstLast: string };
  season: number;
}

async function backfill() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Create table for raw per-year data
  db.exec(`
    CREATE TABLE IF NOT EXISTS allstar_appearances (
      player_id INTEGER,
      season INTEGER,
      PRIMARY KEY (player_id, season)
    );
  `);

  // Add column to players if it doesn't exist (for existing DBs)
  try {
    db.exec(
      `ALTER TABLE players ADD COLUMN allstar_appearances INTEGER NOT NULL DEFAULT 0`
    );
    console.log("Added allstar_appearances column to players table");
  } catch {
    // Column already exists
    console.log("allstar_appearances column already exists");
  }

  const insertAppearance = db.prepare(
    "INSERT OR IGNORE INTO allstar_appearances (player_id, season) VALUES (?, ?)"
  );

  // Check which player IDs exist in our DB
  const playerExists = db.prepare("SELECT 1 FROM players WHERE id = ?");

  let totalInserted = 0;
  let skippedPlayers = 0;

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    let yearCount = 0;

    for (const awardId of ["ALAS", "NLAS"]) {
      const url = `${BASE_URL}/awards/${awardId}/recipients?season=${year}`;
      let res: Response;
      try {
        res = await fetch(url);
      } catch (err) {
        console.error(`  Failed to fetch ${awardId} ${year}: ${err}`);
        continue;
      }

      if (!res.ok) {
        if (res.status === 404) {
          // No data for this year (e.g., 2020 cancellation)
          continue;
        }
        console.error(
          `  Failed to fetch ${awardId} ${year}: HTTP ${res.status}`
        );
        continue;
      }

      const data = (await res.json()) as { awards?: { player: { id: number }; season: number }[] };
      const recipients = data.awards ?? [];

      for (const recipient of recipients) {
        const playerId = recipient.player.id;

        // Only insert if player exists in our DB
        if (!playerExists.get(playerId)) {
          skippedPlayers++;
          continue;
        }

        insertAppearance.run(playerId, year);
        yearCount++;
      }
    }

    totalInserted += yearCount;
    console.log(`  ${year}: ${yearCount} All-Stars`);
  }

  // Update denormalized count on players table
  console.log("\nUpdating player allstar_appearances counts...");
  db.exec(`
    UPDATE players SET allstar_appearances = (
      SELECT COUNT(*) FROM allstar_appearances WHERE player_id = players.id
    )
  `);

  const uniqueAllStars = db
    .prepare("SELECT COUNT(DISTINCT player_id) as count FROM allstar_appearances")
    .get() as { count: number };

  console.log(
    `\nBackfill complete: ${totalInserted} appearances, ${uniqueAllStars.count} unique All-Stars`
  );
  console.log(`Skipped ${skippedPlayers} players not in local DB`);
  db.close();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
