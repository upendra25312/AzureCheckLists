import { ArbReviewShell } from "@/components/arb/review-shell";
import { ArbPlaceholderPage } from "@/components/arb/placeholder-page";
import { getArbReviewSteps, getMockArbReviewSummary } from "@/arb/mock-review";

export default function ArbUploadPage({ params }: { params: { reviewId: string } }) {
  const review = getMockArbReviewSummary(params.reviewId);
  const steps = getArbReviewSteps(params.reviewId);

  return (
    <ArbReviewShell
      review={review}
      steps={steps}
      activeStep="upload"
      title="Upload Review Package"
      description="Scaffold for package upload, file registration, and evidence readiness."
    >
      <ArbPlaceholderPage
        intro="This step will collect SOW, design, diagram, and supporting artifacts."
        bullets={[
          "Add drag-and-drop upload zone",
          "Register logical file category",
          "Show evidence checklist and readiness badge"
        ]}
      />
    </ArbReviewShell>
  );
}
