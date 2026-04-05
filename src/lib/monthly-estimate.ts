import { matchesPricingTargetRegion } from "@/lib/service-pricing";
import type {
  ReviewServiceAssumption,
  ServiceMonthlyEstimate,
  ServiceMonthlyEstimateComponent,
  ServiceMonthlySkuEstimate,
  ServicePricing,
  ServicePricingRow
} from "@/types";

const HOURS_PER_MONTH = 730;
const DEFAULT_EDGE_TRANSFER_GB = 5;
const ZERO_REQUESTS_10K = 0;

function normalizeText(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function buildSkuLabel(row: ServicePricingRow) {
  return row.skuName || row.armSkuName || "Default SKU";
}

function isUsageMeter(row: ServicePricingRow) {
  const meterName = normalizeText(row.meterName);
  const unit = normalizeText(row.unitOfMeasure);

  return (
    meterName.includes("data transfer") ||
    meterName.includes("request") ||
    meterName.includes("ruleset") ||
    meterName.includes("routing rules") ||
    meterName.includes("bot protection") ||
    meterName.includes("transaction") ||
    meterName.includes("ingestion") ||
    meterName.includes("query") ||
    meterName.includes("queries") ||
    meterName.includes("message") ||
    meterName.includes("event") ||
    meterName.includes("bandwidth") ||
    meterName.includes("throughput") ||
    meterName.includes("read") ||
    meterName.includes("write") ||
    meterName.includes("storage") ||
    unit.includes("gb") ||
    unit.includes("10k") ||
    unit.includes("1m/")
  );
}

function toMonthlyCost(row: ServicePricingRow, quantity: number) {
  const unit = normalizeText(row.unitOfMeasure);

  if (unit.includes("hour")) {
    return row.retailPrice * quantity * HOURS_PER_MONTH;
  }

  return row.retailPrice * quantity;
}

function buildComponent(
  label: string,
  row: ServicePricingRow,
  quantity: number
): ServiceMonthlyEstimateComponent {
  return {
    label,
    meterName: row.meterName,
    skuName: buildSkuLabel(row),
    location: row.location || row.armRegionName || "Global",
    unitOfMeasure: row.unitOfMeasure,
    quantity,
    monthlyCost: toMonthlyCost(row, quantity)
  };
}

function resolveScopedRows(pricing: ServicePricing, targetRegions: string[]) {
  if (targetRegions.length === 0) {
    return {
      rows: pricing.rows,
      targetScopeApplied: false
    };
  }

  const targetRows = pricing.rows.filter((row) =>
    matchesPricingTargetRegion(
      row.armRegionName,
      row.location,
      targetRegions,
      pricing.targetPricingLocations,
      row.locationKind
    )
  );

  if (targetRows.length > 0) {
    return {
      rows: targetRows,
      targetScopeApplied: true
    };
  }

  return {
    rows: pricing.rows,
    targetScopeApplied: false
  };
}

function findRecurringBaseRow(rows: ServicePricingRow[]) {
  const recurringCandidates = rows
    .filter((row) => row.retailPrice > 0)
    .filter((row) => {
      const unit = normalizeText(row.unitOfMeasure);
      return unit.includes("month") || unit.includes("hour");
    })
    .filter((row) => !isUsageMeter(row))
    .sort((left, right) => {
      const leftCost = toMonthlyCost(left, 1);
      const rightCost = toMonthlyCost(right, 1);

      if (leftCost !== rightCost) {
        return leftCost - rightCost;
      }

      return left.meterName.localeCompare(right.meterName);
    });

  return recurringCandidates[0];
}

function buildRecurringBaseOnlyEstimate(
  rows: ServicePricingRow[],
  preferredSku: string
): ServiceMonthlySkuEstimate[] {
  const grouped = new Map<string, ServicePricingRow[]>();

  rows.forEach((row) => {
    const key = buildSkuLabel(row);
    const current = grouped.get(key) ?? [];

    current.push(row);
    grouped.set(key, current);
  });

  return [...grouped.entries()]
    .map(([skuName, skuRows]) => {
      const baseRow = findRecurringBaseRow(skuRows);

      if (!baseRow) {
        return null;
      }

      const component = buildComponent(
        normalizeText(baseRow.unitOfMeasure).includes("hour")
          ? "Base recurring hourly row x 730 hours"
          : "Base recurring monthly row",
        baseRow,
        1
      );

      return {
        skuName,
        monthlyCost: component.monthlyCost,
        assumptions: [
          normalizeText(baseRow.unitOfMeasure).includes("hour")
            ? "1 recurring unit for 730 hours/month"
            : "1 recurring unit/month",
          "Variable usage meters stay at 0 until you add sizing assumptions."
        ],
        notes: [
          "This is a recurring-base estimate from the retail feed, not a full Azure Pricing Calculator total."
        ],
        components: [component],
        isPreferred:
          preferredSku.length > 0 &&
          normalizeText(skuName).includes(normalizeText(preferredSku))
      } satisfies ServiceMonthlySkuEstimate;
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left!.monthlyCost !== right!.monthlyCost) {
        return left!.monthlyCost - right!.monthlyCost;
      }

      return left!.skuName.localeCompare(right!.skuName);
    }) as ServiceMonthlySkuEstimate[];
}

