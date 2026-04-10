import { ArbReviewShell } from "@/components/arb/review-shell";
import { ArbPlaceholderPage } from "@/components/arb/placeholder-page";
import { getArbReviewSteps, getMockArbReviewSummary } from "@/arb/mock-review";

export default function ArbReviewOverviewPage({ params }: { params: { reviewId: string } }) {
  const review = getMockArbReviewSummary(params.reviewId);
  const steps = getArbReviewSteps(params.reviewId);

  return (
    <ArbReviewShell
      review={review}
      steps={steps}
      activeStep="overview"
      title="ARB Review Overview"
      description="Overview scaffold for the ARB workflow."
    >
      <ArbPlaceholderPage
        intro="This overview page is the landing point for a specific review package."
        bullets={[
          "Show review summary and workflow state",
          "Show evidence readiness status",
          "Link to upload, findings, scorecard, and decision steps"
        ]}
      />
    </ArbReviewShell>
  );
}
