import Link from "next/link";
import type { ReactNode } from "react";
import type { ArbReviewStep, ArbReviewSummary } from "@/arb/types";

function formatWorkflowTimestamp(value: string | undefined) {
  if (!value) {
    return "Awaiting update";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getStepGuidance(activeStep: string) {
  switch (activeStep) {
    case "upload":
      return {
        title: "Package intake",
        body:
          "Stage source documents first so extraction, findings, and scoring are grounded in actual project evidence."
      };
    case "requirements":
      return {
        title: "Requirement confirmation",
        body:
          "Confirm what the platform extracted before moving into evidence mapping or generating findings."
      };
    case "evidence":
      return {
        title: "Evidence mapping",
        body:
          "Keep each requirement traceable to a cited source excerpt so missing evidence stays visible before scoring."
      };
    case "findings":
      return {
        title: "Findings-first workflow",
        body:
          "Triaging blockers, owners, and due dates here should drive what appears in the scorecard and decision surfaces."
      };
    case "scorecard":
      return {
        title: "Explainable scoring",
        body:
          "Use the weighted score as a transparent checkpoint, not as a replacement for human review judgment."
      };
    case "decision":
      return {
        title: "Human-owned decision",
        body:
          "AI can recommend the posture, but the final decision, rationale, and conditions remain reviewer-owned."
      };
    default:
      return {
        title: "Review orientation",
        body:
          "Use this workspace to move from uploaded evidence to findings, score, and an explicit reviewer decision."
      };
  }
}

export function ArbReviewShell(props: {
  review: ArbReviewSummary;
  steps: ArbReviewStep[];
  activeStep: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { review, steps, activeStep, title, description, children } = props;
  const activeStepIndex = steps.findIndex((step) => step.key === activeStep);
  const guidance = getStepGuidance(activeStep);

  return (
    <main className="arb-page-stack">
      <section className="review-command-panel">
        <div className="detail-command-grid">
          <div className="detail-command-copy">
            <p className="header-badge">
              {activeStep === "scorecard" || activeStep === "decision"
                ? "Decision Center"
                : "Review Workspace"}
            </p>
            <h1 className="review-command-title">{title}</h1>
            <p className="review-command-summary">{description}</p>
            <div className="board-summary-row">
              <span className="pill">Project: {review.projectName}</span>
              <span className="pill">Customer: {review.customerName || "Unassigned"}</span>
              <span className="pill">Review ID: {review.reviewId}</span>
            </div>
            <div className="button-row">
              <Link href="/arb" className="secondary-button">
                Back to review queue
              </Link>
              <Link href="/decision-center" className="ghost-button">
                Open Decision Center
              </Link>
            </div>
          </div>

          <aside className="detail-command-sidecar future-card arb-shell-sidecar-card">
            <p className="board-card-subtitle">Current posture</p>
            <div className="arb-shell-sidecar-metrics">
              <div>
                <span>Workflow</span>
                <strong>{review.workflowState}</strong>
              </div>
              <div>
                <span>Evidence</span>
                <strong>{review.evidenceReadinessState}</strong>
              </div>
              <div>
                <span>Recommendation</span>
                <strong>{review.finalDecision ?? review.recommendation}</strong>
              </div>
              <div>
                <span>Score</span>
                <strong>{review.overallScore ?? "Pending"}</strong>
              </div>
            </div>
          </aside>
        </div>

        <nav className="arb-step-strip" aria-label="ARB workflow steps">
          {steps.map((step) => (
            <Link
              key={step.key}
              href={step.href}
              className={`arb-step-link${
                step.key === activeStep
                  ? " arb-step-link-active"
                  : activeStepIndex >= 0 && steps.findIndex((candidate) => candidate.key === step.key) < activeStepIndex
                    ? " arb-step-link-complete"
                    : ""
              }`}
              aria-current={step.key === activeStep ? "step" : undefined}
            >
              <span>{step.label}</span>
            </Link>
          ))}
        </nav>
      </section>

      <div className="arb-shell-grid">
        <section className="surface-panel arb-shell-main">{children}</section>

        <aside className="arb-sidecar-stack">
          <section className="trace-card arb-summary-card">
            <p className="board-card-subtitle">Review summary</p>
            <ul className="arb-summary-list">
              <li>
                <span>Workflow State</span>
                <strong>{review.workflowState}</strong>
              </li>
              <li>
                <span>Evidence State</span>
                <strong>{review.evidenceReadinessState}</strong>
              </li>
              <li>
                <span>Recommendation</span>
                <strong>{review.recommendation}</strong>
              </li>
              <li>
                <span>Score</span>
                <strong>{review.overallScore ?? "TBD"}</strong>
              </li>
              <li>
                <span>Reviewer</span>
                <strong>{review.assignedReviewer ?? "Unassigned"}</strong>
              </li>
              <li>
                <span>Updated</span>
                <strong>{formatWorkflowTimestamp(review.lastUpdated)}</strong>
              </li>
            </ul>
          </section>

          <section className="future-card arb-summary-card">
            <p className="board-card-subtitle">{guidance.title}</p>
            <p className="section-copy">{guidance.body}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
