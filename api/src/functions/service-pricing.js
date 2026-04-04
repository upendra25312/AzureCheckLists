const fs = require("node:fs");
const path = require("node:path");
const { app } = require("@azure/functions");
const { jsonResponse } = require("../shared/auth");

const RETAIL_PRICES_API_URL = "https://prices.azure.com/api/retail/prices";
const PRICING_CALCULATOR_URL = "https://azure.microsoft.com/en-us/pricing/calculator/";
const PRICE_DISCLAIMER =
  "Public retail list pricing from Microsoft. Use the Azure Pricing Calculator after sign-in to layer negotiated rates and monthly usage assumptions.";
const MAX_SERVICES_PER_REQUEST = 20;
const MAX_PAGES_PER_QUERY = 25;
const MAX_ITEMS_PER_QUERY = 4000;

const MANUAL_QUERY_MAP = {
  "api-management": {
    queries: [{ field: "serviceName", operator: "eq", value: "API Management", source: "manual" }]
  },
  "azure-ai-content-safety": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "Content Safety",
        source: "manual"
      }
    ],
    notes: ["Retail pricing is published under Content Safety meters in the Foundry toolset."]
  },
  "azure-ai-foundry": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "Azure AI Foundry",
        source: "manual"
      },
      {
        field: "serviceName",
        operator: "contains",
        value: "Foundry",
        source: "manual"
      }
    ],
    notes: ["Retail pricing is published under Foundry-branded products and services."]
  },
  "azure-ai-search": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "Azure AI Search",
        source: "manual"
      }
    ],
    notes: ["Retail pricing is published under Azure AI Search product rows."]
  },
  "azure-app-service-plan": {
    queries: [
      {
        field: "serviceName",
        operator: "eq",
        value: "Azure App Service",
        source: "manual"
      }
    ],
    notes: ["App Service Plan pricing is published under Azure App Service in the retail price feed."]
  },
  "azure-application-insights": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "Application Insights",
        source: "manual"
      }
    ],
    notes: ["Application Insights pricing is published as Azure Monitor product meters."]
  },
  "azure-container-apps-environment": {
    queries: [
      {
        field: "serviceName",
        operator: "eq",
        value: "Azure Container Apps",
        source: "manual"
      }
    ],
    notes: ["Environment-level pricing is published within Azure Container Apps meters."]
  },
  "azure-front-door": {
    queries: [
      {
        field: "serviceName",
        operator: "eq",
        value: "Azure Front Door Service",
        source: "manual"
      }
    ],
    notes: ["Retail pricing is published under Azure Front Door Service in the retail price feed."]
  },
  "azure-front-door-waf": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "Front Door",
        source: "manual"
      },
      {
        field: "serviceName",
        operator: "eq",
        value: "Azure Front Door Service",
        source: "manual"
      }
    ],
    notes: ["Front Door WAF pricing is published within Front Door retail meters rather than as a standalone service."]
  },
  "azure-machine-learning": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "Azure Machine Learning",
        source: "manual"
      }
    ],
    notes: ["Retail pricing is published under Azure Machine Learning product rows."]
  },
  "azure-nat-gateway": {
    queries: [
      {
        field: "productName",
        operator: "eq",
        value: "NAT Gateway",
        source: "manual"
      }
    ]
  },
  "azure-openai": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "Azure OpenAI",
        source: "manual"
      }
    ],
    notes: ["Retail pricing is published under Azure OpenAI product rows in the Foundry model family."]
  },
  "azure-private-dns": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "DNS",
        source: "manual"
      }
    ],
    notes: ["Private DNS pricing is published within Azure DNS product meters."]
  },
  "azure-public-ip": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "Public IP",
        source: "manual"
      }
    ],
    notes: ["Public IP pricing is published under IP service product names."]
  },
  "azure-traffic-manager": {
    queries: [
      {
        field: "productName",
        operator: "eq",
        value: "Traffic Manager",
        source: "manual"
      }
    ]
  },
  "azure-vpn-gateway": {
    queries: [
      {
        field: "productName",
        operator: "eq",
        value: "VPN Gateway",
        source: "manual"
      }
    ]
  },
  "azure-virtual-wan": {
    queries: [
      {
        field: "productName",
        operator: "eq",
        value: "Virtual WAN",
        source: "manual"
      }
    ]
  },
  "log-analytics": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "Log Analytics",
        source: "manual"
      }
    ],
    notes: ["Log Analytics pricing is published under Azure Monitor product meters."]
  },
  "microsoft-purview": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "Purview",
        source: "manual"
      }
    ]
  },
  "web-application-firewall": {
    queries: [
      {
        field: "productName",
        operator: "contains",
        value: "WAF",
        source: "manual"
      }
    ],
    notes: ["WAF pricing is published within gateway and Front Door product meters rather than as a universal standalone service."]
  }
};

