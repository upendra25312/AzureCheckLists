import Link from "next/link";

export default function HowToUsePage() {
  return (
    <main className="section-stack">
      <section className="surface-panel">
        <p className="eyebrow">How this tool should be used</p>
        <h2 className="section-title">Use it to accelerate architecture reviews, not to replace sign-off.</h2>
        <p className="section-copy">
          This dashboard compiles Azure review checklist content into a more usable
          decision-support experience. It helps teams structure discussions, highlight
          likely risk areas, and preserve source traceability. It does not certify
          architectures, waive governance, or substitute for accountable review decisions.
        </p>
        <div className="button-row">
          <Link href="/" className="primary-button">
            Return to dashboard
          </Link>
          <a
            href="https://github.com/Azure/review-checklists"
            target="_blank"
            rel="noreferrer"
            className="secondary-button"
          >
            Open source repository
          </a>
        </div>
      </section>

      <section className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Responsible use</p>
            <h2 className="section-title">What normalized items mean and how severity should be interpreted.</h2>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card">
            <h3>Normalized item</h3>
            <p>
              A normalized item is a checklist recommendation that has been reshaped into a
              common structure for filtering, comparison, and export. Normalization improves
              usability, but it does not change the authority of the original source.
            </p>
          </article>
          <article className="future-card">
            <h3>Severity</h3>
            <p>
              Severity is an input to prioritization, not a standalone business decision.
              Use it with architectural context, service maturity, control dependencies, and
              the source family’s confidence level.
            </p>
          </article>
          <article className="future-card">
            <h3>Confidence</h3>
            <p>
              GA-ready families can anchor executive and architecture review packs. Preview
              and mixed-confidence families should enrich expert analysis, not dominate leadership decisions.
            </p>
          </article>
        </div>
      </section>

      <section className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Limitations and caveats</p>
            <h2 className="section-title">Be explicit about what the platform cannot claim.</h2>
          </div>
        </div>
        <div className="bar-list">
          <article className="trace-card">
            <strong>What this is</strong>
            <p>
              A static-first review accelerator for exploring checklist families, separating
              mature and unstable guidance, and building better-informed review conversations.
            </p>
          </article>
          <article className="trace-card">
            <strong>What this is not</strong>
            <p>
              Not an official Microsoft approval system, not a compliance platform, not a
              backend workflow engine, and not a replacement for architecture sign-off.
            </p>
          </article>
          <article className="trace-card">
            <strong>When to validate manually</strong>
            <p>
              Validate manually whenever content is preview, deprecated, sparse, conflicting,
              or missing service-specific context for the workload under review.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
