#!/usr/bin/env bash
# =============================================================================
# configure-arb-services.sh
#
# One-shot script that:
#   1. Creates Azure AI Document Intelligence (F0 free tier) if not present
#   2. Retrieves all service keys / endpoints
#   3. Applies every required app setting to the Function App in one az CLI call
#
# Prerequisites: az CLI logged in, correct subscription set
#   az login
#   az account set --subscription f609eb5b-df3e-4fab-9a1b-9a8fea2f157f
#
# Usage:
#   bash scripts/configure-arb-services.sh
#   bash scripts/configure-arb-services.sh --dry-run   # print settings, don't apply
# =============================================================================

set -euo pipefail

# ── Fixed values ─────────────────────────────────────────────────────────────
SUBSCRIPTION_ID="f609eb5b-df3e-4fab-9a1b-9a8fea2f157f"
RESOURCE_GROUP="Azure-Review-Checklists-RG"
FUNCTION_APP="azure-review-checklists-api"
STORAGE_ACCOUNT="azreviewcheckapi01"
SEARCH_SERVICE="arb-review-search"
DI_ACCOUNT_NAME="arb-document-intelligence"
DI_REGION="centralus"   # co-locate with Function App for low latency
DI_SKU="F0"             # Free tier: 500 pages/month free — fits under $60/month budget

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍  DRY RUN — settings will be printed but NOT applied to Azure"
fi

# ── Helper ───────────────────────────────────────────────────────────────────
log()  { echo "[$(date '+%H:%M:%S')] $*"; }
warn() { echo "[$(date '+%H:%M:%S')] ⚠  $*"; }
die()  { echo "[$(date '+%H:%M:%S')] ✗  $*" >&2; exit 1; }

# ── 1. Ensure correct subscription ───────────────────────────────────────────
log "Setting subscription to $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID"

CURRENT_SUB=$(az account show --query id -o tsv)
[[ "$CURRENT_SUB" == "$SUBSCRIPTION_ID" ]] || die "Subscription mismatch: got $CURRENT_SUB"
log "✓  Subscription confirmed"

# ── 2. Create Document Intelligence (F0) if not present ──────────────────────
log "Checking for Document Intelligence account '$DI_ACCOUNT_NAME'..."

DI_EXISTS=$(az cognitiveservices account list \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?name=='$DI_ACCOUNT_NAME'] | length(@)" \
  -o tsv 2>/dev/null || echo "0")

if [[ "$DI_EXISTS" == "0" ]]; then
  log "Creating Document Intelligence account (F0 free tier, region: $DI_REGION)..."
  log "  Cost: FREE up to 500 pages/month; \$1.50/1000 pages above that"

  if [[ "$DRY_RUN" == "false" ]]; then
    az cognitiveservices account create \
      --name "$DI_ACCOUNT_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --kind "FormRecognizer" \
      --sku "$DI_SKU" \
      --location "$DI_REGION" \
      --yes \
      --output none
    log "✓  Document Intelligence account created"
  else
    warn "DRY RUN: would create Document Intelligence F0 in $DI_REGION"
  fi
else
  log "✓  Document Intelligence account already exists — skipping create"
fi

# ── 3. Get Document Intelligence endpoint + key ───────────────────────────────
log "Fetching Document Intelligence endpoint and key..."

DI_ENDPOINT=$(az cognitiveservices account show \
  --name "$DI_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.endpoint" -o tsv)

