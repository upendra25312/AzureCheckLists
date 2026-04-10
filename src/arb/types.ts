import type { Route } from "next";

export type ArbWorkflowState =
  | "Draft"
  | "Evidence Ready"
  | "Review In Progress"
  | "Decision Recorded"
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
  href: Route;
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
  createdByUserId?: string;
  createdAt?: string;
  finalDecision?: string | null;
  lastUpdated?: string;
}

export interface ArbReviewLibraryResponse {
  reviews: ArbReviewSummary[];
}

export interface ArbFindingReference {
  title: string;
  url?: string;
  relevance?: string;
}

export interface ArbFinding {
  findingId: string;
  reviewId: string;
  severity: string;
  domain: string;
  findingType: string;
  title: string;
  findingStatement: string;
  whyItMatters: string;
  evidenceFound: string[];
  missingEvidence: string[];
  recommendation: string;
  references: ArbFindingReference[];
  confidence: string;
  criticalBlocker: boolean;
  suggestedOwner: string | null;
  suggestedDueDate: string | null;
  owner: string | null;
  dueDate: string | null;
  reviewerNote: string | null;
  status: string;
}

export interface ArbAction {
  actionId: string;
  reviewId: string;
  sourceFindingId: string;
  actionSummary: string;
  owner: string | null;
  dueDate: string | null;
  severity: string;
  status: string;
  closureNotes: string | null;
  reviewerVerificationRequired: boolean;
  createdAt: string;
}

export interface ArbDomainScore {
  domain: string;
  weight: number;
  score: number;
  reason: string;
  linkedFindings: string[];
}

export interface ArbReviewerOverride {
  reviewerName: string;
  overrideDecision: string;
  overrideRationale: string;
  overriddenAt: string;
}

export interface ArbScorecard {
  overallScore: number | null;
  recommendation: string;
  confidence: string;
  criticalBlockers: number;
  evidenceReadinessState: ArbEvidenceReadiness;
  domainScores: ArbDomainScore[];
  reviewerOverride: ArbReviewerOverride | null;
}

export interface ArbDecision {
  aiRecommendation: string;
  reviewerDecision: string;
  rationale: string;
  recordedAt: string;
}
