import type {
  ArbAction,
  ArbDecision,
  ArbFinding,
  ArbReviewLibraryResponse,
  ArbReviewSummary,
  ArbScorecard
} from "@/arb/types";

async function readJsonResponse<T>(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    let message = fallbackMessage;

    try {
      const payload = (await response.json()) as { error?: string };
      message = payload.error || fallbackMessage;
    } catch {
      message = fallbackMessage;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function fetchArbReview(reviewId: string): Promise<ArbReviewSummary> {
  const response = await fetch(`/api/arb/reviews/${reviewId}`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  const payload = await readJsonResponse<{ review: ArbReviewSummary }>(
    response,
    `Unable to load ARB review (${response.status}).`
  );
  return payload.review;
}

export async function listArbReviews(): Promise<ArbReviewLibraryResponse> {
  const response = await fetch("/api/arb/reviews", {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  return readJsonResponse<ArbReviewLibraryResponse>(
    response,
    `Unable to load ARB reviews (${response.status}).`
  );
}

export async function createArbReview(input: {
  projectName: string;
  customerName: string;
  projectCode?: string;
}): Promise<ArbReviewSummary> {
  const response = await fetch("/api/arb/reviews", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const payload = await readJsonResponse<{ review: ArbReviewSummary }>(
    response,
    `Unable to create ARB review (${response.status}).`
  );

  return payload.review;
}

export async function fetchArbFindings(reviewId: string): Promise<ArbFinding[]> {
  const response = await fetch(`/api/arb/reviews/${reviewId}/findings`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  const payload = await readJsonResponse<{ findings: ArbFinding[] }>(
    response,
    `Unable to load ARB findings (${response.status}).`
  );
  return payload.findings;
}

export async function updateArbFinding(input: {
  reviewId: string;
  findingId: string;
  status: string;
  owner: string | null;
  dueDate: string | null;
  reviewerNote: string | null;
  criticalBlocker: boolean;
}): Promise<ArbFinding> {
  const response = await fetch(
    `/api/arb/reviews/${input.reviewId}/findings/${input.findingId}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: input.status,
        owner: input.owner,
        dueDate: input.dueDate,
        reviewerNote: input.reviewerNote,
        criticalBlocker: input.criticalBlocker
      })
    }
  );

  const payload = await readJsonResponse<{ finding: ArbFinding }>(
    response,
    `Unable to update ARB finding (${response.status}).`
  );
  return payload.finding;
}

export async function fetchArbActions(reviewId: string): Promise<ArbAction[]> {
  const response = await fetch(`/api/arb/reviews/${reviewId}/actions`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  const payload = await readJsonResponse<{ actions: ArbAction[] }>(
    response,
    `Unable to load ARB actions (${response.status}).`
  );
  return payload.actions;
}

export async function createArbAction(input: {
  reviewId: string;
  sourceFindingId: string;
}): Promise<ArbAction> {
  const response = await fetch(`/api/arb/reviews/${input.reviewId}/actions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sourceFindingId: input.sourceFindingId
    })
  });

  const payload = await readJsonResponse<{ action: ArbAction }>(
    response,
    `Unable to create ARB action (${response.status}).`
  );
  return payload.action;
}

export async function updateArbAction(input: {
  reviewId: string;
  actionId: string;
  owner: string | null;
  dueDate: string | null;
  status: string;
  closureNotes: string | null;
  reviewerVerificationRequired: boolean;
}): Promise<ArbAction> {
  const response = await fetch(`/api/arb/reviews/${input.reviewId}/actions/${input.actionId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      owner: input.owner,
      dueDate: input.dueDate,
      status: input.status,
      closureNotes: input.closureNotes,
      reviewerVerificationRequired: input.reviewerVerificationRequired
    })
  });

  const payload = await readJsonResponse<{ action: ArbAction }>(
    response,
    `Unable to update ARB action (${response.status}).`
  );
  return payload.action;
}

export async function fetchArbScorecard(reviewId: string): Promise<ArbScorecard> {
  const response = await fetch(`/api/arb/reviews/${reviewId}/scorecard`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  const payload = await readJsonResponse<{ scorecard: ArbScorecard }>(
    response,
    `Unable to load ARB scorecard (${response.status}).`
  );
  return payload.scorecard;
}

export async function fetchArbDecision(reviewId: string): Promise<ArbDecision | null> {
  const response = await fetch(`/api/arb/reviews/${reviewId}/decision`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  const payload = await readJsonResponse<{ decision: ArbDecision | null }>(
    response,
    `Unable to load ARB decision (${response.status}).`
  );

  return payload.decision;
}

export async function recordArbDecision(input: {
  reviewId: string;
  finalDecision: string;
  rationale: string;
}): Promise<ArbDecision> {
  const response = await fetch(`/api/arb/reviews/${input.reviewId}/decision`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      finalDecision: input.finalDecision,
      rationale: input.rationale
    })
  });

  const payload = await readJsonResponse<{ decision: ArbDecision }>(
    response,
    `Unable to record ARB decision (${response.status}).`
  );
  return payload.decision;
}
