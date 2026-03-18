"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--card-border)] bg-[var(--card)]">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          LineupLinks
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/"
            className={`hover:text-white transition-colors ${
              pathname === "/" ? "text-white font-medium" : "text-[var(--muted)]"
            }`}
          >
            Daily
          </Link>
          <Link
            href="/free-play"
            className={`hover:text-white transition-colors ${
              pathname === "/free-play" ? "text-white font-medium" : "text-[var(--muted)]"
            }`}
          >
            Free Play
          </Link>
          <Link
            href="/rules"
            className={`hover:text-white transition-colors ${
              pathname === "/rules" ? "text-white font-medium" : "text-[var(--muted)]"
            }`}
          >
            Rules
          </Link>
        </nav>
      </div>
    </header>
  );
}
