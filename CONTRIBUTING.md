# Contributing to the Azure Review Dashboard

Thank you for your interest in contributing. This document covers how to set up your environment, propose changes, and uphold the project's quality standards.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Testing Requirements](#testing-requirements)
5. [Commit Conventions](#commit-conventions)
6. [Pull Request Process](#pull-request-process)
7. [Issue Reporting](#issue-reporting)

---

## Getting Started

### Fork & Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/AzureCheckLists.git
cd AzureCheckLists

# Track upstream
git remote add upstream https://github.com/upendra25312/AzureCheckLists.git
```

### Set Up Local Development

```bash
npm install
npm run dev
# Frontend runs on http://localhost:3000

# Optional: Start the backend (Azure Functions)
cd api && npm install && func start
# Backend runs on http://localhost:7071
```

For the full setup walkthrough, see the [`README.md`](./README.md) "Local setup" section. A condensed quickstart is also available at [`deliverables/engineering/QUICKSTART.md`](./deliverables/engineering/QUICKSTART.md).

---

## Development Workflow

### 1. Create a Feature Branch

Use one of these naming conventions:

```bash
# Feature work
git checkout -b feature/short-descriptive-name

# Bug fixes
git checkout -b bugfix/short-descriptive-name

# Documentation only
git checkout -b docs/short-descriptive-name
```

Do not commit directly to `main`. Open a pull request for review.

### 2. Keep Your Branch Up to Date

```bash
git fetch upstream
git rebase upstream/main
```

### 3. Validate Locally Before Pushing

At minimum:

```bash
npm run build           # must succeed end to end
npm run test:api        # backend lifecycle tests
```

For UI-affecting changes, also run the relevant Playwright suite — see the `test:e2e:*` scripts in `package.json`.

---

## Code Standards

- **TypeScript strict mode.** Do not introduce `any` without a written justification in the diff.
- **No new top-level dependencies** without discussion in the PR. Cost, bundle size, and license must be considered.
- **No secrets in code.** Use environment variables; respect the existing `.gitignore`.
- **Keep `staticwebapp.config.json` minimal.** Route and role changes have production security impact.
- **Match the existing code style.** When in doubt, mirror neighboring files.

---

## Testing Requirements

- **Backend changes** must include or update tests under `api/`. Run `npm run test:api`.
- **Frontend behavior changes** should include Playwright coverage where practical (`tests/e2e/*.spec.ts`).
- **Build must succeed.** `npm run build` is the minimum bar for any PR.

The most reliable local Playwright path tests the exported site rather than `next dev`. See the README for the full instructions.

---

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/). Examples:

```
feat: add cost-model panel to scorecard
fix: handle empty findings array in export
docs: clarify admin role assignment in README
chore: bump @playwright/test to 1.59.2
```

Commits should be small, focused, and individually reviewable. Squash-merging is the default.

---

## Pull Request Process

1. **Open a draft PR early** if the change is non-trivial.
2. **Link related issues** in the PR description.
3. **Describe the change and the rationale**, not just the files touched.
4. **Confirm `npm run build` passes locally** and screenshots/recordings are attached for UI changes.
5. **Request review** from a maintainer. Address feedback in additional commits; don't force-push during review.
6. **Maintainers squash and merge** once approved and CI is green.

---

## Issue Reporting

- **Bugs:** Use the GitHub Issues template. Include reproduction steps, expected vs. actual behavior, and environment details.
- **Feature requests:** Open a Discussion or Issue with the use case and the value to the project.
- **Security vulnerabilities:** Do **not** open a public issue. See [`SECURITY.md`](./SECURITY.md).

---

**Last Updated:** 2026-04-29
