"use client";

import { useState } from "react";
import PlayerSearch from "@/components/PlayerSearch";
import ChainBuilder from "@/components/ChainBuilder";
import PlayerTeamHistory from "@/components/PlayerTeamHistory";
import PlayerHeadshot from "@/components/PlayerHeadshot";
import type { Player } from "@/lib/types";

export default function FreePlayPage() {
  const [startPlayer, setStartPlayer] = useState<Player | null>(null);
  const [endPlayer, setEndPlayer] = useState<Player | null>(null);
  const [par, setPar] = useState<number | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!startPlayer || !endPlayer) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/solve?startId=${startPlayer.id}&endId=${endPlayer.id}`
      );
      const data = await res.json();

      if (!data.found) {
        setError("No connection found between these players.");
        setLoading(false);
        return;
      }

      setPar(data.distance);
      setGameActive(true);
    } catch {
      setError("Failed to check connection.");
    }
    setLoading(false);
  }

  function handleReset() {
    setStartPlayer(null);
    setEndPlayer(null);
    setPar(null);
    setGameActive(false);
    setError(null);
  }

  if (gameActive && startPlayer && endPlayer && par !== null) {
    return (
      <div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">Free Play</h1>
          <button
            onClick={handleReset}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline"
          >
            New game
          </button>
        </div>

        <ChainBuilder
          startPlayer={startPlayer}
          endPlayer={endPlayer}
          par={par}
          mode="free-play"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1">Free Play</h1>
        <p className="text-sm text-[var(--muted)]">
          Pick any two players and find the connection.
        </p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-medium mb-2">Start Player</label>
          {startPlayer ? (
            <div className="flex items-start justify-between bg-[var(--card)] border border-[var(--card-border)] rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                <PlayerHeadshot playerId={startPlayer.id} size={36} />
                <div>
                  <span>
                    {startPlayer.full_name}
                    {startPlayer.debut_year && (
                      <span className="text-[var(--muted)] text-sm ml-2">
                        ({startPlayer.debut_year}–{startPlayer.last_year})
                      </span>
                    )}
                  </span>
                  <PlayerTeamHistory playerId={startPlayer.id} />
                </div>
              </div>
              <button
                onClick={() => setStartPlayer(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] ml-2"
              >
                &times;
              </button>
            </div>
          ) : (
            <PlayerSearch
              onSelect={setStartPlayer}
              placeholder="Search for start player..."
              excludeIds={endPlayer ? [endPlayer.id] : []}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">End Player</label>
          {endPlayer ? (
            <div className="flex items-start justify-between bg-[var(--card)] border border-[var(--card-border)] rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                <PlayerHeadshot playerId={endPlayer.id} size={36} />
                <div>
                  <span>
                    {endPlayer.full_name}
                    {endPlayer.debut_year && (
                      <span className="text-[var(--muted)] text-sm ml-2">
                        ({endPlayer.debut_year}–{endPlayer.last_year})
                      </span>
                    )}
                  </span>
                  <PlayerTeamHistory playerId={endPlayer.id} />
                </div>
              </div>
              <button
                onClick={() => setEndPlayer(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] ml-2"
              >
                &times;
              </button>
            </div>
          ) : (
            <PlayerSearch
              onSelect={setEndPlayer}
              placeholder="Search for end player..."
              excludeIds={startPlayer ? [startPlayer.id] : []}
            />
          )}
        </div>

        {error && <div className="text-sm text-[var(--error)] text-center">{error}</div>}

        <button
          onClick={handleStart}
          disabled={!startPlayer || !endPlayer || loading}
          className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg
                     font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Checking connection..." : "Start Game"}
        </button>
      </div>
    </div>
  );
}
