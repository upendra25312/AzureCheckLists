"use client";

import { useEffect, useState } from "react";
import {
  createArbAction,
  fetchArbActions,
  fetchArbDecision,
  fetchArbFindings,
  fetchArbReview,
  fetchArbScorecard,
  recordArbDecision,
  updateArbAction,
  updateArbFinding
} from "@/arb/api";
import { getArbReviewSteps } from "@/arb/mock-review";
import type {
  ArbAction,
  ArbDecision,
  ArbFinding,
  ArbReviewSummary,
  ArbReviewStepKey,
  ArbScorecard
} from "@/arb/types";
import { ArbPlaceholderPage } from "@/components/arb/placeholder-page";
import { ArbReviewShell } from "@/components/arb/review-shell";

type LocalUploadItem = {
  id: string;
  name: string;
  sizeLabel: string;
  category: string;
  status: string;
  supported: boolean;
};

const UPLOAD_STORAGE_KEY_PREFIX = "arb-upload-stage:";
const SUPPORTED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".vsdx"
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

function buildUploadStorageKey(reviewId: string) {
  return `${UPLOAD_STORAGE_KEY_PREFIX}${reviewId}`;
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

function getFileExtension(name: string) {
  const lastIndex = name.lastIndexOf(".");

  if (lastIndex === -1) {
    return "";
  }

  return name.slice(lastIndex).toLowerCase();
}

function resolveUploadCategory(name: string) {
  const extension = getFileExtension(name);

  if ([".pdf", ".doc", ".docx"].includes(extension)) {
    return "Narrative / requirements";
  }

  if ([".ppt", ".pptx"].includes(extension)) {
    return "Architecture presentation";
  }

  if ([".xls", ".xlsx", ".csv"].includes(extension)) {
    return "Workbook / cost model";
  }

  if ([".png", ".jpg", ".jpeg", ".svg", ".vsdx"].includes(extension)) {
    return "Diagram / visual evidence";
  }

  return "Unsupported";
}

function createUploadItem(file: File): LocalUploadItem {
  const category = resolveUploadCategory(file.name);

  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    sizeLabel: formatFileSize(file.size),
    category,
    status: category === "Unsupported" ? "Unsupported type" : "Staged locally",
    supported: category !== "Unsupported"
  };
}

