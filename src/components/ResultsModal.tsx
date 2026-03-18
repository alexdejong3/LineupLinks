"use client";

import type { ChainStep } from "@/lib/types";

interface ResultsModalProps {
  steps: number;
  startPlayerName: string;
  endPlayerName: string;
  chain: ChainStep[];
  onClose: () => void;
}

export default function ResultsModal({
  steps,
  startPlayerName,
  endPlayerName,
  chain,
  onClose,
}: ResultsModalProps) {
  function handleShare() {
    const today = new Date().toISOString().split("T")[0];
    const text = [
      `LineupLinks ${today}`,
      `${startPlayerName} → ${endPlayerName}`,
      `${steps} step${steps !== 1 ? "s" : ""}`,
      "",
      "https://lineuplinks.app",
    ].join("\n");

    navigator.clipboard.writeText(text);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 max-w-sm w-full space-y-4">
        <h2 className="text-xl font-bold text-center">Complete!</h2>

        <div className="text-center space-y-1">
          <div className="text-3xl font-bold">
            {steps} step{steps !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="border-t border-[var(--card-border)] pt-4 space-y-1">
          <div className="text-sm text-[var(--muted)]">Your path:</div>
          <div className="text-sm">
            <span className="font-medium">{startPlayerName}</span>
            {chain.map((step, i) => (
              <span key={i}>
                {" → "}
                <span className="font-medium">{step.playerName}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg
                       text-sm font-medium transition-colors"
          >
            Copy Results
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[var(--card-border)] hover:bg-[var(--card-border)] rounded-lg
                       text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
