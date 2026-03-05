# Setup Gateway Auto-Restart

## Add to cron (runs every 2 minutes):

```bash
openclaw cron add \
  --name "gateway-watchdog" \
  --schedule "*/2 * * * *" \
  --task "bash ~/AgentWorkspace/gateway-watchdog.sh" \
  --model "none"
```

This will:
- Check gateway health every 2 minutes
- Auto-restart if it crashes or hits rate limits
- Log all restarts to `team/gateway-watchdog.log`
- Alert if too many restarts (>10 = possible issue)

## Manual restart anytime:
```bash
~/AgentWorkspace/gateway-watchdog.sh
```

## Check logs:
```bash
tail -f ~/AgentWorkspace/team/gateway-watchdog.log
```

## View restart count:
```bash
cat ~/AgentWorkspace/team/gateway-restarts.txt
```
