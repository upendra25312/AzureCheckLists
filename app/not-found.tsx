import Link from "next/link";

export default function NotFound() {
  return (
    <main className="empty-state-page">
      <div className="empty-state-card">
        <p className="eyebrow">Not found</p>
        <h1>The requested checklist view is not available.</h1>
        <p>
          The route may no longer exist in the generated static export, or the
          source checklist set changed during the last build.
        </p>
        <Link href="/" className="primary-link">
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
