import Link from "next/link";

export function TrustBanner() {
  return (
    <section className="trust-banner" aria-label="Trust guidance">
      <div className="trust-banner-summary">
        <div className="trust-banner-summary-copy">
          <span className="trust-banner-kicker">Review posture</span>
          <p className="trust-banner-headline">
            Source-backed guidance, explicit confidence, and human sign-off still required.
          </p>
        </div>
        <div className="trust-banner-action">
          <Link href="/how-to-use" className="muted-link">
            Responsible use
          </Link>
        </div>
      </div>
      <details className="trust-banner-details">
        <summary>See the guardrails behind this review experience</summary>
        <div className="trust-banner-grid">
          <div className="trust-banner-item">
            <strong>Source</strong>
            <span>Built from Azure review checklist content with preserved traceability.</span>
          </div>
          <div className="trust-banner-item">
            <strong>Public data states</strong>
            <div className="trust-banner-legend">
              <span className="data-source-status-pill data-source-status-pill-live">Live refresh</span>
              <span className="data-source-status-pill data-source-status-pill-cache">Scheduled cache</span>
              <span className="data-source-status-pill data-source-status-pill-fallback">Fallback cache</span>
            </div>
            <span>
              Service pricing and regional-fit panels now show whether the backend used a fresh
              Microsoft refresh, the scheduled cache, or a fallback cache after a refresh failure.
            </span>
          </div>
          <div className="trust-banner-item">
            <strong>Default posture</strong>
            <span>
              GA-ready families first. Preview and deprecated content require explicit
              review judgment.
            </span>
          </div>
          <div className="trust-banner-item">
            <strong>Limitation</strong>
            <span>This supports review preparation. It does not replace architecture sign-off.</span>
          </div>
        </div>
      </details>
    </section>
  );
}
