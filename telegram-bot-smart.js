#!/usr/bin/env node
// Smart Telegram Bot for @Skiclaw_bot
// Learns from Skele. Sends proactive market analysis.
// Not commands. Just useful intelligence.

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const BASE = path.join(os.homedir(), 'AgentWorkspace');
const PROFILE = JSON.parse(fs.readFileSync(path.join(BASE, 'team/skele-profile.json'), 'utf8'));

// Message queue for Telegram
const MESSAGES = [];

function addMessage(text, importance = 'normal') {
  MESSAGES.push({
    timestamp: new Date().toISOString(),
    text,
    importance,
    sent: false
  });
}

async function getSOLPrice() {
  return new Promise((resolve) => {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true';
    https.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}}, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            price: json.solana?.usd,
            change: json.solana?.usd_24h_change
          });
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// Morning brief for nocturnal worker
async function morningBrief() {
  console.log('📱 Generating morning brief for Skele...');
  
  const sol = await getSOLPrice();
  const plans = JSON.parse(fs.readFileSync(path.join(BASE, 'team/daily-plan.json'), 'utf8'));
  
  if (!sol) {
    addMessage('Good morning! Market data offline. Check system.', 'normal');
    return;
  }
  
  const position = calculatePosition(sol.price);
  
  let brief = `🌅 MORNING - ${new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Yangon'})} MMT\n\n`;
  
  brief += `💰 SOL Update:\n`;
  brief += `Price: $${sol.price.toFixed(2)} (${sol.change > 0 ? '🟢' : '🔴'} ${sol.change.toFixed(2)}%)\n`;
  brief += `Your P&L: ${position.pnl > 0 ? '🟢 +' : '🔴 '}$${Math.abs(position.pnl).toFixed(0)} (${position.pnlPercent > 0 ? '+' : ''}${position.pnlPercent.toFixed(2)}%)\n\n`;
  
  brief += `🎯 Today's Focus:\n`;
  brief += `${plans.priorities[0].name} (${plans.priorities[0].progress}% → ${plans.priorities[0].target}%)\n\n`;
  
  brief += `⚡ Action:\n`;
  brief += `${plans.tasks[0].name}\n`;
  brief += `Impact: +${plans.tasks[0].estimatedImpact}% progress\n\n`;
  
  if (position.action === 'dca-opportunity') {
    brief += `💡 Market Tip: SOL at support. Consider averaging down.\n`;
  } else if (position.action === 'consider-profit') {
    brief += `💡 Market Tip: Secure some gains. Take 20% profit.\n`;
  }
  
  addMessage(brief, 'important');
  console.log(brief);
}

// Proactive market alerts
async function marketWatch() {
  console.log('🔍 Market watch cycle...');
  
  const sol = await getSOLPrice();
  if (!sol) return;
  
  const lastPrice = getLastPrice('SOL');
  const change = lastPrice ? ((sol.price - lastPrice) / lastPrice) * 100 : 0;
  
  if (Math.abs(change) > 5) {
    const action = change > 0 ? '🚀 PUMP' : '⚠️ DIP';
    const position = calculatePosition(sol.price);
    
    let msg = `${action}\nSOL moved ${Math.abs(change).toFixed(1)}% to $${sol.price.toFixed(2)}\n`;
    
    if (change > 0 && position.pnl > 2000) {
      msg += `\n💭 Consider taking 20% profit? Lock in gains.`;
    } else if (change < -5 && position.pnlPercent > -10) {
      msg += `\n💭 Support holding. Could DCA here if you want to average down.`;
    }
    
    addMessage(msg, 'high');
    console.log(msg);
  }
  
  saveLastPrice('SOL', sol.price);
}

// Generate opportunities for Skele's projects
async function opportunityScan() {
  console.log('🔎 Scanning for opportunities...');
  
  const profile = PROFILE.skele.goals.projects;
  
  // Revenue Automation is at 30% - lowest, needs focus
  const opportunities = [
    {
      project: 'Revenue Automation',
      idea: 'YouTube shorts from captions (your yt-caption.sh exists)',
      effort: 'Quick (2-3 hours)',
      impact: '+5% progress'
    },
    {
      project: 'Revenue Automation',
      idea: 'TikTok auto-posting (research API limits)',
      effort: 'Medium (6-8 hours)',
      impact: '+8% progress'
    },
    {
      project: 'Revenue Automation',
      idea: 'Telegram channel automation (you have bot)',
      effort: 'Quick (1-2 hours)',
      impact: '+3% progress'
    },
    {
      project: 'OpenClaw JARVIS',
      idea: 'Multi-agent discussion system (just built)',
      effort: 'Integration (4-6 hours)',
      impact: '+3% progress'
    }
  ];
  
  const quick = opportunities.filter(o => o.effort.includes('Quick'))[0];
  if (quick) {
    addMessage(`💡 Quick Win Opportunity:\n${quick.idea}\n${quick.effort} → ${quick.impact}`, 'high');
    console.log(quick);
  }
}

// Noct imal-optimized: save messages to file
function saveMessages() {
  const file = path.join(BASE, 'team/telegram-queue.jsonl');
  MESSAGES.forEach(msg => {
    fs.appendFileSync(file, JSON.stringify(msg) + '\n');
  });
  console.log(`Saved ${MESSAGES.length} messages to queue`);
}

// Helper functions
function calculatePosition(currentPrice) {
  const entry = 200;
  const amount = 100;
  const invested = 20000;
  
  const currentValue = amount * currentPrice;
  const pnl = currentValue - invested;
  const pnlPercent = (pnl / invested) * 100;
  
  return {
    currentValue,
    pnl,
    pnlPercent,
    action: pnlPercent < -10 ? 'consider-stop' :
            pnlPercent > 15 ? 'consider-profit' :
            currentPrice < entry * 0.95 ? 'dca-opportunity' :
            'hold'
  };
}

function getLastPrice(coin) {
  const file = path.join(BASE, 'team/last-prices.json');
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data[coin];
  } catch {
    return null;
  }
}

function saveLastPrice(coin, price) {
  const file = path.join(BASE, 'team/last-prices.json');
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {}
  data[coin] = price;
  fs.writeFileSync(file, JSON.stringify(data));
}

// Main bot loop
async function run() {
  console.log('\n📱 Smart Telegram Bot starting...\n');
  
  const hour = new Date().getHours();
  
  // Morning: Full brief (8am MMT)
  if (hour === 8) {
    await morningBrief();
  }
  
  // Continuous: Market watch
  await marketWatch();
  
  // Hourly: Opportunity scan
  if (hour % 4 === 0) {
    await opportunityScan();
  }
  
  // Save all messages to queue
  saveMessages();
  
  console.log(`\n💬 ${MESSAGES.length} messages ready for Telegram`);
  console.log('📝 Queue saved to team/telegram-queue.jsonl\n');
}

run();
