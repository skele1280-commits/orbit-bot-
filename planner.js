#!/usr/bin/env node
// Morning Planning Engine - Autonomous Task Generator
// Runs daily at 7:30am MMT via cron
// Safety: Level 1 only (reads data, suggests tasks, no external actions)

const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = path.join(os.homedir(), 'AgentWorkspace');

// Load knowledge base
function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(BASE, file), 'utf8'));
  } catch(e) {
    return null;
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(path.join(BASE, file), JSON.stringify(data, null, 2));
}

function appendLog(file, line) {
  fs.appendFileSync(path.join(BASE, file), JSON.stringify(line) + '\n');
}

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
  appendLog('team/planner.log', {timestamp: ts, message: msg});
}

// Get current date in MMT
function getMMTDate() {
  const now = new Date();
  const mmt = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Yangon'}));
  return {
    date: mmt.toISOString().split('T')[0],
    time: mmt.toTimeString().split(' ')[0],
    day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][mmt.getDay()],
    hour: mmt.getHours()
  };
}

// Analyze project status
function analyzeProjects() {
  const knowledge = loadJSON('team/knowledge.json');
  const projects = [
    {id: 'p1', name: 'OpenClaw JARVIS', progress: 65, target: 75},
    {id: 'p2', name: 'Revenue Automation', progress: 30, target: 50},
    {id: 'p3', name: 'Self-Running Systems', progress: 45, target: 60}
  ];
  
  log('Analyzing project status...');
  
  const priorities = projects.map(p => {
    const gap = p.target - p.progress;
    const tasksNeeded = Math.ceil(gap / 5); // ~5% per task
    return {
      ...p,
      gap,
      tasksNeeded,
      priority: p.progress < 40 ? 'high' : p.progress < 60 ? 'medium' : 'low',
      urgency: gap > 20 ? 'urgent' : gap > 10 ? 'important' : 'maintenance'
    };
  }).sort((a, b) => b.gap - a.gap);
  
  log(`Priority: ${priorities[0].name} (${priorities[0].progress}% → ${priorities[0].target}%, needs ${priorities[0].tasksNeeded} tasks)`);
  
  return priorities;
}

// Generate task suggestions based on billionaire thinking
function generateTasks(priorities) {
  log('Generating task suggestions (billionaire mode)...');
  
  const tasks = [];
  const topProject = priorities[0];
  
  // High-leverage tasks for lowest-progress project
  const templates = {
    'Revenue Automation': [
      'Add crypto price alerts (BTC, ETH, SOL) with Telegram notifications',
      'Build YouTube auto-poster script (captions → shorts)',
      'Research TikTok API - can we auto-post programmatically?',
      'Set up X (Twitter) API for scheduled posts',
      'Create Facebook Graph API automation flow'
    ],
    'OpenClaw JARVIS': [
      'Integrate Google Calendar API for real schedule sync',
      'Add voice command support via Whisper API',
      'Build mobile dashboard (React Native or PWA)',
      'Set up agent health monitoring + alerts',
      'Create knowledge graph visualization'
    ],
    'Self-Running Systems': [
      'Build autonomous task router (analyze → assign → execute)',
      'Add feedback loop (outcomes → learning → improvement)',
      'Create system performance dashboard',
      'Set up auto-retry logic for failed jobs',
      'Implement resource usage optimizer'
    ]
  };
  
  const projectTasks = templates[topProject.name] || [];
  
  // Pick top 3-5 tasks
  for (let i = 0; i < Math.min(5, topProject.tasksNeeded); i++) {
    if (projectTasks[i]) {
      tasks.push({
        id: `task-${Date.now()}-${i}`,
        project: topProject.id,
        name: projectTasks[i],
        priority: i === 0 ? 'urgent' : i < 3 ? 'high' : 'medium',
        estimatedImpact: i === 0 ? 10 : 5, // % progress
        effort: 'medium',
        status: 'proposed',
        createdBy: 'PlanningEngine',
        createdAt: new Date().toISOString()
      });
    }
  }
  
  // Add 1-2 opportunistic tasks
  const opps = loadJSON('team/opportunities.json');
  if (opps && opps.opportunities) {
    const quick = opps.opportunities.filter(o => o.effort === 'low' && o.status === 'proposed')[0];
    if (quick) {
      tasks.push({
        id: `task-${Date.now()}-opp`,
        project: 'quick-win',
        name: quick.title,
        priority: 'medium',
        estimatedImpact: 3,
        effort: 'low',
        status: 'proposed',
        createdBy: 'PlanningEngine',
        createdAt: new Date().toISOString(),
        opportunityId: quick.id
      });
    }
  }
  
  log(`Generated ${tasks.length} task suggestions`);
  return tasks;
}

