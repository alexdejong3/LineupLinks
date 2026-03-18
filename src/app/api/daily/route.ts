import { NextResponse } from "next/server";
import { getDailyChallenge, getDailyOverride } from "@/lib/daily";
import { getDb } from "@/lib/db";
import { findShortestPath } from "@/lib/graph";
import type { DailyChallenge, Player } from "@/lib/types";

export async function GET() {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  const override = getDailyOverride(today);
  if (override) {
    const db = getDb();
    const startPlayer = db
      .prepare("SELECT id, full_name, debut_year, last_year, allstar_appearances, primary_position FROM players WHERE id = ?")
      .get(override.startPlayerId) as Player | undefined;
    const endPlayer = db
      .prepare("SELECT id, full_name, debut_year, last_year, allstar_appearances, primary_position FROM players WHERE id = ?")
      .get(override.endPlayerId) as Player | undefined;

    if (startPlayer && endPlayer) {
      const result = findShortestPath(startPlayer.id, endPlayer.id);
      if (result.found && result.distance >= 1) {
        const challenge: DailyChallenge = {
          date: today,
          startPlayer,
          endPlayer,
          par: result.distance,
        };
        return NextResponse.json(challenge);
      }
    }
  }

  const challenge = getDailyChallenge(today);

  if (!challenge) {
    return NextResponse.json({ error: "Could not generate daily challenge" }, { status: 500 });
  }

  return NextResponse.json(challenge);
}
