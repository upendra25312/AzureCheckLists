import { ArbReviewShell } from "@/components/arb/review-shell";
import { ArbPlaceholderPage } from "@/components/arb/placeholder-page";
import { getArbReviewSteps, getMockArbReviewSummary } from "@/arb/mock-review";

export default function Page({ params }: { params: { reviewId: string } }) {
  const review = getMockArbReviewSummary(params.reviewId);
  const steps = getArbReviewSteps(params.reviewId);

  return (
    <ArbReviewShell review={review} steps={steps} activeStep="requirements" title="Requirements" description="Scaffold for extracted requirement review.">
      <ArbPlaceholderPage intro="This route will host requirement extraction review." bullets={["List normalized requirements", "Allow accept and edit actions", "Preserve source and confidence"]} />
    </ArbReviewShell>
  );
}
