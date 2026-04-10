# ARB Microsoft Reference Catalog Structure

Last updated: April 10, 2026

## Purpose

Define how curated Microsoft references should be organized for grounding ARB findings.

## Catalog Principles

1. References should be curated, not open-ended web noise.
2. References should map to services, review domains, and common findings.
3. References should be versionable and reviewable by admins.

## Reference Record Fields

- referenceId
- title
- url
- sourceType
- serviceTags
- domainTags
- guidanceType
- summary
- active
- lastReviewedAt

## Source Types

- Microsoft Learn
- Azure Architecture Center
- Azure Well-Architected Framework
- Cloud Adoption Framework
- Service Documentation

## Guidance Types

- Best Practice
- Reference Architecture
- Security Guidance
- Reliability Guidance
- Cost Guidance
- Governance Guidance
- Operations Guidance

## Example Tags

### Service Tags
- App Service
- AKS
- API Management
- Key Vault
- Storage
- VNets
- Azure Firewall

### Domain Tags
- Security
- Reliability And Resilience
- Operational Excellence
- Cost Optimization
- Governance / Platform Alignment
- Performance Efficiency

## Example JSON

```json
{
  "referenceId": "ref-001",
  "title": "Azure Well-Architected Framework",
  "url": "https://learn.microsoft.com/azure/well-architected/",
  "sourceType": "Azure Well-Architected Framework",
  "serviceTags": ["App Service", "Key Vault"],
  "domainTags": ["Security", "Operational Excellence"],
  "guidanceType": "Best Practice",
  "summary": "General design guidance mapped to core architecture quality domains.",
  "active": true,
  "lastReviewedAt": "2026-04-10"
}
```

## Mapping Rules

- each rule should map to one or more candidate references
- each finding should include at least one relevant reference where available
- references should be selectable by service tag and domain tag

## MVP Recommendation

For MVP:
- curate a small but high-quality set of Microsoft references
- map them to the first 10 to 15 deterministic rules
- keep catalog reviewable in admin controls
