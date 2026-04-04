import type {
  ServicePricing,
  ServicePricingRequest,
  ServicePricingResponse,
  ServiceRegionalFitSummary,
  ServiceSummary
} from "@/types";

const SERVICE_PRICING_CACHE_PREFIX = "azure-review-dashboard.service-pricing.v1";
const SERVICE_PRICING_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SERVICE_PRICING_BATCH_SIZE = 20;
const SERVICE_PRICING_SOURCE_URL = "https://prices.azure.com/api/retail/prices";
const SERVICE_PRICING_CALCULATOR_URL = "https://azure.microsoft.com/en-us/pricing/calculator/";
const SERVICE_PRICING_PRICE_DISCLAIMER =
  "Public retail list pricing from Microsoft. Use the Azure Pricing Calculator after sign-in to layer negotiated rates and monthly usage assumptions.";

type CachedServicePricing = {
  savedAt: string;
  payload: ServicePricing;
};

function normalizeRegionName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function buildCacheKey(request: ServicePricingRequest) {
  const targetRegionKey = (request.targetRegions ?? [])
    .map((region) => normalizeRegionName(region))
    .sort()
    .join(".");

  return `${SERVICE_PRICING_CACHE_PREFIX}.${request.slug}.${targetRegionKey || "all"}`;
}

function readCachedServicePricing(request: ServicePricingRequest) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(buildCacheKey(request));

  if (!raw) {
    return null;
  }

  try {
    const cached = JSON.parse(raw) as CachedServicePricing;

    if (Date.now() - Date.parse(cached.savedAt) > SERVICE_PRICING_CACHE_TTL_MS) {
      window.localStorage.removeItem(buildCacheKey(request));
      return null;
    }

    return cached.payload;
  } catch {
    window.localStorage.removeItem(buildCacheKey(request));
    return null;
  }
}

function writeCachedServicePricing(request: ServicePricingRequest, payload: ServicePricing) {
  if (typeof window === "undefined") {
    return;
  }

  const cached: CachedServicePricing = {
    savedAt: new Date().toISOString(),
    payload
  };

  window.localStorage.setItem(buildCacheKey(request), JSON.stringify(cached));
}

function chunkRequests<T>(values: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function buildPricingFallback(
  request: ServicePricingRequest,
  note: string
): ServicePricing {
  return {
    serviceSlug: request.slug,
    serviceName: request.service,
    mapped: false,
    notes: [note],
    generatedAt: new Date().toISOString(),
    sourceUrl: SERVICE_PRICING_SOURCE_URL,
    calculatorUrl: SERVICE_PRICING_CALCULATOR_URL,
    priceDisclaimer: SERVICE_PRICING_PRICE_DISCLAIMER,
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

export function buildServicePricingRequest(
  service: Pick<ServiceSummary, "slug" | "service" | "aliases" | "regionalFitSummary">,
  regionalFit?: ServiceRegionalFitSummary,
  targetRegions: string[] = []
): ServicePricingRequest {
  const fit = regionalFit ?? service.regionalFitSummary;

  return {
    slug: service.slug,
    service: service.service,
    aliases: service.aliases ?? [],
    matchedOfferingName: fit?.matchedOfferingName,
    matchedServiceLabel: fit?.matchedServiceLabel,
    targetRegions
  };
}

export function matchesPricingTargetRegion(
  armRegionName: string,
  location: string,
  targetRegions: string[]
) {
  if (targetRegions.length === 0) {
    return false;
  }

  const normalizedArmRegion = normalizeRegionName(armRegionName);
  const normalizedLocation = normalizeRegionName(location);

  return targetRegions.some((targetRegion) => {
    const normalizedTarget = normalizeRegionName(targetRegion);

    return normalizedTarget === normalizedArmRegion || normalizedTarget === normalizedLocation;
  });
}

export async function loadServicePricingBatch(requests: ServicePricingRequest[]) {
  const uniqueRequests = requests.filter(
    (request, index) => requests.findIndex((entry) => entry.slug === request.slug) === index
  );
  const cachedPayloads = new Map<string, ServicePricing>();
  const fallbackPayloads = new Map<string, ServicePricing>();
  const uncachedRequests: ServicePricingRequest[] = [];

  uniqueRequests.forEach((request) => {
    const cached = readCachedServicePricing(request);

    if (cached) {
      cachedPayloads.set(request.slug, cached);
      return;
    }

    uncachedRequests.push(request);
  });

  if (uncachedRequests.length > 0) {
    const requestChunks = chunkRequests(uncachedRequests, SERVICE_PRICING_BATCH_SIZE);

    for (const requestChunk of requestChunks) {
      try {
        const response = await fetch("/api/pricing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          cache: "no-store",
          body: JSON.stringify({
            services: requestChunk
          })
        });

        if (!response.ok) {
          const message = await response.text();

          throw new Error(message || `Unable to load service pricing. (${response.status})`);
        }

        const payload = (await response.json()) as ServicePricingResponse;
        const returnedSlugs = new Set<string>();

        payload.services.forEach((servicePricing) => {
          const request = requestChunk.find((entry) => entry.slug === servicePricing.serviceSlug);

          if (!request) {
            return;
          }

          returnedSlugs.add(servicePricing.serviceSlug);
          writeCachedServicePricing(request, servicePricing);
          cachedPayloads.set(servicePricing.serviceSlug, servicePricing);
        });

        requestChunk.forEach((request) => {
          if (returnedSlugs.has(request.slug) || cachedPayloads.has(request.slug)) {
            return;
          }

          fallbackPayloads.set(
            request.slug,
            buildPricingFallback(
              request,
              "The pricing request completed, but no pricing payload was returned for this selected service."
            )
          );
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load service pricing for this selected service right now.";

        requestChunk.forEach((request) => {
          fallbackPayloads.set(
            request.slug,
            buildPricingFallback(
              request,
              `Pricing could not be loaded right now for this selected service. ${message}`
            )
          );
        });
      }
    }
  }

  return uniqueRequests.map(
    (request) =>
      cachedPayloads.get(request.slug) ??
      fallbackPayloads.get(request.slug) ??
      buildPricingFallback(
        request,
        "No pricing payload is available for this selected service yet."
      )
  );
}
