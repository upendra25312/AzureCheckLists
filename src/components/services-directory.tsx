"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ServiceIndex } from "@/types";

export function ServicesDirectory({ index }: { index: ServiceIndex }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const normalizedSearch = search.trim().toLowerCase();

  const availableCategories = useMemo(
    () =>
      Array.from(new Set(index.services.flatMap((s) => s.categories)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [index.services]
  );

  const filteredServices = useMemo(
    () =>
      index.services.filter((service) => {
        if (category !== "all" && !service.categories.includes(category)) return false;
        if (!normalizedSearch) return true;
        const searchable = [
          service.service,
          ...service.aliases,
          ...service.categories,
          ...service.families.map((f) => f.technology)
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(normalizedSearch);
      }),
    [category, index.services, normalizedSearch]
  );

  return (
    <main className="svc-page">

      {/* Page header */}
      <section className="svc-page-header">
        <h1 className="svc-page-title">Service Explorer</h1>
        <p className="svc-page-sub">
          Browse {index.services.length}+ Azure services, WAF findings, regional fit, and pricing
          — no sign-in required.
        </p>
      </section>

      {/* Search + filters */}
      <section className="svc-search-bar-wrap">
        <input
          className="svc-search-bar"
          type="search"
          value={search}
          placeholder={`Search ${index.services.length}+ Azure services…`}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search Azure services"
        />
      </section>

      {/* Category filter pills */}
      <div className="svc-filter-row" role="group" aria-label="Filter by category">
        <button
          type="button"
          className={`svc-filter-pill${category === "all" ? " svc-filter-pill--active" : ""}`}
          onClick={() => setCategory("all")}
        >
          All
        </button>
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`svc-filter-pill${category === cat ? " svc-filter-pill--active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="svc-results-count">
        {filteredServices.length.toLocaleString()} service{filteredServices.length !== 1 ? "s" : ""}
        {normalizedSearch || category !== "all" ? " matching" : ""}
      </p>

      {/* Service grid */}
      {filteredServices.length > 0 ? (
        <div className="svc-grid">
          {filteredServices.map((service) => (
            <article key={service.slug} className="svc-card">
              <div className="svc-card-head">
                <strong className="svc-card-name">{service.service}</strong>
                {service.categories[0] ? (
                  <span className="svc-card-cat">{service.categories[0]}</span>
                ) : null}
              </div>
              {service.description ? (
                <p className="svc-card-desc">{service.description}</p>
              ) : null}
              <div className="svc-card-meta">
                <span>{service.itemCount.toLocaleString()} findings</span>
                <span>
                  {service.gaFamilyCount > 0
                    ? `${service.gaFamilyCount} GA families`
                    : "Preview guidance"}
                </span>
              </div>
              <Link href={`/services/${service.slug}`} className="svc-card-link">
                View findings →
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="svc-empty">
          <p>No services match your search.</p>
          <button
            type="button"
            className="svc-reset-btn"
            onClick={() => { setSearch(""); setCategory("all"); }}
          >
            Clear filters
          </button>
        </div>
      )}
    </main>
  );
}
