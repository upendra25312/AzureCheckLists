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
  matchPrefixes?: string[];
};

const PRIMARY_TAB_ITEMS: NavItem[] = [
  { href: "/", label: "Initialize Review" },
  { href: "/review-package", label: "Project Review" },
  { href: "/my-project-reviews", label: "My Projects" }
] as const;

const SECONDARY_LINK_ITEMS: NavItem[] = [
  { href: "/services", label: "Browse Services", matchPrefixes: ["/services", "/technologies"] },
  { href: "/data-health", label: "Data Health Dashboard" },
  { href: "/explorer", label: "Advanced Tools" },
  { href: "/how-to-use", label: "How to use" }
] as const;

function isActiveHref(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function matchesNavItem(pathname: string, item: NavItem) {
  if (isActiveHref(pathname, item.href)) {
    return true;
  }

  return item.matchPrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? false;
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
  const isAdmin = pathname.startsWith("/admin");
  const utilityLinks: NavItem[] = isAdmin
    ? [
        ...SECONDARY_LINK_ITEMS,
        { href: "/admin/copilot", label: "Admin Copilot", matchPrefixes: ["/admin"] }
      ]
    : [...SECONDARY_LINK_ITEMS];

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
      <header className={`page-header page-header-home${!isHome ? " page-header-board" : ""}`}>
        <div className="home-header-main">
          <Link href="/" className="home-brand-link" aria-label={SITE_NAME}>
            <img src="/icon.svg" alt="" className="home-brand-logo" />
            <span className="home-brand-name">{SITE_NAME}</span>
          </Link>

          <nav className="home-tab-nav" aria-label="Primary sections">
            {PRIMARY_TAB_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`home-tab-link${matchesNavItem(pathname, item) ? " home-tab-link-active" : ""}`}
                aria-current={matchesNavItem(pathname, item) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="home-header-actions">
          <nav className="home-link-nav" aria-label="Secondary navigation">
            {utilityLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`home-link-nav-item${matchesNavItem(pathname, item) ? " home-link-nav-item-active" : ""}`}
                aria-current={matchesNavItem(pathname, item) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="board-header-utility">
            <div className="board-header-auth">
              <AuthStatusChip />
            </div>

            <button
              type="button"
              className="home-theme-toggle"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              <span className={`home-theme-toggle-track${theme === "dark" ? " home-theme-toggle-track-dark" : ""}`}>
                <span className="home-theme-toggle-knob" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {!isHome ? <TrustBanner /> : null}
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
