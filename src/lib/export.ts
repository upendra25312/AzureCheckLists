import { matchesPricingTargetRegion } from "@/lib/service-pricing";
import type { ChecklistItem, ReviewDraft, ReviewPackage, ServicePricing } from "@/types";

type PackageExportOptions = {
  includeNotApplicable: boolean;
  includeNeedsReview: boolean;
};

function visibleSourceUrl(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized.includes("github.com/azure/review-checklists")) {
    return "";
  }

  return value ?? "";
}

function sanitizeCsv(value: string | undefined) {
  const normalized = value ?? "";
  const escaped = normalized.replaceAll('"', '""');

  return `"${escaped}"`;
}

function formatReview(item: ChecklistItem, reviews: Record<string, ReviewDraft>) {
  const review = reviews[item.guid] ?? undefined;

  return {
    reviewState: review?.reviewState ?? "Not Reviewed",
    packageDecision: review?.packageDecision ?? "Needs Review",
    comments: review?.comments ?? "",
    owner: review?.owner ?? "",
    dueDate: review?.dueDate ?? "",
    evidenceLinks: review?.evidenceLinks.join(" | ") ?? "",
    exceptionReason: review?.exceptionReason ?? ""
  };
}

function shouldIncludeItem(
  item: ChecklistItem,
  reviews: Record<string, ReviewDraft>,
  options: PackageExportOptions
) {
  const review = reviews[item.guid];
  const decision = review?.packageDecision ?? "Needs Review";

  if (decision === "Exclude") {
    return false;
  }

  if (decision === "Not Applicable") {
    return options.includeNotApplicable;
  }

  if (decision === "Needs Review") {
    return options.includeNeedsReview;
  }

  return true;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

function formatPricingLine(price: number | undefined, currencyCode: string) {
  if (price === undefined || Number.isNaN(price)) {
    return "Not published";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 6
  }).format(price);
}

export function buildExportRows(items: ChecklistItem[], reviews: Record<string, ReviewDraft>) {
  return items.map((item) => {
    const review = formatReview(item, reviews);

    return {
      guid: item.guid,
      technology: item.technology,
      technologyStatus: item.technologyStatus,
      severity: item.severity ?? "",
      waf: item.waf ?? "",
      category: item.category ?? "",
      subcategory: item.subcategory ?? "",
      service: item.service ?? "",
      serviceCanonical: item.serviceCanonical ?? "",
      serviceSlug: item.serviceSlug ?? "",
      text: item.text,
      description: item.description ?? "",
      sourcePath: item.sourcePath ?? "",
      sourceUrl: visibleSourceUrl(item.sourceUrl),
      reviewState: review.reviewState,
      packageDecision: review.packageDecision,
      comments: review.comments,
      owner: review.owner,
      dueDate: review.dueDate,
      evidenceLinks: review.evidenceLinks,
      exceptionReason: review.exceptionReason
    };
  });
}

export function buildPackageExportRows(
  reviewPackage: ReviewPackage,
  items: ChecklistItem[],
  reviews: Record<string, ReviewDraft>,
  options: PackageExportOptions
) {
  return items
    .filter((item) => shouldIncludeItem(item, reviews, options))
    .map((item) => {
      const review = formatReview(item, reviews);

      return {
        packageName: reviewPackage.name,
        audience: reviewPackage.audience,
        businessScope: reviewPackage.businessScope,
        targetRegions: reviewPackage.targetRegions.join(" | "),
        service: item.serviceCanonical ?? item.service ?? "",
        serviceSlug: item.serviceSlug ?? "",
        family: item.technology,
        familySlug: item.technologySlug,
        findingId: item.id ?? item.guid,
        finding: item.text,
        recommendation: item.description ?? "",
        severity: item.severity ?? "",
        waf: item.waf ?? "",
        category: item.category ?? "",
        subcategory: item.subcategory ?? "",
        reviewState: review.reviewState,
        packageDecision: review.packageDecision,
        comments: review.comments,
        owner: review.owner,
        dueDate: review.dueDate,
        evidenceLinks: review.evidenceLinks,
        exceptionReason: review.exceptionReason,
        sourcePath: item.sourcePath ?? "",
        sourceUrl: visibleSourceUrl(item.sourceUrl)
      };
    });
}

