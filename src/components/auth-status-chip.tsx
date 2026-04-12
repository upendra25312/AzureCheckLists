"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildLoginUrl, buildLogoutUrl, fetchClientPrincipal } from "@/lib/review-cloud";
import type { StaticWebAppClientPrincipal } from "@/types";

function formatProvider(provider: string | undefined) {
  switch ((provider ?? "").toLowerCase()) {
    case "aad":
    case "azureactivedirectory":
      return "Microsoft";
    default:
      return provider || "Account";
  }
}

export function AuthStatusChip() {
  const [principal, setPrincipal] = useState<StaticWebAppClientPrincipal | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let active = true;
    const fallback = setTimeout(() => {
      if (!active) {
        return;
      }

      setPrincipal(null);
      setResolved(true);
    }, 6000);

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
      clearTimeout(fallback);
    };
  }, []);

  if (!resolved) {
    return null;
  }

  if (!principal) {
    return (
      <a href={buildLoginUrl("aad")} className="auth-chip" title="Continue with Microsoft">
        Sign In with Microsoft
      </a>
    );
  }

  return (
    <div className="auth-chip-group">
      <details className="auth-menu">
        <summary className="auth-chip auth-chip-signed-in">
          <span className="auth-chip-label">Account</span>
          <span className="auth-chip-value">{principal.userDetails || principal.userId}</span>
        </summary>
        <div className="auth-menu-panel">
          <p className="microcopy">
            Signed in with {formatProvider(principal.identityProvider)} as{" "}
            {principal.userDetails || principal.userId}.
          </p>
          <div className="auth-menu-actions">
            <Link href="/arb" className="primary-button">
              Board Review
            </Link>
            <Link href="/services" className="secondary-button">
              Service Explorer
            </Link>
            <a href={buildLogoutUrl("/")} className="ghost-button">
              Sign out
            </a>
          </div>
        </div>
      </details>
      <a href={buildLogoutUrl("/")} className="ghost-button auth-signout-button">
        Sign out
      </a>
    </div>
  );
}
