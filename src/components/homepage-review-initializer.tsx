"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { trackReviewTelemetry } from "@/lib/review-telemetry";

const DEFAULT_REGIONS: string[] = [];
const REGION_SUGGESTIONS = ["East US", "UK South", "West Europe", "UAE Central"];

function normalizeRegion(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function HomepageReviewInitializer() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [projectName, setProjectName] = useState("");
  const [businessScope, setBusinessScope] = useState("");
  const [selectedRegions, setSelectedRegions] = useState(DEFAULT_REGIONS);
  const [regionDraft, setRegionDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resolvedRegions = useMemo(
    () =>
      selectedRegions.filter(
        (region, index) =>
          selectedRegions.findIndex((entry) => entry.toLowerCase() === region.toLowerCase()) === index
      ),
    [selectedRegions]
  );

  function addRegion(rawValue: string) {
    const nextValue = normalizeRegion(rawValue);

    if (!nextValue) {
      return;
    }

    setSelectedRegions((current) => {
      if (current.some((entry) => entry.toLowerCase() === nextValue.toLowerCase())) {
        return current;
      }

      return [...current, nextValue];
    });
  }

  function removeRegion(region: string) {
    setSelectedRegions((current) => current.filter((entry) => entry !== region));
  }

  function commitRegionDraft() {
    if (!regionDraft.trim()) {
      return;
    }

    addRegion(regionDraft);
    setRegionDraft("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = projectName.trim();

    if (!trimmedName) {
      setError("Project name is required before the review workspace can be created.");
      return;
    }

    const params = new URLSearchParams({
      intent: "create",
      name: trimmedName
    });

    if (businessScope.trim()) {
      params.set("businessScope", businessScope.trim());
    }

    if (resolvedRegions.length > 0) {
      params.set("targetRegions", resolvedRegions.join(", "));
    }

    setError(null);
    void trackReviewTelemetry({
      name: "homepage_initialize_review",
      category: "homepage",
      route: "/",
      properties: {
        hasBusinessScope: businessScope.trim().length > 0,
        projectNameLength: trimmedName.length,
        targetRegionCount: resolvedRegions.length
      }
    });
    startTransition(() => {
      router.push(`/review-package?${params.toString()}`);
    });
  }

  return (
    <section className="home-init-panel">
      <div className="home-init-copy">
        <p className="home-init-kicker">Start here</p>
        <h1 className="home-init-title">Start a Structured Azure Review</h1>
        <p className="home-init-summary">Create the review shell first, then refine the scope inside the workspace.</p>
      </div>

      <form className="home-init-form" onSubmit={handleSubmit}>
        <label className="home-init-field home-init-field-primary">
          <span>Project name</span>
          <input
            className="field-input home-init-input"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Greenfield AKS Cluster"
          />
          <small className="home-init-hint">Required. Everything else can be refined inside the workspace.</small>
        </label>

        <details className="home-init-optional">
          <summary>Optional context</summary>

          <div className="home-init-optional-grid">
            <label className="home-init-field">
              <span>Business case</span>
              <textarea
                className="field-textarea home-init-textarea"
                value={businessScope}
                onChange={(event) => setBusinessScope(event.target.value)}
                placeholder="Summarize the problem, target architecture, and the business goal."
              />
              <small className="home-init-hint">Short is enough. Expand it later in the review.</small>
            </label>

            <label className="home-init-field">
              <span>Target regions</span>
              <div className="home-region-field">
                <div className="home-region-chip-list">
                  {resolvedRegions.map((region) => (
                    <button
                      type="button"
                      key={region}
                      className="home-region-chip"
                      onClick={() => removeRegion(region)}
                      title={`Remove ${region}`}
                    >
                      {region} <span>x</span>
                    </button>
                  ))}
                  <input
                    className="home-region-input"
                    value={regionDraft}
                    onChange={(event) => setRegionDraft(event.target.value)}
                    onBlur={commitRegionDraft}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        commitRegionDraft();
                      }
                    }}
                    placeholder={resolvedRegions.length === 0 ? "Add a region" : ""}
                  />
                </div>
                <button
                  type="button"
                  className="home-region-caret"
                  onClick={commitRegionDraft}
                  aria-label="Add typed region"
                >
                  Add
                </button>
              </div>
              <div className="home-region-suggestions" aria-label="Suggested regions">
                {REGION_SUGGESTIONS.map((region) => (
                  <button
                    type="button"
                    key={region}
                    className="home-region-suggestion"
                    onClick={() => addRegion(region)}
                  >
                    {region}
                  </button>
                ))}
              </div>
              <small className="home-init-hint">Optional. Add regions now only if they matter to the first pass.</small>
            </label>
          </div>
        </details>

        <div className="home-init-button-band">
          <p className="home-init-button-caption">Creates the review shell and opens the structured review workspace.</p>
          <button type="submit" className="home-init-button" disabled={isPending}>
            {isPending ? "Creating Review Workspace..." : "Create Review Workspace"}
          </button>
        </div>

        <div className="home-init-secondary-actions">
          <Link href="/arb" className="home-init-secondary-link">
            Upload ARB artifacts
          </Link>
          <Link href="/my-project-reviews" className="home-init-secondary-link">
            Open saved reviews
          </Link>
        </div>

        {error ? <p className="home-init-error">{error}</p> : null}
      </form>
    </section>
  );
}
