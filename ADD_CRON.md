# Add Morning Planning Cron Job

To enable automatic morning planning at 7:30am MMT, run:

```bash
openclaw cron add \
  --name "morning-planner" \
  --schedule "30 7 * * * @ Asia/Yangon" \
  --task "node ~/AgentWorkspace/planner.js && cat ~/AgentWorkspace/team/morning-brief.txt" \
  --model "default" \
  --notify-channel telegram
```

This will:
1. Run planner.js every morning at 7:30am MMT (Myanmar Time)
2. Generate daily plan with 5 high-leverage tasks
3. Send morning brief to Telegram (@Skiclaw_bot)
4. Update team discussions and knowledge base

**Manual Test:**
```bash
node ~/AgentWorkspace/planner.js
```

**View Brief:**
```bash
cat ~/AgentWorkspace/team/morning-brief.txt
```

**Safety:** Level 1 (read-only, no external actions)
