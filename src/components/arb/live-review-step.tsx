"use client";

import { useEffect, useState } from "react";
import { fetchArbFindings, fetchArbReview, type ArbFindingSummary } from "@/arb/api";
import { getArbReviewSteps } from "@/arb/mock-review";
import type { ArbReviewSummary, ArbReviewStepKey } from "@/arb/types";
import { ArbReviewShell } from "@/components/arb/review-shell";
import { ArbPlaceholderPage } from "@/components/arb/placeholder-page";

function buildBullets(activeStep: ArbReviewStepKey, findings: ArbFindingSummary[]) {
  switch (activeStep) {
    case "upload":
      return [
        "Upload SOW, design docs, and supporting artifacts",
        "Register logical file category and evidence readiness",
        "Prepare extraction pipeline handoff"
      ];
    case "requirements":
      return [
        "Review extracted requirements",
        "Correct category, criticality, and normalized text",
        "Accept or reject weak extractions"
      ];
    case "evidence":
      return [
        "Compare requirements to extracted design evidence",
        "Adjust match states and rationale",
        "Open source excerpts for traceability"
      ];
    case "findings":
      return findings.length > 0
        ? findings.map((finding) => `[${finding.severity}] ${finding.title}`)
        : [
            "Load structured findings from the API",
            "Filter by severity and domain",
            "Assign owners and due dates"
          ];
    case "scorecard":
      return [
        "Show weighted domain scores",
        "Link score rationale to findings",
        "Display recommendation and confidence"
      ];
    case "decision":
      return [
        "Show AI recommendation and blocker summary",
        "Capture reviewer decision and rationale",
        "Track conditions and must-fix actions"
      ];
    default:
      return [
        "Show review summary and workflow state",
        "Link to each ARB review step",
        "Prepare navigation into the live workflow"
      ];
  }
}

export function ArbLiveReviewStep(props: {
  reviewId: string;
  activeStep: ArbReviewStepKey;
  title: string;
  description: string;
}) {
  const { reviewId, activeStep, title, description } = props;
  const [review, setReview] = useState<ArbReviewSummary | null>(null);
  const [findings, setFindings] = useState<ArbFindingSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const reviewResponse = await fetchArbReview(reviewId);
        const findingsResponse = activeStep === "findings" ? await fetchArbFindings(reviewId) : [];

        if (!cancelled) {
          setReview(reviewResponse);
          setFindings(findingsResponse);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load ARB review state.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reviewId, activeStep]);

  const shellReview =
    review ??
    ({
      reviewId,
      projectName: "Loading ARB review",
      customerName: "",
      workflowState: "Draft",
      evidenceReadinessState: "Ready with Gaps",
      overallScore: null,
      recommendation: "Loading",
      assignedReviewer: null
    } satisfies ArbReviewSummary);

  return (
    <ArbReviewShell
      review={shellReview}
      steps={getArbReviewSteps(reviewId)}
      activeStep={activeStep}
      title={title}
      description={description}
    >
      {loading ? (
        <p>Loading ARB review state...</p>
      ) : error ? (
        <div>
          <p>{error}</p>
          <p>This scaffold expects the Function App ARB endpoints to be available.</p>
        </div>
      ) : (
        <ArbPlaceholderPage intro="This page is now wired to live ARB API stubs." bullets={buildBullets(activeStep, findings)} />
      )}
    </ArbReviewShell>
  );
}
