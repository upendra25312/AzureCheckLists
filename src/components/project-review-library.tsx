"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  activateCloudProjectReview,
  archiveCloudProjectReview,
  buildLoginUrl,
  deleteCloudProjectReview,
  fetchClientPrincipal,
  listCloudProjectReviews,
  purgeCloudProjectReview,
  restoreDeletedCloudProjectReview
} from "@/lib/review-cloud";
import type {
  ProjectReviewLibraryResponse,
  SavedProjectReviewSummary,
  StaticWebAppClientPrincipal
} from "@/types";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US");
}

function formatProvider(provider: string | undefined) {
  switch ((provider ?? "").toLowerCase()) {
    case "aad":
    case "azureactivedirectory":
      return "Microsoft";
    default:
      return provider || "Account";
  }
}

type ReviewSortMode = "updated-desc" | "created-desc" | "name-asc" | "pending-desc";
type ReviewFilterMode = "active" | "archived" | "deleted" | "all";
type ReviewAction = "archive" | "delete" | "purge";

function reviewMatchesSearch(review: SavedProjectReviewSummary, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return [
    review.name,
    review.audience,
    review.businessScope,
    review.targetRegions.join(" ")
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function compareReviews(left: SavedProjectReviewSummary, right: SavedProjectReviewSummary, sortMode: ReviewSortMode) {
  switch (sortMode) {
    case "created-desc":
      return String(right.createdAt).localeCompare(String(left.createdAt));
    case "name-asc":
      return left.name.localeCompare(right.name);
    case "pending-desc":
      return right.pendingCount - left.pendingCount || String(right.updatedAt).localeCompare(String(left.updatedAt));
    case "updated-desc":
    default:
      return String(right.updatedAt).localeCompare(String(left.updatedAt));
  }
}

export function ProjectReviewLibrary() {
  const [principal, setPrincipal] = useState<StaticWebAppClientPrincipal | null>(null);
  const [payload, setPayload] = useState<ProjectReviewLibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingReviewId, setActivatingReviewId] = useState<string | null>(null);
  const [workingReviewId, setWorkingReviewId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<ReviewSortMode>("updated-desc");
  const [filterMode, setFilterMode] = useState<ReviewFilterMode>("active");
  const [confirmAction, setConfirmAction] = useState<{
    reviewId: string;
    action: ReviewAction;
  } | null>(null);

  async function refreshLibrary() {
    const nextPayload = await listCloudProjectReviews();
    setPayload(nextPayload);
  }

  useEffect(() => {
    let active = true;

    async function loadLibrary() {
      try {
        const nextPrincipal = await fetchClientPrincipal();

        if (!active) {
          return;
        }

        setPrincipal(nextPrincipal);

        if (!nextPrincipal) {
          setLoading(false);
          return;
        }

        const nextPayload = await listCloudProjectReviews();

        if (!active) {
          return;
        }

        setPayload(nextPayload);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to load your saved project reviews."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadLibrary();

    return () => {
      active = false;
    };
  }, []);

  const filteredReviews = useMemo(() => {
    const reviews = payload?.reviews ?? [];

    return reviews
      .filter((review) => {
        if (filterMode === "active") {
          return !review.isArchived && !review.isDeleted;
        }

        if (filterMode === "archived") {
          return review.isArchived && !review.isDeleted;
        }

        if (filterMode === "deleted") {
          return review.isDeleted;
        }

        return true;
      })
      .filter((review) => reviewMatchesSearch(review, search))
      .sort((left, right) => compareReviews(left, right, sortMode));
  }, [filterMode, payload?.reviews, search, sortMode]);

  const reviewStateCounts = useMemo(() => {
    const reviews = payload?.reviews ?? [];

    return {
      active: reviews.filter((review) => !review.isArchived && !review.isDeleted).length,
      archived: reviews.filter((review) => review.isArchived && !review.isDeleted).length,
      deleted: reviews.filter((review) => review.isDeleted).length
    };
  }, [payload?.reviews]);

  async function openReview(review: SavedProjectReviewSummary) {
    try {
      setActivatingReviewId(review.id);
      setError(null);
      await activateCloudProjectReview(review.id);
      window.location.href = `/review-package?cloudReviewId=${encodeURIComponent(review.id)}`;
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to activate the selected project review."
      );
      setActivatingReviewId(null);
    }
  }

  async function handleArchiveToggle(review: SavedProjectReviewSummary, archived: boolean) {
    try {
      setWorkingReviewId(review.id);
      setError(null);
      await archiveCloudProjectReview(review.id, archived);
      await refreshLibrary();
      setConfirmAction(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : archived
            ? "Unable to archive the selected project review."
            : "Unable to restore the selected project review."
      );
    } finally {
      setWorkingReviewId(null);
    }
  }

  async function handleDelete(review: SavedProjectReviewSummary) {
    try {
      setWorkingReviewId(review.id);
      setError(null);
      await deleteCloudProjectReview(review.id);
      await refreshLibrary();
      setConfirmAction(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to delete the selected project review."
      );
    } finally {
      setWorkingReviewId(null);
    }
  }

  async function handleRestoreDeleted(review: SavedProjectReviewSummary) {
    try {
      setWorkingReviewId(review.id);
      setError(null);
      await restoreDeletedCloudProjectReview(review.id);
      await refreshLibrary();
      setConfirmAction(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to restore the deleted project review."
      );
    } finally {
      setWorkingReviewId(null);
    }
  }

  async function handlePurge(review: SavedProjectReviewSummary) {
    try {
      setWorkingReviewId(review.id);
      setError(null);
      await purgeCloudProjectReview(review.id);
      await refreshLibrary();
      setConfirmAction(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to permanently delete the selected project review."
      );
    } finally {
      setWorkingReviewId(null);
    }
  }

  return (
    <main className="section-stack">
      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">My project reviews</p>
            <h1 className="section-title">Resume the Azure project reviews you already saved.</h1>
            <p className="section-copy">
              This list uses the low-cost Azure Table Storage review index for the signed-in user,
              while detailed review payloads stay in Azure Storage for resume and copilot grounding.
            </p>
          </div>
          <div className="button-row">
            <Link href="/review-package" className="primary-button">
              Open project review
            </Link>
          </div>
        </div>

        {loading ? (
          <section className="filter-card">
            <p className="eyebrow">Loading</p>
            <h3>Checking your sign-in state and saved project reviews.</h3>
            <p className="microcopy">
              Once you sign in, this page lists the project reviews saved against your account.
            </p>
          </section>
        ) : null}

        {!loading && !principal ? (
          <section className="filter-card">
            <p className="eyebrow">Sign in</p>
            <h3>Sign in with Microsoft to see your saved project reviews.</h3>
            <p className="microcopy">
              Local browsing still works without sign-in, but cloud-backed review history and resume
              need an authenticated identity.
            </p>
            <div className="button-row">
              <a href={buildLoginUrl("aad")} className="primary-button">
                Continue with Microsoft
              </a>
            </div>
          </section>
        ) : null}

        {!loading && payload?.user ? (
          <section className="filter-card">
            <p className="eyebrow">Signed in identity</p>
            <h3>{payload.user.email}</h3>
            <p className="microcopy">
              Signed in with {formatProvider(payload.user.provider)}. The active saved review is{" "}
              {payload.user.activeReviewId ?? "not set"}.
            </p>
            <div className="button-row">
              <a href="/.auth/logout" className="ghost-button">
                Sign out
              </a>
            </div>
          </section>
        ) : null}

        {!loading && payload && payload.reviews.length === 0 ? (
          <section className="filter-card">
            <p className="eyebrow">No saved reviews yet</p>
            <h3>Save your first project review from the main workspace.</h3>
            <p className="microcopy">
              Once you save a review to Azure, it appears here so you can reopen it later without
              rebuilding the full context.
            </p>
          </section>
        ) : null}

        {!loading && payload && payload.reviews.length > 0 ? (
          <>
            <section className="filter-card workspace-toolbar board-toolbar-card">
              <div className="workspace-toolbar-main">
                <input
                  className="search-input"
                  type="search"
                  placeholder="Search reviews by name, audience, scope, or target region"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <p className="microcopy">
                  {filteredReviews.length.toLocaleString()} review
                  {filteredReviews.length === 1 ? "" : "s"} shown from {payload.reviews.length.toLocaleString()} saved in Azure.
                </p>
              </div>
              <div className="workspace-toolbar-side">
                <label className="filter-field">
                  <span className="microcopy">Filter</span>
                  <select
                    className="field-select"
                    value={filterMode}
                    onChange={(event) => setFilterMode(event.target.value as ReviewFilterMode)}
                  >
                    <option value="active">Active library</option>
                    <option value="archived">Archived</option>
                    <option value="deleted">Deleted</option>
                    <option value="all">All reviews</option>
                  </select>
                </label>
                <label className="filter-field">
                  <span className="microcopy">Sort</span>
                  <select
                    className="field-select"
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as ReviewSortMode)}
                  >
                    <option value="updated-desc">Last updated</option>
                    <option value="created-desc">Created date</option>
                    <option value="pending-desc">Most pending items</option>
                    <option value="name-asc">Name A-Z</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="filter-card">
              <p className="eyebrow">Review lifecycle</p>
              <h3>Archive hides a review from the active library. Delete moves it into a recoverable holding state.</h3>
              <p className="microcopy">
                Use archive for work you want to keep but pause. Use deleted when the review should leave the main library. Permanently delete only after you are sure it should no longer be recoverable.
              </p>
              <div className="chip-row board-summary-row">
                <span className="chip">Active {reviewStateCounts.active.toLocaleString()}</span>
                <span className="chip">Archived {reviewStateCounts.archived.toLocaleString()}</span>
                <span className="chip">Deleted {reviewStateCounts.deleted.toLocaleString()}</span>
              </div>
            </section>

            {filteredReviews.length === 0 ? (
              <section className="filter-card">
                <p className="eyebrow">No matches</p>
                <h3>No saved reviews match the current search or filter.</h3>
                <p className="microcopy">
                  Clear the search term, switch the archive filter, or open the main workspace to save a new review.
                </p>
              </section>
            ) : null}

            <div className="service-selection-grid">
            {filteredReviews.map((review) => (
              <article className="future-card service-selection-card" key={review.id}>
                <div className="section-head board-card-head">
                  <div className="board-card-head-copy">
                    <p className="eyebrow">
                      {review.isDeleted
                        ? "Deleted review"
                        : review.isArchived
                        ? "Archived review"
                        : review.isActive
                          ? "Active saved review"
                          : "Saved review"}
                    </p>
                    <h3>{review.name}</h3>
                  </div>
                  <span className="chip">{review.audience}</span>
                </div>
                <p className="microcopy">
                  {review.serviceCount.toLocaleString()} services,{" "}
                  {review.recordCount.toLocaleString()} saved findings, and{" "}
                  {review.pendingCount.toLocaleString()} items still pending.
                </p>
                <div className="chip-row board-summary-row">
                  {review.isDeleted ? (
                    <span className="chip">
                      Deleted {review.deletedAt ? formatDate(review.deletedAt) : "in Azure"}
                    </span>
                  ) : null}
                  {review.isArchived ? (
                    <span className="chip">
                      Archived {review.archivedAt ? formatDate(review.archivedAt) : "in Azure"}
                    </span>
                  ) : null}
                  <span className="chip">
                    Regions: {review.targetRegions.join(", ") || "Not captured"}
                  </span>
                  <span className="chip">Updated {formatDate(review.updatedAt)}</span>
                </div>
                {review.businessScope ? <p className="microcopy">{review.businessScope}</p> : null}
                <div className="button-row board-action-row-compact">
                  {!review.isArchived && !review.isDeleted ? (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={activatingReviewId === review.id || workingReviewId === review.id}
                      onClick={() => void openReview(review)}
                    >
                      {activatingReviewId === review.id ? "Opening..." : "Open this review"}
                    </button>
                  ) : null}
                  <Link href="/review-package" className="ghost-button">
                    Open workspace
                  </Link>
                  {confirmAction?.reviewId === review.id && confirmAction.action === "archive" ? (
                    <>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={workingReviewId === review.id}
                        onClick={() => void handleArchiveToggle(review, true)}
                      >
                        {workingReviewId === review.id ? "Archiving..." : "Confirm archive"}
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => setConfirmAction(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                  {confirmAction?.reviewId === review.id && confirmAction.action === "delete" ? (
                    <>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={workingReviewId === review.id}
                        onClick={() => void handleDelete(review)}
                      >
                        {workingReviewId === review.id ? "Deleting..." : "Confirm delete"}
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => setConfirmAction(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                  {confirmAction?.reviewId === review.id && confirmAction.action === "purge" ? (
                    <>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={workingReviewId === review.id}
                        onClick={() => void handlePurge(review)}
                      >
                        {workingReviewId === review.id ? "Purging..." : "Confirm permanent delete"}
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => setConfirmAction(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                  {confirmAction?.reviewId !== review.id ? (
                    <>
                      {review.isDeleted ? (
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={workingReviewId === review.id}
                          onClick={() => void handleRestoreDeleted(review)}
                        >
                          {workingReviewId === review.id ? "Restoring..." : "Restore to library"}
                        </button>
                      ) : review.isArchived ? (
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={workingReviewId === review.id}
                          onClick={() => void handleArchiveToggle(review, false)}
                        >
                          {workingReviewId === review.id ? "Restoring..." : "Restore to library"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={workingReviewId === review.id}
                          onClick={() => setConfirmAction({ reviewId: review.id, action: "archive" })}
                        >
                          {review.isActive ? "Archive active review" : "Archive review"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={workingReviewId === review.id}
                        onClick={() =>
                          setConfirmAction({
                            reviewId: review.id,
                            action: review.isDeleted ? "purge" : "delete"
                          })
                        }
                      >
                        {review.isDeleted ? "Delete permanently" : "Move to deleted"}
                      </button>
                    </>
                  ) : null}
                </div>
                {review.isActive ? (
                  <p className="microcopy">This review is the current Azure-backed active review for your account.</p>
                ) : null}
                {review.isArchived ? (
                  <p className="microcopy">Archived reviews stay in Azure until you restore or delete them.</p>
                ) : null}
                {review.isDeleted ? (
                  <p className="microcopy">Deleted reviews stay recoverable until you permanently delete them.</p>
                ) : null}
              </article>
            ))}
          </div>
          </>
        ) : null}

        {error ? (
          <section className="filter-card">
            <p className="eyebrow">Project review library</p>
            <h3>The saved project review list could not be loaded.</h3>
            <p className="microcopy">{error}</p>
          </section>
        ) : null}
      </section>
    </main>
  );
}
