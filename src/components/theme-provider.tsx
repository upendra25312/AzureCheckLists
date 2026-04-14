"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { AuthStatusChip } from "@/components/auth-status-chip";
import { SITE_NAME } from "@/lib/site";

type NavItem = {
  href: Route;
  label: string;
  matchPrefixes?: string[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/arb" as Route,
    label: "Architecture Review",
    matchPrefixes: ["/arb", "/decision-center"],
  },
  {
    href: "/services" as Route,
    label: "Service Explorer",
    matchPrefixes: ["/services", "/technologies"],
  },
];

function matchesNavItem(pathname: string, item: NavItem) {
  if (item.href === pathname) return true;
  return item.matchPrefixes?.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ?? false;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Always light — apply once on mount, no toggle
  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
  }, []);

  return (
    <AuthSessionProvider>
      <div className={`page-shell${isHome ? " page-shell-home" : ""}`}>
        <header className="topbar">
          <div className="topbar-inner">
            {/* Brand */}
            <Link href="/" className="topbar-brand" aria-label={SITE_NAME}>
              <img src="/logo.png" alt="" className="topbar-brand-logo" />
              <span className="topbar-brand-name">{SITE_NAME}</span>
            </Link>

            {/* Spacer */}
            <div aria-hidden="true" />

            {/* Primary nav — 2 links */}
            <nav className="topbar-nav" aria-label="Primary sections">
              {NAV_ITEMS.map((item) => {
                const active = matchesNavItem(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`topbar-nav-item${active ? " topbar-nav-item--active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Sign in / avatar */}
            <div className="topbar-actions">
              <AuthStatusChip />
            </div>
          </div>
        </header>

        {children}

        <footer className="site-footer surface-panel">
          <p className="site-footer-copy">
            Azure Review Assistant &mdash; structured architecture reviews grounded in Microsoft frameworks.
          </p>
        </footer>
      </div>
    </AuthSessionProvider>
  );
}
