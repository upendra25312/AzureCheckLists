import Link from "next/link";
import type { CatalogSummary } from "@/types";
import { ExplorerClient } from "@/components/explorer-client";
import { SummaryCards } from "@/components/summary-cards";

export function DashboardHome({ summary }: { summary: CatalogSummary }) {
  return (
    <main className="section-stack">
      <section className="hero-panel director-hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Azure Architecture Review Dashboard</p>
            <h1 className="hero-title">Azure architecture review, made decision-ready.</h1>
            <p className="hero-copy">
              Explore Azure review checklist guidance through a maturity-aware,
              source-traceable experience designed for executives, architects, and operators.
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

      <section className="surface-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Why this exists</p>
            <h2 className="section-title">A review accelerator for leadership decisions, architecture depth, and operational follow-through.</h2>
            <p className="section-copy">
              The platform is intentionally opinionated: lead with GA-ready content,
              expose confidence clearly, preserve traceability, and keep preview or
              deprecated guidance visible without treating it as equivalent to mature baselines.
            </p>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card" id="executive">
            <h3>Executive</h3>
            <p>
              Understand risk posture, what needs attention first, and which checklist families
              are stable enough to support leadership decisions.
            </p>
          </article>
          <article className="future-card" id="architect">
            <h3>Architect</h3>
            <p>
              See which design areas matter most, which families are high-confidence, and how
              each recommendation traces back to its source.
            </p>
          </article>
          <article className="future-card" id="operator">
            <h3>Operator</h3>
            <p>
              Filter to actionable items, export findings, and capture local review notes without
              pretending the product already has enterprise workflow persistence.
            </p>
          </article>
        </div>
      </section>

      <SummaryCards summary={summary} />

      <section className="surface-panel" id="roadmap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Architecture choices</p>
            <h2 className="section-title">Static-first by design, with a clean path to enterprise controls later.</h2>
          </div>
        </div>
        <div className="future-grid">
          <article className="future-card">
            <h3>What this is</h3>
            <p>
              A review support product that normalizes Azure checklist guidance into a form that
              is easier to consume, prioritize, and discuss.
            </p>
          </article>
          <article className="future-card">
            <h3>What this is not</h3>
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
