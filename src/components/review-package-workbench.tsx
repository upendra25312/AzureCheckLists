"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildPackageExportRows,
  buildPackageMarkdown,
  buildPackagePricingMarkdown,
  buildPackagePricingRows,
  buildPackagePricingText,
  buildPackageText,
  downloadCsv,
  downloadText
} from "@/lib/export";
import {
  buildServiceRegionalFitRequest,
  loadServiceRegionalFitBatch
} from "@/lib/service-regional-fit";
import { buildServicePricingRequest, loadServicePricingBatch } from "@/lib/service-pricing";
import {
  createReviewPackage,
  deletePackage,
  loadActivePackageId,
  loadPackages,
  loadScopedReviews,
  saveActivePackageId,
  savePackageReviews,
  savePackages,
  saveReviews,
  upsertPackage
} from "@/lib/review-storage";
import { ProjectReviewCopilot } from "@/components/project-review-copilot";
import { ReviewCloudControls } from "@/components/review-cloud-controls";
import type {
  ChecklistItem,
  ProjectReviewCopilotContext,
  ReviewDraft,
  ReviewPackage,
  ReviewPackageAudience,
  ServiceRegionalFit,
  ServiceIndex,
  ReviewServiceAssumption,
  ServicePricing
} from "@/types";

const AUDIENCES: ReviewPackageAudience[] = [
  "Cloud Architect",
  "Pre-sales Architect",
  "Sales Architect",
  "Senior Director",
  "Cloud Engineer"
];

function normalizeList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatRetailPrice(price: number | undefined, currencyCode = "USD") {
  if (price === undefined || Number.isNaN(price)) {
    return "Not published";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 6
  }).format(price);
}

function normalizeRegionName(value: string) {
  return value.trim().toLowerCase();
}

type MatrixChipTone = "good" | "warning" | "danger" | "neutral";

type MatrixChip = {
  label: string;
  tone: MatrixChipTone;
};

function createMatrixChip(label: string, tone: MatrixChipTone): MatrixChip {
  return {
    label,
    tone
  };
}

function buildRegionFitMatrix(
  regionalFit: ServiceRegionalFit | undefined,
  fallbackMapped: boolean | undefined,
  targetRegions: string[]
) {
  if (!regionalFit && !fallbackMapped) {
    return {
      chips: [createMatrixChip("Mapping pending", "neutral")],
      summary: "Official regional availability is not mapped for this service yet."
    };
  }

  if (!regionalFit) {
    return {
      chips: [createMatrixChip("Loading live availability", "neutral")],
      summary: "The project review is asking the dedicated backend for current regional availability."
    };
  }

  if (!regionalFit.mapped) {
    return {
      chips: [createMatrixChip("Mapping pending", "neutral")],
      summary:
        regionalFit.notes[0] ??
        "Official regional availability could not be mapped cleanly for this service."
    };
  }

  if (targetRegions.length > 0) {
    const chips = targetRegions.map((targetRegion) => {
      const normalizedTarget = normalizeRegionName(targetRegion);
      const availableRegion = regionalFit.regions.find(
        (region) => normalizeRegionName(region.regionName) === normalizedTarget
      );

      if (availableRegion) {
        if (availableRegion.accessState === "ReservedAccess") {
          return createMatrixChip(`${targetRegion} · Restricted`, "warning");
        }

        if (availableRegion.accessState === "EarlyAccess") {
          return createMatrixChip(`${targetRegion} · Early access`, "warning");
        }

        if (
          availableRegion.availabilityState === "Preview" ||
          availableRegion.skuStates.some((entry) => entry.state === "Preview")
        ) {
          return createMatrixChip(`${targetRegion} · Preview`, "warning");
        }

        if (
          availableRegion.availabilityState === "Retiring" ||
          availableRegion.skuStates.some((entry) => entry.state === "Retiring")
        ) {
          return createMatrixChip(`${targetRegion} · Retiring`, "warning");
        }

        return createMatrixChip(`${targetRegion} · Available`, "good");
      }

      const unavailableRegion = regionalFit.unavailableRegions.find(
        (region) => normalizeRegionName(region.regionName) === normalizedTarget
      );

      if (unavailableRegion) {
        if (unavailableRegion.accessState === "ReservedAccess") {
          return createMatrixChip(`${targetRegion} · Restricted region`, "warning");
        }

        if (unavailableRegion.accessState === "EarlyAccess") {
          return createMatrixChip(`${targetRegion} · Early access`, "warning");
        }

        return createMatrixChip(`${targetRegion} · Unavailable`, "danger");
      }

      if (regionalFit.isGlobalService) {
        return createMatrixChip(`${targetRegion} · Global service`, "neutral");
      }

      return createMatrixChip(`${targetRegion} · Not in feed`, "danger");
    });

    const accountedForCount = chips.filter((chip) => !chip.label.endsWith("Not in feed")).length;

    return {
      chips,
      summary: regionalFit.isGlobalService
        ? "This service is treated as global or non-regional for at least part of its Microsoft offering."
        : `${accountedForCount.toLocaleString()} of ${targetRegions.length.toLocaleString()} target regions are accounted for in the current availability data.`
    };
  }

  const chips: MatrixChip[] = [];

  if (regionalFit.isGlobalService) {
    chips.push(createMatrixChip("Global service", "neutral"));
  }

  if (regionalFit.availableRegionCount > 0) {
    chips.push(createMatrixChip(`${regionalFit.availableRegionCount.toLocaleString()} available`, "good"));
  }

  if (regionalFit.restrictedRegionCount > 0) {
    chips.push(
      createMatrixChip(`${regionalFit.restrictedRegionCount.toLocaleString()} restricted`, "warning")
    );
  }

  if (regionalFit.previewRegionCount > 0) {
    chips.push(createMatrixChip(`${regionalFit.previewRegionCount.toLocaleString()} preview`, "warning"));
  }

  if (regionalFit.unavailableRegionCount > 0) {
    chips.push(
      createMatrixChip(`${regionalFit.unavailableRegionCount.toLocaleString()} unavailable`, "danger")
    );
  }

  return {
    chips: chips.length > 0 ? chips : [createMatrixChip("Availability ready", "good")],
    summary: "Open the service view when you need the full per-region detail."
  };
}