function collectPackageMetadata(reviewPackage: ReviewPackage, items: ChecklistItem[]) {
  const serviceNames = [...new Set(items.map((item) => item.serviceCanonical ?? item.service).filter(Boolean))];
  const familyNames = [...new Set(items.map((item) => item.technology).filter(Boolean))];

  return {
    serviceNames,
    familyNames
  };
}

export function buildPackageMarkdown(
  reviewPackage: ReviewPackage,
  items: ChecklistItem[],
  reviews: Record<string, ReviewDraft>,
  options: PackageExportOptions
) {
  const includedItems = items.filter((item) => shouldIncludeItem(item, reviews, options));
  const metadata = collectPackageMetadata(reviewPackage, includedItems);
  const grouped = new Map<string, ChecklistItem[]>();

  includedItems.forEach((item) => {
    const serviceName = item.serviceCanonical ?? item.service ?? "Unmapped service";
    const current = grouped.get(serviceName) ?? [];

    current.push(item);
    grouped.set(serviceName, current);
  });

  const sections = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([serviceName, serviceItems]) => {
      const lines = [`## ${serviceName}`, ""];

      serviceItems.forEach((item) => {
        const review = formatReview(item, reviews);

        lines.push(`### ${item.text}`);
        lines.push(`- Package decision: ${review.packageDecision}`);
        lines.push(`- Review status: ${review.reviewState}`);
        lines.push(`- Checklist family: ${item.technology}`);
        lines.push(`- Severity: ${item.severity ?? "Unspecified"}`);
        if (review.owner) lines.push(`- Owner: ${review.owner}`);
        if (review.dueDate) lines.push(`- Due date: ${review.dueDate}`);
        if (review.comments) lines.push(`- Notes: ${review.comments}`);
        if (review.evidenceLinks) lines.push(`- Evidence: ${review.evidenceLinks}`);
        if (review.exceptionReason) lines.push(`- Exception reason: ${review.exceptionReason}`);
        if (item.sourceUrl) lines.push(`- Source: ${visibleSourceUrl(item.sourceUrl) || item.sourceUrl}`);
        lines.push("");
      });

      return lines.join("\n");
    });

  return [
    `# ${reviewPackage.name}`,
    "",
    `- Audience: ${reviewPackage.audience}`,
    `- Business scope: ${reviewPackage.businessScope || "Not captured"}`,
    `- Target regions: ${reviewPackage.targetRegions.join(", ") || "Not captured"}`,
    `- Services in scope: ${metadata.serviceNames.join(", ") || "None selected"}`,
    `- Checklist families referenced: ${metadata.familyNames.join(", ") || "None selected"}`,
    `- Exported at: ${new Date().toISOString()}`,
    "",
    ...sections
  ].join("\n");
}

export function buildPackageText(
  reviewPackage: ReviewPackage,
  items: ChecklistItem[],
  reviews: Record<string, ReviewDraft>,
  options: PackageExportOptions
) {
  const includedItems = items.filter((item) => shouldIncludeItem(item, reviews, options));
  const metadata = collectPackageMetadata(reviewPackage, includedItems);

  const lines = [
    reviewPackage.name,
    `Audience: ${reviewPackage.audience}`,
    `Business scope: ${reviewPackage.businessScope || "Not captured"}`,
    `Target regions: ${reviewPackage.targetRegions.join(", ") || "Not captured"}`,
    `Services in scope: ${metadata.serviceNames.join(", ") || "None selected"}`,
    `Exported at: ${new Date().toISOString()}`,
    ""
  ];

  includedItems.forEach((item) => {
    const review = formatReview(item, reviews);

    lines.push(`Service: ${item.serviceCanonical ?? item.service ?? "Unmapped service"}`);
    lines.push(`Family: ${item.technology}`);
    lines.push(`Finding: ${item.text}`);
    lines.push(`Package decision: ${review.packageDecision}`);
    lines.push(`Review status: ${review.reviewState}`);
    if (review.comments) lines.push(`Notes: ${review.comments}`);
    if (review.evidenceLinks) lines.push(`Evidence: ${review.evidenceLinks}`);
    if (review.owner) lines.push(`Owner: ${review.owner}`);
    if (review.dueDate) lines.push(`Due date: ${review.dueDate}`);
    if (review.exceptionReason) lines.push(`Exception reason: ${review.exceptionReason}`);
    lines.push("");
  });

  return lines.join("\n");
}

