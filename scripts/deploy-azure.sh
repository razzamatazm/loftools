#!/usr/bin/env bash
# Deploy the site to its Azure Web App: stage the public files, zip them, zip-deploy.
# Ships the working tree as it is, so commit first if you want the deploy to match a commit.
# The web app shares the Linux App Service plan Operation Hot Task runs on (no extra cost).
# First run creates the web app; later runs only deploy. Needs `az login` on the LOF tenant.
set -euo pipefail

SUBSCRIPTION_ID="${AZ_SUBSCRIPTION_ID:-e37ad9ed-a389-4426-8fc5-e826719d3b00}"
RESOURCE_GROUP="${AZ_RESOURCE_GROUP:-rg-operation-hot-task-prod-lof}"
PLAN_NAME="${AZ_APP_SERVICE_PLAN:-asp-operation-hot-task-prod-lof}"
WEBAPP_NAME="${AZ_WEBAPP_NAME:-loftools}"
RUNTIME="NODE:24-lts"

cd "$(dirname "$0")/.."
if [ -n "$(git status --porcelain)" ]; then
  echo "Warning: uncommitted changes will be deployed." >&2
fi

az account set --subscription "$SUBSCRIPTION_ID"

if ! az webapp show -g "$RESOURCE_GROUP" -n "$WEBAPP_NAME" >/dev/null 2>&1; then
  echo "==> creating web app $WEBAPP_NAME"
  az webapp create -g "$RESOURCE_GROUP" -p "$PLAN_NAME" -n "$WEBAPP_NAME" \
    --runtime "$RUNTIME" --https-only true --output none
  # Nothing to build on the server: the package is plain files plus server.js.
  az webapp config appsettings set -g "$RESOURCE_GROUP" -n "$WEBAPP_NAME" --output none \
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false ENABLE_ORYX_BUILD=false
  az webapp config set -g "$RESOURCE_GROUP" -n "$WEBAPP_NAME" --output none \
    --startup-file "node server.js" --always-on true --ftps-state Disabled --min-tls-version 1.2
  # Config changes restart the SCM container; a deploy started right after gets killed.
  echo "==> waiting for config changes to settle (60s)"
  sleep 60
fi

# Everything staged here is public on the internet, and the repo also holds loan doc
# templates and internal notes, so add new files by name (same list as the Dockerfile).
STAGE_DIR="$(mktemp -d)"
DEPLOY_ZIP="$(mktemp -u).zip"
trap 'rm -rf "$STAGE_DIR" "$DEPLOY_ZIP"' EXIT
cp server.js index.html consumerdebt.html styles.css app.js loan-docs-data.js "$STAGE_DIR/"
mkdir -p "$STAGE_DIR/install" "$STAGE_DIR/userscripts"
cp install/index.html "$STAGE_DIR/install/"
cp userscripts/*.user.js "$STAGE_DIR/userscripts/"
(cd "$STAGE_DIR" && zip -r -q "$DEPLOY_ZIP" .)

echo "==> deploying"
az webapp deploy -g "$RESOURCE_GROUP" -n "$WEBAPP_NAME" \
  --src-path "$DEPLOY_ZIP" --type zip --clean true --output none

# az can report failure while the site is actually up; trust the HTTP check instead.
URL="https://${WEBAPP_NAME}.azurewebsites.net"
for _ in 1 2 3 4 5 6; do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "$URL/")" = "200" ]; then
    echo "live: $URL"
    exit 0
  fi
  sleep 10
done
echo "deployed, but $URL/ is not answering 200 yet" >&2
exit 1
