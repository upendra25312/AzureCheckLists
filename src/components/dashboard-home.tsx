import type { CatalogSummary } from "@/types";
import { ExplorerClient } from "@/components/explorer-client";
import { SummaryCards } from "@/components/summary-cards";

export function DashboardHome({ summary }: { summary: CatalogSummary }) {
  return (
    <main className="section-stack">
      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Azure architecture reviews, made faster</p>
            <h1 className="hero-title">A static-first dashboard for Azure review checklists.</h1>
            <p className="hero-copy">
              This experience compiles the Azure review-checklists repository into a
              decision-friendly dashboard that runs as a front-end-first application.
              It is optimized for Azure Static Web Apps Free with build-time
              normalization, browser-only state, and local export.
            </p>
            <div className="hero-actions">
              <a href="#explorer" className="primary-button">
                Open checklist explorer
              </a>
              <a href="#future" className="secondary-button">
                View phase 2 path
              </a>
            </div>
          </div>
          <div className="hero-highlights">
            {summary.metrics.slice(0, 4).map((metric) => (
              <div className="hero-stat" key={metric.label}>
                <strong>{metric.value.toLocaleString()}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SummaryCards summary={summary} />
      <ExplorerClient summary={summary} />
    </main>
  );
}
