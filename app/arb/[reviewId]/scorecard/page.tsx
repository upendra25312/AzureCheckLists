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
      activeStep="scorecard"
      title="Scorecard"
      description="Review the weighted rationale, open conditions, and recommendation before final sign-off."
    />
  );
}
