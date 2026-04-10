import { ArbReviewShell } from "@/components/arb/review-shell";
import { ArbPlaceholderPage } from "@/components/arb/placeholder-page";
import { getArbReviewSteps, getMockArbReviewSummary } from "@/arb/mock-review";

export default function Page({ params }: { params: { reviewId: string } }) {
  const review = getMockArbReviewSummary(params.reviewId);
  const steps = getArbReviewSteps(params.reviewId);

  return (
    <ArbReviewShell review={review} steps={steps} activeStep="evidence" title="Evidence Mapping" description="Scaffold for requirement-to-evidence mapping.">
      <ArbPlaceholderPage intro="This route will host evidence mapping and match-state review." bullets={["Show requirements and evidence side by side", "Show match states", "Open source excerpts for traceability"]} />
    </ArbReviewShell>
  );
}
