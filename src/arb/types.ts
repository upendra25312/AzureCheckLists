export type ArbWorkflowState =
  | "Draft"
  | "Evidence Ready"
  | "Review In Progress"
  | "Review Complete"
  | "Approved"
  | "Approved with Conditions"
  | "Needs Improvement"
  | "Closed";

export type ArbEvidenceReadiness =
  | "Ready for Review"
  | "Ready with Gaps"
  | "Insufficient Evidence";

export type ArbReviewStepKey =
  | "overview"
  | "upload"
  | "requirements"
  | "evidence"
  | "findings"
  | "scorecard"
  | "decision";

export interface ArbReviewStep {
  key: ArbReviewStepKey;
  label: string;
  href: string;
}

export interface ArbReviewSummary {
  reviewId: string;
  projectName: string;
  customerName: string;
  workflowState: ArbWorkflowState;
  evidenceReadinessState: ArbEvidenceReadiness;
  overallScore: number | null;
  recommendation: string;
  assignedReviewer: string | null;
}
