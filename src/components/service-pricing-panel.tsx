"use client";

import { useEffect, useMemo, useState } from "react";
import { buildServiceMonthlyEstimate } from "@/lib/monthly-estimate";
import { buildServicePricingRequest, loadServicePricingBatch, matchesPricingTargetRegion } from "@/lib/service-pricing";
import type { ServicePricing, ServiceRegionalFitSummary, ServiceSummary } from "@/types";

function formatRetailPrice(price: number | undefined, currencyCode: string) {
  if (price === undefined || Number.isNaN(price)) {
    return "Not published";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 6
  }).format(price);
}

function findBaseMonthlyRow(pricing: ServicePricing | null, targetRegions: string[]) {
  if (!pricing) {
    return null;
  }

  const scopedRows =
    targetRegions.length > 0
      ? pricing.rows.filter(
          (row) =>
            matchesPricingTargetRegion(
              row.armRegionName,
              row.location,
              targetRegions,
              pricing.targetPricingLocations,
              row.locationKind
            ) || row.locationKind === "Global"
        )
      : pricing.rows;

  const baseRow =
    scopedRows.find(
      (row) => /base/i.test(row.meterName) && /month/i.test(row.unitOfMeasure)
    ) ??
    scopedRows.find(
      (row) =>
        /base|included routing rules/i.test(row.meterName) &&
        (/month/i.test(row.unitOfMeasure) || /hour/i.test(row.unitOfMeasure))
    );

  if (!baseRow) {
    return null;
  }

  if (/hour/i.test(baseRow.unitOfMeasure)) {
    return {
      ...baseRow,
      retailPrice: baseRow.retailPrice * 730,
      unitOfMeasure: "Estimated month"
    };
  }

  return baseRow;
}

