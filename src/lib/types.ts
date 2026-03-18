export interface Player {
  id: number;
  full_name: string;
  debut_year: number | null;
  last_year: number | null;
  allstar_appearances?: number;
  primary_position?: string;
}

export interface Team {
  id: number;
  name: string;
  abbreviation: string;
}

export interface RosterAppearance {
  player_id: number;
  team_id: number;
  season: number;
}

export interface Connection {
  playerId: number;
  playerName: string;
  playerPosition?: string;
  teamId: number;
  teamName: string;
}

export interface PathResult {
  found: boolean;
  path: Connection[];
  distance: number;
}

export interface DailyChallenge {
  date: string;
  startPlayer: Player;
  endPlayer: Player;
  par: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ChainStep {
  playerId: number;
  playerName: string;
  playerPosition?: string;
  teamId: number;
  teamName: string;
  validated: boolean;
  valid: boolean;
}

export interface PlayerTeamStint {
  team_id: number;
  team_name: string;
  abbreviation: string;
  start_year: number;
  end_year: number;
}
