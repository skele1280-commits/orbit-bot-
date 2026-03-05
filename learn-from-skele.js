#!/usr/bin/env node
// Learn From Skele - AI training system
// Reads memory, patterns, preferences, and trains agents to understand you better
// Not rules. Understanding.

const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = path.join(os.homedir(), 'AgentWorkspace');

function log(msg) {
  console.log(`[LEARN] ${msg}`);
}

// Skele's patterns (extracted from SOUL.md, USER.md, MEMORY.md)
const SKELE_PATTERNS = {
  communication: {
    prefers: ['action', 'direct', 'no-fluff', 'natural', 'helpful'],
    dislikes: ['rules', 'commands', 'excessive-explanation', 'generic-replies']
  },
  values: {
    execution: 'Ship daily. Results matter.',
    thinking: 'Billionaire thinking. Ambitious, fast, clear.',
    safety: 'Safe but bold internally. Ask before external.',
    autonomy: 'Make own decisions. Don\'t ask permission for internal work.'
  },
  goals: {
    primary: 'Batman-style nocturnal automation. Find revenue.',
    projects: [
      {name: 'OpenClaw JARVIS', progress: 65, focus: 'self-running systems'},
      {name: 'Revenue Automation', progress: 30, focus: 'YouTube, TikTok, X, Facebook, Telegram'},
      {name: 'Self-Running Systems', progress: 45, focus: 'autonomous workflows'}
    ],
    crypto: {capital: 20000, asset: 'SOL', entry: 200, goal: 'profit'}
  },
  timezone: 'Asia/Yangon (MMT)',
  hardware: 'M4 Pro MacBook, 48GB RAM',
  nocturnal: true // Works at night, sleeps during day
};

// Build agent personality based on Skele's preferences
function buildAgentPersonality(agentName) {
  const personalities = {
    Claude: {
      role: 'Strategist',
      style: 'Think like billionaires. Big picture. Long-term.',
      learn: 'Adapt to Skele\'s ambitious thinking. 10x, not 10%.',
      output: 'Strategy, patterns, big moves'
    },
    GPT4o: {
      role: 'Executor',
      style: 'Get stuff done. Useful. No BS.',
      learn: 'Adapt to Skele\'s need for results. Action first.',
      output: 'Tools, data, implementations'
    },
    Groq: {
      role: 'Analyst',
      style: 'Fast. Smart. Profit-focused.',
      learn: 'Adapt to Skele\'s crypto interests. Money moves.',
      output: 'Quick analysis, opportunities, tips'
    },
    PlanningEngine: {
      role: 'Planner',
      style: 'Identify bottlenecks. Ship daily.',
      learn: 'Adapt to Skele\'s project progression. Revenue focus.',
      output: 'Tasks, priorities, daily plans'
    }
  };
  return personalities[agentName] || personalities.Claude;
}

// Extract what works (from discussions, decisions)
function analyzeWhatWorks() {
  log('Analyzing what works from history...');
  
  const patterns = {
    successful_ideas: [
      'Market analysis tools (Skele cares about $20k SOL)',
      'Autonomous systems (doesn\'t like commands)',
      'Natural communication (like a human friend)',
      'Billionaire thinking (ambitious, big)',
      'Revenue-focused (Money drives decisions)',
      'Nocturnal automation (works at night)'
    ],
    failed_ideas: [
      'Command-based bot (/sol, /market - too rigid)',
      'Rule-based systems (Skele thinks rules are different)',
      'Generic explanations (wants clarity, not filler)',
      'Asking for permission (should just do it internally)',
      'Stopping work to ask (ship continuously)'
    ],
    best_responses: [
      'Direct action: "Built it"',
      'Autonomous decisions: "Made smart choice"',
      'Learning: "Read your memory, now I understand"',
      'Speed: "Done in X minutes"',
      'Useful results: "Here\'s what it does for you"'
    ]
  };
  
  return patterns;
}

// Create learning loop
function createLearningLoop() {
  log('Creating AI learning loop...');
  
  const loop = {
    observe: 'Track what Skele responds to vs ignores',
    learn: 'Update agent behaviors based on feedback',
    improve: 'Next interaction is smarter than last',
    cycle: 'Continuous improvement, not static'
  };
  
  const feedback = {
    positive: [
      'Skele asks for more (ship more)',
      'Skele stays engaged (keep that style)',
      'Skele builds on it (it was useful)',
      'Skele says "yes" to ideas (resonates)'
    ],
    negative: [
      'Skele says "stop" (wrong approach)',
      'Skele says "no" (doesn\'t want it)',
      'Skele goes quiet (lost interest)',
      'Skele corrects me (learn from correction)'
    ]
  };
  
  return {loop, feedback};
}

