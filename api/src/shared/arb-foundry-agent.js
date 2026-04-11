const FOUNDRY_PROJECT_ENDPOINT = (process.env.FOUNDRY_PROJECT_ENDPOINT || "").replace(/\/+$/, "");
const FOUNDRY_API_KEY = process.env.FOUNDRY_API_KEY || "";
const FOUNDRY_AGENT_MODEL = "model-router";
const OPENAI_API_VERSION = "2025-01-01-preview";

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
    endpoint: FOUNDRY_PROJECT_ENDPOINT
  };
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

Review the uploaded architecture package and produce a structured JSON assessment.

Respond ONLY with a valid JSON object in this exact shape:
{
  "reviewSummary": "string — 2-3 paragraph executive summary",
  "strengths": ["string"],
  "findings": [
    {
      "severity": "High|Medium|Low",
      "domain": "Security|Reliability|Cost|Operations|Architecture|Governance|Delivery",
      "title": "string",
      "findingStatement": "string",
      "whyItMatters": "string",
      "evidenceBasis": "string",
      "recommendation": "string",
      "suggestedOwner": "string"
    }
  ],
  "missingEvidence": ["string"],
  "criticalBlockers": ["string"],
  "scorecard": {
    "dimensions": [
      { "name": "Architecture Completeness", "score": 0, "rationale": "string", "blockers": ["string"] },
      { "name": "Security and Compliance", "score": 0, "rationale": "string", "blockers": ["string"] },
      { "name": "Reliability and Resilience", "score": 0, "rationale": "string", "blockers": ["string"] },
      { "name": "Operational Readiness", "score": 0, "rationale": "string", "blockers": ["string"] },
      { "name": "Cost and Commercial Fit", "score": 0, "rationale": "string", "blockers": ["string"] },
      { "name": "Governance and Controls", "score": 0, "rationale": "string", "blockers": ["string"] },
      { "name": "Delivery Feasibility", "score": 0, "rationale": "string", "blockers": ["string"] },
      { "name": "Documentation Quality", "score": 0, "rationale": "string", "blockers": ["string"] }
    ],
    "overallScore": 0,
    "criticalBlockerCount": 0,
    "missingEvidenceCount": 0,
    "confidenceLevel": "High|Medium|Low"
  },
  "recommendation": "Approved|Approved with Conditions|Needs Revision|Insufficient Evidence",
  "nextActions": ["string"]
}

Scores are 0-100. Base all findings on the provided document context. Do not invent facts not present in the evidence.`;

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
    title: String(f.title ?? "Finding"),
    findingStatement: String(f.findingStatement ?? ""),
    whyItMatters: String(f.whyItMatters ?? ""),
    evidenceBasis: String(f.evidenceBasis ?? ""),
    recommendation: String(f.recommendation ?? ""),
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

  try {
    const userMessage = buildUserMessage(review, files, requirements, evidence, searchChunks);
    const responseText = await chatCompletionsRequest([
      { role: "system", content: ARB_SYSTEM_PROMPT },
      { role: "user", content: userMessage }
    ]);

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
