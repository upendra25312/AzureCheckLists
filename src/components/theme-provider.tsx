"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrustBanner } from "@/components/trust-banner";
import { STORAGE_KEYS } from "@/lib/review-storage";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

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
          <div className="header-badge">Architecture review</div>
          <div>
            <h1 className="page-title">{SITE_NAME}</h1>
            <p className="microcopy">{SITE_DESCRIPTION}</p>
          </div>
        </div>
        <div className="header-actions">
          <nav className="header-nav" aria-label="Primary">
            <Link href="/" className="header-link">
              Overview
            </Link>
            <Link href="/services" className="header-link">
              Services
            </Link>
            <Link href="/explorer" className="header-link">
              Explorer
            </Link>
            <Link href="/how-to-use" className="header-link">
              How to use
            </Link>
          </nav>
          <button
            type="button"
            className="theme-toggle header-link"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </header>
      <TrustBanner />
      {children}
      <footer className="site-footer surface-panel">
        <div className="site-footer-grid">
          <article className="site-footer-column">
            <h3>Why this exists</h3>
            <p>
              Bring Azure review guidance into a clearer, more actionable review conversation
              for leaders, architects, and operators.
            </p>
          </article>
          <article className="site-footer-column">
            <h3>What this is not</h3>
            <p>
              Not an approval engine, not a compliance system, and not a substitute for
              accountable architecture sign-off.
            </p>
          </article>
          <article className="site-footer-column">
            <h3>Source and transparency</h3>
            <p>
              Built from Azure review checklist content with preserved traceability,
              maturity disclosure, and local-only working state.
            </p>
          </article>
        </div>
      </footer>
    </div>
  );
}
