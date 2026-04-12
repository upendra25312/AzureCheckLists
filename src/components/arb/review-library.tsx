"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { createArbReview, listArbReviews } from "@/arb/api";
import { getArbStepHref } from "@/arb/routes";
import type { ArbReviewSummary } from "@/arb/types";
import { ENABLED_AUTH_PROVIDERS, buildLoginUrl, fetchClientPrincipal } from "@/lib/review-cloud";
import type { StaticWebAppClientPrincipal } from "@/types";

type ArbReviewLibraryFocus = "workspace" | "decision";

const REVIEW_STEPS = [
  { id: 1, key: "created",  label: "Created" },
  { id: 2, key: "upload",   label: "Upload" },
  { id: 3, key: "analysis", label: "Analysis" },
  { id: 4, key: "findings", label: "Findings" },
  { id: 5, key: "signoff",  label: "Sign-off" },
  { id: 6, key: "export",   label: "Export" },
] as const;

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

function ReviewProgress({ review }: { review: ArbReviewSummary }) {
  const active = getActiveStep(review);
  return (
    <div className="arb-progress-strip" aria-label="Review progress">
      {REVIEW_STEPS.map((step) => {
        const done = step.id < active;
        const current = step.id === active;
        return (
          <div
            key={step.key}
            className={`arb-progress-step${done ? " arb-progress-step--done" : ""}${current ? " arb-progress-step--current" : ""}`}
          >
            <span className="arb-progress-dot">
              {done ? "✓" : step.id}
            </span>
            <span className="arb-progress-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
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
  if (step === 4) return "Review findings →";
  if (step === 5) return "Sign off →";
  return "Download export →";
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
        if (!active) return;
        setPrincipal(nextPrincipal);
        if (!nextPrincipal) { setLoading(false); return; }
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
  }, []);

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
        <p className="arb-signin-sub">
          Sign in with your supported account to create a review, upload SOW or design docs,
          and let the Azure ARB Agent check them against WAF, CAF, ALZ, HA/DR, Security,
          Networking, and Monitoring — with findings linked to live Microsoft Learn guidance.
        </p>
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
          <li>PDF, Word, or PowerPoint — drag and drop your documents</li>
          <li>AI checks WAF · CAF · ALZ · HA/DR · Backup · Security · Networking · Monitoring</li>
          <li>Findings scored 0–100, every finding linked to Microsoft Learn</li>
          <li>Export board-ready pack as CSV, HTML, or Markdown</li>
          <li>Reviews retained for 30 days — delete any review manually at any time</li>
        </ul>
      </div>
    );
  }

  /* ── Signed-in state ── */
  return (
    <div className="arb-library-stack">

      {/* Create form */}
      <section className="arb-create-card">
        <p className="arb-create-label">Start a new review</p>
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
            {saving ? "Creating…" : "Create review and upload documents →"}
          </button>
        </div>
        {error ? <p className="arb-create-error">{error}</p> : null}
      </section>

      {/* Review list with progress tracker */}
      {filteredReviews.length === 0 ? (
        <section className="arb-empty-state">
          <p className="arb-empty-title">No reviews yet</p>
          <p className="arb-empty-sub">
            Create your first review above — you&apos;ll be taken straight to the upload page.
          </p>
        </section>
      ) : (
        <section className="arb-review-table-wrap">
          <h2 className="arb-review-table-heading">Your reviews</h2>
          <div className="arb-review-list">
            {filteredReviews.map((review) => (
              <article
                key={`${review.reviewId}-${review.createdByUserId ?? "user"}`}
                className="arb-review-row"
              >
                {/* Top row: project name, status badge, score, date, action */}
                <div className="arb-review-row-head">
                  <div className="arb-review-row-meta">
                    <span className="arb-review-row-project">{review.projectName}</span>
                    {review.customerName && (
                      <span className="arb-review-row-customer">{review.customerName}</span>
                    )}
                  </div>
                  <div className="arb-review-row-right">
                    <StatusBadge state={review.workflowState} />
                    {review.overallScore !== null && review.overallScore !== undefined && (
                      <span className="arb-review-row-score">Score: {review.overallScore}</span>
                    )}
                    <span className="arb-review-row-date">{formatDate(review.lastUpdated)}</span>
                    <Link href={getPrimaryHref(review, focus)} className="arb-table-open">
                      {getPrimaryLabel(review, focus)}
                    </Link>
                    <Link href={getArbStepHref(review.reviewId, "findings")} className="arb-table-secondary">
                      Findings
                    </Link>
                  </div>
                </div>
                {/* Progress tracker */}
                <ReviewProgress review={review} />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
