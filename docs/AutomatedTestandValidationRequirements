# Prompt: Audit, redesign, implement, and validate Azure Review Assistant

You are a senior product delivery team:
- Senior Product Designer
- Senior Full Stack Engineer
- Senior Azure Architect
- Senior QA Automation Engineer
- Senior Accessibility Engineer

## Goal

Audit the current site, redesign the product structure, implement the core changes, and add automated browser-based validation.

Prioritize shipping the core user journeys first.

Website:
`https://jolly-sea-014792b10.6.azurestaticapps.net/`

---

## Product purpose

This product is **Azure Review Assistant**.

It has two hero features:

### 1. Board Review
Users upload SOWs, design docs, and architecture docs.
The product reviews them against Microsoft best practices and produces board-ready findings in minutes.

Review scope includes:
- WAF
- CAF
- ALZ
- HA/DR
- Backup
- Security
- Networking
- Monitoring
- Governance

Outputs include:
- findings
- gaps
- recommendations
- evidence
- Microsoft reference links
- export-ready review pack
- weighted score and sign-off flow for ARB-grade review

### 2. Service Explorer
Users browse Azure services and get instant best-practice findings, region-fit context, risks, and Microsoft reference links.

This must work clearly even before sign-in.

---

## Core problems to fix

The current site is not serving its purpose well enough.

Main issues:
- confusing navigation
- too much text before action
- core value is buried
- Board Review is not the obvious first action
- Standard Review and ARB-grade Board Review are not clearly separated
- public pages and authenticated workspace pages are mixed together
- CTA labels are inconsistent
- trust is weakened by bad Azure region naming in pricing examples
- too much visual noise on primary screens

This redesign must fix the product architecture, not just the styling.

---

## Non-negotiable rules

### Anonymous primary navigation must contain only:
- Board Review
- Service Explorer

### These must not appear in anonymous primary nav:
- My Reviews
- Data Health
- How It Works
- Admin
- Decision Center
- Review Workspace
- Dashboard

Move those into the signed-in app shell, footer, or secondary navigation.

### Homepage above the fold must contain only:
- one strong headline
- one short supporting sentence
- one primary CTA for Board Review
- one secondary CTA for Service Explorer
- one real upload entry point or upload button

Use this direction:
- Headline: **Upload your Azure design docs. Get board-ready review findings in minutes.**
- Supporting text: **Review your architecture against WAF, CAF, ALZ, HA/DR, security, networking, backup, monitoring, and governance with evidence-backed findings and Microsoft references.**
- Primary CTA: **Start Board Review**
- Secondary CTA: **Explore Azure Services**

### CTA system must use only:
- Start Board Review
- Upload Documents
- Run Review
- View Findings
- Export Review
- Explore Azure Services
- Add to Review Workspace
- Open Saved Review

Do not use old labels such as:
- Open upload workspace
- Create review workspace
- Start project review
- Open scoped pricing review

### Board Review flow must be:
1. Start Board Review
2. Upload Documents
3. Choose review depth
4. Configure scope
5. Run Review
6. View Findings
7. Export or Save
8. Human Sign-off for ARB-grade flow

### Review modes must be clearly distinct

#### Standard Review
- quick scoping
- fast findings
- summary
- recommendations
- export

#### ARB-grade Board Review
- weighted score
- evidence-backed controls
- decision state
- reviewer metadata
- timestamp
- comments
- sign-off gate

Allowed ARB decision states must be exactly:
- Approved
- Needs Revision
- Rejected

### Service Explorer rules
For anonymous users, CTA must be:
- **View Findings**

For signed-in users, CTA must be:
- **Add to Review Workspace**

Service Explorer must clearly show:
- findings
- severity
- confidence
- region-fit
- source links
- freshness metadata where relevant

### Trust rules
Must fix:
- invalid Azure region names
- wrong pricing region mappings
- inconsistent severity labels
- inconsistent confidence labels
- unclear external links
- missing freshness timestamps where needed

Do not use fake or fake-looking Azure values.

---

## Technical constraints

Keep the architecture practical for a public internet-facing Azure application.

Use simple Azure services such as:
- Azure Static Web Apps
- Azure Functions
- Microsoft Entra ID
- Azure Monitor / Application Insights
- Key Vault only if needed
- Storage or database for persisted review state if needed

Do not recommend private endpoints.

---

## Design direction

The site should feel:
- clear
- minimal
- action-first
- trustworthy
- polished

Use:
- clean white or neutral background
- high contrast
- strong spacing
- clear hierarchy
- consistent typography
- fewer competing cards and badges

Avoid:
- dashboard-style homepage
- muddy dark palette
- brochure-style copy
- too many chips, pills, or framework tags above the fold
- auth-only concepts on anonymous entry screens

---

## Delivery phases

### Phase 1: Audit current state
Audit the current site and identify:
- information architecture issues
- navigation issues
- homepage issues
- Board Review flow issues
- Service Explorer issues
- trust and Azure-data credibility issues
- content and microcopy issues
- accessibility issues
- testing gaps
- technical risks

