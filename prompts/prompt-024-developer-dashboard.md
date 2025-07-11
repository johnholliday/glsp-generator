# Prompt 024: Developer Dashboard

## Goal
Create a web-based developer dashboard that provides real-time insights into project status, build health, test coverage, and recent activities.

## Why
- Project status scattered across tools
- No central view of build health
- Test coverage not easily visible
- Recent changes hard to track
- Missing performance metrics
- No quick access to common tasks

## What
A lightweight web dashboard showing project health, metrics, recent activities, and quick actions for common developer tasks.

### Success Criteria
- [ ] Real-time project status display
- [ ] Build and test status indicators
- [ ] Code coverage visualization
- [ ] Recent commit activity
- [ ] Performance metrics graphs
- [ ] Quick action buttons
- [ ] Auto-refreshing data
- [ ] Mobile-responsive design

## Implementation Blueprint

### Phase 1: Dashboard Server

CREATE packages/generator/src/dashboard/server.ts:
```typescript
import express from 'express';
import { WebSocketServer } from 'ws';

export class DashboardServer {
  private app = express();
  private wss: WebSocketServer;
  
  async start(port = 3333) {
    // Serve static dashboard
    this.app.use(express.static('dashboard/dist'));
    
    // API endpoints
    this.app.get('/api/status', async (req, res) => {
      res.json(await this.getProjectStatus());
    });
    
    // WebSocket for real-time updates
    this.wss = new WebSocketServer({ port: port + 1 });
    
    this.wss.on('connection', (ws) => {
      this.setupRealtimeUpdates(ws);
    });
    
    this.app.listen(port);
    console.log(`Dashboard available at http://localhost:${port}`);
  }
}
```

### Phase 2: Dashboard UI

CREATE packages/generator/src/dashboard/index.html:
```html
<!DOCTYPE html>
<html>
<head>
  <title>GLSP Generator Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    .metric-card {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin: 10px;
    }
    .status-indicator {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }
    .status-success { background: #4caf50; }
    .status-error { background: #f44336; }
    .status-warning { background: #ff9800; }
  </style>
</head>
<body>
  <div id="dashboard">
    <h1>GLSP Generator Dashboard</h1>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Build Status</h3>
        <div id="build-status"></div>
      </div>
      
      <div class="metric-card">
        <h3>Test Coverage</h3>
        <canvas id="coverage-chart"></canvas>
      </div>
      
      <div class="metric-card">
        <h3>Recent Activity</h3>
        <div id="activity-feed"></div>
      </div>
    </div>
    
    <div class="quick-actions">
      <button onclick="runAction('build')">Build</button>
      <button onclick="runAction('test')">Test</button>
      <button onclick="runAction('doctor')">Doctor</button>
    </div>
  </div>
  
  <script>
    // WebSocket connection for real-time updates
    const ws = new WebSocket('ws://localhost:3334');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      updateDashboard(data);
    };
    
    function updateDashboard(data) {
      // Update UI with real-time data
    }
  </script>
</body>
</html>
```

### Phase 3: Data Collection

CREATE packages/generator/src/dashboard/collector.ts:
```typescript
export class MetricsCollector {
  async collectMetrics() {
    return {
      build: await this.getBuildStatus(),
      tests: await this.getTestStatus(),
      coverage: await this.getCoverageData(),
      commits: await this.getRecentCommits(),
      performance: await this.getPerformanceMetrics()
    };
  }
  
  private async getCoverageData() {
    const coverageFile = 'coverage/coverage-summary.json';
    if (existsSync(coverageFile)) {
      const data = JSON.parse(readFileSync(coverageFile, 'utf8'));
      return {
        lines: data.total.lines.pct,
        branches: data.total.branches.pct,
        functions: data.total.functions.pct,
        statements: data.total.statements.pct
      };
    }
    return null;
  }
}
```

### Integration

UPDATE package.json:
```json
{
  "scripts": {
    "dashboard": "node scripts/start-dashboard.js",
    "dashboard:build": "vite build packages/generator/src/dashboard"
  }
}
```

## Final Validation Checklist
- [ ] Dashboard starts with single command
- [ ] Real-time updates work via WebSocket
- [ ] All metrics display correctly
- [ ] Quick actions execute commands
- [ ] Mobile responsive design
- [ ] Auto-refresh without memory leaks
- [ ] Accessible at http://localhost:3333
- [ ] Works across all browsers