import { ArbReviewShell } from "@/components/arb/review-shell";
import { ArbPlaceholderPage } from "@/components/arb/placeholder-page";
import { getArbReviewSteps, getMockArbReviewSummary } from "@/arb/mock-review";

export default function Page({ params }: { params: { reviewId: string } }) {
  const review = getMockArbReviewSummary(params.reviewId);
  const steps = getArbReviewSteps(params.reviewId);

  return (
    <ArbReviewShell review={review} steps={steps} activeStep="scorecard" title="Scorecard" description="Scaffold for weighted score and rationale.">
      <ArbPlaceholderPage intro="This route will host the explainable ARB scorecard." bullets={["Show domain scores", "Link scores to findings", "Show overall recommendation and confidence"]} />
    </ArbReviewShell>
  );
}
