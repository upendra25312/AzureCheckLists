import { ArbLiveReviewStep } from "@/components/arb/live-review-step";

type PageProps = {
  params: Promise<{
    reviewId: string;
  }>;
};

export function generateStaticParams() {
  return [{ reviewId: "demo-review" }];
}

export default async function Page({ params }: PageProps) {
  const { reviewId } = await params;

  return (
    <ArbLiveReviewStep
      reviewId={reviewId}
      activeStep="findings"
      title="Review Findings"
      description="Work from blockers, missing evidence, owners, and remediation actions before scoring."
    />
  );
}
