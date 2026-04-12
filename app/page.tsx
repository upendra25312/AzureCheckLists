"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { createArbReview, listArbReviews, uploadArbFiles } from "@/arb/api";
import type { ArbReviewSummary } from "@/arb/types";
import { buildLoginUrl, fetchClientPrincipal } from "@/lib/review-cloud";

const signInHref = buildLoginUrl("aad", "/arb");

const WORKFLOW_STEPS = [
  { id: 1, label: "Sign in", detail: "Microsoft account — Outlook or Azure AD" },
  { id: 2, label: "Create review", detail: "Name your project and customer" },
  { id: 3, label: "Upload documents", detail: "PDF, Word, PowerPoint, Markdown" },
  { id: 4, label: "Run AI analysis", detail: "WAF · CAF · ALZ · HA/DR · Security + more" },
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
  const step = getActiveStep(review);
  if (step <= 4) return `/arb/${review.reviewId}/upload` as Route;
  if (step === 5) return `/arb/${review.reviewId}/decision` as Route;
  return `/arb/${review.reviewId}` as Route;
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
  "WAF", "CAF", "ALZ", "HA/DR", "Backup", "Security", "Networking", "Monitoring", "Governance",
] as const;

export default function HomePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [latestReview, setLatestReview] = useState<ArbReviewSummary | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClientPrincipal()
      .then(async (p) => {
        setSignedIn(Boolean(p));
        if (p) {
          try {
            const payload = await listArbReviews();
            const sorted = [...payload.reviews].sort(
              (a, b) => new Date(b.lastUpdated ?? 0).getTime() - new Date(a.lastUpdated ?? 0).getTime()
            );
            setLatestReview(sorted[0] ?? null);
          } catch {
            // non-fatal
          }
        }
      })
      .catch(() => setSignedIn(false));
  }, []);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    try {
      setUploading(true);
      setUploadError(null);
      const firstName = fileList[0].name.replace(/\.[^.]+$/, "").slice(0, 80);
      const review = await createArbReview({ projectName: firstName || "Architecture Review", customerName: "" });
      await uploadArbFiles({ reviewId: review.reviewId, files: Array.from(fileList) });
      window.location.href = `/arb/${encodeURIComponent(review.reviewId)}/upload`;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed — please try again.");
      setUploading(false);
    }
  }

  return (
    <main className="impact-home">

      {/* ── HERO ── */}
      <section className="impact-section impact-section-hero">
        <span className="impact-kicker">Architecture reviews that ship</span>
        <h1 className="impact-headline">
          Upload architecture docs. Get board-ready Azure findings in minutes.
        </h1>
        <p className="impact-subline">
          Drop your SOW or design document — the AI agent reads it and checks it against WAF, CAF, ALZ, HA/DR, Security, Networking, and Monitoring.
        </p>

        {/* Upload zone — the action IS the page */}
        {signedIn === null ? (
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
              accept=".pdf,.doc,.docx,.rtf,.ppt,.pptx,.xls,.xlsx,.csv,.drawio,.vsdx,.svg,.png,.jpg,.jpeg,.gif,.webp,.bmp,.txt,.md,.markdown,.json,.xml,.yaml,.yml,.bicep,.tf,.zip"
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
                <p className="hero-upload-sub">or <span className="hero-upload-link">click to select files</span> · PDF, Word, PowerPoint, Markdown</p>
              </>
            )}
          </div>
        ) : (
          <a href={buildLoginUrl("aad", "/")} className="hero-upload-zone hero-upload-zone--signin">
            <span className="hero-upload-icon">🔐</span>
            <p className="hero-upload-title">Sign in with Microsoft to upload your documents</p>
            <p className="hero-upload-sub">Free · Microsoft account or Azure AD · No credit card</p>
          </a>
        )}

        {uploadError ? (
          <p className="hero-upload-error">{uploadError}</p>
        ) : null}

        <div className="impact-hero-cta-row" style={{ marginTop: 16 }}>
          <Link href="/services" className="impact-btn impact-btn-secondary">
            Explore Azure services — no sign-in required
          </Link>
          {signedIn && latestReview && (
            <Link href={getStepHref(latestReview)} className="impact-btn impact-btn-secondary">
              Continue: {WORKFLOW_STEPS[getActiveStep(latestReview) - 1]?.label} →
            </Link>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="impact-section">
        <span className="impact-kicker">How it works</span>
        <h2 className="impact-section-title">Six steps from document to board-ready pack</h2>
        {signedIn && latestReview ? (
          <p className="impact-small">
            You are currently on <strong>step {getActiveStep(latestReview)}: {WORKFLOW_STEPS[getActiveStep(latestReview) - 1]?.label}</strong> for <strong>{latestReview.projectName}</strong>.{" "}
            <Link href={getStepHref(latestReview)} className="impact-inline-link">Continue →</Link>
          </p>
        ) : (
          <p className="impact-small">
            Once you sign in, each step follows automatically — upload triggers analysis,
            analysis produces findings, findings feed the scorecard, and the scorecard
            feeds the export pack.
          </p>
        )}

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
            <a href={signInHref} className="impact-btn impact-btn-primary">
              Start Board Review
            </a>
          )}
          {signedIn === true && latestReview && (
            <Link href={getStepHref(latestReview)} className="impact-btn impact-btn-primary">
              Continue: {WORKFLOW_STEPS[getActiveStep(latestReview) - 1]?.label} →
            </Link>
          )}
          {signedIn === true && !latestReview && (
            <Link href="/arb" className="impact-btn impact-btn-primary">
              Start Board Review
            </Link>
          )}
        </div>
      </section>

      {/* ── BOARD REVIEW PREVIEW ── */}
      <section className="impact-section" id="board-review">
        <span className="impact-kicker">Architecture Board Review</span>
        <h2 className="impact-section-title">What you get after uploading your documents</h2>
        <p className="impact-small">
          The AI agent checks every document against 11 Azure frameworks and returns scored findings
          with evidence from your own docs and links to Microsoft Learn.
        </p>

        <div className="impact-grid-two">
          <article className="impact-panel">
            <h3 className="impact-panel-title">Traceable findings</h3>
            <ul className="impact-evidence-list">
              <li className="impact-evidence-item">
                <strong>AKS monitoring not enabled · Severity: High</strong>
                <p className="impact-small">Framework: WAF Reliability</p>
                <a href="https://learn.microsoft.com/en-us/azure/aks/monitor-aks" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/aks/monitor-aks
                </a>
              </li>
              <li className="impact-evidence-item">
                <strong>No zone redundancy in gateway layer · Severity: High</strong>
                <p className="impact-small">Framework: HA/DR and CAF</p>
                <a href="https://learn.microsoft.com/en-us/azure/well-architected/reliability/" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/well-architected/reliability
                </a>
              </li>
              <li className="impact-evidence-item">
                <strong>Missing tagging policy alignment · Severity: Medium</strong>
                <p className="impact-small">Framework: ALZ Governance</p>
                <a href="https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/cloud-adoption-framework
                </a>
              </li>
            </ul>

            <div className="impact-framework-grid">
              {frameworkCoverage.map((name) => (
                <div key={name} className="impact-framework-item">{name}</div>
              ))}
            </div>
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
            <div className="impact-decision-model">
              <span className="impact-decision-chip">Approved</span>
              <span className="impact-decision-chip impact-decision-chip-active">Needs Revision</span>
              <span className="impact-decision-chip">Rejected</span>
            </div>
            <p className="impact-small" style={{ marginTop: 12 }}>
              AI recommends a posture. Reviewers record the final decision and export the full ARB pack.
            </p>
            <div className="impact-format-chips">
              <span className="impact-format-chip">CSV Export</span>
              <span className="impact-format-chip">HTML Export</span>
              <span className="impact-format-chip">Markdown Export</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link href="/arb" className="impact-btn impact-btn-primary">
                Start Board Review
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
                  View Findings
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