export function buildPackagePricingRows(
  reviewPackage: ReviewPackage,
  servicePricing: ServicePricing[]
): Array<Record<string, string | number>> {
  const rows: Array<Record<string, string | number>> = [];

  servicePricing.forEach((pricing) => {
    if (!pricing.mapped || pricing.rows.length === 0) {
      rows.push({
        packageName: reviewPackage.name,
        audience: reviewPackage.audience,
        businessScope: reviewPackage.businessScope,
        targetRegions: reviewPackage.targetRegions.join(" | "),
        service: pricing.serviceName,
        serviceSlug: pricing.serviceSlug,
        pricingMapped: "No",
        query: pricing.query
          ? `${pricing.query.field} ${pricing.query.operator} ${pricing.query.value}`
          : "",
        notes: pricing.notes.join(" | "),
        billingLocation: "",
        armRegionName: "",
        locationKind: "",
        productName: "",
        skuName: "",
        armSkuName: "",
        meterName: "",
        tierMinimumUnits: "",
        retailPrice: "",
        unitPrice: "",
        currencyCode: pricing.currencyCode,
        unitOfMeasure: "",
        priceType: "",
        effectiveStartDate: "",
        effectiveEndDate: "",
        targetRegionMatch: ""
      });

      return;
    }

    pricing.rows.forEach((row) => {
      rows.push({
        packageName: reviewPackage.name,
        audience: reviewPackage.audience,
        businessScope: reviewPackage.businessScope,
        targetRegions: reviewPackage.targetRegions.join(" | "),
        service: pricing.serviceName,
        serviceSlug: pricing.serviceSlug,
        pricingMapped: "Yes",
        query: pricing.query
          ? `${pricing.query.field} ${pricing.query.operator} ${pricing.query.value}`
          : "",
        notes: pricing.notes.join(" | "),
        billingLocation: row.location,
        armRegionName: row.armRegionName,
        locationKind: row.locationKind,
        productName: row.productName,
        skuName: row.skuName,
        armSkuName: row.armSkuName,
        meterName: row.meterName,
        tierMinimumUnits: row.tierMinimumUnits,
        retailPrice: row.retailPrice,
        unitPrice: row.unitPrice,
        currencyCode: row.currencyCode,
        unitOfMeasure: row.unitOfMeasure,
        priceType: row.type,
        effectiveStartDate: row.effectiveStartDate,
        effectiveEndDate: row.effectiveEndDate ?? "",
        targetRegionMatch: matchesPricingTargetRegion(
          row.armRegionName,
          row.location,
          reviewPackage.targetRegions
        )
          ? "Yes"
          : "No"
      });
    });
  });

  return rows;
}

