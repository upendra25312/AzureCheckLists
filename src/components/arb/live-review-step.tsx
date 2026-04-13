"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createArbExport,
  createArbAction,
  deleteArbFile,
  downloadArbExport,
  fetchArbEvidence,
  fetchArbActions,
  fetchArbDecision,
  fetchArbExports,
  fetchArbFindings,
  fetchArbRequirements,
  fetchArbReview,
  fetchArbScorecard,
  fetchArbUploads,
  recordArbDecision,
  runArbAgentReview,
  startArbExtraction,
  uploadArbFiles,
  updateArbAction,
  updateArbFinding
} from "@/arb/api";
import { getArbReviewSteps } from "@/arb/mock-review";
import { getArbStepHref } from "@/arb/routes";
import { ENABLED_AUTH_PROVIDERS, buildLoginUrl } from "@/lib/review-cloud";
import type {
  ArbAction,
  ArbDecision,
  ArbDomainScore,
  ArbEvidenceFact,
  ArbExportArtifact,
  ArbExportFormat,
  ArbFinding,
  ArbExtractionStatus,
  ArbRequirement,
  ArbReviewSummary,
  ArbReviewStepKey,
  ArbScorecard,
  ArbUploadedFile
} from "@/arb/types";
import { ArbPlaceholderPage } from "@/components/arb/placeholder-page";
import { ArbReviewShell } from "@/components/arb/review-shell";
import { SeverityBadge } from "@/components/severity-badge";

const SUPPORTED_UPLOAD_EXTENSIONS = [
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
] as const;

function buildBullets(
  activeStep: ArbReviewStepKey,
  findings: ArbFinding[],
  scorecard: ArbScorecard | null
) {
  switch (activeStep) {
    case "upload":
      return [
        "Upload SOW, design docs, and supporting artifacts",
        "Register logical file category and evidence readiness",
        "Prepare extraction pipeline handoff"
      ];
    case "requirements":
      return [
        "Review extracted requirements",
        "Correct category, criticality, and normalized text",
        "Accept or reject weak extractions"
      ];
    case "evidence":
      return [
        "Compare requirements to extracted design evidence",
        "Adjust match states and rationale",
        "Open source excerpts for traceability"
      ];
    case "findings":
      return findings.length > 0
        ? findings.map((finding) => `[${finding.severity}] ${finding.title}`)
        : [
            "Load structured findings from the API",
            "Filter by severity and domain",
            "Assign owners and due dates"
          ];
    case "scorecard":
      return scorecard
        ? [
            `Overall score: ${scorecard.overallScore ?? "TBD"}`,
            `Recommendation: ${scorecard.recommendation} (${scorecard.confidence} confidence)`,
            ...scorecard.domainScores.map(
              (domainScore) =>
                `${domainScore.domain}: ${domainScore.score}/${domainScore.weight} - ${domainScore.reason}`
            )
          ]
        : [
            "Show weighted domain scores",
            "Link score rationale to findings",
            "Display recommendation and confidence"
          ];
    case "decision":
      return [
        "Show AI recommendation and blocker summary",
        "Capture reviewer decision and rationale",
        "Track conditions and must-fix actions"
      ];
    default:
      return [
        "Show review summary and workflow state",
        "Link to each ARB review step",
        "Prepare navigation into the live workflow"
      ];
  }
}

