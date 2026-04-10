const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeTelemetryEvent,
  summarizeTelemetryEntities
} = require("../src/shared/review-telemetry");

test("normalizeTelemetryEvent validates the event contract and sanitizes properties", () => {
  const event = normalizeTelemetryEvent({
    name: "review_scope_change",
    category: "review-workspace",
    route: "review-package",
    reviewId: " review-1 ",
    sessionId: " session-1 ",
    properties: {
      action: "starter-bundle",
      addedCount: 4,
      enabled: true,
      ignored: undefined,
      nested: { nope: true }
    }
  });

  assert.equal(event.name, "review_scope_change");
  assert.equal(event.category, "review-workspace");
  assert.equal(event.route, "/review-package");
  assert.equal(event.reviewId, "review-1");
  assert.equal(event.sessionId, "session-1");
  assert.deepEqual(event.properties, {
    action: "starter-bundle",
    addedCount: "4",
    enabled: "true"
  });
});

test("summarizeTelemetryEntities rolls redesign telemetry into funnel metrics and breakdowns", () => {
  const summary = summarizeTelemetryEntities(
    [
      {
        partitionKey: "2026-04-09",
        rowKey: "1",
        occurredAt: "2026-04-09T08:00:00.000Z",
        name: "homepage_initialize_review",
        category: "homepage",
        route: "/",
        actor: "anonymous",
        propertiesJson: JSON.stringify({
          targetRegionCount: "3"
        })
      },
      {
        partitionKey: "2026-04-09",
        rowKey: "2",
        occurredAt: "2026-04-09T08:00:05.000Z",
        name: "review_create",
        category: "review-workspace",
        route: "/review-package",
        actor: "anonymous",
        reviewId: "review-1",
        propertiesJson: JSON.stringify({
          source: "homepage-initializer"
        })
      },
      {
        partitionKey: "2026-04-09",
        rowKey: "3",
        occurredAt: "2026-04-09T08:01:00.000Z",
        name: "review_scope_change",
        category: "review-workspace",
        route: "/review-package",
        actor: "anonymous",
        reviewId: "review-1",
        propertiesJson: JSON.stringify({
          action: "starter-bundle",
          addedCount: "4",
          selectedCount: "4"
        })
      },
      {
        partitionKey: "2026-04-09",
        rowKey: "4",
        occurredAt: "2026-04-09T08:02:00.000Z",
        name: "review_export_download",
        category: "review-workspace",
        route: "/review-package",
        actor: "anonymous",
        reviewId: "review-1",
        propertiesJson: JSON.stringify({
          artifactType: "leadership-markdown"
        })
      },
      {
        partitionKey: "2026-04-10",
        rowKey: "5",
        occurredAt: "2026-04-10T09:00:00.000Z",
        name: "review_cloud_action",
        category: "continuity",
        route: "/review-package",
        actor: "authenticated",
        reviewId: "review-1",
        propertiesJson: JSON.stringify({
          action: "restore-link"
        })
      },
      {
        partitionKey: "2026-04-10",
        rowKey: "6",
        occurredAt: "2026-04-10T09:01:00.000Z",
        name: "review_cloud_action",
        category: "continuity",
        route: "/review-package",
        actor: "authenticated",
        reviewId: "review-1",
        propertiesJson: JSON.stringify({
          action: "save"
        })
      },
      {
        partitionKey: "2026-04-10",
        rowKey: "7",
        occurredAt: "2026-04-10T09:03:00.000Z",
        name: "admin_prompt_submit",
        category: "admin",
        route: "/admin/copilot",
        actor: "admin",
        propertiesJson: JSON.stringify({
          origin: "suggested",
          succeeded: "true"
        })
      }
    ],
    {
      checkedAt: "2026-04-10T09:04:00.000Z",
      storageConfigured: true,
      windowDays: 14
    }
  );

  assert.equal(summary.totalEvents, 7);
  assert.deepEqual(
    summary.metrics.map((metric) => [metric.key, metric.count]),
    [
      ["reviewStarts", 1],
      ["reviewCreates", 1],
      ["servicesAdded", 4],
      ["exports", 1],
      ["cloudLoads", 1],
      ["cloudSaves", 1],
      ["adminPrompts", 1]
    ]
  );
  assert.deepEqual(summary.exportBreakdown, [
    {
      key: "leadership-markdown",
      label: "leadership-markdown",
      count: 1
    }
  ]);
  assert.deepEqual(
    summary.cloudActionBreakdown.map((entry) => [entry.key, entry.count]),
    [
      ["restore-link", 1],
      ["save", 1]
    ]
  );
  assert.equal(summary.dailyRollup.length, 2);
  assert.equal(summary.dailyRollup[0].reviewStarts, 1);
  assert.equal(summary.dailyRollup[0].servicesAdded, 4);
  assert.equal(summary.dailyRollup[1].cloudLoads, 1);
  assert.equal(summary.dailyRollup[1].adminPrompts, 1);
  assert.equal(summary.recentEvents[0].name, "admin_prompt_submit");
});