let publicRegionMapCache = null;

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function sanitizeServiceName(value) {
  return String(value ?? "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function loadPublicRegionMap() {
  if (publicRegionMapCache) {
    return publicRegionMapCache;
  }

  const filePath = path.resolve(__dirname, "../../../public/data/regions.json");
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const regionMap = new Map();

  for (const region of payload.regions ?? []) {
    regionMap.set(normalizeKey(region.regionName), region);
  }

  publicRegionMapCache = regionMap;
  return regionMap;
}

function buildODataFilter(query) {
  const escapedValue = String(query.value).replace(/'/g, "''");

  if (query.operator === "contains") {
    return `contains(${query.field}, '${escapedValue}')`;
  }

  return `${query.field} eq '${escapedValue}'`;
}

function buildQueryCandidates(service) {
  const manual = MANUAL_QUERY_MAP[service.slug];

  if (manual) {
    return manual;
  }

  const candidates = [];
  const seen = new Set();
  const namedCandidates = [
    { value: service.service, source: "serviceName" },
    { value: sanitizeServiceName(service.service), source: "serviceName" },
    { value: service.matchedServiceLabel, source: "matchedLabel" },
    { value: service.matchedOfferingName, source: "matchedOffering" },
    ...(service.aliases ?? []).map((alias) => ({
      value: sanitizeServiceName(alias),
      source: "alias"
    }))
  ];

  for (const candidate of namedCandidates) {
    const value = sanitizeServiceName(candidate.value);

    if (!value) {
      continue;
    }

    for (const field of ["serviceName", "productName"]) {
      const key = `${field}.eq.${value}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      candidates.push({
        field,
        operator: "eq",
        value,
        source: candidate.source
      });
    }
  }

  return {
    queries: candidates,
    notes: []
  };
}

async function fetchRetailPricingRows(query) {
  const rows = [];
  let nextPageUrl = `${RETAIL_PRICES_API_URL}?$filter=${encodeURIComponent(buildODataFilter(query))}`;
  let pageCount = 0;

  while (nextPageUrl && pageCount < MAX_PAGES_PER_QUERY && rows.length < MAX_ITEMS_PER_QUERY) {
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

function classifyLocationKind(item, publicRegionMap) {
  const armRegionKey = normalizeKey(item.armRegionName);

  if (armRegionKey && publicRegionMap.has(armRegionKey)) {
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

function normalizePricingRows(items) {
  const publicRegionMap = loadPublicRegionMap();
  const deduplicated = new Map();

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
      locationKind: classifyLocationKind(item, publicRegionMap),
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
    const dedupeKey = [
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

    if (!deduplicated.has(dedupeKey)) {
      deduplicated.set(dedupeKey, row);
    }
  }

  return [...deduplicated.values()].sort((left, right) => {
    const locationCompare = left.location.localeCompare(right.location);

    if (locationCompare !== 0) {
      return locationCompare;
    }

    const skuCompare = left.skuName.localeCompare(right.skuName);

    if (skuCompare !== 0) {
      return skuCompare;
    }

    const meterCompare = left.meterName.localeCompare(right.meterName);

    if (meterCompare !== 0) {
      return meterCompare;
    }

    return left.tierMinimumUnits - right.tierMinimumUnits;
  });
}

function matchesTargetRegion(row, targetRegions) {
  if (!targetRegions || targetRegions.length === 0) {
    return false;
  }

  const armRegionKey = normalizeKey(row.armRegionName);
  const locationKey = normalizeKey(row.location);

  return targetRegions.some((targetRegion) => {
    const targetKey = normalizeKey(targetRegion);

    return targetKey === armRegionKey || targetKey === locationKey;
  });
}

function buildUnmappedPricing(service, notes = []) {
  return {
    serviceSlug: service.slug,
    serviceName: service.service,
    mapped: false,
    notes: uniqueValues([
      ...notes,
      "No Azure Retail Prices API query returned public retail pricing rows for this service yet."
    ]),
    generatedAt: new Date().toISOString(),
    sourceUrl: RETAIL_PRICES_API_URL,
    calculatorUrl: PRICING_CALCULATOR_URL,
    priceDisclaimer: PRICE_DISCLAIMER,
    currencyCode: "USD",
    rowCount: 0,
    meterCount: 0,
    skuCount: 0,
    regionCount: 0,
    billingLocationCount: 0,
    targetRegionMatchCount: 0,
    rows: []
  };
}

function summarizePricing(service, rows, query, notes, targetRegions) {
  const meterCount = new Set(rows.map((row) => row.meterId || `${row.meterName}|${row.skuName}`)).size;
  const skuCount = new Set(rows.map((row) => row.skuName || row.armSkuName).filter(Boolean)).size;
  const regionCount = new Set(
    rows
      .filter((row) => row.locationKind === "Region")
      .map((row) => normalizeKey(row.armRegionName))
      .filter(Boolean)
  ).size;
  const billingLocationCount = new Set(rows.map((row) => row.location).filter(Boolean)).size;
  const targetRegionMatchCount = new Set(
    rows
      .filter((row) => matchesTargetRegion(row, targetRegions))
      .map((row) => normalizeKey(row.armRegionName || row.location))
      .filter(Boolean)
  ).size;
  const retailPrices = rows.map((row) => row.retailPrice).filter((price) => price > 0);

  return {
    serviceSlug: service.slug,
    serviceName: service.service,
    mapped: true,
    notes: uniqueValues(notes),
    generatedAt: new Date().toISOString(),
    sourceUrl: RETAIL_PRICES_API_URL,
    calculatorUrl: PRICING_CALCULATOR_URL,
    priceDisclaimer: PRICE_DISCLAIMER,
    currencyCode: rows[0]?.currencyCode ?? "USD",
    rowCount: rows.length,
    meterCount,
    skuCount,
    regionCount,
    billingLocationCount,
    targetRegionMatchCount,
    startsAtRetailPrice:
      retailPrices.length > 0 ? Math.min(...retailPrices) : undefined,
    query,
    rows
  };
}

async function resolveServicePricing(service) {
  const candidateSet = buildQueryCandidates(service);

  for (const query of candidateSet.queries) {
    const items = await fetchRetailPricingRows(query);
    const rows = normalizePricingRows(items);

    if (rows.length === 0) {
      continue;
    }

    return summarizePricing(
      service,
      rows,
      query,
      candidateSet.notes,
      service.targetRegions ?? []
    );
  }

  return buildUnmappedPricing(service, candidateSet.notes);
}

app.http("service-pricing", {
  route: "service-pricing",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      const body = await request.json();
      const services = Array.isArray(body?.services) ? body.services : [];

      if (services.length === 0) {
        return jsonResponse(400, {
          error: "At least one service is required to load pricing."
        });
      }

      const requestedServices = services.slice(0, MAX_SERVICES_PER_REQUEST);
      const pricing = [];

      for (const service of requestedServices) {
        pricing.push(await resolveServicePricing(service));
      }

      return jsonResponse(
        200,
        {
          generatedAt: new Date().toISOString(),
          sourceUrl: RETAIL_PRICES_API_URL,
          services: pricing
        },
        {
          "Cache-Control": "public, max-age=1800"
        }
      );
    } catch (error) {
      return jsonResponse(500, {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Azure Retail Prices API data."
      });
    }
  }
});
