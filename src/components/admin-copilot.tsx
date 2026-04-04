"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminCopilotHealthResponse, StaticWebAppClientPrincipal } from "@/types";
import { loadAdminCopilotHealth } from "@/lib/admin-copilot";
import { fetchClientPrincipal } from "@/lib/review-cloud";

const SUGGESTED_ADMIN_PROMPTS = [
  "List the Azure resources supporting this website.",
  "Check whether the Function App has the expected app settings.",
  "Verify the Azure OpenAI deployment health.",
  "Summarize App Insights and backend health risks."
];

function getLoginUrl() {
  if (typeof window === "undefined") {
    return "/.auth/login/aad";
  }

  return `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(window.location.href)}`;
}

function hasAdminRole(principal: StaticWebAppClientPrincipal | null) {
  return (
    principal?.userRoles?.some((role) => role.trim().toLowerCase() === "admin") ?? false
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("en-US");
}

export function AdminCopilot() {
  const [principal, setPrincipal] = useState<StaticWebAppClientPrincipal | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [health, setHealth] = useState<AdminCopilotHealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    let active = true;

    fetchClientPrincipal()
      .then((nextPrincipal) => {
        if (!active) {
          return;
        }

        setPrincipal(nextPrincipal);
        setAuthResolved(true);

        if (!hasAdminRole(nextPrincipal)) {
          return;
        }

        setHealthLoading(true);

        loadAdminCopilotHealth()
          .then((nextHealth) => {
            if (!active) {
              return;
            }

            setHealth(nextHealth);
            setHealthLoading(false);
          })
          .catch((nextError) => {
            if (!active) {
              return;
            }

            setHealthError(
              nextError instanceof Error
                ? nextError.message
                : "Unable to load admin copilot health."
            );
            setHealthLoading(false);
          });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setPrincipal(null);
        setAuthResolved(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const principalLabel = useMemo(
    () => principal?.userDetails || principal?.userId || "Signed-in admin",
    [principal]
  );

  if (!authResolved) {
    return (
      <main className="section-stack">
        <section className="surface-panel editorial-section">
          <p className="eyebrow">Admin copilot</p>
          <h1 className="section-title">Checking admin sign-in status.</h1>
          <p className="section-copy">
            This internal area is reserved for platform administrators and operational diagnostics.
          </p>
        </section>
      </main>
    );
  }

  if (!principal) {
    return (
      <main className="section-stack">
        <section className="surface-panel editorial-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Admin access required</p>
              <h1 className="section-title">Sign in as an internal administrator.</h1>
              <p className="section-copy">
                This area is for internal administrators who manage the Azure Review Board platform,
                diagnostics, and operational tooling.
              </p>
            </div>
          </div>
          <div className="button-row">
            <a href={getLoginUrl()} className="primary-button">
              Sign in as admin
            </a>
            <a href="/review-package" className="ghost-button">
              Back to project review
            </a>
          </div>
        </section>
      </main>
    );
  }

  if (!hasAdminRole(principal)) {
    return (
      <main className="section-stack">
        <section className="surface-panel editorial-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Access denied</p>
              <h1 className="section-title">You are signed in, but you do not have admin access.</h1>
              <p className="section-copy">
                Your account can use the project review features, but this admin area is restricted
                to internal platform administrators.
              </p>
            </div>
          </div>
          <div className="button-row">
            <a href="/review-package" className="primary-button">
              Go to project review
            </a>
            <a href="/.auth/logout" className="ghost-button">
              Sign out
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="section-stack">
      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Admin copilot</p>
            <h1 className="section-title">Inspect the Azure platform behind the website before deeper admin tooling goes live.</h1>
            <p className="section-copy">
              This shell is protected for internal administrators only. It confirms the admin route,
              admin API, scoped Azure environment, and current backend readiness before we connect
              the full Azure MCP-driven prompt workflow.
            </p>
          </div>
          <div className="button-row">
            <a href="/data-health" className="secondary-button">
              Open data health
            </a>
            <a href="/review-package" className="ghost-button">
              Back to project review
            </a>
          </div>
        </div>

        <div className="package-stats-grid">
          <article className="hero-metric-card">
            <span>Signed in admin</span>
            <strong>{principalLabel}</strong>
            <p>{principal.userRoles.join(", ") || "No roles published"}</p>
          </article>
          <article className="hero-metric-card">
            <span>Admin route</span>
            <strong>Protected</strong>
            <p>`/admin/copilot` is now reserved for the `admin` role.</p>
          </article>
          <article className="hero-metric-card">
            <span>Admin API</span>
            <strong>{health ? "Ready" : healthLoading ? "Checking" : "Pending"}</strong>
            <p>The shell now has a protected backend health route for internal diagnostics.</p>
          </article>
          <article className="hero-metric-card">
            <span>Prompt execution</span>
            <strong>{health?.capabilities.promptExecutionEnabled ? "Enabled" : "Coming next"}</strong>
            <p>The next pass will wire Azure MCP-backed admin prompt execution.</p>
          </article>
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Admin health</p>
            <h2 className="section-title">See the admin boundary, scoped Azure environment, and backend readiness.</h2>
            <p className="section-copy">
              This section is sourced from the protected admin API and helps validate whether the
              admin shell has the right platform context before tool execution is enabled.
            </p>
          </div>
        </div>

        {healthLoading ? (
          <section className="filter-card">
            <p className="eyebrow">Admin API</p>
            <h3>Loading admin health.</h3>
            <p className="microcopy">
              The shell is checking protected backend health, Azure scope, and future tool readiness.
            </p>
          </section>
        ) : null}

        {health ? (
          <>
            <div className="package-stats-grid">
              <article className="hero-metric-card">
                <span>Scope region</span>
                <strong>{health.scope.region ?? "Not published"}</strong>
                <p>Primary Azure region for the current platform scope.</p>
              </article>
              <article className="hero-metric-card">
                <span>Resource group</span>
                <strong>{health.scope.resourceGroup}</strong>
                <p>Scoped Azure resource group for internal admin checks.</p>
              </article>
              <article className="hero-metric-card">
                <span>Function App</span>
                <strong>{health.scope.functionAppName ?? "Unknown"}</strong>
                <p>Dedicated backend that powers pricing, availability, and copilot routes.</p>
              </article>
              <article className="hero-metric-card">
                <span>Last checked</span>
                <strong>{formatDate(health.checkedAt)}</strong>
                <p>Most recent protected admin health check.</p>
              </article>
            </div>

            <div className="traceability-grid">
              <article className="trace-card">
                <strong>Static Web App</strong>
                <p>{health.scope.staticWebAppName ?? "Not published"}</p>
              </article>
              <article className="trace-card">
                <strong>Azure OpenAI resource</strong>
                <p>{health.scope.openAiResourceName ?? "Not published"}</p>
              </article>
              <article className="trace-card">
                <strong>Azure OpenAI deployment</strong>
                <p>{health.scope.openAiDeployment ?? "Not published"}</p>
              </article>
              <article className="trace-card">
                <strong>Refresh schedule</strong>
                <p>{health.backend.refreshSchedule ?? "Not published"}</p>
              </article>
              <article className="trace-card">
                <strong>MCP server</strong>
                <p>{health.capabilities.mcpServerConfigured ? "Configured" : "Not configured yet"}</p>
              </article>
            </div>

            <div className="traceability-grid">
              <article className="trace-card">
                <strong>Application Insights</strong>
                <p>{health.capabilities.applicationInsightsConfigured ? "Enabled" : "Missing"}</p>
              </article>
              <article className="trace-card">
                <strong>Storage</strong>
                <p>{health.capabilities.storageConfigured ? "Configured" : "Missing"}</p>
              </article>
              <article className="trace-card">
                <strong>Public copilot backend</strong>
                <p>{health.capabilities.copilotConfigured ? "Configured" : "Not configured"}</p>
              </article>
              <article className="trace-card">
                <strong>Admin API shell</strong>
                <p>{health.capabilities.adminApiReady ? "Ready" : "Not ready"}</p>
              </article>
              <article className="trace-card">
                <strong>Admin route protection</strong>
                <p>{health.capabilities.adminRouteProtected ? "Enabled" : "Missing"}</p>
              </article>
            </div>

            <div className="service-selection-grid">
              {health.notes.map((note) => (
                <article className="future-card service-selection-card" key={note}>
                  <p className="eyebrow">Admin note</p>
                  <p className="microcopy">{note}</p>
                </article>
              ))}
            </div>
          </>
        ) : null}

        {healthError ? (
          <section className="filter-card">
            <p className="eyebrow">Admin API</p>
            <h3>The protected admin health check could not complete.</h3>
            <p className="microcopy">{healthError}</p>
          </section>
        ) : null}
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Next admin prompts</p>
            <h2 className="section-title">These are the first internal questions this admin workspace is being built to answer.</h2>
            <p className="section-copy">
              Prompt execution is intentionally held back until the Azure MCP layer is connected and
              limited to safe read-only tools.
            </p>
          </div>
        </div>

        <div className="service-selection-grid">
          {SUGGESTED_ADMIN_PROMPTS.map((prompt) => (
            <article className="future-card service-selection-card" key={prompt}>
              <p className="eyebrow">Planned prompt</p>
              <h3>{prompt}</h3>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
