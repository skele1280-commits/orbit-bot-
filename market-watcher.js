#!/usr/bin/env node
// Proactive Market Watcher - Like a Human Analyst
// Monitors crypto 24/7, sends natural messages when something matters
// No commands needed - bot knows what you care about

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = path.join(os.homedir(), 'AgentWorkspace');

// Your portfolio (will be auto-loaded from config later)
const PORTFOLIO = {
  SOL: {
    amount: 100,        // 100 SOL
    entry: 200,         // Bought at $200
    invested: 20000,    // $20k total
    stopLoss: 160,      // -20% protection
    takeProfit: 220,    // First target
    moonTarget: 300     // Dream target
  }
};

// Price thresholds that matter
const ALERT_THRESHOLDS = {
  bigMove: 5,          // 5%+ move in 1 hour
  moderateMove: 3,     // 3%+ in 4 hours
  volatility: 10,      // 10%+ daily volatility
  volumeSpike: 2.5     // 2.5x normal volume
};

// Memory of last prices (to detect changes)
let lastPrices = {};
let lastAlerts = {};

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] ${msg}`);
}

// Fetch live price from CoinGecko (free, no API key)
function getPrice(coin) {
  return new Promise((resolve) => {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const coinData = json[coin.toLowerCase()];
          if (!coinData) {
            resolve(null);
            return;
          }
          
          resolve({
            price: coinData.usd,
            change24h: coinData.usd_24h_change || 0,
            volume24h: coinData.usd_24h_vol || 0
          });
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// Get BTC for market context
async function getMarketContext() {
  const btc = await getPrice('bitcoin');
  const eth = await getPrice('ethereum');
  
  return {
    btcChange: btc ? btc.change24h : 0,
    ethChange: eth ? eth.change24h : 0,
    marketSentiment: btc && btc.change24h > 2 ? 'bullish' : btc && btc.change24h < -2 ? 'bearish' : 'neutral'
  };
}

// Calculate your position
function analyzePosition(coin, currentPrice) {
  const pos = PORTFOLIO[coin];
  if (!pos) return null;
  
  const currentValue = pos.amount * currentPrice;
  const pnl = currentValue - pos.invested;
  const pnlPercent = (pnl / pos.invested) * 100;
  
  const toStopLoss = ((pos.stopLoss - currentPrice) / currentPrice) * 100;
  const toTakeProfit = ((pos.takeProfit - currentPrice) / currentPrice) * 100;
  
  return {
    currentValue,
    pnl,
    pnlPercent,
    toStopLoss,
    toTakeProfit,
    action: pnlPercent < -15 ? 'consider-stop' : 
            pnlPercent > 15 ? 'consider-profit' :
            currentPrice < pos.entry * 0.95 ? 'dca-opportunity' :
            'hold'
  };
}

// Generate natural message (like a human would say)
function generateMessage(coin, priceData, position, context) {
  const p = priceData.price;
  const change = priceData.change24h;
  const pos = position;
  
  const messages = [];
  
  // Big move detected
  if (Math.abs(change) > 5) {
    if (change > 0) {
      messages.push(`🚀 ${coin} pumping! Up ${change.toFixed(1)}% to $${p.toFixed(2)}`);
      if (pos.pnlPercent > 10) {
        messages.push(`Your position: +$${pos.pnl.toFixed(0)} (+${pos.pnlPercent.toFixed(1)}%). Consider taking 20% profit?`);
      }
    } else {
      messages.push(`⚠️ ${coin} dropped ${Math.abs(change).toFixed(1)}% to $${p.toFixed(2)}`);
      if (pos.action === 'dca-opportunity') {
        messages.push(`${pos.pnlPercent.toFixed(1)}% from entry. Strong support here - could add $2-3k to average down.`);
      }
    }
  }
  
  // Near key levels
  if (Math.abs(p - PORTFOLIO[coin].takeProfit) < 5) {
    messages.push(`📊 ${coin} approaching $${PORTFOLIO[coin].takeProfit} target. ${pos.toTakeProfit > 0 ? '+' : ''}${pos.toTakeProfit.toFixed(1)}% away.`);
  }
  
  if (Math.abs(p - PORTFOLIO[coin].stopLoss) < 10) {
    messages.push(`🛡️ ${coin} getting close to stop-loss at $${PORTFOLIO[coin].stopLoss}. Watch carefully.`);
  }
  
  // Market context
  if (context.marketSentiment === 'bearish' && change < -3) {
    messages.push(`BTC down ${context.btcChange.toFixed(1)}% - whole market bleeding. Not just ${coin}.`);
  }
  
  if (context.marketSentiment === 'bullish' && change > 3) {
    messages.push(`BTC leading the pump (+${context.btcChange.toFixed(1)}%). Rising tide lifting ${coin}.`);
  }
  
  // General advice
  if (pos.action === 'hold' && Math.abs(change) < 2) {
    // Don't spam on boring days
    return null;
  }
  
  if (pos.action === 'consider-profit') {
    messages.push(`💡 Tip: Secure some gains. Take 20-30% profit, let rest ride.`);
  }
  
  if (pos.action === 'consider-stop') {
    messages.push(`💡 Tip: Down ${Math.abs(pos.pnlPercent).toFixed(1)}%. Review stop-loss. Protect capital.`);
  }
  
  return messages.length ? messages.join('\n\n') : null;
}

// Check if we should send alert (avoid spam)
function shouldAlert(coin, type) {
  const key = `${coin}-${type}`;
  const lastAlert = lastAlerts[key];
  const now = Date.now();
  
  // Don't alert same thing within 4 hours
  if (lastAlert && now - lastAlert < 4 * 60 * 60 * 1000) {
    return false;
  }
  
  lastAlerts[key] = now;
  return true;
}

// Save alert to file (for Telegram sending later)
function saveAlert(message) {
  const alertFile = path.join(BASE, 'team/market-alerts.jsonl');
  const alert = {
    timestamp: new Date().toISOString(),
    message,
    sent: false
  };
  fs.appendFileSync(alertFile, JSON.stringify(alert) + '\n');
  log('Alert saved: ' + message.slice(0, 60) + '...');
}

// Main watch loop
async function watch() {
  log('🔍 Market Watcher started. Monitoring your positions...');
  
  const coinMap = { SOL: 'solana', BTC: 'bitcoin', ETH: 'ethereum' };
  
  for (const coin of Object.keys(PORTFOLIO)) {
    const coinId = coinMap[coin] || coin.toLowerCase();
    const priceData = await getPrice(coinId);
    if (!priceData) {
      log(`Could not fetch ${coin} price`);
      continue;
    }
    
    const context = await getMarketContext();
    const position = analyzePosition(coin, priceData.price);
    
    log(`${coin}: $${priceData.price.toFixed(2)} (${priceData.change24h > 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%) | P&L: ${position.pnlPercent > 0 ? '+' : ''}${position.pnlPercent.toFixed(2)}%`);
    
    // Generate natural message
    const message = generateMessage(coin, priceData, position, context);
    
    if (message && shouldAlert(coin, 'update')) {
      log('📱 Sending alert...');
      saveAlert(message);
      console.log('\n' + '='.repeat(60));
      console.log(message);
      console.log('='.repeat(60) + '\n');
    }
    
    lastPrices[coin] = priceData.price;
  }
}

// Run once, then set interval
watch().then(() => {
  log('Initial check complete. Will check every 15 minutes.');
  log('Press Ctrl+C to stop.\n');
  
  // Check every 15 minutes
  setInterval(watch, 15 * 60 * 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Market Watcher stopped.');
  process.exit(0);
});
