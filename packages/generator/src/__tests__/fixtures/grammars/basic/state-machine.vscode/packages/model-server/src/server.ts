import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { StateMachineModelHub } from './model-hub.js';
import { createApiRoutes } from './api/routes.js';
import { WebSocketHandler } from './websocket/websocket-handler.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';

const PORT = process.env.PORT || 8081;
const NODE_ENV = process.env.NODE_ENV || 'development';

class StateMachineModelServer {
  private app: express.Application;
  private server: any;
  private wss!: WebSocketServer;
  private modelHub: StateMachineModelHub;
  private wsHandler!: WebSocketHandler;

  constructor() {
    this.app = express();
    this.modelHub = new StateMachineModelHub();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: NODE_ENV === 'development' ? true : process.env.ALLOWED_ORIGINS?.split(','),
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: { error: 'Too many requests from this IP' },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // General middleware
    this.app.use(compression() as any);
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(requestLogger);

    // CORS preflight
    this.app.options('*', cors());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0'
      });
    });

    // API routes
    this.app.use('/api/v2', createApiRoutes(this.modelHub));

    // Error handling
    this.app.use(errorHandler);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Not Found' });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize model hub
      await this.modelHub.initialize();

      // Create HTTP server
      this.server = createServer(this.app);

      // Setup WebSocket server
      this.wss = new WebSocketServer({ server: this.server });
      this.wsHandler = new WebSocketHandler(this.modelHub);
      this.wsHandler.setup(this.wss);

      // Start server
      this.server.listen(PORT, () => {
        logger.info(`StateMachine Model Server running on port ${PORT}`);
        logger.info(`Environment: ${NODE_ENV}`);
        logger.info(`Health check: http://localhost:${PORT}/health`);
        logger.info(`API endpoint: http://localhost:${PORT}/api/v2`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down server...');
    
    if (this.wss) {
      this.wss.close();
    }
    
    if (this.server) {
      this.server.close();
    }
    
    await this.modelHub.close();
    logger.info('Server shutdown complete');
    process.exit(0);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new StateMachineModelServer();
  server.start().catch(error => {
    logger.error('Server startup failed:', error);
    process.exit(1);
  });
}

export { StateMachineModelServer };