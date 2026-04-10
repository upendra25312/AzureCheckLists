import { ArbReviewShell } from "@/components/arb/review-shell";
import { ArbPlaceholderPage } from "@/components/arb/placeholder-page";
import { getArbReviewSteps, getMockArbReviewSummary } from "@/arb/mock-review";

export default function Page({ params }: { params: { reviewId: string } }) {
  const review = getMockArbReviewSummary(params.reviewId);
  const steps = getArbReviewSteps(params.reviewId);

  return (
    <ArbReviewShell review={review} steps={steps} activeStep="findings" title="Findings" description="Scaffold for evidence-backed findings and action management.">
      <ArbPlaceholderPage intro="This route will host the main findings workspace." bullets={["Show severity, domain, evidence, and recommendation", "Show owner and due date", "Allow filtering by blocker and missing evidence"]} />
    </ArbReviewShell>
  );
}
