import type { Route } from "next";
import type { ArbReviewStep, ArbReviewSummary } from "@/arb/types";

export function getArbReviewSteps(reviewId: string): ArbReviewStep[] {
  return [
    { key: "overview", label: "Overview", href: `/arb/${reviewId}` as Route },
    { key: "upload", label: "Upload", href: `/arb/${reviewId}/upload` as Route },
    { key: "requirements", label: "Requirements", href: `/arb/${reviewId}/requirements` as Route },
    { key: "evidence", label: "Evidence", href: `/arb/${reviewId}/evidence` as Route },
    { key: "findings", label: "Findings", href: `/arb/${reviewId}/findings` as Route },
    { key: "scorecard", label: "Scorecard", href: `/arb/${reviewId}/scorecard` as Route },
    { key: "decision", label: "Decision", href: `/arb/${reviewId}/decision` as Route }
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
