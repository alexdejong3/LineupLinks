import { NextResponse } from "next/server";
import { getNotablePlayers } from "@/lib/daily";
import { findShortestPath } from "@/lib/graph";

export async function GET() {
  const players = getNotablePlayers();
  if (players.length < 2) {
    return NextResponse.json({ error: "Not enough players" }, { status: 500 });
  }

  let attempts = 0;
  while (attempts < 200) {
    const idx1 = Math.floor(Math.random() * players.length);
    let idx2 = Math.floor(Math.random() * players.length);
    if (idx2 === idx1) idx2 = (idx2 + 1) % players.length;

    const start = players[idx1];
    const end = players[idx2];

    const result = findShortestPath(start.id, end.id);
    if (result.found && result.distance >= 2 && result.distance <= 6) {
      return NextResponse.json({
        startPlayer: start,
        endPlayer: end,
        par: result.distance,
      });
    }
    attempts++;
  }

  return NextResponse.json({ error: "Could not find a valid pairing" }, { status: 500 });
}
