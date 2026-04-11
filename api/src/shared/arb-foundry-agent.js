const { DefaultAzureCredential } = require("@azure/identity");

const FOUNDRY_PROJECT_ENDPOINT = (process.env.FOUNDRY_PROJECT_ENDPOINT || "").replace(/\/+$/, "");
const FOUNDRY_API_KEY = process.env.FOUNDRY_API_KEY || "";
// When set, use the pre-configured Foundry Agent (Azure-ARB-Agent) via Agents API + managed identity.
// When absent, fall back to direct Chat Completions via API key.
const FOUNDRY_AGENT_ID = process.env.FOUNDRY_AGENT_ID || "";
const FOUNDRY_AGENT_MODEL = "model-router";
const OPENAI_API_VERSION = "2025-01-01-preview";
const AGENTS_API_VERSION = "2025-05-15-preview";

// Derive the base AI Services endpoint from the Foundry project endpoint
// e.g. https://foo.services.ai.azure.com/api/projects/bar -> https://foo.services.ai.azure.com
function getAiServicesBaseEndpoint() {
  try {
    const url = new URL(FOUNDRY_PROJECT_ENDPOINT);
    return `${url.protocol}//${url.host}`;
  } catch {
    return FOUNDRY_PROJECT_ENDPOINT;
  }
}

function getFoundryConfiguration() {
  return {
    configured: Boolean(FOUNDRY_PROJECT_ENDPOINT && FOUNDRY_API_KEY),
    endpoint: FOUNDRY_PROJECT_ENDPOINT,
    agentId: FOUNDRY_AGENT_ID || null,
    useAgent: Boolean(FOUNDRY_AGENT_ID)
  };
}

// Obtain an Azure AD token for the Foundry project-level Agents API.
// Uses DefaultAzureCredential which picks up the Function App's managed identity in Azure
// and falls back to developer credentials locally.
let _credential = null;
async function getFoundryAgentToken() {
  if (!_credential) {
    _credential = new DefaultAzureCredential();
  }
  const tokenResponse = await _credential.getToken("https://ai.azure.com/.default");
  return tokenResponse.token;
}

