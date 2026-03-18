"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PlayerHeadshot from "./PlayerHeadshot";
import type { Player } from "@/lib/types";

interface PlayerSearchProps {
  onSelect: (player: Player) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: number[];
  teammateOf?: number;
}

export default function PlayerSearch({
  onSelect,
  placeholder = "Search for a player...",
  disabled = false,
  excludeIds = [],
  teammateOf,
}: PlayerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      let url = `/api/players/search?q=${encodeURIComponent(q)}`;
      if (teammateOf) url += `&teammateOf=${teammateOf}`;
      const res = await fetch(url);
      const data: Player[] = await res.json();
      setResults(data.filter((p) => !excludeIds.includes(p.id)));
      setHighlightIndex(0);
    },
    [excludeIds, teammateOf]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(player: Player) {
    onSelect(player);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--card-border)] rounded-lg
                   text-[var(--foreground)] placeholder-[var(--muted)]
                   focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
      />
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--card-border)] rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((player, i) => (
            <li
              key={player.id}
              onClick={() => handleSelect(player)}
              className="px-3 py-2 cursor-pointer text-sm flex items-center gap-2 hover:bg-[var(--card-border)]"
            >
              <PlayerHeadshot playerId={player.id} size={28} />
              <div>
                <span className="font-medium">{player.full_name}</span>
                {player.primary_position && (
                  <span className="text-[var(--muted)] ml-1.5 text-xs font-medium">{player.primary_position}</span>
                )}
                {player.debut_year && player.last_year && (
                  <span className="text-[var(--muted)] ml-2 text-xs">
                    ({player.debut_year}–{player.last_year})
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
