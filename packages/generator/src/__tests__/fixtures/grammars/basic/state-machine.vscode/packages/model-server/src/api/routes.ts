import { Router, Request, Response, NextFunction } from 'express';
import { StateMachineModelHub } from '../model-hub.js';
import { validateModelRequest } from '../middleware/validation-middleware.js';
import { logger } from '../utils/logger.js';

export function createApiRoutes(modelHub: StateMachineModelHub): Router {
  const router = Router();

  // GET /models - List all models
  router.get('/models', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const models = await modelHub.listModels();
      res.json(models);
    } catch (error) {
      next(error);
    }
  });

  // GET /models/:id - Get specific model
  router.get('/models/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const model = await modelHub.getModel(req.params.id);
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }
      res.json(model);
    } catch (error) {
      next(error);
    }
  });

  // POST /models - Create new model
  router.post('/models', validateModelRequest, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const model = await modelHub.createModel(req.body, userId);
      res.status(201).json(model);
    } catch (error) {
      next(error);
    }
  });

  // PUT /models/:id - Update model
  router.put('/models/:id', validateModelRequest, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const model = await modelHub.updateModel(req.params.id, req.body, userId);
      res.json(model);
    } catch (error) {
      next(error);
    }
  });

  // PATCH /models/:id - Partial update
  router.patch('/models/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const model = await modelHub.updateModel(req.params.id, req.body, userId);
      res.json(model);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /models/:id - Delete model
  router.delete('/models/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      await modelHub.deleteModel(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // GET /models/:id/history - Get model change history
  router.get('/models/:id/history', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = modelHub.getModelHistory(req.params.id);
      res.json(history);
    } catch (error) {
      next(error);
    }
  });

  // GET /models/:id/version - Get model version
  router.get('/models/:id/version', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const version = modelHub.getModelVersion(req.params.id);
      res.json({ version });
    } catch (error) {
      next(error);
    }
  });

  return router;
}