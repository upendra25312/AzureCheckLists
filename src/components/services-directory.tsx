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
  const normalizedSearch = search.trim().toLowerCase();
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
    [index.services, normalizedSearch, posture]
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
              <p className="eyebrow">Azure services</p>
              <h1 className="review-command-title">Start with the Azure service, not the checklist filename.</h1>
              <p className="review-command-summary">
                Browse the normalized Azure service catalog and open a service-specific view that
                gathers related checklist families, findings, regional fit, and pricing posture in
                one working surface.
              </p>
            </div>
            <div className="button-row">
              <Link href="/" className="secondary-button">
                Back to overview
              </Link>
              <a href="#service-directory" className="primary-button">
                Browse services
              </a>
              <Link href="/how-to-use" className="ghost-button">
                Review guidance
              </Link>
            </div>
          </div>

          <aside className="leadership-brief detail-command-sidecar">
            <p className="eyebrow">Directory brief</p>
            <h2 className="leadership-title">How to use this directory.</h2>
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
            <p className="eyebrow">Service directory</p>
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
            <p className="microcopy">
              Search by service name, alias, architecture category, or related checklist family.
            </p>
          </div>
        </div>

        {filteredServices.length > 0 ? (
          <div className="service-directory-grid">
            {filteredServices.map((service) => (
              <article className="service-directory-card" key={service.slug}>
                <div className="section-head board-card-head">
                  <div className="board-card-head-copy">
                    <p className="eyebrow">Azure service</p>
                    <h3 className="service-card-title">{service.service}</h3>
                  </div>
                  <div className="chip-row board-summary-row">
                    <span className="chip">{service.familyCount.toLocaleString()} families</span>
                    <span className="chip">{service.itemCount.toLocaleString()} findings</span>
                  </div>
                </div>

                <p className="service-card-copy">{service.description}</p>
                <p className="service-card-note">{service.whatThisMeans}</p>

                <div className="service-card-meta board-summary-row">
                  {service.gaFamilyCount > 0 ? (
                    <span className="pill">{service.gaFamilyCount.toLocaleString()} GA-ready</span>
                  ) : null}
                  {service.previewFamilyCount > 0 ? (
                    <span className="pill">{service.previewFamilyCount.toLocaleString()} preview</span>
                  ) : null}
                  {service.mixedFamilyCount > 0 ? (
                    <span className="pill">{service.mixedFamilyCount.toLocaleString()} mixed</span>
                  ) : null}
                  {service.deprecatedFamilyCount > 0 ? (
                    <span className="pill">{service.deprecatedFamilyCount.toLocaleString()} deprecated</span>
                  ) : null}
                  <span className="pill">{service.highSeverityCount.toLocaleString()} high severity</span>
                  {service.regionalFitSummary?.mapped ? (
                    service.regionalFitSummary.isGlobalService ? (
                      <span className="pill">global / non-regional</span>
                    ) : (
                      <span className="pill">
                        {service.regionalFitSummary.availableRegionCount.toLocaleString()} regions
                      </span>
                    )
                  ) : (
                    <span className="pill">availability mapping pending</span>
                  )}
                  {service.regionalFitSummary?.restrictedRegionCount ? (
                    <span className="pill">
                      {service.regionalFitSummary.restrictedRegionCount.toLocaleString()} restricted
                    </span>
                  ) : null}
                  {service.regionalFitSummary?.previewRegionCount ? (
                    <span className="pill">
                      {service.regionalFitSummary.previewRegionCount.toLocaleString()} preview regions
                    </span>
                  ) : null}
                </div>

                {service.aliases.length > 0 ? (
                  <p className="microcopy">
                    Also seen as {service.aliases.slice(0, 4).join(", ")}.
                  </p>
                ) : null}

                <div className="service-family-preview">
                  <strong>Recommended families</strong>
                  <div className="service-family-links">
                    {service.families.slice(0, 3).map((family) => (
                      <Link key={family.slug} href={`/technologies/${family.slug}`} className="muted-link">
                        {family.technology}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="button-row board-action-row-compact">
                  <Link href={`/services/${service.slug}`} className="primary-button">
                    Open service view
                  </Link>
                </div>
              </article>
            ))}
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
