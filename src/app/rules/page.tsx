export default function RulesPage() {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1">How to Play</h1>
        <p className="text-sm text-[var(--muted)]">
          Connect MLB players through chains of teammates.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-4">
          <h2 className="font-semibold mb-2">The Goal</h2>
          <p className="text-sm text-[var(--muted)]">
            Connect two baseball players through a chain of teammates. Each link in
            your chain must be a player who shared a roster with the previous
            player during the same season.
          </p>
        </section>

        <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-4">
          <h2 className="font-semibold mb-2">What Counts as a Connection</h2>
          <p className="text-sm text-[var(--muted)]">
            Two players are connected if they both appeared on the same team
            during the same season. They don&apos;t need to have played in the same
            game &mdash; just being on the roster together is enough.
          </p>
        </section>

        <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-4">
          <h2 className="font-semibold mb-2">Players Included</h2>
          <ul className="text-sm text-[var(--muted)] space-y-2">
            <li>
              The game includes all players who appeared on a Major League
              roster from <span className="text-[var(--foreground)] font-medium">1970 to 2025</span>.
            </li>
            <li>
              In <span className="text-[var(--foreground)] font-medium">Daily</span> mode,
              puzzles feature notable players &mdash; those with at least one
              All-Star selection, or those active since 2023 with careers
              spanning 6+ years.
            </li>
            <li>
              In <span className="text-[var(--foreground)] font-medium">Free Play</span> mode,
              all players in the database are available.
            </li>
          </ul>
        </section>

        <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-4">
          <h2 className="font-semibold mb-2">Building Your Chain</h2>
          <ol className="text-sm text-[var(--muted)] list-decimal list-inside space-y-2">
            <li>You start with a given player.</li>
            <li>Search for the next player &mdash; only teammates of your current player will appear in the results.</li>
            <li>Pick the team they shared, confirming the connection.</li>
            <li>Repeat from your new player until you reach the target.</li>
          </ol>
        </section>

        <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-4">
          <h2 className="font-semibold mb-2">Game Modes</h2>
          <ul className="text-sm text-[var(--muted)] space-y-2">
            <li>
              <span className="text-[var(--foreground)] font-medium">Daily</span>{" "}
              &mdash; A new puzzle every day, the same for everyone. Your results
              are saved locally.
            </li>
            <li>
              <span className="text-[var(--foreground)] font-medium">Free Play</span>{" "}
              &mdash; Pick any two players and find the connection between them.
            </li>
          </ul>
        </section>

        <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-4">
          <h2 className="font-semibold mb-2">Tips</h2>
          <ul className="text-sm text-[var(--muted)] list-disc list-inside space-y-2">
            <li>
              Journeyman players who played for many teams are great connectors.
            </li>
            <li>
              Think about era &mdash; players active in the same decade are more
              likely to share a teammate.
            </li>
            <li>
              Large-market teams with high roster turnover (like the Yankees or
              Dodgers) are useful hubs.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