export function buildPackagePricingMarkdown(
  reviewPackage: ReviewPackage,
  servicePricing: ServicePricing[]
) {
  const sections = servicePricing
    .slice()
    .sort((left, right) => left.serviceName.localeCompare(right.serviceName))
    .map((pricing) => {
      const lines = [`## ${pricing.serviceName}`, ""];

      lines.push(`- Pricing mapped: ${pricing.mapped ? "Yes" : "No"}`);
      lines.push(`- Query used: ${pricing.query ? `${pricing.query.field} ${pricing.query.operator} ${pricing.query.value}` : "No query matched"}`);
      lines.push(`- Billing locations published: ${pricing.billingLocationCount.toLocaleString()}`);
      lines.push(`- Deployment regions with prices: ${pricing.regionCount.toLocaleString()}`);
      lines.push(`- SKUs published: ${pricing.skuCount.toLocaleString()}`);
      lines.push(`- Meters published: ${pricing.meterCount.toLocaleString()}`);
      lines.push(`- Starting retail price: ${formatPricingLine(pricing.startsAtRetailPrice, pricing.currencyCode)}`);
      lines.push(
        `- Target-region matches: ${pricing.targetRegionMatchCount.toLocaleString()}`
      );
      lines.push(`- Pricing source: ${pricing.sourceUrl}`);
      lines.push(`- Calculator: ${pricing.calculatorUrl}`);
      if (pricing.notes.length > 0) {
        lines.push(`- Notes: ${pricing.notes.join(" | ")}`);
      }
      lines.push("");

      if (!pricing.mapped || pricing.rows.length === 0) {
        lines.push("No retail pricing rows were returned for this service.");
        lines.push("");
        return lines.join("\n");
      }

      lines.push("| Location | ARM region | SKU | Meter | Retail price | Unit | Tier minimum |");
      lines.push("| --- | --- | --- | --- | --- | --- | --- |");

      pricing.rows.forEach((row) => {
        lines.push(
          `| ${row.location} | ${row.armRegionName || "-"} | ${row.skuName || "-"} | ${row.meterName} | ${formatPricingLine(row.retailPrice, row.currencyCode)} | ${row.unitOfMeasure} | ${row.tierMinimumUnits.toLocaleString()} |`
        );
      });

      lines.push("");

      return lines.join("\n");
    });

  return [
    `# ${reviewPackage.name} commercial snapshot`,
    "",
    `- Audience: ${reviewPackage.audience}`,
    `- Business scope: ${reviewPackage.businessScope || "Not captured"}`,
    `- Target regions: ${reviewPackage.targetRegions.join(", ") || "Not captured"}`,
    `- Services in scope: ${servicePricing.map((pricing) => pricing.serviceName).join(", ") || "None selected"}`,
    `- Exported at: ${new Date().toISOString()}`,
    "",
    ...sections
  ].join("\n");
}

export function buildPackagePricingText(reviewPackage: ReviewPackage, servicePricing: ServicePricing[]) {
  const lines = [
    `${reviewPackage.name} commercial snapshot`,
    `Audience: ${reviewPackage.audience}`,
    `Business scope: ${reviewPackage.businessScope || "Not captured"}`,
    `Target regions: ${reviewPackage.targetRegions.join(", ") || "Not captured"}`,
    `Exported at: ${new Date().toISOString()}`,
    ""
  ];

  servicePricing
    .slice()
    .sort((left, right) => left.serviceName.localeCompare(right.serviceName))
    .forEach((pricing) => {
      lines.push(`Service: ${pricing.serviceName}`);
      lines.push(`Pricing mapped: ${pricing.mapped ? "Yes" : "No"}`);
      lines.push(
        `Query used: ${pricing.query ? `${pricing.query.field} ${pricing.query.operator} ${pricing.query.value}` : "No query matched"}`
      );
      lines.push(
        `Starting retail price: ${formatPricingLine(pricing.startsAtRetailPrice, pricing.currencyCode)}`
      );
      lines.push(`Billing locations published: ${pricing.billingLocationCount.toLocaleString()}`);
      lines.push(`Deployment regions with prices: ${pricing.regionCount.toLocaleString()}`);
      lines.push(`SKUs published: ${pricing.skuCount.toLocaleString()}`);
      lines.push(`Meters published: ${pricing.meterCount.toLocaleString()}`);
      lines.push(`Target-region matches: ${pricing.targetRegionMatchCount.toLocaleString()}`);
      lines.push(`Pricing source: ${pricing.sourceUrl}`);
      if (pricing.notes.length > 0) {
        lines.push(`Notes: ${pricing.notes.join(" | ")}`);
      }

      if (pricing.rows.length === 0) {
        lines.push("No retail pricing rows were returned for this service.");
        lines.push("");
        return;
      }

      pricing.rows.forEach((row) => {
        lines.push(
          `${row.location} | ${row.armRegionName || "No ARM region"} | ${row.skuName || "No SKU"} | ${row.meterName} | ${formatPricingLine(row.retailPrice, row.currencyCode)} per ${row.unitOfMeasure} | tier ${row.tierMinimumUnits.toLocaleString()}`
        );
      });

      lines.push("");
    });

  return lines.join("\n");
}

export function downloadJson(filename: string, rows: unknown) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], {
    type: "application/json;charset=utf-8"
  });

  downloadBlob(filename, blob);
}

export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
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

export function downloadText(filename: string, contents: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([contents], {
    type: mimeType
  });

  downloadBlob(filename, blob);
}
