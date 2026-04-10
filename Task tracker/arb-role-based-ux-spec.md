# ARB Role-Based UX Specification

Last updated: April 10, 2026

## Purpose

Define the role-based UX expectations for the AI-assisted Architecture Review Board capability.

## Roles

- Architect
- Reviewer / ARB Member
- Project Manager
- Read-only Stakeholder
- Admin

## Role Goals

### Architect

Primary goals:
- upload review package
- validate extracted requirements
- inspect evidence mapping
- review findings
- respond to actions and resubmit

### Reviewer / ARB Member

Primary goals:
- inspect findings and evidence
- validate score and recommendation
- add reviewer rationale
- record approval decision

### Project Manager

Primary goals:
- track workflow state
- assign owners and due dates
- monitor blockers and action closure
- drive re-review readiness

### Read-only Stakeholder

Primary goals:
- view summary, score, findings, and final decision
- understand blockers and next actions

### Admin

Primary goals:
- manage scoring weights
- manage rule packs and curated references
- manage system diagnostics and audit visibility

## Access Matrix

| Capability | Architect | Reviewer | PM | Read-only | Admin |
|---|---:|---:|---:|---:|---:|
| Create review package | Yes | No | Optional | No | Yes |
| Upload files | Yes | No | Optional | No | Yes |
| Edit extracted requirements | Yes | Optional | No | No | Yes |
| View evidence mapping | Yes | Yes | Yes | Limited | Yes |
| View findings | Yes | Yes | Yes | Yes | Yes |
| Edit finding owner / due date | Limited | Yes | Yes | No | Yes |
| Set approval decision | No | Yes | No | No | Yes |
| Override recommendation with rationale | No | Yes | No | No | Yes |
| Change scoring weights | No | No | No | No | Yes |
| View audit trail | Limited | Yes | Yes | No | Yes |

## UX Rules By Role

### Architect View

Focus on:
- package completeness
- requirement extraction review
- evidence and findings
- remediation actions

Hide or minimize:
- admin controls
- scoring weight internals
- reviewer-only sign-off controls

### Reviewer View

Focus on:
- findings with evidence
- score rationale
- critical blockers
- recommendation override
- final decision controls

### PM View

Focus on:
- owner
- due date
- status
- overdue items
- workflow state
- re-review required

### Read-only View

Focus on:
- summary
- final score
- final decision
- key blockers
- key actions

### Admin View

Focus on:
- rule packs
- scoring config
- curated Microsoft references
- diagnostics
- audit logs

## Screen Behavior Requirements

### Findings Screen

- architects see findings and action creation context
- reviewers see sign-off controls and override rationale field
- PMs see owner and due date controls prominently
- read-only users cannot modify data

### Scorecard Screen

- all roles can view domain scores if permitted to view review
- only reviewers and admins can set recommendation override

### Decision Center

- reviewer and admin only for final decision actions
- architects can view but not finalize
- PM can view decision and conditions but not approve

## Navigation Rules

- architects land in Review Workspace or active review
- reviewers land in Decision Center or pending review queue
- PMs land in My Reviews / action queue
- admins land in Admin or diagnostics area

## MVP Recommendation

For MVP:
- implement role-aware visibility and action control
- do not over-customize every page per role
- prioritize differences on Findings, Scorecard, Decision Center, and My Reviews
