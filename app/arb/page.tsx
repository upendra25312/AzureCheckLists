import Link from "next/link";
import { ArbReviewLibrary } from "@/components/arb/review-library";

export default function ArbLandingPage() {
  return (
    <main className="arb-page-stack">
      <section className="review-command-panel">
        <div className="review-command-copy">
          <p className="header-badge">Review Workspace</p>
          <h1 className="review-command-title">Start an evidence-backed architecture review</h1>
          <p className="review-command-summary">
            The new Architecture Review Board workflow starts with uploaded project evidence,
            then moves through extracted requirements, mapped design proof, findings, weighted
            score, and an explicit human decision.
          </p>
        </div>

        <div className="review-command-metrics">
          <article className="review-command-metric">
            <span>1. Upload</span>
            <strong>Stage review evidence</strong>
            <p>Collect the SOW, design pack, diagrams, and cost/support inputs before review begins.</p>
          </article>
          <article className="review-command-metric">
            <span>2. Extract</span>
            <strong>Confirm requirements</strong>
            <p>Review what the platform inferred and correct weak or ambiguous extractions early.</p>
          </article>
          <article className="review-command-metric">
            <span>3. Review</span>
            <strong>Work from findings</strong>
            <p>Use blockers, owners, and missing evidence as the operating center of the review.</p>
          </article>
          <article className="review-command-metric">
            <span>4. Decide</span>
            <strong>Keep humans in control</strong>
            <p>AI recommends the posture. Reviewers own conditions, rationale, and final sign-off.</p>
          </article>
        </div>

        <div className="review-command-band">
          <div className="review-command-band-actions">
            <Link href="/decision-center" className="primary-link review-command-button">
              Open Decision Center
            </Link>
            <Link href="/services" className="secondary-button review-command-secondary">
              Open Knowledge Hub
            </Link>
          </div>
        </div>
      </section>

      <section className="review-stage-preview-grid arb-stage-grid">
        <article className="future-card review-stage-preview-card">
          <div className="review-stage-preview-head">
            <div>
              <h2>Upload-first intake</h2>
              <p>Package readiness</p>
            </div>
            <div className="board-card-icon-pill" aria-hidden="true">
              01
            </div>
          </div>
          <p className="section-copy">
            Start by staging the actual project material, not by picking Azure services first.
            That keeps extraction and findings grounded in source evidence.
          </p>
        </article>
        <article className="future-card review-stage-preview-card">
          <div className="review-stage-preview-head">
            <div>
              <h2>Findings-first operations</h2>
              <p>Action workflow</p>
            </div>
            <div className="board-card-icon-pill" aria-hidden="true">
              02
            </div>
          </div>
          <p className="section-copy">
            The review should become operational once blockers, missing evidence, owners, and
            remediation actions are visible in one working surface.
          </p>
        </article>
        <article className="future-card review-stage-preview-card">
          <div className="review-stage-preview-head">
            <div>
              <h2>Decision-aware closeout</h2>
              <p>Human sign-off</p>
            </div>
            <div className="board-card-icon-pill" aria-hidden="true">
              03
            </div>
          </div>
          <p className="section-copy">
            Scorecard and decision state stay traceable so final approval is explicit, auditable,
            and clearly separated from AI recommendation.
          </p>
        </article>
      </section>

      <ArbReviewLibrary />
    </main>
  );
}
