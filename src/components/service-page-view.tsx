"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ItemDrawer } from "@/components/item-drawer";
import { QualityBadge } from "@/components/quality-badge";
import { ServicePricingPanel } from "@/components/service-pricing-panel";
import { ServiceRegionalFitPanel } from "@/components/service-regional-fit";
import { filterItems } from "@/lib/filters";
import {
  createEmptyReview,
  loadActivePackageId,
  loadPackages,
  loadScopedReviews,
  saveScopedReviews,
  upsertPackage
} from "@/lib/review-storage";
import type { ReviewDraft, ReviewPackage, ServicePayload } from "@/types";

export function ServicePageView({ payload }: { payload: ServicePayload }) {
  const [selectedGuid, setSelectedGuid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reviews, setReviews] = useState<Record<string, ReviewDraft>>({});
  const [activePackage, setActivePackage] = useState<ReviewPackage | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const baselineFamilies = payload.service.families.filter((family) => family.maturityBucket === "GA");
  const extendedFamilies = payload.service.families.filter(
    (family) => family.maturityBucket === "Preview" || family.maturityBucket === "Mixed"
  );
  const deprecatedFamilies = payload.service.families.filter(
    (family) => family.maturityBucket === "Deprecated"
  );

  useEffect(() => {
    const packageId = loadActivePackageId();
    const nextActivePackage = loadPackages().find((entry) => entry.id === packageId) ?? null;

    setActivePackage(nextActivePackage);
    setReviews(loadScopedReviews(packageId));
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    saveScopedReviews(activePackage?.id ?? null, reviews);
  }, [activePackage?.id, reviews, storageReady]);

  const filtered = useMemo(
    () =>
      filterItems(payload.items, {
        search,
        statuses: [],
        maturityBuckets: [],
        severities: [],
        waf: [],
        services: [],
        sourceKinds: [],
        technologies: []
      }),
    [payload.items, search]
  );

  const reviewedCount = filtered.filter((item) => {
    const review = reviews[item.guid];

    return review && review.reviewState !== "Not Reviewed";
  }).length;
  const selectedItem =
    selectedGuid !== null
      ? payload.items.find((item) => item.guid === selectedGuid) ?? null
      : null;
  const generatedDate = new Date(payload.generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const categorySummary =
    payload.service.categories.slice(0, 5).join(", ") || "Generalized review guidance";
  const wafSummary = payload.service.wafPillars.join(", ") || "Unspecified";
  const serviceDecisionCues = [
    {
      label: "Lead with",
      value:
        payload.service.gaFamilyCount > 0
          ? `${payload.service.gaFamilyCount.toLocaleString()} GA-ready families`
          : "Specialist review posture",
      copy:
        payload.service.gaFamilyCount > 0
          ? "Use the baseline families first when preparing design reviews, deployment checks, and leadership summaries."
          : "No default GA baseline exists yet, so this service should be presented with explicit validation caveats."
    },
    {
      label: "Widen with",
      value:
        extendedFamilies.length > 0
          ? `${extendedFamilies.length.toLocaleString()} extended families`
          : "Limited extension",
      copy:
        extendedFamilies.length > 0
          ? "Bring in preview and mixed-confidence families after the baseline is understood or when the architecture question needs more depth."
          : "There is little additional mapped guidance beyond the primary baseline, so most value comes from the core family set."
    },
    {
      label: "Prove before promotion",
      value: `${payload.service.highSeverityCount.toLocaleString()} high-severity findings`,
      copy:
        "Open item detail before carrying recommendations into leadership material so the source lineage and normalization context remain visible."
    }
  ];
  const serviceCommandMetrics = [
    {
      label: "Checklist families",
      value: payload.service.familyCount.toLocaleString(),
      detail: "Related families that mention or assess this service directly."
    },
    {
      label: "High-severity findings",
      value: payload.service.highSeverityCount.toLocaleString(),
      detail: "Findings that should be triaged earlier in the design and review conversation."
    },
    {
      label: "GA-ready baseline",
      value: payload.service.gaFamilyCount.toLocaleString(),
      detail: "Families safe to lead with when building a default review pack."
    },
    {
      label: "Project review state",
      value: activePackage
        ? activePackage.selectedServiceSlugs.includes(payload.service.slug)
          ? "In active review"
          : "Review active"
        : "No active review",
      detail: activePackage
        ? `Current review: ${activePackage.name}.`
        : "Start a project review to capture include, exclude, and not-applicable decisions."
    }
  ];

  function updateReview(guid: string, next: Partial<ReviewDraft>) {
    setReviews((current) => {
      return {
        ...current,
        [guid]: {
          ...(current[guid] ?? createEmptyReview()),
          ...next
        }
      };
    });
  }

  function addServiceToActivePackage() {
    if (!activePackage) {
      return;
    }

    if (activePackage.selectedServiceSlugs.includes(payload.service.slug)) {
      return;
    }

    const nextPackage = upsertPackage({
      ...activePackage,
      selectedServiceSlugs: [...activePackage.selectedServiceSlugs, payload.service.slug]
    });

    setActivePackage(nextPackage);
  }

  return (
    <main className="section-stack">
      <section className="review-command-panel">
        <div className="detail-command-grid">
          <div className="detail-command-copy">
            <div>
              <p className="eyebrow">Azure service</p>
              <h1 className="review-command-title">{payload.service.service}</h1>
              <p className="review-command-summary">{payload.service.description}</p>
              <p className="microcopy">
                Generated {generatedDate}. Use this page to decide whether this service belongs in
                the design, where it can run, what the public pricing looks like, and which
                findings need project-specific notes.
              </p>
            </div>
            <div className="button-row">
              <Link href="/services" className="secondary-button">
                Back to services
              </Link>
              <Link href="/" className="ghost-button">
                Back to overview
              </Link>
              <Link href="/how-to-use" className="ghost-button">
                Review guidance
              </Link>
            </div>
          </div>

          <aside className="leadership-brief detail-command-sidecar">
            <p className="eyebrow">Service brief</p>
            <h2 className="leadership-title">What to lead with on this page.</h2>
            <div className="leadership-list">
              <article>
                <strong>Baseline position</strong>
                <p>
                  {payload.service.gaFamilyCount > 0
                    ? `${payload.service.gaFamilyCount.toLocaleString()} GA-ready families can anchor the review baseline.`
                    : "No GA-ready family exists yet, so review confidence depends on preview guidance and explicit validation."}
                </p>
              </article>
              <article>
                <strong>Coverage</strong>
                <p>
                  {payload.service.itemCount.toLocaleString()} findings across{" "}
                  {payload.service.familyCount.toLocaleString()} checklist families.
                </p>
              </article>
              <article>
                <strong>Service handling</strong>
                <p>{payload.service.whatThisMeans}</p>
              </article>
            </div>
          </aside>
        </div>

        <div className="review-command-metrics">
          {serviceCommandMetrics.map((metric) => (
            <article className="review-command-metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="filter-card package-context-card">
        {activePackage ? (
          <div className="package-context-grid">
            <div>
              <p className="eyebrow">Active project review</p>
              <h2 className="section-title">{activePackage.name}</h2>
              <p className="section-copy">
                Notes on this page are being written into the active project review for{" "}
                {activePackage.audience}. Add this service to the review scope if it belongs in the
                current solution.
              </p>
            </div>
            <div className="package-context-actions">
              <span className="chip">
                {activePackage.selectedServiceSlugs.includes(payload.service.slug)
                  ? "Service already in review"
                  : "Service not yet in review"}
              </span>
              <div className="button-row board-action-row-compact">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={addServiceToActivePackage}
                  disabled={activePackage.selectedServiceSlugs.includes(payload.service.slug)}
                >
                  Add service to project review
                </button>
                <Link href="/review-package" className="ghost-button">
                  Open project review
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="package-context-grid">
            <div>
              <p className="eyebrow">Project review</p>
              <h2 className="section-title">No active project review is selected.</h2>
              <p className="section-copy">
                You can still browse this service and keep local notes, but project-specific include,
                exclude, and not-applicable decisions work best when a project review is active.
              </p>
            </div>
            <div className="package-context-actions">
              <Link href="/review-package" className="primary-button">
                Start project review
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="surface-panel board-stage-panel story-ribbon">
        <div className="decision-cue-grid">
          <article className="decision-cue-card">
            <span>Step 1</span>
            <strong>Add the service to the project review</strong>
            <p>Do this first when the service really belongs to the customer design.</p>
          </article>
          <article className="decision-cue-card">
            <span>Step 2</span>
            <strong>Check regional fit and public pricing</strong>
            <p>Use the sections below to see availability, restrictions, and current retail pricing.</p>
          </article>
          <article className="decision-cue-card">
            <span>Step 3</span>
            <strong>Open findings and leave project notes</strong>
            <p>Mark items as included, not applicable, or excluded, then capture comments and evidence.</p>
          </article>
        </div>
      </section>

      <ServiceRegionalFitPanel
        service={payload.service}
        regionalFit={payload.regionalFit}
        targetRegions={activePackage?.targetRegions ?? []}
      />

      <ServicePricingPanel
        service={payload.service}
        regionalFit={payload.regionalFit}
        targetRegions={activePackage?.targetRegions ?? []}
      />

      <section className="surface-panel board-stage-panel story-ribbon">
        <div className="decision-cue-grid">
          {serviceDecisionCues.map((cue) => (
            <article className="decision-cue-card" key={cue.label}>
              <span>{cue.label}</span>
              <strong>{cue.value}</strong>
              <p>{cue.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel board-stage-panel family-metric-strip">
        <div className="hero-metrics-row">
          <article className="hero-metric-card">
            <span>Checklist families</span>
            <strong>{payload.service.familyCount.toLocaleString()}</strong>
            <p>Related families that mention or assess this service directly.</p>
          </article>
          <article className="hero-metric-card">
            <span>High-severity findings</span>
            <strong>{payload.service.highSeverityCount.toLocaleString()}</strong>
            <p>Findings that should be triaged earlier in the design and review conversation.</p>
          </article>
          <article className="hero-metric-card">
            <span>GA-ready baseline</span>
            <strong>{payload.service.gaFamilyCount.toLocaleString()}</strong>
            <p>Families safe to lead with when building a default review pack.</p>
          </article>
        </div>
      </section>

      <section className="surface-panel board-stage-panel executive-brief-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Recommended review path</p>
            <h2 className="section-title">
              Lead with the strongest service guidance, then widen only when the question requires it.
            </h2>
            <p className="section-copy">
              This service view is designed to remove guesswork. It shows which families should
              anchor the conversation, which add specialist depth, and which should stay in the background.
            </p>
          </div>
        </div>

        <div className="service-path-grid">
          <article className="future-card">
            <h3>Baseline families</h3>
            <p className="microcopy">
              Lead with these families when preparing design reviews, deployment checks, and leadership summaries.
            </p>
            <div className="service-family-stack">
              {baselineFamilies.length > 0 ? (
                baselineFamilies.map((family) => (
                  <div className="service-family-card" key={family.slug}>
                    <Link href={`/technologies/${family.slug}`} className="muted-link">
                      {family.technology}
                    </Link>
                    <QualityBadge technology={family} compact />
                  </div>
                ))
              ) : (
                <p className="microcopy">
                  No GA-ready baseline exists yet for this service. Use preview guidance with explicit review judgment.
                </p>
              )}
            </div>
          </article>

          <article className="future-card">
            <h3>Extended guidance</h3>
            <p className="microcopy">
              Use these families to broaden design depth or cross-check assumptions after the baseline is understood.
            </p>
            <div className="service-family-stack">
              {extendedFamilies.length > 0 ? (
                extendedFamilies.map((family) => (
                  <div className="service-family-card" key={family.slug}>
                    <Link href={`/technologies/${family.slug}`} className="muted-link">
                      {family.technology}
                    </Link>
                    <QualityBadge technology={family} compact />
                  </div>
                ))
              ) : (
                <p className="microcopy">No additional preview or mixed-confidence families are currently mapped.</p>
              )}
            </div>
          </article>

          <article className="future-card">
            <h3>Historical context</h3>
            <p className="microcopy">
              Keep these visible for traceability or migration planning, but not as the design baseline.
            </p>
            <div className="service-family-stack">
              {deprecatedFamilies.length > 0 ? (
                deprecatedFamilies.map((family) => (
                  <div className="service-family-card" key={family.slug}>
                    <Link href={`/technologies/${family.slug}`} className="muted-link">
                      {family.technology}
                    </Link>
                    <QualityBadge technology={family} compact />
                  </div>
                ))
              ) : (
                <p className="microcopy">No deprecated families are currently mapped to this service.</p>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="surface-panel board-stage-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Service context</p>
            <h2 className="section-title">
              Understand the main design areas and Well-Architected pillars this service touches.
            </h2>
          </div>
        </div>
        <div className="traceability-grid">
          <article className="trace-card">
            <strong>Primary categories</strong>
            <p>{categorySummary}</p>
          </article>
          <article className="trace-card">
            <strong>WAF pillars</strong>
            <p>{wafSummary}</p>
          </article>
          <article className="trace-card">
            <strong>Aliases seen in source</strong>
            <p>{payload.service.aliases.join(", ") || "None retained"}</p>
          </article>
          <article className="trace-card">
            <strong>Service guidance note</strong>
            <p>{payload.service.whatThisMeans}</p>
          </article>
          <article className="trace-card">
            <strong>Proof before promotion</strong>
            <p>
              Open any finding to inspect the source file, repository link, and normalization
              details before turning it into a recommendation or leadership takeaway.
            </p>
          </article>
        </div>
      </section>

      <section className="surface-panel board-stage-panel">
        <div className="section-head family-list-head">
          <div>
            <p className="eyebrow">Service findings</p>
            <h2 className="section-title">
              Review the findings for this service without losing the related family context.
            </h2>
            <p className="section-copy">
              Search within the service, open any finding for detail, and move into the family page
              when you need the broader checklist context around a recommendation. Review notes
              stay in this browser unless you export them deliberately.
            </p>
          </div>
          <div className="chip-row family-actions">
            <span className="chip">{filtered.length.toLocaleString()} visible findings</span>
            <span className="chip">{reviewedCount.toLocaleString()} locally reviewed</span>
          </div>
        </div>
        <div className="filter-card workspace-toolbar board-toolbar-card">
          <div className="workspace-toolbar-main">
            <input
              className="search-input"
              type="search"
              placeholder={`Search ${payload.service.service} findings by recommendation, family, or category`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <p className="microcopy">
              Most teams start with the baseline families above, then search within findings only
              when the discussion turns to a specific recommendation.
            </p>
          </div>
        </div>

        {filtered.length > 0 ? (
          <article className="list-card review-list-card">
            <div className="item-list">
              {filtered.map((item) => (
                <div className="item-row" key={item.guid}>
                  <button type="button" onClick={() => setSelectedGuid(item.guid)}>
                    <div className="item-topline">
                      {item.severity ? <span className="pill">{item.severity}</span> : null}
                      {item.waf ? <span className="pill">{item.waf}</span> : null}
                      <span className="pill">{item.technology}</span>
                      <span className="pill">{item.technologyMaturityBucket}</span>
                      {reviews[item.guid]?.packageDecision ? (
                        <span className="pill">{reviews[item.guid]?.packageDecision}</span>
                      ) : null}
                    </div>
                    <p className="item-text">{item.text}</p>
                    <div className="item-meta">
                      {item.category ? <span className="chip">{item.category}</span> : null}
                      {item.subcategory ? <span className="chip">{item.subcategory}</span> : null}
                      {item.serviceCanonical ?? item.service ? (
                        <span className="chip">{item.serviceCanonical ?? item.service}</span>
                      ) : null}
                    </div>
                    {item.description ? <p className="item-description">{item.description}</p> : null}
                  </button>
                  <div className="button-row">
                    <Link href={`/technologies/${item.technologySlug}`} className="muted-link">
                      Open family detail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : (
          <section className="filter-card">
            <p className="eyebrow">No matching findings</p>
            <h3>Broaden the search to see more guidance for this service.</h3>
            <p className="microcopy">
              Try a shorter search term or move into one of the related family pages for broader context.
            </p>
          </section>
        )}
      </section>

      {selectedItem ? (
        <ItemDrawer
          item={selectedItem}
          review={reviews[selectedItem.guid] ?? createEmptyReview()}
          onClose={() => setSelectedGuid(null)}
          onUpdate={(next) => updateReview(selectedItem.guid, next)}
          activePackageName={activePackage?.name ?? null}
        />
      ) : null}
    </main>
  );
}
