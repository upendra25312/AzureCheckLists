import type {
  ChecklistItem,
  ReviewDraft,
  ReviewRecordDocument,
  StaticWebAppClientPrincipal,
  StructuredReviewRecord
} from "@/types";

type AuthMeResponse =
  | {
      clientPrincipal?: StaticWebAppClientPrincipal | null;
    }
  | Array<{
      clientPrincipal?: StaticWebAppClientPrincipal | null;
    }>;

function isMeaningfulReview(review: ReviewDraft | undefined) {
  if (!review) {
    return false;
  }

  return (
    review.reviewState !== "Not Reviewed" ||
    review.packageDecision !== "Needs Review" ||
    review.comments.trim().length > 0 ||
    review.owner.trim().length > 0 ||
    review.dueDate.trim().length > 0 ||
    review.evidenceLinks.length > 0 ||
    review.exceptionReason.trim().length > 0
  );
}

export function buildStructuredReviewRecords(
  items: ChecklistItem[],
  reviews: Record<string, ReviewDraft>
) {
  const itemsByGuid = new Map(items.map((item) => [item.guid, item]));

  return Object.entries(reviews)
    .filter(([, review]) => isMeaningfulReview(review))
    .map(([guid, review]) => {
      const item = itemsByGuid.get(guid);

      if (!item) {
        return null;
      }

      return {
        guid: item.guid,
        technology: item.technology,
        technologySlug: item.technologySlug,
        technologyStatus: item.technologyStatus,
        technologyMaturityBucket: item.technologyMaturityBucket,
        severity: item.severity,
        waf: item.waf,
        category: item.category,
        subcategory: item.subcategory,
        service: item.service,
        serviceCanonical: item.serviceCanonical,
        sourcePath: item.sourcePath,
        sourceUrl: item.sourceUrl,
        text: item.text,
        review,
        updatedAt: new Date().toISOString()
      } satisfies StructuredReviewRecord;
    })
    .filter(Boolean) as StructuredReviewRecord[];
}

export function structuredRecordsToReviewMap(records: StructuredReviewRecord[]) {
  return records.reduce<Record<string, ReviewDraft>>((accumulator, record) => {
    accumulator[record.guid] = record.review;
    return accumulator;
  }, {});
}

function parseClientPrincipal(payload: AuthMeResponse) {
  if (Array.isArray(payload)) {
    return payload[0]?.clientPrincipal ?? null;
  }

  return payload?.clientPrincipal ?? null;
}

export async function fetchClientPrincipal() {
  const response = await fetch("/.auth/me", {
    credentials: "same-origin",
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as AuthMeResponse;
  return parseClientPrincipal(payload);
}

async function parseJsonResponse<T>(response: Response) {
  if (!response.ok) {
    const message = await response.text();

    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function loadCloudReviewRecords() {
  const response = await fetch("/api/review-records", {
    credentials: "same-origin",
    cache: "no-store"
  });

  return parseJsonResponse<ReviewRecordDocument>(response);
}

export async function saveCloudReviewRecords(records: StructuredReviewRecord[]) {
  const response = await fetch("/api/review-records", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "same-origin",
    body: JSON.stringify({ records })
  });

  return parseJsonResponse<ReviewRecordDocument>(response);
}

function getFilenameFromDisposition(value: string | null) {
  if (!value) {
    return null;
  }

  const match = /filename="?([^"]+)"?/i.exec(value);
  return match?.[1] ?? null;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export async function downloadCloudReviewCsv(records: StructuredReviewRecord[]) {
  const response = await fetch("/api/review-records/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "same-origin",
    body: JSON.stringify({ records })
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const filename =
    getFilenameFromDisposition(response.headers.get("Content-Disposition")) ??
    "azure-review-notes.csv";

  downloadBlob(filename, blob);

  return {
    filename,
    artifactPath: response.headers.get("X-Review-Artifact-Path") ?? undefined
  };
}
