import type { Route } from "next";
import Link from "next/link";
import { HomepageServiceBrowser } from "@/components/homepage-service-browser";
import { HomepageReviewInitializer } from "@/components/homepage-review-initializer";
import type { HomepagePricingSnapshot } from "@/lib/homepage-pricing";
import type { CatalogSummary, ChecklistItem, ServiceIndex, ServiceSummary } from "@/types";

function HomeGlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 10h13M10 3c1.8 2 2.8 4.3 2.8 7S11.8 15 10 17M10 3c-1.8 2-2.8 4.3-2.8 7S8.2 15 10 17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="m15.5 16.8 2.1 2.1 3.4-4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HomePricingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h10l3 3v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 8h6M9 12h6M9 16h4M14.5 5.5V10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M12 7.2c-.4-.5-1-.7-1.7-.7-1 0-1.7.5-1.7 1.3 0 2 3.7.8 3.7 3 0 .9-.8 1.5-1.9 1.5-.8 0-1.6-.3-2.1-.8M10.2 5.8v7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function HomeFindingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h10l3 3v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m9 9 1.4 1.4L13 7.8M9 13h6M9 17h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M17.7 16.2 21 22h-6.6l3.3-5.8Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M17.7 18.2v1.5M17.7 20.8h0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function HomeDocIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M15 3v4h4M9 12h6M9 16h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M9.3 9.2 11 11l2.7-2.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function HomeSheetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M9 7h6M9 11h6M9 15h6M9 19h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M12 3v18" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function HomeSnapshotIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h10l3 3v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M15 3v4h4M9 12h6M9 16h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path
        d="M9 8.2h4.7M15.2 8.2h0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function HomeContinuityIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 4h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M8 4v5h8V4M9 14h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function getFindingServiceLabel(item: ChecklistItem) {
  const serviceLabel = item.serviceCanonical ?? item.service ?? "Service";

  if (/kubernetes service/i.test(serviceLabel) || /AKS/i.test(serviceLabel)) {
    return "AKS";
  }

  if (/API Management/i.test(serviceLabel)) {
    return "APIM";
  }

  if (/App Service/i.test(serviceLabel)) {
    return "App Service";
  }

  return serviceLabel;
}

function getFindingHref(item: ChecklistItem): Route {
  if (item.serviceSlug) {
    return `/services/${item.serviceSlug}` as Route;
  }

  if (item.technologySlug) {
    return `/technologies/${item.technologySlug}` as Route;
  }

  return "/review-package";
}

