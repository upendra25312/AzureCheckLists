import Link from "next/link";
import type { CatalogSummary, ServiceIndex } from "@/types";
import { SummaryCards } from "@/components/summary-cards";

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
  const featuredServices = serviceIndex.services.slice(0, 6);
  const reviewSteps = [
    {
      step: "01",
      eyebrow: "Create Project Review",
      title: "Name the project, capture the business scope, and set the target regions.",
      copy:
        "Every note stays tied to one solution, so the team can review the same scope, assumptions, regions, and evidence together.",
      meta: "Start with the customer solution, not the full Azure catalog.",
      href: "/review-package" as const,
      cta: "Start project review"
    },
    {
      step: "02",
      eyebrow: "Add Azure Services",
      title: "Select only the Azure components that belong in the design.",
      copy:
        "Pull in API Management, AKS, App Service, Front Door, Key Vault, or any other services that are truly part of the proposed solution.",
      meta: "Keep the project review scoped to the real architecture.",
      href: "/services" as const,
      cta: "Browse services"
    },
    {
      step: "03",
      eyebrow: "Review Region and Cost Fit",
      title: "See where each service is available and what public retail pricing looks like.",
      copy:
        "Check whether a service is available, restricted, preview, or unavailable in the target regions, then review pricing across published SKUs.",
      meta: "Carry region fit and cost fit into the same design review.",
      href: "/services" as const,
      cta: "Review region and cost fit"
    },
    {
      step: "04",
      eyebrow: "Export Project Artifact",
      title: "Download only the services and checklist notes that belong to the current project.",
      copy:
        "Export a clean design artifact in CSV, Markdown, or text so architecture, pre-sales, and delivery teams can reuse the same project-specific output.",
      meta: "The output should be usable, not just visible on screen.",
      href: "/review-package" as const,
      cta: "Download project artifacts"
    }
  ];
  const workflowSignals = [
    {
      title: "Live regional availability",
      copy: "See where services are open, restricted, preview, unavailable, or global for the selected design."
    },
    {
      title: "Live retail pricing",
      copy: "Review public retail pricing for the same services in scope before building a fuller customer estimate."
    },
    {
      title: "Project-specific notes",
      copy: "Capture why a finding is included, not applicable, excluded, or still pending for the current project."
    },
    {
      title: "Export to CSV, Markdown, and text",
      copy: "Download only the scoped services and notes instead of exporting the entire checklist repository."
    }
  ];
  const audienceStories = [
    {
      audience: "Sales Architect",
      title: "Create a fast first-pass solution view with service fit, regional viability, and public list pricing.",
      copy:
        "Use this workspace to shape the right Azure solution quickly and create a cleaner commercial and architectural starting point for customer discussions.",
      metric: "Built for proposal shaping and first-pass solution validation."
    },
    {
      audience: "Solutions Architect",
      title: "Capture design decisions, applicability notes, and service-specific guidance in one scoped review.",
      copy:
        "Turn business and technical requirements into a solution-specific Azure review with justified checklist decisions, region fit, pricing context, and exportable artifacts.",
      metric: "Built for design authority, customer fit, and reusable documentation."
    },
    {
      audience: "Cloud Engineer",
      title: "See which services are actually in scope and which checklist findings need implementation attention.",
      copy:
        "Keep implementation-relevant findings, comments, owners, and due dates tied to the project so delivery teams know what was decided and why.",
      metric: "Built for cleaner handoff from design into implementation."
    },
    {
      audience: "Senior Director",
      title: "Review the selected solution components, region constraints, and pricing posture without reading the entire catalog.",
      copy:
        "Focus on the project boundary, commercial posture, and major technical decisions instead of wading through every checklist family in the repository.",
      metric: "Built for leadership review without losing traceability."
    }
  ];
  const productProof = [
    {
      title: "Project-scoped",
      copy:
        "Generic AI gives broad answers. This workspace keeps only the services, findings, regions, and notes that belong to the current solution."
    },
    {
      title: "Traceable",
      copy:
        "Regional availability and pricing are tied to Microsoft-backed sources, with visible health, refresh status, and source-aware service context."
    },
    {
      title: "Repeatable",
      copy:
        "The same scoped inputs produce the same structured output, which makes customer reviews and internal design reviews easier to repeat and defend."
    },
    {
      title: "Exportable",
      copy:
        "The output is not just an answer on a screen. It becomes a checklist export, design note set, and pricing snapshot your team can reuse."
    }
  ];

  return (
    <main className="section-stack">
      <section className="hero-panel director-hero editorial-hero">
        <div className="editorial-hero-layout">
          <div className="editorial-hero-copy">
            <div className="hero-kicker-row">
              <span className="hero-kicker">Live regional availability</span>
              <span className="hero-kicker">Live retail pricing</span>
              <span className="hero-kicker">Export-ready</span>
            </div>
            <p className="eyebrow">Azure Solution Review Workspace</p>
            <h1 className="hero-title">Start a project review and keep only the services that matter.</h1>
            <p className="hero-copy">
              Build a solution-specific review pack with selected Azure services, regional
              availability, retail pricing, checklist decisions, and exportable design notes.
            </p>
            <p className="hero-note">
              Designed for sales architects, solutions architects, cloud architects, and cloud
              engineers who need a project-ready artifact, not a generic AI answer. Generated {generatedDate}.
            </p>
            <div className="hero-actions">
              <Link href="/review-package" className="primary-button">
                Start project review
              </Link>
              <Link href="/services" className="secondary-button">
                Browse services
              </Link>
              <Link href="/data-health" className="ghost-button">
                Check live data health
              </Link>
            </div>
          </div>
          <aside className="leadership-brief boardroom-brief">
            <p className="eyebrow">Why this is valuable</p>
            <h2 className="leadership-title">Start with the customer solution, not the full Azure catalog.</h2>
            <div className="leadership-list">
              <article>
                <strong>Create project review</strong>
                <p>Name the project, capture the business scope, and set the target regions so every note stays tied to one solution.</p>
              </article>
              <article>
                <strong>Add Azure services</strong>
                <p>Select only the Azure components that belong in the design, such as API Management, AKS, App Service, Front Door, or Key Vault.</p>
              </article>
              <article>
                <strong>Review region and cost fit</strong>
                <p>See where each service is available, whether a target region is restricted or preview, and what public retail pricing looks like across published SKUs.</p>
              </article>
            </div>
            <div className="boardroom-mini-grid">
              {workflowSignals.map((signal) => (
                <article className="boardroom-mini-card" key={signal.title}>
                  <strong>{signal.title}</strong>
                  <p>{signal.copy}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
        <div className="hero-metrics-row">
          <article className="hero-metric-card">
            <span>Services ready to review</span>
            <strong>{serviceIndex.services.length.toLocaleString()}</strong>
            <p>Azure services that can be pulled into a project-specific review flow.</p>
          </article>
          <article className="hero-metric-card">
            <span>GA-ready baseline</span>
            <strong>{summary.gaDefaultTechnologyCount.toLocaleString()}</strong>
            <p>Mature families that can anchor the default recommendation set.</p>
          </article>
          <article className="hero-metric-card">
            <span>High-severity findings</span>
            <strong>{highSeverityMetric?.value.toLocaleString() ?? "0"}</strong>
            <p>Design and operational risks that should be reviewed earlier in the project cycle.</p>
          </article>
        </div>
      </section>

      <section className="surface-panel editorial-section executive-brief-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 className="section-title">Start with the customer solution, not the full Azure catalog.</h2>
            <p className="section-copy">
              This workspace helps you create a project-specific Azure review. Add only the services
              in scope, validate region and pricing fit, capture design notes, and export a clean
              artifact for documentation or customer review.
            </p>
          </div>
        </div>
        <div className="start-here-grid">
          {reviewSteps.map((step) => (
            <article className="path-card" key={step.title}>
              <div className="path-card-topline">
                <span className="path-card-number">{step.step}</span>
              </div>
              <p className="eyebrow">{step.eyebrow}</p>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
              <p className="path-card-meta">{step.meta}</p>
              <Link
                href={step.href}
                className={step.step === "01" ? "primary-button" : "secondary-button"}
              >
                {step.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Built for the people who shape Azure solutions</p>
            <h2 className="section-title">The same project review supports each role in a different way.</h2>
            <p className="section-copy">
              Sales, solution design, engineering, and leadership all need the same scoped artifact,
              but each persona uses it for a different job to be done.
            </p>
          </div>
        </div>
        <div className="audience-story-grid">
          {audienceStories.map((story) => (
            <article className="audience-story-card" key={story.audience}>
              <p className="eyebrow">{story.audience}</p>
              <h3>{story.title}</h3>
              <p>{story.copy}</p>
              <span className="audience-story-metric">{story.metric}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Why this is better than a generic AI tool</p>
            <h2 className="section-title">Generic AI gives answers. This workspace gives a structured project output.</h2>
            <p className="section-copy">
              The value is not just intelligent text. The value is a repeatable Azure review system
              that stays aligned to project scope, service decisions, pricing, and exportable notes.
            </p>
          </div>
        </div>
        <article className="proof-spotlight">
          <p className="eyebrow">What users actually get</p>
          <h3>One project review that keeps services, notes, regional fit, and pricing connected.</h3>
          <p>
            That is what makes the output reusable in design documents, customer reviews, pricing
            handoff, and delivery planning instead of becoming another polished summary that has to
            be rewritten later.
          </p>
        </article>
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
              Start with the Azure service you are designing, then add it into the project review.
            </h2>
            <p className="section-copy">
              Service pages are the clearest working surface when the question is practical: can we
              use this service, in which regions, at what price range, and which findings belong in
              the review?
            </p>
          </div>
          <div className="button-row">
            <Link href="/services" className="primary-button">
              Browse all services
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
                  Open service review
                </Link>
                <Link href="/review-package" className="ghost-button">
                  Open project review
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Advanced tools</p>
            <h2 className="section-title">
              Use advanced tools only when you already know the question you are asking.
            </h2>
            <p className="section-copy">
              The homepage should point people into the project review workflow first. The explorer
              stays useful for deeper filtering, cross-service search, and narrower triage once the scope is clear.
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
            <h3>Search when the scope is clear</h3>
            <p>
              Use the explorer after the service or design concern is known, not as the first screen
              for every user.
            </p>
          </article>
          <article className="future-card">
            <h3>Keep project notes on service pages</h3>
            <p>
              The service view and project review workspace should remain the default place to make
              project decisions and build the export artifact.
            </p>
          </article>
          <article className="future-card">
            <h3>Export only what belongs to the design</h3>
            <p>
              The goal is a project-ready artifact, not a dump of everything the source repository
              happens to contain.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