function findHighestPricedRow(rows: ServicePricingRow[], pattern: RegExp) {
  return rows
    .filter((row) => pattern.test(row.meterName))
    .filter((row) => row.retailPrice > 0)
    .sort((left, right) => right.retailPrice - left.retailPrice)[0];
}

function buildFrontDoorEstimate(
  rows: ServicePricingRow[],
  preferredSku: string
): ServiceMonthlySkuEstimate[] {
  const grouped = new Map<string, ServicePricingRow[]>();

  rows.forEach((row) => {
    const key = buildSkuLabel(row);
    const current = grouped.get(key) ?? [];

    current.push(row);
    grouped.set(key, current);
  });

  return [...grouped.entries()]
    .map(([skuName, skuRows]) => {
      const baseRow = findHighestPricedRow(skuRows, /base fees/i);

      if (!baseRow) {
        return null;
      }

      const dataTransferInRow = findHighestPricedRow(skuRows, /data transfer in/i);
      const dataTransferOutRow = findHighestPricedRow(skuRows, /data transfer out/i);
      const components: ServiceMonthlyEstimateComponent[] = [
        buildComponent("Base profile", baseRow, 1)
      ];

      if (dataTransferOutRow) {
        components.push(
          buildComponent(
            `Outbound data transfer (${DEFAULT_EDGE_TRANSFER_GB.toLocaleString()} GB default)`,
            dataTransferOutRow,
            DEFAULT_EDGE_TRANSFER_GB
          )
        );
      }

      if (dataTransferInRow) {
        components.push(
          buildComponent(
            `Origin data transfer (${DEFAULT_EDGE_TRANSFER_GB.toLocaleString()} GB default)`,
            dataTransferInRow,
            DEFAULT_EDGE_TRANSFER_GB
          )
        );
      }

      const monthlyCost = components.reduce(
        (accumulator, component) => accumulator + component.monthlyCost,
        0
      );

      return {
        skuName,
        monthlyCost,
        assumptions: [
          "1 base profile/month",
          `${DEFAULT_EDGE_TRANSFER_GB.toLocaleString()} GB outbound to client`,
          `${DEFAULT_EDGE_TRANSFER_GB.toLocaleString()} GB outbound to origin`,
          `${ZERO_REQUESTS_10K.toLocaleString()} request units`
        ],
        notes: [
          "This estimate follows the Azure Pricing Calculator style for Front Door more closely than the raw lowest-meter view.",
          "Request pricing remains at 0 until request volume assumptions are added."
        ],
        components,
        isPreferred:
          preferredSku.length > 0 &&
          normalizeText(skuName).includes(normalizeText(preferredSku))
      } satisfies ServiceMonthlySkuEstimate;
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left!.monthlyCost !== right!.monthlyCost) {
        return left!.monthlyCost - right!.monthlyCost;
      }

      return left!.skuName.localeCompare(right!.skuName);
    }) as ServiceMonthlySkuEstimate[];
}

