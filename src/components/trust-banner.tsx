import Link from "next/link";

export function TrustBanner() {
  return (
    <section className="trust-banner" aria-label="Trust guidance">
      <div className="trust-banner-grid">
        <div className="trust-banner-item">
          <strong>Source</strong>
          <span>Built from Azure review checklist content with preserved traceability.</span>
        </div>
        <div className="trust-banner-item">
          <strong>Default posture</strong>
          <span>GA-ready families first. Preview and deprecated content require explicit review judgment.</span>
        </div>
        <div className="trust-banner-item">
          <strong>Limitation</strong>
          <span>This supports review preparation. It does not replace architecture sign-off.</span>
        </div>
        <div className="trust-banner-item trust-banner-action">
          <Link href="/how-to-use" className="muted-link">
            Review responsible use
          </Link>
        </div>
      </div>
    </section>
  );
}
