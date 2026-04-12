import { getArbStepHref } from "@/arb/routes";
import type { ArbReviewStep, ArbReviewSummary } from "@/arb/types";

export function getArbReviewSteps(reviewId: string): ArbReviewStep[] {
  return [
    { key: "overview", label: "Overview", href: getArbStepHref(reviewId, "overview") },
    { key: "upload", label: "Upload", href: getArbStepHref(reviewId, "upload") },
    { key: "requirements", label: "Requirements", href: getArbStepHref(reviewId, "requirements") },
    { key: "evidence", label: "Evidence", href: getArbStepHref(reviewId, "evidence") },
    { key: "findings", label: "Findings", href: getArbStepHref(reviewId, "findings") },
    { key: "scorecard", label: "Scorecard", href: getArbStepHref(reviewId, "scorecard") },
    { key: "decision", label: "Decision", href: getArbStepHref(reviewId, "decision") }
  ];
}

export function getMockArbReviewSummary(reviewId: string): ArbReviewSummary {
  return {
    reviewId,
    projectName: "Sample ARB Review",
    customerName: "Contoso",
    workflowState: "Review In Progress",
    evidenceReadinessState: "Ready with Gaps",
    overallScore: 78,
    recommendation: "Needs Revision",
    assignedReviewer: null
  };
}
