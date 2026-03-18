import fs from "fs";
import path from "path";
import { getDb } from "./db";
import { findShortestPath } from "./graph";
import type { DailyChallenge, Player } from "./types";

const OVERRIDES_PATH = path.join(process.cwd(), "data", "daily-overrides.json");

interface DailyOverride {
  startPlayerId: number;
  endPlayerId: number;
}

export function getDailyOverride(dateStr: string): DailyOverride | null {
  try {
    const raw = fs.readFileSync(OVERRIDES_PATH, "utf-8");
    const overrides: Record<string, DailyOverride> = JSON.parse(raw);
    return overrides[dateStr] ?? null;
  } catch {
    return null;
  }
}

// Simple seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getNotablePlayers(): Player[] {
  const db = getDb();
  // All-Stars OR recent players with 6+ year careers
  const players = db
    .prepare(
      `SELECT id, full_name, debut_year, last_year, allstar_appearances, primary_position FROM players
       WHERE allstar_appearances >= 1
          OR (last_year >= 2023 AND last_year - debut_year >= 6)
       ORDER BY full_name`
    )
    .all() as Player[];
  return players;
}

// Weighted random selection using the seeded PRNG
function weightedPick(
  players: Player[],
  weights: number[],
  totalWeight: number,
  rng: () => number
): number {
  const r = rng() * totalWeight;
  let cumulative = 0;
  for (let i = 0; i < players.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return i;
  }
  return players.length - 1;
}

function computeWeights(players: Player[]): {
  weights: number[];
  totalWeight: number;
} {
  const currentYear = new Date().getFullYear();
  const weights = players.map((p) => {
    const allstar = p.allstar_appearances ?? 0;
    const notabilityScore = Math.log2(1 + allstar);

    const lastActive = p.last_year ?? 0;
    const yearsSinceActive = currentYear - lastActive;
    let recencyMultiplier: number;
    if (yearsSinceActive <= 5) {
      recencyMultiplier = 3;
    } else if (yearsSinceActive <= 15) {
      recencyMultiplier = 2;
    } else {
      recencyMultiplier = 1;
    }

    return Math.max(1, notabilityScore * recencyMultiplier);
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  return { weights, totalWeight };
}

export function getDailyChallenge(dateStr: string): DailyChallenge | null {
  const notablePlayers = getNotablePlayers();
  if (notablePlayers.length < 2) return null;

  const seed = dateToSeed(dateStr);
  const rng = mulberry32(seed);

  const { weights, totalWeight } = computeWeights(notablePlayers);

  // Pick two distinct players ensuring a path exists
  let startPlayer: Player;
  let endPlayer: Player;
  let par = -1;
  let attempts = 0;

  do {
    const idx1 = weightedPick(notablePlayers, weights, totalWeight, rng);
    let idx2 = weightedPick(notablePlayers, weights, totalWeight, rng);
    if (idx2 === idx1) idx2 = (idx2 + 1) % notablePlayers.length;

    startPlayer = notablePlayers[idx1];
    endPlayer = notablePlayers[idx2];

    const result = findShortestPath(startPlayer.id, endPlayer.id);
    if (result.found && result.distance >= 2 && result.distance <= 6) {
      par = result.distance;
      break;
    }
    attempts++;
  } while (attempts < 100);

  if (par === -1) return null;

  return {
    date: dateStr,
    startPlayer: startPlayer!,
    endPlayer: endPlayer!,
    par,
  };
}
