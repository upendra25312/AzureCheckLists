import Link from "next/link";
import type { CatalogSummary, ServiceIndex } from "@/types";
import { SummaryCards } from "@/components/summary-cards";
import { SITE_NAME } from "@/lib/site";

export function DashboardHome({
  summary,
  serviceIndex
}: {
  summary: CatalogSummary;
  serviceIndex: ServiceIndex;
}) {
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
  const featuredServices = serviceIndex.services.slice(0, 6);
  const quickStartPaths = [
    {
      eyebrow: "Leadership start",
      title: "See what is safe to use in decision packs first.",
      copy:
        "Open the executive summary when the question is what leadership can rely on before teams widen into preview or mixed-confidence guidance.",
      meta: "Best for steering conversations and review pack framing.",
      anchor: "#executive",
      cta: "Open executive summary"
    },
    {
      eyebrow: "Service start",
      title: "Review the Azure service you are actually designing.",
      copy:
        "Use the service directory for Azure OpenAI, AKS, Firewall, App Service, and other platform decisions instead of starting from checklist filenames.",
      meta: "Best for workload and platform-specific architecture reviews.",
      href: "/services" as const,
      cta: "Review by service"
    },
    {
      eyebrow: "Working detail",
      title: "Filter exact findings only when the review question is clear.",
      copy:
        "Move into the explorer for scoped recommendations, local notes, and exports once the team knows the service, severity, or pillar it needs to inspect.",
      meta: "Best for implementation triage and operator handoff.",
      href: "/explorer" as const,
      cta: "Open explorer"
    }
  ];
  const productProof = [
    {
      title: "Every recommendation keeps its source trail.",
      copy:
        "Family detail pages and item views preserve checklist lineage so teams can validate the advice instead of trusting a detached summary."
    },
    {
      title: "Maturity is visible, not hand-waved.",
      copy:
        "GA, preview, mixed, and deprecated guidance stay clearly separated so leadership does not mistake advisory content for a default baseline."
    },
    {
      title: "The workflow mirrors real Azure reviews.",
      copy:
        "Service-first entry, family context, and local working notes reflect how architects actually prepare reviews instead of imitating a generic AI dashboard."
    }
  ];

  return (
    <main className="section-stack">
      <section className="hero-panel director-hero editorial-hero">
        <div className="editorial-hero-layout">
          <div className="editorial-hero-copy">
            <p className="eyebrow">{SITE_NAME}</p>
            <h1 className="hero-title">Azure architecture review, made decision-ready.</h1>
            <p className="hero-copy">
              Use source-backed Azure review guidance to separate what leadership can rely on,
              what architects should validate, and what teams should treat as advisory.
            </p>
            <p className="hero-note">
              Generated {generatedDate}. Built to shorten review preparation, surface risk
              earlier, and keep every recommendation tied to its source.
            </p>
            <div className="hero-actions">
              <a href="#executive" className="primary-button">
                See executive summary
              </a>
              <Link href="/services" className="secondary-button">
                Browse services
              </Link>
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

      <section className="surface-panel editorial-section executive-brief-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Choose your starting path</p>
            <h2 className="section-title">
              Make the first click obvious, then widen only when the review needs more depth.
            </h2>
            <p className="section-copy">
              The product works best when it behaves like a guided review workspace, not a wall of
              equally weighted content. These are the three clean entry points most teams need.
            </p>
          </div>
        </div>
        <div className="start-here-grid">
          {quickStartPaths.map((path) => {
            const buttonClass = path.href ? "primary-button" : "secondary-button";

            return (
              <article className="path-card" key={path.title}>
                <p className="eyebrow">{path.eyebrow}</p>
                <h3>{path.title}</h3>
                <p>{path.copy}</p>
                <p className="path-card-meta">{path.meta}</p>
                {path.href ? (
                  <Link href={path.href} className={buttonClass}>
                    {path.cta}
                  </Link>
                ) : (
                  <a href={path.anchor} className={buttonClass}>
                    {path.cta}
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Why this stands up in the room</p>
            <h2 className="section-title">
              Built for accountable review decisions, not generic AI summarization.
            </h2>
            <p className="section-copy">
              A generic AI-generated site can summarize checklist content. This product is more
              useful because it keeps proof, confidence, and review workflow visible at every step.
            </p>
          </div>
        </div>
        <div className="proof-grid">
          {productProof.map((point) => (
            <article className="proof-card" key={point.title}>
              <h3>{point.title}</h3>
              <p>{point.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <SummaryCards summary={summary} />

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Browse by Azure service</p>
            <h2 className="section-title">
              Start with the service you are designing or reviewing, then open the right checklist path.
            </h2>
            <p className="section-copy">
              This is the clearest entry point when the question is service-specific: Azure Firewall,
              Key Vault, AKS, Azure OpenAI, App Service, and the rest now have dedicated service views.
            </p>
          </div>
          <div className="button-row">
            <Link href="/services" className="primary-button">
              View all services
            </Link>
          </div>
        </div>

        <div className="service-directory-grid">
          {featuredServices.map((service) => (
            <article className="service-directory-card" key={service.slug}>
              <div className="section-head">
                <div>
                  <p className="eyebrow">Azure service</p>
                  <h3 className="service-card-title">{service.service}</h3>
                </div>
                <div className="chip-row">
                  <span className="chip">{service.familyCount.toLocaleString()} families</span>
                </div>
              </div>
              <p className="service-card-copy">{service.description}</p>
              <div className="service-card-meta">
                {service.gaFamilyCount > 0 ? (
                  <span className="pill">{service.gaFamilyCount.toLocaleString()} GA-ready</span>
                ) : null}
                {service.previewFamilyCount > 0 ? (
                  <span className="pill">{service.previewFamilyCount.toLocaleString()} preview</span>
                ) : null}
                <span className="pill">{service.itemCount.toLocaleString()} findings</span>
              </div>
              <div className="service-family-preview">
                <strong>Recommended families</strong>
                <div className="service-family-links">
                  {service.families.slice(0, 3).map((family) => (
                    <Link key={family.slug} href={`/technologies/${family.slug}`} className="muted-link">
                      {family.technology}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="button-row">
                <Link href={`/services/${service.slug}`} className="secondary-button">
                  Open service view
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Detailed explorer</p>
            <h2 className="section-title">
              Open the explorer only when the review question becomes specific.
            </h2>
            <p className="section-copy">
              The homepage stays focused on decisions and entry points. The explorer is a dedicated
              workspace for filtering, local-only notes, and exportable result sets once the scope
              is clear.
            </p>
          </div>
          <div className="button-row">
            <Link href="/explorer" className="primary-button">
              Open explorer
            </Link>
            <Link href="/how-to-use" className="ghost-button">
              Review guidance
            </Link>
          </div>
        </div>

        <div className="future-grid">
          <article className="future-card">
            <h3>GA-first by default</h3>
            <p>
              Start with mature guidance, then widen into preview-led findings only when the
              review question genuinely requires extra depth.
            </p>
          </article>
          <article className="future-card">
            <h3>Local-only working notes</h3>
            <p>
              Capture review notes in the browser without implying shared workflow, durable
              records, or enterprise governance that is not present.
            </p>
          </article>
          <article className="future-card">
            <h3>Export from the filtered view</h3>
            <p>
              Export the current result set once the scope is clear, rather than forcing detailed
              working controls onto the homepage.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
