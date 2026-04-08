import { DashboardHome } from "@/components/dashboard-home";
import { readCatalogItems, readServiceIndex, readSummary } from "@/lib/catalog";
import { readHomepagePricingSnapshot } from "@/lib/homepage-pricing";
import type { ChecklistItem, ServiceIndex, ServiceSummary } from "@/types";

const HOMEPAGE_FINDING_SERVICE_SLUGS = new Set([
  "azure-kubernetes-service-aks",
  "api-management",
  "azure-app-service"
]);

function getSeverityScore(item: ChecklistItem) {
  switch (item.severity) {
    case "High":
      return 3;
    case "Medium":
      return 2;
    case "Low":
      return 1;
    default:
      return 0;
  }
}

function findHomepageServices(serviceIndex: ServiceIndex) {
  const preferredSlugs = [
    "azure-kubernetes-service-aks",
    "api-management",
    "azure-app-service"
  ];
  const resolved = preferredSlugs
    .map((slug) => serviceIndex.services.find((service) => service.slug === slug))
    .filter((service): service is ServiceSummary => Boolean(service));

  if (resolved.length === preferredSlugs.length) {
    return resolved;
  }

  return [...serviceIndex.services]
    .sort((left, right) => right.itemCount - left.itemCount)
    .slice(0, 3);
}

export default async function HomePage() {
  const [summary, serviceIndex, catalogItems] = await Promise.all([
    readSummary(),
    readServiceIndex(),
    readCatalogItems()
  ]);
  const featuredServices = findHomepageServices(serviceIndex);
  const pricingSnapshot = await readHomepagePricingSnapshot(featuredServices);

  const featuredFindings = catalogItems
    .filter(
      (item) =>
        item.serviceSlug &&
        HOMEPAGE_FINDING_SERVICE_SLUGS.has(item.serviceSlug) &&
        item.text.trim().length > 0
    )
    .sort(
      (left, right) =>
        getSeverityScore(right) - getSeverityScore(left) || left.text.length - right.text.length
    )
    .slice(0, 2);

  return (
    <DashboardHome
      summary={summary}
      serviceIndex={serviceIndex}
      featuredServices={featuredServices}
      featuredFindings={featuredFindings}
      pricingSnapshot={pricingSnapshot}
    />
  );
}
