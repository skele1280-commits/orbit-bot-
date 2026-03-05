#!/usr/bin/env node
// Master Orchestrator - Runs everything together
// Autonomous AI system for Skele
// Nocturnal optimization: works while he sleeps, briefs when he wakes

const fs = require('fs');
const path = require('path');
const os = require('os');
const {execSync} = require('child_process');

const BASE = path.join(os.homedir(), 'AgentWorkspace');

function log(msg) {
  const ts = new Date().toLocaleTimeString('en-US', {timeZone: 'Asia/Yangon'});
  console.log(`[${ts} MMT] ${msg}`);
}

function runScript(script, name) {
  try {
    log(`🚀 Running ${name}...`);
    execSync(`node ${BASE}/${script}`, {stdio: 'inherit'});
    log(`✅ ${name} complete`);
  } catch(e) {
    log(`⚠️ ${name} error: ${e.message.split('\n')[0]}`);
  }
}

// Get current time in MMT
function getMMT() {
  const mmt = new Date(new Date().toLocaleString('en-US', {timeZone: 'Asia/Yangon'}));
  return {
    hour: mmt.getHours(),
    minute: mmt.getMinutes(),
    time: mmt.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Yangon'})
  };
}

// Orchestration schedule
const SCHEDULE = {
  '730': { name: 'Morning Planning', script: 'planner.js', importance: 'high' },
  '8': { name: 'Morning Brief + Market Watch', script: 'telegram-bot-smart.js', importance: 'high' },
  '12': { name: 'Midday Opportunity Scan', script: 'brainstorm.js', importance: 'medium' },
  '16': { name: 'Afternoon Market Analysis', script: 'market-watcher.js', importance: 'medium' },
  '20': { name: 'Day Summary + Evening Plan', script: 'telegram-bot-smart.js', importance: 'high' }
};

// Check what should run now
function whatShouldRunNow() {
  const mmt = getMMT();
  const timeKey = `${String(mmt.hour).padStart(2, '0')}${String(Math.floor(mmt.minute / 10) * 10).padStart(2, '0')}`;
  
  // Also run every 15 min: gateway check + market watch
  return {
    continuous: ['gateway-watchdog.sh'],
    scheduled: SCHEDULE[timeKey] ? [SCHEDULE[timeKey].script] : []
  };
}

// Run orchestration
async function orchestrate() {
  log('='.repeat(60));
  log('🤖 AUTONOMOUS ORCHESTRATOR STARTING');
  log('='.repeat(60));
  
  const mmt = getMMT();
  log(`Current time: ${mmt.time} MMT`);
  
  // Load Skele's profile to understand what matters
  const profile = JSON.parse(fs.readFileSync(path.join(BASE, 'team/skele-profile.json'), 'utf8'));
  
  log(`\n📌 SKELE PROFILE LOADED:`);
  log(`  • Goals: Nocturnal automation, Revenue at 30%, Daily shipping`);
  log(`  • Capital: $20k SOL @ $200 entry`);
  log(`  • Timezone: ${profile.skele.timezone}`);
  log(`  • Work style: Autonomous, learns from memory, action-driven`);
  
  // Check what should run
  const {continuous, scheduled} = whatShouldRunNow();
  
  log(`\n⚡ RUNNING NOW:`);
  
  // Continuous tasks
  if (continuous.length) {
    log(`\nContinuous (every 15 min):`);
    continuous.forEach(script => {
      log(`  → ${script}`);
      try {
        execSync(`bash ${BASE}/${script}`, {stdio: 'inherit'});
      } catch(e) {
        log(`  ⚠️ Error: ${e.message.split('\n')[0]}`);
      }
    });
  }
  
  // Scheduled tasks
  if (scheduled.length) {
    log(`\nScheduled for this hour:`);
    scheduled.forEach(script => {
      runScript(script, script.replace('.js', ''));
    });
  }
  
  // System status
  log(`\n📊 SYSTEM STATUS:`);
  
  // Check Mission Control
  try {
    const status = execSync('curl -s http://localhost:3131/api/status | head -20', {encoding: 'utf8'});
    log(`  ✅ Mission Control running (localhost:3131)`);
  } catch {
    log(`  ⚠️ Mission Control needs restart`);
  }
  
  // Check gateway
  try {
    const status = execSync('curl -s http://localhost:8188/health', {encoding: 'utf8', stdio: 'pipe'});
    log(`  ✅ Gateway operational`);
  } catch {
    log(`  ⚠️ Gateway needs restart`);
    try {
      execSync('bash ~/AgentWorkspace/gateway-watchdog.sh', {stdio: 'inherit'});
    } catch {}
  }
  
  // Check pending messages
  try {
    const messages = fs.readFileSync(path.join(BASE, 'team/telegram-queue.jsonl'), 'utf8').split('\n').filter(l => l);
    log(`  📱 Telegram queue: ${messages.length} pending messages`);
  } catch {
    log(`  📱 Telegram queue: empty`);
  }
  
  log(`\n🎯 NEXT ACTIONS:`);
  const nextSchedule = Object.entries(SCHEDULE)
    .filter(([time]) => time > `${String(mmt.hour).padStart(2, '0')}${String(Math.floor(mmt.minute / 10) * 10).padStart(2, '0')}`)
    .slice(0, 2);
  
  if (nextSchedule.length) {
    nextSchedule.forEach(([time, info]) => {
      const hour = parseInt(time.slice(0, 2));
      const minute = parseInt(time.slice(2));
      log(`  → ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} MMT: ${info.name}`);
    });
  } else {
    log(`  → Tomorrow 7:30am: Morning Planning`);
  }
  
  // Log state
  const state = {
    timestamp: new Date().toISOString(),
    mmt: mmt.time,
    tasksRun: scheduled.length + continuous.length,
    nextRun: nextSchedule[0] ? nextSchedule[0][0] : '0730'
  };
  
  fs.appendFileSync(
    path.join(BASE, 'team/orchestrator.log'),
    JSON.stringify(state) + '\n'
  );
  
  log('\n' + '='.repeat(60));
  log('✅ ORCHESTRATION CYCLE COMPLETE');
  log('='.repeat(60) + '\n');
}

// Run now, then every 15 minutes
orchestrate().catch(err => {
  log(`ERROR: ${err.message}`);
  process.exit(1);
});

// Schedule next run in 15 minutes
setInterval(orchestrate, 15 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', () => {
  log('Shutting down orchestrator...');
  process.exit(0);
});
