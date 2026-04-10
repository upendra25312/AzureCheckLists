import { ArbReviewShell } from "@/components/arb/review-shell";
import { ArbPlaceholderPage } from "@/components/arb/placeholder-page";
import { getArbReviewSteps, getMockArbReviewSummary } from "@/arb/mock-review";

export default function Page({ params }: { params: { reviewId: string } }) {
  const review = getMockArbReviewSummary(params.reviewId);
  const steps = getArbReviewSteps(params.reviewId);

  return (
    <ArbReviewShell review={review} steps={steps} activeStep="decision" title="Decision Center" description="Scaffold for reviewer decision and sign-off.">
      <ArbPlaceholderPage intro="This route will host AI recommendation review and final decision logging." bullets={["Show AI recommendation and score", "Capture reviewer decision and rationale", "Show conditions and must-fix actions"]} />
    </ArbReviewShell>
  );
}
