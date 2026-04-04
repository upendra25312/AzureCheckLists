const { app } = require("@azure/functions");
const { jsonResponse } = require("../shared/auth");

const AVAILABILITY_SOURCE_URL =
  "https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table";
const REGIONS_SOURCE_URL = "https://learn.microsoft.com/en-us/azure/reliability/regions-list";
const EXCLUDED_AVAILABILITY_GEOGRAPHIES = new Set(["Azure Government"]);
const MAX_SERVICES_PER_REQUEST = 20;

const availabilityManualMap = new Map(
  Object.entries({
    "active directory domain services": {
      offeringName: "Microsoft Entra Domain Services"
    },
    "ad b2c": {
      offeringName: "Azure Active Directory B2C",
      notes: ["Microsoft's availability feed lists this identity service as a global, non-regional offering."]
    },
    "ai content safety": {
      offeringName: "Microsoft Foundry",
      productSkuHints: ["Content Safety"],
      notes: ["Availability is derived from the Content Safety product line under Microsoft Foundry."]
    },
    "ai foundry": {
      offeringName: "Microsoft Foundry",
      notes: ["Availability is mapped to the umbrella Microsoft Foundry offering because the source feed groups several Foundry capabilities together."]
    },
    "app service plan": {
      offeringName: "App Service",
      notes: ["Availability is mapped through the broader App Service offering because App Service Plan isn't listed as a standalone offering in the Microsoft feed."]
    },
    "application insights": {
      offeringName: "Azure Monitor",
      productSkuHints: ["Application Insights"],
      notes: ["Availability is derived from the Application Insights SKU under Azure Monitor."]
    },
    "blob storage": {
      offeringName: "Storage",
      productSkuHints: ["Blob Storage", "Premium Block Blobs"],
      notes: ["Availability is derived from Blob-related Storage SKUs in the Microsoft availability feed."]
    },
    "cache for redis": {
      offeringName: "Redis Cache"
    },
    cdn: {
      offeringName: "Content Delivery Network",
      notes: ["Microsoft lists CDN as a global, non-regional service in the availability feed."]
    },
    "container apps environment": {
      offeringName: "Azure Container Apps",
      notes: ["Availability is mapped through Azure Container Apps because the managed environment resource isn't listed separately in the Microsoft feed."]
    },
    "front door waf": {
      offeringName: "Azure Web Application Firewall",
      productSkuHints: ["WAF on Azure Front Door"],
      notes: ["Availability is derived from the Front Door-specific WAF SKU under Azure Web Application Firewall."]
    },
    "image builder": {
      offeringName: "Azure VM Image Builder"
    },
    "machine learning": {
      offeringName: "Microsoft Foundry",
      productSkuHints: ["Azure Machine Learning"],
      notes: ["Availability is derived from the Azure Machine Learning SKU family under Microsoft Foundry."]
    },
    "monitor alerts": {
      offeringName: "Azure Monitor",
      notes: ["Availability is mapped through the broader Azure Monitor offering because alerts aren't listed as a standalone offering in the Microsoft feed."]
    },
    "nat gateway": {
      offeringName: "Virtual Network NAT"
    },
    "private dns": {
      offeringName: "Azure DNS",
      productSkuHints: ["Private Zones"],
      notes: ["Availability is derived from the Azure DNS Private Zones SKU in the Microsoft feed."]
    },
    "public ip": {
      offeringName: "IP Services",
      productSkuHints: ["Azure Public IP"],
      notes: ["Availability is derived from public IP SKUs within the IP Services offering."]
    },
    "traffic collector": {
      offeringName: "",
      notes: ["The Microsoft availability feed does not currently expose a distinct offering for Azure Traffic Collector."]
    },
    "log analytics": {
      offeringName: "Azure Monitor",
      productSkuHints: ["Log Analytics"],
      notes: ["Availability is derived from the Log Analytics SKU under Azure Monitor."]
    },
    purview: {
      offeringName: "Security Platform (Purview)"
    }
  })
);

let availabilityCache = null;

function cleanDisplayText(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : undefined;
}

function normalizeAvailabilityKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/^azure\s+/i, "")
    .replace(/^microsoft\s+/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRegionLabel(regionName) {
  const raw = cleanDisplayText(regionName) ?? "";

  if (raw.endsWith("**")) {
    return {
      regionName: raw.slice(0, -2).trim(),
      accessState: "EarlyAccess"
    };
  }

  if (raw.endsWith("*")) {
    return {
      regionName: raw.slice(0, -1).trim(),
      accessState: "ReservedAccess"
    };
  }

  return {
    regionName: raw.trim(),
    accessState: "Open"
  };
}

function accessStateRank(accessState) {
  if (accessState === "EarlyAccess") {
    return 2;
  }

  if (accessState === "ReservedAccess") {
    return 1;
  }

  return 0;
}

function availabilityStateRank(state) {
  if (state === "Retiring") {
    return 3;
  }

  if (state === "Preview") {
    return 2;
  }

  if (state === "GA") {
    return 1;
  }

  return 0;
}

function normalizeAvailabilityState(raw) {
  const normalized = String(raw ?? "").trim().toLowerCase();

  if (normalized === "ga") {
    return "GA";
  }

  if (normalized === "preview") {
    return "Preview";
  }

  if (normalized === "closing down" || normalized === "retiring") {
    return "Retiring";
  }

  return undefined;
}

function isCommercialPublicAvailabilityRow(row) {
  const geographyName = cleanDisplayText(row.GeographyName) ?? "";
  const { regionName } = parseRegionLabel(row.RegionName);

  if (!geographyName || regionName === "Non Regional") {
    return false;
  }

  if (EXCLUDED_AVAILABILITY_GEOGRAPHIES.has(geographyName)) {
    return false;
  }

  return !geographyName.includes("21Vianet");
}

async function readAvailabilityRows() {
  const response = await fetch(AVAILABILITY_SOURCE_URL, {
    headers: {
      Accept: "text/html"
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch Azure Product Availability by Region: ${response.status}`);
  }

  const html = await response.text();
  const scriptAnchor = html.indexOf("const data =");

  if (scriptAnchor === -1) {
    throw new Error("Azure Product Availability by Region feed did not contain the embedded data payload.");
  }

  const dataStart = html.indexOf("[", scriptAnchor);
  const dataEnd = html.indexOf("];", dataStart);

  if (dataStart === -1 || dataEnd === -1) {
    throw new Error("Azure Product Availability by Region feed did not contain a parseable data array.");
  }

  return JSON.parse(html.slice(dataStart, dataEnd + 1));
}

function buildPublicRegionCatalog(rows) {
  const regionMap = new Map();

  for (const row of rows) {
    if (!isCommercialPublicAvailabilityRow(row)) {
      continue;
    }

    const geographyName = cleanDisplayText(row.GeographyName) ?? "Unknown";
    const { regionName, accessState } = parseRegionLabel(row.RegionName);
    const existing = regionMap.get(regionName);

    if (!existing) {
      regionMap.set(regionName, {
        regionName,
        geographyName,
        accessState
      });
      continue;
    }

    if (accessStateRank(accessState) > accessStateRank(existing.accessState)) {
      existing.accessState = accessState;
    }
  }

  return [...regionMap.values()].sort((left, right) => left.regionName.localeCompare(right.regionName));
}

function buildAvailabilityOfferingLookup(rows) {
  const offerings = [...new Set(rows.map((row) => cleanDisplayText(row.OfferingName)).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right)
  );
  const offeringByKey = new Map();

  for (const offeringName of offerings) {
    const key = normalizeAvailabilityKey(offeringName);

    if (!offeringByKey.has(key)) {
      offeringByKey.set(key, offeringName);
    }
  }

  return offeringByKey;
}

function resolveAvailabilityMapping(service, offeringByKey) {
  const manual = availabilityManualMap.get(normalizeAvailabilityKey(service.service));

  if (manual) {
    if (!manual.offeringName) {
      return {
        mapped: false,
        notes: manual.notes ?? [
          "The Microsoft availability feed does not currently expose a directly mappable offering for this service."
        ]
      };
    }

    return {
      mapped: true,
      offeringName: manual.offeringName,
      matchType: "manual",
      matchedServiceLabel: service.service,
      matchedSkuHints: manual.productSkuHints ?? [],
      notes: manual.notes ?? []
    };
  }

  const explicitOfferingName = cleanDisplayText(service.matchedOfferingName);

  if (explicitOfferingName) {
    return {
      mapped: true,
      offeringName: explicitOfferingName,
      matchType: "manual",
      matchedServiceLabel: service.matchedServiceLabel ?? service.service,
      matchedSkuHints: service.matchedSkuHints ?? [],
      notes: []
    };
  }

  const candidates = [service.service, ...(service.aliases ?? [])].filter(Boolean);

  for (const candidate of candidates) {
    const offeringName = offeringByKey.get(normalizeAvailabilityKey(candidate));

    if (!offeringName) {
      continue;
    }

    return {
      mapped: true,
      offeringName,
      matchType: candidate === service.service ? "exact" : "alias",
      matchedServiceLabel: candidate,
      matchedSkuHints: service.matchedSkuHints ?? [],
      notes: []
    };
  }

  return {
    mapped: false,
    notes: [
      "An official Azure Product Availability by Region offering could not be matched automatically for this service."
    ]
  };
}

function getLiveAvailabilityDataset() {
  if (availabilityCache && Date.now() - availabilityCache.fetchedAt < 30 * 60 * 1000) {
    return availabilityCache.payload;
  }

  return readAvailabilityRows().then((availabilityRows) => {
    const payload = {
      availabilityRows,
      publicRegions: buildPublicRegionCatalog(availabilityRows),
      offeringByKey: buildAvailabilityOfferingLookup(availabilityRows),
      generatedAt: new Date().toISOString()
    };

    availabilityCache = {
      fetchedAt: Date.now(),
      payload
    };

    return payload;
  });
}

function buildServiceRegionalFit(service, dataset) {
  const mapping = resolveAvailabilityMapping(service, dataset.offeringByKey);
  const baseSummary = {
    serviceSlug: service.slug,
    serviceName: service.service,
    mapped: false,
    notes: mapping.notes,
    publicRegionCount: dataset.publicRegions.length,
    availableRegionCount: 0,
    unavailableRegionCount: 0,
    restrictedRegionCount: 0,
    earlyAccessRegionCount: 0,
    previewRegionCount: 0,
    retiringRegionCount: 0,
    isGlobalService: false,
    generatedAt: dataset.generatedAt,
    availabilitySourceUrl: AVAILABILITY_SOURCE_URL,
    regionsSourceUrl: REGIONS_SOURCE_URL
  };

  if (!mapping.mapped) {
    return {
      ...baseSummary,
      regions: [],
      unavailableRegions: [],
      globalSkuStates: []
    };
  }

  const matchedRows = dataset.availabilityRows.filter((row) => {
    if (cleanDisplayText(row.OfferingName) !== mapping.offeringName) {
      return false;
    }

    if ((mapping.matchedSkuHints ?? []).length === 0) {
      return true;
    }

    const skuName = cleanDisplayText(row.ProductSkuName) ?? "";

    return mapping.matchedSkuHints.some((hint) => skuName.toLowerCase().includes(hint.toLowerCase()));
  });
  const regionMap = new Map();
  const globalSkuMap = new Map();

  for (const row of matchedRows) {
    const state = normalizeAvailabilityState(row.CurrentState);

    if (!state) {
      continue;
    }

    const skuName = cleanDisplayText(row.ProductSkuName) || "General availability";
    const { regionName, accessState } = parseRegionLabel(row.RegionName);

    if (regionName === "Non Regional") {
      globalSkuMap.set(`${skuName}::${state}`, {
        skuName,
        state
      });
      continue;
    }

    if (!isCommercialPublicAvailabilityRow(row)) {
      continue;
    }

    const geographyName = cleanDisplayText(row.GeographyName) ?? "Unknown";
    const existing = regionMap.get(regionName);

    if (!existing) {
      regionMap.set(regionName, {
        regionName,
        geographyName,
        accessState,
        availabilityState: state,
        skuStates: [{ skuName, state }]
      });
      continue;
    }

    if (accessStateRank(accessState) > accessStateRank(existing.accessState)) {
      existing.accessState = accessState;
    }

    if (availabilityStateRank(state) > availabilityStateRank(existing.availabilityState)) {
      existing.availabilityState = state;
    }

    if (!existing.skuStates.some((entry) => entry.skuName === skuName && entry.state === state)) {
      existing.skuStates.push({ skuName, state });
      existing.skuStates.sort(
        (left, right) =>
          left.skuName.localeCompare(right.skuName) || left.state.localeCompare(right.state)
      );
    }
  }

  const availableRegions = [...regionMap.values()].sort((left, right) =>
    left.regionName.localeCompare(right.regionName)
  );
  const unavailableRegions = dataset.publicRegions
    .filter((region) => !regionMap.has(region.regionName))
    .map((region) => ({
      regionName: region.regionName,
      geographyName: region.geographyName,
      accessState: region.accessState
    }));
  const restrictedRegionCount = availableRegions.filter(
    (region) => region.accessState === "ReservedAccess"
  ).length;
  const earlyAccessRegionCount = availableRegions.filter(
    (region) => region.accessState === "EarlyAccess"
  ).length;
  const previewRegionCount = availableRegions.filter((region) =>
    region.skuStates.some((entry) => entry.state === "Preview")
  ).length;
  const retiringRegionCount = availableRegions.filter((region) =>
    region.skuStates.some((entry) => entry.state === "Retiring")
  ).length;

  return {
    ...baseSummary,
    mapped: true,
    matchType: mapping.matchType,
    matchedOfferingName: mapping.offeringName,
    matchedServiceLabel: mapping.matchedServiceLabel,
    matchedSkuHints: mapping.matchedSkuHints ?? [],
    notes: mapping.notes,
    availableRegionCount: availableRegions.length,
    unavailableRegionCount: unavailableRegions.length,
    restrictedRegionCount,
    earlyAccessRegionCount,
    previewRegionCount,
    retiringRegionCount,
    isGlobalService: globalSkuMap.size > 0,
    regions: availableRegions,
    unavailableRegions,
    globalSkuStates: [...globalSkuMap.values()].sort(
      (left, right) => left.skuName.localeCompare(right.skuName) || left.state.localeCompare(right.state)
    )
  };
}

app.http("service-regional-fit", {
  route: "service-regional-fit",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      const body = await request.json();
      const services = Array.isArray(body?.services) ? body.services.slice(0, MAX_SERVICES_PER_REQUEST) : [];

      if (services.length === 0) {
        return jsonResponse(400, {
          error: "At least one service is required to load regional availability."
        });
      }

      const dataset = await getLiveAvailabilityDataset();
      const payload = services.map((service) => buildServiceRegionalFit(service, dataset));

      return jsonResponse(
        200,
        {
          generatedAt: dataset.generatedAt,
          sourceUrl: AVAILABILITY_SOURCE_URL,
          services: payload
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
            : "Unable to load Azure Product Availability by Region data."
      });
    }
  }
});
