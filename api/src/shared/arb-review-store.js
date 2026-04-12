const crypto = require("node:crypto");
const path = require("node:path");
const XLSX = require("xlsx");
const {
  ARB_INPUT_CONTAINER_NAME,
  ARB_OUTPUT_CONTAINER_NAME,
  getContainerClient,
  readBinaryBlob,
  readTextBlob,
  sanitizePathSegment,
  uploadBinaryBlob,
  uploadTextBlob
} = require("./storage");
const { getCopilotConfiguration, runCopilot } = require("./copilot");
const { ensureArbSearchIndex, indexArbDocumentChunks, getSearchConfiguration } = require("./arb-search");
const { describeImageForReview, getFoundryConfiguration } = require("./arb-foundry-agent");
const {
  getDocumentIntelligenceConfiguration,
  supportsDocumentIntelligenceExtraction,
  extractDocumentText
} = require("./arb-document-intelligence");
const {
  ARB_REVIEW_TABLE_NAME,
  encodeTableKey,
  getTableClient
} = require("./table-storage");

const SUMMARY_ROW_KEY = "SUMMARY";
const FINDINGS_ROW_KEY = "FINDINGS";
const SCORECARD_ROW_KEY = "SCORECARD";
const DECISION_ROW_KEY = "DECISION_LATEST";
const ACTIONS_ROW_KEY = "ACTIONS";
const FILES_ROW_KEY = "FILES";
const EXTRACTION_ROW_KEY = "EXTRACTION";
const REQUIREMENTS_ROW_KEY = "REQUIREMENTS";
const EVIDENCE_ROW_KEY = "EVIDENCE";
const EXPORTS_ROW_KEY = "EXPORTS";
const REQUIRED_LOGICAL_CATEGORIES = ["sow", "design_doc"];
const RECOMMENDED_LOGICAL_CATEGORIES = [
  "diagram",
  "security_note",
  "cost_assumptions",
  "dr_ha_note",
  "ops_monitoring_note"
];
const TEXT_EXTRACTABLE_EXTENSIONS = new Set([
  // Plain text
  ".txt", ".md", ".markdown",
  // Structured data
  ".csv", ".json", ".xml", ".yaml", ".yml",
  // IaC / config
  ".bicep", ".tf", ".hcl", ".toml",
  // Diagrams (XML-based, fully readable)
  ".drawio", ".draw.io",
  // Whiteboard / diagramming (text-based)
  ".excalidraw", ".mmd", ".mermaid", ".puml", ".plantuml",
  // Markup
  ".html", ".htm",
  // Scripts & automation
  ".ps1", ".psm1", ".sh", ".azcli",
  // API & schema definitions
  ".proto", ".graphql", ".gql", ".wsdl", ".xsd",
  // Notebooks (JSON-based)
  ".ipynb",
  // Rich text
  ".rtf"
]);
const SPREADSHEET_EXTRACTABLE_EXTENSIONS = new Set([
  ".xlsx", ".xls", ".ods"
]);
const IMAGE_EXTRACTABLE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff"
]);
const SUPPORTED_UPLOAD_EXTENSIONS = new Set([
  // Documents
  ".pdf", ".doc", ".docx", ".rtf", ".odt",
  // Presentations
  ".ppt", ".pptx", ".odp",
  // Spreadsheets & data
  ".xls", ".xlsx", ".csv", ".ods",
  // Diagrams
  ".drawio", ".draw.io", ".vsdx", ".svg", ".svgz",
  // Whiteboard / diagramming tools
  ".excalidraw", ".mmd", ".mermaid", ".puml", ".plantuml",
  // Images / screenshots
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff",
  // Text & markup
  ".txt", ".md", ".markdown", ".html", ".htm",
  // Structured / IaC
  ".json", ".xml", ".yaml", ".yml", ".bicep", ".tf", ".hcl", ".toml",
  // Scripts & automation (Azure PowerShell, Azure CLI, Bash)
  ".ps1", ".psm1", ".sh", ".azcli",
  // API & schema definitions
  ".proto", ".graphql", ".gql", ".wsdl", ".xsd",
  // Notebooks
  ".ipynb",
  // Archives
  ".zip", ".7z", ".tar", ".tgz"
]);
const EXTRACTION_KEYWORD_MAP = [
  ["security", "Security"],
  ["identity", "Identity"],
  ["network", "Networking"],
  ["cost", "Cost"],
  ["pricing", "Cost"],
  ["monitor", "Operations"],
  ["logging", "Operations"],
  ["resilien", "Reliability"],
  ["recovery", "Reliability"],
  ["backup", "Reliability"],
  ["availability", "Reliability"]
];

function encodePrincipalKey(userId) {
  return encodeTableKey(userId);
}

function getRowKey(baseRowKey, userId) {
  return `${baseRowKey}|${encodePrincipalKey(userId)}`;
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitizeReviewSegment(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeReviewId(rawValue, fallback = "demo-review") {
  const normalized = sanitizeReviewSegment(rawValue);
  return normalized || fallback;
}

function sanitizeFilename(value) {
  return String(value ?? "upload.bin")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "upload.bin";
}

function getFileExtension(value) {
  return path.extname(String(value ?? "")).toLowerCase();
}

function normalizeLogicalCategory(value, fallback = "supporting_artifact") {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
}

function inferLogicalCategory(fileName) {
  const lowered = String(fileName ?? "").toLowerCase();
  const ext = lowered.slice(lowered.lastIndexOf("."));

  // Extension-based overrides
  if (ext === ".drawio" || ext === ".vsdx") return "diagram";
  if (ext === ".bicep" || ext === ".tf") return "design_doc";
  if (ext === ".yaml" || ext === ".yml") return "design_doc";
  if (ext === ".zip") return "supporting_artifact";

  // Filename keyword rules
  if (lowered.includes("sow") || lowered.includes("statement-of-work") || lowered.includes("statement_of_work")) {
    return "sow";
  }

  if (lowered.includes("diagram") || lowered.includes("drawio") || lowered.includes("topology") || lowered.includes("network-map")) {
    return "diagram";
  }

  if (lowered.includes("security") || lowered.includes("threat-model") || lowered.includes("pentest")) {
    return "security_note";
  }

  if (lowered.includes("cost") || lowered.includes("pricing") || lowered.includes("budget")) {
    return "cost_assumptions";
  }

  if (lowered.includes("dr") || lowered.includes("ha") || lowered.includes("resilien") || lowered.includes("disaster") || lowered.includes("recovery")) {
    return "dr_ha_note";
  }

  if (lowered.includes("ops") || lowered.includes("monitor") || lowered.includes("runbook") || lowered.includes("alerting") || lowered.includes("observ")) {
    return "ops_monitoring_note";
  }

  if (lowered.includes("design") || lowered.includes("hld") || lowered.includes("lld") || lowered.includes("architecture") || lowered.includes("landing-zone") || lowered.includes("landing_zone")) {
    return "design_doc";
  }

  return "supporting_artifact";
}

function inferSourceRole(logicalCategory) {
  switch (logicalCategory) {
    case "sow":
      return "Project Manager";
    case "security_note":
      return "Security Architect";
    case "cost_assumptions":
      return "Pre-sales Architect";
    case "ops_monitoring_note":
      return "Platform Lead";
    default:
      return "Architect";
  }
}

function supportsTextExtraction(fileName) {
  return TEXT_EXTRACTABLE_EXTENSIONS.has(getFileExtension(fileName));
}

function supportsSpreadsheetExtraction(fileName) {
  return SPREADSHEET_EXTRACTABLE_EXTENSIONS.has(getFileExtension(fileName));
}

function supportsImageExtraction(fileName) {
  return IMAGE_EXTRACTABLE_EXTENSIONS.has(getFileExtension(fileName));
}

/**
 * Converts an Excel/ODS workbook buffer to readable plain text.
 * Each sheet is rendered as a TSV block labelled with the sheet name.
 */
function extractSpreadsheetText(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const parts = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv.trim()) {
      parts.push(`=== Sheet: ${sheetName} ===\n${csv}`);
    }
  }

  return parts.join("\n\n");
}

function isSupportedUpload(fileName) {
  const extension = getFileExtension(fileName);
  return SUPPORTED_UPLOAD_EXTENSIONS.has(extension);
}

function buildFileId(reviewId, fileName, hash) {
  return `${reviewId}-file-${hash.slice(0, 10)}-${sanitizePathSegment(fileName).slice(0, 24)}`;
}

function buildBlobPath(userId, reviewId, fileName) {
  return `${sanitizePathSegment(userId)}/reviews/${sanitizePathSegment(reviewId)}/${Date.now()}-${sanitizeFilename(fileName)}`;
}

function normalizeLine(line) {
  return String(line ?? "").replace(/\s+/g, " ").trim();
}

function extractMeaningfulLines(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter((line) => line.length >= 24)
    .slice(0, 60);
}

function buildRequirementCategory(line, fallback) {
  const lowered = line.toLowerCase();

  for (const [needle, label] of EXTRACTION_KEYWORD_MAP) {
    if (lowered.includes(needle)) {
      return label;
    }
  }

  return fallback;
}

function uniqueBy(items, keySelector) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const key = keySelector(item);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(item);
  }

  return output;
}

