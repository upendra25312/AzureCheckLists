import Link from "next/link";
import type { CatalogSummary } from "@/types";
import { ExplorerClient } from "@/components/explorer-client";
import { SummaryCards } from "@/components/summary-cards";

export function DashboardHome({ summary }: { summary: CatalogSummary }) {
  const generatedDate = new Date(summary.generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const highSeverityMetric = summary.metrics.find(
    (metric) => metric.label === "High-severity findings"
  );
  const reviewWatchlistCount =
    summary.previewTechnologyCount +
    summary.mixedTechnologyCount +
    summary.deprecatedTechnologyCount;

  return (
    <main className="section-stack">
      <section className="hero-panel director-hero editorial-hero">
        <div className="editorial-hero-layout">
          <div className="editorial-hero-copy">
            <p className="eyebrow">Azure Architecture Review Dashboard</p>
            <h1 className="hero-title">Azure architecture review, made decision-ready.</h1>
            <p className="hero-copy">
              Review Azure checklist guidance through a maturity-aware, source-traceable
              experience built for executives, architects, and operators.
            </p>
            <p className="hero-note">
              Generated {generatedDate}. Designed to clarify what is mature, what requires
              extra judgment, and where leadership attention should go next.
            </p>
            <div className="hero-actions">
              <a href="#executive" className="primary-button">
                See executive summary
              </a>
              <a href="#explorer" className="secondary-button">
                Browse findings
              </a>
              <Link href="/how-to-use" className="ghost-button">
                Review guidance
              </Link>
            </div>
          </div>
          <aside className="leadership-brief">
            <p className="eyebrow">Leadership brief</p>
            <h2 className="leadership-title">What matters first.</h2>
            <div className="leadership-list">
              <article>
                <strong>Baseline</strong>
                <p>
                  Start with {summary.gaDefaultTechnologyCount.toLocaleString()} GA-ready
                  families and {summary.gaReadyItemCount.toLocaleString()} mature items.
                </p>
              </article>
              <article>
                <strong>Risk concentration</strong>
                <p>
                  {highSeverityMetric?.value.toLocaleString() ?? "0"} high-severity findings
                  remain visible across the full catalog.
                </p>
              </article>
              <article>
                <strong>Leadership action</strong>
                <p>
                  Validate {reviewWatchlistCount.toLocaleString()} lower-confidence families
                  before using them in executive decision packs.
                </p>
              </article>
            </div>
          </aside>
        </div>
        <div className="hero-metrics-row">
          <article className="hero-metric-card">
            <span>GA-ready baseline</span>
            <strong>{summary.gaDefaultTechnologyCount.toLocaleString()}</strong>
            <p>Mature checklist families suitable for the default executive view.</p>
          </article>
          <article className="hero-metric-card">
            <span>High-severity findings</span>
            <strong>{highSeverityMetric?.value.toLocaleString() ?? "0"}</strong>
            <p>Risk signal across the full catalog, including preview and deprecated sources.</p>
          </article>
          <article className="hero-metric-card">
            <span>Review watchlist</span>
            <strong>{reviewWatchlistCount.toLocaleString()}</strong>
            <p>Families that require explicit review judgment before heavy reliance.</p>
          </article>
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Who this supports</p>
            <h2 className="section-title">
              Built for leadership visibility, architecture depth, and operational follow-through.
            </h2>
            <p className="section-copy">
              The product is intentionally opinionated: lead with GA-ready content, expose
              confidence clearly, preserve source traceability, and keep lower-confidence guidance
              visible without presenting it as equivalent to mature baselines.
            </p>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card" id="executive">
            <h3>Executive review</h3>
            <p>
              Understand risk posture, what needs attention first, and which checklist families
              are stable enough to support leadership decisions.
            </p>
          </article>
          <article className="future-card" id="architect">
            <h3>Architecture review</h3>
            <p>
              See which design areas matter most, which families are high-confidence, and how
              each recommendation traces back to its source.
            </p>
          </article>
          <article className="future-card" id="operator">
            <h3>Operational follow-through</h3>
            <p>
              Filter to actionable items, export findings, and capture local review notes without
              pretending the product already has enterprise workflow persistence.
            </p>
          </article>
        </div>
      </section>

      <SummaryCards summary={summary} />

      <section className="surface-panel editorial-section" id="roadmap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Architecture choices</p>
            <h2 className="section-title">
              Designed to stay lightweight today and grow into stronger controls deliberately.
            </h2>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card">
            <h3>Purpose</h3>
            <p>
              A review support product that normalizes Azure checklist guidance into a form that
              is easier to consume, prioritize, and discuss.
            </p>
          </article>
          <article className="future-card">
            <h3>Boundary</h3>
            <p>
              Not an official Microsoft sign-off engine, not a compliance control system, and
              not a substitute for accountable architecture governance.
            </p>
          </article>
          <article className="future-card">
            <h3>Roadmap</h3>
            <p>
              Phase 1 stays static-first and local. Later phases can add authentication,
              shared review state, evidence workflows, and auditability when the hosting tier
              and governance model justify them.
            </p>
          </article>
        </div>
      </section>

      <ExplorerClient summary={summary} />
    </main>
  );
}
