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
  const reviewSteps = [
    {
      step: "01",
      eyebrow: "Start review",
      title: "Create one project review for the customer or workload you are designing.",
      copy:
        "This becomes the working space for one solution. It keeps your selected services, target regions, pricing snapshot, and checklist notes together.",
      meta: "Best first click for architects, pre-sales, and solution teams.",
      href: "/review-package" as const,
      cta: "Start project review"
    },
    {
      step: "02",
      eyebrow: "Add services",
      title: "Add only the Azure services that belong to this solution.",
      copy:
        "Use the service directory to bring in API Management, AKS, App Service, Front Door, and any other components that are truly in scope.",
      meta: "Keeps the review focused on the actual design, not the full catalog.",
      href: "/services" as const,
      cta: "Browse services"
    },
    {
      step: "03",
      eyebrow: "Review findings",
      title: "Open a service page, check region and pricing, then add project notes to findings.",
      copy:
        "When a finding matters to the customer design, mark it as included, not applicable, or excluded, then capture comments, evidence, owner, and due date.",
      meta: "This is where the project-specific design story gets written.",
      href: "/services" as const,
      cta: "Review service pages"
    },
    {
      step: "04",
      eyebrow: "Export",
      title: "Download only the services and notes that belong to that project review.",
      copy:
        "Export scoped checklist notes and scoped pricing snapshots in CSV, Markdown, or text without carrying unrelated services into the customer artifact.",
      meta: "Best for design documents, action tracking, and pre-sales handoff.",
      href: "/review-package" as const,
      cta: "Download project artifacts"
    }
  ];
  const workflowSignals = [
    {
      title: "One review at a time",
      copy: "Keep the notes and exports tied to one project instead of mixing multiple customer decisions together."
    },
    {
      title: "Region and cost included",
      copy: "Check availability restrictions and public retail pricing for the same services you selected for the review."
    },
    {
      title: "Export only what matters",
      copy: "Download just the scoped services and project notes instead of the entire checklist repository."
    }
  ];
  const audienceStories = [
    {
      audience: "Sales Architect",
      title: "Turn service choices into a cleaner customer-facing review pack.",
      copy:
        "Use the workspace to scope the services, carry project comments, and export a focused artifact that is easier to explain to customers and account teams.",
      metric: `${serviceIndex.services.length.toLocaleString()} services available for scoped design reviews`
    },
    {
      audience: "Solutions Architect",
      title: "Move from service choice to region fit, cost, and checklist notes in one flow.",
      copy:
        "Open the service you are designing, verify region availability and restrictions, review public retail pricing, and then record project-specific checklist decisions.",
      metric: `${summary.itemCount.toLocaleString()} normalized findings available when the design question becomes specific`
    },
    {
      audience: "Cloud Engineer",
      title: "Keep implementation notes tied to the exact findings that affect the build.",
      copy:
        "Included, excluded, and not-applicable decisions stay attached to the active project review so handoff and follow-up are easier to track.",
      metric: `${reviewWatchlistCount.toLocaleString()} non-baseline families still stay visible when extra validation is needed`
    }
  ];
  const productProof = [
    {
      title: "The review follows the project scope, not the repository structure.",
      copy:
        "Users start with the services they actually need, then keep only those services in the exported artifact."
    },
    {
      title: "Regional availability and retail pricing are part of the same service review.",
      copy:
        "A reviewer can check availability, restricted regions like UAE Central, and pricing context without leaving the service workflow."
    },
    {
      title: "Every project note stays attached to a real checklist item.",
      copy:
        "That makes the export useful in design documents, customer handoff, and implementation reviews because the reasoning stays traceable."
    }
  ];

  return (
    <main className="section-stack">
      <section className="hero-panel director-hero editorial-hero">
        <div className="editorial-hero-layout">
          <div className="editorial-hero-copy">
            <div className="hero-kicker-row">
              <span className="hero-kicker">Project-first</span>
              <span className="hero-kicker">Source-backed</span>
              <span className="hero-kicker">Export-ready</span>
            </div>
            <p className="eyebrow">{SITE_NAME}</p>
            <h1 className="hero-title">Start a project review and keep only the services that matter.</h1>
            <p className="hero-copy">
              Create one project review, add the Azure services in scope, check region availability
              and pricing, capture project-specific checklist notes, and export a customer-ready
              artifact without dragging the whole catalog into the conversation.
            </p>
            <p className="hero-note">
              Generated {generatedDate}. This workspace is designed to shorten review preparation,
              keep notes tied to real findings, and produce a project-specific export that feels more
              useful than a generic AI-generated summary.
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
            <p className="eyebrow">Project review in four moves</p>
            <h2 className="leadership-title">What the user should understand immediately.</h2>
            <div className="leadership-list">
              <article>
                <strong>Create the review</strong>
                <p>Name the project, audience, target regions, and business scope once.</p>
              </article>
              <article>
                <strong>Add the services</strong>
                <p>Keep only the Azure components that belong to the design under review.</p>
              </article>
              <article>
                <strong>Review and export</strong>
                <p>Capture project notes on findings and download the scoped checklist and pricing artifact.</p>
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
            <p className="eyebrow">How the workflow works</p>
            <h2 className="section-title">
              Make the first click obvious, then keep moving in the same project review flow.
            </h2>
            <p className="section-copy">
              The easiest experience is not to browse the whole product. It is to start a project
              review, add services, review findings, and export only what belongs to that solution.
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
            <p className="eyebrow">Who this helps first</p>
            <h2 className="section-title">
              Built for the people who need to scope, explain, and hand off Azure designs.
            </h2>
            <p className="section-copy">
              The product becomes easier to use when each audience can see how the same project review
              workspace supports its own job to be done.
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
            <p className="eyebrow">Why this feels useful</p>
            <h2 className="section-title">
              Better than a generic AI-generated site because the review stays scoped and traceable.
            </h2>
            <p className="section-copy">
              A generic summary tool can paraphrase Azure guidance. This product is more valuable
              because it stays aligned to project scope, service decisions, and exportable review notes.
            </p>
          </div>
        </div>
        <article className="proof-spotlight">
          <p className="eyebrow">What users actually get</p>
          <h3>One project review that keeps services, notes, regional fit, and pricing connected.</h3>
          <p>
            That is what makes the output reusable in design documents, customer reviews, and
            delivery handoff instead of becoming another polished summary that has to be rewritten later.
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
              use this service, in which regions, at what price range, and which findings belong in the review?
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
              Use the explorer only when you already know the question you are asking.
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