function buildReadinessFromFiles(files) {
  const categories = new Set((Array.isArray(files) ? files : []).map((file) => file.logicalCategory));
  const missingRequiredItems = REQUIRED_LOGICAL_CATEGORIES.filter((category) => !categories.has(category));
  const missingRecommendedItems = RECOMMENDED_LOGICAL_CATEGORIES.filter(
    (category) => !categories.has(category)
  );
  const recommendedCoverage =
    RECOMMENDED_LOGICAL_CATEGORIES.length === 0
      ? 1
      : (RECOMMENDED_LOGICAL_CATEGORIES.length - missingRecommendedItems.length) /
        RECOMMENDED_LOGICAL_CATEGORIES.length;

  let readinessOutcome = "Ready with Gaps";
  let readinessNotes = "The package can proceed, but recommended evidence is still incomplete.";

  if (missingRequiredItems.length > 0) {
    readinessOutcome = "Insufficient Evidence";
    readinessNotes = "At least one required upload category is still missing.";
  } else if (missingRecommendedItems.length === 0) {
    readinessOutcome = "Ready for Review";
    readinessNotes = "Required and recommended evidence categories are present.";
  }

  return {
    requiredEvidencePresent: missingRequiredItems.length === 0,
    recommendedEvidenceCoverage: Number(recommendedCoverage.toFixed(2)),
    missingRequiredItems,
    missingRecommendedItems,
    readinessOutcome,
    readinessNotes
  };
}

function buildDefaultExtractionStatus(review) {
  return {
    reviewId: review.reviewId,
    jobId: `${review.reviewId}-extract-001`,
    state: "Not Started",
    completedSteps: [],
    failedSteps: [],
    evidenceReadinessState: review.evidenceReadinessState,
    extractionErrors: [],
    lastStartedAt: null,
    lastCompletedAt: null,
    fileStatuses: []
  };
}

function buildDefaultRequirements() {
  return [];
}

function buildDefaultEvidence() {
  return [];
}

function buildDefaultExports() {
  return [];
}

function normalizeExportFormat(value) {
  const normalized = String(value ?? "markdown").trim().toLowerCase();

  if (normalized === "markdown" || normalized === "md") {
    return "markdown";
  }

  if (normalized === "csv" || normalized === "html") {
    return normalized;
  }

  throw createHttpError(400, "Supported ARB export formats are markdown, csv, and html.");
}

function getExportExtension(format) {
  return format === "markdown" ? "md" : format;
}

function buildExportId(reviewId, format) {
  return `${sanitizePathSegment(reviewId)}-review-output-${format}`;
}

function buildExportFileName(reviewId, format) {
  return `${sanitizePathSegment(reviewId)}-reviewed-arb-output.${getExportExtension(format)}`;
}

function buildExportBlobPath(userId, reviewId, fileName) {
  return `${sanitizePathSegment(userId)}/reviews/${sanitizePathSegment(reviewId)}/outputs/${fileName}`;
}

