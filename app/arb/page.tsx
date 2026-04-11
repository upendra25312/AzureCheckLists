import Link from "next/link";
import { ArbReviewLibrary } from "@/components/arb/review-library";

export default function ArbLandingPage() {
  return (
    <main className="arb-page-stack">
      <section className="review-command-panel">
        <div className="review-command-copy">
          <p className="header-badge">ARB-grade review mode</p>
          <h1 className="review-command-title">Use the advanced review flow when the design needs uploaded evidence and explicit reviewer sign-off.</h1>
          <p className="review-command-summary">
            This mode sits inside Azure Review Assistant as the stricter path for review boards,
            uploaded project material, and decision-ready evidence handling.
          </p>
        </div>

        <div className="arb-flow-band">
          <article className="review-command-metric arb-flow-node">
            <span className="arb-flow-node-step">01</span>
            <strong>Upload review material</strong>
            <p>Bring the design pack, diagrams, and supporting material into the review first.</p>
          </article>
          <span className="arb-flow-arrow" aria-hidden="true">→</span>
          <article className="review-command-metric arb-flow-node">
            <span className="arb-flow-node-step">02</span>
            <strong>Confirm requirements and findings</strong>
            <p>Use the uploaded evidence to tighten scope, findings, and reviewer rationale.</p>
          </article>
          <span className="arb-flow-arrow" aria-hidden="true">→</span>
          <article className="review-command-metric arb-flow-node">
            <span className="arb-flow-node-step">03</span>
            <strong>Prepare the decision pack</strong>
            <p>Keep blockers, owners, evidence gaps, and score visible in one workflow.</p>
          </article>
          <span className="arb-flow-arrow" aria-hidden="true">→</span>
          <article className="review-command-metric arb-flow-node">
            <span className="arb-flow-node-step">04</span>
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
              Open services explorer
            </Link>
          </div>
        </div>
      </section>

      <section className="review-stage-preview-grid arb-stage-grid">
        <article className="future-card review-stage-preview-card">
          <div className="review-stage-preview-head">
            <div>
              <h2>Evidence-first intake</h2>
              <p>Advanced mode</p>
            </div>
            <div className="board-card-icon-pill" aria-hidden="true">
              01
            </div>
          </div>
          <p className="section-copy">
            Start with the real project material so the stricter review remains grounded in evidence.
          </p>
        </article>
        <article className="future-card review-stage-preview-card">
          <div className="review-stage-preview-head">
            <div>
              <h2>Reviewer-driven workflow</h2>
              <p>Evidence and findings</p>
            </div>
            <div className="board-card-icon-pill" aria-hidden="true">
              02
            </div>
          </div>
          <p className="section-copy">
            Use findings, blockers, and reviewer-owned actions as the operating center of the advanced flow.
          </p>
        </article>
        <article className="future-card review-stage-preview-card">
          <div className="review-stage-preview-head">
            <div>
              <h2>Decision-ready closeout</h2>
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
