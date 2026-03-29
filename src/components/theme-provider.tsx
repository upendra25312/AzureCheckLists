"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrustBanner } from "@/components/trust-banner";
import { STORAGE_KEYS } from "@/lib/review-storage";

type Theme = "light" | "dark";

function resolveInitialTheme() {
  if (typeof window === "undefined") {
    return "light" as Theme;
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.theme);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initialTheme = resolveInitialTheme();

    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="header-brand">
          <div className="header-badge">Decision support for Azure reviews</div>
          <div>
            <h1 className="page-title">Azure Architecture Review Dashboard</h1>
            <p className="microcopy">
              Director-grade review support for executives, architects, and operators.
            </p>
          </div>
        </div>
        <div className="header-actions">
          <nav className="header-nav" aria-label="Primary">
            <Link href="/" className="secondary-button">
              Overview
            </Link>
            <Link href="/#explorer" className="secondary-button">
              Explorer
            </Link>
            <Link href="/how-to-use" className="secondary-button">
              How to use
            </Link>
            <Link href="/#roadmap" className="secondary-button">
              Roadmap
            </Link>
          </nav>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </header>
      <TrustBanner />
      {children}
      <footer className="site-footer surface-panel">
        <div className="future-grid">
          <article className="future-card">
            <h3>Why this exists</h3>
            <p>
              Turn distributed Azure checklist guidance into a faster, more credible review
              conversation for leaders, architects, and operators.
            </p>
          </article>
          <article className="future-card">
            <h3>What this is not</h3>
            <p>
              Not an approval engine, not a compliance control system, and not a substitute
              for architecture accountability.
            </p>
          </article>
          <article className="future-card">
            <h3>Source and transparency</h3>
            <p>
              Compiled from Azure review checklist content with preserved traceability,
              maturity disclosure, and local-only review state.
            </p>
          </article>
        </div>
      </footer>
    </div>
  );
}
