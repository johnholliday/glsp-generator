import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { StateMachineModelHub, ModelChangeEvent } from '../model-hub.js';
import { logger } from '../utils/logger.js';

interface WebSocketClient {
  id: string;
  socket: WebSocket;
  userId?: string;
  subscribedModels: Set<string>;
}

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'modelUpdate';
  payload: any;
  requestId?: string;
}

export class WebSocketHandler {
  private clients = new Map<string, WebSocketClient>();
  private modelSubscriptions = new Map<string, Set<string>>();

  constructor(private modelHub: StateMachineModelHub) {
    // Listen to model changes
    this.modelHub.on('modelChanged', (event: ModelChangeEvent) => {
      this.broadcastModelChange(event);
    });
  }

  setup(wss: WebSocketServer): void {
    wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
      this.handleConnection(socket, request);
    });

    // Cleanup disconnected clients periodically
    setInterval(() => {
      this.cleanupClients();
    }, 30000);

    logger.info('WebSocket handler setup complete');
  }

  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    const clientId = uuidv4();
    const userId = this.extractUserId(request);

    const client: WebSocketClient = {
      id: clientId,
      socket,
      userId,
      subscribedModels: new Set()
    };

    this.clients.set(clientId, client);
    logger.info(`WebSocket client connected: ${clientId}`);

    // Setup message handling
    socket.on('message', (data: Buffer) => {
      this.handleMessage(client, data);
    });

    // Setup disconnect handling
    socket.on('close', () => {
      this.handleDisconnect(client);
    });

    socket.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnect(client);
    });

    // Send welcome message
    this.sendMessage(client, {
      type: 'connected',
      payload: {
        clientId,
        serverTime: Date.now(),
        availableModels: this.modelHub.getActiveModelIds()
      }
    });

    // Setup ping/pong
    this.setupHeartbeat(client);
  }

  private handleMessage(client: WebSocketClient, data: Buffer): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(client, message);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(client, message);
          break;
        case 'ping':
          this.handlePing(client, message);
          break;
        case 'modelUpdate':
          this.handleModelUpdate(client, message);
          break;
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
      this.sendError(client, 'Invalid message format');
    }
  }

  private handleSubscribe(client: WebSocketClient, message: WebSocketMessage): void {
    const modelId = message.payload?.modelId;
    if (!modelId) {
      this.sendError(client, 'Missing modelId in subscribe message');
      return;
    }

    // Add to client subscriptions
    client.subscribedModels.add(modelId);

    // Add to global subscriptions
    if (!this.modelSubscriptions.has(modelId)) {
      this.modelSubscriptions.set(modelId, new Set());
    }
    this.modelSubscriptions.get(modelId)!.add(client.id);

    this.sendMessage(client, {
      type: 'subscribed',
      payload: { modelId },
      requestId: message.requestId
    });

    logger.info(`Client ${client.id} subscribed to model ${modelId}`);
  }

  private handleUnsubscribe(client: WebSocketClient, message: WebSocketMessage): void {
    const modelId = message.payload?.modelId;
    if (!modelId) {
      this.sendError(client, 'Missing modelId in unsubscribe message');
      return;
    }

    // Remove from client subscriptions
    client.subscribedModels.delete(modelId);

    // Remove from global subscriptions
    const subscribers = this.modelSubscriptions.get(modelId);
    if (subscribers) {
      subscribers.delete(client.id);
      if (subscribers.size === 0) {
        this.modelSubscriptions.delete(modelId);
      }
    }

    this.sendMessage(client, {
      type: 'unsubscribed',
      payload: { modelId },
      requestId: message.requestId
    });

    logger.info(`Client ${client.id} unsubscribed from model ${modelId}`);
  }

  private handlePing(client: WebSocketClient, message: WebSocketMessage): void {
    this.sendMessage(client, {
      type: 'pong',
      payload: { timestamp: Date.now() },
      requestId: message.requestId
    });
  }

  private async handleModelUpdate(client: WebSocketClient, message: WebSocketMessage): Promise<void> {
    try {
      const { modelId, updates } = message.payload;
      if (!modelId || !updates) {
        this.sendError(client, 'Missing modelId or updates in modelUpdate message');
        return;
      }

      // Update model through model hub
      await this.modelHub.updateModel(modelId, updates, client.userId);

      this.sendMessage(client, {
        type: 'modelUpdateSuccess',
        payload: { modelId },
        requestId: message.requestId
      });
    } catch (error) {
      this.sendError(client, `Model update failed: ${(error as Error).message}`, message.requestId);
    }
  }

  private handleDisconnect(client: WebSocketClient): void {
    // Remove from all subscriptions
    client.subscribedModels.forEach(modelId => {
      const subscribers = this.modelSubscriptions.get(modelId);
      if (subscribers) {
        subscribers.delete(client.id);
        if (subscribers.size === 0) {
          this.modelSubscriptions.delete(modelId);
        }
      }
    });

    // Remove client
    this.clients.delete(client.id);
    logger.info(`WebSocket client disconnected: ${client.id}`);
  }

  private broadcastModelChange(event: ModelChangeEvent): void {
    const subscribers = this.modelSubscriptions.get(event.modelId);
    if (!subscribers) return;

    const message = {
      type: 'modelChanged',
      payload: event
    };

    subscribers.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.socket.readyState === WebSocket.OPEN) {
        this.sendMessage(client, message);
      }
    });

    logger.debug(`Broadcasted model change for ${event.modelId} to ${subscribers.size} clients`);
  }

  private sendMessage(client: WebSocketClient, message: any): void {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }

  private sendError(client: WebSocketClient, error: string, requestId?: string): void {
    this.sendMessage(client, {
      type: 'error',
      payload: { error },
      requestId
    });
  }

  private setupHeartbeat(client: WebSocketClient): void {
    const interval = setInterval(() => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.ping();
      } else {
        clearInterval(interval);
      }
    }, 30000);
  }

  private extractUserId(request: IncomingMessage): string | undefined {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    return url.searchParams.get('userId') || undefined;
  }

  private cleanupClients(): void {
    const disconnectedClients: string[] = [];
    
    this.clients.forEach((client, clientId) => {
      if (client.socket.readyState !== WebSocket.OPEN) {
        disconnectedClients.push(clientId);
      }
    });

    disconnectedClients.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client) {
        this.handleDisconnect(client);
      }
    });

    if (disconnectedClients.length > 0) {
      logger.info(`Cleaned up ${disconnectedClients.length} disconnected clients`);
    }
  }
}