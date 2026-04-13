$ErrorActionPreference='Stop'

Set-Location "$PSScriptRoot\.."

$principalObj = @{ identityProvider='github'; userId='6984484802ec4a24a37318954c03f54b'; userDetails='upendra25312'; userRoles=@('authenticated','admin') }
$principalJson = $principalObj | ConvertTo-Json -Compress
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($principalJson))
$baseHeaders = @{ 'x-ms-client-principal' = $b64; 'Accept'='application/json' }
$apiBase = 'https://jolly-sea-014792b10.6.azurestaticapps.net/api'

$reviewName = "e2e-architecture-review-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$createBody = @{ projectName = $reviewName; customerName = 'Contoso' } | ConvertTo-Json
$createResp = Invoke-WebRequest -Uri "$apiBase/arb/reviews" -Method POST -Headers (@{ 'x-ms-client-principal'=$b64; 'Accept'='application/json'; 'Content-Type'='application/json' }) -Body $createBody -TimeoutSec 120
$createJson = $createResp.Content | ConvertFrom-Json
$reviewId = $createJson.review.reviewId
if (-not $reviewId) { throw 'Review creation failed: no reviewId returned.' }

$samplePath = Join-Path (Get-Location) "output\playwright\e2e-arch-input-$reviewId.md"
$sampleDoc = @"
# Contoso Retail Platform Architecture

## Scope
- Public web application on Azure App Service
- Azure SQL Database backend
- Azure Front Door as global entry point
- Azure Monitor and Application Insights enabled

## Reliability
- Two regions planned (UK South, UK West)
- Active-passive failover for database

## Security
- Managed identity for app-to-database access
- Key Vault for secrets

## Operations
- CI/CD with deployment slots
- Centralized logging and alerts
"@
New-Item -ItemType Directory -Force -Path (Split-Path $samplePath) | Out-Null
Set-Content -Path $samplePath -Value $sampleDoc -Encoding UTF8

$fileObj = Get-Item $samplePath
$uploadResp = Invoke-WebRequest -Uri "$apiBase/arb/reviews/$reviewId/uploads" -Method POST -Headers $baseHeaders -Form @{ files = $fileObj } -TimeoutSec 180
$uploadJson = $uploadResp.Content | ConvertFrom-Json
$uploadedCount = @($uploadJson.files).Count
if ($uploadedCount -lt 1) { throw 'Upload failed: no files returned in upload response.' }

$extractResp = Invoke-WebRequest -Uri "$apiBase/arb/reviews/$reviewId/extraction" -Method POST -Headers $baseHeaders -TimeoutSec 180
$extractJson = $extractResp.Content | ConvertFrom-Json
$extractState = $extractJson.extraction.state

$runResp = Invoke-WebRequest -Uri "$apiBase/arb/reviews/$reviewId/run-agent-review" -Method POST -Headers $baseHeaders -TimeoutSec 300
$runJson = $runResp.Content | ConvertFrom-Json

$findingsResp = Invoke-WebRequest -Uri "$apiBase/arb/reviews/$reviewId/findings" -Method GET -Headers $baseHeaders -TimeoutSec 120
$findingsJson = $findingsResp.Content | ConvertFrom-Json
$scoreResp = Invoke-WebRequest -Uri "$apiBase/arb/reviews/$reviewId/scorecard" -Method GET -Headers $baseHeaders -TimeoutSec 120
$scoreJson = $scoreResp.Content | ConvertFrom-Json

$exportBody = @{ format='markdown'; includeFindings=$true; includeScorecard=$true; includeActions=$true } | ConvertTo-Json
$createExportResp = Invoke-WebRequest -Uri "$apiBase/arb/reviews/$reviewId/exports" -Method POST -Headers (@{ 'x-ms-client-principal'=$b64; 'Accept'='application/json'; 'Content-Type'='application/json' }) -Body $exportBody -TimeoutSec 180
$createExportJson = $createExportResp.Content | ConvertFrom-Json
$exportsResp = Invoke-WebRequest -Uri "$apiBase/arb/reviews/$reviewId/exports" -Method GET -Headers $baseHeaders -TimeoutSec 120
$exportsJson = $exportsResp.Content | ConvertFrom-Json

$exportId = $createExportJson.export.exportId
$downloadStatus = 'not-attempted'
if ($exportId) {
  $dlResp = Invoke-WebRequest -Uri "$apiBase/arb/reviews/$reviewId/exports/$exportId/download" -Method GET -Headers $baseHeaders -TimeoutSec 120
  $downloadStatus = [int]$dlResp.StatusCode
}

$findingsCount = @($findingsJson.findings).Count
$score = $scoreJson.scorecard.overallScore
$recommendation = $scoreJson.scorecard.recommendation
$exportCount = @($exportsJson.exports).Count
$firstFindingTitle = if ($findingsCount -gt 0) { $findingsJson.findings[0].title } else { $null }

[pscustomobject]@{
  reviewId = $reviewId
  createdStatus = [int]$createResp.StatusCode
  uploadedFiles = $uploadedCount
  extractionState = $extractState
  runAssessmentStatus = [int]$runResp.StatusCode
  findingsCount = $findingsCount
  firstFindingTitle = $firstFindingTitle
  scorecardScore = $score
  scorecardRecommendation = $recommendation
  createExportStatus = [int]$createExportResp.StatusCode
  exportsCount = $exportCount
  exportDownloadStatus = $downloadStatus
} | ConvertTo-Json -Depth 6
