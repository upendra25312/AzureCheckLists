const test = require("node:test");
const assert = require("node:assert/strict");

const { enrichPricingRow, resolveOfficialRegion } = require("../src/shared/pricing-posture");

const publicRegionMap = new Map([
  [
    "austriaeast",
    {
      regionName: "Austria East",
      geographyName: "Europe"
    }
  ],
  [
    "indonesiacentral",
    {
      regionName: "Indonesia Central",
      geographyName: "Asia Pacific"
    }
  ],
  [
    "eastus",
    {
      regionName: "East US",
      geographyName: "North America"
    }
  ]
]);

test("resolveOfficialRegion normalizes official Azure public region names", () => {
  const resolved = resolveOfficialRegion(
    {
      armRegionName: "austriaeast",
      location: "AT East",
      locationKind: "Region"
    },
    publicRegionMap
  );

  assert.equal(resolved.officialRegionName, "Austria East");
  assert.equal(resolved.displayRegionName, "Austria East");
});

test("app service f1 non-zero retail price is flagged for review", () => {
  const row = enrichPricingRow(
    {
      meterId: "1",
      meterName: "Shared Compute Hours",
      productName: "Azure App Service",
      skuName: "F1",
      armSkuName: "F1",
      armRegionName: "indonesiacentral",
      location: "ID Central",
      locationKind: "Region",
      effectiveStartDate: "2026-04-10",
      unitOfMeasure: "1 Hour",
      retailPrice: 0.01,
      unitPrice: 0.01,
      tierMinimumUnits: 0,
      currencyCode: "USD",
      type: "Consumption",
      isPrimaryMeterRegion: true
    },
    {
      service: "Azure App Service"
    },
    {
      field: "serviceName",
      operator: "eq",
      value: "Azure App Service",
      source: "manual"
    },
    publicRegionMap
  );

  assert.equal(row.priceType, "pricing-needs-review");
  assert.equal(row.productionSuitability, "free-tier");
  assert.ok(row.warnings.some((warning) => warning.includes("non-zero retail hourly price")));
});

test("api management developer is marked non-production", () => {
  const row = enrichPricingRow(
    {
      meterId: "2",
      meterName: "Developer Unit",
      productName: "API Management",
      skuName: "Developer",
      armSkuName: "Developer",
      armRegionName: "austriaeast",
      location: "AT East",
      locationKind: "Region",
      effectiveStartDate: "2026-04-10",
      unitOfMeasure: "1 Hour",
      retailPrice: 0.0658,
      unitPrice: 0.0658,
      tierMinimumUnits: 0,
      currencyCode: "USD",
      type: "Consumption",
      isPrimaryMeterRegion: true
    },
    {
      service: "API Management"
    },
    {
      field: "serviceName",
      operator: "eq",
      value: "API Management",
      source: "manual"
    },
    publicRegionMap
  );

  assert.equal(row.productionSuitability, "non-production");
  assert.ok(row.warnings.some((warning) => warning.includes("evaluation and development")));
  assert.ok(row.warnings.some((warning) => warning.includes("SLA")));
});

test("aks automatic is marked as a partial price component", () => {
  const row = enrichPricingRow(
    {
      meterId: "3",
      meterName: "Automatic Cluster Management",
      productName: "Azure Kubernetes Service",
      skuName: "Automatic",
      armSkuName: "Automatic",
      armRegionName: "eastus",
      location: "US East",
      locationKind: "Region",
      effectiveStartDate: "2026-04-10",
      unitOfMeasure: "1 Hour",
      retailPrice: 0.007312,
      unitPrice: 0.007312,
      tierMinimumUnits: 0,
      currencyCode: "USD",
      type: "Consumption",
      isPrimaryMeterRegion: true
    },
    {
      service: "Azure Kubernetes Service (AKS)"
    },
    {
      field: "serviceName",
      operator: "eq",
      value: "Azure Kubernetes Service",
      source: "serviceName"
    },
    publicRegionMap
  );

  assert.equal(row.priceType, "partial-price-component");
  assert.ok(row.warnings.some((warning) => warning.includes("not a full AKS cluster monthly cost")));
  assert.equal(row.displayRegionName, "East US");
});
