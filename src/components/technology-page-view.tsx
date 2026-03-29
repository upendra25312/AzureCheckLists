"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TechnologyPayload, ReviewDraft } from "@/types";
import { ItemDrawer } from "@/components/item-drawer";
import { QualityBadge } from "@/components/quality-badge";
import { filterItems } from "@/lib/filters";
import { createEmptyReview, STORAGE_KEYS } from "@/lib/review-storage";

export function TechnologyPageView({ payload }: { payload: TechnologyPayload }) {
  const [selectedGuid, setSelectedGuid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reviews, setReviews] = useState<Record<string, ReviewDraft>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.reviews);

      if (raw) {
        setReviews(JSON.parse(raw) as Record<string, ReviewDraft>);
      }
    } catch {
      setReviews({});
    }
  }, []);

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

  function updateReview(guid: string, next: Partial<ReviewDraft>) {
    setReviews((current) => {
      const nextReviews = {
        ...current,
        [guid]: {
          ...(current[guid] ?? createEmptyReview()),
          ...next
        }
      };

      window.localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(nextReviews));
      return nextReviews;
    });
  }

  return (
    <main className="section-stack">
      <section className="surface-panel technology-hero">
        <div className="technology-hero-summary">
          <p className="eyebrow">Checklist family</p>
          <h1 className="technology-title">{payload.technology.technology}</h1>
          <p className="technology-summary">{payload.technology.description}</p>
          <p className="section-copy">{payload.technology.whatThisMeans}</p>
          <div className="button-row">
            <Link href="/" className="secondary-button">
              Back to overview
            </Link>
            <Link href="/how-to-use" className="ghost-button">
              Responsible use guidance
            </Link>
            <a
              href={payload.technology.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="secondary-button"
            >
              Open source file
            </a>
          </div>
        </div>

        <aside className="technology-side-panel">
          <QualityBadge technology={payload.technology} />
          <div className="technology-grid">
            <article className="technology-card">
              <strong>{payload.technology.itemCount.toLocaleString()}</strong>
              <span>Items in this family</span>
            </article>
            <article className="technology-card">
              <strong>{payload.technology.highSeverityCount.toLocaleString()}</strong>
              <span>High-severity items</span>
            </article>
            <article className="technology-card">
              <strong>{payload.technology.maturityBucket}</strong>
              <span>Maturity bucket</span>
            </article>
            <article className="technology-card">
              <strong>{payload.technology.quality.recommendedUsageConfidence}</strong>
              <span>Recommended usage confidence</span>
            </article>
          </div>
        </aside>
      </section>

      <section className="surface-panel trust-strip">
        <div className="section-head">
          <div>
            <p className="eyebrow">Trust model</p>
            <h2 className="section-title">
              Treat this family according to its maturity, completeness, and source confidence.
            </h2>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card">
            <h3>Maturity</h3>
            <p>
              Source status is <strong>{payload.technology.status}</strong> and the family is
              currently grouped into the <strong>{payload.technology.maturityBucket}</strong>{" "}
              bucket.
            </p>
          </article>
          <article className="future-card">
            <h3>Recommended use</h3>
            <p>
              <strong>{payload.technology.quality.recommendedUsageConfidence}</strong> confidence.
              {` ${payload.technology.quality.summary}`}
            </p>
          </article>
          <article className="future-card">
            <h3>Limitation</h3>
            <p>
              This page accelerates architecture review preparation. It does not replace design
              authority, workload context, or formal sign-off.
            </p>
          </article>
        </div>
      </section>

      <section className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Quality profile</p>
            <h2 className="section-title">
              Show why this family should or should not carry weight in a decision pack.
            </h2>
            <p className="section-copy">
              The badge combines maturity status, metadata completeness, severity coverage, source
              coverage, and generation freshness into a transparent confidence signal.
            </p>
          </div>
        </div>
        <div className="traceability-grid">
          <article className="trace-card">
            <strong>Metadata completeness</strong>
            <p>{payload.technology.quality.metadataCompleteness}% of tracked fields present.</p>
          </article>
          <article className="trace-card">
            <strong>Severity confidence</strong>
            <p>{payload.technology.quality.severityConfidence}% of items carry severity metadata.</p>
          </article>
          <article className="trace-card">
            <strong>Source coverage quality</strong>
            <p>{payload.technology.quality.sourceCoverageQuality}% source-linked coverage.</p>
          </article>
          <article className="trace-card">
            <strong>Generated date</strong>
            <p>{payload.technology.quality.generatedDate}</p>
          </article>
        </div>
      </section>

      <section className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Source traceability</p>
            <h2 className="section-title">
              Every rendered item stays connected to the source family and normalization run.
            </h2>
          </div>
        </div>
        <div className="traceability-grid">
          <article className="trace-card">
            <strong>Source path</strong>
            <p>{payload.technology.sourcePath}</p>
          </article>
          <article className="trace-card">
            <strong>Source folder</strong>
            <p>{payload.technology.sourceKind}</p>
          </article>
          <article className="trace-card">
            <strong>Categories</strong>
            <p>{payload.technology.categories.join(", ") || "Unavailable"}</p>
          </article>
          <article className="trace-card">
            <strong>Services</strong>
            <p>{payload.technology.services.join(", ") || "Unavailable"}</p>
          </article>
        </div>
      </section>

      <section className="surface-panel">
        <div className="section-head family-list-head">
          <div>
            <p className="eyebrow">Family explorer</p>
            <h2 className="section-title">
              Work through one checklist family with local notes, export, and source context intact.
            </h2>
            <p className="section-copy">
              Use search to narrow the family, then open any item to capture review state,
              ownership, evidence, and exception context locally in the browser.
            </p>
          </div>
          <div className="chip-row family-actions">
            <span className="chip">{filtered.length.toLocaleString()} visible items</span>
            <span className="chip">{reviewedCount.toLocaleString()} locally reviewed</span>
          </div>
        </div>
        <div className="filter-card">
          <input
            className="search-input"
            type="search"
            placeholder="Search within this family by finding, service, or category"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <article className="list-card">
          <div className="item-list">
            {filtered.map((item) => (
              <div className="item-row" key={item.guid}>
                <button type="button" onClick={() => setSelectedGuid(item.guid)}>
                  <div className="item-topline">
                    {item.severity ? <span className="pill">{item.severity}</span> : null}
                    {item.waf ? <span className="pill">{item.waf}</span> : null}
                    {item.category ? <span className="pill">{item.category}</span> : null}
                    <span className="pill">{item.technologyMaturityBucket}</span>
                  </div>
                  <p className="item-text">{item.text}</p>
                  <div className="item-meta">
                    {item.id ? <span className="chip">{item.id}</span> : null}
                    {item.subcategory ? <span className="chip">{item.subcategory}</span> : null}
                    {item.service ? <span className="chip">{item.service}</span> : null}
                  </div>
                  {item.description ? <p className="item-description">{item.description}</p> : null}
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Recommended handling</p>
            <h2 className="section-title">Use the family according to its confidence level, not just its presence in the source repository.</h2>
          </div>
        </div>
        <div className="future-grid family-recommendations">
          <article className="future-card">
            <h3>Executive use</h3>
            <p>
              Bring this family into leadership packs only when its maturity and quality profile
              support that level of decision making.
            </p>
          </article>
          <article className="future-card">
            <h3>Architect use</h3>
            <p>
              Use this family to deepen design review, confirm source intent, and identify where
              additional service-specific validation is required.
            </p>
          </article>
          <article className="future-card">
            <h3>Operator use</h3>
            <p>
              Convert filtered findings into local action lists, then confirm remediation path and
              evidence with the actual workload team.
            </p>
          </article>
        </div>
      </section>

      {selectedItem ? (
        <ItemDrawer
          item={selectedItem}
          review={reviews[selectedItem.guid] ?? createEmptyReview()}
          onClose={() => setSelectedGuid(null)}
          onUpdate={(next) => updateReview(selectedItem.guid, next)}
        />
      ) : null}
    </main>
  );
}