// Create discussion entry
function discuss(content, type = 'analysis', tags = []) {
  const entry = {
    id: `d${Date.now()}`,
    timestamp: new Date().toISOString(),
    agent: 'PlanningEngine',
    type,
    content,
    tags
  };
  appendLog('team/discussions.jsonl', entry);
  log(`Discussion: ${content.slice(0, 80)}...`);
}

// Main planning routine
async function plan() {
  const mmt = getMMTDate();
  log('='.repeat(60));
  log(`Morning Planning Engine v1.0 - ${mmt.date} ${mmt.time} MMT (${mmt.day})`);
  log('='.repeat(60));
  
  discuss(`Morning planning initiated for ${mmt.date} (${mmt.day})`, 'system', ['planning', 'morning']);
  
  // 1. Analyze projects
  const priorities = analyzeProjects();
  const topProject = priorities[0];
  
  discuss(
    `Project analysis: ${topProject.name} at ${topProject.progress}% is the bottleneck. Needs ${topProject.tasksNeeded} tasks to reach ${topProject.target}% milestone.`,
    'analysis',
    ['projects', 'priority']
  );
  
  // 2. Generate tasks
  const tasks = generateTasks(priorities);
  
  discuss(
    `Generated ${tasks.length} high-leverage tasks. Top priority: "${tasks[0].name}" (est. +${tasks[0].estimatedImpact}% progress)`,
    'proposal',
    ['tasks', 'billionaire-thinking']
  );
  
  // 3. Save proposals
  const proposals = {
    date: mmt.date,
    generatedAt: new Date().toISOString(),
    priorities,
    tasks,
    summary: `Focus: ${topProject.name}. ${tasks.length} tasks proposed. Ship one today for +${tasks[0].estimatedImpact}% progress.`
  };
  
  saveJSON('team/daily-plan.json', proposals);
  log(`Plan saved to team/daily-plan.json`);
  
  // 4. Log decision
  const decisions = loadJSON('team/decisions.json') || {decisions: []};
  decisions.decisions.push({
    id: `dec${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'autonomous',
    safety_level: 1,
    decision: `Generated morning plan: ${tasks.length} tasks for ${topProject.name}`,
    reasoning: `Lowest progress project (${topProject.progress}%) needs attention. Tasks selected for high leverage and quick wins.`,
    madeBy: 'PlanningEngine',
    approved: true,
    outcome: 'pending'
  });
  decisions.lastUpdated = new Date().toISOString();
  saveJSON('team/decisions.json', decisions);
  
  // 5. Create brief summary
  const brief = `
🌅 MORNING BRIEF - ${mmt.date} (${mmt.day})

📊 PROJECT STATUS:
${priorities.map(p => `  • ${p.name}: ${p.progress}% (${p.urgency})`).join('\n')}

🎯 TODAY'S FOCUS: ${topProject.name}
Target: ${topProject.progress}% → ${topProject.target}%

✅ PROPOSED TASKS (pick 1-2):
${tasks.slice(0, 3).map((t, i) => `  ${i+1}. ${t.name} (+${t.estimatedImpact}%)`).join('\n')}

💡 BILLIONAIRE THINKING:
"Ship one feature today. Small wins compound. Revenue Automation at 30% is the bottleneck - fix it first."

🚀 NEXT STEP: Pick highest-leverage task and ship it before sunset.
`.trim();
  
  fs.writeFileSync(path.join(BASE, 'team/morning-brief.txt'), brief);
  log('Morning brief generated');
  
  console.log('\n' + brief + '\n');
  
  discuss('Morning planning complete. Brief saved to team/morning-brief.txt', 'system', ['planning', 'complete']);
  
  log('='.repeat(60));
  log('Planning engine complete. Have a productive day! 🔥');
  log('='.repeat(60));
}

// Run
plan().catch(err => {
  log(`ERROR: ${err.message}`);
  console.error(err);
  process.exit(1);
});