async function foundryAgentRequest(path, method, body) {
  const token = await getFoundryAgentToken();
  const url = `${FOUNDRY_PROJECT_ENDPOINT}${path}?api-version=${AGENTS_API_VERSION}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Foundry Agents ${method} ${path} failed ${res.status}: ${text}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Run the review using the pre-configured Azure-ARB-Agent via Foundry Agents API.
// The agent has the Microsoft Learn MCP tool and (optionally) Bing grounding configured
// in the Azure AI Foundry portal.
async function runViaFoundryAgent(userMessage) {
  const agentId = FOUNDRY_AGENT_ID;

  // Create thread
  const thread = await foundryAgentRequest("/threads", "POST", {});

  // Add user message
  await foundryAgentRequest(`/threads/${thread.id}/messages`, "POST", {
    role: "user",
    content: userMessage
  });

  // Create run
  const run = await foundryAgentRequest(`/threads/${thread.id}/runs`, "POST", {
    assistant_id: agentId,
    additional_instructions: "Respond ONLY with the structured JSON as specified in your instructions."
  });

  // Poll for completion (max 3 minutes, 5s intervals)
  const maxAttempts = 36;
  let attempts = 0;
  let finalRun = run;
  const terminal = ["completed", "failed", "cancelled", "expired"];

  while (attempts < maxAttempts && !terminal.includes(finalRun.status)) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    finalRun = await foundryAgentRequest(`/threads/${thread.id}/runs/${run.id}`, "GET");
    attempts++;
  }

  if (finalRun.status !== "completed") {
    throw new Error(`Agent run ended with status: ${finalRun.status}`);
  }

  // Get the last assistant message
  const messages = await foundryAgentRequest(
    `/threads/${thread.id}/messages?order=desc&limit=5`,
    "GET"
  );
  const responseText = (messages?.data ?? [])
    .filter((m) => m.role === "assistant")
    .flatMap((m) => (m.content ?? []).filter((c) => c.type === "text").map((c) => c.text?.value ?? ""))
    .join("\n")
    .trim();

  return responseText;
}

async function chatCompletionsRequest(messages) {
  const base = getAiServicesBaseEndpoint();
  const url = `${base}/openai/deployments/${FOUNDRY_AGENT_MODEL}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": FOUNDRY_API_KEY
    },
    body: JSON.stringify({
      messages,
      max_tokens: 8192,
      temperature: 0.2
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Foundry chat completions failed ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

const ARB_SYSTEM_PROMPT = `You are ARB Agent, an expert Azure Architecture Review Board acting as a coordinated team of:
- Azure Cloud Architect
- Azure Senior Director
- Azure Project Manager
- Azure Pre-Sales Architect

## Your Review Framework

Evaluate every submission against these four Microsoft frameworks. For each finding, reference the specific framework principle it violates or satisfies.

### 1. Azure Well-Architected Framework (WAF) — https://learn.microsoft.com/azure/well-architected/
Five pillars — each must be assessed:
- **Reliability**: fault tolerance, redundancy, RTO/RPO, health probes, retry policies, multi-region failover
- **Security**: identity (Zero Trust, least privilege, MFA, PIM), network segmentation (NSG, Private Endpoints, WAF/Firewall), data encryption (at rest, in transit), threat detection (Defender for Cloud)
- **Cost Optimization**: right-sizing, reserved instances, auto-scale, idle resource removal, cost alerts/budgets
- **Operational Excellence**: IaC (Bicep/Terraform), CI/CD pipelines, monitoring (Azure Monitor, Log Analytics), alerting, runbooks, tagging strategy
- **Performance Efficiency**: appropriate SKUs, caching (Redis/CDN), async patterns, load testing evidence

### 2. Cloud Adoption Framework (CAF) — https://learn.microsoft.com/azure/cloud-adoption-framework/
Key areas:
- **Strategy**: business justification, migration vs greenfield decision, executive sponsorship
- **Plan**: skills readiness, digital estate inventory, adoption plan, iteration velocity
- **Ready**: Landing Zone design, management group hierarchy, policy assignments, RBAC model
- **Adopt**: migration wave planning, modernization path, POC to production criteria
- **Govern**: cost management discipline, security baseline, resource consistency, identity baseline, deployment acceleration
- **Manage**: management baseline, workload operations, platform operations, enhanced management

### 3. Azure Landing Zone (ALZ) — https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/
Mandatory checks:
- Management group hierarchy (Platform / Landing Zones / Sandbox / Decommissioned)
- Hub-spoke or Virtual WAN network topology
- Azure Policy assignments (deny non-compliant resources, enforce tagging, require diagnostics)
- Log Analytics workspace centralised in Management subscription
- Defender for Cloud enabled across all subscriptions
- Identity subscription with Domain Controllers or AAD DS where required
- Connectivity subscription with ExpressRoute/VPN Gateway, DNS, and Firewall
- Subscription vending process for workload landing zones

### 4. Microsoft Learn Best Practices (service-specific)
For each Azure service mentioned in the uploaded documents, verify alignment with the relevant Microsoft Learn service guide:
- Azure Kubernetes Service: node pool segregation, cluster autoscaler, pod disruption budgets, RBAC, network policies
- Azure SQL / Cosmos DB: geo-redundancy, failover groups, connection resiliency, encryption, auditing
- Azure App Service / Functions: deployment slots, managed identity, VNet integration, CORS policy
- Azure Storage: soft delete, versioning, private endpoints, access tier lifecycle
- Azure Key Vault: purge protection, soft delete, access policies vs RBAC, certificate rotation
- Azure API Management: rate limiting, authentication policies, backend certificates, developer portal
- Any other service: apply the relevant WAF service guide from learn.microsoft.com/azure

## Output Instructions

Respond ONLY with a valid JSON object in this exact shape:
{
  "reviewSummary": "string — 2-3 paragraph executive summary referencing WAF/CAF/ALZ gaps and strengths",
  "strengths": ["string — cite the framework principle met"],
  "findings": [
    {
      "severity": "High|Medium|Low",
      "domain": "Security|Reliability|Cost|Operations|Architecture|Governance|Delivery",
      "framework": "WAF|CAF|ALZ|MicrosoftLearn",
      "frameworkPillar": "string — e.g. WAF:Reliability, CAF:Govern, ALZ:NetworkTopology",
      "title": "string",
      "findingStatement": "string",
      "whyItMatters": "string — explain risk in business and technical terms",
      "evidenceBasis": "string — quote or reference from the uploaded document",
      "recommendation": "string — specific actionable fix referencing Microsoft Learn URL where applicable",
      "learnMoreUrl": "string — relevant learn.microsoft.com link",
      "suggestedOwner": "string"
    }
  ],
  "missingEvidence": ["string — describe the specific document or artefact absent"],
  "criticalBlockers": ["string — WAF/CAF/ALZ violations that must be resolved before approval"],
  "scorecard": {
    "dimensions": [
      { "name": "Architecture Completeness", "score": 0, "rationale": "string", "blockers": ["string"] },
      { "name": "Security and Compliance", "score": 0, "rationale": "string — cite WAF Security pillar gaps", "blockers": ["string"] },
      { "name": "Reliability and Resilience", "score": 0, "rationale": "string — cite WAF Reliability pillar gaps", "blockers": ["string"] },
      { "name": "Operational Readiness", "score": 0, "rationale": "string — cite WAF Operational Excellence gaps", "blockers": ["string"] },
      { "name": "Cost and Commercial Fit", "score": 0, "rationale": "string — cite WAF Cost Optimization gaps", "blockers": ["string"] },
      { "name": "Governance and Controls", "score": 0, "rationale": "string — cite CAF Govern and ALZ policy gaps", "blockers": ["string"] },
      { "name": "Delivery Feasibility", "score": 0, "rationale": "string — cite CAF Adopt and Plan gaps", "blockers": ["string"] },
      { "name": "Documentation Quality", "score": 0, "rationale": "string", "blockers": ["string"] }
    ],
    "overallScore": 0,
    "criticalBlockerCount": 0,
    "missingEvidenceCount": 0,
    "confidenceLevel": "High|Medium|Low"
  },
  "recommendation": "Approved|Approved with Conditions|Needs Revision|Insufficient Evidence",
  "nextActions": ["string — specific action with framework reference and owner type"]
}

Scores are 0-100. Ground every finding in evidence from the uploaded documents. Do not invent facts. When a framework requirement cannot be assessed due to missing documentation, list it in missingEvidence rather than inventing a finding.`;

function buildUserMessage(review, files, requirements, evidence, searchChunks) {
  const parts = [
    `## Review Request`,
    `Review ID: ${review.reviewId}`,
    `Project: ${review.projectName || "Unnamed Project"}`,
    `Customer: ${review.customerName || "Unknown"}`,
    `Target Regions: ${(review.targetRegions || []).join(", ") || "Not specified"}`,
    `Workflow State: ${review.workflowState}`,
    `Evidence Readiness: ${review.evidenceReadinessState}`,
    ``,
    `## Uploaded Documents (${files.length})`,
    ...files.map((f) => `- ${f.fileName} [${f.logicalCategory}] — extraction: ${f.extractionStatus}`),
    ``
  ];

  if (requirements.length > 0) {
    parts.push(`## Extracted Requirements (${Math.min(requirements.length, 40)} shown)`);
    for (const r of requirements.slice(0, 40)) {
      parts.push(`- [${r.category ?? "General"}/${r.criticality ?? "Normal"}] ${r.normalizedText}`);
    }
    parts.push(``);
  }

  if (evidence.length > 0) {
    parts.push(`## Extracted Evidence Facts (${Math.min(evidence.length, 30)} shown)`);
    for (const e of evidence.slice(0, 30)) {
      parts.push(`- [${e.factType ?? "Fact"}] ${e.summary} (${e.sourceFileName || "Document"})`);
    }
    parts.push(``);
  }

  if (searchChunks.length > 0) {
    parts.push(`## Retrieved Document Context (${searchChunks.length} chunks)`);
    for (const c of searchChunks) {
      parts.push(`### ${c.fileName} [${c.logicalCategory}]`);
      parts.push(c.content);
      parts.push(``);
    }
  }

  parts.push(`Produce your Architecture Review Board assessment as structured JSON.`);
  return parts.join("\n");
}

function parseSeverity(value) {
  const v = String(value ?? "").trim();
  if (v === "High" || v === "Medium" || v === "Low") return v;
  return "Medium";
}

function parseRecommendation(value) {
  const v = String(value ?? "").trim();
  const valid = ["Approved", "Approved with Conditions", "Needs Revision", "Insufficient Evidence"];
  return valid.includes(v) ? v : "Needs Revision";
}

function parseAgentResponse(responseText) {
  // Extract JSON from response (model may wrap in markdown code fences)
  let jsonText = responseText.trim();
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fenceMatch) jsonText = fenceMatch[1].trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  const findings = (Array.isArray(parsed.findings) ? parsed.findings : []).map((f, i) => ({
    findingId: `agent-finding-${i + 1}`,
    severity: parseSeverity(f.severity),
    domain: String(f.domain ?? "Architecture"),
    framework: String(f.framework ?? "WAF"),
    frameworkPillar: String(f.frameworkPillar ?? ""),
    title: String(f.title ?? "Finding"),
    findingStatement: String(f.findingStatement ?? ""),
    whyItMatters: String(f.whyItMatters ?? ""),
    evidenceBasis: String(f.evidenceBasis ?? ""),
    recommendation: String(f.recommendation ?? ""),
    learnMoreUrl: String(f.learnMoreUrl ?? ""),
    suggestedOwner: String(f.suggestedOwner ?? ""),
    evidenceFound: [],
    status: "Open",
    source: "agent"
  }));

  const dimensions = (Array.isArray(parsed.scorecard?.dimensions) ? parsed.scorecard.dimensions : []).map((d) => ({
    name: String(d.name ?? ""),
    score: Math.max(0, Math.min(100, Number(d.score ?? 0))),
    weight: 12.5,
    rationale: String(d.rationale ?? ""),
    blockers: Array.isArray(d.blockers) ? d.blockers.map(String) : []
  }));

  const overallScore = Math.max(
    0,
    Math.min(100, Number(parsed.scorecard?.overallScore ?? dimensions.reduce((s, d) => s + d.score, 0) / Math.max(dimensions.length, 1)))
  );

  const scorecard = {
    overallScore: Math.round(overallScore),
    recommendation: parseRecommendation(parsed.recommendation),
    criticalBlockerCount: Number(parsed.scorecard?.criticalBlockerCount ?? 0),
    missingEvidenceCount: Number(parsed.scorecard?.missingEvidenceCount ?? 0),
    confidenceLevel: String(parsed.scorecard?.confidenceLevel ?? "Medium"),
    dimensionScores: dimensions,
    reviewSummary: String(parsed.reviewSummary ?? ""),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    missingEvidence: Array.isArray(parsed.missingEvidence) ? parsed.missingEvidence.map(String) : [],
    criticalBlockers: Array.isArray(parsed.criticalBlockers) ? parsed.criticalBlockers.map(String) : [],
    nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions.map(String) : [],
    source: "agent",
    generatedAt: new Date().toISOString()
  };

  return { findings, scorecard, recommendation: scorecard.recommendation };
}

async function runArbAgentReview({ review, files, requirements, evidence, searchChunks }) {
  const config = getFoundryConfiguration();
  if (!config.configured) {
    return { success: false, reason: "Foundry not configured — FOUNDRY_PROJECT_ENDPOINT or FOUNDRY_API_KEY missing" };
  }

  const userMessage = buildUserMessage(review, files, requirements, evidence, searchChunks);

  try {
    let responseText;

    if (config.useAgent) {
      // Use the pre-configured Azure-ARB-Agent (has Microsoft Learn MCP tool + optional Bing grounding)
      // Authenticated via Function App managed identity → Azure AD token → Foundry Agents API
      responseText = await runViaFoundryAgent(userMessage);
    } else {
      // Fallback: direct Chat Completions with the system prompt embedded in the request
      responseText = await chatCompletionsRequest([
        { role: "system", content: ARB_SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ]);
    }

    if (!responseText) {
      return { success: false, reason: "Model returned an empty response" };
    }

    const parsed = parseAgentResponse(responseText);
    if (!parsed) {
      return { success: false, reason: "Model response could not be parsed as structured JSON", rawResponse: responseText };
    }

    return { success: true, ...parsed };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Unknown error during agent review"
    };
  }
}

module.exports = {
  getFoundryConfiguration,
  runArbAgentReview
};
