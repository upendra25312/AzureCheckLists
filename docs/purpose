The two hero features (what actually matters)
1. Upload your design docs → AI checks everything → board-ready findings in minutes
This is the core value proposition. No one else does this. Upload your SOW or architecture design, get WAF + CAF + ALZ + HA/DR + Security + Networking findings, all grounded in live Microsoft Learn docs.

2. Azure service scoping → instant WAF findings for any service stack
Browse 100+ Azure services, pick your stack, get immediate best-practice findings with links — no AI needed, works without sign-in.

Honest assessment: Is the website serving its purpose?
No. Not at all right now. Here's why:

Problem	Reality
Confusing navigation	"ARB Review", "Decision Center", "Services", "Dashboard" — a new user has no idea what to click
Text-heavy, no clarity	Every page opens with 3–4 paragraphs of explanation before any action
The hero feature is buried	The "upload docs → AI review" flow requires 4 clicks just to find the form
Noise everywhere	Metrics, pills, framework tags, score cards, workflow states — all visible at once
The ARB page was a marketing brochure	Information about what you can do, not a UI that lets you do it
Standard review is disconnected	It looks like a separate product — users don't understand the two modes
Why it's not at the level of Google / Microsoft / AWS
Those products follow one rule: show one thing, do one thing per screen.

Your homepage tries to explain the entire product. Azure Portal shows you a search bar and your resources. That's it. The action IS the page.

What needs to change — a clean redesign
The fix is architectural, not cosmetic. It needs:

Homepage — One headline, one CTA, one input. "Upload your architecture docs and get an AI review." Done.
ARB page — Open directly to the create-review form. No intro text.
Navigation — Two items only: "AI Review" and "Service Explorer"
Visual design — Clean white/neutral background, high contrast, Microsoft Fluent-inspired typography, no dark muddy palette
Remove all walls of text — Replace with icons + short labels
Do you want me to do a full UI/UX redesign of the homepage and ARB flow right now — clean, minimal, action-first? I'll rebuild it properly from the ground up, Microsoft/Google standard quality.

Purpose
Azure Review Assistant is an AI-powered platform that automates the architecture review process for Azure cloud projects. It replaces manual, fragmented review work (spreadsheets, checklists, emails) with a structured, evidence-based workflow.

Who Uses It
User	Why They Use It
Azure Architects	Structured WAF/CAF/ALZ review in minutes, not days
ARB Members	Upload SOW/design docs → AI reviews against all frameworks → scorecard + findings ready for the board
Pre-Sales Architects	Quick scoping before committing to a full design
Cloud Engineers	Self-service checklist before presenting to leadership
Directors / Senior Leadership	Executive summary + recommendation (Approved / Needs Revision) without reading 100-page docs
USP (What Makes It Unique)
AI reviews your actual documents — Upload your SOW or design doc; the agent reads it and finds real gaps, not generic advice
Covers ALL Microsoft frameworks in one pass — WAF (5 pillars) + CAF (6 phases) + ALZ + HA/DR + Backup + Security + Networking + Monitoring in a single review
Grounded in live Microsoft Learn docs — Uses the Microsoft Learn MCP server to check current best practices at review time, not stale training data
Two review modes — Quick scoping (standard) and full ARB-grade (document evidence + weighted scorecard + human sign-off)
Traceable findings — Every finding references the specific framework principle and a learn.microsoft.com URL — not just "add redundancy"
Value It Delivers
Without It	With It
ARB review takes 2–3 days of manual work	Agent review completes in minutes
Findings live in emails and spreadsheets	Everything in one place, exportable as CSV / HTML / Markdown
Reviewer may miss ALZ or HA/DR checks	All 11 framework areas checked every single time
Output needs to be reformatted for each audience	Export as executive summary, action list, or full ARB pack
7-day file retention managed manually	Auto-deleted, no data hoarding risk
Why Someone Would Use It Over Alternatives
vs. Azure Advisor — Advisor only analyses your deployed resources; this reviews your design documents before deployment
vs. WAF Assessment tool — That's a questionnaire you fill in yourself; this reads your docs and finds gaps for you
vs. a consultant — Faster, cheaper, available 24/7, consistent quality every time, doesn't miss checklist items
vs. a generic GPT chat — Purpose-built prompt covering every Microsoft framework, MCP-grounded in live docs, structured scorecard output, saved in your account
In short: it's an AI ARB member that never sleeps, never misses a checklist item, and hands you a board-ready pack in minutes.

