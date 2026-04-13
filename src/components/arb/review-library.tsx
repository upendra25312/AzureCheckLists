"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { createArbReview, listArbReviews } from "@/arb/api";
import { getArbStepHref } from "@/arb/routes";
import type { ArbReviewSummary } from "@/arb/types";
import { useAuthSession } from "@/components/auth-session-provider";
import { ENABLED_AUTH_PROVIDERS, buildLoginUrl } from "@/lib/review-cloud";

type ArbReviewLibraryFocus = "workspace" | "decision";

function getActiveStep(review: ArbReviewSummary): number {
  const s = review.workflowState;
  if (s === "Draft") return 2;
  if (s === "Evidence Ready") return 3;
  if (s === "Review In Progress") return 4;
  if (
    s === "Decision Recorded" ||
    s === "Approved" ||
    s === "Needs Revision" ||
    s === "Rejected"
  ) return 5;
  if (s === "Review Complete" || s === "Closed") return 6;
  return 1;
}

function formatDate(value: string | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPrimaryHref(review: ArbReviewSummary, focus: ArbReviewLibraryFocus): Route {
  const reviewId = String(review.reviewId ?? "").trim();
  if (!reviewId || reviewId === "undefined" || reviewId === "null") {
    return "/arb" as Route;
  }

  if (focus === "decision") return getArbStepHref(reviewId, "decision");
  const step = getActiveStep(review);
  if (step <= 2) return getArbStepHref(reviewId, "upload", "upload-documents");
  if (step === 3) return getArbStepHref(reviewId, "upload", "run-ai-analysis");
  if (step === 4) return getArbStepHref(reviewId, "findings");
  return getArbStepHref(reviewId, "overview");
}

function hasValidReviewId(review: ArbReviewSummary): boolean {
  const reviewId = String(review.reviewId ?? "").trim();
  return Boolean(reviewId) && reviewId !== "undefined" && reviewId !== "null";
}

function getPrimaryLabel(review: ArbReviewSummary, focus: ArbReviewLibraryFocus) {
  if (focus === "decision") return review.finalDecision ? "Review decision" : "Open decision";
  const step = getActiveStep(review);
  if (step <= 2) return "Upload documents →";
  if (step === 3) return "Run analysis →";
  if (step === 4) return "Resolve findings →";
  if (step === 5) return "Complete sign-off →";
  return "Open reviewed pack →";
}

function getReviewPosture(review: ArbReviewSummary) {
  return review.finalDecision ?? review.recommendation ?? review.workflowState;
}

function getNextStepSummary(review: ArbReviewSummary) {
  const step = getActiveStep(review);
  if (step <= 2) {
    return "Next: upload the architecture package so the AI review can start from real evidence.";
  }
  if (step === 3) {
    return "Next: run analysis and validate the extracted evidence before findings are shared.";
  }
  if (step === 4) {
    return "Next: assign owners and resolve findings that block board-ready sign-off.";
  }
  if (step === 5) {
    return "Next: confirm the recommendation, reviewer rationale, and final decision state.";
  }
  return "Next: open the reviewed pack and export the latest board-ready outputs.";
}

function getEvidenceSummary(review: ArbReviewSummary) {
  const requiredGaps = review.missingRequiredItems?.length ?? 0;
  const recommendedGaps = review.missingRecommendedItems?.length ?? 0;

  if (requiredGaps > 0) {
    return `${requiredGaps} required evidence gap${requiredGaps === 1 ? "" : "s"}`;
  }

  if (recommendedGaps > 0) {
    return `${recommendedGaps} recommended evidence gap${recommendedGaps === 1 ? "" : "s"}`;
  }

  if (review.documentCount && review.documentCount > 0) {
    return `${review.documentCount} document${review.documentCount === 1 ? "" : "s"} staged`;
  }

  return review.evidenceReadinessState;
}

function StatusBadge({ state }: { state: string }) {
  const cls =
    state === "Approved"
      ? "arb-status-badge arb-status-approved"
      : state === "Needs Revision" || state === "Rejected"
      ? "arb-status-badge arb-status-needs-work"
      : state === "Draft"
      ? "arb-status-badge arb-status-draft"
      : "arb-status-badge arb-status-in-progress";
  return <span className={cls}>{state}</span>;
}

export function ArbReviewLibrary(props: { focus?: ArbReviewLibraryFocus }) {
  const { focus = "workspace" } = props;
  const { principal, resolved } = useAuthSession();
  const [reviews, setReviews] = useState<ArbReviewSummary[]>([]);
  const [projectName, setProjectName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!resolved) {
      return () => {
        active = false;
      };
    }

    if (!principal) {
      setReviews([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    async function load() {
      try {
        const payload = await listArbReviews();
        if (!active) return;
        setReviews(payload.reviews.filter(hasValidReviewId));
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load reviews.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [principal, resolved]);

  const filteredReviews = useMemo(() => {
    if (focus === "decision") {
      return [...reviews].sort((a, b) => {
        const aw = a.finalDecision ? 1 : 0;
        const bw = b.finalDecision ? 1 : 0;
        if (aw !== bw) return aw - bw;
        return (b.overallScore ?? -1) - (a.overallScore ?? -1);
      });
    }
    return reviews;
  }, [focus, reviews]);

  async function handleCreateReview() {
    try {
      setSaving(true);
      setError(null);
      const review = await createArbReview({ projectName, customerName });
      window.location.href = getArbStepHref(review.reviewId, "upload", "upload-documents");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create review.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="arb-library-loading"><p>Loading reviews…</p></div>;
  }

  /* ── Signed-out state ── */
  if (!principal) {
    return (
      <div className="arb-signin-hero">
        <p className="arb-signin-kicker">ARB-grade review mode</p>
        <h1 className="arb-signin-headline">
          Upload your design documents and get an AI-powered architecture review in minutes.
        </h1>
        {ENABLED_AUTH_PROVIDERS.map((provider, index) => (
          <a
            key={provider.id}
            href={buildLoginUrl(provider.id)}
            className="arb-signin-cta"
            style={index > 0 ? { marginTop: 10 } : undefined}
          >
            Sign in with {provider.label} to start →
          </a>
        ))}
        <ul className="arb-signin-bullets">
          <li>PDF, Word, PowerPoint, or Markdown — drag and drop your documents</li>
          <li>AI checks WAF · CAF · ALZ · HA/DR · Security · Networking · Monitoring in one pass</li>
          <li>Every finding scored 0–100 and linked to a Microsoft Learn source</li>
          <li>Files retained for 30 days — delete any review at any time</li>
        </ul>
      </div>
    );
  }

  /* ── Signed-in state ── */
  return (
    <div className="arb-library-stack">
      <section className="arb-create-card">
        <div className="arb-create-copy">
          <p className="arb-create-label">AI review workspace</p>
          <h2 className="arb-create-title">Upload architecture documents and start an AI review.</h2>
          <p className="arb-create-sub">
            Create the review, move straight into document upload, and generate Microsoft Learn-grounded findings across WAF, CAF, ALZ, HA/DR, Security, Networking, and Monitoring.
          </p>
          <div className="arb-proof-strip" aria-label="AI review proof points">
            <span className="arb-proof-chip">11 framework areas checked</span>
            <span className="arb-proof-chip">Traceable Microsoft guidance</span>
            <span className="arb-proof-chip">Board-ready sign-off workflow</span>
          </div>
        </div>
        <div className="arb-create-fields">
          <label className="arb-field">
            <span>Project name</span>
            <input
              className="arb-field-input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Contoso landing zone modernization"
              aria-label="Project name"
            />
          </label>
          <label className="arb-field">
            <span>Customer / organisation</span>
            <input
              className="arb-field-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Contoso"
              aria-label="Customer name"
            />
          </label>
          <button
            type="button"
            className="arb-create-btn"
            onClick={() => void handleCreateReview()}
            disabled={saving || !projectName.trim()}
          >
            {saving ? "Creating…" : "Start AI Review →"}
          </button>
        </div>
        <p className="arb-create-trust">
          Files are retained for 30 days. The next step opens the upload workspace so the review starts from your actual design package.
        </p>
        {error ? <p className="arb-create-error">{error}</p> : null}
      </section>

      {filteredReviews.length === 0 ? (
        <section className="arb-empty-state">
          <p className="arb-empty-title">No reviews yet</p>
          <p className="arb-empty-sub">
            Create your first review above — you&apos;ll be taken straight to the upload page.
          </p>
        </section>
      ) : (
        <section className="arb-review-table-wrap">
          <div className="arb-review-section-head">
            <h2 className="arb-review-table-heading">Resume an active review</h2>
            <p className="arb-review-table-sub">
              Each card shows current posture, evidence readiness, and the next action needed to reach a board-ready pack.
            </p>
          </div>
          <div className="arb-review-list">
            {filteredReviews.map((review) => (
              <article
                key={`${review.reviewId}-${review.createdByUserId ?? "user"}`}
                className="arb-review-card"
              >
                <div className="arb-review-card-head">
                  <div className="arb-review-card-meta">
                    <span className="arb-review-card-project">{review.projectName}</span>
                    {review.customerName && (
                      <span className="arb-review-card-customer">{review.customerName}</span>
                    )}
                  </div>
                  <div className="arb-review-card-actions">
                    <span className="arb-review-updated">Updated {formatDate(review.lastUpdated)}</span>
                    <Link href={getPrimaryHref(review, focus)} className="arb-table-open">
                      {getPrimaryLabel(review, focus)}
                    </Link>
                  </div>
                </div>
                <div className="arb-review-metrics" aria-label={`Review posture for ${review.projectName}`}>
                  <div className="arb-review-metric">
                    <span className="arb-review-metric-label">Workflow</span>
                    <StatusBadge state={review.workflowState} />
                  </div>
                  <div className="arb-review-metric">
                    <span className="arb-review-metric-label">Decision posture</span>
                    <strong className="arb-review-metric-value">{getReviewPosture(review)}</strong>
                  </div>
                  <div className="arb-review-metric">
                    <span className="arb-review-metric-label">Evidence</span>
                    <strong className="arb-review-metric-value">{getEvidenceSummary(review)}</strong>
                  </div>
                  <div className="arb-review-metric">
                    <span className="arb-review-metric-label">Score</span>
                    {review.overallScore !== null && review.overallScore !== undefined && (
                      <strong className="arb-review-metric-value">{review.overallScore}/100</strong>
                    )}
                    {(review.overallScore === null || review.overallScore === undefined) && (
                      <strong className="arb-review-metric-value">Pending</strong>
                    )}
                  </div>
                </div>
                <p className="arb-review-next-step">{getNextStepSummary(review)}</p>
                <div className="arb-review-links">
                  <Link href={getArbStepHref(review.reviewId, "findings")} className="arb-table-secondary">
                    Open findings
                  </Link>
                  <span className="arb-review-id">Review ID: {review.reviewId}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
