import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getNotablePlayers } from "../src/lib/daily";
import { findShortestPath } from "../src/lib/graph";

const OVERRIDES_PATH = path.join(process.cwd(), "data", "daily-overrides.json");

function getTodayEST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function main() {
  const dateStr = process.argv[2] ?? getTodayEST();

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD.`);
    process.exit(1);
  }

  console.log(`Repicking daily challenge for ${dateStr}...`);

  const players = getNotablePlayers();
  if (players.length < 2) {
    console.error("Not enough notable players in the database.");
    process.exit(1);
  }

  let startPlayer, endPlayer;
  let par = -1;
  let attempts = 0;

  while (attempts < 200) {
    const idx1 = crypto.randomInt(players.length);
    let idx2 = crypto.randomInt(players.length);
    if (idx2 === idx1) idx2 = (idx2 + 1) % players.length;

    startPlayer = players[idx1];
    endPlayer = players[idx2];

    const result = findShortestPath(startPlayer.id, endPlayer.id);
    if (result.found && result.distance >= 2 && result.distance <= 6) {
      par = result.distance;
      break;
    }
    attempts++;
  }

  if (par === -1 || !startPlayer || !endPlayer) {
    console.error("Could not find a valid pairing after 200 attempts.");
    process.exit(1);
  }

  // Read existing overrides
  let overrides: Record<string, { startPlayerId: number; endPlayerId: number }> = {};
  try {
    overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf-8"));
  } catch {
    // File doesn't exist yet, start fresh
  }

  overrides[dateStr] = {
    startPlayerId: startPlayer.id,
    endPlayerId: endPlayer.id,
  };

  fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2) + "\n");

  console.log(`\nOverride saved to ${OVERRIDES_PATH}`);
  console.log(`  Date:   ${dateStr}`);
  console.log(`  Start:  ${startPlayer.full_name} (id: ${startPlayer.id})`);
  console.log(`  End:    ${endPlayer.full_name} (id: ${endPlayer.id})`);
  console.log(`  Par:    ${par}`);
}

main();
