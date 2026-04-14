"use client";

import { useAuthSession } from "@/components/auth-session-provider";
import { useEffect, useRef, useState } from "react";
import { createArbReview, listArbReviews, uploadArbFiles } from "@/arb/api";
import { getArbStepHref } from "@/arb/routes";
import type { ArbReviewSummary } from "@/arb/types";
import { SUPPORTED_ARB_UPLOAD_EXTENSIONS } from "@/components/arb/upload-extensions";

const WORKFLOW_STEPS = [
  { id: 1, label: "Sign in", detail: "Use your supported account" },
  { id: 2, label: "Create review", detail: "Name your project and customer" },
  {
    id: 3,
    label: "Upload documents",
    detail: "Documents, diagrams, spreadsheets, images, IaC, scripts, and archives"
  },
  {
    id: 4,
    label: "Architecture Assurance Assessment",
    detail: "Automated framework assessment across WAF, CAF, ALZ, HA/DR, Security + more"
  },
  { id: 5, label: "Review findings", detail: "Scored 0–100, linked to Microsoft Learn" },
  { id: 6, label: "Sign off & export", detail: "CSV, HTML, Markdown — board-ready pack" },
];

function getActiveStep(review: ArbReviewSummary): number {
  const s = review.workflowState;
  if (s === "Draft") return 2;
  if (s === "Evidence Ready") return 3;
  if (s === "Review In Progress") return 4;
  if (s === "Decision Recorded" || s === "Approved" || s === "Needs Revision" || s === "Rejected") return 5;
  if (s === "Review Complete" || s === "Closed") return 6;
  return 1;
}

function getStepHref(review: ArbReviewSummary) {
  const resolvedReviewId = String(review.reviewId ?? "").trim();
  if (!resolvedReviewId || resolvedReviewId === "undefined" || resolvedReviewId === "null") {
    return "/arb";
  }
  const step = getActiveStep(review);
  if (step <= 3) return getArbStepHref(resolvedReviewId, "upload", "upload-documents");
  if (step === 4) return getArbStepHref(resolvedReviewId, "upload", "run-ai-analysis");
  if (step === 5) return getArbStepHref(resolvedReviewId, "decision");
  return getArbStepHref(resolvedReviewId, "overview");
}

function hasValidReviewId(review: ArbReviewSummary): boolean {
  const reviewId = String(review.reviewId ?? "").trim();
  return Boolean(reviewId) && reviewId !== "undefined" && reviewId !== "null";
}

export default function HomeClientSection() {
  const { principal, resolved, signedIn } = useAuthSession();
  const [latestReview, setLatestReview] = useState<ArbReviewSummary | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    if (!resolved) {
      return () => { active = false; };
    }
    if (!principal) {
      setLatestReview(null);
      return () => { active = false; };
    }
    async function loadLatestReview() {
      try {
        const payload = await listArbReviews();
        if (!active) return;
        const sorted = [...payload.reviews]
          .filter(hasValidReviewId)
          .sort((a, b) => new Date(b.lastUpdated ?? 0).getTime() - new Date(a.lastUpdated ?? 0).getTime());
        setLatestReview(sorted[0] ?? null);
      } catch {
        if (active) setLatestReview(null);
      }
    }
    void loadLatestReview();
    return () => { active = false; };
  }, [principal, resolved]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    try {
      setUploading(true);
      setUploadError(null);
      const firstName = fileList[0].name.replace(/\.[^.]+$/, "").slice(0, 80);
      const review = await createArbReview({ projectName: firstName || "Architecture Review", customerName: "" });
      await uploadArbFiles({ reviewId: review.reviewId, files: Array.from(fileList) });
      window.location.href = getArbStepHref(review.reviewId, "upload", "upload-documents");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed — please try again.");
      setUploading(false);
    }
  }

  return (
    <main className="impact-home">
      {/* ── HERO ── */}
      <section className="impact-section impact-section-hero">
        <img src="/logo.png" alt="Azure Review Assistant" className="hero-brand-mark" />
        <span className="impact-kicker">Architecture reviews that ship</span>
        <h1 className="impact-headline">
          Upload architecture docs. Get board-ready Azure findings in minutes.
        </h1>
        <p className="impact-subline">
          Upload your SOW or design document and get scored, evidence-linked findings across WAF, CAF, ALZ, HA/DR, Security, Networking, and Monitoring.
        </p>
        {/* Upload zone — the action IS the page */}
        {!resolved ? (
          <div className="hero-upload-zone hero-upload-zone--loading">
            <span className="impact-auth-loading">Checking sign-in status…</span>
          </div>
        ) : signedIn ? (
          <div
            className={`hero-upload-zone${dropActive ? " hero-upload-zone--active" : ""}${uploading ? " hero-upload-zone--uploading" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
            onDragLeave={() => setDropActive(false)}
            onDrop={(e) => { e.preventDefault(); setDropActive(false); void handleFiles(e.dataTransfer.files); }}
            aria-label="Upload architecture documents"
          >
            {/* Full-zone overlay input — clicking anywhere on the zone triggers file picker natively */}
            <label htmlFor="file-upload" className="arb-upload-label">
              <span className="arb-upload-icon">📁</span>
              <span>Upload Architecture Docs</span>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                multiple
                accept={SUPPORTED_ARB_UPLOAD_EXTENSIONS.join(",")}
                className="hero-upload-input"
                aria-label="Upload architecture review documents"
                disabled={uploading}
                style={{ display: 'none' }}
                onChange={(e) => { void handleFiles(e.target.files); e.currentTarget.value = ""; }}
              />
            </label>
            {uploading ? (
              <>
                <span className="hero-upload-icon">⏳</span>
                <p className="hero-upload-title">Creating review and uploading…</p>
                <p className="hero-upload-sub">You will be taken to the analysis page automatically.</p>
              </>
            ) : (
              <>
                <span className="hero-upload-icon">📄</span>
                <p className="hero-upload-title">Drop your SOW or design doc here</p>
                <p className="hero-upload-sub arb-upload-helper">or <span className="hero-upload-link">click to upload files</span> <br />
                  <span className="arb-upload-helper-text">Accepted: PDF, DOCX, PPTX, XLSX, images, IaC, scripts, notebooks, archives</span>
                </p>
                {uploadError && <p className="arb-upload-error">{uploadError}</p>}
              </>
            )}
          </div>
        ) : (
          <div className="hero-upload-zone">
            <span className="impact-auth-loading">Sign in to upload architecture documents.</span>
          </div>
        )}
      </section>
      {/* ...other sections can be added here... */}
    </main>
  );
}
