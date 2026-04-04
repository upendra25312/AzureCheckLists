"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CachedSourceHealth = {
  ok: boolean;
  ttlHours: number;
  lastSuccessfulRefreshAt?: string | null;
  lastRefreshMode?: string | null;
  sourceUrl?: string | null;
  expiresAt?: string | null;
  lastError?: string | null;
  publicRegionCount?: number;
  lastServiceSlug?: string | null;
  lastWarmCount?: number;
};

type HealthPayload = {
  status: string;
  checkedAt: string;
  backendMode: string;
  functionAppName?: string;
  applicationInsightsConfigured: boolean;
  copilotConfigured: boolean;
  copilotModelName?: string | null;
  copilotDeployment?: string | null;
  copilotEndpoint?: string | null;
  storageConfigured: boolean;
  tableStorageConfigured?: boolean;
  refreshSchedule: string;
  manualRefreshEnabled: boolean;
  warmServiceIndexUrl?: string | null;
  warmServiceLimit?: number;
  availability?: CachedSourceHealth;
  pricing?: CachedSourceHealth;
  error?: string;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "Not refreshed yet";
  }

  return new Date(value).toLocaleString("en-US");
}

export function DataHealthView() {
  const [payload, setPayload] = useState<HealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/health", {
      cache: "no-store"
    })
      .then(async (response) => {
        const body = (await response.json()) as HealthPayload;

        if (!active) {
          return;
        }

        if (!response.ok) {
          setPayload(body);
          setError(body.error ?? `Health check failed with status ${response.status}.`);
          return;
        }

        setPayload(body);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to load backend health.");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="section-stack">
      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Data health</p>
            <h1 className="section-title">See when availability and pricing were last refreshed.</h1>
            <p className="section-copy">
              This page proves the app is using a real Azure Function backend, and it shows whether
              the backend is serving fresh data, scheduled cache, or the last successful fallback.
            </p>
          </div>
          <div className="button-row">
            <Link href="/review-package" className="secondary-button">
              Open project review
            </Link>
            <Link href="/services" className="ghost-button">
              Browse services
            </Link>
          </div>
        </div>

        {payload ? (
          <div className="package-stats-grid">
            <article className="hero-metric-card">
              <span>Backend status</span>
              <strong>{payload.status}</strong>
              <p>{payload.backendMode}</p>
            </article>
            <article className="hero-metric-card">
              <span>Function App</span>
              <strong>{payload.functionAppName ?? "Unknown"}</strong>
              <p>Dedicated backend visible in Azure portal.</p>
            </article>
            <article className="hero-metric-card">
              <span>Refresh cadence</span>
              <strong>{payload.refreshSchedule}</strong>
              <p>Timer-trigger schedule used by the commercial-data refresh job.</p>
            </article>
            <article className="hero-metric-card">
              <span>Copilot model</span>
              <strong>{payload.copilotConfigured ? payload.copilotModelName ?? "Configured" : "Not configured"}</strong>
              <p>
                {payload.copilotConfigured
                  ? payload.copilotDeployment ?? "Deployment name not published"
                  : "Azure OpenAI is not yet wired into the dedicated backend."}
              </p>
            </article>
            <article className="hero-metric-card">
              <span>Last checked</span>
              <strong>{formatDate(payload.checkedAt)}</strong>
              <p>Latest backend health read from the Function App.</p>
            </article>
          </div>
        ) : (
          <section className="filter-card">
            <p className="eyebrow">Health check</p>
            <h3>Loading backend health.</h3>
            <p className="microcopy">
              The page is checking the dedicated backend, scheduled refresh state, and cache freshness.
            </p>
          </section>
        )}

        {payload ? (
          <>
            <div className="traceability-grid">
              <article className="trace-card">
                <strong>Availability cache</strong>
                <p>
                  {payload.availability?.ok ? "Ready" : "Waiting"}
                  {payload.availability?.publicRegionCount
                    ? ` · ${payload.availability.publicRegionCount.toLocaleString()} public regions`
                    : ""}
                </p>
              </article>
              <article className="trace-card">
                <strong>Pricing cache</strong>
                <p>
                  {payload.pricing?.ok ? "Ready" : "Warming on demand"}
                  {payload.pricing?.lastWarmCount
                    ? ` · ${payload.pricing.lastWarmCount.toLocaleString()} services warmed`
                    : ""}
                </p>
              </article>
              <article className="trace-card">
                <strong>Application Insights</strong>
                <p>{payload.applicationInsightsConfigured ? "Enabled" : "Missing"}</p>
              </article>
              <article className="trace-card">
                <strong>Project review copilot</strong>
                <p>{payload.copilotConfigured ? "Configured" : "Not configured"}</p>
              </article>
              <article className="trace-card">
                <strong>Blob storage</strong>
                <p>{payload.storageConfigured ? "Configured" : "Missing"}</p>
              </article>
              <article className="trace-card">
                <strong>Table storage</strong>
                <p>{payload.tableStorageConfigured ? "Configured" : "Missing"}</p>
              </article>
            </div>

            <div className="traceability-grid">
              <article className="trace-card">
                <strong>Availability refreshed</strong>
                <p>{formatDate(payload.availability?.lastSuccessfulRefreshAt)}</p>
              </article>
              <article className="trace-card">
                <strong>Pricing refreshed</strong>
                <p>{formatDate(payload.pricing?.lastSuccessfulRefreshAt)}</p>
              </article>
              <article className="trace-card">
                <strong>Manual refresh</strong>
                <p>{payload.manualRefreshEnabled ? "Enabled" : "Disabled"}</p>
              </article>
              <article className="trace-card">
                <strong>Warm catalog</strong>
                <p>
                  {payload.warmServiceIndexUrl
                    ? `${payload.warmServiceLimit ?? 0} services from configured index`
                    : "No scheduled pricing warm catalog configured"}
                </p>
              </article>
            </div>

            <div className="traceability-grid">
              <article className="trace-card">
                <strong>Availability source</strong>
                <p>
                  {payload.availability?.sourceUrl ? (
                    <a
                      href={payload.availability.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="muted-link"
                    >
                      Microsoft availability feed
                    </a>
                  ) : (
                    "Not refreshed yet"
                  )}
                </p>
              </article>
              <article className="trace-card">
                <strong>Pricing source</strong>
                <p>
                  {payload.pricing?.sourceUrl ? (
                    <a
                      href={payload.pricing.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="muted-link"
                    >
                      Azure Retail Prices API
                    </a>
                  ) : (
                    "Not refreshed yet"
                  )}
                </p>
              </article>
              <article className="trace-card">
                <strong>Last pricing service</strong>
                <p>{payload.pricing?.lastServiceSlug ?? "Not refreshed yet"}</p>
              </article>
              <article className="trace-card">
                <strong>Copilot endpoint</strong>
                <p>{payload.copilotEndpoint ?? "Not configured"}</p>
              </article>
              <article className="trace-card">
                <strong>Health endpoint</strong>
                <p>/api/health</p>
              </article>
            </div>
          </>
        ) : null}

        {payload?.availability?.lastError ? (
          <section className="filter-card">
            <p className="eyebrow">Availability warning</p>
            <h3>The last availability refresh reported an issue.</h3>
            <p className="microcopy">{payload.availability.lastError}</p>
          </section>
        ) : null}

        {payload?.pricing?.lastError ? (
          <section className="filter-card">
            <p className="eyebrow">Pricing warning</p>
            <h3>The last pricing refresh reported an issue.</h3>
            <p className="microcopy">{payload.pricing.lastError}</p>
          </section>
        ) : null}

        {error ? (
          <section className="filter-card">
            <p className="eyebrow">Health check</p>
            <h3>The backend health check is degraded.</h3>
            <p className="microcopy">{error}</p>
          </section>
        ) : null}
      </section>
    </main>
  );
}
