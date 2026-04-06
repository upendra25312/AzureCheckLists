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

function getFindingToneClass(severity: "info" | "warning" | "error") {
  switch (severity) {
    case "error":
      return "matrix-chip matrix-chip-danger";
    case "warning":
      return "matrix-chip matrix-chip-warning";
    case "info":
    default:
      return "matrix-chip matrix-chip-neutral";
  }
}

function getConfigToneClass(status: "configured" | "defaulted" | "missing") {
  switch (status) {
    case "configured":
      return "matrix-chip matrix-chip-good";
    case "defaulted":
      return "matrix-chip matrix-chip-neutral";
    case "missing":
    default:
      return "matrix-chip matrix-chip-warning";
  }
}

function getEvidenceToneClass(status: "healthy" | "warning" | "error" | "info") {
  switch (status) {
    case "healthy":
      return "matrix-chip matrix-chip-good";
    case "error":
      return "matrix-chip matrix-chip-danger";
    case "warning":
      return "matrix-chip matrix-chip-warning";
    case "info":
    default:
      return "matrix-chip matrix-chip-neutral";
  }
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
                <p>Read-only diagnostics are live first; MCP-backed prompt execution stays disabled for now.</p>
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
                <strong>Copilot endpoint</strong>
                <p>{health.backend.copilotEndpoint ?? "Not published"}</p>
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

            <div className="traceability-grid">
              <article className="trace-card">
                <strong>Manual refresh</strong>
                <p>{health.backend.manualRefreshEnabled ? "Enabled" : "Disabled"}</p>
              </article>
              <article className="trace-card">
                <strong>Warm service source</strong>
                <p>{health.backend.warmServiceIndexUrl ?? "Not configured"}</p>
              </article>
              <article className="trace-card">
                <strong>Warm service limit</strong>
                <p>{health.backend.warmServiceLimit?.toLocaleString() ?? "0"}</p>
              </article>
              <article className="trace-card">
                <strong>Diagnostic findings</strong>
                <p>{health.findings.length.toLocaleString()}</p>
              </article>
            </div>

            <div className="traceability-grid">
              <article className="trace-card">
                <strong>Availability refresh</strong>
                <p>{health.backend.availability?.lastSuccessfulRefreshAt ? formatDate(health.backend.availability.lastSuccessfulRefreshAt) : "No successful refresh yet"}</p>
                <p className="microcopy">
                  Mode: {health.backend.availability?.lastRefreshMode ?? "Not published"} · TTL {health.backend.availability?.ttlHours ?? 0}h
                </p>
              </article>
              <article className="trace-card">
                <strong>Availability expiry</strong>
                <p>{formatDate(health.backend.availability?.expiresAt)}</p>
                <p className="microcopy">
                  Public regions: {health.backend.availability?.publicRegionCount?.toLocaleString() ?? "0"}
                </p>
              </article>
              <article className="trace-card">
                <strong>Pricing refresh</strong>
                <p>{health.backend.pricing?.lastSuccessfulRefreshAt ? formatDate(health.backend.pricing.lastSuccessfulRefreshAt) : "No successful refresh yet"}</p>
                <p className="microcopy">
                  Mode: {health.backend.pricing?.lastRefreshMode ?? "Not published"} · TTL {health.backend.pricing?.ttlHours ?? 0}h
                </p>
              </article>
              <article className="trace-card">
                <strong>Last warmed pricing scope</strong>
                <p>{health.backend.pricing?.lastServiceSlug ?? "Not published"}</p>
                <p className="microcopy">
                  Warm count: {health.backend.pricing?.lastWarmCount?.toLocaleString() ?? "0"}
                </p>
              </article>
            </div>

            <div className="section-head">
              <div>
                <p className="eyebrow">Operational evidence</p>
                <h2 className="section-title">See whether the backend looks fresh, observable, and ready right now.</h2>
                <p className="section-copy">
                  This section turns the current runtime and refresh state into operator-readable evidence instead of raw settings only.
                </p>
              </div>
            </div>

            <div className="service-selection-grid">
              {(health.backend.evidence ?? []).map((entry) => (
                <article className="future-card service-selection-card" key={entry.label}>
                  <div className="chip-row compact-chip-row">
                    <span className={getEvidenceToneClass(entry.status)}>{entry.status}</span>
                  </div>
                  <h3>{entry.label}</h3>
                  <p>{entry.summary}</p>
                  {entry.detail ? <p className="microcopy">{entry.detail}</p> : null}
                </article>
              ))}
            </div>

            <div className="section-head">
              <div>
                <p className="eyebrow">Config inventory</p>
                <h2 className="section-title">Inspect the runtime, storage, refresh, and copilot configuration that the backend can actually see.</h2>
                <p className="section-copy">
                  These entries are intentionally limited to visible configuration evidence. Secret values stay hidden.
                </p>
              </div>
            </div>

            <div className="service-selection-grid">
              {[
                {
                  key: "runtime",
                  title: "Runtime",
                  entries: health.backend.runtime ?? []
                },
                {
                  key: "storage",
                  title: "Storage",
                  entries: health.backend.storage ?? []
                },
                {
                  key: "refresh",
                  title: "Refresh",
                  entries: health.backend.refresh ?? []
                },
                {
                  key: "copilot",
                  title: "Copilot",
                  entries: health.backend.copilot ?? []
                }
              ].map((group) => (
                <article className="future-card service-selection-card" key={group.key}>
                  <p className="eyebrow">{group.title}</p>
                  <div className="section-stack" style={{ gap: 12 }}>
                    {group.entries.length > 0 ? (
                      group.entries.map((entry) => (
                        <div key={`${group.key}-${entry.label}`}>
                          <div className="chip-row compact-chip-row">
                            <span className={getConfigToneClass(entry.status)}>{entry.status}</span>
                          </div>
                          <strong>{entry.label}</strong>
                          <p>{entry.value}</p>
                          {entry.detail ? <p className="microcopy">{entry.detail}</p> : null}
                        </div>
                      ))
                    ) : (
                      <p className="microcopy">No visible entries were returned for this category.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {health.findings.length > 0 ? (
              <div className="service-selection-grid">
                {health.findings.map((finding) => (
                  <article className="future-card service-selection-card" key={finding.id}>
                    <div className="chip-row compact-chip-row">
                      <span className={getFindingToneClass(finding.severity)}>{finding.severity}</span>
                    </div>
                    <h3>{finding.label}</h3>
                    <p className="microcopy">{finding.detail}</p>
                  </article>
                ))}
              </div>
            ) : null}

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
