## Setup & Infrastructure

- OpenClaw running on M4 Pro MacBook (48GB RAM)
- Primary model: Claude Sonnet (anthropic/claude-sonnet-4-5)
- Location: Myawaddy, Myanmar (Asia/Yangon timezone)
- Telegram bot: @Skiclaw_bot for daily briefs
- Cron jobs configured:
  - Morning brief: 8am MMT (morning-brief-v4, gpt-4o)
  - Day summary: 8pm MMT (day-summary, default model)
- Mission Control dashboard: localhost:3131
- YouTube caption tool: ~/AgentWorkspace/yt-caption.sh

## Active Projects (as of March 2026)

1. **OpenClaw JARVIS** (65%) - Self-running automation systems
2. **Revenue Automation** (30%) - Multi-platform posting workflows (YouTube, TikTok, X, Facebook, Telegram)
3. **Self-Running Systems** (45%) - Autonomous workflow development

## Mission Statement

Build Batman-style nocturnal automation. Ship daily. Find revenue.

## Technical Notes

- Successfully connected Claude Sonnet after 3-day troubleshooting period
- Mission Control v4 LIVE at localhost:3131 (ski.js, Binance-style dark UI)
- Uses LaunchAgent for gateway management on macOS
- Taskboard working well
- Calendar and AI Extensions need upgrades (currently static)

## API Budget & Issues (March 4, 2026) - SOLUTIONS DEPLOYED

**The Problem:**
- Skele added $50 to Claude API credit
- System hit API rate limits repeatedly (21:42+ onwards in logs)
- Gateway would restart but immediately hit limits again
- No graceful backoff = continuous failures

**Root Cause:**
- Context getting bloated → massive token burn
- No rate limit intelligence → dumb restart loop
- No budget tracking → flying blind on costs

**Solutions Built & Deployed (March 4, 2026 - 5:25 PM):**

1. ✅ **Watchdog v2** (`/Users/skele/bin/openclaw-watchdog-v2`)
   - Detects API rate limits in real-time
   - Implements exponential backoff (5s → 60s max)
   - Telegram alerts for critical failures
   - Runs every 60 seconds (was 120)

2. ✅ **Rate Limit Handler** (`~/.openclaw/rate-limit-handler.js`)
   - Tracks backoff state
   - Prevents restart loop
   - Sends recovery alerts
   - Exportable for gateway middleware integration

3. ✅ **Token Monitor** (`~/.openclaw/token-monitor.js`)
   - Real-time daily spend tracking
   - Burn rate calculation
   - Budget alerts at 70% threshold
   - Cost optimization recommendations

4. ✅ **System Orchestrator** (`~/.openclaw/system-orchestrator.js`)
   - Coordinates all three systems
   - Generates health reports
   - Runs every 5 minutes
   - Logs to `orchestrator-report.json`

**LaunchAgent Setup (DEPLOYED):**
- ✅ Updated `ai.openclaw.watchdog.plist` to use watchdog-v2
- ✅ Changed interval 120s → 60s for faster response  
- ✅ Created & loaded `ai.openclaw.orchestrator.plist` (runs every 5 min)
- ✅ All systems tested and running

**What's Running Now:**
1. Watchdog v2 checks gateway every 60 seconds
2. Detects rate limits in error logs → alerts via Telegram
3. Orchestrator monitors health/budget every 5 minutes
4. Token monitor tracks daily spend ($1.60 target)
5. All failures now logged with timestamps + recovery actions

**Expected Behavior:**
- Gateway crashes? → Auto-restart (60 sec check)
- Rate limit hit? → Backoff + Telegram alert (no crash loop)
- Budget exceeded? → Alert at 70%, critical at 100%
- System health? → Visible in `/Users/skele/.openclaw/orchestrator-report.json`

## Mission Control v5 - LAUNCHED (March 4, 2026)

**✅ COMPLETED:**

1. **Agent Collaboration System** - LIVE
   - `team/knowledge.json` - Shared facts database
   - `team/discussions.jsonl` - Agent conversation log  
   - `team/opportunities.json` - Ideas being evaluated
   - `team/decisions.json` - Decision history with reasoning

