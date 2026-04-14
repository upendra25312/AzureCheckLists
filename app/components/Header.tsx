import Link from "next/link";
import { useAuthSession } from "@/components/auth-session-provider";
import { buildPrimaryLoginUrl } from "@/lib/review-cloud";

export default function Header() {
  const { principal, signedIn } = useAuthSession();

  return (
    <header className="page-header-home">
      <div className="home-header-main">
        <Link href="/" className="home-brand-link" aria-label="Azure Review Assistant Home">
          <img src="/logo.png" alt="" className="home-brand-logo" />
          <span className="home-brand-name">Azure Review Assistant</span>
        </Link>
        <nav className="home-link-nav" aria-label="Main navigation">
          <Link href="/arb" className="home-link-nav-item">Architecture Review</Link>
          <Link href="/explorer" className="home-link-nav-item">Service Explorer</Link>
        </nav>
      </div>
      <div className="home-header-actions">
        <Link href="/how-to-use" className="home-link-nav-item" aria-label="Help">
          <span role="img" aria-label="Help">❓</span>
        </Link>
        {signedIn ? (
          <div className="account-dropdown">
            <button className="avatar-button" aria-label="Account menu">
              <span className="avatar">{principal?.userDetails?.[0] ?? "U"}</span>
              <span className="username">{principal?.userDetails ?? "Account"}</span>
              <span aria-hidden>▼</span>
            </button>
            {/* Dropdown menu (Profile, Settings, Sign out) can be implemented here */}
          </div>
        ) : (
          <a href={buildPrimaryLoginUrl()} className="home-link-nav-item">Sign in</a>
        )}
      </div>
    </header>
  );
}
