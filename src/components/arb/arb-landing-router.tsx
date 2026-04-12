"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { ArbReviewStepKey } from "@/arb/types";
import { ArbLiveReviewStep } from "@/components/arb/live-review-step";
import { ArbReviewLibrary } from "@/components/arb/review-library";

function getRequestedStep(value: string | null): ArbReviewStepKey {
  const step = value?.toLowerCase();
  if (step === "upload") return "upload";
  if (step === "requirements") return "requirements";
  if (step === "evidence") return "evidence";
  if (step === "findings") return "findings";
  if (step === "scorecard") return "scorecard";
  if (step === "decision") return "decision";
  return "overview";
}

function getStepMeta(step: ArbReviewStepKey): { title: string; description: string } {
  switch (step) {
    case "upload":
      return {
        title: "Upload Review Package",
        description: "Stage source documents, confirm package readiness, and prepare the extraction handoff."
      };
    case "requirements":
      return {
        title: "Requirements Review",
        description: "Validate extracted requirements before evidence mapping and scoring."
      };
    case "evidence":
      return {
        title: "Evidence Mapping",
        description: "Compare extracted evidence against architecture requirements and close traceability gaps."
      };
    case "findings":
      return {
        title: "Review Findings",
        description: "Inspect AI findings, severity, and references tied to Microsoft guidance."
      };
    case "scorecard":
      return {
        title: "Weighted Scorecard",
        description: "Review weighted domain scores and recommendation posture before final decision."
      };
    case "decision":
      return {
        title: "Decision and Sign-off",
        description: "Capture reviewer decision, rationale, and sign-off details for the ARB package."
      };
    default:
      return {
        title: "Review Workspace Overview",
        description: "See the current evidence posture, workflow state, and next step for this architecture review."
      };
  }
}

export function ArbLandingRouter() {
  const searchParams = useSearchParams();

  const reviewId = useMemo(() => {
    const raw = searchParams.get("reviewId")?.trim() ?? "";
    if (!raw || raw === "undefined" || raw === "null") {
      return "";
    }

    return raw;
  }, [searchParams]);
  const step = useMemo(() => getRequestedStep(searchParams.get("step")), [searchParams]);
  const stepMeta = useMemo(() => getStepMeta(step), [step]);

  if (reviewId) {
    return (
      <ArbLiveReviewStep
        reviewId={reviewId}
        activeStep={step}
        title={stepMeta.title}
        description={stepMeta.description}
      />
    );
  }

  return (
    <>
      {/* Page header */}
      <section className="arb-page-header">
        <h1 className="arb-page-title">AI Architecture Review</h1>
        <p className="arb-page-sub">
          Upload your design documents and get findings checked against all Azure frameworks.
        </p>
      </section>

      {/* Create form + review list */}
      <ArbReviewLibrary />

      {/* How it works — below fold, secondary context */}
      <section className="arb-how-band">
        <h2 className="arb-how-title">How it works</h2>
        <ol className="arb-how-steps">
          <li>
            <span>01</span>
            <div>
              <strong>Create review</strong>
              <p>Name your project and customer so findings, decisions, and exports stay scoped correctly.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Upload review material</strong>
              <p>Bring the design pack, diagrams, and supporting material into the review.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Architecture Assurance Assessment</strong>
              <p>
                The Azure ARB Agent reads your documents and checks them against WAF, CAF, ALZ,
                HA/DR, Security, Networking, and Monitoring using live Microsoft Learn docs.
              </p>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <strong>Review findings and scorecard</strong>
              <p>Every finding is grounded in evidence from your documents and linked to a Microsoft Learn URL.</p>
            </div>
          </li>
          <li>
            <span>05</span>
            <div>
              <strong>Human sign-off and export</strong>
              <p>
                AI recommends the posture. Reviewers record the final decision and export the board pack
                as CSV, HTML, or Markdown.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </>
  );
}