export function DashboardHome({
  summary,
  serviceIndex,
  featuredServices,
  pricingSnapshot,
  featuredFindings
}: {
  summary: CatalogSummary;
  serviceIndex: ServiceIndex;
  featuredServices: ServiceSummary[];
  pricingSnapshot: HomepagePricingSnapshot;
  featuredFindings: ChecklistItem[];
}) {
  const generatedDate = new Date(summary.generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const pricingGeneratedDate = new Date(pricingSnapshot.generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const fallbackFindings: ChecklistItem[] = [
    {
      guid: "fallback-1",
      technology: "",
      technologySlug: "",
      technologyStatus: "GA",
      technologyMaturityBucket: "GA",
      usageConfidence: "High",
      technologyQualityScore: 100,
      family: "",
      sourceKind: "checklists",
      text: "Use the review workspace to capture included findings and service-level decisions."
    },
    {
      guid: "fallback-2",
      technology: "",
      technologySlug: "",
      technologyStatus: "GA",
      technologyMaturityBucket: "GA",
      usageConfidence: "High",
      technologyQualityScore: 100,
      family: "",
      sourceKind: "checklists",
      text: "Record project-specific rationale before exporting the final review pack."
    }
  ];
  const sampleFindings =
    featuredFindings.length > 0 ? featuredFindings : fallbackFindings;
  const artifacts = [
    {
      title: "Design notes",
      copy: "Narrative for design reviews.",
      href: "/review-package#project-review-local-exports" as const,
      icon: <HomeDocIcon />
    },
    {
      title: "Checklist CSV",
      copy: "Action list for owners.",
      href: "/review-package#project-review-local-exports" as const,
      icon: <HomeSheetIcon />
    },
    {
      title: "Pricing snapshot",
      copy: "Retail baseline for the scoped review.",
      href: "/review-package#project-review-pricing" as const,
      icon: <HomeSnapshotIcon />
    },
    {
      title: "Continuity file",
      copy: "Resume the same review later.",
      href: "/my-project-reviews" as const,
      icon: <HomeContinuityIcon />
    }
  ];

  return (
    <main className="home-reference-main">
      <HomepageReviewInitializer />

      <section className="home-workflow-intro" aria-label="How to use this homepage">
        <div className="home-workflow-copy">
          <p className="home-step-label">Recommended flow</p>
          <h2>Three steps. One scoped review.</h2>
          <p>Start the review, confirm fit, then capture decisions for what is actually in scope.</p>
        </div>

        <div className="home-workflow-metrics" aria-label="Homepage summary metrics">
          <article className="home-workflow-metric">
            <strong>{serviceIndex.services.length.toLocaleString()}</strong>
            <span>normalized Azure services</span>
          </article>
          <article className="home-workflow-metric">
            <strong>{summary.itemCount.toLocaleString()}</strong>
            <span>review findings in the catalog</span>
          </article>
          <article className="home-workflow-metric">
            <strong>{pricingGeneratedDate}</strong>
            <span>latest pricing refresh</span>
          </article>
        </div>
      </section>

      <section className="home-card-grid" aria-label="Review workflow cards">
        <article className="home-reference-card">
          <div className="home-card-head">
            <div>
              <p className="home-step-label">Step 1</p>
              <h2>Validate service and region fit</h2>
              <p className="home-card-summary">Search services and check regional constraints.</p>
            </div>
            <div className="home-card-icon home-card-icon-region">
              <HomeGlobeIcon />
            </div>
          </div>

          <HomepageServiceBrowser services={serviceIndex.services} featuredServices={featuredServices} />

          <p className="home-card-footer">
            {serviceIndex.services.length.toLocaleString()} services normalized.
          </p>
        </article>

        <article className="home-reference-card">
          <div className="home-card-head">
            <div>
              <p className="home-step-label">Step 2</p>
              <h2>Assess retail pricing posture</h2>
              <p className="home-card-summary">Review a first-pass retail baseline.</p>
            </div>
            <div className="home-card-icon home-card-icon-pricing">
              <HomePricingIcon />
            </div>
          </div>

          <div className="home-pricing-table">
            <div className="home-pricing-row home-pricing-row-head">
              <span>Service</span>
              <span>Estimated Monthly</span>
            </div>
            {pricingSnapshot.rows.length > 0 ? (
              pricingSnapshot.rows.map((row) => (
                <div className="home-pricing-row" key={`${row.serviceSlug}-${row.skuName}-${row.location}`}>
                  <div className="home-pricing-service">
                    <strong>{row.serviceName}</strong>
                    <span>
                      {row.skuName} · {row.location}
                    </span>
                  </div>
                  <div className="home-pricing-value">
                    <strong>
                      {row.approximateMonthlyPrice !== undefined
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: row.currencyCode,
                            maximumFractionDigits: 2
                          }).format(row.approximateMonthlyPrice)
                        : "See row details"}
                    </strong>
                    <span>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: row.currencyCode,
                        maximumFractionDigits: 6
                      }).format(row.retailPrice)}{" "}
                      retail rate / {row.unitOfMeasure || "unit"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="home-pricing-row">
                <div className="home-pricing-service">
                  <strong>Pricing snapshot unavailable</strong>
                  <span>The static homepage could not refresh Microsoft retail rows during this build.</span>
                </div>
                <div className="home-pricing-value">
                  <strong>Open review</strong>
                </div>
              </div>
            )}
          </div>

          <p className="home-pricing-note">
            {pricingSnapshot.notes.join(" ")} Snapshot refreshed {pricingGeneratedDate}.{" "}
            {pricingSnapshot.priceDisclaimer}
          </p>

          <Link href="/review-package#project-review-pricing" className="home-card-button">
            Open Scoped Pricing Review
          </Link>
        </article>

        <article className="home-reference-card">
          <div className="home-card-head">
            <div>
              <p className="home-step-label">Step 3</p>
              <h2>Audit design findings</h2>
              <p className="home-card-summary">Capture only the findings that matter to this review.</p>
            </div>
            <div className="home-card-icon home-card-icon-findings">
              <HomeFindingsIcon />
            </div>
          </div>

          <div className="home-findings-list">
            {sampleFindings.slice(0, 2).map((finding, index) => (
              <article className="home-finding-row" key={finding.guid}>
                <div className="home-finding-copy">
                  <strong>
                    [{getFindingServiceLabel(finding)}] {truncateText(finding.text, 88)}
                  </strong>
                  <span>
                    SEVERITY: [{finding.severity ?? "Guidance"}] | FAMILY:{" "}
                    {finding.technology || "Review guidance"}
                  </span>
                </div>
                <Link
                  href={getFindingHref(finding)}
                  className={`home-finding-action${index === 0 ? " home-finding-action-primary" : ""}`}
                >
                  Open
                </Link>
              </article>
            ))}
          </div>

          <p className="home-card-footer">
            {summary.itemCount.toLocaleString()} normalized findings.
          </p>
        </article>
      </section>

      <section className="home-artifacts-panel">
        <div className="home-artifacts-copy">
          <p className="home-step-label">Outputs</p>
          <h2>Export scoped artifacts</h2>
          <p>Share the review in the format the next audience needs.</p>
        </div>

        <div className="home-artifacts-grid">
          {artifacts.map((artifact) => (
            <Link href={artifact.href} className="home-artifact-link" key={artifact.title}>
              <div className="home-artifact-icon">{artifact.icon}</div>
              <div className="home-artifact-copy">
                <strong>{artifact.title}</strong>
                <p>{artifact.copy}</p>
                <span>Open</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <p className="home-data-footnote">
        Grounded in live catalog data. Last source refresh: {generatedDate}.{" "}
        <Link href="/data-health" className="home-data-footnote-link">
          View Data Health Dashboard.
        </Link>
      </p>
    </main>
  );
}
