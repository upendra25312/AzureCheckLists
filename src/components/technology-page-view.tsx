"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TechnologyPayload, ReviewDraft } from "@/types";
import { ItemDrawer } from "@/components/item-drawer";
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

  const filtered = filterItems(payload.items, {
    search,
    statuses: [],
    severities: [],
    waf: [],
    services: [],
    sourceKinds: [],
    technologies: []
  });
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
        <div>
          <p className="eyebrow">Technology detail</p>
          <h1 className="technology-title">{payload.technology.technology}</h1>
          <p className="technology-summary">{payload.technology.description}</p>
          <div className="button-row">
            <Link href="/" className="secondary-button">
              Back to overview
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
            <strong>{payload.technology.status}</strong>
            <span>Checklist maturity</span>
          </article>
          <article className="technology-card">
            <strong>{payload.technology.sourceKind}</strong>
            <span>Source folder</span>
          </article>
        </div>
      </section>

      <section className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Source traceability</p>
            <h2 className="section-title">
              Every rendered item stays linked to its originating file.
            </h2>
          </div>
        </div>
        <div className="trace-grid">
          <article className="trace-card">
            <strong>Source path</strong>
            <p>{payload.technology.sourcePath}</p>
          </article>
          <article className="trace-card">
            <strong>Generated at</strong>
            <p>{payload.generatedAt}</p>
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
        <div className="section-head">
          <div>
            <p className="eyebrow">Technology explorer</p>
            <h2 className="section-title">
              Review one checklist family without losing exportable local notes.
            </h2>
          </div>
        </div>
        <div className="filter-card">
          <input
            className="search-input"
            type="search"
            placeholder="Search within this technology family"
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
                  </div>
                  <p className="item-text">{item.text}</p>
                  {item.description ? <p className="item-description">{item.description}</p> : null}
                </button>
              </div>
            ))}
          </div>
        </article>
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
