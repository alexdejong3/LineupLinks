"use client";

import { useState } from "react";
import PlayerSearch from "./PlayerSearch";
import type { Player } from "@/lib/types";

interface ConnectionStepProps {
  stepNumber: number;
  previousPlayerId: number;
  previousPlayerName: string;
  onValidConnection: (player: Player, teamId: number, teamName: string) => void;
  disabled?: boolean;
  existingPlayerIds?: number[];
}

export default function ConnectionStep({
  stepNumber,
  previousPlayerId,
  previousPlayerName,
  onValidConnection,
  disabled = false,
  existingPlayerIds = [],
}: ConnectionStepProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    teamName?: string;
    error?: string;
  } | null>(null);

  async function handlePlayerSelect(player: Player) {
    setSelectedPlayer(player);
    setValidationResult(null);
    setValidating(true);

    const res = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player1Id: previousPlayerId,
        player2Id: player.id,
      }),
    });
    const result = await res.json();
    setValidating(false);
    setValidationResult(result);

    if (result.valid) {
      onValidConnection(player, result.teamId, result.teamName);
    }
  }

  const isComplete = validationResult?.valid === true;

  return (
    <div
      className={`border rounded-lg p-4 ${
        isComplete
          ? "border-[var(--success)] bg-[var(--success)]/5"
          : "border-[var(--card-border)] bg-[var(--card)]"
      }`}
    >
      <div className="text-xs text-[var(--muted)] mb-2">
        Step {stepNumber}: Connected to {previousPlayerName} via...
      </div>

      {!isComplete ? (
        <div className="space-y-3">
          <PlayerSearch
            onSelect={handlePlayerSelect}
            placeholder="Search for next player..."
            disabled={disabled || validating}
            excludeIds={existingPlayerIds}
            teammateOf={previousPlayerId}
          />

          {validating && (
            <div className="text-sm text-[var(--muted)]">Checking...</div>
          )}

          {validationResult && !validationResult.valid && (
            <div className="text-sm text-[var(--error)]">
              {selectedPlayer?.full_name}: {validationResult.error}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[var(--success)] text-lg">&#10003;</span>
          <span className="font-medium">{selectedPlayer?.full_name}</span>
          <span className="text-[var(--muted)] text-sm">
            ({validationResult.teamName})
          </span>
        </div>
      )}
    </div>
  );
}
