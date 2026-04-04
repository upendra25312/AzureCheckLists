"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildPackageExportRows,
  buildPackageMarkdown,
  buildPackagePricingMarkdown,
  buildPackagePricingRows,
  buildPackagePricingText,
  buildPackageText,
  downloadCsv,
  downloadText
} from "@/lib/export";
import { buildServicePricingRequest, loadServicePricingBatch } from "@/lib/service-pricing";
import {
  createReviewPackage,
  deletePackage,
  loadActivePackageId,
  loadPackages,
  loadScopedReviews,
  saveActivePackageId,
  upsertPackage
} from "@/lib/review-storage";
import type {
  ChecklistItem,
  ReviewDraft,
  ReviewPackage,
  ReviewPackageAudience,
  ServiceIndex,
  ServicePricing
} from "@/types";

const AUDIENCES: ReviewPackageAudience[] = [
  "Cloud Architect",
  "Pre-sales Architect",
  "Sales Architect",
  "Senior Director",
  "Cloud Engineer"
];

function normalizeList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatRetailPrice(price: number | undefined, currencyCode = "USD") {
  if (price === undefined || Number.isNaN(price)) {
    return "Not published";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 6
  }).format(price);
}

function matchesPackageService(
  item: ChecklistItem,
  selectedServiceSlugs: Set<string>,
  selectedServiceNames: Set<string>
) {
  if (item.serviceSlug && selectedServiceSlugs.has(item.serviceSlug)) {
    return true;
  }

  const serviceName = (item.serviceCanonical ?? item.service ?? "").trim().toLowerCase();

  if (!serviceName) {
    return false;
  }

  return selectedServiceNames.has(serviceName);
}

type PackageFormState = {
  name: string;
  audience: ReviewPackageAudience;
  businessScope: string;
  targetRegions: string;
};

function createFormState(reviewPackage?: ReviewPackage): PackageFormState {
  return {
    name: reviewPackage?.name ?? "",
    audience: reviewPackage?.audience ?? "Cloud Architect",
    businessScope: reviewPackage?.businessScope ?? "",
    targetRegions: reviewPackage?.targetRegions.join(", ") ?? ""
  };
}

