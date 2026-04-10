import Link from "next/link";

export default function NotFound() {
  return (
    <main className="empty-state-page">
      <section className="review-command-panel" style={{ width: "min(100%, 720px)" }}>
        <div className="review-command-copy">
          <p className="eyebrow">Not found</p>
          <h1 className="review-command-title">The requested checklist view is not available.</h1>
          <p className="review-command-summary">
            The route may no longer exist in the generated static export, or the source checklist
            set changed during the last build.
          </p>
        </div>
        <div className="review-command-band">
          <div className="review-command-band-actions">
            <Link href="/" className="home-init-button review-command-button">
              Return to review board
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
