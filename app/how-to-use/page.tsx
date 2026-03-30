import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How To Use",
  description:
    "Use the review board to prepare architecture discussions, not to issue approval or replace accountable sign-off."
};

export default function HowToUsePage() {
  return (
    <main className="section-stack">
      <section className="surface-panel editorial-section">
        <p className="eyebrow">How this tool should be used</p>
        <h2 className="section-title">Use the review board to prepare reviews, not to issue approval.</h2>
        <p className="section-copy">
          The review board turns Azure review checklist content into a more readable, maturity-aware
          review experience. It helps teams structure review discussions, preserve source
          traceability, and identify where deeper architectural judgment is still required.
          It does not certify architectures, waive governance, or substitute for accountable
          review decisions.
        </p>
        <p className="microcopy">
          Source traceability remains visible within the rendered family and service views. Public
          users should not need to leave the product and inspect the upstream repository directly.
        </p>
        <div className="button-row">
          <Link href="/" className="primary-button">
            Back to overview
          </Link>
          <Link href="/explorer" className="secondary-button">
            Open explorer
          </Link>
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Responsible use</p>
            <h2 className="section-title">Interpret normalized items, severity, and confidence carefully.</h2>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card">
            <h3>Normalization</h3>
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
            <h3>Confidence level</h3>
            <p>
              GA-ready families can anchor executive and architecture review packs. Preview
              and mixed-confidence families should enrich expert analysis, not define leadership decisions by default.
            </p>
          </article>
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Limitations</p>
            <h2 className="section-title">Be explicit about what the platform can and cannot claim.</h2>
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
