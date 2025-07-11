import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { StateMachineDiagramModel } from '@statemachine/shared-model';
import { ModelPersistence } from './persistence/model-persistence.js';
import { ValidationEngine } from './validation/validation-engine.js';
import { logger } from './utils/logger.js';

export interface ModelChangeEvent {
  modelId: string;
  changeType: 'create' | 'update' | 'delete';
  changes: any;
  timestamp: number;
  userId?: string;
}

export class StateMachineModelHub extends EventEmitter {
  private models = new Map<string, StateMachineDiagramModel>();
  private modelVersions = new Map<string, number>();
  private persistence: ModelPersistence;
  private validation: ValidationEngine;
  private changeHistory = new Map<string, ModelChangeEvent[]>();

  constructor() {
    super();
    this.persistence = new ModelPersistence();
    this.validation = new ValidationEngine();
  }

  async initialize(): Promise<void> {
    await this.persistence.initialize();
    await this.loadPersistedModels();
    logger.info('Model hub initialized');
  }

  async close(): Promise<void> {
    await this.persistence.close();
    this.removeAllListeners();
    logger.info('Model hub closed');
  }

  // Model CRUD operations
  async createModel(model: Partial<StateMachineDiagramModel>, userId?: string): Promise<StateMachineDiagramModel> {
    const modelId = model.id || uuidv4();
    const fullModel: StateMachineDiagramModel = {
      id: modelId,
      nodes: model.nodes || [],
      edges: model.edges || []
    };

    // Validate model
    const validationResult = await this.validation.validateModel(fullModel);
    if (!validationResult.isValid) {
      throw new Error(`Model validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Store model
    this.models.set(modelId, fullModel);
    this.modelVersions.set(modelId, 1);

    // Persist
    await this.persistence.saveModel(fullModel);

    // Emit change event
    const changeEvent: ModelChangeEvent = {
      modelId,
      changeType: 'create',
      changes: fullModel,
      timestamp: Date.now(),
      userId
    };
    this.recordChange(changeEvent);
    this.emit('modelChanged', changeEvent);

    logger.info(`Model created: ${modelId}`);
    return fullModel;
  }

  async getModel(modelId: string): Promise<StateMachineDiagramModel | undefined> {
    return this.models.get(modelId);
  }

  async updateModel(modelId: string, updates: Partial<StateMachineDiagramModel>, userId?: string): Promise<StateMachineDiagramModel> {
    const existingModel = this.models.get(modelId);
    if (!existingModel) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const updatedModel: StateMachineDiagramModel = {
      ...existingModel,
      ...updates,
      id: modelId // Ensure ID doesn't change
    };

    // Validate model
    const validationResult = await this.validation.validateModel(updatedModel);
    if (!validationResult.isValid) {
      throw new Error(`Model validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Store model
    this.models.set(modelId, updatedModel);
    const currentVersion = this.modelVersions.get(modelId) || 1;
    this.modelVersions.set(modelId, currentVersion + 1);

    // Persist
    await this.persistence.saveModel(updatedModel);

    // Emit change event
    const changeEvent: ModelChangeEvent = {
      modelId,
      changeType: 'update',
      changes: updates,
      timestamp: Date.now(),
      userId
    };
    this.recordChange(changeEvent);
    this.emit('modelChanged', changeEvent);

    logger.info(`Model updated: ${modelId}`);
    return updatedModel;
  }

  async deleteModel(modelId: string, userId?: string): Promise<void> {
    const existingModel = this.models.get(modelId);
    if (!existingModel) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Remove from memory
    this.models.delete(modelId);
    this.modelVersions.delete(modelId);
    this.changeHistory.delete(modelId);

    // Remove from persistence
    await this.persistence.deleteModel(modelId);

    // Emit change event
    const changeEvent: ModelChangeEvent = {
      modelId,
      changeType: 'delete',
      changes: {},
      timestamp: Date.now(),
      userId
    };
    this.emit('modelChanged', changeEvent);

    logger.info(`Model deleted: ${modelId}`);
  }

  async listModels(): Promise<StateMachineDiagramModel[]> {
    return Array.from(this.models.values());
  }

  // Versioning and history
  getModelVersion(modelId: string): number {
    return this.modelVersions.get(modelId) || 0;
  }

  getModelHistory(modelId: string): ModelChangeEvent[] {
    return this.changeHistory.get(modelId) || [];
  }

  // Collaboration support
  getActiveModelIds(): string[] {
    return Array.from(this.models.keys());
  }

  // Private helpers
  private async loadPersistedModels(): Promise<void> {
    try {
      const models = await this.persistence.loadAllModels();
      for (const model of models) {
        this.models.set(model.id, model);
        this.modelVersions.set(model.id, 1);
      }
      logger.info(`Loaded ${models.length} persisted models`);
    } catch (error) {
      logger.error('Failed to load persisted models:', error);
    }
  }

  private recordChange(change: ModelChangeEvent): void {
    const history = this.changeHistory.get(change.modelId) || [];
    history.push(change);
    
    // Keep only last 100 changes per model
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.changeHistory.set(change.modelId, history);
  }
}