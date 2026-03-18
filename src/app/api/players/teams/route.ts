import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { PlayerTeamStint } from "@/lib/types";

export async function GET(request: NextRequest) {
  const playerId = Number(request.nextUrl.searchParams.get("playerId"));
  if (!playerId) {
    return NextResponse.json([]);
  }

  const withPlayerId = request.nextUrl.searchParams.get("withPlayerId");
  const db = getDb();

  let rows: { team_id: number; season: number; team_name: string; abbreviation: string }[];

  if (withPlayerId) {
    const withId = Number(withPlayerId);
    rows = db
      .prepare(
        `SELECT ra.team_id, ra.season, t.name as team_name,
                COALESCE(ts.abbreviation, t.abbreviation) as abbreviation
         FROM roster_appearances ra
         JOIN teams t ON t.id = ra.team_id
         LEFT JOIN team_seasons ts ON ts.team_id = ra.team_id AND ts.season = ra.season
         JOIN roster_appearances ra2 ON ra2.team_id = ra.team_id
                                    AND ra2.season = ra.season
                                    AND ra2.player_id = ?
         WHERE ra.player_id = ?
         ORDER BY ra.season`
      )
      .all(withId, playerId) as typeof rows;
  } else {
    rows = db
      .prepare(
        `SELECT ra.team_id, ra.season, t.name as team_name,
                COALESCE(ts.abbreviation, t.abbreviation) as abbreviation
         FROM roster_appearances ra
         JOIN teams t ON t.id = ra.team_id
         LEFT JOIN team_seasons ts ON ts.team_id = ra.team_id AND ts.season = ra.season
         WHERE ra.player_id = ?
         ORDER BY ra.season`
      )
      .all(playerId) as typeof rows;
  }

  // Group consecutive seasons on the same team into stints
  const stints: PlayerTeamStint[] = [];
  for (const row of rows) {
    const last = stints[stints.length - 1];
    if (last && last.team_id === row.team_id && row.season === last.end_year + 1) {
      last.end_year = row.season;
      last.abbreviation = row.abbreviation;
      last.team_name = row.team_name;
    } else {
      stints.push({
        team_id: row.team_id,
        team_name: row.team_name,
        abbreviation: row.abbreviation,
        start_year: row.season,
        end_year: row.season,
      });
    }
  }

  return NextResponse.json(stints);
}
