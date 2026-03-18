"use client";

import { useEffect, useState } from "react";
import type { PlayerTeamStint } from "@/lib/types";

export default function PlayerTeamHistory({ playerId }: { playerId: number }) {
  const [stints, setStints] = useState<PlayerTeamStint[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/players/teams?playerId=${playerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStints(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [playerId]);

  if (!stints || stints.length === 0) return null;

  return (
    <div className="text-xs text-[var(--muted)]">
      {stints.map((s, i) => (
        <span key={`${s.team_id}-${s.start_year}`}>
          {i > 0 && " · "}
          {s.abbreviation} ({s.start_year === s.end_year ? s.start_year : `${s.start_year}–${s.end_year}`})
        </span>
      ))}
    </div>
  );
}