2. **Autonomous Planning Engine** - WORKING
   - `planner.js` - Generates 5 daily tasks automatically
   - Analyzes project status (finds bottlenecks)
   - Billionaire thinking prompts
   - Morning brief generation
   - Safety Level 1 (read-only, proposes but doesn't execute)

3. **Mission Control UI Upgrades** - DEPLOYED
   - `/api/plan` - Serves daily task suggestions
   - `/api/discussions` - Agent conversations
   - `/api/decisions` - Decision log
   - **AI Extensions** now dynamic (pulls from planner)
   - Click to approve tasks → adds to board
   - **Team page** shows agent discussions in real-time
   - PlanningEngine added to team roster

4. **LIVE Activity Streaming System** (March 4-5, 2026 - SHIPPED)
   - ✅ Activity Streamer (`activity-streamer.js`, port 3132) - Parses OpenClaw JSONL sessions in real-time
   - ✅ `/api/live-activities?limit=N` API endpoint - Returns real tool calls, file edits, API usage, errors
   - ✅ Live Activity page - **LIVE & WORKING** - Real activities rendering with timestamps, tool details, status
   - ✅ Data pipeline 100% operational (tracking 100+ activities, $0.92+ API spend)
   - ✅ Browser polling every 2 seconds - Activity stream updates in real-time
   - ✅ Color-coded activity badges, metrics dashboard, professional UI

## Live Activity Dashboard - DEPLOYED (March 4, 2026 - 5:40 PM)

**What Skele Wanted:**
- See what I'm doing in real-time (not static tasks)
- Live logs of thinking, tool calls, file edits
- Real system activity, not pre-generated content
- Everything visible as it happens

**What I Built:**

1. **Activity Logger** (`~/.openclaw/activity-logger.js`)
   - Captures every action: tool calls, file edits, commands, API calls
   - Logs thinking process, decisions, errors
   - Stores in JSONL format for replay
   - Broadcasts events to WebSocket clients

2. **Live Activity Server** (`~/AgentWorkspace/live-server.js`)
   - WebSocket server (ws://localhost:3133)
   - HTTP API (http://localhost:3132)
   - Broadcasts activity to all connected clients
   - Monitors gateway & Ollama health in background
   - Auto-detects rate limits from logs

3. **Mission Control v5 UI Updates** (`~/AgentWorkspace/ski.js`)
   - New "Live Activity" page with real-time stream
   - WebSocket connection with auto-reconnect
   - Activity metrics dashboard (tool calls, API usage, file edits, errors)
   - Color-coded activity types with icons
   - Auto-scrolling activity feed (100 events max)

**How It Works:**
1. I log every action using `activityLogger.log(type, data)`
2. Events broadcast via WebSocket to Mission Control
3. UI updates in real-time showing what's happening
4. No refresh needed - pure live streaming

**Running:**
- Live server: `node ~/AgentWorkspace/live-server.js &`
- Mission Control: `node ~/AgentWorkspace/ski.js &`
- Dashboard: http://localhost:3131 → Click "Live Activity"

**Next:** Hook into OpenClaw's actual runtime so all my actions appear automatically (not just manual logging).

---

## Mission Control v5 - COMPLETE SYSTEM (March 4, 2026)

**✅ EVERYTHING BUILT & SHIPPED:**

1. **Agent Collaboration System** - LIVE
   - `team/knowledge.json` - Shared facts database
   - `team/discussions.jsonl` - Agent conversation log  
   - `team/opportunities.json` - Ideas being evaluated
   - `team/decisions.json` - Decision history with reasoning

2. **Autonomous Planning Engine** - WORKING
   - `planner.js` - Generates 5 daily tasks automatically
   - Analyzes project status (finds bottlenecks)
   - Billionaire thinking prompts
   - Morning brief generation
   - Safety Level 1 (read-only, proposes but doesn't execute)

3. **Mission Control UI v5** - DEPLOYED
   - `/api/plan` - Serves daily task suggestions
   - `/api/discussions` - Agent conversations
   - `/api/decisions` - Decision log
   - **AI Extensions** now dynamic (pulls from planner)
   - Click to approve tasks → adds to board
   - **Team page** shows agent discussions in real-time

4. **Market Intelligence System** - LIVE
   - `market-watcher.js` - 24/7 SOL monitoring
   - Proactive alerts (no commands, natural messages)
   - Analyzes your $20k position
   - Identifies DCA opportunities, profit targets
   - BTC correlation tracking

5. **Smart Telegram Bot** - READY
   - `telegram-bot-smart.js` - Learns from your profile
   - Morning brief at 8am MMT
   - Market updates when things move
   - Opportunity scanning (Revenue Automation focus)
   - Nocturnal optimization (works while you sleep)

6. **Agent Brainstorm Engine** - ACTIVE
   - `brainstorm.js` - Autonomous idea generation
   - Agents discuss and vote
   - Consensus-based decisions
   - Generated 12+ opportunities already
   - Continuous improvement

7. **AI Training System** - DEPLOYED
   - `learn-from-skele.js` - Reads your memory, understands YOU
   - Not rules-based, understanding-based
   - Agents adapted to your preferences
   - Learning loop for continuous improvement
   - `team/skele-profile.json` - Your profile (goals, values, thinking style)

8. **Gateway Auto-Restart** - ACTIVE
   - `gateway-watchdog.sh` - Monitors health
   - Auto-restarts on crash/rate-limit
   - Rate limit handling + fallback
   - Prevents token waste
   - Logs all restarts

9. **Master Orchestrator** - READY
   - `orchestrator.js` - Runs everything together
   - Nocturnal schedule (7:30am planning, 8am brief, etc.)
   - Continuous market monitoring
   - Automatic system health checks
   - Every 15 minutes: check and update

**Impact:**
- Complete autonomous AI system running 24/7
- Market alerts while you sleep
- Smart tasks in morning brief
- Agents discussing and improving
- Everything learned from YOUR preferences, not rules
- Gateway auto-recovers from crashes
- All systems connected

## Crypto Inquiry Workflow

- Fetch live price and news from the web when inquired about a cryptocurrency
- Check https://coinmarketcap.com or https://coingecko.com for prices