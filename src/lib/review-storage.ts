import type { ExplorerFilters, ReviewDraft } from "@/types";

export const STORAGE_KEYS = {
  theme: "azure-review-dashboard.theme",
  reviews: "azure-review-dashboard.reviews",
  filters: "azure-review-dashboard.filters"
} as const;

export function createEmptyReview(): ReviewDraft {
  return {
    reviewState: "Not Reviewed",
    comments: "",
    owner: "",
    dueDate: "",
    evidenceLinks: [],
    exceptionReason: ""
  };
}

export function loadReviews() {
  if (typeof window === "undefined") {
    return {} as Record<string, ReviewDraft>;
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.reviews);

  if (!raw) {
    return {} as Record<string, ReviewDraft>;
  }

  try {
    return JSON.parse(raw) as Record<string, ReviewDraft>;
  } catch {
    return {} as Record<string, ReviewDraft>;
  }
}

export function saveReviews(reviews: Record<string, ReviewDraft>) {
  window.localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
}

export function clearReviews() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.reviews);
}

export function loadFilters() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.filters);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ExplorerFilters;
  } catch {
    return null;
  }
}

export function saveFilters(filters: ExplorerFilters) {
  window.localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters));
}
