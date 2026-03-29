export function TrustBanner() {
  return (
    <section className="trust-banner" aria-label="Trust guidance">
      <div className="trust-banner-grid">
        <div>
          <strong>Source</strong>
          <span>Compiled from Azure/review-checklists with preserved source traceability.</span>
        </div>
        <div>
          <strong>Default posture</strong>
          <span>GA-ready families first. Preview, mixed, and deprecated content require extra judgment.</span>
        </div>
        <div>
          <strong>Use responsibly</strong>
          <span>This is a review accelerator and decision-support tool, not architecture sign-off.</span>
        </div>
      </div>
    </section>
  );
}
