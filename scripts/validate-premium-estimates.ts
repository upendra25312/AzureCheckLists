import { readFile } from "node:fs/promises";

const RETAIL_PRICES_API_URL = "https://prices.azure.com/api/retail/prices";
const CALCULATOR_URL = "https://azure.microsoft.com/en-us/pricing/calculator/";
const PRICE_DISCLAIMER =
  "Public retail list pricing from Microsoft. Use the Azure Pricing Calculator after sign-in to layer negotiated rates and monthly usage assumptions.";

type QueryCandidate = {
  field: string;
  operator: "eq" | "contains";
  value: string;
  source?: string;
};

type ServiceIndexEntry = {
  slug: string;
  service: string;
  aliases?: string[];
};

function normalizeKey(value: string | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function buildODataFilter(query: QueryCandidate) {
  const escapedValue = String(query.value).replace(/'/g, "''");

  return query.operator === "contains"
    ? `contains(${query.field}, '${escapedValue}')`
    : `${query.field} eq '${escapedValue}'`;
}

function classifyLocationKind(item: {
  armRegionName?: string;
  location?: string;
}) {
  if (item.armRegionName) {
    return "Region";
  }

  if (/zone/i.test(item.location ?? "")) {
    return "BillingZone";
  }

  if (!item.armRegionName || /global|worldwide|no region/i.test(item.location ?? "")) {
    return "Global";
  }

  return "Unknown";
}

async function fetchRetailPricingRows(query: QueryCandidate) {
  const rows: any[] = [];
  let nextPageUrl = `${RETAIL_PRICES_API_URL}?$filter=${encodeURIComponent(buildODataFilter(query))}`;
  let pageCount = 0;

  while (nextPageUrl && pageCount < 10 && rows.length < 2000) {
    const response = await fetch(nextPageUrl, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Retail price query failed with status ${response.status}.`);
    }

    const payload = await response.json();

    rows.push(...(payload.Items ?? []));
    nextPageUrl = payload.NextPageLink ?? null;
    pageCount += 1;
  }

  return rows;
}

function normalizePricingRows(items: any[]) {
  const deduplicated = new Map<string, any>();

  for (const item of items) {
    if (item?.type && item.type !== "Consumption") {
      continue;
    }

    if (item?.isPrimaryMeterRegion === false) {
      continue;
    }

    const row = {
      meterId: item.meterId ?? "",
      meterName: item.meterName ?? "",
      productName: item.productName ?? "",
      skuName: item.skuName ?? "",
      armSkuName: item.armSkuName ?? "",
      armRegionName: item.armRegionName ?? "",
      location: item.location ?? "",
      locationKind: classifyLocationKind(item),
      effectiveStartDate: item.effectiveStartDate ?? "",
      effectiveEndDate: item.effectiveEndDate ?? undefined,
      unitOfMeasure: item.unitOfMeasure ?? "",
      retailPrice: Number(item.retailPrice ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      tierMinimumUnits: Number(item.tierMinimumUnits ?? 0),
      currencyCode: item.currencyCode ?? "USD",
      type: item.type ?? "",
      isPrimaryMeterRegion: item.isPrimaryMeterRegion !== false
    };

    const key = [
      row.meterId,
      row.meterName,
      row.productName,
      row.skuName,
      row.armRegionName,
      row.location,
      row.tierMinimumUnits,
      row.retailPrice,
      row.unitOfMeasure,
      row.currencyCode
    ].join("|");

    if (!deduplicated.has(key)) {
      deduplicated.set(key, row);
    }
  }

  return [...deduplicated.values()];
}

async function main() {
  const serviceIndex = JSON.parse(
    await readFile("./public/data/service-index.json", "utf8")
  ) as { services: ServiceIndexEntry[] };
  // The pricing backend is plain JavaScript under the Functions app.
  // This script only runs at validation time, so a typed shim here is sufficient.
  // @ts-expect-error Runtime import of the Functions-side JavaScript module.
  const pricingBackendModule = await import("../api/src/shared/service-pricing.js");
  const pricingBackend = (pricingBackendModule.default ?? pricingBackendModule) as {
    buildQueryCandidates: (service: ServiceIndexEntry) => {
      queries: QueryCandidate[];
      notes?: string[];
    };
  };
  const estimateModule = await import("../src/lib/monthly-estimate");
  const estimateApi =
    ((estimateModule as any).buildServiceMonthlyEstimate
      ? estimateModule
      : ((estimateModule as any).default ?? (estimateModule as any)["module.exports"])) as {
    buildServiceMonthlyEstimate: (pricing: any, assumption: any, targetRegions: string[]) => any;
  };

  const slugs = [
    "azure-openai",
    "azure-kubernetes-service-aks",
    "azure-sql-database",
    "azure-cosmos-db",
    "azure-databricks",
    "azure-ai-search"
  ];

  const assumptions: Record<string, any> = {
    "azure-openai": {
      plannedRegion: "eastus",
      preferredSku: "",
      sizingNote: "",
      estimateInputs: {
        deploymentUnits: 2,
        inputTokensMillionsPerMonth: 20,
        cachedInputTokensMillionsPerMonth: 5,
        outputTokensMillionsPerMonth: 8
      }
    },
    "azure-kubernetes-service-aks": {
      plannedRegion: "eastus",
      preferredSku: "",
      sizingNote: "",
      estimateInputs: {
        clusterCount: 1,
        workerNodeCount: 3,
        workerNodeFamily: "general-purpose"
      }
    },
    "azure-sql-database": {
      plannedRegion: "eastus",
      preferredSku: "",
      sizingNote: "",
      estimateInputs: {
        databaseCount: 2,
        computeModel: "general-purpose",
        vCoresPerDatabase: 4,
        storageGbPerDatabase: 250
      }
    },
    "azure-cosmos-db": {
      plannedRegion: "eastus",
      preferredSku: "",
      sizingNote: "",
      estimateInputs: {
        billingModel: "autoscale-ru",
        provisionedRu100Units: 50,
        regionReplicaCount: 2
      }
    },
    "azure-databricks": {
      plannedRegion: "eastus",
      preferredSku: "",
      sizingNote: "",
      estimateInputs: {
        workspaceCount: 1,
        dbuPerHour: 4,
        runtimeHoursPerMonth: 260,
        storageTbPerMonth: 1
      }
    },
    "azure-ai-search": {
      plannedRegion: "eastus",
      preferredSku: "",
      sizingNote: "",
      estimateInputs: {
        searchUnits: 2,
        semanticRequests1000PerMonth: 250,
        imageExtractionTransactions1000PerMonth: 50
      }
    }
  };

  for (const slug of slugs) {
    const service = serviceIndex.services.find((entry) => entry.slug === slug);

    if (!service) {
      console.log(JSON.stringify({ slug, error: "service-not-found" }, null, 2));
      continue;
    }

    const candidateSet = pricingBackend.buildQueryCandidates(service);
    let matchedQuery: QueryCandidate | null = null;
    let rows: any[] = [];

    for (const query of candidateSet.queries) {
      const items = await fetchRetailPricingRows(query);
      const normalizedRows = normalizePricingRows(items);

      if (normalizedRows.length > 0) {
        matchedQuery = query;
        rows = normalizedRows;
        break;
      }
    }

    const pricing = {
      serviceSlug: service.slug,
      serviceName: service.service,
      mapped: rows.length > 0,
      notes:
        rows.length > 0
          ? (candidateSet.notes ?? [])
          : [
              ...(candidateSet.notes ?? []),
              "No Azure Retail Prices API query returned public retail pricing rows for this service yet."
            ],
      generatedAt: new Date().toISOString(),
      sourceUrl: RETAIL_PRICES_API_URL,
      calculatorUrl: CALCULATOR_URL,
      priceDisclaimer: PRICE_DISCLAIMER,
      currencyCode: rows[0]?.currencyCode ?? "USD",
      rowCount: rows.length,
      meterCount: new Set(rows.map((row) => row.meterId || `${row.meterName}|${row.skuName}`)).size,
      skuCount: new Set(rows.map((row) => row.skuName || row.armSkuName).filter(Boolean)).size,
      regionCount: new Set(rows.map((row) => normalizeKey(row.armRegionName)).filter(Boolean)).size,
      billingLocationCount: new Set(rows.map((row) => row.location).filter(Boolean)).size,
      targetRegionMatchCount: 0,
      targetPricingLocations: [],
      startsAtRetailPrice:
        rows.length > 0 ? Math.min(...rows.map((row) => row.retailPrice).filter((price) => price > 0)) : undefined,
      query: matchedQuery ?? undefined,
      rows
    };

    const estimate = estimateApi.buildServiceMonthlyEstimate(pricing, assumptions[slug], ["eastus"]);
    const selectedEstimate = estimate?.skuEstimates?.find(
      (entry: { skuName: string }) => entry.skuName === estimate?.selectedSkuName
    );

    console.log(
      JSON.stringify(
        {
          slug,
          query: matchedQuery,
          mapped: pricing.mapped,
          rows: pricing.rows.length,
          supported: estimate?.supported ?? false,
          coverage: estimate?.coverage ?? null,
          selectedSkuName: estimate?.selectedSkuName ?? null,
          selectedHourlyCost: estimate?.selectedHourlyCost ?? null,
          selectedMonthlyCost: estimate?.selectedMonthlyCost ?? null,
          componentCount: selectedEstimate?.components?.length ?? estimate?.skuEstimates?.[0]?.components?.length ?? 0
        },
        null,
        2
      )
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});