UI Mockup Review Findings (April 12, 2026)
Scope: Compared this purpose document against docs/target-desired-ui-mockup.html using an architecture leadership and cloud UX review lens.

Findings by severity

High
1. Homepage overload and cognitive noise
- Too many concurrent blocks on first screen (hero input, multiple chips, persona strip, differentiator strip, steps, metrics, sign-in banner).
- Risk: Violates the action-first principle and delays time-to-first-action.

2. Pseudo-input pattern is misleading
- Hero shows a read-only input-like field instead of a real interactive control.
- Risk: Users can perceive the product as non-functional or unclear.

3. Standard vs ARB mode separation is weak
- Mode toggle exists, but workflow differences are not strongly reflected in required steps and decision controls.
- Risk: Users still perceive both modes as the same flow.

4. Sign-in mock uses a prefilled password
- Even in mockups, this feels insecure and non-enterprise.
- Risk: Reduces trust for architects and directors.

Medium
5. Service Explorer action ambiguity
- "No sign-in required" appears, but CTA "Add to review" implies account-backed persistence.
- Risk: Unclear expectation about anonymous vs authenticated actions.

6. Framework coverage panel lacks completion semantics
- Framework chips are visible, but no clear pass/fail/coverage status.
- Risk: Hard to validate the claim of full one-pass framework checks.

7. ARB sign-off semantics under-specified
- "Human sign-off required" appears, but no explicit decision state model (Approved/Needs Revision/Rejected), reviewer identity, or checkpoint metadata.

8. Trust and retention message duplication
- Similar policy and sign-in guidance appears in multiple locations.
- Risk: Scanning fatigue and reduced clarity.

Low
9. External source links are not clearly marked
- Links open externally without explicit indicator.

10. Primary action labels vary across screens
- "Open upload workspace", "Run review", and "Start AI Review" dilute one-flow clarity.

Recommendations (priority order)

P0 - Must fix before stakeholder demo
1. Reduce homepage to one dominant action cluster
- Keep: headline + single primary CTA + one real input affordance + single supporting line.
- Move persona chips, differentiator strip, and metrics below the fold or into a secondary section.

2. Replace read-only hero input with real affordance
- Option A: true upload trigger input.
- Option B: clear non-input card label (not styled like text input) to avoid false affordance.

3. Make mode behavior explicit
- Standard mode: quick findings and export path.
- ARB mode: show weighted scorecard, reviewer checkpoint, decision status, and sign-off gating.

4. Remove prefilled password from sign-in mock
- Keep empty password field and add concise note: "Mock sign-in flow for prototype".

P1 - Strongly recommended
5. Clarify anonymous vs authenticated actions in Service Explorer
- For anonymous users: "View instant findings".
- For signed-in users: "Add to review workspace".

6. Add framework completion state
- Display per-framework status (Complete, Partial, Not Applicable) and aggregate completion percentage.

7. Formalize decision model for ARB
- Show explicit decision states: Approved, Needs Revision, Rejected.
- Include reviewer name/role and timestamp fields in the sign-off block.

8. Consolidate trust messaging
- Keep one primary retention notice and one trust panel; remove repeats.

P2 - Nice to have
9. Add external-link indicators for source references
- Example: "Source (opens in new tab)".

10. Normalize primary CTA language
- Use one verb pattern everywhere, for example: "Start Review".

Target outcome after fixes
1. First action understandable in under 5 seconds.
2. Clear distinction between Standard and ARB modes.
3. Trust signals are explicit but non-redundant.
4. Product claims (framework breadth, traceability, sign-off discipline) are visibly verifiable in UI.