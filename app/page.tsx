import Link from "next/link";
import { buildLoginUrl } from "@/lib/review-cloud";

const signInHref = buildLoginUrl("aad", "/arb");

const serviceCards = [
  {
    status: "AVAILABLE",
    tone: "ok",
    title: "Azure Kubernetes Service",
    href: "/services/azure-kubernetes-service-aks",
    meta: ["55 mapped regions", "42 findings available", "Source refreshed recently"],
    findings: [
      {
        text: "Enable cluster insights",
        href: "https://learn.microsoft.com/en-us/azure/aks/monitor-aks"
      },
      {
        text: "Use node pool availability zones",
        href: "https://learn.microsoft.com/en-us/azure/aks/availability-zones-overview"
      }
    ]
  },
  {
    status: "RESTRICTED",
    tone: "warn",
    title: "API Management",
    href: "/services/api-management",
    meta: ["9 restricted regions", "28 findings available", "Source refreshed recently"],
    findings: [
      {
        text: "Enable diagnostics logging",
        href: "https://learn.microsoft.com/en-us/azure/api-management/api-management-howto-use-azure-monitor"
      },
      {
        text: "Use zone redundancy where available",
        href: "https://learn.microsoft.com/en-us/azure/reliability/reliability-api-management"
      }
    ]
  },
  {
    status: "PREVIEW",
    tone: "preview",
    title: "Azure App Service",
    href: "/services/azure-app-service",
    meta: ["4 preview checklist families", "19 findings available", "Source refreshed recently"],
    findings: [
      {
        text: "Enable authentication and authorization",
        href: "https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization"
      },
      {
        text: "Use deployment slots for safer rollouts",
        href: "https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots"
      }
    ]
  }
] as const;

const frameworkCoverage = [
  ["WAF", "Complete"],
  ["CAF", "Complete"],
  ["ALZ", "Complete"],
  ["HA/DR", "Partial"],
  ["Backup", "Partial"],
  ["Security", "Complete"],
  ["Networking", "Complete"],
  ["Monitoring", "Partial"],
  ["Governance", "Complete"]
] as const;

