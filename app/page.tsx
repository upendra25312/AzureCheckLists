import HomeClientSection from "./components/HomeClientSection";

export default function HomePage() {
  return <HomeClientSection />;
}

      {/* ── TWO MODES ── */}
      <section className="impact-section" id="two-modes">
        <span className="impact-kicker">Two ways to review</span>
        <h2 className="impact-section-title">Standard or ARB mode — choose what fits your work</h2>
        <div className="impact-mode-grid">
          <article className="impact-mode-card">
            <div className="impact-mode-header">
              <span className="impact-mode-badge impact-mode-badge--standard">Standard</span>
              <span className="impact-mode-tag">No sign-in required</span>
            </div>
            <h3 className="impact-mode-title">Instant service findings</h3>
            <p className="impact-small">
              Browse 100+ Azure services. Pick your stack and get immediate WAF, CAF, and ALZ findings with Microsoft Learn links.
            </p>
            <ul className="impact-mode-list">
              <li>Anonymous — no account needed</li>
              <li>Per-service best-practice checks</li>
              <li>Regional availability signals</li>
              <li>Export as CSV or HTML</li>
            </ul>
            <div>
              <Link href="/services" className="impact-btn impact-btn-secondary">
                Explore services ↗
              </Link>
            </div>
          </article>

          <div className="impact-mode-divider" aria-hidden="true">vs</div>

          <article className="impact-mode-card impact-mode-card--arb">
            <div className="impact-mode-header">
              <span className="impact-mode-badge impact-mode-badge--arb">ARB Grade</span>
              <span className="impact-mode-tag">Sign-in required</span>
            </div>
            <h3 className="impact-mode-title">Full architecture review</h3>
            <p className="impact-small">
              Upload your SOW or design doc. Every page is assessed against 11 Microsoft frameworks — scored, evidence-linked, and board-ready.
            </p>
            <ul className="impact-mode-list">
              <li>Document evidence grounded in your own files</li>
              <li>All 11 frameworks in one pass</li>
              <li>Weighted scorecard 0–100</li>
              <li>Human sign-off checkpoint with decision record</li>
              <li>Export as executive summary, action list, or full ARB pack</li>
            </ul>
            <div>
              <Link href="/arb" className="impact-btn impact-btn-primary">
                Start Architecture Review →
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* ── BOARD REVIEW PREVIEW ── */}
      <section className="impact-section" id="board-review">
        <span className="impact-kicker">Architecture Board Review</span>
        <h2 className="impact-section-title">What you get after uploading your documents</h2>
        <p className="impact-small">
          Every document is assessed against 11 Azure frameworks, returning scored, evidence-linked findings
          grounded in your own docs with references to Microsoft Learn.
        </p>

        <div className="impact-grid-two">
          <article className="impact-panel">
            <h3 className="impact-panel-title">Traceable findings</h3>
            <ul className="impact-evidence-list">
              <li className="impact-evidence-item">
                <strong>AKS monitoring not enabled · Severity: High</strong>
                <p className="impact-small">Framework: WAF Reliability</p>
                <a href="https://learn.microsoft.com/en-us/azure/aks/monitor-aks" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/aks/monitor-aks ↗
                </a>
              </li>
              <li className="impact-evidence-item">
                <strong>No zone redundancy in gateway layer · Severity: High</strong>
                <p className="impact-small">Framework: HA/DR and CAF</p>
                <a href="https://learn.microsoft.com/en-us/azure/well-architected/reliability/" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/well-architected/reliability ↗
                </a>
              </li>
              <li className="impact-evidence-item">
                <strong>Missing tagging policy alignment · Severity: Medium</strong>
                <p className="impact-small">Framework: ALZ Governance</p>
                <a href="https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/cloud-adoption-framework ↗
                </a>
              </li>
            </ul>

            <div className="impact-framework-grid">
              {frameworkCoverage.map(({ name, status }) => (
                <div key={name} className="impact-framework-item">
                  <span className={`impact-framework-state${status === "complete" ? " impact-framework-state-complete" : " impact-framework-state-partial"}`}>
                    {status === "complete" ? "✓" : "~"}
                  </span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
            <p className="impact-framework-summary">6 of 9 frameworks complete · 78% coverage</p>
          </article>

          <article className="impact-panel">
            <h3 className="impact-panel-title">Weighted scorecard + sign-off</h3>
            {(["Reliability", "Security", "Cost Optimisation"] as const).map((domain, i) => {
              const scores = [78, 64, 71];
              return (
                <div key={domain} className="impact-score-row">
                  <span>{domain}</span>
                  <div className="impact-score-bar">
                    <div className="impact-score-fill" style={{ width: `${scores[i]}%` }} />
                  </div>
                  <span>{scores[i]}</span>
                </div>
              );
            })}
            <div className="impact-signoff-block">
              <p className="impact-signoff-label">ARB sign-off checkpoint</p>
              <div className="impact-signoff-meta">
                <span className="impact-signoff-field">Architecture Review Board Executive</span>
                <span className="impact-signoff-field">📅 13 Apr 2026 · 14:32 UTC</span>
              </div>
              <div className="impact-decision-model">
                <span className="impact-decision-chip">Approved</span>
                <span className="impact-decision-chip impact-decision-chip-active">Needs Revision</span>
                <span className="impact-decision-chip">Rejected</span>
              </div>
              <p className="impact-small" style={{ marginTop: 8 }}>
                Framework analysis derives a recommended posture. The named reviewer records the final decision.
              </p>
            </div>
            <div className="impact-format-chips">
              <span className="impact-format-chip">CSV Export</span>
              <span className="impact-format-chip">HTML Export</span>
              <span className="impact-format-chip">Markdown Export</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link href="/arb" className="impact-btn impact-btn-primary">
                 Start Architecture Review →
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* ── SERVICE EXPLORER PREVIEW ── */}
      <section className="impact-section" id="service-explorer">
        <span className="impact-kicker">Service Explorer</span>
        <h2 className="impact-section-title">Explore Azure services — no sign-in required</h2>
        <p className="impact-small">
          Search any Azure service to get instant findings, regional availability, and risk indicators.
        </p>

        <div className="impact-service-grid">
          {serviceCards.map((card) => (
            <article key={card.title} className="impact-card">
              <span className={`impact-status impact-status-${card.tone}`}>
                {card.tone === "ok" ? "AVAILABLE" : card.tone === "warn" ? "RESTRICTED" : "PREVIEW"}
              </span>
              <h3>{card.title}</h3>
              <p className="impact-small">{card.meta}</p>
              <p className="impact-small" style={{ color: "var(--t1)", fontWeight: 600 }}>{card.finding}</p>
              <div className="impact-service-actions">
                <Link href={card.href} className="impact-btn impact-btn-secondary">
                  {signedIn ? "View findings · Add to review" : "View instant findings ↗"}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Link href="/services" className="impact-btn impact-btn-secondary">
            Explore Azure Services
          </Link>
        </div>
      </section>

    </main>
  );
}
