"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthStatusChip } from "@/components/auth-status-chip";
import { TrustBanner } from "@/components/trust-banner";
import { STORAGE_KEYS } from "@/lib/review-storage";
import { SITE_NAME } from "@/lib/site";

type Theme = "light" | "dark";

type NavItem = {
  href: Route;
  label: string;
  icon: React.ReactNode;
  hasBadge?: boolean;
  matchPrefixes?: string[];
  matches?: (pathname: string) => boolean;
};

function isDecisionCenterPath(pathname: string) {
  return (
    pathname === "/decision-center" ||
    pathname.endsWith("/scorecard") ||
    pathname.endsWith("/decision")
  );
}

function isReviewsPath(pathname: string) {
  return (
    pathname === "/my-project-reviews" ||
    pathname === "/review-package" ||
    pathname === "/arb" ||
    pathname.startsWith("/arb/") ||
    isDecisionCenterPath(pathname)
  );
}

/* ── Inline SVG icons ── */
function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 3V2.5A1.5 1.5 0 0 1 10 2.5V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconCube() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5L14 5v6L8 14.5 2 11V5L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 1.5v13M2 5l6 3.5L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5L13.5 4v4c0 3-2.5 5.5-5.5 6.5C5 13.5 2.5 11 2.5 8V4L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2.5h7a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H3V2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 2.5h.5A1.5 1.5 0 0 1 12 4v8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.5 6h4M5.5 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PRIMARY_TAB_ITEMS: NavItem[] = [
  {
    href: "/" as Route,
    label: "Dashboard",
    icon: <IconGrid />,
  },
  {
    href: "/my-project-reviews" as Route,
    label: "Reviews",
    icon: <IconClipboard />,
    matches: isReviewsPath,
  },
  {
    href: "/services" as Route,
    label: "Services",
    icon: <IconCube />,
    matchPrefixes: ["/services", "/technologies"],
  },
  {
    href: "/arb" as Route,
    label: "ARB Review",
    icon: <IconShield />,
    hasBadge: true,
    matchPrefixes: ["/arb", "/decision-center"],
  },
  {
    href: "/how-to-use" as Route,
    label: "Docs",
    icon: <IconBook />,
    matchPrefixes: ["/how-to-use", "/data-health"],
  },
];

function isActiveHref(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function matchesNavItem(pathname: string, item: NavItem) {
  if (item.matches?.(pathname)) return true;
  if (isActiveHref(pathname, item.href)) return true;
  return item.matchPrefixes?.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ?? false;
}

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }
  const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
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
      <header className="topbar">
        <div className="topbar-inner">
          {/* Brand */}
          <Link href="/" className="topbar-brand" aria-label={SITE_NAME}>
            <img src="/icon.svg" alt="" className="topbar-brand-logo" />
            <span className="topbar-brand-name">{SITE_NAME}</span>
          </Link>

          {/* Command bar placeholder */}
          <div className="topbar-cmd" role="button" tabIndex={0} aria-label="Search (⌘K)">
            <IconSearch />
            <span className="topbar-cmd-text">Search services, findings&hellip;</span>
            <kbd className="topbar-cmd-kbd">⌘K</kbd>
          </div>

          {/* Primary nav */}
          <nav className="topbar-nav" aria-label="Primary sections">
            {PRIMARY_TAB_ITEMS.map((item) => {
              const active = matchesNavItem(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`topbar-nav-item${active ? " topbar-nav-item--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.hasBadge && <span className="topbar-nav-badge">ARB</span>}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="topbar-actions">
            <AuthStatusChip />
            <button
              type="button"
              className="topbar-theme-btn"
              onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              {theme === "light" ? <IconMoon /> : <IconSun />}
            </button>
          </div>
        </div>
      </header>

      {!isHome && <TrustBanner />}
      {children}

      <footer className="site-footer surface-panel">
        <div className="site-footer-grid">
          <article className="site-footer-column">
            <h3>Product</h3>
            <p>
              Help Azure architects move from design questions to a usable review pack with
              scoped findings, region fit, pricing context, and clear outputs.
            </p>
          </article>
          <article className="site-footer-column">
            <h3>Decision boundary</h3>
            <p>
              The assistant supports review preparation and evidence gathering. Final approval,
              exceptions, and sign-off remain human decisions.
            </p>
          </article>
          <article className="site-footer-column">
            <h3>Trust &amp; freshness</h3>
            <p>
              Source freshness, pricing context, and review evidence stay visible so teams can
              judge what the product knows and when it was last refreshed.
            </p>
          </article>
          <article className="site-footer-column">
            <h3>Workflow</h3>
            <p>
              Standard reviews move quickly. ARB-grade reviews add stronger evidence, explicit
              reviewer checkpoints, and sign-off discipline.
            </p>
          </article>
        </div>
        <p className="site-footer-copy">
          Azure Review Assistant &mdash; architecture reviews that ship, not stall.
        </p>
      </footer>
    </div>
  );
}
