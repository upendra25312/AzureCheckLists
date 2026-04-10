import type { ArbReviewSummary } from "@/arb/types";

export type ArbFindingSummary = {
  findingId: string;
  reviewId: string;
  severity: string;
  domain: string;
  title: string;
  status: string;
};

export async function fetchArbReview(reviewId: string): Promise<ArbReviewSummary> {
  const response = await fetch(`/api/arb/reviews/${reviewId}`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Unable to load ARB review (${response.status}).`);
  }

  const payload = (await response.json()) as { review: ArbReviewSummary };
  return payload.review;
}

export async function fetchArbFindings(reviewId: string): Promise<ArbFindingSummary[]> {
  const response = await fetch(`/api/arb/reviews/${reviewId}/findings`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Unable to load ARB findings (${response.status}).`);
  }

  const payload = (await response.json()) as { findings: ArbFindingSummary[] };
  return payload.findings;
}