export default function HomePage() {
  return (
    <main className="impact-home">
      <section id="home" className="impact-section impact-section-hero">
        <span className="impact-kicker">Architecture reviews that ship</span>
        <h1 className="impact-headline">
          Upload architecture docs. Get board-ready Azure findings in minutes.
        </h1>
        <p className="impact-subline">
          One workflow for scope, evidence, region fit, pricing context, and exportable review packs.
        </p>

        <div className="impact-hero-input-shell" aria-label="Primary input">
          <div className="impact-hero-upload">
            <label className="impact-hero-upload-label" htmlFor="heroFileInput">
              Primary input: select architecture documents
            </label>
            <input
              id="heroFileInput"
              className="impact-hero-file"
              type="file"
              aria-label="Select architecture documents"
              multiple
              disabled
            />
          </div>
          <Link href="/arb" className="impact-btn impact-btn-primary">
            Start Review
          </Link>
        </div>

        <div className="impact-signin-banner" role="note" aria-label="Sign in requirement">
          <div>
            <strong>Sign in with your Outlook email or Azure login.</strong>
            <p className="impact-small">Upload is locked until Microsoft sign-in is complete.</p>
          </div>
          <a className="impact-btn impact-btn-secondary" href={signInHref}>
            Go to Sign In
          </a>
        </div>

        <div className="impact-hero-actions">
          <Link href="/services" className="impact-btn impact-btn-secondary">
            Explore services
          </Link>
        </div>
      </section>

      <section id="sign-in" className="impact-section">
        <span className="impact-kicker">Sign In First</span>
        <h2 className="impact-section-title">Sign in with your Outlook email or Azure login.</h2>
        <p className="impact-small">
          Quick sign-in unlocks upload, saved reviews, and the full board workflow.
        </p>

        <div className="impact-auth-shell">
          <article className="impact-auth-card">
            <h3 className="impact-auth-title">Sign in to continue</h3>
            <p className="impact-small">Use your Outlook email or Azure login to continue.</p>
            <div className="impact-auth-fields">
              <a className="impact-btn impact-btn-primary" href={signInHref}>
                Sign In with Microsoft
              </a>
            </div>
            <p className="impact-auth-note">
              Accepted: Outlook email or Azure login through Azure Static Web Apps authentication.
            </p>
          </article>
        </div>
      </section>

      <section id="board-review" className="impact-section">
        <span className="impact-kicker">Architecture Board Review</span>
        <h2 className="impact-section-title">Submit for board review</h2>
        <p className="impact-small">
          Structured ARB-grade workflow with weighted scorecard, framework coverage, and human sign-off gate.
        </p>

        <div className="impact-grid-two">
          <article className="impact-panel">
            <h3 className="impact-panel-title">Step 2: Upload documents</h3>
            <div className="impact-upload-locked">
              Upload locked until Microsoft sign-in is complete.
            </div>
            <div className="impact-upload-zone">
              <div>
                <strong>Drop files here</strong>
                <span className="impact-small">PDF, DOCX, PPTX, MD. Multi-file supported.</span>
              </div>
            </div>
            <div className="impact-format-chips" aria-label="Export formats">
              <span className="impact-format-chip">CSV Export</span>
              <span className="impact-format-chip">HTML Export</span>
              <span className="impact-format-chip">Markdown Export</span>
            </div>
            <div className="impact-panel-actions">
              <a className="impact-btn impact-btn-secondary" href={signInHref}>
                Sign in to unlock upload
              </a>
            </div>
          </article>

          <article className="impact-panel">
            <h3 className="impact-panel-title">Step 3: Evidence and outputs</h3>
            <div className="impact-progress">
              <div className="impact-progress-item impact-progress-item-active">Upload</div>
              <div className="impact-progress-item">Analyze</div>
              <div className="impact-progress-item">Findings</div>
              <div className="impact-progress-item">Export</div>
            </div>

            <ul className="impact-evidence-list" aria-label="Traceable findings preview">
              <li className="impact-evidence-item">
                <strong>AKS monitoring not enabled. Severity: High</strong>
                <p className="impact-small">Framework: WAF Reliability</p>
                <a
                  href="https://learn.microsoft.com/en-us/azure/aks/monitor-aks"
                  target="_blank"
                  rel="noreferrer"
                >
                  Source: learn.microsoft.com/azure/aks/monitor-aks
                </a>
              </li>
              <li className="impact-evidence-item">
                <strong>No zone redundancy in gateway layer. Severity: High</strong>
                <p className="impact-small">Framework: HA/DR and CAF</p>
                <a
                  href="https://learn.microsoft.com/en-us/azure/well-architected/reliability/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Source: learn.microsoft.com/azure/well-architected/reliability
                </a>
              </li>
              <li className="impact-evidence-item">
                <strong>Missing tagging policy alignment. Severity: Medium</strong>
                <p className="impact-small">Framework: ALZ Governance</p>
                <a
                  href="https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Source: learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone
                </a>
              </li>
            </ul>

            <div className="impact-framework-grid" aria-label="Framework coverage">
              {frameworkCoverage.map(([name, state]) => (
                <div key={name} className="impact-framework-item">
                  <span>{name}</span>
                  <span
                    className={`impact-framework-state${
                      state === "Complete" ? " impact-framework-state-complete" : " impact-framework-state-partial"
                    }`}
                  >
                    {state}
                  </span>
                </div>
              ))}
            </div>

            <div className="impact-framework-summary">
              Framework coverage: 6 complete, 3 partial, 0 missing.
            </div>

            <div className="impact-workspace-strip" aria-label="Unified workspace outputs">
              <span className="impact-workspace-item">Executive Summary</span>
              <span className="impact-workspace-item">Action Plan</span>
              <span className="impact-workspace-item">Pricing Snapshot</span>
              <span className="impact-workspace-item">Full ARB Pack</span>
            </div>

            <div className="impact-arb-panel" aria-label="ARB scorecard and sign-off">
              <div className="impact-score-row">
                <span>Reliability</span>
                <div className="impact-score-bar">
                  <div className="impact-score-fill" style={{ width: "78%" }} />
                </div>
                <span>78</span>
              </div>
              <div className="impact-score-row">
                <span>Security</span>
                <div className="impact-score-bar">
                  <div className="impact-score-fill" style={{ width: "64%" }} />
                </div>
                <span>64</span>
              </div>
              <div className="impact-score-row">
                <span>Cost</span>
                <div className="impact-score-bar">
                  <div className="impact-score-fill" style={{ width: "71%" }} />
                </div>
                <span>71</span>
              </div>
              <div className="impact-decision-model" aria-label="Decision states">
                <span className="impact-decision-chip">Approved</span>
                <span className="impact-decision-chip impact-decision-chip-active">Needs Revision</span>
                <span className="impact-decision-chip">Rejected</span>
              </div>
              <div className="impact-reviewer-meta">
                Reviewer: Cloud Architecture Board. Checkpoint: Pending. Human sign-off required before export.
              </div>
            </div>

            <div className="impact-cards">
              <article className="impact-card">
                <h3>Executive Summary</h3>
                <p className="impact-small">Board-ready recommendation.</p>
              </article>
              <article className="impact-card">
                <h3>Action List</h3>
                <p className="impact-small">Owners and due dates.</p>
              </article>
              <article className="impact-card">
                <h3>Pricing Snapshot</h3>
                <p className="impact-small">Region and assumptions.</p>
              </article>
              <article className="impact-card">
                <h3>Decision Log</h3>
                <p className="impact-small">Human sign-off trail.</p>
              </article>
            </div>

            <Link href="/arb" className="impact-btn impact-btn-primary impact-sticky-action">
              Open Board Review
            </Link>
          </article>
        </div>
      </section>

      <section id="service-explorer" className="impact-section">
        <span className="impact-kicker">Service Explorer</span>
        <h2 className="impact-section-title">Explore Azure services. No sign-in required.</h2>
        <p className="impact-small">
          Search any Azure service to get instant findings, regional availability, and risk indicators.
        </p>
        <div className="impact-scope-badge">
          Standard quick scope. Anonymous access. No document upload required.
        </div>

        <div className="impact-search-row">
          <input
            className="impact-field"
            type="text"
            defaultValue="Azure Kubernetes Service"
            aria-label="Search service"
            readOnly
          />
          <select className="impact-field" aria-label="Filter by region" defaultValue="All regions" disabled>
            <option>All regions</option>
          </select>
          <select className="impact-field" aria-label="Filter by category" defaultValue="All categories" disabled>
            <option>All categories</option>
          </select>
        </div>

        <div className="impact-service-grid">
          {serviceCards.map((card) => (
            <article key={card.title} className="impact-card">
              <span className={`impact-status impact-status-${card.tone}`}>{card.status}</span>
              <h3>{card.title}</h3>
              <ul className="impact-service-meta">
                {card.meta.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
              <ul className="impact-service-findings">
                {card.findings.map((finding) => (
                  <li key={finding.text}>
                    {finding.text}{" "}
                    <a href={finding.href} target="_blank" rel="noreferrer">
                      source
                    </a>
                  </li>
                ))}
              </ul>
              <div className="impact-service-actions">
                <Link href={card.href} className="impact-btn impact-btn-secondary">
                  View findings
                </Link>
                <a href={signInHref} className="impact-btn impact-btn-secondary">
                  Add to board review
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="trust" className="impact-section">
        <span className="impact-kicker">Trust and Freshness</span>
        <h2 className="impact-section-title">Public-safe transparency before sign-in.</h2>
        <p className="impact-small">
          Review confidence starts with visible source and freshness state.
        </p>

        <div className="impact-trust-grid">
          <article className="impact-trust">
            <strong>Catalog freshness</strong>
            <p className="impact-small">Service and finding previews stay visible without sign-in.</p>
          </article>
          <article className="impact-trust">
            <strong>Pricing refresh</strong>
            <p className="impact-small">Retail snapshots keep source context and assumptions visible.</p>
          </article>
          <article className="impact-trust">
            <strong>Source lineage</strong>
            <p className="impact-small">Each previewed finding still points back to Microsoft guidance.</p>
          </article>
        </div>

        <div className="impact-unlock">
          <div>
            <strong>Sign in to unlock the ARB-grade workflow.</strong>
            <p className="impact-small">
              Save reviews, assign actions, and capture human sign-off.
            </p>
          </div>
          <div className="impact-unlock-list" aria-label="Sign-in unlocks">
            <span>Saved Reviews</span>
            <span>Scorecard</span>
            <span>Team Sharing</span>
            <span>Decision Log</span>
          </div>
          <a className="impact-btn impact-btn-primary" href={signInHref}>
            Start Board Review
          </a>
        </div>
      </section>
    </main>
  );
}
