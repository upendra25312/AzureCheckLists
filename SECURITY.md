# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.** This could expose the vulnerability before a fix is available.

### Private Disclosure Process

Use **[GitHub's private vulnerability reporting](https://github.com/upendra25312/AzureCheckLists/security/advisories/new)** for this repository. This is the preferred and only supported channel for security disclosures.

When reporting, please include:

- A description of the vulnerability
- Steps to reproduce (if applicable)
- Impact assessment
- A suggested fix (if available)

### Response Timeline

- We will acknowledge receipt within 5 business days.
- We will provide an initial triage assessment within 10 business days.
- We will work with you on a coordinated disclosure timeline based on severity.

### Responsible Disclosure

- **Do not** publicly disclose the vulnerability before a fix is released.
- **Do** allow reasonable time for a response and fix to be developed.
- **Do** work with maintainers to ensure the fix is comprehensive.

---

## Security Architecture

### Authentication & Authorization

- **Microsoft Entra ID** — Inter-service authentication uses Managed Identity where possible.
- **GitHub OAuth** — Optional public-facing sign-in, controlled by the `NEXT_PUBLIC_ENABLE_GITHUB_AUTH` environment variable.
- **RBAC** — The `admin` custom role is required for `/admin/*` routes and `/api/admin*` APIs and must be assigned explicitly per user in the Azure Static Web App.
- **Secrets Management** — Application secrets are stored as Azure Static Web App and Function App configuration. See `README.md` for the full list of expected settings.

### Data Protection

- **In transit** — TLS terminated at the Azure Static Web Apps edge.
- **At rest** — Azure Storage encryption is enabled by default for blob, table, and queue services used by the backend.
- **Audit Trails** — Append-only Azure Table Storage entries record reviewer decisions and key state changes.

### Input Validation

- **File uploads** — Type and size validation at the API boundary.
- **API inputs** — Validated at function entry points before being passed to downstream services.

### Network Security

- **Static Web App** — Hosted on the global Azure CDN with built-in WAF.
- **Function App** — Linked to the Static Web App; route-level role enforcement via `staticwebapp.config.json`.
- **CORS** — Restrictive by default; only the linked Static Web App origin is allowed.

---

## Compliance & Standards Followed

- **WCAG 2.1 AA** — Accessibility target for the UI.
- **OWASP Top 10** — Reviewed during development.
- **Azure Security Benchmark** — Cloud security best practices.

---

## Security Best Practices for Operators

1. **Assign the `admin` role carefully.** Only grant admin access to trusted users.
2. **Rotate Function App and OpenAI keys regularly.**
3. **Enable Microsoft Entra ID MFA** for all admin accounts.
4. **Set Azure budget alerts** to catch unusual usage patterns.
5. **Monitor Application Insights** for anomalies and error spikes.

## Security Best Practices for Contributors

1. **Never commit secrets.** Use environment variables and respect `.gitignore`.
2. **Prefer Managed Identity** for Azure-to-Azure authentication.
3. **Sanitize and validate user inputs** at every API boundary.
4. **Run `npm audit`** before opening a PR; resolve high-severity issues.
5. **Report vulnerabilities through the private reporting channel above** — never in a public issue.

---

## Third-Party Dependencies

- **npm registry** — Verified via the lockfile (`package-lock.json`).
- **Azure SDKs** — Microsoft-maintained.
- **GitHub Dependabot alerts** — Recommended to enable on the repository.

---

## Additional Resources

- **Azure Security Best Practices:** <https://learn.microsoft.com/azure/security/>
- **OWASP Top 10:** <https://owasp.org/www-project-top-ten/>
- **GitHub Private Vulnerability Reporting:** <https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability>

---

**Last Updated:** 2026-04-29