function buildSkuEstimates(
  pricing: ServicePricing,
  rows: ServicePricingRow[],
  assumption: ReviewServiceAssumption
) {
  switch (pricing.serviceSlug) {
    case "azure-front-door":
      return {
        mode: "calculator-defaults" as const,
        skuEstimates: buildFrontDoorEstimate(rows, assumption.preferredSku.trim()),
        notes: [
          "Front Door uses calculator-style defaults instead of the raw lowest retail meter."
        ]
      };
    default:
      return {
        mode: "recurring-base-only" as const,
        skuEstimates: buildRecurringBaseOnlyEstimate(rows, assumption.preferredSku.trim()),
        notes: [
          "This service currently uses a recurring-base estimate until richer calculator-style defaults are modeled."
        ]
      };
  }
}

function selectPreferredEstimate(
  skuEstimates: ServiceMonthlySkuEstimate[],
  preferredSku: string
) {
  if (skuEstimates.length === 0) {
    return null;
  }

  const normalizedPreferredSku = normalizeText(preferredSku);

  if (!normalizedPreferredSku) {
    return skuEstimates[0];
  }

  return (
    skuEstimates.find((estimate) =>
      normalizeText(estimate.skuName).includes(normalizedPreferredSku)
    ) ?? skuEstimates[0]
  );
}

export function buildServiceMonthlyEstimate(
  pricing: ServicePricing | undefined,
  assumption: ReviewServiceAssumption,
  targetRegions: string[]
): ServiceMonthlyEstimate | null {
  if (!pricing) {
    return null;
  }

  if (!pricing.mapped || pricing.rows.length === 0) {
    return {
      serviceSlug: pricing.serviceSlug,
      serviceName: pricing.serviceName,
      supported: false,
      mode: "not-modeled",
      currencyCode: pricing.currencyCode,
      notes: pricing.notes.length > 0 ? pricing.notes : ["No published retail pricing rows are available for this service."],
      assumptions: [],
      targetScopeApplied: false,
      skuEstimates: []
    };
  }

  const scoped = resolveScopedRows(pricing, targetRegions);
  const { mode, skuEstimates, notes } = buildSkuEstimates(pricing, scoped.rows, assumption);
  const selectedEstimate = selectPreferredEstimate(skuEstimates, assumption.preferredSku);

  if (!selectedEstimate) {
    return {
      serviceSlug: pricing.serviceSlug,
      serviceName: pricing.serviceName,
      supported: false,
      mode: "not-modeled",
      currencyCode: pricing.currencyCode,
      notes: [
        "A monthly estimate could not be modeled yet from the published retail rows for this service."
      ],
      assumptions: [],
      targetScopeApplied: scoped.targetScopeApplied,
      skuEstimates: []
    };
  }

  return {
    serviceSlug: pricing.serviceSlug,
    serviceName: pricing.serviceName,
    supported: true,
    mode,
    currencyCode: pricing.currencyCode,
    notes: [
      ...notes,
      scoped.targetScopeApplied
        ? "Target-region or target-billing-zone pricing was applied to the estimate."
        : "No direct target-region pricing row was available, so the estimate falls back to the broader published retail scope.",
      assumption.sizingNote.trim()
        ? "A sizing note exists, but the default monthly estimate still uses the baseline assumptions shown below."
        : "Sizing note is blank, so the estimate uses default monthly assumptions only."
    ],
    assumptions: selectedEstimate.assumptions,
    targetScopeApplied: scoped.targetScopeApplied,
    skuEstimates,
    selectedSkuName: selectedEstimate.skuName,
    selectedMonthlyCost: selectedEstimate.monthlyCost
  };
}