function escapeCsvValue(value) {
  const normalized = String(value ?? "").replace(/\r?\n/g, " ");

  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function buildAiSummary(review, files, requirements, evidence, findings, scorecard, actions) {
  if (!getCopilotConfiguration().configured) {
    return "";
  }

  try {
    const copilotResponse = await runCopilot(
      "Summarize this Azure architecture review package with key blockers, confidence, and next actions.",
      buildReviewContextForCopilot(review, files, requirements, evidence, findings, scorecard, actions),
      { mode: "leadership-summary", groundingMode: "arb-review-export" }
    );

    return String(copilotResponse.answer ?? "").trim();
  } catch {
    return "";
  }
}

function renderMarkdownExportBody(review, files, requirements, evidence, findings, scorecard, actions, summaryText) {
  return [
    `# ${review.projectName} ARB Reviewed Output`,
    "",
    `- Review ID: ${review.reviewId}`,
    `- Customer: ${review.customerName}`,
    `- Workflow state: ${review.workflowState}`,
    `- Evidence readiness: ${review.evidenceReadinessState}`,
    `- Documents reviewed: ${files.length}`,
    `- Requirements extracted: ${requirements.length}`,
    `- Evidence facts extracted: ${evidence.length}`,
    scorecard ? `- Overall score: ${scorecard.overallScore ?? "TBD"}` : null,
    scorecard ? `- Recommendation: ${scorecard.recommendation}` : null,
    "",
    summaryText ? `## AI Summary\n\n${summaryText}` : null,
    summaryText ? "" : null,
    "## Uploaded Inputs",
    "",
    ...files.map(
      (file) =>
        `- ${file.fileName} (${file.logicalCategory}, ${file.extractionStatus}, ${file.supportedTextExtraction ? "text-ready" : "stored-only"})`
    ),
    "",
    "## Reviewed Requirements",
    "",
    ...requirements.map(
      (requirement) =>
        `- [${requirement.category}/${requirement.criticality}] ${requirement.normalizedText}`
    ),
    "",
    "## Reviewed Evidence",
    "",
    ...evidence.map(
      (fact) => `- [${fact.factType}] ${fact.summary} (${fact.sourceFileName || "Derived summary"})`
    ),
    "",
    "## Findings",
    "",
    ...findings.map((finding) => `- [${finding.severity}] ${finding.title} (${finding.status})`),
    "",
    "## Actions",
    "",
    ...actions.map((action) => `- ${action.actionSummary} (${action.status})`)
  ]
    .filter(Boolean)
    .join("\n");
}

function renderCsvExportBody(review, files, requirements, evidence, findings, scorecard, actions) {
  const rows = [
    [
      "recordType",
      "reviewId",
      "projectName",
      "category",
      "title",
      "details",
      "sourceFile",
      "status",
      "severity",
      "owner",
      "dueDate"
    ],
    [
      "review",
      review.reviewId,
      review.projectName,
      "summary",
      review.customerName,
      `Workflow=${review.workflowState}; Readiness=${review.evidenceReadinessState}; Score=${scorecard?.overallScore ?? "TBD"}`,
      "",
      review.workflowState,
      scorecard?.recommendation || "",
      review.assignedReviewer || "",
      review.targetReviewDate || ""
    ],
    ...files.map((file) => [
      "file",
      review.reviewId,
      review.projectName,
      file.logicalCategory,
      file.fileName,
      `Extraction=${file.extractionStatus}; Size=${file.sizeBytes}`,
      file.fileName,
      file.extractionStatus,
      "",
      file.uploadedBy,
      file.uploadedAt
    ]),
    ...requirements.map((requirement) => [
      "requirement",
      review.reviewId,
      review.projectName,
      requirement.category,
      requirement.normalizedText,
      requirement.reviewerStatus,
      requirement.sourceFileName || "",
      requirement.reviewerStatus,
      requirement.criticality,
      "",
      ""
    ]),
    ...evidence.map((fact) => [
      "evidence",
      review.reviewId,
      review.projectName,
      fact.factType,
      fact.summary,
      fact.sourceExcerpt,
      fact.sourceFileName || "",
      fact.confidence,
      "",
      "",
      ""
    ]),
    ...findings.map((finding) => [
      "finding",
      review.reviewId,
      review.projectName,
      finding.domain,
      finding.title,
      finding.findingStatement,
      finding.evidenceFound.join(" | "),
      finding.status,
      finding.severity,
      finding.owner || finding.suggestedOwner || "",
      finding.dueDate || finding.suggestedDueDate || ""
    ]),
    ...actions.map((action) => [
      "action",
      review.reviewId,
      review.projectName,
      "remediation",
      action.actionSummary,
      action.closureNotes || "",
      action.sourceFindingId,
      action.status,
      action.severity,
      action.owner || "",
      action.dueDate || ""
    ])
  ];

  return rows.map((row) => row.map((value) => escapeCsvValue(value)).join(",")).join("\n");
}

function renderHtmlExportBody(review, files, requirements, evidence, findings, scorecard, actions, summaryText) {
  const renderList = (items) =>
    items.length === 0
      ? "<p>None.</p>"
      : `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    `  <title>${escapeHtml(review.projectName)} ARB Reviewed Output</title>`,
    "  <style>",
    "    body { font-family: Segoe UI, Arial, sans-serif; margin: 32px; color: #1f2937; }",
    "    h1, h2 { color: #0f172a; }",
    "    .meta { margin: 0 0 20px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; }",
    "  </style>",
    "</head>",
    "<body>",
    `  <h1>${escapeHtml(review.projectName)} ARB Reviewed Output</h1>`,
    '  <section class="meta">',
    `    <p><strong>Review ID:</strong> ${escapeHtml(review.reviewId)}</p>`,
    `    <p><strong>Customer:</strong> ${escapeHtml(review.customerName)}</p>`,
    `    <p><strong>Workflow state:</strong> ${escapeHtml(review.workflowState)}</p>`,
    `    <p><strong>Evidence readiness:</strong> ${escapeHtml(review.evidenceReadinessState)}</p>`,
    `    <p><strong>Overall score:</strong> ${escapeHtml(scorecard?.overallScore ?? "TBD")}</p>`,
    `    <p><strong>Recommendation:</strong> ${escapeHtml(scorecard?.recommendation ?? "Pending")}</p>`,
    "  </section>",
    summaryText ? `  <h2>AI Summary</h2><p>${escapeHtml(summaryText)}</p>` : "",
    "  <h2>Uploaded Inputs</h2>",
    renderList(
      files.map(
        (file) =>
          `${escapeHtml(file.fileName)} (${escapeHtml(file.logicalCategory)}, ${escapeHtml(file.extractionStatus)})`
      )
    ),
    "  <h2>Reviewed Requirements</h2>",
    renderList(
      requirements.map(
        (requirement) =>
          `[${escapeHtml(requirement.category)}/${escapeHtml(requirement.criticality)}] ${escapeHtml(requirement.normalizedText)}`
      )
    ),
    "  <h2>Reviewed Evidence</h2>",
    renderList(
      evidence.map(
        (fact) =>
          `[${escapeHtml(fact.factType)}] ${escapeHtml(fact.summary)} (${escapeHtml(fact.sourceFileName || "Derived summary")})`
      )
    ),
    "  <h2>Findings</h2>",
    renderList(
      findings.map(
        (finding) =>
          `[${escapeHtml(finding.severity)}] ${escapeHtml(finding.title)} (${escapeHtml(finding.status)})`
      )
    ),
    "  <h2>Actions</h2>",
    renderList(actions.map((action) => `${escapeHtml(action.actionSummary)} (${escapeHtml(action.status)})`)),
    "</body>",
    "</html>"
  ]
    .filter(Boolean)
    .join("\n");
}

function mergeExportRecords(existingExports, nextRecord) {
  return [...(existingExports || []).filter((record) => record.exportId !== nextRecord.exportId), nextRecord].sort(
    (left, right) => String(right.generatedAt).localeCompare(String(left.generatedAt))
  );
}

async function writeArbOutputArtifact({
  principal,
  review,
  files,
  requirements,
  evidence,
  findings,
  scorecard,
  actions,
  format,
  generatedAt,
  summaryText,
  existingExports
}) {
  const outputContainer = await getContainerClient(ARB_OUTPUT_CONTAINER_NAME);
  const fileName = buildExportFileName(review.reviewId, format);
  const blobPath = buildExportBlobPath(principal.userId, review.reviewId, fileName);
  let body;
  let contentType;

  if (format === "csv") {
    body = renderCsvExportBody(review, files, requirements, evidence, findings, scorecard, actions);
    contentType = "text/csv; charset=utf-8";
  } else if (format === "html") {
    body = renderHtmlExportBody(
      review,
      files,
      requirements,
      evidence,
      findings,
      scorecard,
      actions,
      summaryText
    );
    contentType = "text/html; charset=utf-8";
  } else {
    body = renderMarkdownExportBody(
      review,
      files,
      requirements,
      evidence,
      findings,
      scorecard,
      actions,
      summaryText
    );
    contentType = "text/markdown; charset=utf-8";
  }

  await uploadTextBlob(outputContainer, blobPath, body, contentType);

  const exportRecord = {
    exportId: buildExportId(review.reviewId, format),
    reviewId: review.reviewId,
    format,
    includeFindings: true,
    includeScorecard: true,
    includeActions: true,
    blobPath,
    fileName,
    contentType,
    generatedAt: generatedAt || new Date().toISOString()
  };

  return {
    exportRecord,
    exportsList: mergeExportRecords(existingExports, exportRecord)
  };
}

async function syncArbReviewedOutputs({
  principal,
  review,
  files,
  requirements,
  evidence,
  findings,
  scorecard,
  actions,
  formats,
  generatedAt,
  existingExports
}) {
  const summaryText = await buildAiSummary(
    review,
    files,
    requirements,
    evidence,
    findings,
    scorecard,
    actions
  );
  const requestedFormats = Array.isArray(formats) && formats.length > 0 ? formats : ["markdown"];
  const normalizedFormats = [...new Set(requestedFormats.map((format) => normalizeExportFormat(format)))];
  let nextExports = existingExports || [];
  const createdArtifacts = [];

  for (const format of normalizedFormats) {
    const result = await writeArbOutputArtifact({
      principal,
      review,
      files,
      requirements,
      evidence,
      findings,
      scorecard,
      actions,
      format,
      generatedAt,
      summaryText,
      existingExports: nextExports
    });

    nextExports = result.exportsList;
    createdArtifacts.push(result.exportRecord);
  }

  return {
    exportsList: nextExports,
    artifacts: createdArtifacts
  };
}

function deriveRequirementsAndEvidence(review, files, fileTexts) {
  const requirements = [];
  const evidence = [];

  for (const file of files) {
    const text = fileTexts.get(file.fileId) || "";
    const lines = extractMeaningfulLines(text);

    if (["sow", "design_doc", "cost_assumptions", "dr_ha_note", "ops_monitoring_note"].includes(file.logicalCategory)) {
      for (const line of lines.slice(0, 10)) {
        requirements.push({
          requirementId: `${review.reviewId}-req-${requirements.length + 1}`,
          reviewId: review.reviewId,
          sourceFileId: file.fileId,
          sourceFileName: file.fileName,
          normalizedText: line,
          category: buildRequirementCategory(line, file.logicalCategory),
          criticality:
            /must|required|critical|mandatory|non-negotiable/i.test(line) ? "High" : "Medium",
          reviewerStatus: "Pending"
        });
      }
    }

    for (const line of lines.slice(0, 12)) {
      if (!/azure|security|network|identity|monitor|backup|recovery|cost|pricing|service/i.test(line)) {
        continue;
      }

      evidence.push({
        evidenceId: `${review.reviewId}-ev-${evidence.length + 1}`,
        reviewId: review.reviewId,
        sourceFileId: file.fileId,
        sourceFileName: file.fileName,
        factType: buildRequirementCategory(line, "Architecture"),
        summary: line,
        sourceExcerpt: line,
        confidence: supportsTextExtraction(file.fileName) ? "Medium" : "Low"
      });
    }
  }

  if (requirements.length === 0) {
    requirements.push({
      requirementId: `${review.reviewId}-req-1`,
      reviewId: review.reviewId,
      sourceFileId: null,
      sourceFileName: null,
      normalizedText: `${review.projectName} requires a grounded Azure review package before final board sign-off.`,
      category: "Architecture",
      criticality: "High",
      reviewerStatus: "Pending"
    });
  }

  return {
    requirements: uniqueBy(requirements, (item) => `${item.sourceFileId}:${item.normalizedText}`),
    evidence: uniqueBy(evidence, (item) => `${item.sourceFileId}:${item.summary}`)
  };
}

function buildReviewContextForCopilot(review, files, requirements, evidence, findings, scorecard, actions) {
  return {
    review: {
      id: review.reviewId,
      name: review.projectName,
      audience: review.assignedReviewer || review.createdBy || "Architecture Review Board",
      businessScope: review.notes || `${review.projectName} architecture review package`,
      targetRegions: []
    },
    services: [],
    findings: findings.map((finding) => ({
      guid: finding.findingId,
      serviceName: finding.domain,
      finding: finding.findingStatement,
      severity: finding.severity,
      decision: finding.status,
      comments: finding.reviewerNote || finding.recommendation,
      owner: finding.owner || finding.suggestedOwner,
      dueDate: finding.dueDate || finding.suggestedDueDate
    })),
    sources: [
      ...files.map((file) => ({
        label: file.fileName,
        note: `${file.logicalCategory} · ${file.extractionStatus}`
      })),
      {
        label: `${requirements.length} normalized requirements`,
        note: `${evidence.length} evidence facts · ${actions.length} actions · ${scorecard.overallScore ?? "TBD"} score`
      }
    ]
  };
}

function getPartitionKey(reviewId) {
  return encodeTableKey(reviewId);
}

function buildDefaultReview(reviewId, principal, input = {}) {
  const now = new Date().toISOString();
  const architectName = String(input.architectName ?? "").trim() || principal.userDetails || principal.userId;
  const readiness = buildReadinessFromFiles([]);

  return {
    reviewId,
    projectName: String(input.projectName ?? "").trim() || "Sample ARB Review",
    customerName: String(input.customerName ?? "").trim() || "Contoso",
    architectName,
    createdBy: architectName,
    createdByUserId: principal.userId,
    createdAt: now,
    workflowState: "Review In Progress",
    evidenceReadinessState: "Ready with Gaps",
    assignedReviewer: input.assignedReviewer
      ? String(input.assignedReviewer).trim()
      : (principal.userDetails || principal.userId || null),
    targetReviewDate: normalizeNullableString(input.targetReviewDate),
    notes: normalizeNullableString(input.notes),
    overallScore: Number.isFinite(Number(input.overallScore)) ? Number(input.overallScore) : null,
    recommendation: String(input.recommendation ?? "").trim() || "Needs Revision",
    finalDecision: input.finalDecision ? String(input.finalDecision).trim() : null,
    requiredEvidencePresent: readiness.requiredEvidencePresent,
    recommendedEvidenceCoverage: readiness.recommendedEvidenceCoverage,
    missingRequiredItems: readiness.missingRequiredItems,
    missingRecommendedItems: readiness.missingRecommendedItems,
    readinessOutcome: readiness.readinessOutcome,
    readinessNotes: readiness.readinessNotes,
    documentCount: 0,
    lastUpdated: now
  };
}

function buildDefaultFindings(review) {
  return [
    {
      findingId: `${review.reviewId}-find-001`,
      reviewId: review.reviewId,
      severity: "High",
      domain: "Security",
      findingType: "Best Practice Missing",
      title: `${review.projectName}: boundary control pattern not yet explicit`,
      findingStatement:
        "The current design does not yet document an explicit boundary control pattern for internet-facing access.",
      whyItMatters:
        "Unclear edge and boundary controls increase security and governance risk during design review.",
      evidenceFound: [],
      missingEvidence: ["No explicit WAF, APIM, or access restriction statement found yet."],
      recommendation:
        "Document a clear ingress and boundary protection pattern before final approval.",
      references: [],
      confidence: "Medium",
      criticalBlocker: false,
      suggestedOwner: "Security Architect",
      suggestedDueDate: null,
      owner: null,
      dueDate: null,
      reviewerNote: null,
      status: "Open"
    },
    {
      findingId: `${review.reviewId}-find-002`,
      reviewId: review.reviewId,
      severity: "Medium",
      domain: "Operational Excellence",
      findingType: "Improvement Opportunity",
      title: `${review.projectName}: runbook ownership needs clarification`,
      findingStatement:
        "The design package does not clearly assign operational ownership for deployment and incident procedures.",
      whyItMatters:
        "Unclear ownership slows incident response and weakens operational readiness.",
      evidenceFound: [],
      missingEvidence: ["No named runbook owner or support handoff model documented."],
      recommendation:
        "Assign an operational owner and define the runbook accountability model.",
      references: [],
      confidence: "Medium",
      criticalBlocker: false,
      suggestedOwner: "Platform Lead",
      suggestedDueDate: null,
      owner: null,
      dueDate: null,
      reviewerNote: null,
      status: "Open"
    }
  ];
}

function isActiveFinding(finding) {
  return finding.status !== "Closed" && finding.status !== "Not Applicable";
}

function normalizeNullableString(value) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

function buildDefaultScorecard(review) {
  return {
    overallScore: review.overallScore,
    recommendation: review.recommendation,
    confidence: "Medium",
    criticalBlockers: 0,
    domainScores: [
      {
        domain: "Requirements Coverage",
        weight: 20,
        score: 16,
        reason: "Baseline requirement mapping scaffold.",
        linkedFindings: []
      },
      {
        domain: "Security",
        weight: 20,
        score: 12,
        reason: "Security rationale scaffold.",
        linkedFindings: [`${review.reviewId}-find-001`]
      },
      {
        domain: "Operational Excellence",
        weight: 20,
        score: 16,
        reason: "Operational ownership still needs explicit assignment.",
        linkedFindings: [`${review.reviewId}-find-002`]
      },
      {
        domain: "Reliability And Resilience",
        weight: 20,
        score: 18,
        reason: "No critical reliability blockers have been identified in the current scaffold.",
        linkedFindings: []
      },
      {
        domain: "Documentation Completeness",
        weight: 20,
        score: 16,
        reason: "The review package is usable, but still has evidence and clarity gaps to close.",
        linkedFindings: []
      }
    ],
    evidenceReadinessState: review.evidenceReadinessState,
    reviewerOverride: null
  };
}

function buildDefaultActions() {
  return [];
}

function toSummaryEntity(review) {
  const {
    missingRequiredItems,
    missingRecommendedItems,
    ...persistableReview
  } = review;

  return {
    partitionKey: getPartitionKey(review.reviewId),
    rowKey: getRowKey(SUMMARY_ROW_KEY, review.createdByUserId),
    ...persistableReview,
    assignedReviewer: review.assignedReviewer ?? "",
    finalDecision: review.finalDecision ?? "",
    targetReviewDate: review.targetReviewDate ?? "",
    notes: review.notes ?? "",
    missingRequiredItemsJson: JSON.stringify(missingRequiredItems ?? []),
    missingRecommendedItemsJson: JSON.stringify(missingRecommendedItems ?? [])
  };
}

function toFilesEntity(reviewId, userId, files) {
  return {
    partitionKey: getPartitionKey(reviewId),
    rowKey: getRowKey(FILES_ROW_KEY, userId),
    reviewId,
    createdByUserId: userId,
    filesJson: JSON.stringify(files),
    lastUpdated: new Date().toISOString()
  };
}

function toExtractionEntity(reviewId, userId, extraction) {
  return {
    partitionKey: getPartitionKey(reviewId),
    rowKey: getRowKey(EXTRACTION_ROW_KEY, userId),
    reviewId,
    createdByUserId: userId,
    extractionJson: JSON.stringify(extraction),
    lastUpdated: new Date().toISOString()
  };
}

function toRequirementsEntity(reviewId, userId, requirements) {
  return {
    partitionKey: getPartitionKey(reviewId),
    rowKey: getRowKey(REQUIREMENTS_ROW_KEY, userId),
    reviewId,
    createdByUserId: userId,
    requirementsJson: JSON.stringify(requirements),
    lastUpdated: new Date().toISOString()
  };
}

function toEvidenceEntity(reviewId, userId, evidence) {
  return {
    partitionKey: getPartitionKey(reviewId),
    rowKey: getRowKey(EVIDENCE_ROW_KEY, userId),
    reviewId,
    createdByUserId: userId,
    evidenceJson: JSON.stringify(evidence),
    lastUpdated: new Date().toISOString()
  };
}

function toExportsEntity(reviewId, userId, exportsList) {
  return {
    partitionKey: getPartitionKey(reviewId),
    rowKey: getRowKey(EXPORTS_ROW_KEY, userId),
    reviewId,
    createdByUserId: userId,
    exportsJson: JSON.stringify(exportsList),
    lastUpdated: new Date().toISOString()
  };
}

function toFindingsEntity(reviewId, userId, findings) {
  return {
    partitionKey: getPartitionKey(reviewId),
    rowKey: getRowKey(FINDINGS_ROW_KEY, userId),
    reviewId,
    createdByUserId: userId,
    findingsJson: JSON.stringify(findings),
    lastUpdated: new Date().toISOString()
  };
}

function toScorecardEntity(reviewId, userId, scorecard) {
  return {
    partitionKey: getPartitionKey(reviewId),
    rowKey: getRowKey(SCORECARD_ROW_KEY, userId),
    reviewId,
    createdByUserId: userId,
    overallScore: scorecard.overallScore ?? null,
    recommendation: scorecard.recommendation,
    confidence: scorecard.confidence,
    criticalBlockers: scorecard.criticalBlockers ?? 0,
    domainScoresJson: JSON.stringify(scorecard.domainScores ?? []),
    lastUpdated: new Date().toISOString()
  };
}

function toDecisionEntity(reviewId, userId, decision) {
  return {
    partitionKey: getPartitionKey(reviewId),
    rowKey: getRowKey(DECISION_ROW_KEY, userId),
    reviewId,
    createdByUserId: userId,
    aiRecommendation: decision.aiRecommendation,
    reviewerDecision: decision.reviewerDecision,
    rationale: decision.rationale,
    reviewerName: decision.reviewerName ?? null,
    reviewerRole: decision.reviewerRole ?? null,
    recordedAt: decision.recordedAt
  };
}

function toActionsEntity(reviewId, userId, actions) {
  return {
    partitionKey: getPartitionKey(reviewId),
    rowKey: getRowKey(ACTIONS_ROW_KEY, userId),
    reviewId,
    createdByUserId: userId,
    actionsJson: JSON.stringify(actions),
    lastUpdated: new Date().toISOString()
  };
}

function fromSummaryEntity(entity) {
  if (!entity) {
    return null;
  }

  return {
    reviewId: entity.reviewId,
    projectName: entity.projectName,
    customerName: entity.customerName,
    architectName: entity.architectName || null,
    createdBy: entity.createdBy || null,
    createdByUserId: entity.createdByUserId,
    createdAt: entity.createdAt,
    workflowState: entity.workflowState,
    evidenceReadinessState: entity.evidenceReadinessState,
    assignedReviewer: entity.assignedReviewer || null,
    targetReviewDate: entity.targetReviewDate || null,
    notes: entity.notes || null,
    overallScore: entity.overallScore != null ? Number(entity.overallScore) : null,
    recommendation: entity.recommendation,
    finalDecision: entity.finalDecision || null,
    requiredEvidencePresent: Boolean(entity.requiredEvidencePresent),
    recommendedEvidenceCoverage: Number(entity.recommendedEvidenceCoverage ?? 0),
    missingRequiredItems: entity.missingRequiredItemsJson ? JSON.parse(entity.missingRequiredItemsJson) : [],
    missingRecommendedItems: entity.missingRecommendedItemsJson
      ? JSON.parse(entity.missingRecommendedItemsJson)
      : [],
    readinessOutcome: entity.readinessOutcome || entity.evidenceReadinessState,
    readinessNotes: entity.readinessNotes || null,
    documentCount: Number(entity.documentCount ?? 0),
    lastUpdated: entity.lastUpdated
  };
}

function fromFilesEntity(entity) {
  if (!entity?.filesJson) {
    return [];
  }

  return JSON.parse(entity.filesJson);
}

function fromFindingsEntity(entity, reviewId) {
  if (!entity?.findingsJson) {
    return buildDefaultFindings({ reviewId, projectName: "Sample ARB Review" });
  }

  return JSON.parse(entity.findingsJson);
}

function fromScorecardEntity(entity, review) {
  if (!entity) {
    return buildDefaultScorecard(review);
  }

  return {
    overallScore: entity.overallScore != null ? Number(entity.overallScore) : (review.overallScore ?? null),
    recommendation: entity.recommendation || review.recommendation,
    confidence: entity.confidence || "Medium",
    criticalBlockers: Number(entity.criticalBlockers ?? 0),
    domainScores: entity.domainScoresJson ? JSON.parse(entity.domainScoresJson) : [],
    evidenceReadinessState: entity.evidenceReadinessState || review.evidenceReadinessState,
    reviewerOverride: entity.reviewerOverrideJson ? JSON.parse(entity.reviewerOverrideJson) : null,
    reviewSummary: entity.reviewSummary || null,
    strengths: entity.strengthsJson ? JSON.parse(entity.strengthsJson) : [],
    missingEvidence: entity.missingEvidenceJson ? JSON.parse(entity.missingEvidenceJson) : [],
    criticalBlockersList: entity.criticalBlockersJson ? JSON.parse(entity.criticalBlockersJson) : [],
    nextActions: entity.nextActionsJson ? JSON.parse(entity.nextActionsJson) : []
  };
}

function fromActionsEntity(entity) {
  if (!entity?.actionsJson) {
    return buildDefaultActions();
  }

  return JSON.parse(entity.actionsJson);
}

function fromExtractionEntity(entity, review) {
  if (!entity?.extractionJson) {
    return buildDefaultExtractionStatus(review);
  }

  return JSON.parse(entity.extractionJson);
}

function fromRequirementsEntity(entity) {
  if (!entity?.requirementsJson) {
    return buildDefaultRequirements();
  }

  return JSON.parse(entity.requirementsJson);
}

function fromEvidenceEntity(entity) {
  if (!entity?.evidenceJson) {
    return buildDefaultEvidence();
  }

  return JSON.parse(entity.evidenceJson);
}

function fromExportsEntity(entity) {
  if (!entity?.exportsJson) {
    return buildDefaultExports();
  }

  return JSON.parse(entity.exportsJson);
}

function buildActionId(reviewId, actions) {
  return `${reviewId}-action-${String(actions.length + 1).padStart(3, "0")}`;
}

function calculateDomainScore(domain, weight, findings, review) {
  const linkedFindings = findings.filter(
    (finding) => finding.domain === domain && isActiveFinding(finding)
  );

  if (domain === "Requirements Coverage") {
    return {
      domain,
      weight,
      score: review.evidenceReadinessState === "Ready for Review" ? 18 : 16,
      reason:
        review.evidenceReadinessState === "Ready for Review"
          ? "Evidence is ready for review and requirement coverage is broadly documented."
          : "Most explicit requirements were mapped, but some evidence still needs clarification.",
      linkedFindings: linkedFindings.map((finding) => finding.findingId)
    };
  }

  if (linkedFindings.length === 0) {
    return {
      domain,
      weight,
      score: 16,
      reason: `No active ${domain.toLowerCase()} blockers are currently open in this scaffold.`,
      linkedFindings: []
    };
  }

  const penalty = linkedFindings.reduce((total, finding) => {
    if (finding.severity === "Critical") {
      return total + 8;
    }

    if (finding.severity === "High") {
      return total + 6;
    }

    if (finding.severity === "Medium") {
      return total + 4;
    }

    return total + 2;
  }, 0);

  const hasCriticalBlocker = linkedFindings.some((f) => f.criticalBlocker && isActiveFinding(f));
  const minScore = hasCriticalBlocker ? 0 : Math.round(weight * 0.1);

  return {
    domain,
    weight,
    score: Math.max(minScore, weight - penalty),
    reason: `${linkedFindings.length} active finding${linkedFindings.length === 1 ? "" : "s"} currently influence this domain.`,
    linkedFindings: linkedFindings.map((finding) => finding.findingId)
  };
}

function buildDerivedScorecard(review, findings, decision) {
  const domainDefinitions = [
    ["Requirements Coverage", 20],
    ["Security", 20],
    ["Operational Excellence", 20],
    ["Reliability And Resilience", 20],
    ["Documentation Completeness", 20]
  ];
  const domainScores = domainDefinitions.map(([domain, weight]) =>
    calculateDomainScore(domain, weight, findings, review)
  );
  const overallScore = domainScores.reduce((total, domainScore) => total + domainScore.score, 0);
  const criticalBlockers = findings.filter(
    (finding) => finding.criticalBlocker && isActiveFinding(finding)
  ).length;

  let recommendation = "Needs Revision";
  let confidence = "Medium";

  const readiness = review.evidenceReadinessState;
  if (readiness === "Insufficient Evidence" || overallScore < 55) {
    recommendation = "Rejected";
    confidence = "Low";
  } else if (criticalBlockers > 0 || overallScore < 70) {
    recommendation = "Needs Revision";
    confidence = "Medium";
  } else if (overallScore >= 85 && (readiness === "Ready for Review" || readiness === "Ready with Gaps")) {
    recommendation = "Approved";
    confidence = readiness === "Ready for Review" ? "High" : "Medium";
  } else if (overallScore >= 70 && (readiness === "Ready for Review" || readiness === "Ready with Gaps")) {
    recommendation = "Needs Revision";
    confidence = "Medium";
  }

  return {
    reviewId: review.reviewId,
    overallScore,
    recommendation,
    confidence,
    criticalBlockers,
    evidenceReadinessState: review.evidenceReadinessState,
    domainScores,
    reviewerOverride: decision
      ? {
          reviewerName: review.assignedReviewer || review.createdBy || review.createdByUserId,
          overrideDecision: decision.reviewerDecision,
          overrideRationale: decision.rationale,
          overriddenAt: decision.recordedAt
        }
      : null
  };
}

async function getEntity(client, reviewId, rowKey) {
  try {
    return await client.getEntity(getPartitionKey(reviewId), rowKey);
  } catch (error) {
    if (error?.statusCode === 404) {
      return null;
    }

    throw error;
  }
}

async function getOwnedSummaryEntity(client, principal, reviewId) {
  const entity = await getEntity(client, reviewId, getRowKey(SUMMARY_ROW_KEY, principal.userId));

  if (!entity) {
    return null;
  }

  return entity;
}

async function seedDemoReview(client, principal, reviewId) {
  const review = buildDefaultReview(reviewId, principal, {});
  const findings = buildDefaultFindings(review);
  const scorecard = buildDefaultScorecard(review);
  const actions = buildDefaultActions();
  const extraction = buildDefaultExtractionStatus(review);

  await client.upsertEntity(toSummaryEntity(review), "Replace");
  await client.upsertEntity(toFindingsEntity(reviewId, principal.userId, findings), "Replace");
  await client.upsertEntity(toScorecardEntity(reviewId, principal.userId, scorecard), "Replace");
  await client.upsertEntity(toActionsEntity(reviewId, principal.userId, actions), "Replace");
  await client.upsertEntity(toFilesEntity(reviewId, principal.userId, []), "Replace");
  await client.upsertEntity(toExtractionEntity(reviewId, principal.userId, extraction), "Replace");
  await client.upsertEntity(toRequirementsEntity(reviewId, principal.userId, []), "Replace");
  await client.upsertEntity(toEvidenceEntity(reviewId, principal.userId, []), "Replace");
  await client.upsertEntity(toExportsEntity(reviewId, principal.userId, []), "Replace");

  return review;
}

async function listArbReviews(principal, options = {}) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const reviews = [];
  const targetRowKey = getRowKey(SUMMARY_ROW_KEY, principal.userId);

  for await (const entity of client.listEntities({
    queryOptions: { filter: `RowKey eq '${targetRowKey}'` }
  })) {
    reviews.push(fromSummaryEntity(entity));
  }

  reviews.sort((left, right) => String(right.lastUpdated ?? "").localeCompare(String(left.lastUpdated ?? "")));

  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const total = reviews.length;
  const page = reviews.slice(offset, offset + limit);

  return {
    reviews: page,
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  };
}

async function createArbReview(principal, input = {}) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const baseId = input.reviewId || input.projectCode || input.projectName || "demo-review";
  const reviewId = input.projectCode
    ? normalizeReviewId(`arb-${baseId}`, "demo-review")
    : normalizeReviewId(baseId, "demo-review");
  const existing = await getEntity(client, reviewId, getRowKey(SUMMARY_ROW_KEY, principal.userId));

  if (existing) {
    throw createHttpError(409, `ARB review ${reviewId} already exists.`);
  }

  const review = buildDefaultReview(reviewId, principal, input);
  const findings = buildDefaultFindings(review);
  const scorecard = buildDefaultScorecard(review);
  const extraction = buildDefaultExtractionStatus(review);

  await client.upsertEntity(toSummaryEntity(review), "Replace");
  await client.upsertEntity(toFindingsEntity(reviewId, principal.userId, findings), "Replace");
  await client.upsertEntity(toScorecardEntity(reviewId, principal.userId, scorecard), "Replace");
  await client.upsertEntity(toFilesEntity(reviewId, principal.userId, []), "Replace");
  await client.upsertEntity(toExtractionEntity(reviewId, principal.userId, extraction), "Replace");
  await client.upsertEntity(toRequirementsEntity(reviewId, principal.userId, []), "Replace");
  await client.upsertEntity(toEvidenceEntity(reviewId, principal.userId, []), "Replace");
  await client.upsertEntity(toExportsEntity(reviewId, principal.userId, []), "Replace");

  return review;
}

async function getArbFiles(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return getArbFiles(principal, reviewId);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const filesEntity = await getEntity(client, reviewId, getRowKey(FILES_ROW_KEY, principal.userId));
  return fromFilesEntity(filesEntity);
}

async function uploadArbFiles(principal, reviewId, filesInput = []) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return uploadArbFiles(principal, reviewId, filesInput);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const MAX_FILES_PER_REVIEW = 30;
  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;  // 50 MB per file
  const MAX_TOTAL_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB per review

  const files = Array.isArray(filesInput) ? filesInput : [];

  if (files.length === 0) {
    throw createHttpError(400, "At least one upload file is required.");
  }

  const existingFilesEntity = await getEntity(client, reviewId, getRowKey(FILES_ROW_KEY, principal.userId));
  const existingFiles = fromFilesEntity(existingFilesEntity);

  if (existingFiles.length + files.length > MAX_FILES_PER_REVIEW) {
    throw createHttpError(400, `Upload limit reached. A review may contain at most ${MAX_FILES_PER_REVIEW} files.`);
  }

  const existingTotalBytes = existingFiles.reduce((sum, f) => sum + (f.sizeBytes ?? 0), 0);
  const incomingTotalBytes = files.reduce((sum, f) => sum + (Buffer.isBuffer(f.contentBuffer) ? f.contentBuffer.byteLength : 0), 0);

  if (existingTotalBytes + incomingTotalBytes > MAX_TOTAL_SIZE_BYTES) {
    throw createHttpError(400, `Total upload size would exceed the ${MAX_TOTAL_SIZE_BYTES / (1024 * 1024)} MB review limit.`);
  }

  const inputContainer = await getContainerClient(ARB_INPUT_CONTAINER_NAME);
  const now = new Date().toISOString();
  const persistedFiles = [];

  for (const file of files) {
    const fileName = sanitizeFilename(file.fileName);

    if (!isSupportedUpload(fileName)) {
      throw createHttpError(400, `Unsupported file type for ${fileName}.`);
    }

    const contentBuffer = Buffer.isBuffer(file.contentBuffer)
      ? file.contentBuffer
      : Buffer.from(file.contentBuffer || []);

    if (contentBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
      throw createHttpError(400, `File ${fileName} exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB per-file limit.`);
    }

    if (contentBuffer.byteLength === 0) {
      throw createHttpError(400, `File ${fileName} is empty and cannot be uploaded.`);
    }
    const contentHash = `sha256:${crypto.createHash("sha256").update(contentBuffer).digest("hex")}`;
    const logicalCategory = normalizeLogicalCategory(file.logicalCategory, inferLogicalCategory(fileName));

    if (
      existingFiles.some(
        (existing) => existing.fileName === fileName && existing.contentHash === contentHash
      )
    ) {
      continue;
    }

    const fileId = buildFileId(reviewId, fileName, contentHash.replace(/^sha256:/, ""));
    const blobPath = buildBlobPath(principal.userId, reviewId, fileName);
    const contentType = file.contentType || "application/octet-stream";

    await uploadBinaryBlob(inputContainer, blobPath, contentBuffer, contentType);

    persistedFiles.push({
      fileId,
      reviewId,
      fileName,
      fileType: getFileExtension(fileName).replace(/^\./, "") || "bin",
      logicalCategory,
      blobPath,
      uploadedBy: principal.userDetails || principal.userId,
      uploadedAt: now,
      contentHash,
      extractionStatus: (supportsTextExtraction(fileName) || supportsSpreadsheetExtraction(fileName) || supportsImageExtraction(fileName) || supportsDocumentIntelligenceExtraction(fileName)) ? "Pending" : "Limited Evidence",
      extractionError: null,
      sourceRole: normalizeNullableString(file.sourceRole) || inferSourceRole(logicalCategory),
      sizeBytes: contentBuffer.byteLength,
      contentType,
      supportedTextExtraction: supportsTextExtraction(fileName) || supportsSpreadsheetExtraction(fileName) || supportsImageExtraction(fileName) || supportsDocumentIntelligenceExtraction(fileName)
    });
  }

  const nextFiles = [...existingFiles, ...persistedFiles];
  const readiness = buildReadinessFromFiles(nextFiles);
  const nextEvidenceState =
    readiness.readinessOutcome === "Ready for Review"
      ? "Ready for Review"
      : readiness.readinessOutcome === "Insufficient Evidence"
        ? "Insufficient Evidence"
        : "Ready with Gaps";

  await client.upsertEntity(toFilesEntity(reviewId, principal.userId, nextFiles), "Replace");
  await client.upsertEntity(
    {
      partitionKey: getPartitionKey(reviewId),
      rowKey: getRowKey(SUMMARY_ROW_KEY, principal.userId),
      workflowState: nextFiles.length > 0 ? "Evidence Ready" : "Draft",
      evidenceReadinessState: nextEvidenceState,
      requiredEvidencePresent: readiness.requiredEvidencePresent,
      recommendedEvidenceCoverage: readiness.recommendedEvidenceCoverage,
      readinessOutcome: readiness.readinessOutcome,
      readinessNotes: readiness.readinessNotes,
      missingRequiredItemsJson: JSON.stringify(readiness.missingRequiredItems),
      missingRecommendedItemsJson: JSON.stringify(readiness.missingRecommendedItems),
      documentCount: nextFiles.length,
      lastUpdated: now
    },
    "Merge"
  );

  return {
    files: nextFiles,
    addedCount: persistedFiles.length,
    evidenceReadinessState: nextEvidenceState,
    readiness
  };
}

async function deleteArbFile(principal, reviewId, fileId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const filesEntity = await getEntity(client, reviewId, getRowKey(FILES_ROW_KEY, principal.userId));
  const existingFiles = fromFilesEntity(filesEntity);
  const fileToDelete = existingFiles.find((f) => f.fileId === fileId);

  if (!fileToDelete) {
    throw createHttpError(404, `File ${fileId} was not found in review ${reviewId}.`);
  }

  const nextFiles = existingFiles.filter((f) => f.fileId !== fileId);

  if (fileToDelete.blobPath) {
    const inputContainer = await getContainerClient(ARB_INPUT_CONTAINER_NAME);
    const { deleteBlobIfExists } = require("./storage");
    await deleteBlobIfExists(inputContainer, fileToDelete.blobPath);
  }

  await client.upsertEntity(toFilesEntity(reviewId, principal.userId, nextFiles), "Replace");

  const readiness = buildReadinessFromFiles(nextFiles);
  const nextEvidenceState =
    readiness.readinessOutcome === "Ready for Review"
      ? "Ready for Review"
      : readiness.readinessOutcome === "Insufficient Evidence"
        ? "Insufficient Evidence"
        : "Ready with Gaps";

  await client.upsertEntity(
    {
      partitionKey: getPartitionKey(reviewId),
      rowKey: getRowKey(SUMMARY_ROW_KEY, principal.userId),
      workflowState: nextFiles.length > 0 ? "Evidence Ready" : "Draft",
      evidenceReadinessState: nextEvidenceState,
    },
    "Merge"
  );

  return { deletedFileId: fileId, remainingCount: nextFiles.length };
}

async function startArbExtraction(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const review = await getArbReview(principal, reviewId);
  const files = await getArbFiles(principal, reviewId);

  if (files.length === 0) {
    throw createHttpError(400, "Upload files before starting extraction.");
  }

  const inputContainer = await getContainerClient(ARB_INPUT_CONTAINER_NAME);
  const jobId = `${reviewId}-extract-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const nextFiles = [];
  const extractionErrors = [];
  const fileTexts = new Map();
  let searchIndexed = false;

  if (getSearchConfiguration().configured) {
    try {
      await ensureArbSearchIndex();
      searchIndexed = true;
    } catch {
      // Search indexing is best-effort; extraction continues without it
    }
  }

  const visionAvailable = getFoundryConfiguration().configured;

  for (const file of files) {
    const isSpreadsheet = supportsSpreadsheetExtraction(file.fileName);
    const isImage = supportsImageExtraction(file.fileName);

    // ── Spreadsheet extraction via SheetJS ──────────────────────────────────
    if (isSpreadsheet) {
      try {
        const buffer = await readBinaryBlob(inputContainer, file.blobPath);

        if (!buffer || buffer.length === 0) {
          nextFiles.push({
            ...file,
            extractionStatus: "Failed",
            extractionError: "Spreadsheet file could not be read from storage."
          });
          extractionErrors.push(`${file.fileName}: empty blob.`);
          continue;
        }

        const text = extractSpreadsheetText(buffer);

        if (!text || !text.trim()) {
          nextFiles.push({
            ...file,
            extractionStatus: "Failed",
            extractionError: "No data rows could be extracted from the spreadsheet."
          });
          extractionErrors.push(`${file.fileName}: no data rows found.`);
          continue;
        }

        fileTexts.set(file.fileId, text);
        nextFiles.push({ ...file, extractionStatus: "Completed", extractionError: null });

        if (searchIndexed) {
          indexArbDocumentChunks(reviewId, file.fileId, file.fileName, file.logicalCategory, text).catch(() => {});
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown spreadsheet extraction error.";
        nextFiles.push({ ...file, extractionStatus: "Failed", extractionError: message });
        extractionErrors.push(`${file.fileName}: ${message}`);
      }
      continue;
    }

    // ── Image description via multimodal vision ──────────────────────────────
    if (isImage) {
      if (!visionAvailable) {
        nextFiles.push({
          ...file,
          extractionStatus: "Limited Evidence",
          extractionError: "Vision analysis requires FOUNDRY_PROJECT_ENDPOINT to be configured."
        });
        continue;
      }

      try {
        const buffer = await readBinaryBlob(inputContainer, file.blobPath);

        if (!buffer || buffer.length === 0) {
          nextFiles.push({
            ...file,
            extractionStatus: "Failed",
            extractionError: "Image file could not be read from storage."
          });
          extractionErrors.push(`${file.fileName}: empty blob.`);
          continue;
        }

        const description = await describeImageForReview(buffer, file.fileName, getFileExtension(file.fileName));

        if (!description || !description.trim()) {
          nextFiles.push({
            ...file,
            extractionStatus: "Failed",
            extractionError: "Vision model returned no description for the image."
          });
          extractionErrors.push(`${file.fileName}: vision returned empty response.`);
          continue;
        }

        const text = `[Architecture diagram: ${file.fileName}]\n\n${description}`;
        fileTexts.set(file.fileId, text);
        nextFiles.push({ ...file, extractionStatus: "Completed", extractionError: null });

        if (searchIndexed) {
          indexArbDocumentChunks(reviewId, file.fileId, file.fileName, file.logicalCategory, text).catch(() => {});
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown image analysis error.";
        nextFiles.push({ ...file, extractionStatus: "Failed", extractionError: message });
        extractionErrors.push(`${file.fileName}: ${message}`);
      }
      continue;
    }

    // ── Azure AI Document Intelligence (PDF, DOCX, PPTX, DOC, PPT) ─────────
    if (supportsDocumentIntelligenceExtraction(file.fileName)) {
      const diConfig = getDocumentIntelligenceConfiguration();

      if (!diConfig.configured) {
        // DI not configured — mark as Limited Evidence with a helpful message
        nextFiles.push({
          ...file,
          extractionStatus: "Limited Evidence",
          extractionError:
            "Azure AI Document Intelligence is not configured (AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT missing). " +
            "Text extraction is unavailable for this file format."
        });
        continue;
      }

      try {
        const buffer = await readBinaryBlob(inputContainer, file.blobPath);

        if (!buffer || buffer.length === 0) {
          nextFiles.push({
            ...file,
            extractionStatus: "Failed",
            extractionError: "Document file could not be read from storage."
          });
          extractionErrors.push(`${file.fileName}: empty blob.`);
          continue;
        }

        const text = await extractDocumentText(buffer, file.contentType, file.fileName);

        if (!text || !text.trim()) {
          nextFiles.push({
            ...file,
            extractionStatus: "Failed",
            extractionError: "Azure AI Document Intelligence returned no text for this document."
          });
          extractionErrors.push(`${file.fileName}: Document Intelligence returned no text.`);
          continue;
        }

        fileTexts.set(file.fileId, text);
        nextFiles.push({ ...file, extractionStatus: "Completed", extractionError: null });

        if (searchIndexed) {
          indexArbDocumentChunks(reviewId, file.fileId, file.fileName, file.logicalCategory, text).catch(() => {});
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Document Intelligence error.";
        nextFiles.push({ ...file, extractionStatus: "Failed", extractionError: message });
        extractionErrors.push(`${file.fileName}: ${message}`);
      }
      continue;
    }

    // ── Plain-text extraction (existing path) ────────────────────────────────
    if (!file.supportedTextExtraction) {
      nextFiles.push({
        ...file,
        extractionStatus: "Limited Evidence",
        extractionError:
          file.extractionError ||
          "File is stored successfully but needs a richer text extraction worker for this format."
      });
      continue;
    }

    try {
      const text = await readTextBlob(inputContainer, file.blobPath);

      if (!text || !text.trim()) {
        nextFiles.push({
          ...file,
          extractionStatus: "Failed",
          extractionError: "No readable text could be extracted from the uploaded file."
        });
        extractionErrors.push(`${file.fileName}: no readable text could be extracted.`);
        continue;
      }

      fileTexts.set(file.fileId, text);
      nextFiles.push({
        ...file,
        extractionStatus: "Completed",
        extractionError: null
      });

      // Index text chunks into Azure AI Search (best-effort)
      if (searchIndexed) {
        indexArbDocumentChunks(reviewId, file.fileId, file.fileName, file.logicalCategory, text).catch(() => {});
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown extraction error.";
      nextFiles.push({
        ...file,
        extractionStatus: "Failed",
        extractionError: message
      });
      extractionErrors.push(`${file.fileName}: ${message}`);
    }
  }

  const derived = deriveRequirementsAndEvidence(review, nextFiles, fileTexts);
  const completedAt = new Date().toISOString();
  const readiness = buildReadinessFromFiles(nextFiles);
  const evidenceReadinessState =
    derived.requirements.length > 0 && readiness.requiredEvidencePresent
      ? readiness.missingRecommendedItems.length === 0
        ? "Ready for Review"
        : "Ready with Gaps"
      : "Insufficient Evidence";
  const extractionState = extractionErrors.length > 0 ? "Completed with Issues" : "Completed";
  const findingsEntity = await getEntity(client, reviewId, getRowKey(FINDINGS_ROW_KEY, principal.userId));
  const actionsEntity = await getEntity(client, reviewId, getRowKey(ACTIONS_ROW_KEY, principal.userId));
  const exportsEntity = await getEntity(client, reviewId, getRowKey(EXPORTS_ROW_KEY, principal.userId));
  const findings = fromFindingsEntity(findingsEntity, reviewId);
  const actions = fromActionsEntity(actionsEntity);
  const nextReview = {
    ...review,
    workflowState: "Review In Progress",
    evidenceReadinessState,
    requiredEvidencePresent: readiness.requiredEvidencePresent,
    recommendedEvidenceCoverage: readiness.recommendedEvidenceCoverage,
    missingRequiredItems: readiness.missingRequiredItems,
    missingRecommendedItems: readiness.missingRecommendedItems,
    readinessOutcome: readiness.readinessOutcome,
    readinessNotes: readiness.readinessNotes,
    documentCount: nextFiles.length,
    lastUpdated: completedAt
  };
  const scorecard = buildDerivedScorecard(nextReview, findings, null);
  const extraction = {
    reviewId,
    jobId,
    state: extractionState,
    completedSteps: [
      "files-registered",
      "blob-read",
      "requirements-normalized",
      "evidence-normalized",
      ...(searchIndexed ? ["search-indexed"] : [])
    ],
    failedSteps: extractionErrors.length > 0 ? ["text-extraction"] : [],
    evidenceReadinessState,
    extractionErrors,
    lastStartedAt: startedAt,
    lastCompletedAt: completedAt,
    fileStatuses: nextFiles.map((file) => ({
      fileId: file.fileId,
      fileName: file.fileName,
      extractionStatus: file.extractionStatus,
      extractionError: file.extractionError
    }))
  };

  await client.upsertEntity(toFilesEntity(reviewId, principal.userId, nextFiles), "Replace");
  await client.upsertEntity(toRequirementsEntity(reviewId, principal.userId, derived.requirements), "Replace");
  await client.upsertEntity(toEvidenceEntity(reviewId, principal.userId, derived.evidence), "Replace");
  await client.upsertEntity(toExtractionEntity(reviewId, principal.userId, extraction), "Replace");
  await client.upsertEntity(
    {
      ...toScorecardEntity(reviewId, principal.userId, scorecard),
      evidenceReadinessState: scorecard.evidenceReadinessState,
      reviewerOverrideJson: JSON.stringify(scorecard.reviewerOverride)
    },
    "Replace"
  );
  await client.upsertEntity(
    {
      partitionKey: getPartitionKey(reviewId),
      rowKey: getRowKey(SUMMARY_ROW_KEY, principal.userId),
      workflowState: "Review In Progress",
      evidenceReadinessState,
      requiredEvidencePresent: readiness.requiredEvidencePresent,
      recommendedEvidenceCoverage: readiness.recommendedEvidenceCoverage,
      readinessOutcome: readiness.readinessOutcome,
      readinessNotes: readiness.readinessNotes,
      missingRequiredItemsJson: JSON.stringify(readiness.missingRequiredItems),
      missingRecommendedItemsJson: JSON.stringify(readiness.missingRecommendedItems),
      documentCount: nextFiles.length,
      lastUpdated: completedAt
    },
    "Merge"
  );

  const syncedOutputs = await syncArbReviewedOutputs({
    principal,
    review: nextReview,
    files: nextFiles,
    requirements: derived.requirements,
    evidence: derived.evidence,
    findings,
    scorecard,
    actions,
    formats: ["markdown", "csv", "html"],
    generatedAt: completedAt,
    existingExports: fromExportsEntity(exportsEntity)
  });

  await client.upsertEntity(
    toExportsEntity(reviewId, principal.userId, syncedOutputs.exportsList),
    "Replace"
  );

  return extraction;
}

async function getArbExtractionStatus(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const review = await getArbReview(principal, reviewId);
  const extractionEntity = await getEntity(client, reviewId, getRowKey(EXTRACTION_ROW_KEY, principal.userId));
  return fromExtractionEntity(extractionEntity, review);
}

async function getArbRequirements(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return getArbRequirements(principal, reviewId);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const requirementsEntity = await getEntity(
    client,
    reviewId,
    getRowKey(REQUIREMENTS_ROW_KEY, principal.userId)
  );
  return fromRequirementsEntity(requirementsEntity);
}

async function getArbEvidence(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return getArbEvidence(principal, reviewId);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const evidenceEntity = await getEntity(client, reviewId, getRowKey(EVIDENCE_ROW_KEY, principal.userId));
  return fromEvidenceEntity(evidenceEntity);
}

async function listArbExports(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return listArbExports(principal, reviewId);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const exportsEntity = await getEntity(client, reviewId, getRowKey(EXPORTS_ROW_KEY, principal.userId));
  return fromExportsEntity(exportsEntity);
}

async function downloadArbExport(principal, reviewId, exportId) {
  const exportsList = await listArbExports(principal, reviewId);
  const artifact = exportsList.find((candidate) => candidate.exportId === exportId);

  if (!artifact) {
    throw createHttpError(404, `ARB export ${exportId} was not found.`);
  }

  const outputContainer = await getContainerClient(ARB_OUTPUT_CONTAINER_NAME);
  const body = await readTextBlob(outputContainer, artifact.blobPath);

  if (body == null) {
    throw createHttpError(404, `ARB export ${exportId} is missing from blob storage.`);
  }

  return {
    ...artifact,
    body
  };
}

async function createArbExport(principal, reviewId, input = {}) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const review = await getArbReview(principal, reviewId);
  const files = await getArbFiles(principal, reviewId);
  const requirements = await getArbRequirements(principal, reviewId);
  const evidence = await getArbEvidence(principal, reviewId);
  const findings = await getArbFindings(principal, reviewId);
  const actions = await getArbActions(principal, reviewId);
  const scorecard = await getArbScorecard(principal, reviewId);
  const exportsEntity = await getEntity(client, reviewId, getRowKey(EXPORTS_ROW_KEY, principal.userId));
  const exportsList = fromExportsEntity(exportsEntity);
  const format = normalizeExportFormat(input.format);
  const syncedOutputs = await syncArbReviewedOutputs({
    principal,
    review: {
      ...review,
      documentCount: files.length
    },
    files,
    requirements,
    evidence,
    findings,
    scorecard,
    actions,
    formats: [format],
    generatedAt: new Date().toISOString(),
    existingExports: exportsList
  });

  await client.upsertEntity(toExportsEntity(reviewId, principal.userId, syncedOutputs.exportsList), "Replace");
  return syncedOutputs.artifacts[0];
}

async function getArbReview(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  let summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity && reviewId === "demo-review") {
    await seedDemoReview(client, principal, reviewId);
    summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);
  }

  if (!summaryEntity) {
    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  return fromSummaryEntity(summaryEntity);
}

async function getArbFindings(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return getArbFindings(principal, reviewId);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const findingsEntity = await getEntity(client, reviewId, getRowKey(FINDINGS_ROW_KEY, principal.userId));
  return fromFindingsEntity(findingsEntity, reviewId);
}

async function updateArbFinding(principal, reviewId, findingId, input = {}) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return updateArbFinding(principal, reviewId, findingId, input);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const findingsEntity = await getEntity(client, reviewId, getRowKey(FINDINGS_ROW_KEY, principal.userId));
  const findings = fromFindingsEntity(findingsEntity, reviewId);
  const findingIndex = findings.findIndex((finding) => finding.findingId === findingId);

  if (findingIndex === -1) {
    throw createHttpError(404, `ARB finding ${findingId} was not found.`);
  }

  const currentFinding = findings[findingIndex];
  const nextFinding = {
    ...currentFinding,
    status: normalizeNullableString(input.status) || currentFinding.status,
    owner:
      Object.prototype.hasOwnProperty.call(input, "owner")
        ? normalizeNullableString(input.owner)
        : currentFinding.owner ?? null,
    dueDate:
      Object.prototype.hasOwnProperty.call(input, "dueDate")
        ? normalizeNullableString(input.dueDate)
        : currentFinding.dueDate ?? null,
    reviewerNote:
      Object.prototype.hasOwnProperty.call(input, "reviewerNote")
        ? normalizeNullableString(input.reviewerNote)
        : currentFinding.reviewerNote ?? null,
    criticalBlocker:
      typeof input.criticalBlocker === "boolean"
        ? input.criticalBlocker
        : currentFinding.criticalBlocker
  };

  findings[findingIndex] = nextFinding;
  const lastUpdated = new Date().toISOString();

  await client.upsertEntity(toFindingsEntity(reviewId, principal.userId, findings), "Replace");
  await client.upsertEntity(
    {
      partitionKey: getPartitionKey(reviewId),
      rowKey: getRowKey(SUMMARY_ROW_KEY, principal.userId),
      lastUpdated
    },
    "Merge"
  );

  return nextFinding;
}

async function getArbActions(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return getArbActions(principal, reviewId);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const actionsEntity = await getEntity(client, reviewId, getRowKey(ACTIONS_ROW_KEY, principal.userId));
  return fromActionsEntity(actionsEntity);
}

async function createArbAction(principal, reviewId, input = {}) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return createArbAction(principal, reviewId, input);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const sourceFindingId = normalizeNullableString(input.sourceFindingId);

  if (!sourceFindingId) {
    throw createHttpError(400, "A sourceFindingId is required before an ARB action can be created.");
  }

  const findingsEntity = await getEntity(client, reviewId, getRowKey(FINDINGS_ROW_KEY, principal.userId));
  const actionsEntity = await getEntity(client, reviewId, getRowKey(ACTIONS_ROW_KEY, principal.userId));
  const findings = fromFindingsEntity(findingsEntity, reviewId);
  const actions = fromActionsEntity(actionsEntity);
  const sourceFinding = findings.find((finding) => finding.findingId === sourceFindingId);

  if (!sourceFinding) {
    throw createHttpError(404, `ARB finding ${sourceFindingId} was not found.`);
  }

  if (actions.some((action) => action.sourceFindingId === sourceFindingId)) {
    throw createHttpError(409, `An ARB action already exists for finding ${sourceFindingId}.`);
  }

  const action = {
    actionId: buildActionId(reviewId, actions),
    reviewId,
    sourceFindingId,
    actionSummary:
      normalizeNullableString(input.actionSummary) || sourceFinding.recommendation || sourceFinding.title,
    owner:
      normalizeNullableString(input.owner) || sourceFinding.owner || sourceFinding.suggestedOwner || null,
    dueDate: normalizeNullableString(input.dueDate) || sourceFinding.dueDate || sourceFinding.suggestedDueDate || null,
    severity: sourceFinding.severity,
    status: normalizeNullableString(input.status) || "Open",
    closureNotes: normalizeNullableString(input.closureNotes),
    reviewerVerificationRequired:
      typeof input.reviewerVerificationRequired === "boolean"
        ? input.reviewerVerificationRequired
        : Boolean(sourceFinding.criticalBlocker),
    createdAt: new Date().toISOString()
  };

  actions.push(action);

  await client.upsertEntity(toActionsEntity(reviewId, principal.userId, actions), "Replace");
  await client.upsertEntity(
    {
      partitionKey: getPartitionKey(reviewId),
      rowKey: getRowKey(SUMMARY_ROW_KEY, principal.userId),
      lastUpdated: new Date().toISOString()
    },
    "Merge"
  );

  return action;
}

async function updateArbAction(principal, reviewId, actionId, input = {}) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return updateArbAction(principal, reviewId, actionId, input);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const actionsEntity = await getEntity(client, reviewId, getRowKey(ACTIONS_ROW_KEY, principal.userId));
  const actions = fromActionsEntity(actionsEntity);
  const actionIndex = actions.findIndex((action) => action.actionId === actionId);

  if (actionIndex === -1) {
    throw createHttpError(404, `ARB action ${actionId} was not found.`);
  }

  const currentAction = actions[actionIndex];
  const updatedAction = {
    ...currentAction,
    owner:
      Object.prototype.hasOwnProperty.call(input, "owner")
        ? normalizeNullableString(input.owner)
        : currentAction.owner ?? null,
    dueDate:
      Object.prototype.hasOwnProperty.call(input, "dueDate")
        ? normalizeNullableString(input.dueDate)
        : currentAction.dueDate ?? null,
    status: normalizeNullableString(input.status) || currentAction.status,
    closureNotes:
      Object.prototype.hasOwnProperty.call(input, "closureNotes")
        ? normalizeNullableString(input.closureNotes)
        : currentAction.closureNotes ?? null,
    reviewerVerificationRequired:
      typeof input.reviewerVerificationRequired === "boolean"
        ? input.reviewerVerificationRequired
        : currentAction.reviewerVerificationRequired
  };

  actions[actionIndex] = updatedAction;

  await client.upsertEntity(toActionsEntity(reviewId, principal.userId, actions), "Replace");
  await client.upsertEntity(
    {
      partitionKey: getPartitionKey(reviewId),
      rowKey: getRowKey(SUMMARY_ROW_KEY, principal.userId),
      lastUpdated: new Date().toISOString()
    },
    "Merge"
  );

  return updatedAction;
}