function buildCostFitMatrix(
  pricing: ServicePricing | undefined,
  loading: boolean,
  error: string | null
) {
  if (!pricing) {
    return {
      chips: [createMatrixChip(loading ? "Loading pricing" : "Pricing pending", "neutral")],
      summary: error
        ? error
        : "The project review is loading current retail pricing for this service."
    };
  }

  if (!pricing.mapped) {
    return {
      chips: [createMatrixChip("Pricing pending", "neutral")],
      summary:
        pricing.notes[0] ?? "Microsoft does not currently publish a clean standalone pricing mapping for this service."
    };
  }

  const chips = [
    createMatrixChip(
      `Starts at ${formatRetailPrice(pricing.startsAtRetailPrice, pricing.currencyCode)}`,
      "good"
    ),
    createMatrixChip(`${pricing.skuCount.toLocaleString()} SKUs`, "neutral")
  ];

  if (pricing.targetRegionMatchCount > 0) {
    chips.push(
      createMatrixChip(`${pricing.targetRegionMatchCount.toLocaleString()} target matches`, "good")
    );
  } else {
    chips.push(createMatrixChip("No target-region match yet", "warning"));
  }

  return {
    chips,
    summary: `${pricing.billingLocationCount.toLocaleString()} billing locations and ${pricing.meterCount.toLocaleString()} pricing meters are currently published for this service.`
  };
}

function matchesPackageService(
  item: ChecklistItem,
  selectedServiceSlugs: Set<string>,
  selectedServiceNames: Set<string>
) {
  if (item.serviceSlug && selectedServiceSlugs.has(item.serviceSlug)) {
    return true;
  }

  const serviceName = (item.serviceCanonical ?? item.service ?? "").trim().toLowerCase();

  if (!serviceName) {
    return false;
  }

  return selectedServiceNames.has(serviceName);
}

type PackageFormState = {
  name: string;
  audience: ReviewPackageAudience;
  businessScope: string;
  targetRegions: string;
};

type PackageActionTone = "neutral" | "success";

function createFormState(reviewPackage?: ReviewPackage): PackageFormState {
  return {
    name: reviewPackage?.name ?? "",
    audience: reviewPackage?.audience ?? "Cloud Architect",
    businessScope: reviewPackage?.businessScope ?? "",
    targetRegions: reviewPackage?.targetRegions.join(", ") ?? ""
  };
}

function getServiceAssumption(
  reviewPackage: ReviewPackage | null,
  serviceSlug: string
): ReviewServiceAssumption {
  return (
    reviewPackage?.serviceAssumptions[serviceSlug] ?? {
      plannedRegion: "",
      preferredSku: "",
      sizingNote: ""
    }
  );
}

function createUniquePackageName(name: string, existingPackages: ReviewPackage[]) {
  const baseName = name.trim() || "Project review";
  const normalizedBaseName = baseName.toLowerCase();
  const existingNames = new Set(
    existingPackages.map((entry) => entry.name.trim().toLowerCase()).filter(Boolean)
  );

  if (!existingNames.has(normalizedBaseName)) {
    return baseName;
  }

  let suffix = 2;

  while (existingNames.has(`${normalizedBaseName} (${suffix})`)) {
    suffix += 1;
  }

  return `${baseName} (${suffix})`;
}

