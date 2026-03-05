#!/usr/bin/env node

/**
 * ACTIVITY STREAMER v2 - Real-time OpenClaw activity feed
 * 
 * Watches session JSONL files for:
 * - Tool calls (exec, read, write, browser, etc.)
 * - File operations (edits, writes)
 * - API usage (costs, tokens)
 * - Errors and results
 * 
 * Broadcasts to WebSocket clients via live-server
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class ActivityStreamer extends EventEmitter {
  constructor() {
    super();
    this.lastProcessedLine = 0;
    this.sessionFile = null;
    this.fileHandle = null;
    this.buffer = '';
    this.watching = false;
    this.activityQueue = [];
    this.maxQueueSize = 200;
  }

  start(sessionJsonlPath) {
    if (!fs.existsSync(sessionJsonlPath)) {
      console.error(`[ActivityStreamer] File not found: ${sessionJsonlPath}`);
      return false;
    }

    this.sessionFile = sessionJsonlPath;
    this.watching = true;
    
    console.log(`[ActivityStreamer] Started watching: ${sessionJsonlPath}`);

    // Initial read
    this.readNewLines();

    // Watch for changes
    fs.watchFile(sessionJsonlPath, (curr, prev) => {
      if (curr.size > prev.size) {
        this.readNewLines();
      }
    });

    return true;
  }

  stop() {
    this.watching = false;
    if (this.sessionFile) {
      fs.unwatchFile(this.sessionFile);
    }
  }

  readNewLines() {
    try {
      const content = fs.readFileSync(this.sessionFile, 'utf8');
      const lines = content.split('\n');

      for (let i = this.lastProcessedLine; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const event = JSON.parse(line);
          this.processEvent(event);
        } catch (e) {
          // Skip parse errors
        }
      }

      this.lastProcessedLine = lines.length;
    } catch (e) {
      console.error(`[ActivityStreamer] Read error:`, e.message);
    }
  }

  processEvent(event) {
    if (event.type === 'message') {
      const msg = event.message;

      // Tool calls
      if (msg.content && Array.isArray(msg.content)) {
        for (const content of msg.content) {
          if (content.type === 'toolCall') {
            this.emitActivity({
              type: 'tool_call',
              tool: content.name,
              args: content.arguments,
              timestamp: event.timestamp,
              callId: content.id,
            });
          }
        }
      }

      // Tool results
      if (msg.role === 'toolResult') {
        const isError = msg.isError || false;
        const duration = msg.details?.durationMs || null;
        
        this.emitActivity({
          type: 'tool_result',
          tool: msg.toolName,
          status: isError ? 'error' : 'completed',
          duration,
          timestamp: event.timestamp,
          callId: msg.toolCallId,
        });

        // Track file operations
        if (msg.toolName === 'write' && !isError) {
          this.emitActivity({
            type: 'file_write',
            timestamp: event.timestamp,
            tool: msg.toolName,
          });
        }
        if (msg.toolName === 'edit' && !isError) {
          this.emitActivity({
            type: 'file_edit',
            timestamp: event.timestamp,
            tool: msg.toolName,
          });
        }
      }

      // API usage & costs
      if (msg.usage) {
        this.emitActivity({
          type: 'api_usage',
          model: msg.model,
          input: msg.usage.input,
          output: msg.usage.output,
          cost: msg.usage.cost?.total || 0,
          timestamp: event.timestamp,
        });
      }
    }
  }

  emitActivity(activity) {
    // Add to queue
    this.activityQueue.push(activity);
    if (this.activityQueue.length > this.maxQueueSize) {
      this.activityQueue.shift();
    }

    // Broadcast
    this.emit('activity', activity);
  }

  getRecent(limit = 50) {
    return this.activityQueue.slice(-limit).reverse();
  }
}

// WebSocket integration
const WebSocket = require('ws');

class LiveActivityServer {
  constructor(port = 3132) {
    this.port = port;
    this.clients = new Set();
    this.streamer = new ActivityStreamer();
    this.stats = {
      toolCalls: 0,
      fileOps: 0,
      apiCalls: 0,
      totalCost: 0,
      startTime: Date.now(),
    };
  }

  start(sessionJsonlPath) {
    const http = require('http');
    const express = require('express');
    const app = express();

    // Express endpoints
    app.get('/api/activities', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      res.json({
        activities: this.streamer.getRecent(limit),
        stats: this.getStats(),
        timestamp: new Date().toISOString(),
      });
    });

    app.get('/api/stats', (req, res) => {
      res.json(this.getStats());
    });

    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        clients: this.clients.size,
        activities: this.streamer.activityQueue.length,
      });
    });

    // HTTP server
    const server = http.createServer(app);

    // WebSocket
    const wss = new WebSocket.Server({ server });
    wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`[LiveActivityServer] Client connected (${this.clients.size} total)`);

      // Send recent activities
      try {
        const recentActivities = this.streamer.getRecent(50);
        ws.send(JSON.stringify({
          type: 'history',
          activities: recentActivities,
        }));
        console.log(`[LiveActivityServer] Sent ${recentActivities.length} activities to new client`);
      } catch (e) {
        console.error(`[LiveActivityServer] Error sending history:`, e.message);
      }

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[LiveActivityServer] Client disconnected (${this.clients.size} remain)`);
      });

      ws.on('error', (err) => {
        console.error(`[LiveActivityServer] WebSocket error:`, err.message);
      });
    });

    // Broadcast activities
    this.streamer.on('activity', (activity) => {
      const msg = JSON.stringify({
        type: 'activity',
        data: activity,
      });

      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      }

      // Update stats
      if (activity.type === 'tool_call') this.stats.toolCalls++;
      if (activity.type === 'file_write' || activity.type === 'file_edit') this.stats.fileOps++;
      if (activity.type === 'api_usage') {
        this.stats.apiCalls++;
        this.stats.totalCost += activity.cost || 0;
      }
    });

    // Start streamer
    this.streamer.start(sessionJsonlPath);

    // Start server
    server.listen(this.port, () => {
      console.log(`[LiveActivityServer] Listening on http://127.0.0.1:${this.port}`);
      console.log(`[LiveActivityServer] WebSocket: ws://127.0.0.1:${this.port}`);
    });

    return server;
  }

  getStats() {
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    return {
      ...this.stats,
      uptime,
      clients: this.clients.size,
      queueSize: this.streamer.activityQueue.length,
    };
  }
}

// Find the latest session JSONL
function findLatestSession() {
  const sessionsDir = path.join(process.env.HOME, '.openclaw/agents/main/sessions');
  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({
      name: f,
      path: path.join(sessionsDir, f),
      mtime: fs.statSync(path.join(sessionsDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files[0]?.path;
}

// Main
if (require.main === module) {
  const sessionFile = process.argv[2] || findLatestSession();
  
  if (!sessionFile) {
    console.error('No session file found');
    process.exit(1);
  }

  const server = new LiveActivityServer(3132);
  server.start(sessionFile);

  console.log(`[ActivityStreamer] Watching: ${sessionFile}`);
  console.log(`[ActivityStreamer] Ready for connections`);
}

module.exports = { ActivityStreamer, LiveActivityServer };
