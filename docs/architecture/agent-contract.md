# ARB Agent Contract

This contract defines the review-agent surface for Azure Review Assistant. The agent drafts findings; a human reviewer owns the decision.

## Runtime Position

- Primary runtime: Azure AI Foundry-compatible agent or chat completion endpoint.
- Tool plane: Microsoft Learn/MCP grounding and Azure data sources where enabled.
- UI owner: ARB review workspace.
- Decision owner: human reviewer.

## Inputs

```ts
type ArbAgentInput = {
  contractVersion: "2026-05-03";
  reviewId: string;
  promptVersion: string;
  model: {
    provider: "azure-openai" | "azure-ai-foundry";
    deployment: string;
    apiVersion: string;
  };
  reviewMetadata: {
    title: string;
    targetCloud: "Azure";
    targetRegions: string[];
    businessCriticality: "low" | "medium" | "high" | "mission-critical";
    reviewerMode: "draft" | "calibration" | "board-ready";
  };
  uploadedEvidence: EvidenceItem[];
  checklistContext: ChecklistFinding[];
  retrievalBundle: {
    bundleId: string;
    contentHash: string;
    sources: RetrievalSource[];
  };
};
```

## Retrieval Trust Order

1. Customer-uploaded evidence.
2. Internal Azure checklist catalog.
3. Microsoft Learn grounding.
4. Model parametric knowledge.

The agent must not override uploaded evidence with parametric knowledge. If sources conflict, the output must flag the conflict and ask for reviewer judgement.

## Output

```ts
type ArbAgentOutput = {
  contractVersion: "2026-05-03";
  reviewId: string;
  generatedAt: string;
  recommendation: "approve" | "approve-with-conditions" | "defer" | "reject";
  confidence: "low" | "medium" | "high";
  findings: AgentFinding[];
  scorecard: {
    security: number;
    reliability: number;
    costOptimization: number;
    operationalExcellence: number;
    performanceEfficiency: number;
    governance: number;
  };
  criticalBlockers: string[];
  missingEvidence: string[];
  reviewerActions: ReviewerAction[];
};
```

## Reviewer States

Every finding must support these human-owned states:

- `draft`
- `accepted`
- `accepted-with-edits`
- `rejected`
- `escalated`

The UI and audit log must show the reviewer state separately from the agent recommendation.

## Audit Fields

Every invocation should produce an append-only audit record:

```ts
type ArbAgentAuditRecord = {
  partitionKey: string; // reviewId
  rowKey: string; // timestamp or invocation id
  reviewId: string;
  invocationId: string;
  modelDeployment: string;
  promptVersion: string;
  contractVersion: string;
  retrievalBundleHash: string;
  inputHash: string;
  outputHash: string;
  reviewerOutcome?: "accepted" | "edited" | "rejected" | "escalated";
  createdAt: string;
};
```

## Guardrails

- Validate output JSON before persistence.
- Reject outputs that omit evidence references for high-severity findings.
- Cap input size and summarize before model invocation.
- Strip or quarantine prompt-injection instructions found inside uploaded evidence.
- Never let the model directly approve a review; it can only recommend.