async function getArbScorecard(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const review = await getArbReview(principal, reviewId);
  const findingsEntity = await getEntity(client, reviewId, getRowKey(FINDINGS_ROW_KEY, principal.userId));
  const decisionEntity = await getEntity(client, reviewId, getRowKey(DECISION_ROW_KEY, principal.userId));
  const findings = fromFindingsEntity(findingsEntity, reviewId);
  const decision = decisionEntity
    ? {
        aiRecommendation: decisionEntity.aiRecommendation,
        reviewerDecision: decisionEntity.reviewerDecision,
        rationale: decisionEntity.rationale,
        recordedAt: decisionEntity.recordedAt
      }
    : null;
  const derivedScorecard = buildDerivedScorecard(review, findings, decision);

  await client.upsertEntity(
    {
      ...toScorecardEntity(reviewId, principal.userId, derivedScorecard),
      evidenceReadinessState: derivedScorecard.evidenceReadinessState,
      reviewerOverrideJson: JSON.stringify(derivedScorecard.reviewerOverride)
    },
    "Replace"
  );

  return derivedScorecard;
}

async function getArbDecision(principal, reviewId) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return getArbDecision(principal, reviewId);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const decisionEntity = await getEntity(client, reviewId, getRowKey(DECISION_ROW_KEY, principal.userId));

  if (!decisionEntity) {
    return null;
  }

  return {
    aiRecommendation: decisionEntity.aiRecommendation,
    reviewerDecision: decisionEntity.reviewerDecision,
    rationale: decisionEntity.rationale,
    reviewerName: decisionEntity.reviewerName ?? null,
    reviewerRole: decisionEntity.reviewerRole ?? null,
    recordedAt: decisionEntity.recordedAt
  };
}