export function ArbLiveReviewStep(props: {
  reviewId: string;
  activeStep: ArbReviewStepKey;
  title: string;
  description: string;
}) {
  const { reviewId, activeStep, title, description } = props;
  const [review, setReview] = useState<ArbReviewSummary | null>(null);
  const [findings, setFindings] = useState<ArbFinding[]>([]);
  const [actions, setActions] = useState<ArbAction[]>([]);
  const [scorecard, setScorecard] = useState<ArbScorecard | null>(null);
  const [findingSavingId, setFindingSavingId] = useState<string | null>(null);
  const [actionSavingFindingId, setActionSavingFindingId] = useState<string | null>(null);
  const [actionSavingId, setActionSavingId] = useState<string | null>(null);
  const [findingError, setFindingError] = useState<string | null>(null);
  const [decisionChoice, setDecisionChoice] = useState("Approved with Conditions");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [decisionResult, setDecisionResult] = useState<ArbDecision | null>(null);
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stagedUploads, setStagedUploads] = useState<LocalUploadItem[]>([]);
  const [uploadReady, setUploadReady] = useState(false);
  const [confidentialityConfirmed, setConfidentialityConfirmed] = useState(false);
  const [uploadDropActive, setUploadDropActive] = useState(false);
  const actionSummary = summarizeActions(actions);

  let decisionGateMessage: string | null = null;

  if (actionSummary.blockedCount > 0) {
    decisionGateMessage =
      "Blocked actions remain. Resolve or reclassify blocked remediation items before recording a final decision.";
  } else if (actionSummary.reviewerVerificationCount > 0) {
    decisionGateMessage =
      "Reviewer verification is still required for at least one open action before a final decision can be recorded.";
  } else if (decisionChoice === "Approved" && actionSummary.openCount > 0) {
    decisionGateMessage =
      "Approved decisions require all remediation actions to be closed first. Use Approved with Conditions while open actions remain.";
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

  function stageFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextItems = Array.from(fileList).map((file) => createUploadItem(file));

    setStagedUploads((currentItems) => {
      const knownKeys = new Set(currentItems.map((item) => `${item.name}-${item.sizeLabel}-${item.category}`));
      const dedupedNewItems = nextItems.filter(
        (item) => !knownKeys.has(`${item.name}-${item.sizeLabel}-${item.category}`)
      );

      return [...currentItems, ...dedupedNewItems];
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const reviewResponse = await fetchArbReview(reviewId);
        const findingsResponse = activeStep === "findings" ? await fetchArbFindings(reviewId) : [];
        const actionsResponse =
          activeStep === "findings" || activeStep === "scorecard" || activeStep === "decision"
            ? await fetchArbActions(reviewId)
            : [];
        const scorecardResponse =
          activeStep === "scorecard" ? await fetchArbScorecard(reviewId) : null;
        const decisionResponse =
          activeStep === "decision" ? await fetchArbDecision(reviewId) : null;

        if (!cancelled) {
          setReview(reviewResponse);
          setFindings(findingsResponse);
          setActions(actionsResponse);
          setScorecard(scorecardResponse);
          setDecisionResult(decisionResponse);
          setDecisionChoice(decisionResponse?.reviewerDecision || "Approved with Conditions");
          setDecisionRationale(decisionResponse?.rationale || "");
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
    if (activeStep !== "upload" || typeof window === "undefined") {
      return;
    }

    const payload = window.sessionStorage.getItem(buildUploadStorageKey(reviewId));

    if (!payload) {
      setStagedUploads([]);
      setUploadReady(false);
      setConfidentialityConfirmed(false);
      return;
    }

    try {
      const parsed = JSON.parse(payload) as {
        uploads?: LocalUploadItem[];
        ready?: boolean;
        confidentialityConfirmed?: boolean;
      };

      setStagedUploads(parsed.uploads ?? []);
      setUploadReady(Boolean(parsed.ready));
      setConfidentialityConfirmed(Boolean(parsed.confidentialityConfirmed));
    } catch {
      setStagedUploads([]);
      setUploadReady(false);
      setConfidentialityConfirmed(false);
    }
  }, [activeStep, reviewId]);

  useEffect(() => {
    if (activeStep !== "upload" || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      buildUploadStorageKey(reviewId),
      JSON.stringify({
        uploads: stagedUploads,
        ready: uploadReady,
        confidentialityConfirmed
      })
    );
  }, [activeStep, reviewId, stagedUploads, uploadReady, confidentialityConfirmed]);

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
        rationale: decisionRationale
      });

      setDecisionResult(nextDecision);
      setDecisionChoice(nextDecision.reviewerDecision);
      setDecisionRationale(nextDecision.rationale);
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

  function renderUploadContent() {
    const supportedUploads = stagedUploads.filter((item) => item.supported);
    const unsupportedUploads = stagedUploads.filter((item) => !item.supported);
    const readinessChecks = [
      {
        label: "At least one supported source file is staged",
        complete: supportedUploads.length > 0
      },
      {
        label: "Narrative or design evidence is present",
        complete: supportedUploads.some((item) =>
          ["Narrative / requirements", "Architecture presentation", "Diagram / visual evidence"].includes(
            item.category
          )
        )
      },
      {
        label: "Confidentiality and handling note is acknowledged",
        complete: confidentialityConfirmed
      }
    ];
    const extractionPreview =
      supportedUploads.length === 0
        ? [
            "Requirements and scope from the SOW or design narrative",
            "Topology, service, network, and security evidence from architecture docs",
            "Cost, support, and runbook signals from workbooks or appendices"
          ]
        : Array.from(new Set(supportedUploads.map((item) => item.category))).map(
            (category) => `Extraction will inspect: ${category}`
          );
    const canMarkReady = readinessChecks.every((check) => check.complete);

    return (
      <div className="arb-page-stack">
        <div className="arb-summary-grid">
          <article className="future-card">
            <p className="board-card-subtitle">Files staged for extraction</p>
            <strong>{supportedUploads.length}</strong>
            <p className="section-copy">
              Supported files are staged locally and ready to feed the later extraction pipeline.
            </p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Unsupported files</p>
            <strong>{unsupportedUploads.length}</strong>
            <p className="section-copy">
              Unsupported uploads stay visible so reviewers can remove or replace them before handoff.
            </p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Readiness gate</p>
            <strong>{canMarkReady ? "Ready" : "In progress"}</strong>
            <p className="section-copy">
              Gate the package before extraction so the downstream findings remain grounded.
            </p>
          </article>
        </div>

        <section
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
            stageFiles(event.dataTransfer.files);
          }}
        >
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Upload</p>
              <h2 className="section-title">Stage the review package before extraction begins</h2>
            </div>
          </div>

          <p className="section-copy">
            Drag files here or use the file picker. This step is real, but it currently stages
            files locally in this browser session until Blob-backed upload lands.
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
            onChange={(event) => stageFiles(event.target.files)}
          />
          <p className="microcopy">
            Accepted types: PDF, Office docs, spreadsheets, images, SVG, and VSDX. The next
            backend slice will connect this staging surface to secure upload and extraction.
          </p>
        </section>

        <div className="arb-upload-layout">
          <section className="surface-panel">
            <div className="board-card-head">
              <div className="board-card-head-copy">
                <p className="board-card-subtitle">Staged files</p>
                <h2 className="section-title">Review the package contents before extraction</h2>
              </div>
            </div>
            {stagedUploads.length === 0 ? (
              <p className="section-copy">
                No files staged yet. Add the SOW, architecture pack, diagram, or workbook to start
                the review package.
              </p>
            ) : (
              <div className="arb-upload-file-list">
                {stagedUploads.map((upload) => (
                  <article key={upload.id} className="trace-card arb-upload-file">
                    <div className="arb-upload-file-copy">
                      <strong>{upload.name}</strong>
                      <p className="microcopy">
                        {upload.category} · {upload.sizeLabel} · {upload.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setStagedUploads((currentItems) =>
                          currentItems.filter((item) => item.id !== upload.id)
                        );
                        setUploadReady(false);
                      }}
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="arb-sidecar-stack">
            <section className="future-card arb-summary-card">
              <p className="board-card-subtitle">What will be extracted</p>
              <ul className="arb-checklist">
                {extractionPreview.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="trace-card arb-summary-card">
              <p className="board-card-subtitle">Confidentiality and readiness</p>
              <p className="section-copy">
                Upload only material that the review team is allowed to inspect and summarize.
                Package readiness should be explicit before automated extraction starts.
              </p>
              <label className="arb-inline-check">
                <input
                  aria-label="Confirm uploaded files can be used for review extraction"
                  type="checkbox"
                  checked={confidentialityConfirmed}
                  onChange={(event) => setConfidentialityConfirmed(event.target.checked)}
                />
                <span>Confirm uploaded files can be used for review extraction</span>
              </label>
              <ul className="arb-checklist">
                {readinessChecks.map((check) => (
                  <li key={check.label}>
                    {check.complete ? "Ready" : "Pending"}: {check.label}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="primary-button"
                disabled={!canMarkReady}
                onClick={() => setUploadReady(true)}
              >
                Mark package ready for extraction
              </button>
              {uploadReady ? (
                <p className="microcopy">
                  Package staged locally for extraction. Blob-backed upload and document processing
                  will connect in the next backend slice.
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    );
  }

  function renderFindingsContent() {
    const criticalBlockerCount = findings.filter((finding) => finding.criticalBlocker).length;
    const missingEvidenceCount = findings.reduce(
      (total, finding) => total + finding.missingEvidence.length,
      0
    );

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

        <div className="arb-finding-grid">
          {findings.map((finding) => (
            <section key={finding.findingId} className="surface-panel arb-finding-card">
              <div className="board-card-head">
                <div className="board-card-head-copy">
                  <p className="board-card-subtitle">
                    {finding.severity} · {finding.domain} · {finding.findingType}
                  </p>
                  <h2 className="section-title arb-finding-title">{finding.title}</h2>
                </div>
                <div className="board-card-icon-pill" aria-hidden="true">
                  {finding.severity.slice(0, 1)}
                </div>
              </div>

              <p className="section-copy">{finding.findingStatement}</p>
              <p>Why it matters: {finding.whyItMatters}</p>
              <p>Recommendation: {finding.recommendation}</p>
              {finding.missingEvidence.length > 0 ? (
                <p>Missing evidence: {finding.missingEvidence.join(", ")}</p>
              ) : null}

              <div className="arb-field-grid">
                <label className="filter-field">
                  <span>Status</span>
                  <select
                    className="field-select"
                    aria-label={`Status for ${finding.title}`}
                    value={finding.status}
                    onChange={(event) => {
                      const nextStatus = event.target.value;
                      updateLocalFinding(finding.findingId, (current) => ({
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
                    aria-label={`Owner for ${finding.title}`}
                    value={finding.owner ?? ""}
                    placeholder={finding.suggestedOwner ?? "Assign owner"}
                    onChange={(event) => {
                      const nextOwner = event.target.value;
                      updateLocalFinding(finding.findingId, (current) => ({
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
                    aria-label={`Due date for ${finding.title}`}
                    type="date"
                    value={finding.dueDate ?? ""}
                    onChange={(event) => {
                      const nextDueDate = event.target.value;
                      updateLocalFinding(finding.findingId, (current) => ({
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
                  aria-label={`Reviewer note for ${finding.title}`}
                  value={finding.reviewerNote ?? ""}
                  onChange={(event) => {
                    const nextReviewerNote = event.target.value;
                    updateLocalFinding(finding.findingId, (current) => ({
                      ...current,
                      reviewerNote: nextReviewerNote || null
                    }));
                  }}
                />
              </label>

              <label className="arb-inline-check">
                <input
                  aria-label={`Critical blocker for ${finding.title}`}
                  type="checkbox"
                  checked={finding.criticalBlocker}
                  onChange={(event) => {
                    const nextCriticalBlocker = event.target.checked;
                    updateLocalFinding(finding.findingId, (current) => ({
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
                  onClick={() => void saveFinding(finding)}
                  disabled={findingSavingId === finding.findingId}
                >
                  {findingSavingId === finding.findingId ? "Saving finding..." : "Save finding"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void createActionForFinding(finding)}
                  disabled={
                    actionSavingFindingId === finding.findingId ||
                    actions.some((action) => action.sourceFindingId === finding.findingId)
                  }
                >
                  {actions.some((action) => action.sourceFindingId === finding.findingId)
                    ? "Action created"
                    : actionSavingFindingId === finding.findingId
                      ? "Creating action..."
                      : "Create action"}
                </button>
              </div>
            </section>
          ))}
        </div>

        <section className="surface-panel arb-summary-card">
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Action summary</p>
              <h2 className="section-title">Tracked remediation actions</h2>
            </div>
          </div>

          {actions.length === 0 ? (
            <p>No ARB actions created yet.</p>
          ) : (
            <div className="arb-action-list">
              {actions.map((action) => (
                <section key={action.actionId} className="trace-card arb-action-card">
                  <h3>{action.actionSummary}</h3>
                  <p>Severity: {action.severity}</p>
                  <div className="arb-field-grid">
                    <label className="filter-field">
                      <span>Action status</span>
                      <select
                        className="field-select"
                        aria-label={`Status for ${action.actionSummary}`}
                        value={action.status}
                        onChange={(event) => {
                          const nextStatus = event.target.value;
                          updateLocalAction(action.actionId, (current) => ({
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
                        aria-label={`Owner for ${action.actionSummary}`}
                        value={action.owner ?? ""}
                        onChange={(event) => {
                          const nextOwner = event.target.value;
                          updateLocalAction(action.actionId, (current) => ({
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
                        aria-label={`Due date for ${action.actionSummary}`}
                        type="date"
                        value={action.dueDate ?? ""}
                        onChange={(event) => {
                          const nextDueDate = event.target.value;
                          updateLocalAction(action.actionId, (current) => ({
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
                      aria-label={`Closure notes for ${action.actionSummary}`}
                      value={action.closureNotes ?? ""}
                      onChange={(event) => {
                        const nextClosureNotes = event.target.value;
                        updateLocalAction(action.actionId, (current) => ({
                          ...current,
                          closureNotes: nextClosureNotes || null
                        }));
                      }}
                    />
                  </label>
                  <label className="arb-inline-check">
                    <input
                      aria-label={`Reviewer verification required for ${action.actionSummary}`}
                      type="checkbox"
                      checked={action.reviewerVerificationRequired}
                      onChange={(event) => {
                        const nextReviewerVerificationRequired = event.target.checked;
                        updateLocalAction(action.actionId, (current) => ({
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
                      onClick={() => void saveAction(action)}
                      disabled={actionSavingId === action.actionId}
                    >
                      {actionSavingId === action.actionId ? "Saving action..." : "Save action"}
                    </button>
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
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

    return (
      <div className="arb-page-stack">
        <div className="arb-summary-grid">
          <article className="future-card">
            <p className="board-card-subtitle">Overall score</p>
            <strong>{scorecard.overallScore ?? "TBD"}</strong>
            <p>Overall score: {scorecard.overallScore ?? "TBD"}</p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Recommendation</p>
            <strong>{scorecard.recommendation}</strong>
            <p>
              Recommendation: {scorecard.recommendation} ({scorecard.confidence} confidence)
            </p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Critical blockers</p>
            <strong>{scorecard.criticalBlockers}</strong>
            <p>Critical blockers: {scorecard.criticalBlockers}</p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Evidence readiness</p>
            <strong>{scorecard.evidenceReadinessState}</strong>
            <p>Evidence readiness: {scorecard.evidenceReadinessState}</p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Open actions</p>
            <strong>{actionSummary.openCount}</strong>
            <p>Open actions: {actionSummary.openCount}</p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Blocked actions</p>
            <strong>{actionSummary.blockedCount}</strong>
            <p>Blocked actions: {actionSummary.blockedCount}</p>
          </article>
          <article className="future-card">
            <p className="board-card-subtitle">Reviewer verification</p>
            <strong>{actionSummary.reviewerVerificationCount}</strong>
            <p>Reviewer verification required: {actionSummary.reviewerVerificationCount}</p>
          </article>
        </div>

        <section className="surface-panel arb-summary-card">
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Weighted score table</p>
              <h2 className="section-title">Explain the score before any decision is recorded</h2>
            </div>
          </div>

          <div className="arb-score-grid">
            {scorecard.domainScores.map((domainScore) => (
              <article key={domainScore.domain} className="trace-card arb-score-card">
                <h3>{domainScore.domain}</h3>
                <p>
                  {domainScore.domain}: {domainScore.score}/{domainScore.weight} - {domainScore.reason}
                  {domainScore.linkedFindings.length > 0
                    ? ` (linked findings: ${domainScore.linkedFindings.join(", ")})`
                    : ""}
                </p>
              </article>
            ))}
          </div>

          {scorecard.reviewerOverride ? (
            <div className="trace-card arb-summary-card">
              <p>Reviewer override: {scorecard.reviewerOverride.overrideDecision}</p>
              <p>Override rationale: {scorecard.reviewerOverride.overrideRationale}</p>
              <p>Override recorded at: {scorecard.reviewerOverride.overriddenAt}</p>
            </div>
          ) : null}
        </section>

        {actionSummary.openActions.length > 0 ? (
          <section className="surface-panel arb-summary-card">
            <div className="board-card-head">
              <div className="board-card-head-copy">
                <p className="board-card-subtitle">Open remediation actions</p>
                <h2 className="section-title">Conditions that still affect sign-off</h2>
              </div>
            </div>
            <ul className="arb-checklist">
              {actionSummary.openActions.map((action) => (
                <li key={action.actionId}>
                  {action.actionSummary} ({action.status})
                  {action.owner ? ` - owner: ${action.owner}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  function renderDecisionContent() {
    return (
      <div className="arb-decision-grid">
        <section className="surface-panel arb-summary-card">
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Decision posture</p>
              <h2 className="section-title">Record an explicit reviewer outcome</h2>
            </div>
          </div>
          <p>This step records and reloads the persisted reviewer decision for this ARB review.</p>
          <p>Open actions: {actionSummary.openCount}</p>
          <p>Blocked actions: {actionSummary.blockedCount}</p>
          <p>Reviewer verification required: {actionSummary.reviewerVerificationCount}</p>
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
            <div className="trace-card arb-summary-card">
              <p>Recorded at: {decisionResult.recordedAt}</p>
              <p>AI recommendation: {decisionResult.aiRecommendation}</p>
              <p>Reviewer decision: {decisionResult.reviewerDecision}</p>
              <p>Rationale: {decisionResult.rationale}</p>
            </div>
          ) : null}
        </section>

        <section className="surface-panel arb-summary-card">
          <div className="board-card-head">
            <div className="board-card-head-copy">
              <p className="board-card-subtitle">Reviewer sign-off</p>
              <h2 className="section-title">Separate the human decision from the AI recommendation</h2>
            </div>
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
              <option value="Approved with Conditions">Approved with Conditions</option>
              <option value="Needs Improvement">Needs Improvement</option>
            </select>
          </label>
          {decisionGateMessage ? <p>{decisionGateMessage}</p> : null}
          <label className="filter-field">
            <span>Decision rationale</span>
            <textarea
              className="field-textarea"
              aria-label="Decision rationale"
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
          {decisionError ? <p>{decisionError}</p> : null}
        </section>
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
    >
      {loading ? (
        <p>Loading ARB review state...</p>
      ) : error ? (
        <div>
          <p>{error}</p>
          <p>This scaffold expects the Function App ARB endpoints to be available.</p>
        </div>
      ) : (
        renderStepContent()
      )}
    </ArbReviewShell>
  );
}
