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
  onReplaceReviews
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
        <p className="eyebrow">Azure save and export</p>
        <h3>Checking sign-in status.</h3>
        <p className="microcopy">
          Structured review records can be saved to Azure Storage and turned into a CSV only when you ask for a download.
        </p>
      </section>
    );
  }

  if (!principal) {
    return (
      <section className="filter-card cloud-sync-card">
        <p className="eyebrow">Azure save and export</p>
        <h3>Sign in to store review records in Azure Storage.</h3>
        <p className="microcopy">
          Your notes still work locally without sign-in. Sign in when you want to save structured
          records to Azure and download a CSV artifact from the live site.
        </p>
        <div className="button-row">
          <a href={getLoginUrl()} className="primary-button">
            Sign in with Microsoft Entra ID
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="filter-card cloud-sync-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Azure save and export</p>
          <h3>Save structured review records, then generate CSV only when needed.</h3>
          <p className="microcopy">
            Signed in as {principal.userDetails || principal.userId}. This keeps editable notes in structured form and creates the CSV only when you click download.
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
          {busyAction === "load" ? "Loading..." : "Load from Azure"}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={saveToAzure}
          disabled={busyAction !== null}
        >
          {busyAction === "save" ? "Saving..." : "Save to Azure"}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={downloadCsv}
          disabled={busyAction !== null}
        >
          {busyAction === "download" ? "Preparing CSV..." : "Download CSV"}
        </button>
        <a href="/.auth/logout" className="ghost-button">
          Sign out
        </a>
      </div>
      <p className="microcopy">{statusMessage}</p>
    </section>
  );
}