export function ReviewPackageWorkbench({ index }: { index: ServiceIndex }) {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [packages, setPackages] = useState<ReviewPackage[]>([]);
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, ReviewDraft>>({});
  const [serviceSearch, setServiceSearch] = useState("");
  const [form, setForm] = useState<PackageFormState>(createFormState());
  const [includeNotApplicable, setIncludeNotApplicable] = useState(true);
  const [includeNeedsReview, setIncludeNeedsReview] = useState(false);
  const [servicePricing, setServicePricing] = useState<Record<string, ServicePricing>>({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/data/catalog.json")
      .then((response) => response.json())
      .then((payload: { items: ChecklistItem[] }) => {
        if (active) {
          setItems(payload.items);
        }
      });

    const storedPackages = loadPackages();
    const storedActivePackageId = loadActivePackageId();
    const fallbackPackageId = storedPackages[0]?.id ?? null;
    const nextActivePackageId = storedActivePackageId ?? fallbackPackageId;

    setPackages(storedPackages);
    setActivePackageId(nextActivePackageId);
    setReviews(loadScopedReviews(nextActivePackageId));

    const nextActivePackage = storedPackages.find((entry) => entry.id === nextActivePackageId);

    setForm(createFormState(nextActivePackage));

    return () => {
      active = false;
    };
  }, []);

  const activePackage = useMemo(
    () => packages.find((entry) => entry.id === activePackageId) ?? null,
    [activePackageId, packages]
  );
  const normalizedServiceSearch = serviceSearch.trim().toLowerCase();
  const selectedServiceSlugSet = useMemo(
    () => new Set(activePackage?.selectedServiceSlugs ?? []),
    [activePackage]
  );
  const selectedServiceNameSet = useMemo(() => {
    const names = new Set<string>();

    index.services.forEach((service) => {
      if (!selectedServiceSlugSet.has(service.slug)) {
        return;
      }

      names.add(service.service.toLowerCase());
      service.aliases.forEach((alias) => names.add(alias.toLowerCase()));
    });

    return names;
  }, [index.services, selectedServiceSlugSet]);
  const visibleServices = useMemo(
    () =>
      index.services.filter((service) => {
        if (!normalizedServiceSearch) {
          return true;
        }

        const searchable = [service.service, ...service.aliases, ...service.categories]
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedServiceSearch);
      }),
    [index.services, normalizedServiceSearch]
  );
  const selectedServices = useMemo(
    () =>
      index.services.filter((service) => activePackage?.selectedServiceSlugs.includes(service.slug) ?? false),
    [activePackage?.selectedServiceSlugs, index.services]
  );
  const packageItems = useMemo(() => {
    if (!items || !activePackage) {
      return [];
    }

    return items.filter((item) =>
      matchesPackageService(item, selectedServiceSlugSet, selectedServiceNameSet)
    );
  }, [activePackage, items, selectedServiceNameSet, selectedServiceSlugSet]);

  const includedCount = packageItems.filter(
    (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Include"
  ).length;
  const notApplicableCount = packageItems.filter(
    (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Not Applicable"
  ).length;
  const excludedCount = packageItems.filter(
    (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Exclude"
  ).length;
  const pendingCount = packageItems.filter(
    (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Needs Review"
  ).length;
  const pricingSnapshots = useMemo(
    () =>
      selectedServices
        .map((service) => servicePricing[service.slug])
        .filter(Boolean) as ServicePricing[],
    [selectedServices, servicePricing]
  );
  const mappedPricingCount = pricingSnapshots.filter((pricing) => pricing.mapped).length;
  const pricingReady = selectedServices.length > 0 && pricingSnapshots.length === selectedServices.length;
  const startingRetailPrice = pricingSnapshots
    .map((pricing) => pricing.startsAtRetailPrice)
    .filter((price) => price !== undefined) as number[];

  useEffect(() => {
    let active = true;

    if (!activePackage || selectedServices.length === 0) {
      setServicePricing({});
      setPricingLoading(false);
      setPricingError(null);
      return;
    }

    setPricingLoading(true);
    setPricingError(null);

    loadServicePricingBatch(
      selectedServices.map((service) =>
        buildServicePricingRequest(service, service.regionalFitSummary, activePackage.targetRegions)
      )
    )
      .then((pricing) => {
        if (!active) {
          return;
        }

        setServicePricing(
          pricing.reduce<Record<string, ServicePricing>>((accumulator, entry) => {
            accumulator[entry.serviceSlug] = entry;
            return accumulator;
          }, {})
        );
        setPricingLoading(false);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setPricingLoading(false);
        setPricingError(nextError instanceof Error ? nextError.message : "Unable to load pricing.");
      });

    return () => {
      active = false;
    };
  }, [activePackage, selectedServices]);

  function refreshPackages(nextPackages: ReviewPackage[], nextActiveId: string | null) {
    setPackages(nextPackages);
    setActivePackageId(nextActiveId);
    saveActivePackageId(nextActiveId);
    setReviews(loadScopedReviews(nextActiveId));
    const nextActivePackage = nextPackages.find((entry) => entry.id === nextActiveId);

    setForm(createFormState(nextActivePackage));
  }

  function handleCreatePackage() {
    const nextPackage = upsertPackage(
      createReviewPackage({
        name: form.name,
        audience: form.audience,
        businessScope: form.businessScope,
        targetRegions: normalizeList(form.targetRegions)
      })
    );
    const nextPackages = loadPackages();

    refreshPackages(nextPackages, nextPackage.id);
  }

  function handleSelectPackage(nextPackageId: string) {
    refreshPackages(loadPackages(), nextPackageId || null);
  }

  function handleSavePackageDetails() {
    if (!activePackage) {
      return;
    }

    upsertPackage({
      ...activePackage,
      name: form.name.trim() || activePackage.name,
      audience: form.audience,
      businessScope: form.businessScope.trim(),
      targetRegions: normalizeList(form.targetRegions)
    });

    refreshPackages(loadPackages(), activePackage.id);
  }

  function handleDeletePackage() {
    if (!activePackage) {
      return;
    }

    deletePackage(activePackage.id);
    const nextPackages = loadPackages();

    refreshPackages(nextPackages, nextPackages[0]?.id ?? null);
  }

  function toggleServiceSelection(serviceSlug: string) {
    if (!activePackage) {
      return;
    }

    const selectedServiceSlugs = activePackage.selectedServiceSlugs.includes(serviceSlug)
      ? activePackage.selectedServiceSlugs.filter((entry) => entry !== serviceSlug)
      : [...activePackage.selectedServiceSlugs, serviceSlug];

    upsertPackage({
      ...activePackage,
      selectedServiceSlugs
    });

    refreshPackages(loadPackages(), activePackage.id);
  }

  function exportPackageCsv() {
    if (!activePackage) {
      return;
    }

    downloadCsv(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "review-package"}.csv`,
      buildPackageExportRows(activePackage, packageItems, reviews, {
        includeNotApplicable,
        includeNeedsReview
      })
    );
  }

  function exportPackageMarkdown() {
    if (!activePackage) {
      return;
    }

    downloadText(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "review-package"}.md`,
      buildPackageMarkdown(activePackage, packageItems, reviews, {
        includeNotApplicable,
        includeNeedsReview
      }),
      "text/markdown;charset=utf-8"
    );
  }

  function exportPackageText() {
    if (!activePackage) {
      return;
    }

    downloadText(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "review-package"}.txt`,
      buildPackageText(activePackage, packageItems, reviews, {
        includeNotApplicable,
        includeNeedsReview
      })
    );
  }

  function exportPackagePricingCsv() {
    if (!activePackage) {
      return;
    }

    downloadCsv(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "review-package"}-pricing.csv`,
      buildPackagePricingRows(activePackage, pricingSnapshots)
    );
  }

  function exportPackagePricingMarkdown() {
    if (!activePackage) {
      return;
    }

    downloadText(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "review-package"}-pricing.md`,
      buildPackagePricingMarkdown(activePackage, pricingSnapshots),
      "text/markdown;charset=utf-8"
    );
  }

  function exportPackagePricingText() {
    if (!activePackage) {
      return;
    }

    downloadText(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "review-package"}-pricing.txt`,
      buildPackagePricingText(activePackage, pricingSnapshots)
    );
  }

  return (
    <main className="section-stack">
      <section className="hero-panel director-hero editorial-hero">
        <div className="editorial-hero-layout">
          <div className="editorial-hero-copy">
            <p className="eyebrow">Project review package</p>
            <h1 className="hero-title">Scope the project once, then keep only the services that matter.</h1>
            <p className="hero-copy">
              Build a project package for a specific customer or solution, select only the Azure
              services in scope, review findings with project-specific notes, and export a clean
              handoff in CSV, Markdown, or text.
            </p>
            <p className="hero-note">
              This is the right workflow for cloud architects, pre-sales architects, sales
              architects, and senior reviewers who need a project-specific checklist instead of the
              full source catalog.
            </p>
            <div className="hero-actions">
              <Link href="/services" className="secondary-button">
                Browse services
              </Link>
              <Link href="/explorer" className="ghost-button">
                Open explorer
              </Link>
            </div>
          </div>

          <aside className="leadership-brief">
            <p className="eyebrow">Why this matters</p>
            <h2 className="leadership-title">One package, one project, one review story.</h2>
            <div className="leadership-list">
              <article>
                <strong>Scoped services</strong>
                <p>Keep only the Azure services that belong to the current solution in the package.</p>
              </article>
              <article>
                <strong>Project-specific notes</strong>
                <p>Record why a finding is included, not applicable, excluded, or still pending review.</p>
              </article>
              <article>
                <strong>Commercial fit</strong>
                <p>Regional availability and public retail pricing now follow the same package scope and target regions.</p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Package setup</p>
            <h2 className="section-title">Create or activate the project package that should receive notes.</h2>
            <p className="section-copy">
              Notes entered on service and explorer pages are scoped to the active package. If no
              package is active, the app falls back to local-only general notes.
            </p>
          </div>
        </div>

        <div className="package-header-grid">
          <article className="filter-card package-card">
            <div className="filter-grid">
              <label>
                <span className="microcopy">Active package</span>
                <select
                  className="field-select"
                  value={activePackageId ?? ""}
                  onChange={(event) => handleSelectPackage(event.target.value)}
                >
                  <option value="">No active package</option>
                  {packages.map((reviewPackage) => (
                    <option key={reviewPackage.id} value={reviewPackage.id}>
                      {reviewPackage.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="microcopy">Package name</span>
                <input
                  className="field-input"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Contoso edge review"
                />
              </label>

              <label>
                <span className="microcopy">Audience</span>
                <select
                  className="field-select"
                  value={form.audience}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      audience: event.target.value as ReviewPackageAudience
                    }))
                  }
                >
                  {AUDIENCES.map((audience) => (
                    <option key={audience} value={audience}>
                      {audience}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="microcopy">Target regions</span>
                <input
                  className="field-input"
                  value={form.targetRegions}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, targetRegions: event.target.value }))
                  }
                  placeholder="East US, West Europe, UAE Central"
                />
              </label>

              <label>
                <span className="microcopy">Business scope</span>
                <textarea
                  className="field-textarea"
                  value={form.businessScope}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, businessScope: event.target.value }))
                  }
                  placeholder="Capture the project scope, constraints, and customer assumptions."
                />
              </label>
            </div>

            <div className="button-row">
              <button type="button" className="primary-button" onClick={handleCreatePackage}>
                Create package
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSavePackageDetails}
                disabled={!activePackage}
              >
                Save package details
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={handleDeletePackage}
                disabled={!activePackage}
              >
                Delete package
              </button>
            </div>
          </article>

          <article className="filter-card package-card">
            <p className="eyebrow">Package summary</p>
            <div className="package-stats-grid">
              <article className="hero-metric-card">
                <span>Services in scope</span>
                <strong>{activePackage?.selectedServiceSlugs.length.toLocaleString() ?? "0"}</strong>
                <p>Only these services are exported as part of the project handoff.</p>
              </article>
              <article className="hero-metric-card">
                <span>Included findings</span>
                <strong>{includedCount.toLocaleString()}</strong>
                <p>Findings explicitly marked for the project package.</p>
              </article>
              <article className="hero-metric-card">
                <span>Not applicable</span>
                <strong>{notApplicableCount.toLocaleString()}</strong>
                <p>Findings retained with rationale when they do not apply to the current scope.</p>
              </article>
              <article className="hero-metric-card">
                <span>Pending review</span>
                <strong>{pendingCount.toLocaleString()}</strong>
                <p>Items still waiting for a project-specific decision or final note.</p>
              </article>
            </div>
          </article>
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Service scope</p>
            <h2 className="section-title">Choose only the Azure services that belong to this solution.</h2>
            <p className="section-copy">
              Start with the solution scope, then toggle services in or out of the project package.
              You can still review the full catalog from the service and explorer pages.
            </p>
          </div>
          <div className="chip-row">
            <span className="chip">{visibleServices.length.toLocaleString()} visible services</span>
          </div>
        </div>

        <div className="filter-card workspace-toolbar">
          <div className="workspace-toolbar-main">
            <input
              className="search-input"
              type="search"
              value={serviceSearch}
              placeholder="Search services to add into the package"
              onChange={(event) => setServiceSearch(event.target.value)}
            />
            <p className="microcopy">
              Package selection should reflect the actual solution scope, not every adjacent service
              that appears in the source repository.
            </p>
          </div>
        </div>

        <div className="service-selection-grid">
          {visibleServices.map((service) => {
            const selected = activePackage?.selectedServiceSlugs.includes(service.slug) ?? false;

            return (
              <article className="future-card service-selection-card" key={service.slug}>
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Azure service</p>
                    <h3>{service.service}</h3>
                  </div>
                  <span className="chip">
                    {selected ? "In package" : "Not in package"}
                  </span>
                </div>
                <p className="microcopy">{service.description}</p>
                <div className="button-row">
                  <button
                    type="button"
                    className={selected ? "secondary-button" : "ghost-button"}
                    disabled={!activePackage}
                    onClick={() => toggleServiceSelection(service.slug)}
                  >
                    {selected ? "Remove from package" : "Add to package"}
                  </button>
                  <Link href={`/services/${service.slug}`} className="muted-link">
                    Open service view
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Export package</p>
            <h2 className="section-title">Download only the scoped services and their project notes.</h2>
            <p className="section-copy">
              CSV works well for spreadsheets and action tracking. Markdown and text are better for
              architecture notes, pre-sales handoff, and leadership summaries.
            </p>
          </div>
        </div>

        <div className="package-header-grid">
          <article className="filter-card package-card">
            <div className="filter-grid">
              <label className="package-option">
                <input
                  type="checkbox"
                  checked={includeNotApplicable}
                  onChange={(event) => setIncludeNotApplicable(event.target.checked)}
                />
                <span className="microcopy">Include `Not Applicable` findings with rationale</span>
              </label>
              <label className="package-option">
                <input
                  type="checkbox"
                  checked={includeNeedsReview}
                  onChange={(event) => setIncludeNeedsReview(event.target.checked)}
                />
                <span className="microcopy">Include `Needs Review` items in the handoff</span>
              </label>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                disabled={!activePackage || packageItems.length === 0}
                onClick={exportPackageCsv}
              >
                Download CSV
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!activePackage || packageItems.length === 0}
                onClick={exportPackageMarkdown}
              >
                Download Markdown
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!activePackage || packageItems.length === 0}
                onClick={exportPackageText}
              >
                Download text
              </button>
            </div>
          </article>

          <article className="leadership-brief package-card">
            <p className="eyebrow">Package guidance</p>
            <h2 className="leadership-title">Notes, regional fit, and pricing now share the same project scope.</h2>
            <div className="leadership-list">
              <article>
                <strong>Target regions</strong>
                <p>Package target regions now drive the default filter for service availability, restrictions, and pricing emphasis.</p>
              </article>
              <article>
                <strong>Pricing baseline</strong>
                <p>Use the commercial snapshot as the list-price baseline before moving into customer-specific usage and discount assumptions.</p>
              </article>
              <article>
                <strong>Commercial handoff</strong>
                <p>Export review notes separately from the pricing snapshot so each audience gets the level of detail they need.</p>
              </article>
            </div>
          </article>
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Commercial snapshot</p>
            <h2 className="section-title">Export pricing only for the services included in this package.</h2>
            <p className="section-copy">
              This commercial view follows the selected services and target regions from the active
              package, so pre-sales and solution teams can carry a focused retail pricing snapshot
              instead of the full Azure catalog.
            </p>
          </div>
        </div>

        <div className="package-header-grid">
          <article className="filter-card package-card">
            <div className="package-stats-grid">
              <article className="hero-metric-card">
                <span>Selected services</span>
                <strong>{selectedServices.length.toLocaleString()}</strong>
                <p>Only these services are queried for pricing.</p>
              </article>
              <article className="hero-metric-card">
                <span>Pricing mapped</span>
                <strong>{mappedPricingCount.toLocaleString()}</strong>
                <p>Selected services with a current retail pricing query match.</p>
              </article>
              <article className="hero-metric-card">
                <span>Starting retail row</span>
                <strong>
                  {startingRetailPrice.length > 0
                    ? formatRetailPrice(Math.min(...startingRetailPrice), pricingSnapshots[0]?.currencyCode ?? "USD")
                    : "Not published"}
                </strong>
                <p>Lowest retail row across the scoped services in this package.</p>
              </article>
              <article className="hero-metric-card">
                <span>Target regions</span>
                <strong>{activePackage?.targetRegions.length.toLocaleString() ?? "0"}</strong>
                <p>These regions are used to highlight region-matched pricing rows.</p>
              </article>
            </div>

            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                disabled={!activePackage || !pricingReady || pricingLoading}
                onClick={exportPackagePricingCsv}
              >
                Download pricing CSV
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!activePackage || !pricingReady || pricingLoading}
                onClick={exportPackagePricingMarkdown}
              >
                Download pricing Markdown
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!activePackage || !pricingReady || pricingLoading}
                onClick={exportPackagePricingText}
              >
                Download pricing text
              </button>
            </div>
          </article>

          <article className="leadership-brief package-card">
            <p className="eyebrow">Commercial guidance</p>
            <h2 className="leadership-title">Use list pricing for the first draft, then model quantity and agreement changes.</h2>
            <div className="leadership-list">
              <article>
                <strong>Retail baseline</strong>
                <p>The package snapshot uses Microsoft public retail pricing so the numbers are sourced and repeatable.</p>
              </article>
              <article>
                <strong>Target-region bias</strong>
                <p>Pricing queries stay global, but the package highlights rows that line up with the target deployment regions.</p>
              </article>
              <article>
                <strong>Refine later</strong>
                <p>Use the Azure Pricing Calculator after sign-in to layer usage assumptions, discounts, and negotiated terms.</p>
              </article>
            </div>
          </article>
        </div>

        {pricingLoading ? (
          <section className="filter-card">
            <p className="eyebrow">Pricing load</p>
            <h3>Loading retail pricing for the selected services.</h3>
            <p className="microcopy">
              The package is querying Microsoft’s Azure Retail Prices API for every service in scope.
            </p>
          </section>
        ) : null}

        {pricingError ? (
          <section className="filter-card">
            <p className="eyebrow">Pricing load</p>
            <h3>Pricing could not be loaded right now.</h3>
            <p className="microcopy">{pricingError}</p>
          </section>
        ) : null}

        {!pricingLoading && !pricingError && pricingSnapshots.length > 0 ? (
          <div className="service-selection-grid">
            {pricingSnapshots.map((pricing) => (
              <article className="future-card service-selection-card" key={pricing.serviceSlug}>
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Commercial fit</p>
                    <h3>{pricing.serviceName}</h3>
                  </div>
                  <span className="chip">{pricing.mapped ? "Pricing mapped" : "Pricing pending"}</span>
                </div>
                <p className="microcopy">
                  {pricing.mapped
                    ? `${pricing.skuCount.toLocaleString()} SKUs, ${pricing.billingLocationCount.toLocaleString()} billing locations, and ${pricing.targetRegionMatchCount.toLocaleString()} target-region matches are currently published.`
                    : "No retail pricing mapping is published for this service yet in the current package workflow."}
                </p>
                <div className="chip-row">
                  <span className="chip">
                    Starts at {formatRetailPrice(pricing.startsAtRetailPrice, pricing.currencyCode)}
                  </span>
                  {pricing.query ? (
                    <span className="chip">
                      {pricing.query.field} {pricing.query.operator} {pricing.query.value}
                    </span>
                  ) : null}
                </div>
                {pricing.notes.length > 0 ? (
                  <p className="microcopy">{pricing.notes.join(" ")}</p>
                ) : null}
                <div className="button-row">
                  <Link href={`/services/${pricing.serviceSlug}`} className="muted-link">
                    Open service view
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
