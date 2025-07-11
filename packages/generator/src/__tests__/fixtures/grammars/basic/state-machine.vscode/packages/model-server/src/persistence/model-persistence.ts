import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { StateMachineDiagramModel } from '@statemachine/shared-model';
import { logger } from '../utils/logger.js';

export class ModelPersistence {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    const dataDir = process.env.DATA_DIR || './data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'statemachine_models.db');
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Failed to connect to database:', err);
          reject(err);
          return;
        }

        logger.info(`Connected to SQLite database: ${this.dbPath}`);
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async close(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
          reject(err);
        } else {
          logger.info('Database connection closed');
          resolve();
        }
      });
    });
  }

  async saveModel(model: StateMachineDiagramModel): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const serializedModel = JSON.stringify(model);
    const timestamp = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO models (id, data, created_at, updated_at) 
         VALUES (?, ?, COALESCE((SELECT created_at FROM models WHERE id = ?), ?), ?)`,
        [model.id, serializedModel, model.id, timestamp, timestamp],
        function(err) {
          if (err) {
            reject(err);
          } else {
            logger.debug(`Model saved: ${model.id}`);
            resolve();
          }
        }
      );
    });
  }

  async loadModel(modelId: string): Promise<StateMachineDiagramModel | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.get('SELECT data FROM models WHERE id = ?', [modelId], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          try {
            const model = JSON.parse(row.data) as StateMachineDiagramModel;
            resolve(model);
          } catch (error) {
            logger.error(`Failed to parse model data for ${modelId}:`, error);
            resolve(null);
          }
        }
      });
    });
  }

  async loadAllModels(): Promise<StateMachineDiagramModel[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.all('SELECT data FROM models ORDER BY updated_at DESC', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const models: StateMachineDiagramModel[] = [];
          
          for (const row of rows) {
            try {
              const model = JSON.parse(row.data) as StateMachineDiagramModel;
              models.push(model);
            } catch (error) {
              logger.error('Failed to parse model data:', error);
            }
          }

          resolve(models);
        }
      });
    });
  }

  async deleteModel(modelId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run('DELETE FROM models WHERE id = ?', [modelId], function(err) {
        if (err) {
          reject(err);
        } else {
          logger.debug(`Model deleted: ${modelId}`);
          resolve();
        }
      });
    });
  }

  async listModelIds(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.all('SELECT id FROM models ORDER BY updated_at DESC', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.id));
        }
      });
    });
  }

  async getModelMetadata(modelId: string): Promise<{ createdAt: string; updatedAt: string } | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.get('SELECT created_at, updated_at FROM models WHERE id = ?', [modelId], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            createdAt: row.created_at,
            updatedAt: row.updated_at
          });
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run(`
        CREATE TABLE IF NOT EXISTS models (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          this.db!.run(`
            CREATE INDEX IF NOT EXISTS idx_models_updated_at ON models(updated_at)
          `, (err) => {
            if (err) {
              reject(err);
            } else {
              logger.info('Database tables created/verified');
              resolve();
            }
          });
        }
      });
    });
  }
}