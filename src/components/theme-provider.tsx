"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthStatusChip } from "@/components/auth-status-chip";
import { TrustBanner } from "@/components/trust-banner";
import { STORAGE_KEYS } from "@/lib/review-storage";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

type Theme = "light" | "dark";

const NAV_ITEMS = [
  { href: "/", label: "Start Project Review" },
  { href: "/services", label: "Services" },
  { href: "/review-package", label: "Project review" },
  { href: "/my-project-reviews", label: "My project reviews" },
  { href: "/data-health", label: "Data Health" },
  { href: "/explorer", label: "Advanced Tools" },
  { href: "/how-to-use", label: "How to use" }
] as const;

const HOME_TAB_ITEMS = [
  { href: "/", label: "Initialize Review" },
  { href: "/my-project-reviews", label: "My Projects" }
] as const;

const HOME_LINK_ITEMS = [
  { href: "/my-project-reviews", label: "My Projects" },
  { href: "/services", label: "Browse Services" },
  { href: "/data-health", label: "Data Health Dashboard" }
] as const;

function isActiveHref(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

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
  const pathname = usePathname();
  const isHome = pathname === "/";

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
    <div className={`page-shell${isHome ? " page-shell-home" : ""}`}>
      {isHome ? (
        <header className="page-header page-header-home">
          <div className="home-header-main">
            <Link href="/" className="home-brand-link" aria-label={SITE_NAME}>
              <img src="/icon.svg" alt="" className="home-brand-logo" />
              <span className="home-brand-name">{SITE_NAME}</span>
            </Link>

            <nav className="home-tab-nav" aria-label="Homepage sections">
              {HOME_TAB_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`home-tab-link${
                    isActiveHref(pathname, item.href) ? " home-tab-link-active" : ""
                  }`}
                  aria-current={isActiveHref(pathname, item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="home-header-actions">
            <nav className="home-link-nav" aria-label="Homepage navigation">
              {HOME_LINK_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="home-link-nav-item">
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link href="/my-project-reviews" className="home-header-icon-link" aria-label="My projects">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M5 19c1.6-3 4.1-4.5 7-4.5s5.4 1.5 7 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.7"
                />
              </svg>
            </Link>

            <button
              type="button"
              className="home-theme-toggle"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              <span className={`home-theme-toggle-track${theme === "dark" ? " home-theme-toggle-track-dark" : ""}`}>
                <span className="home-theme-toggle-knob" />
              </span>
            </button>
          </div>
        </header>
      ) : (
        <>
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
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`header-link${
                      isActiveHref(pathname, item.href) ? " header-link-active" : ""
                    }`}
                    aria-current={isActiveHref(pathname, item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <AuthStatusChip />
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
        </>
      )}
      {children}
      {!isHome ? (
        <footer className="site-footer surface-panel">
          <div className="site-footer-grid">
            <article className="site-footer-column">
              <h3>Why this exists</h3>
              <p>
                Turn Azure solution requirements into a scoped review artifact with service fit,
                region fit, pricing context, and project-specific notes.
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
                Built from Azure review checklist content with preserved traceability, Microsoft-backed
                commercial data, and dedicated backend data-health visibility.
              </p>
            </article>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
