import Link from "next/link";
import type { CatalogSummary } from "@/types";

export function SummaryCards({ summary }: { summary: CatalogSummary }) {
  return (
    <>
      <section className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Executive view</p>
            <h2 className="section-title">
              What guidance exists, where it concentrates, and what needs attention first.
            </h2>
            <p className="section-copy">
              The overview emphasizes total coverage, high-severity concentration,
              maturity mix, and source balance so reviewers can quickly frame risk
              before opening the detailed explorer.
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
            <p className="eyebrow">Severity distribution</p>
            <div className="bar-list">
              {summary.severityDistribution.map((row) => (
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
                          (row.count / Math.max(summary.itemCount, 1)) * 100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="mini-card">
            <p className="eyebrow">Technology coverage</p>
            <div className="bar-list">
              {summary.topTechnologies.slice(0, 6).map((row) => {
                const technology = summary.technologies.find(
                  (candidate) => candidate.technology === row.label
                );

                return (
                  <div key={row.label}>
                    <div className="section-head">
                      <Link
                        href={technology ? `/technologies/${technology.slug}` : "/"}
                        className="muted-link"
                      >
                        {row.label}
                      </Link>
                      <strong>{row.count.toLocaleString()}</strong>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${Math.max(
                            8,
                            (row.count /
                              Math.max(summary.topTechnologies[0]?.count ?? 1, 1)) *
                              100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
