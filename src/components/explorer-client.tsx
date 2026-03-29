"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CatalogSummary, ChecklistItem, ExplorerFilters, ReviewDraft } from "@/types";
import { ItemDrawer } from "@/components/item-drawer";
import { buildExportRows, downloadCsv, downloadJson } from "@/lib/export";
import { filterItems } from "@/lib/filters";
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

    const storedFilters = loadFilters();
    const storedReviews = loadReviews();

    if (storedFilters) {
      setFilters(storedFilters);
    }

    setReviews(storedReviews);

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
            <h2 className="section-title">Loading normalized checklist data.</h2>
            <p className="section-copy">
              The catalog is a static JSON payload generated at build time from the
              source repository.
            </p>
          </div>
        </div>
        <div className="loading-panel">
          <p className="microcopy">
            Preparing filters, technology summaries, and source-traceable item rows.
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
    downloadJson(
      "azure-review-findings.json",
      buildExportRows(filteredItems, reviews)
    );
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
              Filter fast, inspect details, and keep lightweight personal review state in the browser.
            </h2>
            <p className="section-copy">
              Notes, review outcomes, and filter preferences stay local to the
              browser in v1. Export the filtered results when you need to carry work forward.
            </p>
          </div>
          <div className="chip-row">
            <span className="chip">{filteredItems.length.toLocaleString()} visible items</span>
            <span className="chip">{reviewedCount.toLocaleString()} reviewed in current view</span>
            <span className="chip">{summary.generatedAt}</span>
          </div>
        </div>

        <div className="explorer-grid">
          <aside className="filters-panel">
            <section className="filter-card">
              <h3>Search</h3>
              <input
                className="search-input"
                type="search"
                placeholder="Search text, service, category, or technology"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </section>

            <section className="filter-card">
              <h3>Technology status</h3>
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
              <h3>Technology family</h3>
              <div className="filter-grid">
                {summary.technologies.map((technology) => (
                  <button
                    key={technology.slug}
                    type="button"
                    className="chip"
                    aria-pressed={filters.technologies.includes(technology.technology)}
                    onClick={() =>
                      updateFilter(
                        "technologies",
                        toggleValue(filters.technologies, technology.technology)
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
                  Clear all filters
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
                <span className="pill">{reviewedCount.toLocaleString()} locally reviewed</span>
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

                  return (
                    <div className="item-row" key={item.guid}>
                      <button type="button" onClick={() => setSelectedItem(item)}>
                        <div className="item-topline">
                          {item.severity ? <span className="pill">{item.severity}</span> : null}
                          {item.waf ? <span className="pill">{item.waf}</span> : null}
                          <span className="pill">{item.technology}</span>
                          {review ? <span className="pill">{review.reviewState}</span> : null}
                        </div>
                        <p className="item-text">{item.text}</p>
                        <div className="item-meta">
                          {item.id ? <span className="chip">{item.id}</span> : null}
                          {item.category ? <span className="chip">{item.category}</span> : null}
                          {item.subcategory ? <span className="chip">{item.subcategory}</span> : null}
                          {item.service ? <span className="chip">{item.service}</span> : null}
                        </div>
                        {item.description ? (
                          <p className="item-description">
                            {item.description.length > 220
                              ? `${item.description.slice(0, 220)}...`
                              : item.description}
                          </p>
                        ) : null}
                      </button>
                      <Link
                        href={`/technologies/${item.technologySlug}`}
                        className="muted-link"
                      >
                        Open technology page
                      </Link>
                    </div>
                  );
                })}
              </div>
            </article>

            {filteredItems.length > 250 ? (
              <p className="microcopy">
                Showing the first 250 filtered items for responsiveness. Export includes the
                full filtered set.
              </p>
            ) : null}
          </section>
        </div>
      </section>

      <section id="future" className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Phase 2 path</p>
            <h2 className="section-title">
              Designed to evolve without forcing a v1 backend.
            </h2>
            <p className="section-copy">
              The codebase keeps review state local today, but the normalized contract
              and page structure make it straightforward to add authenticated workflows
              and shared persistence later.
            </p>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card">
            <h3>Authenticated reviewers</h3>
            <p>
              Replace browser-only storage with authenticated APIs and shared review
              records once identity and tenancy decisions are ready.
            </p>
          </article>
          <article className="future-card">
            <h3>Evidence and workflows</h3>
            <p>
              Add evidence upload, approval paths, and exception workflows behind a
              minimal service layer without changing the normalized checklist contract.
            </p>
          </article>
          <article className="future-card">
            <h3>Auditability</h3>
            <p>
              Introduce server persistence and immutable activity trails later, rather
              than pretending browser storage is sufficient for formal compliance in v1.
            </p>
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