async function recordArbDecision(principal, reviewId, input = {}) {
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const summaryEntity = await getOwnedSummaryEntity(client, principal, reviewId);

  if (!summaryEntity) {
    if (reviewId === "demo-review") {
      await seedDemoReview(client, principal, reviewId);
      return recordArbDecision(principal, reviewId, input);
    }

    throw createHttpError(404, `ARB review ${reviewId} was not found.`);
  }

  const review = fromSummaryEntity(summaryEntity);
  const recordedAt = new Date().toISOString();
  const decision = {
    aiRecommendation: review.recommendation,
    reviewerDecision: String(input.finalDecision ?? "").trim() || "Needs Revision",
    rationale:
      String(input.rationale ?? "").trim() ||
      "Decision recorded against the persisted ARB review.",
    reviewerName: normalizeNullableString(input.reviewerName) || principal.userDetails || null,
    reviewerRole: normalizeNullableString(input.reviewerRole) || null,
    recordedAt
  };

  await client.upsertEntity(toDecisionEntity(reviewId, principal.userId, decision), "Replace");
  await client.upsertEntity(
    {
      partitionKey: getPartitionKey(reviewId),
      rowKey: getRowKey(SUMMARY_ROW_KEY, principal.userId),
      finalDecision: decision.reviewerDecision,
      workflowState: "Decision Recorded",
      lastUpdated: recordedAt
    },
    "Merge"
  );

  return decision;
}

module.exports = {
  buildDefaultActions,
  buildDefaultEvidence,
  buildDefaultExports,
  buildDefaultFindings,
  buildDefaultExtractionStatus,
  buildDefaultRequirements,
  buildDefaultReview,
  buildDefaultScorecard,
  createArbExport,
  createArbAction,
  createArbReview,
  deleteArbFile,
  downloadArbExport,
  getArbEvidence,
  getArbActions,
  getArbDecision,
  getArbExtractionStatus,
  listArbExports,
  getArbFiles,
  getArbRequirements,
  listArbReviews,
  getArbFindings,
  getArbReview,
  getArbScorecard,
  recordArbDecision,
  startArbExtraction,
  syncArbReviewedOutputs,
  uploadArbFiles,
  updateArbAction,
  updateArbFinding
};
