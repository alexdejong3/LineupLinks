import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "mlb.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    db.pragma("journal_mode = WAL");
  }
  return db;
}

export function initDb(dbPath?: string): Database.Database {
  const database = new Database(dbPath ?? DB_PATH);
  database.pragma("journal_mode = WAL");

  database.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      full_name TEXT NOT NULL,
      debut_year INTEGER,
      last_year INTEGER,
      allstar_appearances INTEGER NOT NULL DEFAULT 0,
      primary_position TEXT
    );
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS roster_appearances (
      player_id INTEGER,
      team_id INTEGER,
      season INTEGER,
      PRIMARY KEY (player_id, team_id, season)
    );
    CREATE INDEX IF NOT EXISTS idx_roster_team_season ON roster_appearances(team_id, season);
    CREATE INDEX IF NOT EXISTS idx_players_name ON players(full_name COLLATE NOCASE);
    CREATE TABLE IF NOT EXISTS team_seasons (
      team_id INTEGER,
      season INTEGER,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      PRIMARY KEY (team_id, season)
    );
    CREATE TABLE IF NOT EXISTS allstar_appearances (
      player_id INTEGER,
      season INTEGER,
      PRIMARY KEY (player_id, season)
    );
  `);

  return database;
}
