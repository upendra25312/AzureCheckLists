"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { createArbReview, listArbReviews, uploadArbFiles } from "@/arb/api";
import { getArbStepHref } from "@/arb/routes";
import type { ArbReviewSummary } from "@/arb/types";
import { SUPPORTED_ARB_UPLOAD_EXTENSIONS } from "@/components/arb/upload-extensions";
import { useAuthSession } from "@/components/auth-session-provider";
import {
  ENABLED_AUTH_PROVIDERS,
  PRIMARY_AUTH_PROVIDER,
  buildLoginUrl,
  getAuthSupportLabel
} from "@/lib/review-cloud";

const WORKFLOW_STEPS = [
  { id: 1, label: "Sign in", detail: "Use your supported account" },
  { id: 2, label: "Create review", detail: "Name your project and customer" },
  {
    id: 3,
    label: "Upload documents",
    detail: "Documents, diagrams, spreadsheets, images, IaC, scripts, and archives"
  },
  {
    id: 4,
    label: "Architecture Assurance Assessment",
    detail: "Automated framework assessment across WAF, CAF, ALZ, HA/DR, Security + more"
  },
  { id: 5, label: "Review findings", detail: "Scored 0–100, linked to Microsoft Learn" },
  { id: 6, label: "Sign off & export", detail: "CSV, HTML, Markdown — board-ready pack" },
];

function getActiveStep(review: ArbReviewSummary): number {
  const s = review.workflowState;
  if (s === "Draft") return 2;
  if (s === "Evidence Ready") return 3;
  if (s === "Review In Progress") return 4;
  if (s === "Decision Recorded" || s === "Approved" || s === "Needs Revision" || s === "Rejected") return 5;
  if (s === "Review Complete" || s === "Closed") return 6;
  return 1;
}

function getStepHref(review: ArbReviewSummary): Route {
  const resolvedReviewId = String(review.reviewId ?? "").trim();
  if (!resolvedReviewId || resolvedReviewId === "undefined" || resolvedReviewId === "null") {
    return "/arb" as Route;
  }

  const step = getActiveStep(review);
  if (step <= 3) return getArbStepHref(resolvedReviewId, "upload", "upload-documents");
  if (step === 4) return getArbStepHref(resolvedReviewId, "upload", "run-ai-analysis");
  if (step === 5) return getArbStepHref(resolvedReviewId, "decision");
  return getArbStepHref(resolvedReviewId, "overview");
}

function hasValidReviewId(review: ArbReviewSummary): boolean {
  const reviewId = String(review.reviewId ?? "").trim();
  return Boolean(reviewId) && reviewId !== "undefined" && reviewId !== "null";
}

const serviceCards = [
  {
    tone: "ok",
    title: "Azure Kubernetes Service",
    href: "/services/azure-kubernetes-service-aks",
    meta: "55 regions · 42 findings",
    finding: "Enable cluster insights — WAF Reliability",
  },
  {
    tone: "warn",
    title: "API Management",
    href: "/services/api-management",
    meta: "9 restricted regions · 28 findings",
    finding: "Use zone redundancy where available — HA/DR",
  },
  {
    tone: "preview",
    title: "Azure App Service",
    href: "/services/azure-app-service",
    meta: "4 preview families · 19 findings",
    finding: "Use deployment slots for safer rollouts — CAF",
  },
] as const;

const frameworkCoverage = [
  { name: "WAF",        status: "complete" },
  { name: "CAF",        status: "complete" },
  { name: "ALZ",        status: "complete" },
  { name: "HA/DR",      status: "partial"  },
  { name: "Backup",     status: "partial"  },
  { name: "Security",   status: "complete" },
  { name: "Networking", status: "complete" },
  { name: "Monitoring", status: "partial"  },
  { name: "Governance", status: "complete" },
] as const;

