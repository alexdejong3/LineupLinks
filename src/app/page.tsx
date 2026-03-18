"use client";

import { useEffect, useState } from "react";
import ChainBuilder from "@/components/ChainBuilder";
import type { DailyChallenge } from "@/lib/types";

export default function DailyPage() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/daily")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load daily challenge");
        return r.json();
      })
      .then((data) => {
        setChallenge(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-[var(--muted)]">Loading today&apos;s challenge...</div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="text-center py-20">
        <div className="text-[var(--error)]">{error ?? "Failed to load challenge"}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1">Daily Challenge</h1>
        <p className="text-[var(--muted)] text-sm">{challenge.date}</p>
        <p className="text-sm mt-2">
          Connect these two players through shared team rosters.
        </p>
      </div>

      <ChainBuilder
        startPlayer={challenge.startPlayer}
        endPlayer={challenge.endPlayer}
        par={challenge.par}
        mode="daily"
        date={challenge.date}
      />
    </div>
  );
}
