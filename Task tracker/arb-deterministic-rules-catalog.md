# ARB Deterministic Rules Catalog

Last updated: April 10, 2026

## Purpose

Define the first-pass deterministic rules catalog for the AI-assisted Architecture Review Board workflow.

## Why Rules First

Rules should catch hard failures and explicit requirement mismatches before AI narrative synthesis. This improves trust and reduces vague findings.

## Rule Object Fields

- ruleId
- title
- domain
- severity
- blockerFlag
- triggerCondition
- expectedEvidence
- failureMessage
- recommendation
- MicrosoftReference

## Initial Rule Categories

### 1. Region And Residency Rules

#### Rule: `REG-001`
Title: Customer residency requirement conflicts with selected regions
- Domain: Requirements Coverage
- Severity: Critical
- Blocker: Yes
- Trigger: requirement specifies limited geography and design evidence shows out-of-policy region
- Expected evidence: requirements + region design facts

#### Rule: `REG-002`
Title: DR region missing where resilience requirement exists
- Domain: Reliability And Resilience
- Severity: High
- Blocker: No

### 2. Identity And Access Rules

#### Rule: `IAM-001`
Title: No explicit identity model defined
- Domain: Security
- Severity: Critical
- Blocker: Yes

#### Rule: `IAM-002`
Title: Secrets usage described without secure secret-management pattern
- Domain: Security
- Severity: High
- Blocker: No

### 3. Network And Exposure Rules

#### Rule: `NET-001`
Title: Internet-facing design lacks explicit boundary control
- Domain: Security
- Severity: Critical
- Blocker: Yes

#### Rule: `NET-002`
Title: Private connectivity requirement not matched by private access design
- Domain: Security
- Severity: High
- Blocker: No

### 4. Reliability And DR Rules

#### Rule: `REL-001`
Title: Production workload has no backup strategy
- Domain: Reliability And Resilience
- Severity: Critical
- Blocker: Yes

#### Rule: `REL-002`
Title: RTO/RPO requirement exists but no recovery pattern is defined
- Domain: Reliability And Resilience
- Severity: High
- Blocker: No

### 5. Operations Rules

#### Rule: `OPS-001`
Title: No monitoring or observability approach defined for production workload
- Domain: Operational Excellence
- Severity: High
- Blocker: No

#### Rule: `OPS-002`
Title: No support or runbook ownership defined
- Domain: Operational Excellence
- Severity: Medium
- Blocker: No

### 6. Governance Rules

#### Rule: `GOV-001`
Title: No landing zone / subscription / governance alignment described
- Domain: Governance / Platform Alignment
- Severity: High
- Blocker: No

#### Rule: `GOV-002`
Title: Compliance requirement exists but no corresponding control narrative is present
- Domain: Governance / Platform Alignment
- Severity: High
- Blocker: No

### 7. Cost Rules

#### Rule: `COST-001`
Title: Cost-sensitive workload has no assumptions or cost controls documented
- Domain: Cost Optimization
- Severity: Medium
- Blocker: No

#### Rule: `COST-002`
Title: Sizing or commercial claim made without evidence or assumptions note
- Domain: Cost Optimization
- Severity: Medium
- Blocker: No

### 8. Documentation Rules

#### Rule: `DOC-001`
Title: Required design inputs missing from package
- Domain: Documentation Completeness
- Severity: High
- Blocker: Depends on missing artifact

#### Rule: `DOC-002`
Title: Evidence too weak for fair review
- Domain: Documentation Completeness
- Severity: Critical
- Blocker: Yes

## Rule Execution Behavior

- rules run after requirement extraction and evidence normalization
- rule hits produce structured findings or missing-evidence findings
- blocker rules can override numeric score
- low-confidence extractions should reduce certainty and may suppress hard failures unless evidence is clear

## MVP Recommendation

For MVP:
- implement 10 to 15 high-value rules only
- prefer high-precision rules over broad low-confidence rules
- store rule version and hit count for auditability
