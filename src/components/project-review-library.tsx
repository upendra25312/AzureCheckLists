"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  activateCloudProjectReview,
  buildLoginUrl,
  fetchClientPrincipal,
  listCloudProjectReviews
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
    case "google":
      return "Google";
    default:
      return provider || "Account";
  }
}

export function ProjectReviewLibrary() {
  const [principal, setPrincipal] = useState<StaticWebAppClientPrincipal | null>(null);
  const [payload, setPayload] = useState<ProjectReviewLibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingReviewId, setActivatingReviewId] = useState<string | null>(null);

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
            <h3>Sign in with Microsoft or Google to see your saved project reviews.</h3>
            <p className="microcopy">
              Local browsing still works without sign-in, but cloud-backed review history and resume
              need an authenticated identity.
            </p>
            <div className="button-row">
              <a href={buildLoginUrl("aad")} className="primary-button">
                Continue with Microsoft
              </a>
              <a href={buildLoginUrl("google")} className="secondary-button">
                Continue with Google
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
          <div className="service-selection-grid">
            {payload.reviews.map((review) => (
              <article className="future-card service-selection-card" key={review.id}>
                <div className="section-head">
                  <div>
                    <p className="eyebrow">{review.isActive ? "Active saved review" : "Saved review"}</p>
                    <h3>{review.name}</h3>
                  </div>
                  <span className="chip">{review.audience}</span>
                </div>
                <p className="microcopy">
                  {review.serviceCount.toLocaleString()} services,{" "}
                  {review.recordCount.toLocaleString()} saved findings, and{" "}
                  {review.pendingCount.toLocaleString()} items still pending.
                </p>
                <div className="chip-row">
                  <span className="chip">
                    Regions: {review.targetRegions.join(", ") || "Not captured"}
                  </span>
                  <span className="chip">Updated {formatDate(review.lastSavedAt)}</span>
                </div>
                {review.businessScope ? <p className="microcopy">{review.businessScope}</p> : null}
                <div className="button-row">
                  <button
                    type="button"
                    className="primary-button"
                    disabled={activatingReviewId === review.id}
                    onClick={() => void openReview(review)}
                  >
                    {activatingReviewId === review.id ? "Opening..." : "Open this review"}
                  </button>
                  <Link href="/review-package" className="ghost-button">
                    Open workspace
                  </Link>
                </div>
              </article>
            ))}
          </div>
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