export function ReviewPackageWorkbench({ index }: { index: ServiceIndex }) {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [packages, setPackages] = useState<ReviewPackage[]>([]);
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, ReviewDraft>>({});
  const [serviceSearch, setServiceSearch] = useState("");
  const [form, setForm] = useState<PackageFormState>(createFormState());
  const [includeNotApplicable, setIncludeNotApplicable] = useState(true);
  const [includeNeedsReview, setIncludeNeedsReview] = useState(false);
  const [serviceRegionalFits, setServiceRegionalFits] = useState<Record<string, ServiceRegionalFit>>({});
  const [regionalFitLoading, setRegionalFitLoading] = useState(false);
  const [regionalFitError, setRegionalFitError] = useState<string | null>(null);
  const [servicePricing, setServicePricing] = useState<Record<string, ServicePricing>>({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [packageActionMessage, setPackageActionMessage] = useState<string | null>(null);
  const [packageActionTone, setPackageActionTone] = useState<PackageActionTone>("neutral");

  useEffect(() => {
    let active = true;

    fetch("/data/catalog.json")
      .then((response) => response.json())
      .then((payload: { items: ChecklistItem[] }) => {
        if (active) {
          setItems(payload.items);
        }
      });

    const storedPackages = loadPackages();
    const storedActivePackageId = loadActivePackageId();
    const fallbackPackageId = storedPackages[0]?.id ?? null;
    const nextActivePackageId = storedActivePackageId ?? fallbackPackageId;

    setPackages(storedPackages);
    setActivePackageId(nextActivePackageId);
    setReviews(loadScopedReviews(nextActivePackageId));

    const nextActivePackage = storedPackages.find((entry) => entry.id === nextActivePackageId);

    setForm(createFormState(nextActivePackage));

    return () => {
      active = false;
    };
  }, []);

  const activePackage = useMemo(
    () => packages.find((entry) => entry.id === activePackageId) ?? null,
    [activePackageId, packages]
  );
  const normalizedServiceSearch = serviceSearch.trim().toLowerCase();
  const selectedServiceSlugSet = useMemo(
    () => new Set(activePackage?.selectedServiceSlugs ?? []),
    [activePackage]
  );
  const selectedServiceNameSet = useMemo(() => {
    const names = new Set<string>();

    index.services.forEach((service) => {
      if (!selectedServiceSlugSet.has(service.slug)) {
        return;
      }

      names.add(service.service.toLowerCase());
      service.aliases.forEach((alias) => names.add(alias.toLowerCase()));
    });

    return names;
  }, [index.services, selectedServiceSlugSet]);
  const visibleServices = useMemo(
    () =>
      index.services.filter((service) => {
        if (!normalizedServiceSearch) {
          return true;
        }

        const searchable = [service.service, ...service.aliases, ...service.categories]
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedServiceSearch);
      }),
    [index.services, normalizedServiceSearch]
  );
  const selectedServices = useMemo(
    () =>
      index.services.filter((service) => activePackage?.selectedServiceSlugs.includes(service.slug) ?? false),
    [activePackage?.selectedServiceSlugs, index.services]
  );
  const packageItems = useMemo(() => {
    if (!items || !activePackage) {
      return [];
    }

    return items.filter((item) =>
      matchesPackageService(item, selectedServiceSlugSet, selectedServiceNameSet)
    );
  }, [activePackage, items, selectedServiceNameSet, selectedServiceSlugSet]);

  const includedCount = packageItems.filter(
    (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Include"
  ).length;
  const notApplicableCount = packageItems.filter(
    (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Not Applicable"
  ).length;
  const excludedCount = packageItems.filter(
    (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Exclude"
  ).length;
  const pendingCount = packageItems.filter(
    (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Needs Review"
  ).length;
  const pricingSnapshots = useMemo(
    () =>
      selectedServices
        .map((service) => servicePricing[service.slug])
        .filter(Boolean) as ServicePricing[],
    [selectedServices, servicePricing]
  );
  const mappedPricingCount = pricingSnapshots.filter((pricing) => pricing.mapped).length;
  const pricingReady = selectedServices.length > 0 && pricingSnapshots.length === selectedServices.length;
  const startingRetailPrice = pricingSnapshots
    .map((pricing) => pricing.startsAtRetailPrice)
    .filter((price) => price !== undefined) as number[];
  const projectReviewSteps = [
    {
      step: "01",
      title: "Create the project review",
      copy: "Name the project, audience, target regions, and scope so every note stays tied to one solution."
    },
    {
      step: "02",
      title: "Add the Azure services in scope",
      copy: "Keep only the components that actually belong to this design so the export stays focused."
    },
    {
      step: "03",
      title: "Review the region, cost, and checklist matrix",
      copy: "Confirm regional fit, pricing readiness, and checklist progress service by service before jumping into detail."
    },
    {
      step: "04",
      title: "Ask the project review copilot",
      copy: "Use the scoped copilot when you want a fast summary of blockers, pricing caveats, review gaps, or leadership-ready wording."
    },
    {
      step: "05",
      title: "Open service pages and write project notes",
      copy: "From each selected service, open findings, mark them as included or not applicable, and capture your comments."
    },
    {
      step: "06",
      title: "Download the design notes and pricing snapshot",
      copy: "Export only the selected services and their project-specific notes in the format that suits the audience."
    },
    {
      step: "07",
      title: "Sign in only when you want Azure-backed save and reuse",
      copy: "Browsing and local exports stay open. Sign in later when you want to save this project review to Azure and resume it from another session."
    }
  ];
  const selectedServiceProgress = useMemo(
    () =>
      selectedServices.map((service) => {
        const serviceNameSet = new Set(
          [service.service, ...service.aliases].map((value) => value.trim().toLowerCase())
        );
        const serviceItems = packageItems.filter((item) => {
          if (item.serviceSlug && item.serviceSlug === service.slug) {
            return true;
          }

          const serviceName = (item.serviceCanonical ?? item.service ?? "").trim().toLowerCase();
          return serviceName ? serviceNameSet.has(serviceName) : false;
        });

        return {
          service,
          itemCount: serviceItems.length,
          includedCount: serviceItems.filter(
            (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Include"
          ).length,
          notApplicableCount: serviceItems.filter(
            (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Not Applicable"
          ).length,
          excludedCount: serviceItems.filter(
            (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Exclude"
          ).length,
          pendingCount: serviceItems.filter(
            (item) => (reviews[item.guid]?.packageDecision ?? "Needs Review") === "Needs Review"
          ).length
        };
      }),
    [packageItems, reviews, selectedServices]
  );

  useEffect(() => {
    let active = true;

    if (!activePackage || selectedServices.length === 0) {
      setServiceRegionalFits({});
      setRegionalFitLoading(false);
      setRegionalFitError(null);
      return;
    }

    setRegionalFitLoading(true);
    setRegionalFitError(null);

    loadServiceRegionalFitBatch(
      selectedServices.map((service) => buildServiceRegionalFitRequest(service))
    )
      .then((regionalFits) => {
        if (!active) {
          return;
        }

        setServiceRegionalFits(
          regionalFits.reduce<Record<string, ServiceRegionalFit>>((accumulator, entry) => {
            if (entry.serviceSlug) {
              accumulator[entry.serviceSlug] = entry;
            }
            return accumulator;
          }, {})
        );
        setRegionalFitLoading(false);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setRegionalFitLoading(false);
        setRegionalFitError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to load live regional availability."
        );
      });

    return () => {
      active = false;
    };
  }, [activePackage, selectedServices]);

  useEffect(() => {
    let active = true;

    if (!activePackage || selectedServices.length === 0) {
      setServicePricing({});
      setPricingLoading(false);
      setPricingError(null);
      return;
    }

    setPricingLoading(true);
    setPricingError(null);

    loadServicePricingBatch(
      selectedServices.map((service) =>
        buildServicePricingRequest(service, service.regionalFitSummary, activePackage.targetRegions)
      )
    )
      .then((pricing) => {
        if (!active) {
          return;
        }

        setServicePricing(
          pricing.reduce<Record<string, ServicePricing>>((accumulator, entry) => {
            accumulator[entry.serviceSlug] = entry;
            return accumulator;
          }, {})
        );
        setPricingLoading(false);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setPricingLoading(false);
        setPricingError(nextError instanceof Error ? nextError.message : "Unable to load pricing.");
      });

    return () => {
      active = false;
    };
  }, [activePackage, selectedServices]);

  const matrixRows = useMemo(
    () =>
      selectedServiceProgress.map((entry) => {
        const liveRegionalFit = serviceRegionalFits[entry.service.slug];
        const regionFit = buildRegionFitMatrix(
          liveRegionalFit,
          entry.service.regionalFitSummary?.mapped,
          activePackage?.targetRegions ?? []
        );
        const costFit = buildCostFitMatrix(
          servicePricing[entry.service.slug],
          pricingLoading,
          pricingError
        );
        const checklistChips: MatrixChip[] = [
          createMatrixChip(`${entry.includedCount.toLocaleString()} included`, "good"),
          createMatrixChip(`${entry.notApplicableCount.toLocaleString()} not applicable`, "warning"),
          createMatrixChip(`${entry.pendingCount.toLocaleString()} pending`, "neutral")
        ];

        if (entry.excludedCount > 0) {
          checklistChips.push(
            createMatrixChip(`${entry.excludedCount.toLocaleString()} excluded`, "danger")
          );
        }

        return {
          ...entry,
          regionFit,
          costFit,
          checklistChips,
          checklistSummary:
            `${entry.itemCount.toLocaleString()} findings across ${entry.service.familyCount.toLocaleString()} families are currently tied to this service in the active project review.`
        };
      }),
    [
      activePackage?.targetRegions,
      pricingError,
      pricingLoading,
      selectedServiceProgress,
      servicePricing,
      serviceRegionalFits
    ]
  );
  const copilotContext = useMemo<ProjectReviewCopilotContext | null>(() => {
    if (!activePackage || matrixRows.length === 0) {
      return null;
    }

    const firstRegionalFit = Object.values(serviceRegionalFits).find(Boolean);
    const firstPricingSnapshot = pricingSnapshots.find(Boolean);
    const findings = packageItems
      .filter((item) => {
        const review = reviews[item.guid];

        if (!review) {
          return false;
        }

        return Boolean(
          review.packageDecision !== "Needs Review" ||
            review.comments.trim() ||
            review.evidenceLinks.length > 0 ||
            review.owner.trim() ||
            review.dueDate.trim()
        );
      })
      .slice(0, 40)
      .map((item) => {
        const review = reviews[item.guid]!;

        return {
          guid: item.guid,
          serviceName: item.serviceCanonical ?? item.service ?? "Unmapped service",
          finding: item.text,
          severity: item.severity,
          decision: review.packageDecision,
          comments: review.comments || undefined,
          owner: review.owner || undefined,
          dueDate: review.dueDate || undefined
        };
      });

    return {
      review: {
        id: activePackage.id,
        name: activePackage.name,
        audience: activePackage.audience,
        businessScope: activePackage.businessScope,
        targetRegions: activePackage.targetRegions
      },
      services: matrixRows.map((row) => {
        const assumption = getServiceAssumption(activePackage, row.service.slug);

        return {
          serviceSlug: row.service.slug,
          serviceName: row.service.service,
          description: row.service.description,
          plannedRegion: assumption.plannedRegion || undefined,
          preferredSku: assumption.preferredSku || undefined,
          sizingNote: assumption.sizingNote || undefined,
          itemCount: row.itemCount,
          includedCount: row.includedCount,
          notApplicableCount: row.notApplicableCount,
          excludedCount: row.excludedCount,
          pendingCount: row.pendingCount,
          regionFitSummary: row.regionFit.summary,
          costFitSummary: row.costFit.summary
        };
      }),
      findings,
      sources: [
        {
          label: "Project review context",
          note: "Selected services, target regions, service assumptions, checklist decisions, and recorded notes from the active browser session."
        },
        firstRegionalFit?.availabilitySourceUrl
          ? {
              label: "Azure Product Availability by Region",
              url: firstRegionalFit.availabilitySourceUrl
            }
          : null,
        firstRegionalFit?.regionsSourceUrl
          ? {
              label: "Azure regions list",
              url: firstRegionalFit.regionsSourceUrl
            }
          : null,
        firstPricingSnapshot?.sourceUrl
          ? {
              label: "Azure Retail Prices API",
              url: firstPricingSnapshot.sourceUrl
            }
          : null,
        firstPricingSnapshot?.calculatorUrl
          ? {
              label: "Azure Pricing Calculator",
              url: firstPricingSnapshot.calculatorUrl
            }
          : null
      ].filter(Boolean) as ProjectReviewCopilotContext["sources"]
    };
  }, [activePackage, matrixRows, packageItems, pricingSnapshots, reviews, serviceRegionalFits]);

  function refreshPackages(nextPackages: ReviewPackage[], nextActiveId: string | null) {
    setPackages(nextPackages);
    setActivePackageId(nextActiveId);
    saveActivePackageId(nextActiveId);
    setReviews(loadScopedReviews(nextActiveId));
    const nextActivePackage = nextPackages.find((entry) => entry.id === nextActiveId);

    setForm(createFormState(nextActivePackage));
  }

  function handleRestoreCloudState(input: {
    activePackage: ReviewPackage | null;
    reviews: Record<string, ReviewDraft>;
  }) {
    const { activePackage: restoredPackage, reviews: restoredReviews } = input;

    if (!restoredPackage) {
      saveReviews(restoredReviews);
      setReviews(restoredReviews);
      setPackageActionTone("success");
      setPackageActionMessage(
        "Loaded saved review records from Azure, but no active project review package was stored there."
      );
      return;
    }

    const currentPackages = loadPackages();
    const existingIndex = currentPackages.findIndex((entry) => entry.id === restoredPackage.id);
    const nextPackages = [...currentPackages];

    if (existingIndex === -1) {
      nextPackages.unshift(restoredPackage);
    } else {
      nextPackages.splice(existingIndex, 1, restoredPackage);
    }

    savePackages(nextPackages);
    savePackageReviews(restoredPackage.id, restoredReviews);
    setReviews(restoredReviews);
    refreshPackages(nextPackages, restoredPackage.id);
    setPackageActionTone("success");
    setPackageActionMessage(
      `Loaded "${restoredPackage.name}" from Azure and made it the active project review.`
    );
  }

  function handleCreatePackage() {
    const requestedName = form.name.trim();
    const nextName = createUniquePackageName(requestedName, packages);
    const nextPackage = upsertPackage(
      createReviewPackage({
        name: nextName,
        audience: form.audience,
        businessScope: form.businessScope,
        targetRegions: normalizeList(form.targetRegions)
      })
    );
    const nextPackages = loadPackages();

    refreshPackages(nextPackages, nextPackage.id);
    setPackageActionTone("success");
    setPackageActionMessage(
      requestedName && requestedName.toLowerCase() !== nextName.toLowerCase()
        ? `Created "${nextName}" and made it the active project review because "${requestedName}" already existed.`
        : `Created "${nextPackage.name}" and made it the active project review.`
    );
  }

  function handleSelectPackage(nextPackageId: string) {
    refreshPackages(loadPackages(), nextPackageId || null);
    setPackageActionTone("neutral");
    setPackageActionMessage(
      nextPackageId
        ? `Switched the active project review.`
        : "Cleared the active project review. Notes will stay local until you activate another review."
    );
  }

  function handleSavePackageDetails() {
    if (!activePackage) {
      return;
    }

    upsertPackage({
      ...activePackage,
      name: form.name.trim() || activePackage.name,
      audience: form.audience,
      businessScope: form.businessScope.trim(),
      targetRegions: normalizeList(form.targetRegions)
    });

    refreshPackages(loadPackages(), activePackage.id);
    setPackageActionTone("success");
    setPackageActionMessage(`Saved the project review details for "${form.name.trim() || activePackage.name}".`);
  }

  function handleDeletePackage() {
    if (!activePackage) {
      return;
    }

    const deletedPackageName = activePackage.name;
    deletePackage(activePackage.id);
    const nextPackages = loadPackages();

    refreshPackages(nextPackages, nextPackages[0]?.id ?? null);
    setPackageActionTone("success");
    setPackageActionMessage(
      nextPackages[0]
        ? `Deleted "${deletedPackageName}". "${nextPackages[0].name}" is now the active project review.`
        : `Deleted "${deletedPackageName}". No project review is active right now.`
    );
  }

  function toggleServiceSelection(serviceSlug: string) {
    if (!activePackage) {
      return;
    }

    const selectedServiceSlugs = activePackage.selectedServiceSlugs.includes(serviceSlug)
      ? activePackage.selectedServiceSlugs.filter((entry) => entry !== serviceSlug)
      : [...activePackage.selectedServiceSlugs, serviceSlug];

    upsertPackage({
      ...activePackage,
      selectedServiceSlugs
    });

    refreshPackages(loadPackages(), activePackage.id);
  }

  function updateServiceAssumption(
    serviceSlug: string,
    patch: Partial<ReviewServiceAssumption>
  ) {
    if (!activePackage) {
      return;
    }

    const current = getServiceAssumption(activePackage, serviceSlug);
    const nextAssumption = {
      ...current,
      ...patch
    };
    const shouldRemove =
      !nextAssumption.plannedRegion.trim() &&
      !nextAssumption.preferredSku.trim() &&
      !nextAssumption.sizingNote.trim();
    const nextServiceAssumptions = {
      ...activePackage.serviceAssumptions
    };

    if (shouldRemove) {
      delete nextServiceAssumptions[serviceSlug];
    } else {
      nextServiceAssumptions[serviceSlug] = nextAssumption;
    }

    const saved = upsertPackage({
      ...activePackage,
      serviceAssumptions: nextServiceAssumptions
    });

    setPackages((currentPackages) => {
      const existingIndex = currentPackages.findIndex((entry) => entry.id === saved.id);

      if (existingIndex === -1) {
        return [saved, ...currentPackages];
      }

      const nextPackages = [...currentPackages];

      nextPackages.splice(existingIndex, 1, saved);
      return nextPackages;
    });
  }

  function exportPackageCsv() {
    if (!activePackage) {
      return;
    }

    downloadCsv(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "project-review"}.csv`,
      buildPackageExportRows(activePackage, packageItems, reviews, {
        includeNotApplicable,
        includeNeedsReview
      })
    );
  }

  function exportPackageMarkdown() {
    if (!activePackage) {
      return;
    }

    downloadText(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "project-review"}.md`,
      buildPackageMarkdown(activePackage, packageItems, reviews, {
        includeNotApplicable,
        includeNeedsReview
      }),
      "text/markdown;charset=utf-8"
    );
  }

  function exportPackageText() {
    if (!activePackage) {
      return;
    }

    downloadText(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "project-review"}.txt`,
      buildPackageText(activePackage, packageItems, reviews, {
        includeNotApplicable,
        includeNeedsReview
      })
    );
  }

  function exportPackagePricingCsv() {
    if (!activePackage) {
      return;
    }

    downloadCsv(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "project-review"}-pricing.csv`,
      buildPackagePricingRows(activePackage, pricingSnapshots)
    );
  }

  function exportPackagePricingMarkdown() {
    if (!activePackage) {
      return;
    }

    downloadText(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "project-review"}-pricing.md`,
      buildPackagePricingMarkdown(activePackage, pricingSnapshots),
      "text/markdown;charset=utf-8"
    );
  }

  function exportPackagePricingText() {
    if (!activePackage) {
      return;
    }

    downloadText(
      `${activePackage.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || "project-review"}-pricing.txt`,
      buildPackagePricingText(activePackage, pricingSnapshots)
    );
  }

  return (
    <main className="section-stack">
      <section className="hero-panel director-hero editorial-hero">
        <div className="editorial-hero-layout">
          <div className="editorial-hero-copy">
            <p className="eyebrow">Project review</p>
            <h1 className="hero-title">Create one project review, then keep every note tied to that solution.</h1>
            <p className="hero-copy">
              Start with the customer or workload, add only the Azure services that belong to it,
              review the relevant findings, and export design notes and pricing that stay scoped to
              that single project.
            </p>
            <p className="hero-note">
              This is the clearest workflow for cloud architects, pre-sales, sales architects, and
              senior reviewers who need a project-ready artifact instead of the full source catalog.
            </p>
            <div className="hero-actions">
              <Link href="/services" className="secondary-button">
                Browse services
              </Link>
              <Link href="/explorer" className="ghost-button">
                Open explorer
              </Link>
            </div>
          </div>

          <aside className="leadership-brief">
            <p className="eyebrow">Why this matters</p>
            <h2 className="leadership-title">One project review, one project story.</h2>
            <div className="leadership-list">
              <article>
                <strong>Scoped services</strong>
                <p>Keep only the Azure services that belong to the current solution in the review.</p>
              </article>
              <article>
                <strong>Project-specific notes</strong>
                <p>Record why a finding is included, not applicable, excluded, or still pending review.</p>
              </article>
              <article>
                <strong>Commercial fit</strong>
                <p>Regional availability and public retail pricing now follow the same project review scope and target regions.</p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section className="surface-panel editorial-section executive-brief-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">How to use this page</p>
            <h2 className="section-title">Follow the same seven steps when you want a reusable customer review artifact.</h2>
            <p className="section-copy">
              The goal of this page is to make the workflow obvious: create the review, add services,
              check the matrix, ask for scoped summaries, write notes on the selected service pages,
              export only what belongs to the design, and sign in only when you want Azure-backed
              save and reuse.
            </p>
          </div>
        </div>
        <div className="start-here-grid">
          {projectReviewSteps.map((step) => (
            <article className="path-card" key={step.step}>
              <div className="path-card-topline">
                <span className="path-card-number">{step.step}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Step 1</p>
            <h2 className="section-title">Create or activate the project review that should receive notes.</h2>
            <p className="section-copy">
              Notes entered on service and explorer pages are scoped to the active project review.
              If no review is active, the app falls back to local-only general notes.
            </p>
          </div>
        </div>

        <div className="package-header-grid">
          <article className="filter-card package-card">
            <div className="filter-grid">
              <label>
                <span className="microcopy">Active project review</span>
                <select
                  className="field-select"
                  value={activePackageId ?? ""}
                  onChange={(event) => handleSelectPackage(event.target.value)}
                >
                  <option value="">No active project review</option>
                  {packages.map((reviewPackage) => (
                    <option key={reviewPackage.id} value={reviewPackage.id}>
                      {reviewPackage.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="microcopy">Project review name</span>
                <input
                  className="field-input"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Contoso edge review"
                />
              </label>

              <label>
                <span className="microcopy">Audience</span>
                <select
                  className="field-select"
                  value={form.audience}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      audience: event.target.value as ReviewPackageAudience
                    }))
                  }
                >
                  {AUDIENCES.map((audience) => (
                    <option key={audience} value={audience}>
                      {audience}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="microcopy">Target regions</span>
                <input
                  className="field-input"
                  value={form.targetRegions}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, targetRegions: event.target.value }))
                  }
                  placeholder="East US, West Europe, UAE Central"
                />
              </label>

              <label>
                <span className="microcopy">Business scope</span>
                <textarea
                  className="field-textarea"
                  value={form.businessScope}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, businessScope: event.target.value }))
                  }
                  placeholder="Capture the project scope, constraints, and customer assumptions."
                />
              </label>
            </div>

            <div className="button-row">
              <button type="button" className="primary-button" onClick={handleCreatePackage}>
                Create project review
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSavePackageDetails}
                disabled={!activePackage}
              >
                Save review details
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={handleDeletePackage}
                disabled={!activePackage}
              >
                Delete review
              </button>
            </div>

            {packageActionMessage ? (
              <p
                className={`microcopy ${
                  packageActionTone === "success" ? "status-copy status-copy-success" : "status-copy"
                }`}
              >
                {packageActionMessage}
              </p>
            ) : null}
          </article>

          <article className="filter-card package-card">
            <p className="eyebrow">Project summary</p>
            <div className="package-stats-grid">
              <article className="hero-metric-card">
                <span>Services in scope</span>
                <strong>{activePackage?.selectedServiceSlugs.length.toLocaleString() ?? "0"}</strong>
                <p>Only these services are exported as part of the project handoff.</p>
              </article>
              <article className="hero-metric-card">
                <span>Included findings</span>
                <strong>{includedCount.toLocaleString()}</strong>
                <p>Findings explicitly marked for the active project review.</p>
              </article>
              <article className="hero-metric-card">
                <span>Not applicable</span>
                <strong>{notApplicableCount.toLocaleString()}</strong>
                <p>Findings retained with rationale when they do not apply to the current scope.</p>
              </article>
              <article className="hero-metric-card">
                <span>Pending review</span>
                <strong>{pendingCount.toLocaleString()}</strong>
                <p>Items still waiting for a project-specific decision or final note.</p>
              </article>
            </div>
          </article>
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Step 2</p>
            <h2 className="section-title">Choose only the Azure services that belong to this solution.</h2>
            <p className="section-copy">
              Start with the solution scope, then toggle services in or out of the project review.
              You can still review the full catalog from the service and explorer pages.
            </p>
          </div>
          <div className="chip-row">
            <span className="chip">{visibleServices.length.toLocaleString()} visible services</span>
          </div>
        </div>

        <div className="filter-card workspace-toolbar">
          <div className="workspace-toolbar-main">
            <input
              className="search-input"
              type="search"
              value={serviceSearch}
              placeholder="Search services to add into the project review"
              onChange={(event) => setServiceSearch(event.target.value)}
            />
            <p className="microcopy">
              Service selection should reflect the actual solution scope, not every adjacent service
              that appears in the source repository.
            </p>
          </div>
        </div>

        <div className="service-selection-grid">
          {visibleServices.map((service) => {
            const selected = activePackage?.selectedServiceSlugs.includes(service.slug) ?? false;

            return (
              <article className="future-card service-selection-card" key={service.slug}>
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Azure service</p>
                    <h3>{service.service}</h3>
                  </div>
                  <span className="chip">
                    {selected ? "In project review" : "Not in project review"}
                  </span>
                </div>
                <p className="microcopy">{service.description}</p>
                <div className="button-row">
                  <button
                    type="button"
                    className={selected ? "secondary-button" : "ghost-button"}
                    disabled={!activePackage}
                    onClick={() => toggleServiceSelection(service.slug)}
                  >
                    {selected ? "Remove from review" : "Add to review"}
                  </button>
                  <Link href={`/services/${service.slug}`} className="muted-link">
                    Open service review
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Step 3</p>
            <h2 className="section-title">See region fit, cost fit, and checklist progress in one matrix.</h2>
            <p className="section-copy">
              This is the quickest place to confirm whether each selected service is region-ready,
              commercially understood, and review-ready before you open the detailed service page.
            </p>
          </div>
        </div>

        <div className="traceability-grid">
          <article className="trace-card">
            <strong>Selected services</strong>
            <p>{selectedServices.length.toLocaleString()}</p>
          </article>
          <article className="trace-card">
            <strong>Availability ready</strong>
            <p>
              {Object.keys(serviceRegionalFits).length.toLocaleString()}
              {regionalFitLoading ? " · refreshing" : ""}
            </p>
          </article>
          <article className="trace-card">
            <strong>Pricing ready</strong>
            <p>
              {pricingSnapshots.length.toLocaleString()}
              {pricingLoading ? " · refreshing" : ""}
            </p>
          </article>
          <article className="trace-card">
            <strong>Target regions</strong>
            <p>{activePackage?.targetRegions.join(", ") || "Not captured yet"}</p>
          </article>
        </div>

        {regionalFitError ? (
          <section className="filter-card">
            <p className="eyebrow">Availability source</p>
            <h3>The live availability refresh did not complete for the matrix.</h3>
            <p className="microcopy">
              {regionalFitError} The matrix will keep using the service-level mapping summary until
              the dedicated backend responds again.
            </p>
          </section>
        ) : null}

        {matrixRows.length > 0 ? (
          <div className="project-review-matrix">
            <div className="project-review-matrix-head">
              <span>Service</span>
              <span>Region fit</span>
              <span>Cost fit</span>
              <span>Checklist progress</span>
              <span>Design assumptions</span>
            </div>
            {matrixRows.map((row) => (
              <article className="project-review-matrix-row" key={row.service.slug}>
                <div className="project-review-matrix-cell project-review-matrix-service">
                  <p className="eyebrow">Service</p>
                  <h3>{row.service.service}</h3>
                  <p className="microcopy">{row.service.description}</p>
                  <div className="chip-row">
                    <span className="chip">{row.service.familyCount.toLocaleString()} families</span>
                    <span className="chip">{row.itemCount.toLocaleString()} findings</span>
                  </div>
                </div>

                <div className="project-review-matrix-cell">
                  <p className="eyebrow">Region fit</p>
                  <div className="chip-row">
                    {row.regionFit.chips.map((chip) => (
                      <span
                        className={`matrix-chip matrix-chip-${chip.tone}`}
                        key={`${row.service.slug}-${chip.label}`}
                      >
                        {chip.label}
                      </span>
                    ))}
                  </div>
                  <p className="microcopy">{row.regionFit.summary}</p>
                </div>

                <div className="project-review-matrix-cell">
                  <p className="eyebrow">Cost fit</p>
                  <div className="chip-row">
                    {row.costFit.chips.map((chip) => (
                      <span
                        className={`matrix-chip matrix-chip-${chip.tone}`}
                        key={`${row.service.slug}-${chip.label}`}
                      >
                        {chip.label}
                      </span>
                    ))}
                  </div>
                  <p className="microcopy">{row.costFit.summary}</p>
                </div>

                <div className="project-review-matrix-cell">
                  <p className="eyebrow">Checklist progress</p>
                  <div className="chip-row">
                    {row.checklistChips.map((chip) => (
                      <span
                        className={`matrix-chip matrix-chip-${chip.tone}`}
                        key={`${row.service.slug}-${chip.label}`}
                      >
                        {chip.label}
                      </span>
                    ))}
                  </div>
                  <p className="microcopy">{row.checklistSummary}</p>
                </div>

                <div className="project-review-matrix-cell project-review-matrix-actions">
                  <p className="eyebrow">Design assumptions</p>
                  <div className="matrix-assumption-grid">
                    <label>
                      <span className="microcopy">Planned region</span>
                      <input
                        className="field-input"
                        value={getServiceAssumption(activePackage, row.service.slug).plannedRegion}
                        onChange={(event) =>
                          updateServiceAssumption(row.service.slug, {
                            plannedRegion: event.target.value
                          })
                        }
                        placeholder={activePackage?.targetRegions[0] ?? "East US"}
                      />
                    </label>
                    <label>
                      <span className="microcopy">Preferred SKU</span>
                      <input
                        className="field-input"
                        value={getServiceAssumption(activePackage, row.service.slug).preferredSku}
                        onChange={(event) =>
                          updateServiceAssumption(row.service.slug, {
                            preferredSku: event.target.value
                          })
                        }
                        placeholder="Standard v2, Premium, P1v3, S1"
                      />
                    </label>
                    <label>
                      <span className="microcopy">Sizing note</span>
                      <textarea
                        className="field-textarea matrix-textarea"
                        value={getServiceAssumption(activePackage, row.service.slug).sizingNote}
                        onChange={(event) =>
                          updateServiceAssumption(row.service.slug, {
                            sizingNote: event.target.value
                          })
                        }
                        placeholder="Capture rough sizing, expected scale, customer constraints, or estimate assumptions for this service."
                      />
                    </label>
                  </div>
                  <Link href={`/services/${row.service.slug}`} className="secondary-button">
                    Open service review
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="filter-card">
            <p className="eyebrow">No services selected yet</p>
            <h3>Add services first so the matrix can show region fit, cost fit, and checklist progress.</h3>
            <p className="microcopy">
              Once a service is added, this section becomes the fastest way to see whether the
              current project is ready for deeper review and export.
            </p>
          </section>
        )}
      </section>

      {copilotContext ? <ProjectReviewCopilot context={copilotContext} /> : null}

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Step 5</p>
            <h2 className="section-title">Open the selected service pages and write project-specific notes.</h2>
            <p className="section-copy">
              This is where the real review happens. Open a selected service, review findings, and
              record why each relevant item is included, not applicable, excluded, or still pending.
            </p>
          </div>
        </div>

        {selectedServiceProgress.length > 0 ? (
          <div className="service-selection-grid">
            {selectedServiceProgress.map((entry) => (
              <article className="future-card service-selection-card" key={entry.service.slug}>
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Service review</p>
                    <h3>{entry.service.service}</h3>
                  </div>
                  <span className="chip">{entry.itemCount.toLocaleString()} findings</span>
                </div>
                <p className="microcopy">
                  {entry.includedCount.toLocaleString()} included, {entry.notApplicableCount.toLocaleString()} not applicable,
                  {entry.excludedCount > 0
                    ? ` ${entry.excludedCount.toLocaleString()} excluded,`
                    : ""} and {entry.pendingCount.toLocaleString()} still waiting for a project decision.
                </p>
                <div className="chip-row">
                  <span className="chip">{entry.service.familyCount.toLocaleString()} families</span>
                  <span className="chip">{entry.service.itemCount.toLocaleString()} total service findings</span>
                </div>
                <div className="button-row">
                  <Link href={`/services/${entry.service.slug}`} className="secondary-button">
                    Open service review
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="filter-card">
            <p className="eyebrow">No services selected yet</p>
            <h3>Add services first, then come back here to continue the review.</h3>
            <p className="microcopy">
              Once services are in scope, this section becomes the quickest way to jump back into the
              exact service pages where you should record project notes.
            </p>
          </section>
        )}
      </section>

      <section id="project-review-local-exports" className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Step 6</p>
            <h2 className="section-title">Download only the scoped services and their project notes.</h2>
            <p className="section-copy">
              CSV works well for spreadsheets and action tracking. Markdown and text are better for
              architecture notes, pre-sales handoff, and leadership summaries. These downloads work
              without sign-in because they are generated directly in your browser.
            </p>
          </div>
        </div>

        <div className="package-header-grid">
          <article className="filter-card package-card">
            <div className="filter-grid">
              <label className="package-option">
                <input
                  type="checkbox"
                  checked={includeNotApplicable}
                  onChange={(event) => setIncludeNotApplicable(event.target.checked)}
                />
                <span className="microcopy">Include `Not Applicable` findings with rationale</span>
              </label>
              <label className="package-option">
                <input
                  type="checkbox"
                  checked={includeNeedsReview}
                  onChange={(event) => setIncludeNeedsReview(event.target.checked)}
                />
                <span className="microcopy">Include `Needs Review` items in the handoff</span>
              </label>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                disabled={!activePackage || packageItems.length === 0}
                onClick={exportPackageCsv}
              >
                Download checklist CSV
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!activePackage || packageItems.length === 0}
                onClick={exportPackageMarkdown}
              >
                Download design Markdown
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!activePackage || packageItems.length === 0}
                onClick={exportPackageText}
              >
                Download plain text notes
              </button>
            </div>
          </article>

          <article className="leadership-brief package-card">
            <p className="eyebrow">Project review guidance</p>
            <h2 className="leadership-title">Notes, regional fit, and pricing now share the same project scope.</h2>
            <div className="leadership-list">
              <article>
                <strong>Target regions</strong>
                <p>Project review target regions now drive the default filter for service availability, restrictions, and pricing emphasis.</p>
              </article>
              <article>
                <strong>Pricing baseline</strong>
                <p>Use the commercial snapshot as the list-price baseline before moving into customer-specific usage and discount assumptions.</p>
              </article>
              <article>
                <strong>Commercial handoff</strong>
                <p>Export review notes separately from the pricing snapshot so each audience gets the level of detail they need.</p>
              </article>
            </div>
          </article>
        </div>
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Azure-backed save and reuse</p>
            <h2 className="section-title">Keep the review open to everyone, then sign in only when you want cloud-backed continuity.</h2>
            <p className="section-copy">
              This is the sign-in boundary for normal project-review users. It is separate from the
              future admin login. Use it to save the current review to Azure Storage, reload it in a
              later session, and generate an Azure-backed CSV for the current project scope.
            </p>
          </div>
        </div>

        {activePackage ? (
          <ReviewCloudControls
            items={packageItems}
            reviews={reviews}
            activePackage={activePackage}
            copilotContext={copilotContext}
            onRestoreCloudState={handleRestoreCloudState}
            continueHref="#project-review-local-exports"
          />
        ) : (
          <section className="filter-card cloud-sync-card">
            <p className="eyebrow">Step 7</p>
            <h3>Create a project review first, then sign in when you want to save it to Azure.</h3>
            <p className="microcopy">
              The Azure-backed save flow only applies after a project review exists. You can keep
              exploring the catalog and local exports before that point.
            </p>
          </section>
        )}
      </section>

      <section className="surface-panel editorial-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Commercial snapshot</p>
            <h2 className="section-title">Export pricing only for the services included in this project review.</h2>
            <p className="section-copy">
              This commercial view follows the selected services and target regions from the active
              project review, so pre-sales and solution teams can carry a focused retail pricing snapshot
              instead of the full Azure catalog.
            </p>
          </div>
        </div>

        <div className="package-header-grid">
          <article className="filter-card package-card">
            <div className="package-stats-grid">
              <article className="hero-metric-card">
                <span>Selected services</span>
                <strong>{selectedServices.length.toLocaleString()}</strong>
                <p>Only these services are queried for pricing.</p>
              </article>
              <article className="hero-metric-card">
                <span>Pricing mapped</span>
                <strong>{mappedPricingCount.toLocaleString()}</strong>
                <p>Selected services with a current retail pricing query match.</p>
              </article>
              <article className="hero-metric-card">
                <span>Starting retail row</span>
                <strong>
                  {startingRetailPrice.length > 0
                    ? formatRetailPrice(Math.min(...startingRetailPrice), pricingSnapshots[0]?.currencyCode ?? "USD")
                    : "Not published"}
                </strong>
                <p>Lowest retail row across the scoped services in this project review.</p>
              </article>
              <article className="hero-metric-card">
                <span>Target regions</span>
                <strong>{activePackage?.targetRegions.length.toLocaleString() ?? "0"}</strong>
                <p>These regions are used to highlight region-matched pricing rows.</p>
              </article>
            </div>

            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                disabled={!activePackage || !pricingReady || pricingLoading}
                onClick={exportPackagePricingCsv}
              >
                Download pricing CSV
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!activePackage || !pricingReady || pricingLoading}
                onClick={exportPackagePricingMarkdown}
              >
                Download pricing Markdown
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!activePackage || !pricingReady || pricingLoading}
                onClick={exportPackagePricingText}
              >
                Download pricing text
              </button>
            </div>
          </article>

          <article className="leadership-brief package-card">
            <p className="eyebrow">Commercial guidance</p>
            <h2 className="leadership-title">Use list pricing for the first draft, then model quantity and agreement changes.</h2>
            <div className="leadership-list">
              <article>
                <strong>Retail baseline</strong>
                <p>The project review snapshot uses Microsoft public retail pricing so the numbers are sourced and repeatable.</p>
              </article>
              <article>
                <strong>Target-region bias</strong>
                <p>Pricing queries stay global, but the project review highlights rows that line up with the target deployment regions.</p>
              </article>
              <article>
                <strong>Refine later</strong>
                <p>Use the Azure Pricing Calculator after sign-in to layer usage assumptions, discounts, and negotiated terms.</p>
              </article>
            </div>
          </article>
        </div>

        {pricingLoading ? (
          <section className="filter-card">
            <p className="eyebrow">Pricing load</p>
            <h3>Loading retail pricing for the selected services.</h3>
            <p className="microcopy">
              The project review is querying Microsoft’s Azure Retail Prices API for every service in scope.
            </p>
          </section>
        ) : null}

        {pricingError ? (
          <section className="filter-card">
            <p className="eyebrow">Pricing load</p>
            <h3>Pricing could not be loaded right now.</h3>
            <p className="microcopy">{pricingError}</p>
          </section>
        ) : null}

        {!pricingLoading && !pricingError && pricingSnapshots.length > 0 ? (
          <div className="service-selection-grid">
            {pricingSnapshots.map((pricing) => (
              <article className="future-card service-selection-card" key={pricing.serviceSlug}>
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Commercial fit</p>
                    <h3>{pricing.serviceName}</h3>
                  </div>
                  <span className="chip">{pricing.mapped ? "Pricing mapped" : "Pricing pending"}</span>
                </div>
                <p className="microcopy">
                  {pricing.mapped
                    ? `${pricing.skuCount.toLocaleString()} SKUs, ${pricing.billingLocationCount.toLocaleString()} billing locations, and ${pricing.targetRegionMatchCount.toLocaleString()} target-region matches are currently published.`
                    : "No retail pricing mapping is published for this service yet in the current project review workflow."}
                </p>
                <div className="chip-row">
                  <span className="chip">
                    Starts at {formatRetailPrice(pricing.startsAtRetailPrice, pricing.currencyCode)}
                  </span>
                  {pricing.query ? (
                    <span className="chip">
                      {pricing.query.field} {pricing.query.operator} {pricing.query.value}
                    </span>
                  ) : null}
                </div>
                {pricing.notes.length > 0 ? (
                  <p className="microcopy">{pricing.notes.join(" ")}</p>
                ) : null}
                <div className="button-row">
                  <Link href={`/services/${pricing.serviceSlug}`} className="muted-link">
                    Open service view
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
