"use client";

import { useState, useCallback } from "react";
import ConnectionStep from "./ConnectionStep";
import ResultsModal from "./ResultsModal";
import PlayerTeamHistory from "./PlayerTeamHistory";
import PlayerHeadshot from "./PlayerHeadshot";
import type { Player, ChainStep } from "@/lib/types";

interface ChainBuilderProps {
  startPlayer: Player;
  endPlayer: Player;
  par: number;
  mode: "daily" | "free-play";
  date?: string;
}

export default function ChainBuilder({ startPlayer, endPlayer, par, mode, date }: ChainBuilderProps) {
  const [chain, setChain] = useState<ChainStep[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [revealedPath, setRevealedPath] = useState<unknown[] | null>(null);

  const existingPlayerIds = [
    startPlayer.id,
    ...chain.map((s) => s.playerId),
  ];

  const handleUndo = useCallback(() => {
    setChain((prev) => prev.slice(0, -1));
  }, []);

  const lastPlayerId = chain.length > 0 ? chain[chain.length - 1].playerId : startPlayer.id;
  const lastPlayerName =
    chain.length > 0 ? chain[chain.length - 1].playerName : startPlayer.full_name;

  const handleValidConnection = useCallback(
    async (player: Player, teamId: number, teamName: string) => {
      const newStep: ChainStep = {
        playerId: player.id,
        playerName: player.full_name,
        playerPosition: player.primary_position,
        teamId,
        teamName,
        validated: true,
        valid: true,
      };

      let finalChain = [...chain, newStep];

      if (player.id === endPlayer.id) {
        setChain(finalChain);
        setGameComplete(true);
        setShowResults(true);
      } else {
        // Check if the newly added player is a teammate of the end player
        try {
          const res = await fetch("/api/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ player1Id: player.id, player2Id: endPlayer.id }),
          });
          const data = await res.json();

          if (data.valid) {
            const endStep: ChainStep = {
              playerId: endPlayer.id,
              playerName: endPlayer.full_name,
              playerPosition: endPlayer.primary_position,
              teamId: data.teamId,
              teamName: data.teamName,
              validated: true,
              valid: true,
            };
            finalChain = [...finalChain, endStep];
            setChain(finalChain);
            setGameComplete(true);
            setShowResults(true);
          } else {
            setChain(finalChain);
            return;
          }
        } catch {
          setChain(finalChain);
          return;
        }
      }

      // Save daily completion
      if (mode === "daily") {
        const key = date ?? new Date().toISOString().split("T")[0];
        const stats = JSON.parse(localStorage.getItem("lineuplinks-stats") || "{}");
        if (!stats[key]) {
          stats[key] = { steps: finalChain.length, par };
          localStorage.setItem("lineuplinks-stats", JSON.stringify(stats));
        }
      }
    },
    [chain, endPlayer, mode, par]
  );

  async function handleRevealPath() {
    const res = await fetch(
      `/api/solve?startId=${startPlayer.id}&endId=${endPlayer.id}`
    );
    const data = await res.json();
    setRevealedPath(data.path);
  }

  return (
    <div className="space-y-4">
      {/* Start player */}
      <div className={`border rounded-lg p-4 ${
        gameComplete
          ? "border-[var(--success)] bg-[var(--success)]/10"
          : "border-[var(--accent)] bg-[var(--accent)]/10"
      }`}>
        <div className={`text-xs mb-1 font-medium uppercase tracking-wider ${
          gameComplete ? "text-[var(--success)]" : "text-[var(--accent)]"
        }`}>
          Start
        </div>
        <div className="flex items-center gap-3">
          <PlayerHeadshot playerId={startPlayer.id} size={40} />
          <div>
            <div className="text-lg font-bold">
              {startPlayer.full_name}
              {startPlayer.primary_position && (
                <span className="ml-2 text-xs font-medium text-[var(--muted)] align-middle">{startPlayer.primary_position}</span>
              )}
            </div>
            {startPlayer.debut_year && (
              <div className="text-sm text-[var(--muted)]">
                {startPlayer.debut_year}–{startPlayer.last_year}
              </div>
            )}
          </div>
        </div>
        <PlayerTeamHistory playerId={startPlayer.id} />
      </div>

      {/* Chain steps (exclude end player — shown in the target card below) */}
      {chain.filter(s => s.playerId !== endPlayer.id).map((step, i, filtered) => (
        <div key={i}>
          <div className="flex justify-center my-1">
            <div className="w-px h-4 bg-[var(--card-border)]" />
          </div>
          <div className={`border rounded-lg p-4 ${
            gameComplete
              ? "border-[var(--success)] bg-[var(--success)]/5"
              : "border-[var(--warning)] bg-[var(--warning)]/5"
          }`}>
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--muted)] mb-1">
                Step {i + 1}: via {step.teamName}
              </div>
              {!gameComplete && i === filtered.length - 1 && (
                <button
                  onClick={handleUndo}
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  title="Remove this step"
                >
                  ✕ Undo
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <PlayerHeadshot playerId={step.playerId} size={36} />
              <div className="font-medium">
                {step.playerName}
                {step.playerPosition && (
                  <span className="ml-2 text-xs font-medium text-[var(--muted)]">{step.playerPosition}</span>
                )}
              </div>
            </div>
            <PlayerTeamHistory playerId={step.playerId} />
          </div>
        </div>
      ))}

      {/* Active step */}
      {!gameComplete && (
        <>
          <div className="flex justify-center my-1">
            <div className="w-px h-4 bg-[var(--card-border)]" />
          </div>
          <ConnectionStep
            key={chain.length}
            stepNumber={chain.length + 1}
            previousPlayerId={lastPlayerId}
            previousPlayerName={lastPlayerName}
            onValidConnection={handleValidConnection}
            existingPlayerIds={existingPlayerIds}
          />
        </>
      )}

      {/* Connector to end */}
      <div className="flex justify-center my-1">
        <div className="w-px h-4 bg-[var(--card-border)]" />
      </div>

      {/* End player */}
      <div
        className={`border rounded-lg p-4 ${
          gameComplete
            ? "border-[var(--success)] bg-[var(--success)]/10"
            : "border-[var(--accent)] bg-[var(--accent)]/10"
        }`}
      >
        <div
          className={`text-xs mb-1 font-medium uppercase tracking-wider ${
            gameComplete ? "text-[var(--success)]" : "text-[var(--accent)]"
          }`}
        >
          {gameComplete ? `Step ${chain.length}: via ${chain[chain.length - 1]?.teamName}` : "Target"}
        </div>
        <div className="flex items-center gap-3">
          <PlayerHeadshot playerId={endPlayer.id} size={40} />
          <div>
            <div className="text-lg font-bold">
              {endPlayer.full_name}
              {endPlayer.primary_position && (
                <span className="ml-2 text-xs font-medium text-[var(--muted)] align-middle">{endPlayer.primary_position}</span>
              )}
            </div>
            {endPlayer.debut_year && (
              <div className="text-sm text-[var(--muted)]">
                {endPlayer.debut_year}–{endPlayer.last_year}
              </div>
            )}
          </div>
        </div>
        <PlayerTeamHistory playerId={endPlayer.id} />
      </div>

      {/* Reveal path button */}
      {!revealedPath && (
        <div className="text-center">
          <button
            onClick={handleRevealPath}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline transition-colors"
          >
            {gameComplete ? "Show optimal path" : "Reveal optimal path"}
          </button>
        </div>
      )}

      {/* Revealed path */}
      {revealedPath && (
        <div className="border border-[var(--card-border)] rounded-lg p-4 bg-[var(--card)]">
          <div className="text-xs text-[var(--muted)] mb-2 font-medium uppercase tracking-wider">
            Optimal Path
          </div>
          {(revealedPath as { playerName: string; teamName: string }[]).map(
            (step, i) => (
              <div key={i} className="text-sm py-1">
                {i === 0 ? (
                  <span className="font-medium">{step.playerName}</span>
                ) : (
                  <span>
                    → <span className="font-medium">{step.playerName}</span>{" "}
                    <span className="text-[var(--muted)]">
                      ({step.teamName})
                    </span>
                  </span>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Results modal */}
      {showResults && (
        <ResultsModal
          steps={chain.length}
          startPlayerName={startPlayer.full_name}
          endPlayerName={endPlayer.full_name}
          chain={chain}
          onClose={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
