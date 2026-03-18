import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "mlb.db");
const BASE_URL = "https://statsapi.mlb.com/api/v1";
const BATCH_SIZE = 50;
const THROTTLE_MS = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function backfill() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Add column if it doesn't exist
  try {
    db.exec(`ALTER TABLE players ADD COLUMN primary_position TEXT`);
    console.log("Added primary_position column to players table");
  } catch {
    console.log("primary_position column already exists");
  }

  const updatePosition = db.prepare(
    "UPDATE players SET primary_position = ? WHERE id = ?"
  );

  // Get all players without a position
  const players = db
    .prepare("SELECT id, full_name FROM players WHERE primary_position IS NULL")
    .all() as { id: number; full_name: string }[];

  console.log(`Found ${players.length} players without position data`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE);

    for (const player of batch) {
      try {
        const res = await fetch(`${BASE_URL}/people/${player.id}`);
        if (!res.ok) {
          failed++;
          continue;
        }
        const data = (await res.json()) as {
          people?: { primaryPosition?: { abbreviation?: string } }[];
        };
        const position = data.people?.[0]?.primaryPosition?.abbreviation;
        if (position) {
          updatePosition.run(position, player.id);
          updated++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      await sleep(THROTTLE_MS);
    }

    const progress = Math.min(i + BATCH_SIZE, players.length);
    console.log(
      `  Progress: ${progress}/${players.length} (${updated} updated, ${failed} failed)`
    );
  }

  console.log(`\nBackfill complete: ${updated} positions updated, ${failed} failed`);
  db.close();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
