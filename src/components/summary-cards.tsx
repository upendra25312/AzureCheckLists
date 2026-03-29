import Link from "next/link";
import type { CatalogSummary } from "@/types";
import { QualityBadge } from "@/components/quality-badge";

export function SummaryCards({ summary }: { summary: CatalogSummary }) {
  const watchlist = summary.technologies
    .filter((technology) => technology.maturityBucket !== "GA")
    .sort((left, right) => right.highSeverityCount - left.highSeverityCount)
    .slice(0, 5);
  const leadershipActions = [
    {
      title: "Anchor reviews in GA-ready guidance",
      copy: `${summary.gaDefaultTechnologyCount.toLocaleString()} mature families should define the default briefing baseline.`
    },
    {
      title: "Escalate lower-confidence families deliberately",
      copy: `${(
        summary.previewTechnologyCount +
        summary.mixedTechnologyCount +
        summary.deprecatedTechnologyCount
      ).toLocaleString()} families require explicit architectural validation before leadership reliance.`
    },
    {
      title: "Treat deprecated guidance as context only",
      copy: `${summary.deprecatedTechnologyCount.toLocaleString()} family is currently deprecated and should remain visible for traceability, not as a new baseline.`
    }
  ];

  return (
    <>
      <section className="surface-panel editorial-section" id="executive">
        <div className="section-head">
          <div>
            <p className="eyebrow">Executive summary</p>
            <h2 className="section-title">
              Read the review posture before you read the findings.
            </h2>
            <p className="section-copy">
              Start with mature guidance, understand where risk is concentrated, and keep
              preview or deprecated content in its proper place. The goal is faster, better
              informed leadership review, not false certainty.
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

      <section className="surface-panel editorial-section">
        <div className="overview-grid">
          <article className="mini-card">
            <p className="eyebrow">Maturity and quality</p>
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
            <p className="eyebrow">Priority review families</p>
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

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Leadership actions</p>
            <h2 className="section-title">
              Use the dashboard to focus attention, not to replace judgment.
            </h2>
            <p className="section-copy">
              A strong review experience helps leadership decide what to rely on, what to
              validate, and what to keep out of the default baseline.
            </p>
          </div>
        </div>
        <div className="future-grid">
          {leadershipActions.map((action) => (
            <article className="future-card" key={action.title}>
              <h3>{action.title}</h3>
              <p>{action.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
