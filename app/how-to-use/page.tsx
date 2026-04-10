import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Use",
  description:
    "Use the review board to prepare architecture discussions, not to issue approval or replace accountable sign-off."
};

export default function HowToUsePage() {
  return (
    <main className="section-stack">
      <section className="review-command-panel">
        <div className="detail-command-grid">
          <div className="detail-command-copy">
            <div>
              <p className="eyebrow">How this tool should be used</p>
              <h1 className="review-command-title">Use the review board to prepare decisions, not to issue approval.</h1>
              <p className="review-command-summary">
                The review board turns Azure checklist content into a clearer decision-support surface.
                It helps teams structure review discussions, preserve source traceability, and show where
                architectural judgment is still required. It does not certify architectures, waive
                governance, or substitute for accountable sign-off.
              </p>
            </div>
            <div className="button-row">
              <Link href="/" className="primary-button">
                Back to overview
              </Link>
              <Link href="/explorer" className="secondary-button">
                Open explorer
              </Link>
            </div>
          </div>

          <section className="leadership-brief detail-command-sidecar">
            <p className="eyebrow">Responsible use</p>
            <h2 className="leadership-title">Source traceability stays visible so recommendations keep their context.</h2>
            <p>
              Family and service views retain source lineage so reviewers can see why a recommendation
              should carry weight before it enters a decision pack.
            </p>
          </section>
        </div>
      </section>

      <section className="surface-panel board-stage-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Plain-language guide</p>
            <h2 className="section-title">Understand the core terms in one minute.</h2>
            <p className="section-copy">
              These definitions make the rest of the product easier to understand, especially for
              leadership, pre-sales, and first-time reviewers.
            </p>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card">
            <h3>GA-ready baseline</h3>
            <p>
              Guidance mature enough to lead an executive or architecture review by default. This
              is the safest starting point for decision packs.
            </p>
          </article>
          <article className="future-card">
            <h3>Checklist family</h3>
            <p>
              A source checklist grouped into one reviewable unit. Family pages show how much
              confidence that source deserves and how many findings it contributes.
            </p>
          </article>
          <article className="future-card">
            <h3>Normalized item</h3>
            <p>
              A source recommendation reshaped into a common structure for filtering, comparison,
              and export. Normalization improves usability, but the original source still carries authority.
            </p>
          </article>
          <article className="future-card">
            <h3>Confidence level</h3>
            <p>
              A signal for how much default weight a family should carry. High-confidence guidance
              can anchor a review pack; lower-confidence guidance should inform judgment, not replace it.
            </p>
          </article>
        </div>
      </section>

      <section className="surface-panel board-stage-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Responsible use</p>
            <h2 className="section-title">Interpret severity, confidence, and normalization carefully.</h2>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card">
            <h3>Normalization</h3>
            <p>
              A normalized item is easier to search and compare, but it should still be read with
              awareness of the original checklist source behind it.
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
              GA-ready families can anchor executive and architecture review packs. Preview and
              mixed-confidence families should enrich expert analysis, not define leadership decisions by default.
            </p>
          </article>
        </div>
      </section>

      <section className="surface-panel board-stage-panel">
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
              A static-first review product for exploring checklist families, separating mature
              and unstable guidance, and improving review preparation.
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