function summarizeActions(actions: ArbAction[]) {
  const openActions = actions.filter((action) => action.status !== "Closed");
  const blockedActions = openActions.filter((action) => action.status === "Blocked");
  const reviewerVerificationActions = openActions.filter(
    (action) => action.reviewerVerificationRequired
  );

  return {
    openCount: openActions.length,
    blockedCount: blockedActions.length,
    reviewerVerificationCount: reviewerVerificationActions.length,
    openActions,
    blockedActions,
    reviewerVerificationActions
  };
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${Math.max(1, bytes)} B`;
}

function formatExportLabel(format: string) {
  if (format === "markdown") {
    return ".md";
  }

  if (format === "html") {
    return ".html";
  }

  return ".csv";
}

function toSeverityLevel(value: string | undefined): "High" | "Medium" | "Low" | undefined {
  if (value === "High" || value === "Medium" || value === "Low") {
    return value;
  }

  return undefined;
}

function getFindingPrimaryReference(finding: ArbFinding) {
  return finding.references.find((reference) => Boolean(reference.url)) ?? finding.references[0] ?? null;
}

function getDomainScorePercent(domainScore: ArbDomainScore) {
  if (!Number.isFinite(domainScore.weight) || domainScore.weight <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((domainScore.score / domainScore.weight) * 100)));
}

function getPercentTone(percent: number) {
  if (percent >= 85) {
    return "strong";
  }

  if (percent >= 70) {
    return "steady";
  }

  return "attention";
}

function getRecommendationTone(recommendation: string) {
  const normalized = recommendation.trim().toLowerCase();

  if (normalized.includes("approved")) {
    return "approved";
  }

  if (normalized.includes("rejected") || normalized.includes("improvement") || normalized.includes("revision")) {
    return "attention";
  }

  if (normalized.includes("insufficient")) {
    return "neutral";
  }

  return "neutral";
}

function getScoreBandLabel(score: number | null) {
  if (score === null || score === undefined) {
    return "Awaiting score";
  }

  if (score >= 85) {
    return "Board-ready";
  }

  if (score >= 70) {
    return "Needs follow-through";
  }

  return "Needs remediation";
}

export function ArbLiveReviewStep(props: {
  reviewId: string;
  activeStep: ArbReviewStepKey;
  title: string;
  description: string;
}) {
  const { reviewId, activeStep, title, description } = props;
  const router = useRouter();
  const [review, setReview] = useState<ArbReviewSummary | null>(null);
  const [findings, setFindings] = useState<ArbFinding[]>([]);
  const [actions, setActions] = useState<ArbAction[]>([]);
  const [scorecard, setScorecard] = useState<ArbScorecard | null>(null);
  const [findingSavingId, setFindingSavingId] = useState<string | null>(null);
  const [actionSavingFindingId, setActionSavingFindingId] = useState<string | null>(null);
  const [actionSavingId, setActionSavingId] = useState<string | null>(null);
  const [findingError, setFindingError] = useState<string | null>(null);
  const [decisionChoice, setDecisionChoice] = useState("Needs Revision");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [decisionReviewerName, setDecisionReviewerName] = useState("");
  const [decisionReviewerRole, setDecisionReviewerRole] = useState("");
  const [decisionResult, setDecisionResult] = useState<ArbDecision | null>(null);
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<ArbUploadedFile[]>([]);
  const [requirements, setRequirements] = useState<ArbRequirement[]>([]);
  const [evidenceFacts, setEvidenceFacts] = useState<ArbEvidenceFact[]>([]);
  const [exportArtifacts, setExportArtifacts] = useState<ArbExportArtifact[]>([]);
  const [extractionStatus, setExtractionStatus] = useState<ArbExtractionStatus | null>(null);
  const [confidentialityConfirmed, setConfidentialityConfirmed] = useState(false);
  const [uploadSaving, setUploadSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractionStarting, setExtractionStarting] = useState(false);
  const [uploadDropActive, setUploadDropActive] = useState(false);
  const [exportDownloadingId, setExportDownloadingId] = useState<string | null>(null);
  const [exportRegenerating, setExportRegenerating] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [agentCompleted, setAgentCompleted] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [deleteFileError, setDeleteFileError] = useState<string | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const actionSummary = summarizeActions(actions);
  const authRequired = error?.includes("Sign in is required") ?? false;

  let decisionGateMessage: string | null = null;

  if (actionSummary.blockedCount > 0) {
    decisionGateMessage =
      "Blocked actions remain. Resolve or reclassify blocked remediation items before recording a final decision.";
  } else if (actionSummary.reviewerVerificationCount > 0) {
    decisionGateMessage =
      "Reviewer verification is still required for at least one open action before a final decision can be recorded.";
  } else if (decisionChoice === "Approved" && actionSummary.openCount > 0) {
    decisionGateMessage =
      "Approved decisions require all remediation actions to be closed first. Use Needs Revision while open actions remain.";
  }

  function updateLocalFinding(findingId: string, updater: (current: ArbFinding) => ArbFinding) {
    setFindings((currentFindings) =>
      currentFindings.map((finding) =>
        finding.findingId === findingId ? updater(finding) : finding
      )
    );
  }

  function updateLocalAction(actionId: string, updater: (current: ArbAction) => ArbAction) {
    setActions((currentActions) =>
      currentActions.map((action) => (action.actionId === actionId ? updater(action) : action))
    );
  }

  async function handleFileUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    try {
      setUploadSaving(true);
      setUploadError(null);

      const payload = await uploadArbFiles({
        reviewId,
        files: Array.from(fileList)
      });

      setUploadedFiles(payload.files);
      setReview((currentReview) =>
        currentReview
          ? {
              ...currentReview,
              evidenceReadinessState:
                payload.evidenceReadinessState as ArbReviewSummary["evidenceReadinessState"],
              documentCount: payload.files.length
            }
          : currentReview
      );
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error ? uploadFailure.message : "Unable to upload ARB files."
      );
    } finally {
      setUploadSaving(false);
    }
  }

  async function handleDeleteFile(fileId: string) {
    try {
      setDeletingFileId(fileId);
      setDeleteFileError(null);
      const result = await deleteArbFile(reviewId, fileId);
      setUploadedFiles((current) => current.filter((f) => f.fileId !== fileId));
      if (result.remainingCount === 0) {
        setExtractionStatus(null);
      }
    } catch (deleteError) {
      setDeleteFileError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete the file."
      );
    } finally {
      setDeletingFileId(null);
    }
  }

  async function handleExportDownload(exportArtifact: ArbExportArtifact) {
    try {
      setExportDownloadingId(exportArtifact.exportId);
      setExportError(null);
      await downloadArbExport(reviewId, exportArtifact);
    } catch (downloadError) {
      setExportError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download the reviewed output."
      );
    } finally {
      setExportDownloadingId(null);
    }
  }

  async function regenerateReviewedOutputs() {
    const formats: ArbExportFormat[] = ["markdown", "csv", "html"];

    try {
      setExportRegenerating(true);
      setExportError(null);

      await Promise.all(
        formats.map((format) =>
          createArbExport({
            reviewId,
            format,
            includeFindings: true,
            includeScorecard: true,
            includeActions: true
          })
        )
      );

      const nextExports = await fetchArbExports(reviewId);
      setExportArtifacts(nextExports);
    } catch (regenerateError) {
      setExportError(
        regenerateError instanceof Error
          ? regenerateError.message
          : "Unable to regenerate the reviewed outputs."
      );
    } finally {
      setExportRegenerating(false);
    }
  }

  function renderOutputArtifactsCard() {
    return (
      <section className="trace-card arb-summary-card">
        <div className="board-card-head">
          <div className="board-card-head-copy">
            <p className="board-card-subtitle">Reviewed outputs</p>
            <h2 className="section-title">Regenerate or download the reviewed package</h2>
          </div>
        </div>
        <p className="section-copy">
          Processed ARB review outputs are written to <strong>arb-outputfiles</strong>. Regenerate
          them after updating findings, actions, score posture, or the reviewer decision so the
          downloaded package stays aligned with the latest review state.
        </p>
        <div className="button-row">
          <button
            type="button"
            className="primary-button"
            disabled={exportRegenerating}
            onClick={() => void regenerateReviewedOutputs()}
          >
            {exportRegenerating ? "Regenerating outputs..." : "Regenerate reviewed outputs"}
          </button>
        </div>
        {exportArtifacts.length === 0 ? (
          <p className="microcopy">
            Downloadable reviewed outputs will appear after extraction completes for this review.
          </p>
        ) : (
          <div className="arb-upload-file-list">
            {exportArtifacts.map((artifact) => (
              <article key={artifact.exportId} className="trace-card arb-upload-file">
                <div className="arb-upload-file-copy">
                  <strong>{artifact.fileName}</strong>
                  <p className="microcopy">
                    {formatExportLabel(artifact.format)} · generated {new Date(artifact.generatedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={exportDownloadingId === artifact.exportId}
                  onClick={() => void handleExportDownload(artifact)}
                >
                  {exportDownloadingId === artifact.exportId ? "Preparing download..." : "Download"}
                </button>
              </article>
            ))}
          </div>
        )}
        {exportError ? <p>{exportError}</p> : null}
      </section>
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const reviewResponse = await fetchArbReview(reviewId);
        const findingsResponse = activeStep === "findings" ? await fetchArbFindings(reviewId) : [];
        const uploadsResponse =
          activeStep === "upload" || activeStep === "requirements" || activeStep === "evidence"
            ? await fetchArbUploads(reviewId)
            : null;
        const actionsResponse =
          activeStep === "findings" || activeStep === "scorecard" || activeStep === "decision"
            ? await fetchArbActions(reviewId)
            : [];
        const requirementsResponse =
          activeStep === "requirements" ? await fetchArbRequirements(reviewId) : [];
        const evidenceResponse = activeStep === "evidence" ? await fetchArbEvidence(reviewId) : [];
        const exportsResponse =
          activeStep === "upload" || activeStep === "requirements" || activeStep === "evidence"
            ? await fetchArbExports(reviewId)
            : [];
        const scorecardResponse =
          activeStep === "scorecard" ? await fetchArbScorecard(reviewId) : null;
        const decisionResponse =
          activeStep === "decision" ? await fetchArbDecision(reviewId) : null;

        if (!cancelled) {
          setReview(reviewResponse);
          setFindings(findingsResponse);
          setUploadedFiles(uploadsResponse?.files ?? []);
          setExtractionStatus(uploadsResponse?.extraction ?? null);
          setRequirements(requirementsResponse);
          setEvidenceFacts(evidenceResponse);
          setExportArtifacts(exportsResponse);
          setActions(actionsResponse);
          setScorecard(scorecardResponse);
          setDecisionResult(decisionResponse);
          setDecisionChoice(decisionResponse?.reviewerDecision || "Needs Revision");
          setDecisionRationale(decisionResponse?.rationale || "");
          setDecisionReviewerName(decisionResponse?.reviewerName || "");
          setDecisionReviewerRole(decisionResponse?.reviewerRole || "");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load ARB review state.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reviewId, activeStep]);

  useEffect(() => {
    if (activeStep !== "findings") {
      return;
    }

    setSelectedFindingId((currentSelectedFindingId) => {
      if (
        currentSelectedFindingId &&
        findings.some((finding) => finding.findingId === currentSelectedFindingId)
      ) {
        return currentSelectedFindingId;
      }

      return findings[0]?.findingId ?? null;
    });
  }, [activeStep, findings]);

  const shellReview =
    review ??
    ({
      reviewId,
      projectName: "Loading ARB review",
      customerName: "",
      workflowState: "Draft",
      evidenceReadinessState: "Ready with Gaps",
      overallScore: null,
      recommendation: "Loading",
      assignedReviewer: null
    } satisfies ArbReviewSummary);

  async function submitDecision() {
    if (decisionGateMessage) {
      setDecisionError(decisionGateMessage);
      return;
    }

    try {
      setDecisionSaving(true);
      setDecisionError(null);

      const nextDecision = await recordArbDecision({
        reviewId,
        finalDecision: decisionChoice,
        rationale: decisionRationale,
        reviewerName: decisionReviewerName.trim() || undefined,
        reviewerRole: decisionReviewerRole.trim() || undefined
      });

      setDecisionResult(nextDecision);
      setDecisionChoice(nextDecision.reviewerDecision);
      setDecisionRationale(nextDecision.rationale);
      setDecisionReviewerName(nextDecision.reviewerName || "");
      setDecisionReviewerRole(nextDecision.reviewerRole || "");
      setReview((currentReview) =>
        currentReview
          ? {
              ...currentReview,
              workflowState:
                nextDecision.reviewerDecision === "Approved"
                  ? "Approved"
                  : "Decision Recorded",
              finalDecision: nextDecision.reviewerDecision
            }
          : currentReview
      );
    } catch (decisionLoadError) {
      setDecisionError(
        decisionLoadError instanceof Error
          ? decisionLoadError.message
          : "Unable to record ARB decision."
      );
    } finally {
      setDecisionSaving(false);
    }
  }

  async function saveFinding(finding: ArbFinding) {
    try {
      setFindingSavingId(finding.findingId);
      setFindingError(null);

      const savedFinding = await updateArbFinding({
        reviewId,
        findingId: finding.findingId,
        status: finding.status,
        owner: finding.owner,
        dueDate: finding.dueDate,
        reviewerNote: finding.reviewerNote,
        criticalBlocker: finding.criticalBlocker
      });

      setFindings((currentFindings) =>
        currentFindings.map((currentFinding) =>
          currentFinding.findingId === savedFinding.findingId ? savedFinding : currentFinding
        )
      );
    } catch (findingSaveError) {
      setFindingError(
        findingSaveError instanceof Error
          ? findingSaveError.message
          : "Unable to update the ARB finding."
      );
    } finally {
      setFindingSavingId(null);
    }
  }

  async function createActionForFinding(finding: ArbFinding) {
    try {
      setActionSavingFindingId(finding.findingId);
      setFindingError(null);

      const savedAction = await createArbAction({
        reviewId,
        sourceFindingId: finding.findingId
      });

      setActions((currentActions) => [...currentActions, savedAction]);
    } catch (actionCreateError) {
      setFindingError(
        actionCreateError instanceof Error
          ? actionCreateError.message
          : "Unable to create the ARB action."
      );
    } finally {
      setActionSavingFindingId(null);
    }
  }

  async function saveAction(action: ArbAction) {
    try {
      setActionSavingId(action.actionId);
      setFindingError(null);

      const savedAction = await updateArbAction({
        reviewId,
        actionId: action.actionId,
        owner: action.owner,
        dueDate: action.dueDate,
        status: action.status,
        closureNotes: action.closureNotes,
        reviewerVerificationRequired: action.reviewerVerificationRequired
      });

      setActions((currentActions) =>
        currentActions.map((currentAction) =>
          currentAction.actionId === savedAction.actionId ? savedAction : currentAction
        )
      );
    } catch (actionSaveError) {
      setFindingError(
        actionSaveError instanceof Error ? actionSaveError.message : "Unable to update the ARB action."
      );
    } finally {
      setActionSavingId(null);
    }
  }

  async function handleRunAgentReview() {
    try {
      setAgentRunning(true);
      setAgentError(null);
      await runArbAgentReview(reviewId);
      setAgentCompleted(true);
      // Refresh findings and scorecard after agent run
      const [nextFindings, nextScorecard] = await Promise.all([
        fetchArbFindings(reviewId),
        fetchArbScorecard(reviewId)
      ]);
      setFindings(nextFindings);
      setScorecard(nextScorecard);
      // Auto-navigate to findings once agent review completes
      router.push(getArbStepHref(reviewId, "findings"));
    } catch (agentRunError) {
      setAgentError(
        agentRunError instanceof Error ? agentRunError.message : "Unable to run agent review."
      );
    } finally {
      setAgentRunning(false);
    }
  }

  function renderUploadContent() {
    const supportedUploads = uploadedFiles.filter((item) => item.supportedTextExtraction);
    const unsupportedUploads = uploadedFiles.filter((item) => !item.supportedTextExtraction);
    const readinessChecks = [
      {
        label: "At least one document has been uploaded",
        complete: supportedUploads.length > 0
      },
      {
        label: "Confidentiality and handling note is acknowledged",
        complete: confidentialityConfirmed
      }
    ];
    const extractionPreview =
      supportedUploads.length === 0
        ? [
            "Scope and requirements from your SOW or design narrative",
            "Architecture topology, services, network, and security posture",
            "Cost, support, and operational readiness signals"
          ]
        : Array.from(new Set(supportedUploads.map((item) => item.logicalCategory))).map(
            (category) => `AI will analyse: ${category}`
          );
    const canStartExtraction = readinessChecks.every((check) => check.complete) && !uploadSaving;

    return (
      <div className="arb-page-stack">
        <div className="arb-summary-grid">
          <article className="future-card">
            <p className="board-card-subtitle">Files uploaded</p>
            <strong>{supportedUploads.length}</strong>
            <p className="section-copy">
              Text-based files (PDF, Word, Markdown) are ready for AI analysis.
            </p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Visual / binary files</p>
            <strong>{unsupportedUploads.length}</strong>
            <p className="section-copy">
              Images, diagrams, and spreadsheets are stored and tracked but not text-extracted.
            </p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Ready to analyse</p>
            <strong>{canStartExtraction ? "Yes" : "Not yet"}</strong>
            <p className="section-copy">
              Upload at least one document and confirm it can be used for review.
            </p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Analysis status</p>
            <strong>{extractionStatus?.state ?? "Not started"}</strong>
            <p className="section-copy">
              {extractionStatus?.completedSteps?.length
                ? `${extractionStatus.completedSteps.length} steps complete`
                : "Start analysis to extract requirements and evidence."}
            </p>
          </article>
        </div>

        <section
          id="upload-documents"
          className={`surface-panel arb-upload-dropzone${
            uploadDropActive ? " arb-upload-dropzone-active" : ""
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setUploadDropActive(true);
          }}
          onDragLeave={() => setUploadDropActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setUploadDropActive(false);
            void handleFileUpload(event.dataTransfer.files);
          }}
        >
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Upload documents</p>
              <h2 className="section-title">Add your design documents, SOW, and supporting material</h2>
            </div>
          </div>

          <p className="section-copy">
            Drag files here or click to select. The AI agent will read these documents and check them
            against WAF, CAF, ALZ, HA/DR, Security, Networking, and Monitoring frameworks.
          </p>

          <div className="pill-row">
            {SUPPORTED_UPLOAD_EXTENSIONS.map((extension) => (
              <span key={extension} className="pill">
                {extension}
              </span>
            ))}
          </div>

          <label className="secondary-button arb-upload-picker" htmlFor={`arb-upload-${reviewId}`}>
            Select review files
          </label>
          <input
            id={`arb-upload-${reviewId}`}
            className="field-input"
            aria-label="Upload review package files"
            type="file"
            multiple
            accept={SUPPORTED_UPLOAD_EXTENSIONS.join(",")}
            onChange={(event) => {
              void handleFileUpload(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <p className="microcopy">
            Accepted: PDF, Word, PowerPoint, Excel, images, diagrams (VSDX/SVG), Markdown, and plain text.
            PDF and Word documents produce the richest findings. Excel/spreadsheet data is extracted sheet-by-sheet. Images and diagrams are analysed by the vision model to identify Azure services, topology, and labels.
          </p>
          {uploadSaving ? (
            <p className="arb-upload-status arb-upload-status-progress">Uploading files…</p>
          ) : uploadedFiles.length > 0 && !uploadError ? (
            <p className="arb-upload-status arb-upload-status-done">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} uploaded — ready to start analysis
            </p>
          ) : null}
          {uploadError ? <p className="arb-upload-error">{uploadError}</p> : null}
        </section>

        {/* Staged files */}
        <section className="surface-panel">
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Uploaded files</p>
              <h2 className="section-title">Documents in this review</h2>
            </div>
          </div>
          {uploadedFiles.length === 0 ? (
            <p className="section-copy">
              No files uploaded yet. Add your SOW, architecture design, diagrams, or workbook above to get started.
            </p>
          ) : (
            <div className="arb-upload-file-list">
              {uploadedFiles.map((upload) => (
                <article key={upload.fileId} className="trace-card arb-upload-file">
                  <div className="arb-upload-file-copy">
                    <strong>{upload.fileName}</strong>
                    <p className="microcopy">
                      {upload.logicalCategory} · {formatFileSize(upload.sizeBytes)} ·{" "}
                      <span className={upload.extractionStatus === "Completed" ? "arb-status-done" : undefined}>
                        {upload.extractionStatus}
                      </span>
                    </p>
                  </div>
                  <div className="arb-upload-file-actions">
                    <span className="pill">{upload.supportedTextExtraction ? "Text-first" : "Limited"}</span>
                    <button
                      type="button"
                      className="arb-delete-file-btn"
                      aria-label={`Delete ${upload.fileName}`}
                      disabled={deletingFileId === upload.fileId}
                      onClick={() => void handleDeleteFile(upload.fileId)}
                    >
                      {deletingFileId === upload.fileId ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {deleteFileError ? <p className="arb-upload-error">{deleteFileError}</p> : null}
        </section>

        {/* Confidentiality confirmation + Start extraction CTA */}
        <section id="run-ai-analysis" className="surface-panel arb-action-panel">
          <label className="arb-inline-check">
            <input
              aria-label="Confirm uploaded files can be used for review extraction"
              type="checkbox"
              checked={confidentialityConfirmed}
              onChange={(event) => setConfidentialityConfirmed(event.target.checked)}
            />
            <span>I confirm the uploaded files can be used for review extraction</span>
          </label>
          <ul className="arb-checklist arb-checklist-compact">
            {readinessChecks.map((check) => (
              <li key={check.label} className={check.complete ? "arb-check-done" : "arb-check-pending"}>
                {check.complete ? "✓" : "○"} {check.label}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="arb-cta-btn"
            disabled={!canStartExtraction || extractionStarting}
            onClick={async () => {
              try {
                setExtractionStarting(true);
                setUploadError(null);
                const nextExtraction = await startArbExtraction(reviewId);
                setExtractionStatus(nextExtraction);
                const nextRequirements = await fetchArbRequirements(reviewId);
                const nextEvidence = await fetchArbEvidence(reviewId);
                const nextExports = await fetchArbExports(reviewId);
                setRequirements(nextRequirements);
                setEvidenceFacts(nextEvidence);
                setExportArtifacts(nextExports);
                setReview((currentReview) =>
                  currentReview
                    ? {
                        ...currentReview,
                        workflowState: "Review In Progress",
                        evidenceReadinessState:
                          nextExtraction.evidenceReadinessState as ArbReviewSummary["evidenceReadinessState"]
                      }
                    : currentReview
                );
              } catch (startFailure) {
                setUploadError(
                  startFailure instanceof Error
                    ? startFailure.message
                    : "Unable to start analysis. Please try again."
                );
              } finally {
                setExtractionStarting(false);
              }
            }}
          >
            {extractionStarting ? (
              <><span className="arb-spinner" aria-hidden="true" /> Analysing documents… typically 30–90 seconds per file</>
            ) : extractionStatus?.state === "Failed" ? (
              "Retry analysis →"
            ) : (
              "Start analysis →"
            )}
          </button>
          <p className="microcopy">Typically 30–90 seconds per document. The agent reads every page.</p>
          {extractionStarting ? (
            <p className="arb-upload-status arb-upload-status-progress">
              Analysis running — do not close this page. Results will appear automatically.
            </p>
          ) : extractionStatus?.state === "Failed" ? (
            <p className="arb-upload-error">
              Analysis failed. Check that your files are not password-protected and try again.
            </p>
          ) : extractionStatus ? (
            <p className="arb-upload-status arb-upload-status-progress">
              Status: {extractionStatus.state} · Evidence readiness: {extractionStatus.evidenceReadinessState}
            </p>
          ) : null}
        </section>

        {/* Run AI Review CTA — shown once extraction is complete */}
        {extractionStatus?.state === "Completed" ? (
          <section className="surface-panel arb-action-panel arb-action-panel-highlight">
            <p className="arb-action-panel-label">Analysis complete — ready for AI review</p>
            <p className="section-copy">
              Run the ARB Agent to produce structured findings, a weighted scorecard, and a
              recommendation. The agent checks all evidence against WAF, CAF, ALZ, HA/DR, Security,
              Networking, and Monitoring. Typically takes 1–3 minutes.
            </p>
            <button
              type="button"
              className="arb-cta-btn"
              disabled={agentRunning}
              onClick={() => void handleRunAgentReview()}
            >
              {agentRunning ? (
                <><span className="arb-spinner" aria-hidden="true" /> Running AI review… 1–3 minutes</>
              ) : (
                "Run AI review →"
              )}
            </button>
            {agentRunning ? (
              <p className="arb-upload-status arb-upload-status-progress">
                The agent is reading your documents and checking against all 11 Azure frameworks. Do not close this page.
              </p>
            ) : null}
            {agentCompleted ? (
              <p className="arb-upload-status arb-upload-status-done">
                AI review complete — findings and scorecard updated.{" "}
                <a href={getArbStepHref(reviewId, "findings")} className="arb-inline-link">View findings →</a>
              </p>
            ) : null}
            {agentError ? <p className="arb-upload-error">{agentError}</p> : null}
          </section>
        ) : null}

        {/* Export outputs */}
        <div className="arb-upload-layout">
          <div className="arb-sidecar-stack">
            <section className="future-card arb-summary-card">
              <p className="board-card-subtitle">What the AI will check</p>
              <ul className="arb-checklist">
                {extractionPreview.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            {renderOutputArtifactsCard()}
          </div>
        </div>
      </div>
    );
  }

  function renderRequirementsContent() {
    if (requirements.length === 0) {
      return (
        <ArbPlaceholderPage
          intro="No extracted requirements are available yet. Upload required files and start extraction first."
          bullets={buildBullets(activeStep, findings, scorecard)}
        />
      );
    }

    return (
      <div className="arb-page-stack">
        <div className="arb-summary-grid">
          <article className="future-card">
            <p className="board-card-subtitle">Normalized requirements</p>
            <strong>{requirements.length}</strong>
            <p className="section-copy">Requirements were derived from persisted text-first artifacts for this review.</p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Source files</p>
            <strong>{new Set(requirements.map((item) => item.sourceFileId).filter(Boolean)).size}</strong>
            <p className="section-copy">Distinct uploaded files contributed to the normalized requirement set.</p>
          </article>
        </div>

        <section className="surface-panel arb-summary-card">
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Requirements</p>
              <h2 className="section-title">Review the normalized requirement statements</h2>
            </div>
          </div>
          <div className="arb-finding-grid">
            {requirements.map((requirement) => (
              <article key={requirement.requirementId} className="trace-card arb-score-card">
                <h3>{requirement.category}</h3>
                <p>{requirement.normalizedText}</p>
                <p className="microcopy">
                  {requirement.sourceFileName || "Derived review summary"} · {requirement.criticality} · {requirement.reviewerStatus}
                </p>
              </article>
            ))}
          </div>
        </section>

        {renderOutputArtifactsCard()}
      </div>
    );
  }

  function renderEvidenceContent() {
    if (evidenceFacts.length === 0) {
      return (
        <ArbPlaceholderPage
          intro="No extracted evidence facts are available yet. Upload required files and start extraction first."
          bullets={buildBullets(activeStep, findings, scorecard)}
        />
      );
    }

    return (
      <div className="arb-page-stack">
        <div className="arb-summary-grid">
          <article className="future-card">
            <p className="board-card-subtitle">Evidence facts</p>
            <strong>{evidenceFacts.length}</strong>
            <p className="section-copy">Evidence facts are extracted from the persisted package and feed later findings.</p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Extraction state</p>
            <strong>{extractionStatus?.state ?? "Not Started"}</strong>
            <p className="section-copy">Extraction status stays tied to this review instead of browser-local state.</p>
          </article>
        </div>

        <section className="surface-panel arb-summary-card">
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Evidence map</p>
              <h2 className="section-title">Ground the review in extracted source evidence</h2>
            </div>
          </div>
          <div className="arb-finding-grid">
            {evidenceFacts.map((fact) => (
              <article key={fact.evidenceId} className="trace-card arb-score-card">
                <h3>{fact.factType}</h3>
                <p>{fact.summary}</p>
                <p className="microcopy">{fact.sourceFileName || "Derived review summary"} · {fact.confidence} confidence</p>
                <p className="microcopy">{fact.sourceExcerpt}</p>
              </article>
            ))}
          </div>
        </section>

        {renderOutputArtifactsCard()}
      </div>
    );
  }

  function renderFindingsContent() {
    const criticalBlockerCount = findings.filter((finding) => finding.criticalBlocker).length;
    const missingEvidenceCount = findings.reduce(
      (total, finding) => total + finding.missingEvidence.length,
      0
    );
    const selectedFinding =
      findings.find((finding) => finding.findingId === selectedFindingId) ?? findings[0] ?? null;
    const selectedFindingAction = selectedFinding
      ? actions.find((action) => action.sourceFindingId === selectedFinding.findingId) ?? null
      : null;

    if (findings.length === 0) {
      return (
        <div className="arb-page-stack">
          <ArbPlaceholderPage
            intro="No AI findings yet — the AI agent hasn't run for this review."
            bullets={[
              "Go back to the Upload step and click 'Run AI review →' to generate findings",
              "The agent checks your documents against WAF, CAF, ALZ, HA/DR, Security, Networking, and Monitoring",
              "Results appear here automatically — typically 1–3 minutes"
            ]}
            footer={
              <a href={getArbStepHref(reviewId, "upload", "upload-documents")} className="primary-button">
                Go to Upload — Run AI review →
              </a>
            }
          />
          {renderOutputArtifactsCard()}
        </div>
      );
    }

    return (
      <div className="arb-page-stack">
        <div className="arb-summary-grid">
          <article className="future-card">
            <p className="board-card-subtitle">Open actions</p>
            <strong>{actionSummary.openCount}</strong>
            <p>Open actions: {actionSummary.openCount}</p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Critical blockers</p>
            <strong>{criticalBlockerCount}</strong>
            <p className="section-copy">
              Review these first because they can prevent final approval even when other findings close.
            </p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Missing evidence</p>
            <strong>{missingEvidenceCount}</strong>
            <p className="section-copy">
              Missing evidence should stay visible alongside remediation tasks instead of disappearing into notes.
            </p>
          </article>
        </div>

          {findingError ? (
            <section className="trace-card arb-summary-card">
              <p>{findingError}</p>
            </section>
          ) : null}

        <section className="surface-panel arb-findings-table-panel">
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Findings table</p>
              <h2 className="section-title">Scan the findings first, then open one item to work it through.</h2>
            </div>
          </div>
          <div className="arb-review-table-scroll">
            <table className="arb-findings-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Finding</th>
                  <th>Framework</th>
                  <th>Recommendation</th>
                  <th>Learn link</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {findings.map((finding) => {
                  const primaryReference = getFindingPrimaryReference(finding);
                  const selected = selectedFinding?.findingId === finding.findingId;

                  return (
                    <tr
                      key={finding.findingId}
                      className={selected ? "arb-findings-table-row-active" : undefined}
                    >
                      <td>
                        <SeverityBadge severity={toSeverityLevel(finding.severity)} compact />
                      </td>
                      <td>
                        <div className="arb-findings-table-main">
                          <strong>{finding.title}</strong>
                          <span>{finding.findingStatement}</span>
                        </div>
                      </td>
                      <td>
                        <div className="arb-findings-table-framework">
                          <span>{finding.domain}</span>
                          <small>{finding.findingType}</small>
                        </div>
                      </td>
                      <td className="arb-findings-table-recommendation">{finding.recommendation}</td>
                      <td>
                        {primaryReference?.url ? (
                          <a
                            href={primaryReference.url}
                            target="_blank"
                            rel="noreferrer"
                            className="arb-findings-table-link"
                          >
                            {primaryReference.title || "Open guidance"}
                          </a>
                        ) : (
                          <span className="arb-findings-table-empty">—</span>
                        )}
                      </td>
                      <td>
                        <span className="arb-findings-table-status">{finding.status}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`arb-findings-open${selected ? " arb-findings-open-active" : ""}`}
                          onClick={() => setSelectedFindingId(finding.findingId)}
                        >
                          {selected ? "Editing" : "Open"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {selectedFinding ? (
          <section className="surface-panel arb-finding-focus">
            <div className="board-card-head">
              <div className="board-card-head-copy">
                <p className="board-card-subtitle">Selected finding</p>
                <h2 className="section-title arb-finding-title">{selectedFinding.title}</h2>
              </div>
              <div className="arb-finding-focus-meta">
                <SeverityBadge severity={toSeverityLevel(selectedFinding.severity)} />
                <span className="arb-finding-focus-chip">{selectedFinding.domain}</span>
                <span className="arb-finding-focus-chip">{selectedFinding.findingType}</span>
              </div>
            </div>

            <div className="arb-score-grid">
              <article className="trace-card">
                <strong>What the AI found</strong>
                <p>{selectedFinding.findingStatement}</p>
              </article>
              <article className="trace-card">
                <strong>Why it matters</strong>
                <p>{selectedFinding.whyItMatters}</p>
              </article>
              <article className="trace-card">
                <strong>Recommended fix</strong>
                <p>{selectedFinding.recommendation}</p>
              </article>
            </div>

            {selectedFinding.missingEvidence.length > 0 ? (
              <section className="trace-card arb-summary-card">
                <p className="board-card-subtitle">Missing evidence</p>
                <ul className="arb-checklist">
                  {selectedFinding.missingEvidence.map((missingEvidence) => (
                    <li key={missingEvidence}>{missingEvidence}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {selectedFinding.references.length > 0 ? (
              <section className="trace-card arb-summary-card">
                <p className="board-card-subtitle">Grounding links</p>
                <div className="arb-reference-list">
                  {selectedFinding.references.map((reference) => (
                    <a
                      key={`${selectedFinding.findingId}-${reference.title}-${reference.url ?? "ref"}`}
                      href={reference.url ?? "#"}
                      target={reference.url ? "_blank" : undefined}
                      rel={reference.url ? "noreferrer" : undefined}
                      className={`arb-reference-item${reference.url ? "" : " arb-reference-item-disabled"}`}
                    >
                      <strong>{reference.title}</strong>
                      <span>{reference.relevance ?? "Grounding reference"}</span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="surface-panel arb-summary-card arb-finding-editor">
              <div className="board-card-head">
                <div className="board-card-head-copy">
                  <p className="board-card-subtitle">Review action</p>
                  <h3 className="section-title">Record the owner, status, and note for this finding.</h3>
                </div>
              </div>

              <div className="arb-field-grid">
                <label className="filter-field">
                  <span>Status</span>
                  <select
                    className="field-select"
                    aria-label={`Status for ${selectedFinding.title}`}
                    value={selectedFinding.status}
                    onChange={(event) => {
                      const nextStatus = event.target.value;
                      updateLocalFinding(selectedFinding.findingId, (current) => ({
                        ...current,
                        status: nextStatus
                      }));
                    }}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Ready For Review">Ready For Review</option>
                    <option value="Closed">Closed</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </label>
                <label className="filter-field">
                  <span>Owner</span>
                  <input
                    className="field-input"
                    aria-label={`Owner for ${selectedFinding.title}`}
                    value={selectedFinding.owner ?? ""}
                    placeholder={selectedFinding.suggestedOwner ?? "Assign owner"}
                    onChange={(event) => {
                      const nextOwner = event.target.value;
                      updateLocalFinding(selectedFinding.findingId, (current) => ({
                        ...current,
                        owner: nextOwner || null
                      }));
                    }}
                  />
                </label>
                <label className="filter-field">
                  <span>Due date</span>
                  <input
                    className="field-input"
                    aria-label={`Due date for ${selectedFinding.title}`}
                    type="date"
                    value={selectedFinding.dueDate ?? (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      return d.toISOString().slice(0, 10);
                    })()}
                    onChange={(event) => {
                      const nextDueDate = event.target.value;
                      updateLocalFinding(selectedFinding.findingId, (current) => ({
                        ...current,
                        dueDate: nextDueDate || null
                      }));
                    }}
                  />
                </label>
              </div>

              <label className="filter-field">
                <span>Reviewer note</span>
                <textarea
                  className="field-textarea"
                  aria-label={`Reviewer note for ${selectedFinding.title}`}
                  value={selectedFinding.reviewerNote ?? ""}
                  onChange={(event) => {
                    const nextReviewerNote = event.target.value;
                    updateLocalFinding(selectedFinding.findingId, (current) => ({
                      ...current,
                      reviewerNote: nextReviewerNote || null
                    }));
                  }}
                />
              </label>

              <label className="arb-inline-check">
                <input
                  aria-label={`Critical blocker for ${selectedFinding.title}`}
                  type="checkbox"
                  checked={selectedFinding.criticalBlocker}
                  onChange={(event) => {
                    const nextCriticalBlocker = event.target.checked;
                    updateLocalFinding(selectedFinding.findingId, (current) => ({
                      ...current,
                      criticalBlocker: nextCriticalBlocker
                    }));
                  }}
                />
                <span>Critical blocker</span>
              </label>

              <div className="button-row">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void saveFinding(selectedFinding)}
                  disabled={findingSavingId === selectedFinding.findingId}
                >
                  {findingSavingId === selectedFinding.findingId ? "Saving finding..." : "Save finding"}
                </button>
              </div>
            </section>

            <section className="surface-panel arb-summary-card arb-finding-editor">
              <div className="board-card-head">
                <div className="board-card-head-copy">
                  <p className="board-card-subtitle">Remediation action</p>
                  <h3 className="section-title">Track one follow-up action tied to this finding.</h3>
                </div>
              </div>

              {selectedFindingAction ? (
                <>
                  <div className="arb-field-grid">
                    <label className="filter-field">
                      <span>Action status</span>
                      <select
                        className="field-select"
                        aria-label={`Status for ${selectedFindingAction.actionSummary}`}
                        value={selectedFindingAction.status}
                        onChange={(event) => {
                          const nextStatus = event.target.value;
                          updateLocalAction(selectedFindingAction.actionId, (current) => ({
                            ...current,
                            status: nextStatus
                          }));
                        }}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Ready For Review">Ready For Review</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </label>
                    <label className="filter-field">
                      <span>Action owner</span>
                      <input
                        className="field-input"
                        aria-label={`Owner for ${selectedFindingAction.actionSummary}`}
                        value={selectedFindingAction.owner ?? ""}
                        onChange={(event) => {
                          const nextOwner = event.target.value;
                          updateLocalAction(selectedFindingAction.actionId, (current) => ({
                            ...current,
                            owner: nextOwner || null
                          }));
                        }}
                      />
                    </label>
                    <label className="filter-field">
                      <span>Action due date</span>
                      <input
                        className="field-input"
                        aria-label={`Due date for ${selectedFindingAction.actionSummary}`}
                        type="date"
                        value={selectedFindingAction.dueDate ?? ""}
                        onChange={(event) => {
                          const nextDueDate = event.target.value;
                          updateLocalAction(selectedFindingAction.actionId, (current) => ({
                            ...current,
                            dueDate: nextDueDate || null
                          }));
                        }}
                      />
                    </label>
                  </div>
                  <label className="filter-field">
                    <span>Closure notes</span>
                    <textarea
                      className="field-textarea"
                      aria-label={`Closure notes for ${selectedFindingAction.actionSummary}`}
                      value={selectedFindingAction.closureNotes ?? ""}
                      onChange={(event) => {
                        const nextClosureNotes = event.target.value;
                        updateLocalAction(selectedFindingAction.actionId, (current) => ({
                          ...current,
                          closureNotes: nextClosureNotes || null
                        }));
                      }}
                    />
                  </label>
                  <label className="arb-inline-check">
                    <input
                      aria-label={`Reviewer verification required for ${selectedFindingAction.actionSummary}`}
                      type="checkbox"
                      checked={selectedFindingAction.reviewerVerificationRequired}
                      onChange={(event) => {
                        const nextReviewerVerificationRequired = event.target.checked;
                        updateLocalAction(selectedFindingAction.actionId, (current) => ({
                          ...current,
                          reviewerVerificationRequired: nextReviewerVerificationRequired
                        }));
                      }}
                    />
                    <span>Reviewer verification required</span>
                  </label>
                  <div className="button-row">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => void saveAction(selectedFindingAction)}
                      disabled={actionSavingId === selectedFindingAction.actionId}
                    >
                      {actionSavingId === selectedFindingAction.actionId ? "Saving action..." : "Save action"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="button-row">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void createActionForFinding(selectedFinding)}
                    disabled={actionSavingFindingId === selectedFinding.findingId}
                  >
                    {actionSavingFindingId === selectedFinding.findingId
                      ? "Creating action..."
                      : "Create remediation action"}
                  </button>
                </div>
              )}
            </section>
          </section>
        ) : null}

        {renderOutputArtifactsCard()}
      </div>
    );
  }

  function renderScorecardContent() {
    if (!scorecard) {
      return (
        <ArbPlaceholderPage
          intro="Scorecard data is not available yet for this review."
          bullets={buildBullets(activeStep, findings, scorecard)}
        />
      );
    }

    const recommendationTone = getRecommendationTone(scorecard.recommendation);
    const overallScoreLabel = getScoreBandLabel(scorecard.overallScore);

    return (
      <div className="arb-page-stack">
        <section className="surface-panel arb-summary-card arb-score-hero">
          <div className="arb-score-hero-main">
            <div>
              <p className="board-card-subtitle">Review posture</p>
              <h2 className="section-title">Know whether this review is ready for sign-off.</h2>
              <p className="section-copy">
                One score, one recommendation, and the few conditions that still affect the final
                human decision.
              </p>
            </div>
            <div className="arb-score-hero-value">
              <strong>{scorecard.overallScore ?? "TBD"}</strong>
              <span>{overallScoreLabel}</span>
            </div>
          </div>

          <div className="arb-score-hero-summary">
            <span
              className={`arb-score-recommendation arb-score-recommendation--${recommendationTone}`}
            >
              {scorecard.recommendation}
            </span>
            <div className="arb-score-hero-list">
              <article className="future-card">
                <p className="board-card-subtitle">Confidence</p>
                <strong>{scorecard.confidence}</strong>
              </article>
              <article className="future-card">
                <p className="board-card-subtitle">Critical blockers</p>
                <strong>{scorecard.criticalBlockers}</strong>
              </article>
              <article className="future-card">
                <p className="board-card-subtitle">Evidence state</p>
                <strong>{scorecard.evidenceReadinessState}</strong>
              </article>
              <article className="future-card">
                <p className="board-card-subtitle">Open actions</p>
                <strong>{actionSummary.openCount}</strong>
              </article>
              <article className="future-card">
                <p className="board-card-subtitle">Blocked actions</p>
                <strong>{actionSummary.blockedCount}</strong>
              </article>
              <article className="future-card">
                <p className="board-card-subtitle">Reviewer verification</p>
                <strong>{actionSummary.reviewerVerificationCount}</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="surface-panel arb-summary-card">
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Weighted domain scores</p>
              <h2 className="section-title">See where the score is strong and where it still needs proof.</h2>
            </div>
          </div>

          <div className="arb-score-bar-list">
            {scorecard.domainScores.map((domainScore) => (
              <article key={domainScore.domain} className="trace-card arb-score-bar-row">
                <div className="arb-score-bar-head">
                  <div>
                    <h3>{domainScore.domain}</h3>
                    <p className="microcopy">{domainScore.reason}</p>
                  </div>
                  <strong>
                    {getDomainScorePercent(domainScore)}% ({domainScore.score}/{domainScore.weight})
                  </strong>
                </div>
                <div className="arb-score-bar-track" aria-hidden="true">
                  <span
                    className={`arb-score-bar-fill arb-score-bar-fill--${getPercentTone(
                      getDomainScorePercent(domainScore)
                    )}`}
                    style={{ width: `${getDomainScorePercent(domainScore)}%` }}
                  />
                </div>
                {domainScore.linkedFindings.length > 0 ? (
                  <div className="arb-score-linked-list">
                    {domainScore.linkedFindings.map((linkedFindingId) => (
                      <span key={linkedFindingId} className="arb-score-linked-chip">
                        {linkedFindingId}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          {scorecard.reviewerOverride ? (
            <article className="trace-card arb-summary-card">
              <p className="board-card-subtitle">Reviewer override recorded</p>
              <strong>{scorecard.reviewerOverride.overrideDecision}</strong>
              <p>{scorecard.reviewerOverride.overrideRationale}</p>
              <p className="microcopy">
                Recorded by {scorecard.reviewerOverride.reviewerName} on{" "}
                {new Date(scorecard.reviewerOverride.overriddenAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit"
                })}
              </p>
            </article>
          ) : (
            <article className="trace-card arb-summary-card">
              <p className="board-card-subtitle">Score override</p>
              <p className="section-copy">If the AI score does not reflect your judgment, proceed to the Decision step to record the human decision with rationale. The reviewer decision always takes precedence over the AI recommendation.</p>
              <a href={getArbStepHref(reviewId, "decision")} className="secondary-button" style={{ display: "inline-block", marginTop: 8 }}>
                Go to Decision →
              </a>
            </article>
          )}
        </section>

        {actionSummary.openActions.length > 0 ? (
          <section className="surface-panel arb-summary-card">
            <div className="board-card-head">
              <div className="board-card-head-copy">
                <p className="board-card-subtitle">Conditions to close</p>
                <h2 className="section-title">These actions still affect whether sign-off is realistic.</h2>
              </div>
            </div>

            <div className="arb-conditions-table" role="table" aria-label="Open remediation actions">
              <div className="arb-conditions-row arb-conditions-row-head" role="row">
                <span role="columnheader">Action</span>
                <span role="columnheader">Owner</span>
                <span role="columnheader">Due</span>
                <span role="columnheader">Status</span>
              </div>
              {actionSummary.openActions.map((action) => (
                <div key={action.actionId} className="arb-conditions-row" role="row">
                  <span role="cell">{action.actionSummary}</span>
                  <span role="cell">{action.owner ?? "Unassigned"}</span>
                  <span role="cell">{action.dueDate ?? "No date"}</span>
                  <span role="cell">{action.status}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {renderOutputArtifactsCard()}
      </div>
    );
  }

  function renderDecisionContent() {
    return (
      <div className="arb-page-stack">
        {decisionGateMessage ? (
          <section className="trace-card arb-decision-gate-banner">
            <p className="board-card-subtitle">Action required before sign-off</p>
            <p className="section-copy">{decisionGateMessage}</p>
          </section>
        ) : null}
        <div className="arb-decision-grid">
          <section className="surface-panel arb-summary-card">
            <div className="board-card-head">
              <div className="board-card-head-copy">
                <p className="board-card-subtitle">Decision posture</p>
                <h2 className="section-title">Review status before sign-off</h2>
              </div>
            </div>
            <div className="arb-summary-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              <article className="future-card">
                <p className="board-card-subtitle">Open actions</p>
                <strong style={{ color: actionSummary.openCount > 0 ? "var(--warning)" : undefined }}>{actionSummary.openCount}</strong>
              </article>
              <article className="future-card">
                <p className="board-card-subtitle">Blocked actions</p>
                <strong style={{ color: actionSummary.blockedCount > 0 ? "var(--error)" : undefined }}>{actionSummary.blockedCount}</strong>
              </article>
              <article className="future-card">
                <p className="board-card-subtitle">Needs verification</p>
                <strong style={{ color: actionSummary.reviewerVerificationCount > 0 ? "var(--warning)" : undefined }}>{actionSummary.reviewerVerificationCount}</strong>
              </article>
            </div>
            <p className="section-copy" style={{ marginBottom: 8 }}>The AI recommendation is advisory. Your recorded decision below is the binding outcome for this review.</p>
            {actionSummary.openActions.length > 0 ? (
              <ul className="arb-checklist">
                {actionSummary.openActions.map((action) => (
                  <li key={action.actionId}>
                    {action.actionSummary} ({action.status})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No open actions remain for this review.</p>
            )}
            {decisionResult ? (
              <div className="trace-card arb-summary-card arb-decision-recorded">
                <p className="board-card-subtitle">Decision recorded</p>
                <div className="arb-decision-recorded-grid">
                  <div><span className="microcopy">Decision</span><strong>{decisionResult.reviewerDecision}</strong></div>
                  <div><span className="microcopy">AI recommendation</span><strong>{decisionResult.aiRecommendation}</strong></div>
                  {decisionResult.reviewerName && <div><span className="microcopy">Reviewer</span><strong>{decisionResult.reviewerName}</strong></div>}
                  {decisionResult.reviewerRole && <div><span className="microcopy">Role</span><strong>{decisionResult.reviewerRole}</strong></div>}
                  <div><span className="microcopy">Recorded at</span><strong>{new Date(decisionResult.recordedAt).toLocaleString()}</strong></div>
                </div>
                {decisionResult.rationale && <p className="section-copy" style={{ marginTop: 8 }}>{decisionResult.rationale}</p>}
              </div>
            ) : null}
          </section>

          <section className="surface-panel arb-summary-card">
            <div className="board-card-head">
              <div className="board-card-head-copy">
                <p className="board-card-subtitle">Reviewer sign-off</p>
                <h2 className="section-title">Record the human decision — separate from the AI recommendation</h2>
              </div>
            </div>
            <div className="arb-form-grid">
              <label className="filter-field">
                <span>Reviewer name</span>
                <input
                  className="field-input"
                  aria-label="Reviewer name"
                  placeholder="Your name"
                  value={decisionReviewerName}
                  onChange={(event) => setDecisionReviewerName(event.target.value)}
                />
              </label>
              <label className="filter-field">
                <span>Reviewer role</span>
                <input
                  className="field-input"
                  aria-label="Reviewer role"
                  placeholder="e.g. Principal Architect, Cloud Director"
                  value={decisionReviewerRole}
                  onChange={(event) => setDecisionReviewerRole(event.target.value)}
                />
              </label>
            </div>
            <label className="filter-field">
              <span>Final decision</span>
              <select
                className="field-select"
                aria-label="Final decision"
                value={decisionChoice}
                onChange={(event) => setDecisionChoice(event.target.value)}
              >
                <option value="Approved">Approved</option>
                <option value="Needs Revision">Needs Revision</option>
                <option value="Rejected">Rejected</option>
              </select>
            </label>
            <label className="filter-field">
              <span>Decision rationale</span>
              <textarea
                className="field-textarea"
                aria-label="Decision rationale"
                placeholder="Summarise the basis for this decision, any conditions, and what must happen before approval is unconditional."
                value={decisionRationale}
                onChange={(event) => setDecisionRationale(event.target.value)}
              />
            </label>
            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => void submitDecision()}
                disabled={decisionSaving || Boolean(decisionGateMessage)}
              >
                {decisionSaving ? "Recording decision..." : "Record decision"}
              </button>
            </div>
            {decisionError ? <p className="arb-upload-error">{decisionError}</p> : null}
          </section>
        </div>

        {renderOutputArtifactsCard()}
      </div>
    );
  }

  function renderDefaultContent() {
    const footer =
      activeStep === "overview" ? (
        <div className="arb-summary-grid">
          <article className="future-card">
            <p className="board-card-subtitle">Workflow State</p>
            <strong>{shellReview.workflowState}</strong>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Evidence State</p>
            <strong>{shellReview.evidenceReadinessState}</strong>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Recommendation</p>
            <strong>{shellReview.recommendation}</strong>
          </article>
        </div>
      ) : null;

    return (
      <ArbPlaceholderPage
        intro="This step is wired to the ARB route model and ready for deeper implementation on top of the live workspace shell."
        bullets={buildBullets(activeStep, findings, scorecard)}
        footer={footer}
      />
    );
  }

  function renderStepContent() {
    if (activeStep === "upload") {
      return renderUploadContent();
    }

    if (activeStep === "findings") {
      return renderFindingsContent();
    }

    if (activeStep === "requirements") {
      return renderRequirementsContent();
    }

    if (activeStep === "evidence") {
      return renderEvidenceContent();
    }

    if (activeStep === "scorecard") {
      return renderScorecardContent();
    }

    if (activeStep === "decision") {
      return renderDecisionContent();
    }

    return renderDefaultContent();
  }

  return (
    <ArbReviewShell
      review={shellReview}
      steps={getArbReviewSteps(reviewId)}
      activeStep={activeStep}
      title={title}
      description={description}
      reviewSummary={scorecard?.reviewSummary ?? null}
    >
      {loading ? (
        <div className="arb-loading-skeleton">
          <div className="arb-skeleton-bar arb-skeleton-bar--wide" />
          <div className="arb-skeleton-bar arb-skeleton-bar--medium" />
          <div className="arb-skeleton-bar arb-skeleton-bar--narrow" />
          <div className="arb-skeleton-bar arb-skeleton-bar--wide" />
          <div className="arb-skeleton-bar arb-skeleton-bar--medium" />
        </div>
      ) : error ? (
        <div>
          <p>{error}</p>
          {authRequired ? (
            <div className="review-command-bar">
              <p>Sign in to open Azure-backed uploads, findings, exports, and decision state for this review.</p>
              <div className="review-command-actions">
                {ENABLED_AUTH_PROVIDERS.map((provider, index) => (
                  <a
                    key={provider.id}
                    href={buildLoginUrl(provider.id)}
                    className={index === 0 ? "primary-button" : "secondary-button"}
                  >
                    Continue with {provider.label}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p>This scaffold expects the Function App ARB endpoints to be available.</p>
          )}
        </div>
      ) : (
        renderStepContent()
      )}
    </ArbReviewShell>
  );
}
