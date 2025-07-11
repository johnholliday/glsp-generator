# Prompt 026: Docker Development Experience

## Goal
Create a comprehensive Docker development environment with hot reloading, integrated monitoring, database persistence, and a complete development stack.

## Why
- Docker setup requires manual configuration
- No hot reloading for development
- Missing monitoring and debugging tools
- No persistent storage configuration
- Lack of multi-service orchestration
- No integrated development database

## What
A complete Docker development stack with docker-compose configurations, hot reloading, monitoring tools, and persistent storage for a seamless containerized development experience.

### Success Criteria
- [ ] docker-compose.dev.yml with full stack
- [ ] Hot reloading for all services
- [ ] Integrated monitoring (logs, metrics)
- [ ] Persistent volumes for data
- [ ] Health checks and auto-restart
- [ ] Debug ports exposed
- [ ] One-command startup
- [ ] Cross-platform compatibility

## Implementation Blueprint

### Phase 1: Development Docker Compose

CREATE docker-compose.dev.yml:
```yaml
version: '3.8'

services:
  # GLSP Generator API
  glspgen-api:
    build:
      context: .
      dockerfile: packages/generator/Dockerfile
      target: development
    container_name: glspgen-api-dev
    ports:
      - "51620:51620"
      - "9229:9229"  # Node.js debug port
    environment:
      - NODE_ENV=development
      - DEBUG=glsp:*
      - FORCE_COLOR=1
    volumes:
      - ./packages/generator/src:/app/src:delegated
      - ./packages/generator/templates:/app/templates:delegated
      - node_modules:/app/node_modules
    command: yarn dev:debug
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:51620/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis for caching
  redis:
    image: redis:7-alpine
    container_name: glspgen-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # PostgreSQL for metadata
  postgres:
    image: postgres:15-alpine
    container_name: glspgen-db
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=glsp_dev
      - POSTGRES_USER=glsp
      - POSTGRES_PASSWORD=development
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/db/init.sql:/docker-entrypoint-initdb.d/init.sql

  # Monitoring stack
  prometheus:
    image: prom/prometheus:latest
    container_name: glspgen-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    container_name: glspgen-grafana
    ports:
      - "3333:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards

  # Log aggregation
  loki:
    image: grafana/loki:latest
    container_name: glspgen-loki
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki

volumes:
  node_modules:
  redis_data:
  postgres_data:
  prometheus_data:
  grafana_data:
  loki_data:

networks:
  default:
    name: glspgen-dev-network
```

### Phase 2: Hot Reload Configuration

CREATE packages/generator/Dockerfile.dev:
```dockerfile
FROM node:20-alpine AS development

WORKDIR /app

# Install development tools
RUN apk add --no-cache git curl

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY packages/generator/package.json ./packages/generator/

# Install dependencies
RUN yarn install --immutable

# Development entry point
COPY packages/generator/scripts/dev-entrypoint.sh /
RUN chmod +x /dev-entrypoint.sh

EXPOSE 51620 9229

ENTRYPOINT ["/dev-entrypoint.sh"]
CMD ["yarn", "dev:debug"]
```

### Phase 3: Monitoring Configuration

CREATE monitoring/prometheus.yml:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'glsp-api'
    static_configs:
      - targets: ['glspgen-api:51620']
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

CREATE monitoring/grafana/dashboards/glsp-dashboard.json:
```json
{
  "dashboard": {
    "title": "GLSP Generator Metrics",
    "panels": [
      {
        "title": "API Response Time",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_sum[5m])"
          }
        ]
      },
      {
        "title": "Grammar Parse Rate",
        "targets": [
          {
            "expr": "rate(grammar_parse_total[5m])"
          }
        ]
      }
    ]
  }
}
```

### Phase 4: Developer Scripts

CREATE scripts/docker-dev.sh:
```bash
#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🐳 Starting GLSP Generator Development Stack${NC}"

# Check Docker
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker first."
  exit 1
fi

# Build images
echo -e "${YELLOW}Building development images...${NC}"
docker-compose -f docker-compose.dev.yml build

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# Wait for health checks
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Show status
docker-compose -f docker-compose.dev.yml ps

echo -e "${GREEN}✅ Development stack is ready!${NC}"
echo ""
echo "Services available at:"
echo "  - API: http://localhost:51620"
echo "  - Debug: chrome://inspect (port 9229)"
echo "  - Redis: localhost:6379"
echo "  - PostgreSQL: localhost:5432"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3333 (admin/admin)"
echo ""
echo "Commands:"
echo "  - Logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "  - Stop: docker-compose -f docker-compose.dev.yml down"
echo "  - Reset: docker-compose -f docker-compose.dev.yml down -v"
```

### Integration

UPDATE package.json:
```json
{
  "scripts": {
    "docker:dev:up": "./scripts/docker-dev.sh",
    "docker:dev:down": "docker-compose -f docker-compose.dev.yml down",
    "docker:dev:logs": "docker-compose -f docker-compose.dev.yml logs -f",
    "docker:dev:reset": "docker-compose -f docker-compose.dev.yml down -v",
    "docker:dev:shell": "docker exec -it glspgen-api-dev sh"
  }
}
```

## Final Validation Checklist
- [ ] All services start with one command
- [ ] Hot reload works for code changes
- [ ] Debug ports accessible
- [ ] Monitoring dashboards show data
- [ ] Volumes persist across restarts
- [ ] Health checks keep services running
- [ ] Cross-platform scripts work
- [ ] Documentation explains all features