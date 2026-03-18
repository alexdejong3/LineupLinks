import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const teammateOf = request.nextUrl.searchParams.get("teammateOf");
  const db = getDb();

  let players;
  if (teammateOf) {
    const teammateId = Number(teammateOf);
    players = db
      .prepare(
        `SELECT DISTINCT p.id, p.full_name, p.debut_year, p.last_year, p.primary_position
         FROM players p
         JOIN roster_appearances ra2 ON ra2.player_id = p.id
         JOIN roster_appearances ra1 ON ra1.team_id = ra2.team_id
                                    AND ra1.season = ra2.season
                                    AND ra1.player_id = ?
         WHERE p.full_name LIKE ? AND p.id != ?
         ORDER BY CASE WHEN p.full_name LIKE ? THEN 0 ELSE 1 END, p.last_year DESC
         LIMIT 10`
      )
      .all(teammateId, `%${q}%`, teammateId, `${q}%`);
  } else {
    players = db
      .prepare(
        `SELECT id, full_name, debut_year, last_year, primary_position FROM players
         WHERE full_name LIKE ?
         ORDER BY
           CASE WHEN full_name LIKE ? THEN 0 ELSE 1 END,
           last_year DESC
         LIMIT 10`
      )
      .all(`%${q}%`, `${q}%`);
  }

  return NextResponse.json(players);
}
