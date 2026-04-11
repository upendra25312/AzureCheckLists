"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ServiceIndex } from "@/types";

type ServicePosture = "all" | "ga" | "preview";

const POSTURE_COPY: Record<
  ServicePosture,
  {
    title: string;
    description: string;
  }
> = {
  all: {
    title: "All discovered services",
    description: "Browse the full normalized service catalog from the source repository."
  },
  ga: {
    title: "Services with a GA-ready baseline",
    description: "Start here when you need the strongest default footing for design and review."
  },
  preview: {
    title: "Services led by preview guidance",
    description: "Useful for specialist review, but these need more explicit validation before leadership reliance."
  }
};

function matchesPosture(posture: ServicePosture, service: ServiceIndex["services"][number]) {
  if (posture === "ga") {
    return service.gaFamilyCount > 0;
  }

  if (posture === "preview") {
    return service.gaFamilyCount === 0 && service.previewFamilyCount + service.mixedFamilyCount > 0;
  }

  return true;
}

export function ServicesDirectory({ index }: { index: ServiceIndex }) {
  const [search, setSearch] = useState("");
  const [posture, setPosture] = useState<ServicePosture>("all");
  const [category, setCategory] = useState<string>("all");
  const normalizedSearch = search.trim().toLowerCase();
  const availableCategories = useMemo(
    () =>
      Array.from(new Set(index.services.flatMap((service) => service.categories)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [index.services]
  );
  const servicesWithGaBaseline = index.services.filter((service) => service.gaFamilyCount > 0).length;
  const previewLedServices = index.services.filter(
    (service) => service.gaFamilyCount === 0 && service.previewFamilyCount + service.mixedFamilyCount > 0
  ).length;
  const filteredServices = useMemo(
    () =>
      index.services.filter((service) => {
        if (!matchesPosture(posture, service)) {
          return false;
        }

        if (category !== "all" && !service.categories.includes(category)) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchable = [
          service.service,
          ...service.aliases,
          ...service.categories,
          ...service.families.map((family) => family.technology)
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedSearch);
      }),
    [category, index.services, normalizedSearch, posture]
  );
  const postureButtonClass = (value: ServicePosture) =>
    posture === value ? "secondary-button" : "ghost-button";
  const directoryMetrics = [
    {
      label: "Available services",
      value: index.services.length.toLocaleString(),
      detail: "Canonical Azure services discovered across the normalized review catalog."
    },
    {
      label: "GA-ready baselines",
      value: servicesWithGaBaseline.toLocaleString(),
      detail: "Services with at least one GA-ready family to anchor design and review."
    },
    {
      label: "Preview-led services",
      value: previewLedServices.toLocaleString(),
      detail: "Services that still need more explicit validation before leadership reliance."
    },
    {
      label: "Visible in current filter",
      value: filteredServices.length.toLocaleString(),
      detail: POSTURE_COPY[posture].description
    }
  ];

  return (
    <main className="section-stack">
      <section className="review-command-panel">
        <div className="detail-command-grid">
          <div className="detail-command-copy">
            <div>
              <p className="eyebrow">Services explorer</p>
              <h1 className="review-command-title">Browse Azure services, guidance coverage, and review relevance in one explorer.</h1>
              <p className="review-command-summary">
                Use this page before or during a review to find the right Azure service, understand
                where guidance is strongest, and open the deeper service page when you need detail.
              </p>
            </div>
            <div className="button-row">
              <Link href="/" className="secondary-button">
                Back to dashboard
              </Link>
              <a href="#service-directory" className="primary-button">
                Browse services
              </a>
              <Link href="/how-to-use" className="ghost-button">
                Open docs
              </Link>
            </div>
          </div>

          <aside className="leadership-brief detail-command-sidecar">
            <p className="eyebrow">Explorer brief</p>
            <h2 className="leadership-title">Use the explorer before you commit a service into scope.</h2>
            <div className="leadership-list">
              <article>
                <strong>Service-first entry</strong>
                <p>Open the service you are designing or reviewing, then follow the recommended family path.</p>
              </article>
              <article>
                <strong>GA-first baseline</strong>
                <p>{servicesWithGaBaseline.toLocaleString()} services already have at least one GA-ready family.</p>
              </article>
              <article>
                <strong>Preview caution</strong>
                <p>{previewLedServices.toLocaleString()} services are covered mainly by preview-led guidance.</p>
              </article>
            </div>
          </aside>
        </div>

        <div className="review-command-metrics">
          {directoryMetrics.map((metric) => (
            <article className="review-command-metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel board-stage-panel" id="service-directory">
        <div className="section-head">
          <div>
            <p className="eyebrow">Service explorer</p>
            <h2 className="section-title">{POSTURE_COPY[posture].title}</h2>
            <p className="section-copy">{POSTURE_COPY[posture].description}</p>
          </div>
          <div className="chip-row">
            <span className="chip">{filteredServices.length.toLocaleString()} visible services</span>
          </div>
        </div>

        <div className="filter-card workspace-toolbar board-toolbar-card">
          <div className="workspace-toolbar-main">
            <input
              className="search-input"
              type="search"
              value={search}
              placeholder="Search Azure Firewall, AKS, Key Vault, App Service, or another service"
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="button-row">
              <button
                type="button"
                className={postureButtonClass("all")}
                onClick={() => setPosture("all")}
              >
                All services
              </button>
              <button
                type="button"
                className={postureButtonClass("ga")}
                onClick={() => setPosture("ga")}
              >
                GA baseline available
              </button>
              <button
                type="button"
                className={postureButtonClass("preview")}
                onClick={() => setPosture("preview")}
              >
                Preview-led services
              </button>
            </div>
            <label className="filter-field services-category-filter">
              <span className="microcopy">Category</span>
              <select
                className="field-select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {availableCategories.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>
            <p className="microcopy">
              Search by service name, alias, architecture category, or related checklist family.
            </p>
          </div>
        </div>

        {filteredServices.length > 0 ? (
          <div className="reviews-table-scroll service-table-shell">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col">Guidance posture</th>
                  <th scope="col">Region context</th>
                  <th scope="col">Review relevance</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service.slug}>
                    <td>
                      <div className="enterprise-table-primary">
                        <strong>{service.service}</strong>
                        <p>{service.description}</p>
                        <div className="enterprise-table-inline-meta">
                          <span>{service.categories.slice(0, 2).join(", ") || "General"}</span>
                          {service.aliases.length > 0 ? <span>Also seen as {service.aliases.slice(0, 2).join(", ")}</span> : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="enterprise-table-metric-stack">
                        <strong>{service.familyCount.toLocaleString()} families</strong>
                        <p>
                          {service.gaFamilyCount.toLocaleString()} GA-ready · {service.previewFamilyCount.toLocaleString()} preview
                        </p>
                      </div>
                    </td>
                    <td>
                      <div className="enterprise-table-metric-stack">
                        <strong>
                          {service.regionalFitSummary?.mapped
                            ? service.regionalFitSummary.isGlobalService
                              ? "Global / non-regional"
                              : `${service.regionalFitSummary.availableRegionCount.toLocaleString()} available regions`
                            : "Mapping pending"}
                        </strong>
                        <p>
                          {service.regionalFitSummary?.restrictedRegionCount
                            ? `${service.regionalFitSummary.restrictedRegionCount.toLocaleString()} restricted regions`
                            : "No restricted-region signal highlighted"}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div className="enterprise-table-metric-stack">
                        <strong>{service.itemCount.toLocaleString()} findings</strong>
                        <p>{service.whatThisMeans}</p>
                      </div>
                    </td>
                    <td>
                      <div className="enterprise-action-stack">
                        <Link href={`/services/${service.slug}`} className="primary-button">
                          Open service
                        </Link>
                        <div className="button-row board-action-row-compact">
                          {service.families.slice(0, 2).map((family) => (
                            <Link key={family.slug} href={`/technologies/${family.slug}`} className="ghost-button">
                              {family.technology}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <section className="filter-card board-stage-panel">
            <p className="eyebrow">No matching services</p>
            <h3>Try a broader search or reset to all services.</h3>
            <p className="microcopy">
              Search by service name, alias, category, or related family title to widen the result set.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