export function ServicePricingPanel({
  service,
  regionalFit,
  targetRegions
}: {
  service: Pick<ServiceSummary, "slug" | "service" | "aliases" | "regionalFitSummary">;
  regionalFit?: ServiceRegionalFitSummary;
  targetRegions: string[];
}) {
  const [pricing, setPricing] = useState<ServicePricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"all" | "target">(targetRegions.length > 0 ? "target" : "all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    loadServicePricingBatch([buildServicePricingRequest(service, regionalFit, targetRegions)])
      .then((payload) => {
        if (!active) {
          return;
        }

        setPricing(payload[0] ?? null);
        setLoading(false);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to load pricing.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [regionalFit, service, targetRegions]);

  useEffect(() => {
    if (targetRegions.length > 0) {
      setScope("target");
      return;
    }

    setScope("all");
  }, [targetRegions]);

  const scopedRows = useMemo(() => {
    if (!pricing) {
      return [];
    }

    if (scope === "all" || targetRegions.length === 0) {
      return pricing.rows;
    }

    return pricing.rows.filter(
      (row) =>
        matchesPricingTargetRegion(
          row.armRegionName,
          row.location,
          targetRegions,
          pricing.targetPricingLocations,
          row.locationKind
        ) ||
        row.locationKind !== "Region"
    );
  }, [pricing, scope, targetRegions]);

  const baseMonthlyRow = useMemo(
    () => findBaseMonthlyRow(pricing, targetRegions),
    [pricing, targetRegions]
  );
  const monthlyEstimate = useMemo(
    () =>
      pricing
        ? buildServiceMonthlyEstimate(
            pricing,
            {
              plannedRegion: "",
              preferredSku: "",
              sizingNote: ""
            },
            targetRegions
          )
        : null,
    [pricing, targetRegions]
  );
  const highlightedStartingPrice =
    pricing?.startsAtTargetRetailPrice ?? pricing?.startsAtRetailPrice;

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return scopedRows;
    }

    return scopedRows.filter((row) =>
      [row.location, row.armRegionName, row.skuName, row.productName, row.meterName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [scopedRows, search]);

  if (loading) {
    return (
      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Commercial fit</p>
            <h2 className="section-title">Loading public retail pricing for this service.</h2>
            <p className="section-copy">
              Pricing is pulled from Microsoft’s Azure Retail Prices API so pre-sales and solution
              teams can see real SKU and region meter data before creating a project review export.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Commercial fit</p>
            <h2 className="section-title">Pricing could not be loaded right now.</h2>
            <p className="section-copy">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!pricing || !pricing.mapped) {
    return (
      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Commercial fit</p>
            <h2 className="section-title">Public retail pricing has not been mapped for this service yet.</h2>
            <p className="section-copy">
              Some review services are umbrella concepts or control-plane helpers, so Microsoft does
              not publish them as a clean standalone retail-priced service.
            </p>
          </div>
        </div>
        <div className="traceability-grid">
          {(pricing?.notes ?? []).map((note) => (
            <article className="trace-card" key={note}>
              <strong>Pricing note</strong>
              <p>{note}</p>
            </article>
          ))}
          <article className="trace-card">
            <strong>Official source</strong>
            <p>
              <a href="https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices" target="_blank" rel="noreferrer" className="muted-link">
                Azure Retail Prices API
              </a>
            </p>
          </article>
          <article className="trace-card">
            <strong>Calculator</strong>
            <p>
              <a href="https://azure.microsoft.com/en-us/pricing/calculator/" target="_blank" rel="noreferrer" className="muted-link">
                Azure Pricing Calculator
              </a>
            </p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="surface-panel editorial-section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Commercial fit</p>
          <h2 className="section-title">See the current public retail pricing by SKU, meter, and billing location.</h2>
          <p className="section-copy">
            This view is designed for pre-sales, solution architects, and sales teams who need list
            pricing visibility while scoping a service. Regional filters follow the active project review when present.
          </p>
        </div>
        {targetRegions.length > 0 ? (
          <div className="button-row">
            <button
              type="button"
              className={scope === "target" ? "secondary-button" : "ghost-button"}
              onClick={() => setScope("target")}
            >
              Target regions first
            </button>
            <button
              type="button"
              className={scope === "all" ? "secondary-button" : "ghost-button"}
              onClick={() => setScope("all")}
            >
              All pricing rows
            </button>
          </div>
        ) : null}
      </div>

      <div className="hero-metrics-row">
        <article className="hero-metric-card">
          <span>{pricing.startsAtTargetRetailPrice !== undefined ? "Lowest scoped meter" : "Lowest published meter"}</span>
          <strong>{formatRetailPrice(highlightedStartingPrice, pricing.currencyCode)}</strong>
          <p>
            This is the lowest published retail meter row in the current pricing scope. It is not a monthly Azure Pricing Calculator estimate.
          </p>
        </article>
        <article className="hero-metric-card">
          <span>Base monthly fee</span>
          <strong>{baseMonthlyRow ? formatRetailPrice(baseMonthlyRow.retailPrice, baseMonthlyRow.currencyCode) : "Not isolated"}</strong>
          <p>
            {baseMonthlyRow
              ? `${baseMonthlyRow.meterName} from the retail feed. The calculator can still add traffic, requests, domains, and other usage assumptions on top.`
              : "No clear recurring base-fee meter was isolated for this service."}
          </p>
        </article>
        <article className="hero-metric-card">
          <span>Target-region matches</span>
          <strong>{pricing.targetRegionMatchCount.toLocaleString()}</strong>
          <p>Pricing locations that match the active project review target regions.</p>
        </article>
        <article className="hero-metric-card">
          <span>Default monthly estimate</span>
          <strong>
            {monthlyEstimate?.supported
              ? formatRetailPrice(monthlyEstimate.selectedMonthlyCost, monthlyEstimate.currencyCode)
              : "Not modeled"}
          </strong>
          <p>
            {monthlyEstimate?.supported
              ? `${monthlyEstimate.selectedSkuName ?? "Selected SKU"} uses calculator-style defaults or recurring-base assumptions for a first-pass monthly view.`
              : "This service does not yet have a modeled monthly estimate; use the raw retail meters below or the Azure Pricing Calculator for manual refinement."}
          </p>
        </article>
      </div>

      <div className="traceability-grid">
        <article className="trace-card">
          <strong>Query used</strong>
          <p>
            {pricing.query
              ? `${pricing.query.field} ${pricing.query.operator} ${pricing.query.value}`
              : "No retail pricing query was captured."}
          </p>
        </article>
        <article className="trace-card">
          <strong>Billing locations</strong>
          <p>{pricing.billingLocationCount.toLocaleString()}</p>
        </article>
        <article className="trace-card">
          <strong>Meters returned</strong>
          <p>{pricing.meterCount.toLocaleString()}</p>
        </article>
        <article className="trace-card">
          <strong>Pricing source</strong>
          <p>
            <a href={pricing.sourceUrl} target="_blank" rel="noreferrer" className="muted-link">
              Azure Retail Prices API
            </a>
          </p>
          <p className="microcopy">
            Live values on this page come from the retail prices feed. The calculator is linked below only for monthly estimate refinement.
          </p>
        </article>
      </div>

      <div className="filter-card">
        <p className="eyebrow">Pricing source</p>
        <h3>
          {pricing.dataSource?.mode === "live"
            ? "Using a fresh retail-pricing refresh."
            : pricing.dataSource?.mode === "cache"
              ? "Using the scheduled Azure Function pricing cache."
              : pricing.dataSource?.mode === "stale-cache"
                ? "Using stale cache because the live pricing refresh did not complete."
                : "Using the Azure Function pricing backend."}
        </h3>
        <p className="microcopy">
          {pricing.dataSource?.mode === "live" && pricing.dataSource.refreshedAt
            ? `Microsoft retail pricing was refreshed at ${new Date(pricing.dataSource.refreshedAt).toLocaleString("en-US")}.`
            : pricing.dataSource?.mode === "cache" && pricing.dataSource.refreshedAt
              ? `The dedicated backend is serving cached pricing captured at ${new Date(pricing.dataSource.refreshedAt).toLocaleString("en-US")}.`
              : pricing.dataSource?.mode === "stale-cache" && pricing.dataSource.refreshedAt
                ? `${pricing.dataSource.lastError ?? "The live pricing refresh did not complete."} The panel stayed on the last successful cache from ${new Date(pricing.dataSource.refreshedAt).toLocaleString("en-US")}.`
                : "The pricing panel is loading data through the dedicated backend."}
        </p>
      </div>

      <div className="filter-card">
        <p className="eyebrow">Pricing note</p>
        <h3>Use retail pricing as the customer-facing baseline, then refine with quantity assumptions.</h3>
        <p className="microcopy">{pricing.priceDisclaimer}</p>
        <p className="microcopy">
          The Azure Pricing Calculator can show a higher monthly figure because it layers base fees and default traffic or request assumptions on top of the raw meter prices.
        </p>
        {pricing.notes.length > 0 ? (
          <div className="chip-row">
            {pricing.notes.map((note) => (
              <span className="chip" key={note}>
                {note}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="filter-card workspace-toolbar">
        <div className="workspace-toolbar-main">
          <input
            className="search-input"
            type="search"
            placeholder="Search pricing rows by location, SKU, product, or meter"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <p className="microcopy">
            {scope === "target" && targetRegions.length > 0
              ? `Target-region scope uses ${targetRegions.join(", ")} and also includes matching billing-zone or global meters when Microsoft prices a service that way.`
              : "All published pricing rows are shown, including zone-based billing rows for global services."}
          </p>
        </div>
      </div>

      {filteredRows.length > 0 ? (
        <article className="list-card review-list-card">
          <div className="item-list">
            {filteredRows.slice(0, 200).map((row) => (
              <div className="item-row" key={`${row.meterId}-${row.location}-${row.tierMinimumUnits}-${row.retailPrice}`}>
                <div>
                  <div className="item-topline">
                    <span className="pill">{row.locationKind}</span>
                    {row.skuName ? <span className="pill">{row.skuName}</span> : null}
                    {row.armRegionName ? <span className="pill">{row.armRegionName}</span> : null}
                    {matchesPricingTargetRegion(
                      row.armRegionName,
                      row.location,
                      targetRegions,
                      pricing.targetPricingLocations,
                      row.locationKind
                    ) ? (
                      <span className="pill">Target region match</span>
                    ) : null}
                  </div>
                  <p className="item-text">{row.location || "No published billing location"}</p>
                  <p className="item-description">
                    {row.productName} · {row.meterName} · {formatRetailPrice(row.retailPrice, row.currencyCode)} per{" "}
                    {row.unitOfMeasure}
                    {row.tierMinimumUnits > 0
                      ? ` after ${row.tierMinimumUnits.toLocaleString()} units`
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      ) : (
        <section className="filter-card">
          <p className="eyebrow">No pricing rows in view</p>
          <h3>Broaden the pricing filter to see more SKU and meter rows.</h3>
          <p className="microcopy">
            This can happen when the active project review target regions do not line up with the current
            retail billing locations published for the service.
          </p>
        </section>
      )}

      {filteredRows.length > 200 ? (
        <section className="filter-card">
          <p className="eyebrow">Result cap</p>
          <h3>Showing the first 200 pricing rows for readability.</h3>
          <p className="microcopy">
            Export the project review commercial snapshot to download every selected pricing row.
          </p>
        </section>
      ) : null}
    </section>
  );
}
