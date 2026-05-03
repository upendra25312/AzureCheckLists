# Observability Queries

Use these KQL snippets in Application Insights for the `azure-review-checklists-api` component.

## API Failures

```kusto
requests
| where timestamp > ago(24h)
| where success == false
| summarize failures=count() by name, resultCode
| order by failures desc
```

## Review Created

```kusto
requests
| where timestamp > ago(7d)
| where name has "arbCreateReview" or url has "/api/arb/reviews"
| summarize count() by bin(timestamp, 1d), resultCode
| order by timestamp desc
```

## Upload And Extraction Failures

```kusto
requests
| where timestamp > ago(7d)
| where name has_any ("arbUploadFiles", "arbStartExtraction", "arbGetExtractionStatus")
| summarize total=count(), failures=countif(success == false) by name, resultCode
| order by failures desc
```

## AI Review Duration

```kusto
requests
| where timestamp > ago(7d)
| where name has "arbRunAgentReview" or url has "/api/arb/run-agent-review"
| summarize p50=percentile(duration, 50), p95=percentile(duration, 95), failures=countif(success == false) by bin(timestamp, 1d)
| order by timestamp desc
```

## Export Generation

```kusto
requests
| where timestamp > ago(7d)
| where name has_any ("arbCreateExport", "arbDownloadExport")
| summarize total=count(), failures=countif(success == false), p95=percentile(duration, 95) by name
| order by failures desc, p95 desc
```

## Admin Access Failures

```kusto
requests
| where timestamp > ago(7d)
| where url has "/admin" or url has "/api/admin"
| where resultCode in ("401", "403")
| summarize denied=count() by name, resultCode, bin(timestamp, 1d)
| order by timestamp desc
```

## Suggested SLOs

- 99% of health checks return success over 24 hours.
- 95th percentile API duration below 2 seconds for non-AI calls.
- 95th percentile AI review completion below 180 seconds.
- 0 unhandled export-generation failures for completed reviews.
