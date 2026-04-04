import type {
  ServiceRegionalFit,
  ServiceRegionalFitRequest,
  ServiceRegionalFitResponse,
  ServiceSummary
} from "@/types";

const SERVICE_REGIONAL_FIT_CACHE_PREFIX = "azure-review-dashboard.service-regional-fit.v1";
const SERVICE_REGIONAL_FIT_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

type CachedServiceRegionalFit = {
  savedAt: string;
  payload: ServiceRegionalFit;
};

function buildCacheKey(request: ServiceRegionalFitRequest) {
  return `${SERVICE_REGIONAL_FIT_CACHE_PREFIX}.${request.slug}`;
}

function readCachedServiceRegionalFit(request: ServiceRegionalFitRequest) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(buildCacheKey(request));

  if (!raw) {
    return null;
  }

  try {
    const cached = JSON.parse(raw) as CachedServiceRegionalFit;

    if (Date.now() - Date.parse(cached.savedAt) > SERVICE_REGIONAL_FIT_CACHE_TTL_MS) {
      window.localStorage.removeItem(buildCacheKey(request));
      return null;
    }

    return cached.payload;
  } catch {
    window.localStorage.removeItem(buildCacheKey(request));
    return null;
  }
}

function writeCachedServiceRegionalFit(request: ServiceRegionalFitRequest, payload: ServiceRegionalFit) {
  if (typeof window === "undefined") {
    return;
  }

  const cached: CachedServiceRegionalFit = {
    savedAt: new Date().toISOString(),
    payload
  };

  window.localStorage.setItem(buildCacheKey(request), JSON.stringify(cached));
}

export function buildServiceRegionalFitRequest(
  service: Pick<ServiceSummary, "slug" | "service" | "aliases" | "regionalFitSummary">
): ServiceRegionalFitRequest {
  return {
    slug: service.slug,
    service: service.service,
    aliases: service.aliases ?? [],
    matchedOfferingName: service.regionalFitSummary?.matchedOfferingName,
    matchedServiceLabel: service.regionalFitSummary?.matchedServiceLabel,
    matchedSkuHints: service.regionalFitSummary?.matchedSkuHints ?? []
  };
}

export async function loadServiceRegionalFitBatch(requests: ServiceRegionalFitRequest[]) {
  const uniqueRequests = requests.filter(
    (request, index) => requests.findIndex((entry) => entry.slug === request.slug) === index
  );
  const cachedPayloads = new Map<string, ServiceRegionalFit>();
  const uncachedRequests: ServiceRegionalFitRequest[] = [];

  uniqueRequests.forEach((request) => {
    const cached = readCachedServiceRegionalFit(request);

    if (cached) {
      cachedPayloads.set(request.slug, cached);
      return;
    }

    uncachedRequests.push(request);
  });

  if (uncachedRequests.length > 0) {
    const response = await fetch("/api/availability", {
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

      throw new Error(message || `Unable to load live regional availability. (${response.status})`);
    }

    const payload = (await response.json()) as ServiceRegionalFitResponse;

    payload.services.forEach((regionalFit) => {
      const request = uncachedRequests.find((entry) => entry.slug === regionalFit.serviceSlug);

      if (!request) {
        return;
      }

      writeCachedServiceRegionalFit(request, regionalFit);
      cachedPayloads.set(request.slug, regionalFit);
    });
  }

  return uniqueRequests
    .map((request) => cachedPayloads.get(request.slug))
    .filter(Boolean) as ServiceRegionalFit[];
}
