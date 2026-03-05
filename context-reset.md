# Context Reset - Save Tokens & Money

## Problem
Claude API costs add up fast when context gets bloated. Long conversations = high token usage = burning through your $50 credit quickly.

## Solution: Smart Context Reset

### When to Reset (Automatic)

**Reset triggers:**
1. **Topic switch detected** - "Let's talk about X instead"
2. **Task completed** - "Done with that, what's next?"
3. **Context >100k tokens** - Getting expensive
4. **New day** - Fresh start at 8am MMT
5. **Manual** - User says "reset" or "start fresh"

### What Gets Saved

**Keep (in memory files):**
- Important decisions
- Project progress
- Agent discussions
- Opportunities found

**Clear (from context):**
- Long conversation history
- Repeated explanations
- Debug logs
- Temporary stuff

### How It Works

When context reset happens:
1. Save key points to `memory/YYYY-MM-DD.md`
2. Update `MEMORY.md` with important stuff
3. Clear conversation history
4. Start fresh with just: USER.md, SOUL.md, today's memory

**Result:** Keep all knowledge, 90% less tokens used.

## Telegram Bot Context Management

For @Skiclaw_bot, implement:

```javascript
// Reset context every 20 messages or when topic changes
let messageCount = 0;
let lastTopic = '';

function shouldReset(message) {
  messageCount++;
  
  // Topic switch detection
  const topicKeywords = ['instead', 'different', 'new topic', 'let\'s talk about'];
  const hasTopicSwitch = topicKeywords.some(kw => message.toLowerCase().includes(kw));
  
  if (hasTopicSwitch) return true;
  if (messageCount > 20) return true;
  
  return false;
}

// Reset = summarize last 20 messages into 3-5 key points, start fresh
```

## Rate Limit Handling

When Claude API hits rate limit:

```javascript
{
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded"
  }
}
```

**Auto-recovery:**
1. Wait 60 seconds
2. Retry with exponential backoff
3. If still failing, fall back to GPT-4o or Groq
4. Log to team/rate-limits.log
5. Resume when rate limit clears

## Token Budget ($50 Credit)

**Claude Sonnet pricing:**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

**Your $50 budget:**
- ~15M input tokens OR
- ~3M output tokens

**Smart usage:**
- Average conversation: 10k tokens = ~$0.10
- Mission Control updates: 5k tokens = ~$0.05
- Morning planning: 20k tokens = ~$0.20
- **Daily budget: ~$1.60 (31 days)**

**To stay within budget:**
- Reset context every 20 messages
- Use GPT-4o for simple tasks
- Use Groq for fast/cheap responses
- Save Claude for important thinking
- Monitor usage in Mission Control

## Commands for You

**Check token usage:**
```bash
openclaw status
```

**Manual context reset:**
Just say: "reset" or "start fresh" or "new topic"

**Force gateway restart:**
```bash
~/AgentWorkspace/gateway-watchdog.sh
```

**View rate limit log:**
```bash
tail -f ~/AgentWorkspace/team/rate-limits.log
```

## Auto-Reset Schedule

**Daily:** 8am MMT - Fresh start with morning brief  
**Per-session:** After 20 messages or topic switch  
**Emergency:** When context >150k tokens

This keeps you under budget while staying useful.
