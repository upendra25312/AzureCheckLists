import type { ArbReviewStep, ArbReviewSummary } from "@/arb/types";

export function getArbReviewSteps(reviewId: string): ArbReviewStep[] {
  return [
    { key: "overview", label: "Overview", href: `/arb/${reviewId}` },
    { key: "upload", label: "Upload", href: `/arb/${reviewId}/upload` },
    { key: "requirements", label: "Requirements", href: `/arb/${reviewId}/requirements` },
    { key: "evidence", label: "Evidence", href: `/arb/${reviewId}/evidence` },
    { key: "findings", label: "Findings", href: `/arb/${reviewId}/findings` },
    { key: "scorecard", label: "Scorecard", href: `/arb/${reviewId}/scorecard` },
    { key: "decision", label: "Decision", href: `/arb/${reviewId}/decision` }
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
    recommendation: "Approved with Conditions",
    assignedReviewer: null
  };
}
