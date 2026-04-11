"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { createArbReview, listArbReviews } from "@/arb/api";
import type { ArbReviewSummary } from "@/arb/types";
import { buildLoginUrl, fetchClientPrincipal } from "@/lib/review-cloud";
import type { StaticWebAppClientPrincipal } from "@/types";

type ArbReviewLibraryFocus = "workspace" | "decision";

function formatTimestamp(value: string | undefined) {
  if (!value) {
    return "Awaiting first save";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getPrimaryHref(review: ArbReviewSummary, focus: ArbReviewLibraryFocus): Route {
  if (focus === "decision") {
    return `/arb/${review.reviewId}/decision` as Route;
  }

  return review.workflowState === "Draft"
    ? (`/arb/${review.reviewId}/upload` as Route)
    : (`/arb/${review.reviewId}` as Route);
}

function getPrimaryLabel(review: ArbReviewSummary, focus: ArbReviewLibraryFocus) {
  if (focus === "decision") {
    return review.finalDecision ? "Review decision" : "Open decision";
  }

  return review.workflowState === "Draft" ? "Continue upload" : "Open workspace";
}

export function ArbReviewLibrary(props: { focus?: ArbReviewLibraryFocus }) {
  const { focus = "workspace" } = props;
  const [principal, setPrincipal] = useState<StaticWebAppClientPrincipal | null>(null);
  const [reviews, setReviews] = useState<ArbReviewSummary[]>([]);
  const [projectName, setProjectName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextPrincipal = await fetchClientPrincipal();

        if (!active) {
          return;
        }

        setPrincipal(nextPrincipal);

        if (!nextPrincipal) {
          setLoading(false);
          return;
        }

        const payload = await listArbReviews();

        if (!active) {
          return;
        }

        setReviews(payload.reviews);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load ARB reviews.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredReviews = useMemo(() => {
    if (focus === "decision") {
      return [...reviews].sort((left, right) => {
        const leftDecisionWeight = left.finalDecision ? 1 : 0;
        const rightDecisionWeight = right.finalDecision ? 1 : 0;

        if (leftDecisionWeight !== rightDecisionWeight) {
          return leftDecisionWeight - rightDecisionWeight;
        }

        return (right.overallScore ?? -1) - (left.overallScore ?? -1);
      });
    }

    return reviews;
  }, [focus, reviews]);

  const queueMetrics = useMemo(() => {
    const activeCount = reviews.filter((review) => !review.finalDecision).length;
    const decisionReadyCount = reviews.filter(
      (review) =>
        review.workflowState === "Decision Recorded" ||
        review.workflowState === "Approved" ||
        review.workflowState === "Approved with Conditions" ||
        review.workflowState === "Needs Improvement" ||
        review.overallScore !== null
    ).length;
    const approvedCount = reviews.filter((review) => review.finalDecision?.includes("Approved")).length;
    const evidenceGapCount = reviews.filter(
      (review) => review.evidenceReadinessState !== "Ready for Review"
    ).length;

    return {
      activeCount,
      decisionReadyCount,
      approvedCount,
      evidenceGapCount
    };
  }, [reviews]);

  async function handleCreateReview() {
    try {
      setSaving(true);
      setError(null);

      const review = await createArbReview({
        projectName,
        customerName
      });

      window.location.href = `/arb/${encodeURIComponent(review.reviewId)}/upload`;
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create ARB review.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="surface-panel arb-library-stack">
        <p className="section-copy">Loading ARB review library...</p>
      </section>
    );
  }

  if (!principal) {
    return (
      <section className="surface-panel arb-library-stack">
        <div className="board-card-head">
          <div className="board-card-head-copy">
            <p className="board-card-subtitle">
              {focus === "decision" ? "ARB-grade review decision queue" : "ARB-grade review mode"}
            </p>
            <h2 className="section-title">
              {focus === "decision"
                ? "Sign in to see decision-ready reviews, scorecards, and human sign-off history."
                : "Sign in to use the advanced review flow with uploaded evidence and stricter reviewer steps."}
            </h2>
          </div>
        </div>
        <div className="arb-signin-grid">
          <article className="future-card">
            <h3>Advanced mode</h3>
            <p className="section-copy">
              ARB-grade review mode adds uploaded evidence, stricter reviewer checkpoints, and
              decision-ready workflow steps inside the same product.
            </p>
            <a href={buildLoginUrl("aad")} className="primary-link">
              Sign in with Microsoft
            </a>
          </article>
          <article className="trace-card">
            <h3>Start with the main review flow</h3>
            <p className="section-copy">
              If you do not need uploaded evidence yet, begin with the standard review workspace and
              step up later only when the review needs ARB-grade rigor.
            </p>
            <Link href="/review-package" className="secondary-button">
              Open standard review
            </Link>
          </article>
        </div>
      </section>
    );
  }

  return (
    <div className="arb-library-stack">
      <section className="review-command-panel library-command-panel">
        <div className="detail-command-grid">
          <div className="detail-command-copy">
            <p className="header-badge">
              {focus === "decision" ? "Decision queue" : "Review library"}
            </p>
            <h2 className="section-title">
              {focus === "decision"
                ? "Open the scorecard and decision steps that need reviewer sign-off."
                : "Create a new ARB review or resume an upload-first review already in progress."}
            </h2>
            <p className="section-copy">
              {focus === "decision"
                ? "Decision Center keeps the weighted score, recommendation, open blockers, and final reviewer outcome in one operating queue."
                : "The Review Workspace starts with evidence intake, then moves through requirements, findings, scorecard, and final decision."}
            </p>

            <div className="arb-form-grid">
              <label className="filter-field">
                <span>Project name</span>
                <input
                  className="field-input"
                  aria-label="Project name"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Contoso landing zone modernization"
                />
              </label>
              <label className="filter-field">
                <span>Customer name</span>
                <input
                  className="field-input"
                  aria-label="Customer name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Contoso"
                />
              </label>
            </div>

            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleCreateReview()}
                disabled={saving || !projectName.trim()}
              >
                {saving ? "Creating review..." : "Create ARB review"}
              </button>
              <Link href="/review-package" className="secondary-button">
                Open standard review
              </Link>
            </div>

            {error ? <p className="microcopy">{error}</p> : null}
          </div>

          <aside className="detail-command-sidecar future-card arb-user-card">
            <p className="board-card-subtitle">Signed in</p>
            <strong>{principal.userDetails}</strong>
            <p className="section-copy">
              Reviews persist to your account. Use this queue to keep upload, findings, score,
              and decision work connected.
            </p>
          </aside>
        </div>

        <div className="review-command-metrics">
          <article className="review-command-metric">
            <span>Active reviews</span>
            <strong>{queueMetrics.activeCount}</strong>
            <p>Reviews still moving through upload, findings, or decision preparation.</p>
          </article>
          <article className="review-command-metric">
            <span>Decision-ready</span>
            <strong>{queueMetrics.decisionReadyCount}</strong>
            <p>Reviews with score or decision posture ready for reviewer attention.</p>
          </article>
          <article className="review-command-metric">
            <span>Approved posture</span>
            <strong>{queueMetrics.approvedCount}</strong>
            <p>Reviews already carrying an approved or approved-with-conditions outcome.</p>
          </article>
          <article className="review-command-metric">
            <span>Evidence gaps</span>
            <strong>{queueMetrics.evidenceGapCount}</strong>
            <p>Reviews that still need stronger evidence before final sign-off.</p>
          </article>
        </div>
      </section>

      <div className="library-state-grid">
        <article className="surface-panel library-state-card">
          <p className="board-card-subtitle">Queue focus</p>
          <h3>{focus === "decision" ? "Decision Center" : "Review Workspace"}</h3>
          <p className="section-copy">
            {focus === "decision"
              ? "Use this view when you need score visibility, decision traceability, and reviewer-owned outcomes."
              : "Use this view when you need to start from source evidence and move steadily toward findings and score."}
          </p>
        </article>
        <article className="surface-panel library-state-card">
          <p className="board-card-subtitle">Human sign-off</p>
          <h3>AI recommends. Humans decide.</h3>
          <p className="section-copy">
            Findings and score stay assistive. Decision state, conditions, and final approval
            remain explicit reviewer actions.
          </p>
        </article>
      </div>

      {filteredReviews.length === 0 ? (
        <section className="empty-state-card">
          <h2>No saved ARB reviews yet</h2>
          <p className="empty-note">
            Create your first ARB review above when the work needs uploaded evidence and stricter
            reviewer sign-off.
          </p>
        </section>
      ) : (
        <div className="library-review-grid">
          {filteredReviews.map((review) => (
            <article key={`${review.reviewId}-${review.createdByUserId ?? "user"}`} className="surface-panel library-review-card">
              <div className="review-stage-preview-head">
                <div>
                  <p className="board-card-subtitle">
                    {review.customerName || "Customer pending"} · {review.reviewId}
                  </p>
                  <h3 className="section-title arb-review-card-title">{review.projectName}</h3>
                </div>
                <div className="board-card-icon-pill" aria-hidden="true">
                  ARB
                </div>
              </div>

              <div className="board-summary-row">
                <span className="pill">Workflow: {review.workflowState}</span>
                <span className="pill">Evidence: {review.evidenceReadinessState}</span>
                <span className="pill">
                  Decision: {review.finalDecision ?? review.recommendation}
                </span>
              </div>

              <div className="library-review-stats">
                <article className="library-review-stat">
                  <span>Score</span>
                  <strong>{review.overallScore ?? "Pending"}</strong>
                </article>
                <article className="library-review-stat">
                  <span>Reviewer</span>
                  <strong>{review.assignedReviewer ?? "Unassigned"}</strong>
                </article>
                <article className="library-review-stat">
                  <span>Updated</span>
                  <strong>{formatTimestamp(review.lastUpdated)}</strong>
                </article>
              </div>

              <div className="button-row arb-review-actions">
                <Link href={getPrimaryHref(review, focus)} className="primary-link">
                  {getPrimaryLabel(review, focus)}
                </Link>
                <Link href={`/arb/${review.reviewId}/findings` as Route} className="secondary-button">
                  Findings
                </Link>
                <Link href={`/arb/${review.reviewId}/scorecard` as Route} className="ghost-button">
                  Scorecard
                </Link>
                <Link href={`/arb/${review.reviewId}/decision` as Route} className="ghost-button">
                  Decision
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
