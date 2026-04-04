import type {
  ServicePricing,
  ServicePricingRequest,
  ServicePricingResponse,
  ServiceRegionalFitSummary,
  ServiceSummary
} from "@/types";

const SERVICE_PRICING_CACHE_PREFIX = "azure-review-dashboard.service-pricing.v1";
const SERVICE_PRICING_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

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
    const response = await fetch("/api/service-pricing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store",
      body: JSON.stringify({
        services: uncachedRequests
      })
    });

    if (!response.ok) {
      const message = await response.text();

      throw new Error(message || `Unable to load service pricing. (${response.status})`);
    }

    const payload = (await response.json()) as ServicePricingResponse;

    payload.services.forEach((servicePricing) => {
      const request = uncachedRequests.find((entry) => entry.slug === servicePricing.serviceSlug);

      if (!request) {
        return;
      }

      writeCachedServicePricing(request, servicePricing);
      cachedPayloads.set(servicePricing.serviceSlug, servicePricing);
    });
  }

  return uniqueRequests
    .map((request) => cachedPayloads.get(request.slug))
    .filter(Boolean) as ServicePricing[];
}
