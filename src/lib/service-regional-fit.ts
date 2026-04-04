import type {
  ServiceRegionalFit,
  ServiceRegionalFitRequest,
  ServiceRegionalFitResponse,
  ServiceSummary
} from "@/types";

const SERVICE_REGIONAL_FIT_CACHE_PREFIX = "azure-review-dashboard.service-regional-fit.v2";
const SERVICE_REGIONAL_FIT_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

type CachedServiceRegionalFit = {
  savedAt: string;
  payload: ServiceRegionalFit;
};

const serviceRegionalFitMemoryCache = new Map<string, CachedServiceRegionalFit>();

function buildCacheKey(request: ServiceRegionalFitRequest) {
  return `${SERVICE_REGIONAL_FIT_CACHE_PREFIX}.${request.slug}`;
}

function isExpired(savedAt: string, ttlMs: number) {
  return Date.now() - Date.parse(savedAt) > ttlMs;
}

function clearCachedServiceRegionalFitByKey(cacheKey: string) {
  serviceRegionalFitMemoryCache.delete(cacheKey);

  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(cacheKey);
}

function isQuotaExceededError(error: unknown) {
  if (error instanceof DOMException) {
    return (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED"
    );
  }

  return error instanceof Error && /quota/i.test(error.message);
}

function purgePersistedServiceRegionalFitCache() {
  if (typeof window === "undefined") {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (key?.startsWith(SERVICE_REGIONAL_FIT_CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

function readCachedServiceRegionalFit(request: ServiceRegionalFitRequest) {
  const cacheKey = buildCacheKey(request);
  const inMemory = serviceRegionalFitMemoryCache.get(cacheKey);

  if (inMemory) {
    if (inMemory.payload.isGlobalService && inMemory.payload.unavailableRegions.length > 0) {
      clearCachedServiceRegionalFitByKey(cacheKey);
      return null;
    }

    if (isExpired(inMemory.savedAt, SERVICE_REGIONAL_FIT_CACHE_TTL_MS)) {
      clearCachedServiceRegionalFitByKey(cacheKey);
      return null;
    }

    return inMemory.payload;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(cacheKey);

  if (!raw) {
    return null;
  }

  try {
    const cached = JSON.parse(raw) as CachedServiceRegionalFit;

    if (cached.payload.isGlobalService && cached.payload.unavailableRegions.length > 0) {
      clearCachedServiceRegionalFitByKey(cacheKey);
      return null;
    }

    if (isExpired(cached.savedAt, SERVICE_REGIONAL_FIT_CACHE_TTL_MS)) {
      clearCachedServiceRegionalFitByKey(cacheKey);
      return null;
    }

    serviceRegionalFitMemoryCache.set(cacheKey, cached);
    return cached.payload;
  } catch {
    clearCachedServiceRegionalFitByKey(cacheKey);
    return null;
  }
}

function writeCachedServiceRegionalFit(request: ServiceRegionalFitRequest, payload: ServiceRegionalFit) {
  const cacheKey = buildCacheKey(request);
  const cached: CachedServiceRegionalFit = {
    savedAt: new Date().toISOString(),
    payload
  };

  serviceRegionalFitMemoryCache.set(cacheKey, cached);

  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(cached);

  try {
    window.localStorage.setItem(cacheKey, serialized);
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      return;
    }

    purgePersistedServiceRegionalFitCache();

    try {
      window.localStorage.setItem(cacheKey, serialized);
    } catch {
      // Keep the in-memory cache and allow the live availability payload to render.
    }
  }
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