export default function HomePage() {
  const { principal, resolved, signedIn } = useAuthSession();
  const [latestReview, setLatestReview] = useState<ArbReviewSummary | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    if (!resolved) {
      return () => {
        active = false;
      };
    }

    if (!principal) {
      setLatestReview(null);
      return () => {
        active = false;
      };
    }

    async function loadLatestReview() {
      try {
        const payload = await listArbReviews();

        if (!active) {
          return;
        }

        const sorted = [...payload.reviews]
          .filter(hasValidReviewId)
          .sort((a, b) => new Date(b.lastUpdated ?? 0).getTime() - new Date(a.lastUpdated ?? 0).getTime());

        setLatestReview(sorted[0] ?? null);
      } catch {
        if (active) {
          setLatestReview(null);
        }
      }
    }

    void loadLatestReview();

    return () => {
      active = false;
    };
  }, [principal, resolved]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    try {
      setUploading(true);
      setUploadError(null);
      const firstName = fileList[0].name.replace(/\.[^.]+$/, "").slice(0, 80);
      const review = await createArbReview({ projectName: firstName || "Architecture Review", customerName: "" });
      await uploadArbFiles({ reviewId: review.reviewId, files: Array.from(fileList) });
      window.location.href = getArbStepHref(review.reviewId, "upload", "upload-documents");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed — please try again.");
      setUploading(false);
    }
  }

  return (
    <main className="impact-home">

      {/* ── HERO ── */}
      <section className="impact-section impact-section-hero">
        <img src="/icon.svg" alt="Azure Review Assistant" className="hero-brand-mark" />
        <span className="impact-kicker">Architecture reviews that ship</span>
        <h1 className="impact-headline">
          Upload architecture docs. Get board-ready Azure findings in minutes.
        </h1>
        <p className="impact-subline">
          Upload your SOW or design document and get scored, evidence-linked findings across WAF, CAF, ALZ, HA/DR, Security, Networking, and Monitoring.
        </p>

        {/* Upload zone — the action IS the page */}
        {!resolved ? (
          <div className="hero-upload-zone hero-upload-zone--loading">
            <span className="impact-auth-loading">Checking sign-in status…</span>
          </div>
        ) : signedIn ? (
          <div
            className={`hero-upload-zone${dropActive ? " hero-upload-zone--active" : ""}${uploading ? " hero-upload-zone--uploading" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
            onDragLeave={() => setDropActive(false)}
            onDrop={(e) => { e.preventDefault(); setDropActive(false); void handleFiles(e.dataTransfer.files); }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload architecture documents"
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={SUPPORTED_ARB_UPLOAD_EXTENSIONS.join(",")}
              className="hero-upload-input"
              aria-hidden="true"
              onChange={(e) => { void handleFiles(e.target.files); e.currentTarget.value = ""; }}
            />
            {uploading ? (
              <>
                <span className="hero-upload-icon">⏳</span>
                <p className="hero-upload-title">Creating review and uploading…</p>
                <p className="hero-upload-sub">You will be taken to the analysis page automatically.</p>
              </>
            ) : (
              <>
                <span className="hero-upload-icon">📄</span>
                <p className="hero-upload-title">Drop your SOW or design doc here</p>
                <p className="hero-upload-sub">or <span className="hero-upload-link">click to select files</span> · docs, diagrams, spreadsheets, images, IaC, scripts, notebooks, archives</p>
              </>
            )}
          </div>
        ) : (
          <a href={buildLoginUrl(PRIMARY_AUTH_PROVIDER)} className="hero-upload-zone hero-upload-zone--signin">
            <span className="hero-upload-icon">🔐</span>
            <p className="hero-upload-title">Sign in to upload your documents</p>
            <p className="hero-upload-sub">{getAuthSupportLabel()}</p>
          </a>
        )}

        {uploadError ? (
          <p className="hero-upload-error">{uploadError}</p>
        ) : null}

        {signedIn && latestReview && (
          <div className="impact-hero-cta-row" style={{ marginTop: 16 }}>
            <Link href={getStepHref(latestReview)} className="impact-btn impact-btn-secondary">
              Continue: {WORKFLOW_STEPS[getActiveStep(latestReview) - 1]?.label} →
            </Link>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="impact-section">
        <span className="impact-kicker">How it works</span>
        <h2 className="impact-section-title">Six steps from document to board-ready pack</h2>
        {signedIn && latestReview ? (
          <p className="impact-small">
            You are on <strong>step {getActiveStep(latestReview)}: {WORKFLOW_STEPS[getActiveStep(latestReview) - 1]?.label}</strong> for <strong>{latestReview.projectName}</strong>.{" "}
            <Link href={getStepHref(latestReview)} className="impact-inline-link">Continue →</Link>
          </p>
        ) : null}

        <ol className="impact-workflow-steps">
          {WORKFLOW_STEPS.map((step) => {
            const activeStep = latestReview ? getActiveStep(latestReview) : (signedIn ? 2 : 1);
            const isDone = step.id < activeStep;
            const isCurrent = step.id === activeStep;
            return (
              <li
                key={step.id}
                className={`impact-workflow-step${isDone ? " impact-workflow-step--done" : ""}${isCurrent ? " impact-workflow-step--current" : ""}`}
              >
                <span className={`impact-step-num${isDone ? " impact-step-num--done" : ""}${isCurrent ? " impact-step-num--current" : ""}`}>
                  {isDone ? "✓" : step.id}
                </span>
                <div>
                  <strong>{step.label}</strong>
                  <p className="impact-small">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="impact-hero-cta-row" style={{ marginTop: 24 }}>
          {signedIn === false && (
            <>
              {ENABLED_AUTH_PROVIDERS.map((provider, index) => (
                <a
                  key={provider.id}
                  href={buildLoginUrl(provider.id)}
                  className={`impact-btn ${index === 0 ? "impact-btn-primary" : "impact-btn-secondary"}`}
                >
                  Start with {provider.label}
                </a>
              ))}
            </>
          )}
          {signedIn === true && latestReview && (
            <Link href={getStepHref(latestReview)} className="impact-btn impact-btn-primary">
              Continue: {WORKFLOW_STEPS[getActiveStep(latestReview) - 1]?.label} →
            </Link>
          )}
          {signedIn === true && !latestReview && (
            <Link href="/arb" className="impact-btn impact-btn-primary">
                Start Architecture Review →
            </Link>
          )}
        </div>
      </section>

      {/* ── TWO MODES ── */}
      <section className="impact-section" id="two-modes">
        <span className="impact-kicker">Two ways to review</span>
        <h2 className="impact-section-title">Standard or ARB mode — choose what fits your work</h2>
        <div className="impact-mode-grid">
          <article className="impact-mode-card">
            <div className="impact-mode-header">
              <span className="impact-mode-badge impact-mode-badge--standard">Standard</span>
              <span className="impact-mode-tag">No sign-in required</span>
            </div>
            <h3 className="impact-mode-title">Instant service findings</h3>
            <p className="impact-small">
              Browse 100+ Azure services. Pick your stack and get immediate WAF, CAF, and ALZ findings with Microsoft Learn links.
            </p>
            <ul className="impact-mode-list">
              <li>Anonymous — no account needed</li>
              <li>Per-service best-practice checks</li>
              <li>Regional availability signals</li>
              <li>Export as CSV or HTML</li>
            </ul>
            <div>
              <Link href="/services" className="impact-btn impact-btn-secondary">
                Explore services ↗
              </Link>
            </div>
          </article>

          <div className="impact-mode-divider" aria-hidden="true">vs</div>

          <article className="impact-mode-card impact-mode-card--arb">
            <div className="impact-mode-header">
              <span className="impact-mode-badge impact-mode-badge--arb">ARB Grade</span>
              <span className="impact-mode-tag">Sign-in required</span>
            </div>
            <h3 className="impact-mode-title">Full architecture review</h3>
            <p className="impact-small">
              Upload your SOW or design doc. Every page is assessed against 11 Microsoft frameworks — scored, evidence-linked, and board-ready.
            </p>
            <ul className="impact-mode-list">
              <li>Document evidence grounded in your own files</li>
              <li>All 11 frameworks in one pass</li>
              <li>Weighted scorecard 0–100</li>
              <li>Human sign-off checkpoint with decision record</li>
              <li>Export as executive summary, action list, or full ARB pack</li>
            </ul>
            <div>
              <Link href="/arb" className="impact-btn impact-btn-primary">
                Start Architecture Review →
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* ── BOARD REVIEW PREVIEW ── */}
      <section className="impact-section" id="board-review">
        <span className="impact-kicker">Architecture Board Review</span>
        <h2 className="impact-section-title">What you get after uploading your documents</h2>
        <p className="impact-small">
          Every document is assessed against 11 Azure frameworks, returning scored, evidence-linked findings
          grounded in your own docs with references to Microsoft Learn.
        </p>

        <div className="impact-grid-two">
          <article className="impact-panel">
            <h3 className="impact-panel-title">Traceable findings</h3>
            <ul className="impact-evidence-list">
              <li className="impact-evidence-item">
                <strong>AKS monitoring not enabled · Severity: High</strong>
                <p className="impact-small">Framework: WAF Reliability</p>
                <a href="https://learn.microsoft.com/en-us/azure/aks/monitor-aks" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/aks/monitor-aks ↗
                </a>
              </li>
              <li className="impact-evidence-item">
                <strong>No zone redundancy in gateway layer · Severity: High</strong>
                <p className="impact-small">Framework: HA/DR and CAF</p>
                <a href="https://learn.microsoft.com/en-us/azure/well-architected/reliability/" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/well-architected/reliability ↗
                </a>
              </li>
              <li className="impact-evidence-item">
                <strong>Missing tagging policy alignment · Severity: Medium</strong>
                <p className="impact-small">Framework: ALZ Governance</p>
                <a href="https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/cloud-adoption-framework ↗
                </a>
              </li>
            </ul>

            <div className="impact-framework-grid">
              {frameworkCoverage.map(({ name, status }) => (
                <div key={name} className="impact-framework-item">
                  <span className={`impact-framework-state${status === "complete" ? " impact-framework-state-complete" : " impact-framework-state-partial"}`}>
                    {status === "complete" ? "✓" : "~"}
                  </span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
            <p className="impact-framework-summary">6 of 9 frameworks complete · 78% coverage</p>
          </article>

          <article className="impact-panel">
            <h3 className="impact-panel-title">Weighted scorecard + sign-off</h3>
            {(["Reliability", "Security", "Cost Optimisation"] as const).map((domain, i) => {
              const scores = [78, 64, 71];
              return (
                <div key={domain} className="impact-score-row">
                  <span>{domain}</span>
                  <div className="impact-score-bar">
                    <div className="impact-score-fill" style={{ width: `${scores[i]}%` }} />
                  </div>
                  <span>{scores[i]}</span>
                </div>
              );
            })}
            <div className="impact-signoff-block">
              <p className="impact-signoff-label">ARB sign-off checkpoint</p>
              <div className="impact-signoff-meta">
                <span className="impact-signoff-field">👤 Senior Cloud Architect</span>
                <span className="impact-signoff-field">📅 13 Apr 2026 · 14:32 UTC</span>
              </div>
              <div className="impact-decision-model">
                <span className="impact-decision-chip">Approved</span>
                <span className="impact-decision-chip impact-decision-chip-active">Needs Revision</span>
                <span className="impact-decision-chip">Rejected</span>
              </div>
              <p className="impact-small" style={{ marginTop: 8 }}>
                Framework analysis derives a recommended posture. The named reviewer records the final decision.
              </p>
            </div>
            <div className="impact-format-chips">
              <span className="impact-format-chip">CSV Export</span>
              <span className="impact-format-chip">HTML Export</span>
              <span className="impact-format-chip">Markdown Export</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link href="/arb" className="impact-btn impact-btn-primary">
                 Start Architecture Review →
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* ── SERVICE EXPLORER PREVIEW ── */}
      <section className="impact-section" id="service-explorer">
        <span className="impact-kicker">Service Explorer</span>
        <h2 className="impact-section-title">Explore Azure services — no sign-in required</h2>
        <p className="impact-small">
          Search any Azure service to get instant findings, regional availability, and risk indicators.
        </p>

        <div className="impact-service-grid">
          {serviceCards.map((card) => (
            <article key={card.title} className="impact-card">
              <span className={`impact-status impact-status-${card.tone}`}>
                {card.tone === "ok" ? "AVAILABLE" : card.tone === "warn" ? "RESTRICTED" : "PREVIEW"}
              </span>
              <h3>{card.title}</h3>
              <p className="impact-small">{card.meta}</p>
              <p className="impact-small" style={{ color: "var(--t1)", fontWeight: 600 }}>{card.finding}</p>
              <div className="impact-service-actions">
                <Link href={card.href} className="impact-btn impact-btn-secondary">
                  {signedIn ? "View findings · Add to review" : "View instant findings ↗"}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Link href="/services" className="impact-btn impact-btn-secondary">
            Explore Azure Services
          </Link>
        </div>
      </section>

    </main>
  );
}
