"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildLoginUrl, fetchClientPrincipal } from "@/lib/review-cloud";

const signInHref = buildLoginUrl("aad", "/arb");

const WORKFLOW_STEPS = [
  { id: 1, label: "Sign in", detail: "Microsoft account — Outlook or Azure AD" },
  { id: 2, label: "Create review", detail: "Name your project and customer" },
  { id: 3, label: "Upload documents", detail: "PDF, Word, PowerPoint, Markdown" },
  { id: 4, label: "Run AI analysis", detail: "WAF · CAF · ALZ · HA/DR · Security + more" },
  { id: 5, label: "Review findings", detail: "Scored 0–100, linked to Microsoft Learn" },
  { id: 6, label: "Sign off & export", detail: "CSV, HTML, Markdown — board-ready pack" },
];

const serviceCards = [
  {
    tone: "ok",
    title: "Azure Kubernetes Service",
    href: "/services/azure-kubernetes-service-aks",
    meta: "55 regions · 42 findings",
    finding: "Enable cluster insights — WAF Reliability",
  },
  {
    tone: "warn",
    title: "API Management",
    href: "/services/api-management",
    meta: "9 restricted regions · 28 findings",
    finding: "Use zone redundancy where available — HA/DR",
  },
  {
    tone: "preview",
    title: "Azure App Service",
    href: "/services/azure-app-service",
    meta: "4 preview families · 19 findings",
    finding: "Use deployment slots for safer rollouts — CAF",
  },
] as const;

const frameworkCoverage = [
  "WAF", "CAF", "ALZ", "HA/DR", "Backup", "Security", "Networking", "Monitoring", "Governance",
] as const;

export default function HomePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetchClientPrincipal()
      .then((p) => setSignedIn(Boolean(p)))
      .catch(() => setSignedIn(false));
  }, []);

  return (
    <main className="impact-home">

      {/* ── HERO ── */}
      <section className="impact-section impact-section-hero">
        <span className="impact-kicker">Architecture reviews that ship</span>
        <h1 className="impact-headline">
          Upload architecture docs. Get board-ready Azure findings in minutes.
        </h1>
        <p className="impact-subline">
          One workflow for scope, evidence, region fit, pricing context, and exportable review packs.
        </p>

        <div className="impact-hero-cta-row">
          {signedIn === null ? (
            <span className="impact-auth-loading">Checking sign-in status…</span>
          ) : signedIn ? (
            <>
              <Link href="/arb" className="impact-btn impact-btn-primary">
                Go to Board Review →
              </Link>
              <Link href="/services" className="impact-btn impact-btn-secondary">
                Explore services
              </Link>
            </>
          ) : (
            <>
              <a href={signInHref} className="impact-btn impact-btn-primary">
                Sign In with Microsoft to Start →
              </a>
              <Link href="/services" className="impact-btn impact-btn-secondary">
                Explore services — no sign-in required
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="impact-section">
        <span className="impact-kicker">How it works</span>
        <h2 className="impact-section-title">Six steps from document to board-ready pack</h2>
        <p className="impact-small">
          Once you sign in, each step follows automatically — upload triggers analysis,
          analysis produces findings, findings feed the scorecard, and the scorecard
          feeds the export pack.
        </p>

        <ol className="impact-workflow-steps">
          {WORKFLOW_STEPS.map((step) => (
            <li key={step.id} className="impact-workflow-step">
              <span className="impact-step-num">{step.id}</span>
              <div>
                <strong>{step.label}</strong>
                <p className="impact-small">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="impact-hero-cta-row" style={{ marginTop: 24 }}>
          {signedIn === false && (
            <a href={signInHref} className="impact-btn impact-btn-primary">
              Sign in to start step 1 →
            </a>
          )}
          {signedIn === true && (
            <Link href="/arb" className="impact-btn impact-btn-primary">
              Continue your review →
            </Link>
          )}
        </div>
      </section>

      {/* ── BOARD REVIEW PREVIEW ── */}
      <section className="impact-section" id="board-review">
        <span className="impact-kicker">Architecture Board Review</span>
        <h2 className="impact-section-title">What you get after uploading your documents</h2>
        <p className="impact-small">
          The AI agent checks every document against 11 Azure frameworks and returns scored findings
          with evidence from your own docs and links to Microsoft Learn.
        </p>

        <div className="impact-grid-two">
          <article className="impact-panel">
            <h3 className="impact-panel-title">Traceable findings</h3>
            <ul className="impact-evidence-list">
              <li className="impact-evidence-item">
                <strong>AKS monitoring not enabled · Severity: High</strong>
                <p className="impact-small">Framework: WAF Reliability</p>
                <a href="https://learn.microsoft.com/en-us/azure/aks/monitor-aks" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/aks/monitor-aks
                </a>
              </li>
              <li className="impact-evidence-item">
                <strong>No zone redundancy in gateway layer · Severity: High</strong>
                <p className="impact-small">Framework: HA/DR and CAF</p>
                <a href="https://learn.microsoft.com/en-us/azure/well-architected/reliability/" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/well-architected/reliability
                </a>
              </li>
              <li className="impact-evidence-item">
                <strong>Missing tagging policy alignment · Severity: Medium</strong>
                <p className="impact-small">Framework: ALZ Governance</p>
                <a href="https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/" target="_blank" rel="noreferrer">
                  learn.microsoft.com/azure/cloud-adoption-framework
                </a>
              </li>
            </ul>

            <div className="impact-framework-grid">
              {frameworkCoverage.map((name) => (
                <div key={name} className="impact-framework-item">{name}</div>
              ))}
            </div>
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
            <div className="impact-decision-model">
              <span className="impact-decision-chip">Approved</span>
              <span className="impact-decision-chip impact-decision-chip-active">Needs Revision</span>
              <span className="impact-decision-chip">Rejected</span>
            </div>
            <p className="impact-small" style={{ marginTop: 12 }}>
              AI recommends a posture. Reviewers record the final decision and export the full ARB pack.
            </p>
            <div className="impact-format-chips">
              <span className="impact-format-chip">CSV Export</span>
              <span className="impact-format-chip">HTML Export</span>
              <span className="impact-format-chip">Markdown Export</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link href="/arb" className="impact-btn impact-btn-primary">
                Open Board Review
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
                  View findings →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Link href="/services" className="impact-btn impact-btn-secondary">
            Browse all services →
          </Link>
        </div>
      </section>

    </main>
  );
}
