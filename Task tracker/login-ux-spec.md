# Login UX Specification

Last updated: April 4, 2026

## Purpose

This specification defines the two login experiences needed for the Azure Checklists website:

1. `Public login`
2. `Admin login`

These should use the same Microsoft Entra sign-in system, but they serve different users, different permissions, and different outcomes.

## Public Login

### Audience

- Sales Architect
- Pre-sales Architect
- Cloud Architect
- Cloud Engineer
- Other normal project-review users

### Purpose

Public login exists to help users save and reuse project-review work. It should not feel like a platform-administration feature.

### What public users should be able to do after sign-in

- save project-review notes to Azure
- reload earlier project-review work
- export project-specific review artifacts
- keep saved work tied to their signed-in identity

### What public users should not see

- admin diagnostics
- platform configuration
- Azure resource inventory
- admin copilot features

### Public login trigger points

Public users should not be forced to sign in just to browse the site.

Prompt for sign-in only when the user attempts to:

- save to Azure
- load from Azure
- download cloud-backed exports
- access future `My Project Reviews` functionality

### Public login screen copy

**Title**

```text
Sign in to save and reuse your project reviews
```

**Body**

```text
Sign in with Microsoft Entra ID to save project-specific review notes, reload earlier work, and export structured review artifacts from Azure.
```

**Primary CTA**

```text
Sign in with Microsoft
```

**Secondary CTA**

```text
Continue without sign-in
```

**Support note**

```text
You can still explore services and review checklists without signing in. Sign in only when you want Azure-backed save and export.
```

### Public post-login behavior

After a successful sign-in:

- return the user to the same page they came from
- show a visible signed-in state
- show actions like:
  - `Load from Azure`
  - `Save to Azure`
  - `Download CSV`
  - `Sign out`

### Public UX guidance

- Do not block browsing behind sign-in.
- Do not make users think they need admin permissions.
- Keep the wording focused on saving, resuming, and exporting project reviews.

## Admin Login

### Audience

- Internal platform administrators
- Cloud operations or support owners
- Engineering owners of the website
- Authorized internal technical administrators

### Purpose

Admin login exists to protect internal platform and diagnostic capabilities.

### What admin users should be able to do after sign-in

- access `/admin/copilot`
- inspect Azure resources supporting the website
- verify Function App configuration
- check Azure OpenAI deployment health
- inspect monitoring and diagnostics
- use approved internal admin copilot tools

### What admin login is not for

- regular project-review users
- customer-facing review work
- public save and export flows

### Admin login trigger points

Prompt for admin sign-in when the user attempts to:

- open `/admin/copilot`
- call `/api/admin/*`
- use any admin-only diagnostics or platform features

### Admin login screen copy

**Title**

```text
Admin access required
```

**Body**

```text
This area is for internal administrators who manage the Azure Review Board platform, diagnostics, and operational tooling.
```

**Primary CTA**

```text
Sign in as admin
```

**Secondary CTA**

```text
Back to main site
```

### Access denied screen

If the user is signed in but does not have the `admin` role:

**Title**

```text
You are signed in, but you do not have admin access
```

**Body**

```text
Your account can use the project review features, but this admin area is restricted to internal platform administrators.
```

**Actions**

- `Go to Project Review`
- `Sign out`

### Admin UX guidance

- Make the admin boundary obvious.
- Explain that this area is for internal platform management.
- Do not mix admin actions into the normal project-review workflow.

## Role Model

The recommended access model is:

- `Anonymous`
  - browse public content
  - review services and checklists
  - start project review locally
- `Authenticated user`
  - all anonymous capabilities
  - save and load project reviews
  - export cloud-backed project artifacts
- `Admin`
  - all authenticated-user capabilities
  - access `/admin/copilot`
  - access `/api/admin/*`
  - access internal diagnostics

## Route Guidance

### Public routes

- `/`
- `/services`
- `/services/[slug]`
- `/review-package`
- `/explorer`

These should remain publicly accessible.

### Sign-in gated actions

- save to Azure
- load from Azure
- cloud-backed exports

### Admin-only routes

- `/admin/copilot`
- `/api/admin/*`

These should require the `admin` role through Static Web Apps route protection.

## User Flows

### Public user flow

1. Browse the site without signing in.
2. Start a project review.
3. Add services and notes.
4. Click save or load.
5. Sign in if needed.
6. Return to the same page and continue working.

### Admin user flow

1. Open `/admin/copilot`.
2. Sign in with Microsoft Entra ID.
3. If the account has the `admin` role, continue into admin workspace.
4. If the account lacks the role, show access denied and provide navigation back to the public workflow.

## Design Principles

- Keep the public experience open and low-friction.
- Keep the admin experience clearly separated and protected.
- Use the same identity provider, but different role-based outcomes.
- Keep the wording simple enough that users understand why they are signing in.

## Recommended Next Activities

1. Add `staticwebapp.config.json` with admin route protection.
2. Improve the public sign-in entry experience around save and export.
3. Add an explicit signed-in state on the project-review page.
4. Add the `/admin/copilot` route and access-denied state.
5. Assign internal users to the `admin` role in Static Web Apps.
