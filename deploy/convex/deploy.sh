#!/usr/bin/env bash
# deploy/convex/deploy.sh
# Deploys Convex self-hosted to Coolify programmatically via REST API + SSH.
# Usage: bash deploy/convex/deploy.sh

set -euo pipefail

COOLIFY_API="http://217.15.164.63:8000/api/v1"
COOLIFY_TOKEN="2|c48dxnCvPaJfagRJsevoWCw9HPGFvJEQBvAWzVcTffa8b64b"
PROJECT_UUID="aws48ksg80c4cgog8okcos84"
SERVER_UUID="xkkg488cokoc80wwkkg8c8ws"
ENV_NAME="production"
SSH_HOST="217.15.164.63"
SSH_PORT="122"
SSH_KEY="${HOME}/.ssh/coolify_key"
COMPOSE_FILE="$(dirname "$0")/docker-compose.yml"

# ── Step 1: Create service ────────────────────────────────────────────────────
echo "==> Creating Convex service in Coolify..."

COMPOSE_RAW=$(base64 < "$COMPOSE_FILE" | tr -d '\n')

RESPONSE=$(curl -sf -X POST "$COOLIFY_API/services" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"convex\",
    \"description\": \"Convex self-hosted backend + dashboard\",
    \"project_uuid\": \"$PROJECT_UUID\",
    \"environment_name\": \"$ENV_NAME\",
    \"server_uuid\": \"$SERVER_UUID\",
    \"instant_deploy\": true,
    \"docker_compose_raw\": \"$COMPOSE_RAW\"
  }")

SERVICE_UUID=$(echo "$RESPONSE" | jq -r '.uuid')

if [ -z "$SERVICE_UUID" ] || [ "$SERVICE_UUID" = "null" ]; then
  echo "ERROR: Failed to create service. Response:"
  echo "$RESPONSE" | jq .
  exit 1
fi

echo "Service UUID: $SERVICE_UUID"

# ── Step 2: Trigger start (instant_deploy is unreliable) ─────────────────────
echo "==> Triggering service start..."
curl -sf "$COOLIFY_API/services/$SERVICE_UUID/start" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" > /dev/null
echo "  Start request queued."

# ── Step 3: Poll Docker directly via SSH until backend is healthy ─────────────
echo "==> Waiting for backend container to become healthy (up to 5 min)..."

BACKEND_CONTAINER="backend-${SERVICE_UUID}"

for i in $(seq 1 30); do
  STATUS=$(ssh -p "$SSH_PORT" -i "$SSH_KEY" \
    -o StrictHostKeyChecking=no -o BatchMode=yes \
    "root@$SSH_HOST" \
    "docker inspect --format '{{.State.Health.Status}}' '$BACKEND_CONTAINER' 2>/dev/null || echo 'not_found'")

  echo "  [${i}/30] $BACKEND_CONTAINER: $STATUS"

  if [ "$STATUS" = "healthy" ]; then
    echo "  Backend is healthy."
    break
  fi

  if [ "$i" -eq 30 ]; then
    echo "ERROR: Backend did not become healthy within 5 minutes."
    ssh -p "$SSH_PORT" -i "$SSH_KEY" -o StrictHostKeyChecking=no -o BatchMode=yes \
      "root@$SSH_HOST" "docker logs --tail 50 '$BACKEND_CONTAINER' 2>&1" || true
    exit 1
  fi

  sleep 10
done

CONTAINER="$BACKEND_CONTAINER"
echo "Backend container: $CONTAINER"

# ── Step 4: Generate admin key ────────────────────────────────────────────────
echo "==> Generating admin key..."

ADMIN_KEY=$(ssh -p "$SSH_PORT" -i "$SSH_KEY" \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  "root@$SSH_HOST" \
  "docker exec $CONTAINER ./generate_admin_key.sh")

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Convex Deployment Complete                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Service UUID : $SERVICE_UUID"
echo "Container    : $CONTAINER"
echo ""
echo "=== ADMIN KEY (save this — shown only once) ==="
echo "$ADMIN_KEY"
echo ""
echo "Add to .env.production:"
echo "  CONVEX_SELF_HOSTED_ADMIN_KEY=$ADMIN_KEY"
echo ""
echo "URLs:"
echo "  Backend API : http://$SSH_HOST:38210"
echo "  Dashboard   : http://$SSH_HOST:36791"
echo ""
echo "Verify backend is reachable:"
echo "  curl http://$SSH_HOST:38210/version"