### Phase 2: Propose the new structure
Propose:
- new sitemap
- anonymous navigation
- signed-in app shell
- homepage structure
- Board Review flow
- Standard Review vs ARB-grade Board Review separation
- Service Explorer flow
- page-by-page content structure
- component model

### Phase 3: Implement the redesign
Implement:
- routing cleanup
- anonymous nav cleanup
- signed-in app shell
- homepage rebuild
- Board Review entry flow
- Service Explorer cleanup
- CTA cleanup
- trust and freshness labels
- Azure region validation logic
- pricing card correction logic
- loading, empty, and error states
- accessibility fixes
- stable test IDs for automation

### Phase 4: Add automated validation
Implement:
- Playwright end-to-end tests
- axe-core accessibility checks
- visual regression testing
- responsive breakpoint testing
- Azure region validation tests
- CTA consistency tests
- CI release gates

### Phase 5: Final report
Return:
- changed structure
- changed components
- changed flows
- test coverage
- known gaps
- risks
- acceptance status

---

## Must-have vs should-have

### Must-have
- anonymous nav = Board Review and Service Explorer only
- homepage hero rebuilt around one primary action cluster
- Board Review reachable in one click
- Standard Review and ARB-grade Board Review clearly separated
- invalid Azure regions removed
- pricing region trust issues fixed
- CTA language standardized
- public site and signed-in workspace clearly separated
- Playwright coverage for homepage, Board Review, Service Explorer, and core nav
- accessibility checks for core journeys
- visual baselines for primary pages
- CI blocks broken core UX and trust regressions

### Should-have
- stronger sign-off UX polish
- improved admin and secondary pages
- richer evidence display
- extended visual regression coverage for low-priority pages
- additional responsive polish beyond core flows

---

## Automated validation requirements

Use:
- Playwright
- axe-core
- visual regression testing
- responsive viewport testing
- CI validation

### Browser tests must cover:
- homepage
- Board Review entry flow
- Standard Review flow
- ARB-grade Board Review flow
- Service Explorer
- signed-in workspace
- My Reviews
- Decision Center
- export flows
- error states
- empty states
- loading states

### Tests must validate:
- homepage hero structure is correct
- anonymous nav shows only Board Review and Service Explorer
- Board Review opens in one click
- upload flow works
- review mode selection works
- Standard and ARB-grade flows are distinct
- ARB decision states are exactly Approved, Needs Revision, Rejected
- Service Explorer anonymous CTA is View Findings
- Service Explorer signed-in CTA is Add to Review Workspace
- Azure region names come only from approved values
- pricing cards do not show invalid regions
- external links are marked correctly
- accessibility checks pass on core pages
- visual baselines protect layout, spacing, typography, and look and feel
- UI regressions fail CI

### Visual regression must cover:
- homepage
- Board Review entry page
- Standard Review page
- ARB-grade Board Review page
- Service Explorer list
- Service detail page
- signed-in workspace
- findings page
- export preview or summary page
- error states
- empty states

### Viewports:
- desktop
- laptop
- tablet
- mobile

---

## Anti-patterns to avoid

- do not keep old and new labels in parallel
- do not keep duplicate navigation systems
- do not create a dashboard-style homepage
- do not bury Board Review behind setup steps
- do not show auth-only concepts on anonymous entry screens
- do not use fake Azure values
- do not keep repetitive trust messaging on multiple screens
- do not overload the hero area with chips, metrics, or extra banners

---

## Output format

Return your work in this exact order:

1. Current-state audit
2. Proposed sitemap
3. Anonymous nav and signed-in app shell
4. Homepage structure and copy
5. Board Review flow
6. Standard Review vs ARB-grade Board Review differences
7. Service Explorer flow
8. Component changes
9. Technical implementation plan
10. Automated test plan
11. Prioritized backlog
12. Risks and open issues
13. Acceptance criteria status

---

## Priority order

### P0
- fix homepage clarity
- make Board Review the first obvious action
- reduce anonymous nav to 2 items
- fix bad Azure regions and pricing trust issues
- standardize CTA labels
- separate Standard vs ARB-grade Board Review clearly
- add Playwright coverage for homepage, Board Review, Service Explorer, and nav
- add Azure region validation tests
- add accessibility checks
- add visual baselines for core pages

### P1
- separate public site and signed-in workspace
- improve Service Explorer clarity
- improve trust and freshness metadata
- improve auth-aware flows
- add responsive layout validation
- add export validation

### P2
- polish visuals
- improve admin and secondary pages
- improve evidence display
- strengthen sign-off UX

---

## Success criteria

The work is done only if:
1. users understand the first action within 5 seconds
2. homepage clearly presents the two hero features
3. Board Review is reachable in one click
4. Service Explorer is clear and useful
5. invalid Azure regions no longer appear
6. Standard and ARB-grade Board Review are clearly different
7. public and signed-in experiences are clearly separated
8. CTA language is consistent
9. trust signals are clear and not repetitive
10. critical journeys are covered by automated browser tests
11. visual regressions protect typography, spacing, and layout
12. accessibility passes on core pages
13. CI blocks broken UX, trust, or functional regressions

Now:
- audit the current implementation
- propose the new structure
- implement the redesign
- add automated browser tests
- add visual and accessibility validation
- return the deliverables in the exact output format above