export type ChecklistTechnologyStatus = "GA" | "Preview" | "Deprecated" | "Unknown";
export type MaturityBucket = "GA" | "Preview" | "Deprecated" | "Mixed";
export type RecommendedUsageConfidence = "High" | "Medium" | "Limited" | "Retire";

export type ReviewState =
  | "Not Reviewed"
  | "Compliant"
  | "Non-Compliant"
  | "Partially Compliant"
  | "Not Applicable"
  | "Exception Accepted";

export type FieldProvenance = "source" | "normalized" | "inferred" | "unavailable";

export type ChecklistItem = {
  guid: string;
  technology: string;
  technologySlug: string;
  technologyStatus: ChecklistTechnologyStatus;
  technologyMaturityBucket: MaturityBucket;
  usageConfidence: RecommendedUsageConfidence;
  technologyQualityScore: number;
  family: string;
  sourceKind: "checklists" | "checklists-ext";
  checklist?: string;
  category?: string;
  subcategory?: string;
  id?: string;
  text: string;
  description?: string;
  severity?: "High" | "Medium" | "Low";
  waf?: string;
  service?: string;
  armService?: string;
  link?: string;
  training?: string;
  query?: string;
  graph?: string;
  sourcePath?: string;
  sourceUrl?: string;
  normalizedAt?: string;
  provenance?: Partial<
    Record<
      | "technology"
      | "technologyStatus"
      | "category"
      | "subcategory"
      | "severity"
      | "waf"
      | "service"
      | "description",
      FieldProvenance
    >
  >;
};

export type TechnologySummary = {
  slug: string;
  technology: string;
  status: ChecklistTechnologyStatus;
  maturityBucket: MaturityBucket;
  itemCount: number;
  highSeverityCount: number;
  categories: string[];
  services: string[];
  wafPillars: string[];
  sourcePath: string;
  sourceUrl: string;
  timestamp?: string;
  sourceKind: "checklists" | "checklists-ext";
  description: string;
  whatThisMeans: string;
  quality: {
    label: string;
    qualityScore: number;
    metadataCompleteness: number;
    severityConfidence: number;
    sourceCoverageQuality: number;
    recommendedUsageConfidence: RecommendedUsageConfidence;
    generatedDate: string;
    summary: string;
  };
};

export type OverviewMetric = {
  label: string;
  value: number;
  detail: string;
};

export type DistributionRow = {
  label: string;
  count: number;
};

export type CatalogSummary = {
  generatedAt: string;
  itemCount: number;
  technologyCount: number;
  gaDefaultTechnologyCount: number;
  gaReadyItemCount: number;
  previewTechnologyCount: number;
  mixedTechnologyCount: number;
  deprecatedTechnologyCount: number;
  metrics: OverviewMetric[];
  severityDistribution: DistributionRow[];
  statusDistribution: DistributionRow[];
  maturityDistribution: DistributionRow[];
  sourceDistribution: DistributionRow[];
  wafDistribution: DistributionRow[];
  topTechnologies: DistributionRow[];
  technologies: TechnologySummary[];
};

export type TechnologyPayload = {
  generatedAt: string;
  technology: TechnologySummary;
  items: ChecklistItem[];
};

export type TechnologyIndex = {
  generatedAt: string;
  technologies: TechnologySummary[];
};

export type ReviewDraft = {
  reviewState: ReviewState;
  comments: string;
  owner: string;
  dueDate: string;
  evidenceLinks: string[];
  exceptionReason: string;
};

export type ExplorerFilters = {
  search: string;
  statuses: ChecklistTechnologyStatus[];
  maturityBuckets: MaturityBucket[];
  severities: string[];
  waf: string[];
  services: string[];
  sourceKinds: string[];
  technologies: string[];
};
