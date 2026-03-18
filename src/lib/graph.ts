import { getDb } from "./db";
import type { PathResult, Connection } from "./types";

interface Edge {
  playerId: number;
  teamId: number;
  season: number;
}

let adjacencyList: Map<number, Edge[]> | null = null;
let playerNames: Map<number, string> | null = null;
let playerPositions: Map<number, string> | null = null;
let teamNames: Map<string, string> | null = null;
let canonicalTeamNames: Map<number, string> | null = null;

export function getGraph() {
  if (!adjacencyList) {
    buildGraph();
  }
  return { adjacencyList: adjacencyList!, playerNames: playerNames!, playerPositions: playerPositions!, teamNames: teamNames!, canonicalTeamNames: canonicalTeamNames! } as const;
}

function buildGraph() {
  const db = getDb();

  // Load player names and positions
  playerNames = new Map();
  playerPositions = new Map();
  const players = db.prepare("SELECT id, full_name, primary_position FROM players").all() as {
    id: number;
    full_name: string;
    primary_position: string | null;
  }[];
  for (const p of players) {
    playerNames.set(p.id, p.full_name);
    if (p.primary_position) {
      playerPositions.set(p.id, p.primary_position);
    }
  }

  // Load team names by season
  teamNames = new Map();
  const teamSeasons = db.prepare("SELECT team_id, season, name FROM team_seasons").all() as {
    team_id: number;
    season: number;
    name: string;
  }[];
  for (const ts of teamSeasons) {
    teamNames.set(`${ts.team_id}:${ts.season}`, ts.name);
  }

  // Load canonical team names (from teams table)
  canonicalTeamNames = new Map();
  const teams = db.prepare("SELECT id, name FROM teams").all() as {
    id: number;
    name: string;
  }[];
  for (const t of teams) {
    canonicalTeamNames.set(t.id, t.name);
  }

  // Build adjacency list: two players are connected if they share a team+season
  adjacencyList = new Map();

  // Group roster appearances by team+season
  const appearances = db
    .prepare("SELECT player_id, team_id, season FROM roster_appearances ORDER BY team_id, season")
    .all() as { player_id: number; team_id: number; season: number }[];

  const teamSeasonPlayers = new Map<string, number[]>();
  for (const a of appearances) {
    const key = `${a.team_id}:${a.season}`;
    let list = teamSeasonPlayers.get(key);
    if (!list) {
      list = [];
      teamSeasonPlayers.set(key, list);
    }
    list.push(a.player_id);
  }

  // For each team+season group, every pair of players is connected
  for (const [key, playerIds] of teamSeasonPlayers) {
    const [teamIdStr, seasonStr] = key.split(":");
    const teamId = parseInt(teamIdStr);
    const season = parseInt(seasonStr);

    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        const a = playerIds[i];
        const b = playerIds[j];

        addEdge(a, b, teamId, season);
        addEdge(b, a, teamId, season);
      }
    }
  }
}

function addEdge(from: number, to: number, teamId: number, season: number) {
  let edges = adjacencyList!.get(from);
  if (!edges) {
    edges = [];
    adjacencyList!.set(from, edges);
  }
  edges.push({ playerId: to, teamId, season });
}

export function findShortestPath(startId: number, endId: number): PathResult {
  const { adjacencyList, playerNames, playerPositions, canonicalTeamNames } = getGraph();

  if (startId === endId) {
    return {
      found: true,
      path: [
        {
          playerId: startId,
          playerName: playerNames.get(startId) ?? "Unknown",
          playerPosition: playerPositions.get(startId),
          teamId: 0,
          teamName: "",
        },
      ],
      distance: 0,
    };
  }

  if (!adjacencyList.has(startId) || !adjacencyList.has(endId)) {
    return { found: false, path: [], distance: -1 };
  }

  // BFS
  const visited = new Set<number>();
  const parent = new Map<number, { playerId: number; teamId: number; season: number }>();
  const queue: number[] = [startId];
  visited.add(startId);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === endId) {
      // Reconstruct path
      const path: Connection[] = [];
      let node = endId;

      while (node !== startId) {
        const prev = parent.get(node)!;
        path.unshift({
          playerId: node,
          playerName: playerNames.get(node) ?? "Unknown",
          playerPosition: playerPositions.get(node),
          teamId: prev.teamId,
          teamName: canonicalTeamNames.get(prev.teamId) ?? "Unknown",
        });
        node = prev.playerId;
      }

      // Add start node
      path.unshift({
        playerId: startId,
        playerName: playerNames.get(startId) ?? "Unknown",
        playerPosition: playerPositions.get(startId),
        teamId: 0,
        teamName: "",
      });

      return { found: true, path, distance: path.length - 1 };
    }

    const edges = adjacencyList.get(current) ?? [];
    for (const edge of edges) {
      if (!visited.has(edge.playerId)) {
        visited.add(edge.playerId);
        parent.set(edge.playerId, {
          playerId: current,
          teamId: edge.teamId,
          season: edge.season,
        });
        queue.push(edge.playerId);
      }
    }
  }

  return { found: false, path: [], distance: -1 };
}

export function validateConnection(
  player1Id: number,
  player2Id: number
): { valid: boolean; teamId?: number; teamName?: string } {
  const db = getDb();
  const { canonicalTeamNames } = getGraph();
  const result = db
    .prepare(
      `SELECT ra1.team_id FROM roster_appearances ra1
       JOIN roster_appearances ra2 ON ra2.team_id = ra1.team_id AND ra2.season = ra1.season AND ra2.player_id = ?
       WHERE ra1.player_id = ?
       LIMIT 1`
    )
    .get(player2Id, player1Id) as { team_id: number } | undefined;
  if (!result) return { valid: false };
  return {
    valid: true,
    teamId: result.team_id,
    teamName: canonicalTeamNames.get(result.team_id) ?? "Unknown",
  };
}
