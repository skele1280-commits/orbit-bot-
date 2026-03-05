#!/bin/bash
# Gateway Watchdog - Auto-restart on crash or rate limits
# Runs every 2 minutes, checks health, restarts if needed

LOG_FILE=~/AgentWorkspace/team/gateway-watchdog.log
RESTART_COUNT_FILE=~/AgentWorkspace/team/gateway-restarts.txt

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_gateway() {
  # Try to hit health endpoint
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8188/health 2>/dev/null)
  
  if [ "$STATUS" = "200" ]; then
    return 0  # Gateway is healthy
  else
    return 1  # Gateway is down
  fi
}

get_restart_count() {
  if [ -f "$RESTART_COUNT_FILE" ]; then
    cat "$RESTART_COUNT_FILE"
  else
    echo "0"
  fi
}

increment_restart_count() {
  COUNT=$(get_restart_count)
  NEW_COUNT=$((COUNT + 1))
  echo "$NEW_COUNT" > "$RESTART_COUNT_FILE"
  echo "$NEW_COUNT"
}

restart_gateway() {
  log "🔄 Gateway down. Restarting..."
  
  # Stop any running instances
  pkill -f "openclaw.*gateway" 2>/dev/null || true
  sleep 2
  
  # Restart via LaunchAgent
  launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway 2>/dev/null || \
    openclaw gateway restart 2>/dev/null || \
    log "⚠️ Could not restart gateway automatically"
  
  sleep 5
  
  # Check if it's back
  if check_gateway; then
    COUNT=$(increment_restart_count)
    log "✅ Gateway restarted successfully (restart #$COUNT)"
    
    # Alert if too many restarts (possible issue)
    if [ $COUNT -gt 10 ]; then
      log "⚠️ WARNING: Gateway has restarted $COUNT times. Check for issues."
    fi
    
    return 0
  else
    log "❌ Gateway restart failed. Manual intervention needed."
    return 1
  fi
}

# Main watchdog loop
log "🐕 Gateway Watchdog starting..."

if check_gateway; then
  log "✅ Gateway is healthy"
  exit 0
else
  log "❌ Gateway is down or rate-limited"
  restart_gateway
  exit $?
fi
