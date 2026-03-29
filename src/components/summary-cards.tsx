import Link from "next/link";
import type { CatalogSummary } from "@/types";
import { QualityBadge } from "@/components/quality-badge";

export function SummaryCards({ summary }: { summary: CatalogSummary }) {
  const watchlist = summary.technologies
    .filter((technology) => technology.maturityBucket !== "GA")
    .sort((left, right) => right.highSeverityCount - left.highSeverityCount)
    .slice(0, 5);

  return (
    <>
      <section className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Executive view</p>
            <h2 className="section-title">
              Start with mature content, then widen deliberately into lower-confidence guidance.
            </h2>
            <p className="section-copy">
              The default posture is GA-first. Preview, mixed, and deprecated families stay
              visible because they can still matter, but they should not carry the same weight
              in executive decision packs.
            </p>
          </div>
        </div>
        <div className="metrics-grid">
          {summary.metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <strong>{metric.value.toLocaleString()}</strong>
              <span>{metric.label}</span>
              <p className="microcopy">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel">
        <div className="overview-grid">
          <article className="mini-card">
            <p className="eyebrow">Maturity distribution</p>
            <div className="bar-list">
              {summary.maturityDistribution.map((row) => (
                <div key={row.label}>
                  <div className="section-head">
                    <span>{row.label}</span>
                    <strong>{row.count.toLocaleString()}</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.max(
                          8,
                          (row.count / Math.max(summary.technologyCount, 1)) * 100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="mini-card">
            <p className="eyebrow">Executive watchlist</p>
            <div className="bar-list">
              {watchlist.map((technology) => (
                <div key={technology.slug} className="watchlist-row">
                  <div className="section-head">
                    <Link href={`/technologies/${technology.slug}`} className="muted-link">
                      {technology.technology}
                    </Link>
                    <strong>{technology.highSeverityCount.toLocaleString()} high</strong>
                  </div>
                  <QualityBadge technology={technology} compact />
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Portfolio signal</p>
            <h2 className="section-title">The product now communicates platform judgment, not just checklist coverage.</h2>
            <p className="section-copy">
              Strong review products show what is trustworthy, what is unstable, and how to act next.
              That is the difference between an interesting prototype and a credible enterprise tool.
            </p>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card">
            <h3>Trust framing</h3>
            <p>
              Persistent source, maturity, and limitation messaging keeps the platform honest
              and lowers the risk of overclaiming.
            </p>
          </article>
          <article className="future-card">
            <h3>Decision usefulness</h3>
            <p>
              GA-first defaults and explicit watchlists help executives and architects know
              where to spend attention first.
            </p>
          </article>
          <article className="future-card">
            <h3>Production posture</h3>
            <p>
              The design stays static-first for speed and cost control, while still preparing
              clean seams for auth, telemetry, and workflow hardening later.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
