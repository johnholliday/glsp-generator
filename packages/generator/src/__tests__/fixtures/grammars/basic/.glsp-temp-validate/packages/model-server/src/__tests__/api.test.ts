import request from 'supertest';
import express from 'express';
import { StateMachineModelHub } from '../model-hub';
import { createApiRoutes } from '../api/routes';

describe('API Routes', () => {
  let app: express.Application;
  let modelHub: StateMachineModelHub;

  beforeEach(async () => {
    modelHub = new StateMachineModelHub();
    await modelHub.initialize();
    
    app = express();
    app.use(express.json());
    app.use('/api/v2', createApiRoutes(modelHub));
  });

  afterEach(async () => {
    await modelHub.close();
  });

  describe('GET /api/v2/models', () => {
    it('should return empty array when no models exist', async () => {
      const response = await request(app)
        .get('/api/v2/models')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/v2/models', () => {
    it('should create a new model', async () => {
      const modelData = {
        nodes: [],
        edges: []
      };

      const response = await request(app)
        .post('/api/v2/models')
        .send(modelData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nodes).toEqual([]);
      expect(response.body.edges).toEqual([]);
    });

    it('should validate model data', async () => {
      const invalidModelData = {
        nodes: 'invalid'
      };

      await request(app)
        .post('/api/v2/models')
        .send(invalidModelData)
        .expect(400);
    });
  });

  describe('GET /api/v2/models/:id', () => {
    it('should return 404 for non-existent model', async () => {
      await request(app)
        .get('/api/v2/models/non-existent')
        .expect(404);
    });

    it('should return model when it exists', async () => {
      const modelData = { nodes: [], edges: [] };
      const createResponse = await request(app)
        .post('/api/v2/models')
        .send(modelData)
        .expect(201);

      const modelId = createResponse.body.id;

      const getResponse = await request(app)
        .get(`/api/v2/models/${modelId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(modelId);
    });
  });
});