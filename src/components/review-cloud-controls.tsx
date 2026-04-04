"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChecklistItem, ReviewDraft, StaticWebAppClientPrincipal } from "@/types";
import {
  buildStructuredReviewRecords,
  downloadCloudReviewCsv,
  fetchClientPrincipal,
  loadCloudReviewRecords,
  saveCloudReviewRecords,
  structuredRecordsToReviewMap
} from "@/lib/review-cloud";

type ReviewCloudControlsProps = {
  items: ChecklistItem[];
  reviews: Record<string, ReviewDraft>;
  onReplaceReviews: (reviews: Record<string, ReviewDraft>) => void;
  continueHref?: string;
};

type BusyAction = "load" | "save" | "download" | null;

function getLoginUrl() {
  if (typeof window === "undefined") {
    return "/.auth/login/aad";
  }

  return `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(window.location.href)}`;
}

export function ReviewCloudControls({
  items,
  reviews,
  onReplaceReviews,
  continueHref
}: ReviewCloudControlsProps) {
  const [principal, setPrincipal] = useState<StaticWebAppClientPrincipal | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [statusMessage, setStatusMessage] = useState("Stored in this browser until you save to Azure.");
  const structuredRecords = useMemo(
    () => buildStructuredReviewRecords(items, reviews),
    [items, reviews]
  );

  useEffect(() => {
    let active = true;

    fetchClientPrincipal()
      .then((nextPrincipal) => {
        if (active) {
          setPrincipal(nextPrincipal);
          setAuthResolved(true);
        }
      })
      .catch(() => {
        if (active) {
          setPrincipal(null);
          setAuthResolved(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function loadFromAzure() {
    try {
      setBusyAction("load");
      const document = await loadCloudReviewRecords();

      onReplaceReviews(structuredRecordsToReviewMap(document.records));
      setStatusMessage(
        document.recordCount > 0
          ? `Loaded ${document.recordCount.toLocaleString()} saved review records from Azure Storage.`
          : "No saved Azure review records were found for this signed-in user."
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to load saved review records.");
    } finally {
      setBusyAction(null);
    }
  }

  async function saveToAzure() {
    try {
      setBusyAction("save");
      const document = await saveCloudReviewRecords(structuredRecords);

      setStatusMessage(
        `Saved ${document.recordCount.toLocaleString()} structured review records to Azure Storage.`
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to save review records.");
    } finally {
      setBusyAction(null);
    }
  }

  async function downloadCsv() {
    try {
      setBusyAction("download");
      const result = await downloadCloudReviewCsv(structuredRecords);

      setStatusMessage(
        result.artifactPath
          ? `Downloaded ${result.filename} and stored the CSV artifact in Azure Storage.`
          : `Downloaded ${result.filename}.`
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to generate the CSV artifact.");
    } finally {
      setBusyAction(null);
    }
  }

  if (!authResolved) {
    return (
      <section className="filter-card cloud-sync-card">
        <p className="eyebrow">Azure-backed save and reuse</p>
        <h3>Checking sign-in status for this project review.</h3>
        <p className="microcopy">
          Your local notes stay available in this browser either way. Sign-in is only needed when
          you want Azure-backed save, reload, and cloud-generated CSV export.
        </p>
      </section>
    );
  }

  if (!principal) {
    return (
      <section className="filter-card cloud-sync-card">
        <p className="eyebrow">Step 7</p>
        <h3>Sign in to save and reuse this project review.</h3>
        <p className="microcopy">
          You can keep browsing services, writing notes, and downloading local project-review
          exports without signing in. Use Microsoft Entra ID only when you want Azure-backed save,
          reload, and a cloud-generated CSV artifact for the current review.
        </p>
        <div className="button-row">
          <a href={getLoginUrl()} className="primary-button">
            Sign in with Microsoft Entra ID
          </a>
          {continueHref ? (
            <a href={continueHref} className="ghost-button">
              Keep working locally
            </a>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="filter-card cloud-sync-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Step 7</p>
          <h3>Save this project review to Azure, then reload it later when needed.</h3>
          <p className="microcopy">
            Signed in as {principal.userDetails || principal.userId}. This keeps the current
            project-review notes in Azure Storage and lets you generate a cloud-backed CSV artifact
            only when you ask for it.
          </p>
        </div>
        <div className="chip-row">
          <span className="chip">{structuredRecords.length.toLocaleString()} saved-worthy records</span>
        </div>
      </div>
      <div className="button-row">
        <button
          type="button"
          className="secondary-button"
          onClick={loadFromAzure}
          disabled={busyAction !== null}
        >
          {busyAction === "load" ? "Loading..." : "Load project review"}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={saveToAzure}
          disabled={busyAction !== null}
        >
          {busyAction === "save" ? "Saving..." : "Save project review"}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={downloadCsv}
          disabled={busyAction !== null}
        >
          {busyAction === "download" ? "Preparing CSV..." : "Download Azure CSV"}
        </button>
        <a href="/.auth/logout" className="ghost-button">
          Sign out
        </a>
      </div>
      <p className="microcopy">{statusMessage}</p>
    </section>
  );
}
