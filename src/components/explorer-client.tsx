"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CatalogSummary, ChecklistItem, ExplorerFilters, ReviewDraft } from "@/types";
import { ItemDrawer } from "@/components/item-drawer";
import { buildExportRows, downloadCsv, downloadJson } from "@/lib/export";
import { filterItems } from "@/lib/filters";
import { QualityBadge } from "@/components/quality-badge";
import {
  createEmptyReview,
  loadFilters,
  loadReviews,
  saveFilters,
  saveReviews
} from "@/lib/review-storage";

const EMPTY_FILTERS: ExplorerFilters = {
  search: "",
  statuses: [],
  maturityBuckets: ["GA"],
  severities: [],
  waf: [],
  services: [],
  sourceKinds: [],
  technologies: []
};

function uniqueValues(items: ChecklistItem[], selector: (item: ChecklistItem) => string | undefined) {
  return [...new Set(items.map(selector).filter(Boolean) as string[])].sort((left, right) =>
    left.localeCompare(right)
  );
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

function mergeFilters(storedFilters: Partial<ExplorerFilters> | null) {
  return {
    ...EMPTY_FILTERS,
    ...storedFilters,
    statuses: storedFilters?.statuses ?? EMPTY_FILTERS.statuses,
    maturityBuckets: storedFilters?.maturityBuckets ?? EMPTY_FILTERS.maturityBuckets,
    severities: storedFilters?.severities ?? EMPTY_FILTERS.severities,
    waf: storedFilters?.waf ?? EMPTY_FILTERS.waf,
    services: storedFilters?.services ?? EMPTY_FILTERS.services,
    sourceKinds: storedFilters?.sourceKinds ?? EMPTY_FILTERS.sourceKinds,
    technologies: storedFilters?.technologies ?? EMPTY_FILTERS.technologies
  };
}

export function ExplorerClient({ summary }: { summary: CatalogSummary }) {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [filters, setFilters] = useState<ExplorerFilters>(EMPTY_FILTERS);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [reviews, setReviews] = useState<Record<string, ReviewDraft>>({});

  useEffect(() => {
    let active = true;

    fetch("/data/catalog.json")
      .then((response) => response.json())
      .then((payload: { items: ChecklistItem[] }) => {
        if (active) {
          setItems(payload.items);
        }
      });

    setFilters(mergeFilters(loadFilters()));
    setReviews(loadReviews());

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  useEffect(() => {
    saveReviews(reviews);
  }, [reviews]);

  if (!items) {
    return (
      <section id="explorer" className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Checklist explorer</p>
            <h2 className="section-title">Preparing the filtered review workspace.</h2>
            <p className="section-copy">
              The detailed explorer is loading the prebuilt catalog so the experience
              can stay static-first while still supporting client-side filtering and local notes.
            </p>
          </div>
        </div>
        <div className="loading-panel">
          <p className="microcopy">
            Applying the default GA-first posture and loading source-traceable findings.
          </p>
        </div>
      </section>
    );
  }

  const filteredItems = filterItems(items, filters);
  const services = uniqueValues(items, (item) => item.service);
  const wafPillars = uniqueValues(items, (item) => item.waf);
  const severities = uniqueValues(items, (item) => item.severity);
  const reviewedCount = filteredItems.filter((item) => {
    const review = reviews[item.guid];

    return review && review.reviewState !== "Not Reviewed";
  }).length;

  function updateFilter<K extends keyof ExplorerFilters>(key: K, value: ExplorerFilters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  function exportFilteredJson() {
    downloadJson("azure-review-findings.json", buildExportRows(filteredItems, reviews));
  }

  function exportFilteredCsv() {
    downloadCsv("azure-review-findings.csv", buildExportRows(filteredItems, reviews));
  }

  function updateReview(guid: string, next: Partial<ReviewDraft>) {
    setReviews((current) => {
      const existing = current[guid] ?? createEmptyReview();

      return {
        ...current,
        [guid]: {
          ...existing,
          ...next
        }
      };
    });
  }

  return (
    <>
      <section id="explorer" className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Checklist explorer</p>
            <h2 className="section-title">
              Review mature guidance first, then widen into preview and mixed-confidence content deliberately.
            </h2>
            <p className="section-copy">
              The default filter posture is GA-ready only. Expand into preview, mixed, or deprecated
              families when the workload or review question requires it.
            </p>
          </div>
          <div className="chip-row">
            <span className="chip">{filteredItems.length.toLocaleString()} visible findings</span>
            <span className="chip">{reviewedCount.toLocaleString()} locally reviewed</span>
            <span className="chip">Generated {summary.generatedAt}</span>
          </div>
        </div>

        <div className="future-grid explorer-highlights">
          <article className="future-card">
            <h3>GA-first default</h3>
            <p>
              {summary.gaDefaultTechnologyCount.toLocaleString()} families and{" "}
              {summary.gaReadyItemCount.toLocaleString()} items are currently treated as the default executive baseline.
            </p>
          </article>
          <article className="future-card">
            <h3>Preview and mixed watchlist</h3>
            <p>
              {(
                summary.previewTechnologyCount +
                summary.mixedTechnologyCount +
                summary.deprecatedTechnologyCount
              ).toLocaleString()} families require explicit review judgment before heavy reliance.
            </p>
          </article>
          <article className="future-card">
            <h3>Traceability preserved</h3>
            <p>
              Every result keeps source file linkage so architects can move from dashboard insight to original checklist intent.
            </p>
          </article>
        </div>

        <div className="explorer-grid">
          <aside className="filters-panel">
            <section className="filter-card">
              <h3>Default posture</h3>
              <p className="microcopy">
                Start narrow with GA-ready guidance, then broaden when you need deeper or earlier-stage signals.
              </p>
              <div className="button-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => updateFilter("maturityBuckets", ["GA"])}
                >
                  GA-ready only
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() =>
                    updateFilter("maturityBuckets", ["GA", "Preview", "Mixed", "Deprecated"])
                  }
                >
                  Include all maturity buckets
                </button>
              </div>
            </section>

            <section className="filter-card">
              <h3>Search</h3>
              <input
                className="search-input"
                type="search"
                placeholder="Search findings, services, or design areas"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </section>

            <section className="filter-card">
              <h3>Maturity bucket</h3>
              <div className="filter-grid">
                {["GA", "Preview", "Mixed", "Deprecated"].map((bucket) => (
                  <button
                    key={bucket}
                    type="button"
                    className="chip"
                    aria-pressed={filters.maturityBuckets.includes(bucket as ChecklistItem["technologyMaturityBucket"])}
                    onClick={() =>
                      updateFilter(
                        "maturityBuckets",
                        toggleValue(filters.maturityBuckets, bucket) as ExplorerFilters["maturityBuckets"]
                      )
                    }
                  >
                    {bucket}
                  </button>
                ))}
              </div>
            </section>

            <section className="filter-card">
              <h3>Source status</h3>
              <div className="filter-grid">
                {["GA", "Preview", "Deprecated", "Unknown"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="chip"
                    aria-pressed={filters.statuses.includes(status as ChecklistItem["technologyStatus"])}
                    onClick={() =>
                      updateFilter(
                        "statuses",
                        toggleValue(filters.statuses, status) as ExplorerFilters["statuses"]
                      )
                    }
                  >
                    {status}
                  </button>
                ))}
              </div>
            </section>

            <section className="filter-card">
              <h3>Severity</h3>
              <div className="filter-grid">
                {severities.map((severity) => (
                  <button
                    key={severity}
                    type="button"
                    className="chip"
                    aria-pressed={filters.severities.includes(severity)}
                    onClick={() =>
                      updateFilter("severities", toggleValue(filters.severities, severity))
                    }
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </section>

            <section className="filter-card">
              <h3>WAF pillar</h3>
              <div className="filter-grid">
                {wafPillars.map((pillar) => (
                  <button
                    key={pillar}
                    type="button"
                    className="chip"
                    aria-pressed={filters.waf.includes(pillar)}
                    onClick={() => updateFilter("waf", toggleValue(filters.waf, pillar))}
                  >
                    {pillar}
                  </button>
                ))}
              </div>
            </section>

            <section className="filter-card">
              <h3>Service</h3>
              <div className="filter-grid">
                {services.map((service) => (
                  <button
                    key={service}
                    type="button"
                    className="chip"
                    aria-pressed={filters.services.includes(service)}
                    onClick={() =>
                      updateFilter("services", toggleValue(filters.services, service))
                    }
                  >
                    {service}
                  </button>
                ))}
              </div>
            </section>

            <section className="filter-card">
              <h3>Checklist family</h3>
              <div className="filter-grid">
                {summary.technologies.map((technology) => (
                  <button
                    key={technology.slug}
                    type="button"
                    className="chip"
                    aria-pressed={filters.technologies.includes(technology.slug)}
                    onClick={() =>
                      updateFilter(
                        "technologies",
                        toggleValue(filters.technologies, technology.slug)
                      )
                    }
                  >
                    {technology.technology}
                  </button>
                ))}
              </div>
            </section>

            <section className="filter-card">
              <h3>Reset</h3>
              <div className="button-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Restore GA-first defaults
                </button>
              </div>
            </section>
          </aside>

          <section className="results-panel">
            <div className="results-toolbar">
              <div className="pill-row">
                <span className="pill">{filteredItems.length.toLocaleString()} findings</span>
                <span className="pill">
                  {filteredItems.filter((item) => item.severity === "High").length.toLocaleString()} high severity
                </span>
                <span className="pill">
                  {
                    new Set(filteredItems.map((item) => item.technologySlug)).size.toLocaleString()
                  }{" "}
                  families in view
                </span>
              </div>
              <div className="button-row">
                <button type="button" className="secondary-button" onClick={exportFilteredCsv}>
                  Export CSV
                </button>
                <button type="button" className="secondary-button" onClick={exportFilteredJson}>
                  Export JSON
                </button>
              </div>
            </div>

            <article className="list-card">
              <div className="item-list">
                {filteredItems.slice(0, 250).map((item) => {
                  const review = reviews[item.guid];
                  const technology = summary.technologies.find(
                    (candidate) => candidate.slug === item.technologySlug
                  );

                  return (
                    <div className="item-row" key={item.guid}>
                      <button type="button" onClick={() => setSelectedItem(item)}>
                        <div className="item-topline">
                          {item.severity ? <span className="pill">{item.severity}</span> : null}
                          {item.waf ? <span className="pill">{item.waf}</span> : null}
                          <span className="pill">{item.technology}</span>
                          <span className="pill">{item.technologyMaturityBucket}</span>
                          {review ? <span className="pill">{review.reviewState}</span> : null}
                        </div>
                        <p className="item-text">{item.text}</p>
                        <div className="item-meta">
                          {item.id ? <span className="chip">{item.id}</span> : null}
                          {item.category ? <span className="chip">{item.category}</span> : null}
                          {item.subcategory ? <span className="chip">{item.subcategory}</span> : null}
                          {item.service ? <span className="chip">{item.service}</span> : null}
                        </div>
                        {technology ? <QualityBadge technology={technology} compact /> : null}
                        {item.description ? (
                          <p className="item-description">
                            {item.description.length > 220
                              ? `${item.description.slice(0, 220)}...`
                              : item.description}
                          </p>
                        ) : null}
                      </button>
                      <Link href={`/technologies/${item.technologySlug}`} className="muted-link">
                        Open family detail
                      </Link>
                    </div>
                  );
                })}
              </div>
            </article>

            {filteredItems.length > 250 ? (
              <p className="microcopy">
                Showing the first 250 filtered findings for readability. Export includes the
                full filtered result set.
              </p>
            ) : null}
          </section>
        </div>
      </section>

      <section id="future" className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Production posture</p>
            <h2 className="section-title">
              Static-first today, enterprise controls when the operating model is ready.
            </h2>
            <p className="section-copy">
              The product stays honest in v1: no fake multi-user persistence, no backend audit claim,
              and no implied sign-off. The next step up is a controlled move to authenticated workflows,
              telemetry, and release governance rather than uncontrolled feature sprawl.
            </p>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card">
            <h3>Quick win</h3>
            <p>Keep the explorer static-first, but improve the trust model, maturity scoring, and executive framing.</p>
          </article>
          <article className="future-card">
            <h3>30-day move</h3>
            <p>Adopt Static Web Apps Standard or App Service when authenticated review workflows and shared state become necessary.</p>
          </article>
          <article className="future-card">
            <h3>90-day hardening</h3>
            <p>Introduce telemetry, release governance, evidence workflows, and auditable reviewer actions behind a real service boundary.</p>
          </article>
        </div>
      </section>

      {selectedItem ? (
        <ItemDrawer
          item={selectedItem}
          review={reviews[selectedItem.guid] ?? createEmptyReview()}
          onClose={() => setSelectedItem(null)}
          onUpdate={(next) => updateReview(selectedItem.guid, next)}
        />
      ) : null}
    </>
  );
}
