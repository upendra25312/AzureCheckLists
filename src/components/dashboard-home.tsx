import Link from "next/link";
import type { CatalogSummary, ServiceIndex } from "@/types";

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
  const featuredServices = serviceIndex.services.slice(0, 4);
  const entrySteps = [
    {
      step: "01",
      eyebrow: "Create the review",
      title: "Start with the project name and a scoped problem statement.",
      copy:
        "The review becomes the working container for service choices, notes, region fit, pricing signals, and exportable artifacts.",
      meta: "Make the project boundary clear before the service list grows.",
      href: "/review-package" as const,
      cta: "Start project review"
    },
    {
      step: "02",
      eyebrow: "Choose only the real architecture",
      title: "Add the Azure services that genuinely belong to this solution.",
      copy:
        "Keep the workspace honest. Pricing, copilot answers, readiness checks, and exports all improve when the service list stays tight.",
      meta: "The explorer stays available, but the project review should drive the flow.",
      href: "/services" as const,
      cta: "Browse services"
    },
    {
      step: "03",
      eyebrow: "Pressure-test and export",
      title: "Use region fit, pricing, notes, and exports when the scope is stable.",
      copy:
        "The best output is not another generic summary. It is a reusable review pack with explicit signals, documented choices, and scoped artifacts.",
      meta: "This is where the product should beat generic AI and discovery-first tools.",
      href: "/review-package" as const,
      cta: "Open the review workspace"
    }
  ];
  const heroSignals = [
    {
      label: "Services ready",
      value: serviceIndex.services.length.toLocaleString(),
      detail: "Azure services already normalized into the review flow."
    },
    {
      label: "High-severity findings",
      value: highSeverityMetric?.value.toLocaleString() ?? "0",
      detail: "Risks that should surface earlier while the architecture is still flexible."
    },
    {
      label: "Source refresh",
      value: generatedDate,
      detail: "Catalog snapshot currently driving the homepage and service review surface."
    }
  ];
  const decisionRoomArtifacts = [
    {
      title: "Scoped review shell",
      copy:
        "One place to hold the project name, business scope, target regions, and the exact service boundary under discussion."
    },
    {
      title: "Decision signals",
      copy:
        "Regional blockers, retail pricing posture, checklist readiness, and notes tied to the same set of services."
    },
    {
      title: "Reusable outputs",
      copy:
        "Checklist exports, design notes, pricing snapshots, and saved review continuity instead of one-off answers."
    }
  ];
  const trustPillars = [
    {
      title: "Live source state stays visible",
      copy:
        "Pricing and regional-fit surfaces already expose whether the backend used a live refresh, scheduled cache, or fallback state."
    },
    {
      title: "Evidence stays tied to the review boundary",
      copy:
        "Notes, findings, and signals stay attached to the selected solution rather than drifting into a generic research workspace."
    },
    {
      title: "Human sign-off still matters",
      copy:
        "The product should shorten the review path, not hide uncertainty. Teams still need explicit technical and commercial judgment."
    }
  ];
  const workflowLanes = [
    {
      step: "01",
      eyebrow: "Signal 1",
      title: "Check whether the service can actually run in the target architecture.",
      copy:
        "Availability, restricted-region handling, preview status, and global-service posture should appear before the design starts hardening around the wrong service.",
      signals: ["Available", "Restricted", "Preview", "Global"],
      note:
        "Example: a target region like UAE Central may be restricted even when the service exists elsewhere."
    },
    {
      step: "02",
      eyebrow: "Signal 2",
      title: "Use public retail pricing as the first commercial signal, not the last step.",
      copy:
        "The reviewer should see starting retail rows, published SKUs, and target-region matches inside the same review instead of switching tools too early.",
      signals: ["Starting price", "SKU rows", "Meter detail", "Target-region match"],
      note:
        "Example: compare SKU and meter rows for API Management, AKS, or App Service before refining quantities in the pricing calculator."
    },
    {
      step: "03",
      eyebrow: "Signal 3",
      title: "Document why the team accepts, rejects, or defers findings for this design.",
      copy:
        "Mark findings as included, not applicable, excluded, or still pending, then attach comments, evidence, owner, and due date to the same project review.",
      signals: ["Include", "Not applicable", "Owner and due date", "Evidence links"],
      note: `${summary.itemCount.toLocaleString()} normalized findings become much more usable once the service scope is narrowed to the real project.`
    }
  ];
  const outputCards = [
    {
      title: "Design notes",
      copy: "Markdown or text that can be reused in architecture documentation and customer review packs."
    },
    {
      title: "Checklist CSV",
      copy: "An action-friendly export with only the selected services and their project-specific finding decisions."
    },
    {
      title: "Pricing snapshot",
      copy: "A scoped retail pricing export for the same services, regions, and commercial questions under review."
    },
    {
      title: "Saved review continuity",
      copy: "Optional Azure-backed save and restore when the team needs to continue the same review later."
    }
  ];

  return (
    <main className="section-stack">
      <section className="hero-panel director-hero editorial-hero homepage-hero-panel">
        <div className="editorial-hero-layout homepage-hero-layout">
          <div className="editorial-hero-copy">
            <div className="hero-kicker-row">
              <span className="hero-kicker">Project-review first</span>
              <span className="hero-kicker">Live source signals</span>
              <span className="hero-kicker">Exportable outputs</span>
            </div>
            <p className="eyebrow">Azure Review Board</p>
            <h1 className="hero-title homepage-hero-title">
              Decide the Azure shape of a project before the design starts drifting.
            </h1>
            <p className="hero-copy">
              Start with one project review, keep the service boundary honest, then use region fit,
              pricing, checklist notes, and exports only for that exact solution.
            </p>
            <div className="homepage-hero-intent">
              <strong>Built for decision quality, not catalog wandering.</strong>
              <p>
                The review workspace should help architects, pre-sales teams, engineers, and
                leaders leave with a scoped artifact they can defend, reuse, and hand off.
              </p>
            </div>
            <div className="hero-actions">
              <Link href="/review-package" className="primary-button">
                Start project review
              </Link>
              <Link href="/services" className="secondary-button">
                Browse services
              </Link>
              <Link href="/explorer" className="ghost-button">
                Use advanced tools later
              </Link>
            </div>
            <div className="homepage-signal-strip">
              {heroSignals.map((signal) => (
                <article className="homepage-signal-card" key={signal.label}>
                  <span>{signal.label}</span>
                  <strong>{signal.value}</strong>
                  <p>{signal.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="leadership-brief boardroom-brief homepage-decision-room">
            <div>
              <p className="eyebrow">What the homepage should promise</p>
              <h2 className="leadership-title">One review becomes the decision room for the project.</h2>
            </div>
            <div className="homepage-artifact-list">
              {decisionRoomArtifacts.map((artifact) => (
                <article className="homepage-artifact-card" key={artifact.title}>
                  <strong>{artifact.title}</strong>
                  <p>{artifact.copy}</p>
                </article>
              ))}
            </div>
            <div className="homepage-proof-grid">
              <article className="boardroom-mini-card homepage-proof-card">
                <strong>Explorer stays secondary</strong>
                <p>
                  Broad browsing is still available, but the product should keep pulling users back
                  into one scoped review.
                </p>
              </article>
              <article className="boardroom-mini-card homepage-proof-card">
                <strong>Generated {generatedDate}</strong>
                <p>
                  The product stays grounded in current catalog data rather than purely narrative guidance.
                </p>
              </article>
              <article className="boardroom-mini-card homepage-proof-card">
                <strong>{summary.gaDefaultTechnologyCount.toLocaleString()} GA-ready families</strong>
                <p>
                  Mature baseline technologies already visible for faster first-pass architecture direction.
                </p>
              </article>
              <article className="boardroom-mini-card homepage-proof-card">
                <strong>Human review still required</strong>
                <p>
                  Signals and exports help teams move faster, but they do not replace architecture or commercial judgment.
                </p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section className="surface-panel editorial-section executive-brief-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Start</p>
            <h2 className="section-title">Three moves should get a new user from zero to a usable review.</h2>
            <p className="section-copy">
              The homepage should not teach the whole platform. It should make the first path
              obvious, reduce hesitation, and show what comes out the other end.
            </p>
          </div>
        </div>
        <div className="start-here-grid">
          {entrySteps.map((step) => (
            <article className="path-card homepage-step-card" key={step.title}>
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
            <p className="eyebrow">Trust</p>
            <h2 className="section-title">The product should make evidence visible before anyone trusts the output.</h2>
            <p className="section-copy">
              This is where Azure Review Board should feel stronger than discovery-first or generic AI
              experiences: the signal source, review boundary, and human decision posture all stay explicit.
            </p>
          </div>
        </div>
        <div className="proof-grid homepage-trust-grid">
          {trustPillars.map((point) => (
            <article className="proof-card homepage-trust-card" key={point.title}>
              <h3>{point.title}</h3>
              <p>{point.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Workflow</p>
            <h2 className="section-title">Inside one scoped review, the key signals should line up in one sequence.</h2>
            <p className="section-copy">
              Reviewers should not need to stitch together region fit, pricing posture, checklist
              decisions, and export readiness across disconnected pages.
            </p>
          </div>
        </div>

        <div className="workflow-lane-grid">
          {workflowLanes.map((lane) => (
            <article className="workflow-lane-card" key={lane.title}>
              <div className="path-card-topline">
                <span className="path-card-number">{lane.step}</span>
                <p className="eyebrow">{lane.eyebrow}</p>
              </div>
              <h3>{lane.title}</h3>
              <p>{lane.copy}</p>
              <div className="chip-row">
                {lane.signals.map((signal) => (
                  <span className="chip" key={signal}>
                    {signal}
                  </span>
                ))}
              </div>
              <p className="workflow-lane-note">{lane.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Outputs</p>
            <h2 className="section-title">The end state should be a reusable review pack, not just a screen full of answers.</h2>
            <p className="section-copy">
              Exports and saved continuity are what make the review reusable across architecture,
              pre-sales, delivery, and leadership conversations.
            </p>
          </div>
        </div>

        <div className="homepage-output-layout">
          <article className="workflow-output-card homepage-output-card">
            <p className="eyebrow">What teams take away</p>
            <h3>One scoped artifact that can survive handoff, revision, and leadership review.</h3>
            <p>
              The best version of this product produces clarity: what is in scope, where the design
              is blocked, what pricing signals are visible, and what still needs a human decision.
            </p>
            <div className="workflow-output-grid homepage-output-grid">
              {outputCards.map((output) => (
                <article className="workflow-output-mini homepage-output-mini" key={output.title}>
                  <strong>{output.title}</strong>
                  <p>{output.copy}</p>
                </article>
              ))}
            </div>
            <div className="button-row">
              <Link href="/review-package" className="primary-button">
                Start project review
              </Link>
              <Link href="/my-project-reviews" className="secondary-button">
                Resume saved reviews
              </Link>
            </div>
          </article>

          <article className="leadership-brief homepage-service-preview">
            <p className="eyebrow">Services teams often pull into the first review</p>
            <h3 className="leadership-title">Start from the project, but keep useful service entry points nearby.</h3>
            <div className="homepage-service-list">
              {featuredServices.map((service) => (
                <Link
                  href={`/services/${service.slug}`}
                  className="homepage-service-card"
                  key={service.slug}
                >
                  <strong>{service.service}</strong>
                  <p>{service.description}</p>
                  <span>
                    {service.familyCount.toLocaleString()} families · {service.itemCount.toLocaleString()} findings
                  </span>
                </Link>
              ))}
            </div>
            <div className="button-row">
              <Link href="/services" className="secondary-button">
                Browse all services
              </Link>
              <Link href="/data-health" className="ghost-button">
                Check live data health
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
