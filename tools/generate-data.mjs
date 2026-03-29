import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRepo = process.env.REVIEW_CHECKLISTS_SOURCE_DIR
  ? path.resolve(root, process.env.REVIEW_CHECKLISTS_SOURCE_DIR)
  : path.join(root, "source-repo");
const outputDir = path.join(root, "public", "data");
const technologyDir = path.join(outputDir, "technologies");
const generatedAt = new Date().toISOString();
const sourceBaseUrl = "https://github.com/Azure/review-checklists/blob/main";
const excludedFiles = new Set([
  "checklist.en.master.json",
  "template.json",
  "waf_checklist.en.json",
  "fullwaf_checklist.en.json"
]);

function titleCase(value) {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  return value
    .trim()
    .replaceAll(/[_-]+/g, " ")
    .replaceAll(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      if (part.toUpperCase() === part && part.length <= 5) {
        return part;
      }

      return `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function normalizeStatus(raw) {
  const normalized = String(raw ?? "").trim().toLowerCase();

  if (normalized === "ga") return "GA";
  if (normalized === "preview") return "Preview";
  if (normalized === "deprecated") return "Deprecated";

  return "Unknown";
}

function normalizeSeverity(raw) {
  const normalized = String(raw ?? "").trim().toLowerCase();

  if (normalized === "high") return "High";
  if (normalized === "medium") return "Medium";
  if (normalized === "low") return "Low";

  return undefined;
}

function normalizeWaf(raw) {
  const normalized = titleCase(raw);

  if (!normalized) {
    return undefined;
  }

  const canonical = {
    Reliability: "Reliability",
    Security: "Security",
    Cost: "Cost",
    Operations: "Operations",
    Performance: "Performance"
  };

  return canonical[normalized] ?? normalized;
}

function deriveTechnologyName(fileName, metadataName, sampleChecklist) {
  if (metadataName) {
    return metadataName.trim();
  }

  if (sampleChecklist) {
    return sampleChecklist.trim();
  }

  const withoutSuffix = fileName
    .replace(/\.en\.json$/i, "")
    .replace(/_checklist$/i, "")
    .replace(/_sg$/i, " service guide");

  return titleCase(withoutSuffix) ?? fileName;
}

function collectUnique(items, selector) {
  return [...new Set(items.map(selector).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function summarizeCounts(values) {
  const counts = new Map();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function summarizeDescription(items, technology, status) {
  const categories = collectUnique(items, (item) => item.category).slice(0, 3);
  const services = collectUnique(items, (item) => item.service).slice(0, 4);
  const highSeverityCount = items.filter((item) => item.severity === "High").length;
  const categorySummary =
    categories.length > 0 ? `covers ${categories.join(", ")}` : "contains sparse category metadata";
  const serviceSummary =
    services.length > 0 ? `touches services like ${services.join(", ")}` : "uses generalized guidance";

  return `${technology} is a ${status} checklist family with ${items.length} normalized items, ${highSeverityCount} high-severity findings, ${categorySummary}, and ${serviceSummary}.`;
}

function firstLearnMoreUrl(learnMoreLink) {
  if (!Array.isArray(learnMoreLink)) {
    return undefined;
  }

  const entry = learnMoreLink.find((candidate) => typeof candidate?.url === "string");
  return entry?.url;
}

function inferArmService(rawItem) {
  return (
    rawItem["arm-service"] ??
    rawItem.armService ??
    rawItem.recommendationResourceType ??
    (typeof rawItem.service === "string" &&
    rawItem.service.includes("/") &&
    rawItem.service.startsWith("Microsoft.")
      ? rawItem.service
      : undefined)
  );
}

function normalizeItem(rawItem, technology, technologySlug, technologyStatus, family, sourceMeta) {
  const category = rawItem.category ?? rawItem.recommendationControl ?? rawItem.checklist;
  const subcategory =
    rawItem.subcategory ?? rawItem.recommendationResourceType ?? rawItem.type;
  const description =
    rawItem.description ?? rawItem.longDescription ?? rawItem.potentialBenefits;
  const service =
    typeof rawItem.service === "string" ? rawItem.service : inferArmService(rawItem);
  const severity = normalizeSeverity(rawItem.severity ?? rawItem.recommendationImpact);
  const waf = normalizeWaf(rawItem.waf);
  const link = rawItem.link ?? firstLearnMoreUrl(rawItem.learnMoreLink);

  return {
    guid: String(rawItem.guid),
    technology,
    technologySlug,
    technologyStatus,
    family,
    sourceKind: sourceMeta.kind,
    checklist: rawItem.checklist ?? family,
    category,
    subcategory,
    id: rawItem.id ?? rawItem.recommendationTypeId ?? rawItem.aprlGuid,
    text: String(rawItem.text ?? rawItem.description ?? rawItem.guid),
    description,
    severity,
    waf,
    service,
    armService: inferArmService(rawItem),
    link,
    training: rawItem.training,
    query: rawItem.query,
    graph: rawItem.graph ?? rawItem.graph_failure ?? rawItem.graph_success,
    sourcePath: sourceMeta.relativePath,
    sourceUrl: sourceMeta.sourceUrl,
    normalizedAt: generatedAt,
    provenance: {
      technology: technology === family ? "normalized" : "source",
      technologyStatus: rawItem.state ? "source" : "normalized",
      category: category
        ? rawItem.category || rawItem.recommendationControl
          ? "source"
          : "inferred"
        : "unavailable",
      subcategory: subcategory ? (rawItem.subcategory ? "source" : "inferred") : "unavailable",
      severity: severity
        ? rawItem.severity || rawItem.recommendationImpact
          ? "normalized"
          : "inferred"
        : "unavailable",
      waf: waf ? (rawItem.waf ? "normalized" : "unavailable") : "unavailable",
      service: service ? (rawItem.service ? "source" : "inferred") : "unavailable",
      description: description
        ? rawItem.description || rawItem.longDescription
          ? "source"
          : "inferred"
        : "unavailable"
    }
  };
}

async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
}

async function getEnglishChecklistFiles(subdirectory) {
  const directoryPath = path.join(sourceRepo, subdirectory);
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".en.json") &&
        !excludedFiles.has(entry.name)
    )
    .map((entry) => ({
      absolutePath: path.join(directoryPath, entry.name),
      relativePath: `${subdirectory}/${entry.name}`.replaceAll("\\", "/"),
      kind: subdirectory
    }));
}

async function generate() {
  const sourceExists = await fs
    .stat(sourceRepo)
    .then(() => true)
    .catch(() => false);

  if (!sourceExists) {
    throw new Error(
      `Source repository not found at ${sourceRepo}. Clone https://github.com/Azure/review-checklists or set REVIEW_CHECKLISTS_SOURCE_DIR.`
    );
  }

  await ensureDirectory(outputDir);
  await ensureDirectory(technologyDir);

  const files = [
    ...(await getEnglishChecklistFiles("checklists")),
    ...(await getEnglishChecklistFiles("checklists-ext"))
  ];

  const allItems = [];
  const technologies = [];

  for (const file of files) {
    const raw = JSON.parse(await fs.readFile(file.absolutePath, "utf8"));
    const fileName = path.basename(file.relativePath);
    const family = raw.metadata?.name ?? deriveTechnologyName(fileName, undefined, raw.items?.[0]?.checklist);
    const technology = deriveTechnologyName(fileName, raw.metadata?.name, raw.items?.[0]?.checklist);
    const technologySlug = slugify(`${technology}-${fileName.replace(/\.en\.json$/i, "")}`);
    const technologyStatus = normalizeStatus(raw.metadata?.state);
    const sourceMeta = {
      relativePath: file.relativePath,
      sourceUrl: `${sourceBaseUrl}/${file.relativePath}`,
      kind: file.kind
    };

    const items = (raw.items ?? [])
      .filter((item) => item?.guid && (item?.text || item?.description))
      .map((item) =>
        normalizeItem(
          item,
          technology,
          technologySlug,
          technologyStatus,
          family,
          sourceMeta
        )
      );

    const technologySummary = {
      slug: technologySlug,
      technology,
      status: technologyStatus,
      itemCount: items.length,
      highSeverityCount: items.filter((item) => item.severity === "High").length,
      categories: collectUnique(items, (item) => item.category),
      services: collectUnique(items, (item) => item.service),
      wafPillars: collectUnique(items, (item) => item.waf),
      sourcePath: file.relativePath,
      sourceUrl: sourceMeta.sourceUrl,
      timestamp: raw.metadata?.timestamp,
      sourceKind: file.kind,
      description: summarizeDescription(items, technology, technologyStatus)
    };

    allItems.push(...items);
    technologies.push(technologySummary);

    await writeJson(path.join(technologyDir, `${technologySlug}.json`), {
      generatedAt,
      technology: technologySummary,
      items
    });
  }

  const summary = {
    generatedAt,
    itemCount: allItems.length,
    technologyCount: technologies.length,
    metrics: [
      {
        label: "Normalized items",
        value: allItems.length,
        detail: "English source items compiled into a static, source-traceable dataset."
      },
      {
        label: "Checklist families",
        value: technologies.length,
        detail: "Static routes generated from the source repository without runtime APIs."
      },
      {
        label: "High-severity items",
        value: allItems.filter((item) => item.severity === "High").length,
        detail: "Useful for quickly shaping the first review conversation."
      },
      {
        label: "Preview or deprecated families",
        value: technologies.filter((technology) => technology.status !== "GA").length,
        detail: "Highlights maturity gaps and service areas that may need extra scrutiny."
      }
    ],
    severityDistribution: summarizeCounts(allItems.map((item) => item.severity ?? "Unspecified")),
    statusDistribution: summarizeCounts(technologies.map((technology) => technology.status)),
    sourceDistribution: summarizeCounts(technologies.map((technology) => technology.sourceKind)),
    wafDistribution: summarizeCounts(allItems.map((item) => item.waf ?? "Unspecified")),
    topTechnologies: summarizeCounts(allItems.map((item) => item.technology)).slice(0, 10),
    technologies: technologies.sort((left, right) =>
      left.technology.localeCompare(right.technology)
    )
  };

  await writeJson(path.join(outputDir, "catalog.json"), {
    generatedAt,
    items: allItems
  });
  await writeJson(path.join(outputDir, "summary.json"), summary);
  await writeJson(path.join(outputDir, "technology-index.json"), {
    generatedAt,
    technologies: summary.technologies
  });
}

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