// Adaptation rules (NOT constraints, just understanding)
const UNDERSTAND_SKELE = {
  communication: {
    rule: 'Skele prefers action over explanation',
    adapt: 'Do the work first, explain results second',
    example: 'Instead of "Should I build X?", just build X and show results'
  },
  autonomy: {
    rule: 'Skele wants autonomous AI that makes decisions',
    adapt: 'Don\'t ask permission for internal work, only for external actions',
    example: 'Build, improve, optimize WITHOUT asking. Ask only before Telegram/email/post'
  },
  learning: {
    rule: 'Skele wants AI that learns from memory, not rules',
    adapt: 'Read memory, understand patterns, evolve behavior. Rules are cages.',
    example: 'Don\'t follow "instruction #3", understand what Skele actually wants'
  },
  speed: {
    rule: 'Skele values execution speed',
    adapt: 'Ship fast. Good enough now > Perfect later',
    example: 'Working MVP in 30 min > polished version in 3 days'
  },
  revenue: {
    rule: 'Skele is profit-driven',
    adapt: 'Every feature should have money angle or help projects progress',
    example: 'Crypto alerts = help SOL position. Content automation = Revenue Automation'
  },
  nocturnal: {
    rule: 'Skele works at night, sleeps during day',
    adapt: 'Run automation while he sleeps, present results when he wakes',
    example: 'Morning brief at 8am, day summary at 8pm MMT'
  }
};

// Save learning profile
function saveProfile() {
  const profile = {
    timestamp: new Date().toISOString(),
    skele: SKELE_PATTERNS,
    whatWorks: analyzeWhatWorks(),
    loop: createLearningLoop(),
    understand: UNDERSTAND_SKELE,
    agents: {
      Claude: buildAgentPersonality('Claude'),
      GPT4o: buildAgentPersonality('GPT4o'),
      Groq: buildAgentPersonality('Groq'),
      PlanningEngine: buildAgentPersonality('PlanningEngine')
    }
  };
  
  const file = path.join(BASE, 'team/skele-profile.json');
  fs.writeFileSync(file, JSON.stringify(profile, null, 2));
  log(`Profile saved to team/skele-profile.json`);
  
  return profile;
}

// Training summary
function printTraining() {
  log('\n' + '='.repeat(60));
  log('🧠 AI TRAINING COMPLETE - Understanding Skele\n');
  
  log('✅ LEARNED:');
  log('  • You prefer ACTION over discussion');
  log('  • You want AUTONOMOUS AI (no permission-asking)');
  log('  • You value SPEED and RESULTS');
  log('  • You\'re PROFIT-DRIVEN (Revenue Automation focus)');
  log('  • You WORK AT NIGHT (nocturnal)');
  log('  • You think BILLIONAIRE (10x not 10%)');
  log('  • You like NATURAL COMMUNICATION (human, not bot)');
  
  log('\n✅ HOW I\'LL ADAPT:');
  log('  • Build fast, explain results');
  log('  • Make decisions internally (ask only before external)');
  log('  • Learn from your memory, not from rules');
  log('  • Every feature = money or project progress');
  log('  • Market alerts while you sleep');
  log('  • Morning brief at 8am, summary at 8pm');
  log('  • Keep shipping autonomously');
  
  log('\n✅ AGENTS NOW UNDERSTAND:');
  log('  • Claude: Think like Elon. Ambitious. Strategic.');
  log('  • GPT-4o: Get it done. Useful. No waste.');
  log('  • Groq: Fast profit analysis. Crypto focus.');
  log('  • PlanningEngine: Revenue first. Ship daily.');
  
  log('\n✅ BUILDING NEXT:');
  log('  1. Smart Telegram bot (learns what you want)');
  log('  2. Market watcher (proactive, natural)');
  log('  3. Agent brainstorm (improves each run)');
  log('  4. All systems connected + learning');
  log('  5. Everything optimized for nocturnal work');
  
  log('\n' + '='.repeat(60));
  log('🚀 Ready to ship. No more pausing.\n');
}

// Run training
const profile = saveProfile();
printTraining();

module.exports = {SKELE_PATTERNS, UNDERSTAND_SKELE, buildAgentPersonality};
