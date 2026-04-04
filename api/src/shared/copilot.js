const DEFAULT_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";
const DEFAULT_MODEL_NAME = process.env.AZURE_OPENAI_MODEL_NAME || "gpt-4.1-mini";

function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

function getCopilotConfiguration() {
  const endpoint = trimTrailingSlash(process.env.AZURE_OPENAI_ENDPOINT);
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  return {
    configured: Boolean(endpoint && apiKey && deployment),
    endpoint,
    apiKey,
    deployment,
    apiVersion: DEFAULT_API_VERSION,
    modelName: DEFAULT_MODEL_NAME
  };
}

function toVisibleEndpoint(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return value;
  }
}

function truncate(value, maxLength) {
  const text = String(value ?? "").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function sanitizeSources(sources) {
  return (Array.isArray(sources) ? sources : [])
    .slice(0, 8)
    .map((source) => ({
      label: truncate(source?.label ?? "Project review source", 120),
      url: source?.url ? truncate(source.url, 400) : undefined,
      note: source?.note ? truncate(source.note, 280) : undefined
    }));
}

function sanitizeServices(services) {
  return (Array.isArray(services) ? services : [])
    .slice(0, 12)
    .map((service) => ({
      serviceSlug: truncate(service?.serviceSlug ?? "", 80),
      serviceName: truncate(service?.serviceName ?? "Unknown service", 120),
      description: truncate(service?.description ?? "", 260),
      plannedRegion: truncate(service?.plannedRegion ?? "", 80),
      preferredSku: truncate(service?.preferredSku ?? "", 120),
      sizingNote: truncate(service?.sizingNote ?? "", 240),
      itemCount: Number(service?.itemCount ?? 0),
      includedCount: Number(service?.includedCount ?? 0),
      notApplicableCount: Number(service?.notApplicableCount ?? 0),
      excludedCount: Number(service?.excludedCount ?? 0),
      pendingCount: Number(service?.pendingCount ?? 0),
      regionFitSummary: truncate(service?.regionFitSummary ?? "", 260),
      costFitSummary: truncate(service?.costFitSummary ?? "", 260)
    }));
}

function sanitizeFindings(findings) {
  return (Array.isArray(findings) ? findings : [])
    .slice(0, 40)
    .map((finding) => ({
      guid: truncate(finding?.guid ?? "", 80),
      serviceName: truncate(finding?.serviceName ?? "Unknown service", 120),
      finding: truncate(finding?.finding ?? "", 260),
      severity: finding?.severity ?? undefined,
      decision: truncate(finding?.decision ?? "Needs Review", 40),
      comments: truncate(finding?.comments ?? "", 260),
      owner: truncate(finding?.owner ?? "", 80),
      dueDate: truncate(finding?.dueDate ?? "", 40)
    }));
}

function sanitizeCopilotContext(context) {
  return {
    review: {
      id: truncate(context?.review?.id ?? "", 80),
      name: truncate(context?.review?.name ?? "Project review", 120),
      audience: truncate(context?.review?.audience ?? "Unknown audience", 60),
      businessScope: truncate(context?.review?.businessScope ?? "", 400),
      targetRegions: (Array.isArray(context?.review?.targetRegions)
        ? context.review.targetRegions
        : []
      )
        .slice(0, 12)
        .map((region) => truncate(region, 80))
    },
    services: sanitizeServices(context?.services),
    findings: sanitizeFindings(context?.findings),
    sources: sanitizeSources(context?.sources)
  };
}

function buildCopilotMessages(question, context) {
  return [
    {
      role: "system",
      content:
        "You are the Azure Checklists project review copilot. Answer only from the supplied project review context and source list. Do not invent Azure pricing, region availability, contract discounts, checklist decisions, or service dependencies. If the context is insufficient, say so clearly. Keep the answer concise, decision-oriented, and useful for architects, pre-sales teams, cloud engineers, and leadership readers when relevant. Prefer short sections and bullets only when helpful."
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: question,
          instructions: [
            "Use only the provided project review data and listed sources.",
            "Call out regional restrictions, pricing caveats, and pending checklist decisions when they matter.",
            "Mention uncertainty explicitly if the supplied context does not answer part of the question."
          ],
          projectReview: context
        },
        null,
        2
      )
    }
  ];
}

async function runCopilot(question, context, options = {}) {
  const configuration = getCopilotConfiguration();

  if (!configuration.configured) {
    throw new Error(
      "Azure OpenAI copilot settings are not configured on the dedicated Function App."
    );
  }

  const sanitizedQuestion = truncate(question, 1200);
  const sanitizedContext = sanitizeCopilotContext(context);
  const response = await fetch(
    `${configuration.endpoint}/openai/deployments/${configuration.deployment}/chat/completions?api-version=${configuration.apiVersion}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": configuration.apiKey
      },
      body: JSON.stringify({
        messages: buildCopilotMessages(sanitizedQuestion, sanitizedContext),
        temperature: 0.2,
        max_tokens: 900
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      errorBody || `Azure OpenAI request failed with status ${response.status}.`
    );
  }

  const payload = await response.json();
  const answer = payload?.choices?.[0]?.message?.content;

  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("Azure OpenAI returned an empty copilot answer.");
  }

  return {
    answer: answer.trim(),
    generatedAt: new Date().toISOString(),
    modelName: configuration.modelName,
    modelDeployment: configuration.deployment,
    groundingMode: options.groundingMode ?? "project-review-context",
    sources: sanitizedContext.sources
  };
}

module.exports = {
  getCopilotConfiguration,
  runCopilot,
  toVisibleEndpoint
};