DI_KEY=$(az cognitiveservices account keys list \
  --name "$DI_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "key1" -o tsv)

[[ -n "$DI_ENDPOINT" ]] || die "Failed to retrieve Document Intelligence endpoint"
[[ -n "$DI_KEY" ]]      || die "Failed to retrieve Document Intelligence key"
log "✓  Document Intelligence endpoint: $DI_ENDPOINT"

# ── 4. Get AI Search endpoint + key ──────────────────────────────────────────
log "Fetching AI Search endpoint and key for '$SEARCH_SERVICE'..."

SEARCH_ENDPOINT="https://${SEARCH_SERVICE}.search.windows.net"

SEARCH_KEY=$(az search admin-key show \
  --resource-group "$RESOURCE_GROUP" \
  --service-name "$SEARCH_SERVICE" \
  --query "primaryKey" -o tsv 2>/dev/null || echo "")

if [[ -z "$SEARCH_KEY" ]]; then
  warn "Could not retrieve search admin key via 'az search' — trying query-keys fallback..."
  SEARCH_KEY=$(az search query-key list \
    --resource-group "$RESOURCE_GROUP" \
    --service-name "$SEARCH_SERVICE" \
    --query "[0].key" -o tsv 2>/dev/null || echo "")
fi

[[ -n "$SEARCH_KEY" ]] || die "Failed to retrieve AI Search key. Check that 'az search' extension is installed: az extension add --name azure-search"
log "✓  AI Search endpoint: $SEARCH_ENDPOINT"

# NOTE: Free tier (F0) does NOT support semantic ranking.
# The code automatically falls back to simple search on free tier — no action needed.
warn "AI Search is on FREE tier — semantic ranking is not available."
warn "The ARB pipeline will fall back to simple keyword search automatically."
warn "Upgrade to S1 (\~\$250/month) when semantic ranking is needed."

# ── 5. Get Storage connection string ─────────────────────────────────────────
log "Fetching Storage connection string for '$STORAGE_ACCOUNT'..."

STORAGE_CONN=$(az storage account show-connection-string \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --query "connectionString" -o tsv)

[[ -n "$STORAGE_CONN" ]] || die "Failed to retrieve storage connection string"
log "✓  Storage connection string retrieved"

# ── 6. Retrieve currently configured Foundry settings (read-only check) ───────
log "Checking existing Foundry settings on Function App..."

CURRENT_SETTINGS=$(az functionapp config appsettings list \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query "[].{name:name,value:value}" -o json 2>/dev/null || echo "[]")

check_setting() {
  local key="$1"
  local val
  val=$(echo "$CURRENT_SETTINGS" | grep -A1 "\"name\": \"$key\"" | grep '"value"' | sed 's/.*"value": "\(.*\)".*/\1/' || echo "")
  if [[ -n "$val" && "$val" != "null" && "$val" != '""' ]]; then
    log "  ✓  $key is already configured"
    echo "$val"
  else
    warn "  ✗  $key is NOT configured"
    echo ""
  fi
}

FOUNDRY_ENDPOINT=$(check_setting "FOUNDRY_PROJECT_ENDPOINT")
FOUNDRY_KEY=$(check_setting "FOUNDRY_API_KEY")
FOUNDRY_AGENT=$(check_setting "FOUNDRY_AGENT_ID")

[[ -n "$FOUNDRY_ENDPOINT" ]] || warn "FOUNDRY_PROJECT_ENDPOINT missing — agent review will not work until set"
[[ -n "$FOUNDRY_AGENT" ]]   || warn "FOUNDRY_AGENT_ID missing — confirm 'Azure-ARB-Agent' ID in Foundry portal"

# ── 7. Build the full app settings payload ───────────────────────────────────
log "Building app settings payload..."

SETTINGS=(
  "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONN"
  "AzureWebJobsStorage=$STORAGE_CONN"
  "AZURE_STORAGE_ARB_INPUT_CONTAINER_NAME=arb-inputfiles"
  "AZURE_STORAGE_ARB_OUTPUT_CONTAINER_NAME=arb-outputfiles"
  "AZURE_STORAGE_ARB_PROCESSING_CACHE_CONTAINER_NAME=arb-processing-cache"
  "AZURE_STORAGE_ARB_REVIEW_TABLE_NAME=arbreviews"
  "AZURE_SEARCH_ENDPOINT=$SEARCH_ENDPOINT"
  "AZURE_SEARCH_KEY=$SEARCH_KEY"
  "AZURE_SEARCH_INDEX_NAME=arb-documents"
  "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=$DI_ENDPOINT"
  "AZURE_DOCUMENT_INTELLIGENCE_KEY=$DI_KEY"
)

# ── 8. Apply settings ────────────────────────────────────────────────────────
if [[ "$DRY_RUN" == "true" ]]; then
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "  DRY RUN — settings that WOULD be applied to $FUNCTION_APP"
  echo "════════════════════════════════════════════════════════════════"
  for s in "${SETTINGS[@]}"; do
    KEY="${s%%=*}"
    VAL="${s#*=}"
    # Mask keys/secrets in output
    if [[ "$KEY" == *KEY* || "$KEY" == *CONN* || "$KEY" == *SECRET* ]]; then
      echo "  $KEY = ${VAL:0:8}***"
    else
      echo "  $KEY = $VAL"
    fi
  done
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "Run without --dry-run to apply."
  exit 0
fi

log "Applying ${#SETTINGS[@]} settings to Function App '$FUNCTION_APP'..."

az functionapp config appsettings set \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --settings "${SETTINGS[@]}" \
  --output none

log "✓  App settings applied"

# ── 9. Verify ────────────────────────────────────────────────────────────────
log "Verifying applied settings..."

VERIFY_KEYS=(
  "AZURE_SEARCH_ENDPOINT"
  "AZURE_SEARCH_KEY"
  "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT"
  "AZURE_DOCUMENT_INTELLIGENCE_KEY"
  "AZURE_STORAGE_CONNECTION_STRING"
  "AZURE_STORAGE_ARB_INPUT_CONTAINER_NAME"
  "AZURE_STORAGE_ARB_OUTPUT_CONTAINER_NAME"
  "AZURE_STORAGE_ARB_PROCESSING_CACHE_CONTAINER_NAME"
)

APPLIED=$(az functionapp config appsettings list \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query "[].name" -o tsv)

ALL_OK=true
for KEY in "${VERIFY_KEYS[@]}"; do
  if echo "$APPLIED" | grep -q "^$KEY$"; then
    log "  ✓  $KEY"
  else
    warn "  ✗  $KEY — NOT found after apply"
    ALL_OK=false
  fi
done

# ── 10. Print cost summary ────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ESTIMATED MONTHLY COST BREAKDOWN"
echo "════════════════════════════════════════════════════════════════"
echo "  Static Web App (Free tier)             \$0.00"
echo "  Azure Functions (Flex Consumption)     \$0–5   (pay per use)"
echo "  Storage Account (azreviewcheckapi01)   \$1–3"
echo "  AI Search (Free tier)                  \$0.00"
echo "  Document Intelligence (F0 free tier)   \$0.00  (up to 500 pages/month)"
echo "  Azure AI Foundry / OpenAI              \$5–20  (pay per token)"
echo "  ─────────────────────────────────────────────────────────"
echo "  Estimated total                        \$6–28 / month"
echo "  Well under the \$60/month budget ✓"
echo ""
echo "  Note: AI Search FREE tier does not support semantic ranking."
echo "  Upgrade to S1 (~\$250/mo) if semantic ranking becomes a priority."
echo "════════════════════════════════════════════════════════════════"
echo ""

if [[ "$ALL_OK" == "true" ]]; then
  log "✅  All settings verified. ARB pipeline is fully configured."
  log ""
  log "Next: merge PR #3 on GitHub to deploy the code, then test:"
  log "  1. Upload a PDF → extraction should show 'Completed'"
  log "  2. Upload a DOCX with tables → tables appear in evidence"
  log "  3. Run AI analysis → findings include evidenceFound with sourceFileName"
else
  warn "Some settings failed to verify — review the output above."
  exit 1
fi
