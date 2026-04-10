import Link from "next/link";

export default function ArbLandingPage() {
  return (
    <main>
      <section>
        <h1>Architecture Review Board</h1>
        <p>
          This scaffold extends Azure Checklists with an AI-assisted review workflow for
          uploaded SOW and design packages.
        </p>
        <ul>
          <li>
            <Link href="/arb/demo-review/upload">Open demo review upload step</Link>
          </li>
          <li>
            <Link href="/arb/demo-review/findings">Open demo review findings step</Link>
          </li>
          <li>
            <Link href="/arb/demo-review/decision">Open demo review decision step</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
