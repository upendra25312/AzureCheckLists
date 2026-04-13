import Link from "next/link";
import { ArbReviewLibrary } from "@/components/arb/review-library";

export default function DecisionCenterPage() {
  return (
    <main className="arb-page-stack">
      <section className="review-command-panel">
        <div className="review-command-copy">
          <p className="header-badge">Decision Center</p>
          <h1 className="review-command-title">Review score, conditions, and human sign-off in one place.</h1>
          <p className="review-command-summary">
            Decision Center is the closeout surface for advanced reviews. It keeps weighted score,
            blockers, evidence gaps, and the human decision in one reviewer-owned queue.
          </p>
        </div>

        <div className="review-command-metrics">
          <article className="review-command-metric">
            <span>Recommendation</span>
            <strong>Derived recommendation</strong>
            <p>Keep the derived recommendation visible, but separate from the reviewer-owned decision.</p>
          </article>
          <article className="review-command-metric">
            <span>Scorecard</span>
            <strong>Weighted rationale</strong>
            <p>Every score should drill back to the evidence, findings, and grounded guidance behind it.</p>
          </article>
          <article className="review-command-metric">
            <span>Conditions</span>
            <strong>Must-fix tracking</strong>
            <p>Open actions and reviewer verification requirements stay visible before sign-off.</p>
          </article>
          <article className="review-command-metric">
            <span>Outcome</span>
            <strong>Human-owned final decision</strong>
            <p>Recorded decisions capture rationale, timing, and explicit human accountability.</p>
          </article>
        </div>

        <div className="review-command-band">
          <div className="review-command-band-actions">
            <Link href="/arb" className="primary-link review-command-button">
              Back to ARB-grade review mode
            </Link>
            <Link href="/services" className="secondary-button review-command-secondary">
              Open services explorer
            </Link>
          </div>
        </div>
      </section>

      <ArbReviewLibrary focus="decision" />
    </main>
  );
}
