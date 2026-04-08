"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const DEFAULT_REGIONS = ["UAE Central", "East US", "UK South"];

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
      setError("Project name is required before the review workspace can be initialized.");
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
    startTransition(() => {
      router.push(`/review-package?${params.toString()}`);
    });
  }

  return (
    <section className="home-init-panel">
      <div className="home-init-copy">
        <h1 className="home-init-title">Start a Structured Azure Review</h1>
        <p className="home-init-summary">
          Define your project scope to create a reusable design artifact with validated
          service-level context, region-fit signals, and documented decisions.
        </p>
      </div>

      <form className="home-init-form" onSubmit={handleSubmit}>
        <div className="home-init-field-grid">
          <label className="home-init-field">
            <span>Project Name (e.g., Greenfield AKS Cluster)</span>
            <input
              className="field-input home-init-input"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Greenfield AKS Cluster"
            />
          </label>

          <label className="home-init-field">
            <span>Primary Problem Statement / Business Case</span>
            <textarea
              className="field-textarea home-init-textarea"
              value={businessScope}
              onChange={(event) => setBusinessScope(event.target.value)}
              placeholder="Summarize the problem, target architecture, and the business goal."
            />
          </label>

          <label className="home-init-field">
            <span>Target Azure Regions</span>
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
                v
              </button>
            </div>
          </label>
        </div>

        <div className="home-init-button-band">
          <button type="submit" className="home-init-button" disabled={isPending}>
            {isPending ? "Opening Project Review..." : "Initialize Project Review"}
          </button>
        </div>

        {error ? <p className="home-init-error">{error}</p> : null}
      </form>
    </section>
  );
}
