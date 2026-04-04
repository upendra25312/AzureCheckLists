"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildLoginUrl, fetchClientPrincipal } from "@/lib/review-cloud";
import type { StaticWebAppClientPrincipal } from "@/types";

function formatProvider(provider: string | undefined) {
  switch ((provider ?? "").toLowerCase()) {
    case "aad":
    case "azureactivedirectory":
      return "Microsoft";
    case "google":
      return "Google";
    default:
      return provider || "Account";
  }
}

export function AuthStatusChip() {
  const [principal, setPrincipal] = useState<StaticWebAppClientPrincipal | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let active = true;

    fetchClientPrincipal()
      .then((nextPrincipal) => {
        if (!active) {
          return;
        }

        setPrincipal(nextPrincipal);
        setResolved(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setPrincipal(null);
        setResolved(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!resolved) {
    return <span className="auth-chip auth-chip-pending">Checking sign-in…</span>;
  }

  if (!principal) {
    return (
      <details className="auth-menu">
        <summary className="auth-chip">Sign in</summary>
        <div className="auth-menu-panel">
          <p className="microcopy">
            Sign in to save project reviews to Azure, resume them later, and let the copilot reload
            your active review automatically.
          </p>
          <div className="auth-menu-actions">
            <a href={buildLoginUrl("aad")} className="primary-button">
              Continue with Microsoft
            </a>
            <a href={buildLoginUrl("google")} className="secondary-button">
              Continue with Google
            </a>
            <Link href="/review-package" className="ghost-button">
              Keep working locally
            </Link>
          </div>
        </div>
      </details>
    );
  }

  return (
    <div className="auth-chip-group">
      <details className="auth-menu">
        <summary className="auth-chip auth-chip-signed-in">
          <span className="auth-chip-label">Signed in</span>
          <span className="auth-chip-value">{principal.userDetails || principal.userId}</span>
        </summary>
        <div className="auth-menu-panel">
          <p className="microcopy">
            Signed in with {formatProvider(principal.identityProvider)} as{" "}
            {principal.userDetails || principal.userId}.
          </p>
          <div className="auth-menu-actions">
            <Link href="/my-project-reviews" className="secondary-button">
              My project reviews
            </Link>
            <Link href="/review-package" className="ghost-button">
              Open project review
            </Link>
            <a href="/.auth/logout" className="ghost-button">
              Sign out
            </a>
          </div>
        </div>
      </details>
      <a href="/.auth/logout" className="ghost-button auth-signout-button">
        Sign out
      </a>
    </div>
  );
}
