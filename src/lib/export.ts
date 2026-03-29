import type { ChecklistItem, ReviewDraft } from "@/types";

function sanitizeCsv(value: string | undefined) {
  const normalized = value ?? "";
  const escaped = normalized.replaceAll('"', '""');

  return `"${escaped}"`;
}

export function buildExportRows(
  items: ChecklistItem[],
  reviews: Record<string, ReviewDraft>
) {
  return items.map((item) => {
    const review = reviews[item.guid];

    return {
      guid: item.guid,
      technology: item.technology,
      technologyStatus: item.technologyStatus,
      severity: item.severity ?? "",
      waf: item.waf ?? "",
      category: item.category ?? "",
      subcategory: item.subcategory ?? "",
      service: item.service ?? "",
      text: item.text,
      description: item.description ?? "",
      sourcePath: item.sourcePath ?? "",
      sourceUrl: item.sourceUrl ?? "",
      reviewState: review?.reviewState ?? "Not Reviewed",
      comments: review?.comments ?? "",
      owner: review?.owner ?? "",
      dueDate: review?.dueDate ?? "",
      evidenceLinks: review?.evidenceLinks.join(" | ") ?? "",
      exceptionReason: review?.exceptionReason ?? ""
    };
  });
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, rows: unknown) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], {
    type: "application/json;charset=utf-8"
  });

  downloadBlob(filename, blob);
}

export function downloadCsv(
  filename: string,
  rows: Array<Record<string, string | number>>
) {
  if (rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => sanitizeCsv(String(row[header] ?? ""))).join(","))
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8"
  });

  downloadBlob(filename, blob);
}
