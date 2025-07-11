import { StateMachineModelHub } from '../model-hub';

describe('StateMachineModelHub', () => {
  let modelHub: StateMachineModelHub;

  beforeEach(async () => {
    modelHub = new StateMachineModelHub();
    await modelHub.initialize();
  });

  afterEach(async () => {
    await modelHub.close();
  });

  describe('createModel', () => {
    it('should create a model with generated ID', async () => {
      const modelData = {
        nodes: [],
        edges: []
      };

      const model = await modelHub.createModel(modelData);

      expect(model).toHaveProperty('id');
      expect(model.nodes).toEqual([]);
      expect(model.edges).toEqual([]);
    });

    it('should use provided ID', async () => {
      const modelData = {
        id: 'test-model',
        nodes: [],
        edges: []
      };

      const model = await modelHub.createModel(modelData);

      expect(model.id).toBe('test-model');
    });
  });

  describe('getModel', () => {
    it('should return undefined for non-existent model', async () => {
      const model = await modelHub.getModel('non-existent');
      expect(model).toBeUndefined();
    });

    it('should return model when it exists', async () => {
      const modelData = { nodes: [], edges: [] };
      const createdModel = await modelHub.createModel(modelData);
      
      const retrievedModel = await modelHub.getModel(createdModel.id);
      expect(retrievedModel).toEqual(createdModel);
    });
  });

  describe('updateModel', () => {
    it('should update existing model', async () => {
      const modelData = { nodes: [], edges: [] };
      const createdModel = await modelHub.createModel(modelData);
      
      const updates = {
        nodes: [{ 
          id: 'node1', 
          type: 'test', 
          position: { x: 0, y: 0 }, 
          size: { width: 100, height: 50 },
          modelElement: {}
        }]
      };
      
      const updatedModel = await modelHub.updateModel(createdModel.id, updates);
      
      expect(updatedModel.nodes).toHaveLength(1);
      expect(updatedModel.nodes[0].id).toBe('node1');
    });

    it('should throw error for non-existent model', async () => {
      await expect(
        modelHub.updateModel('non-existent', { nodes: [] })
      ).rejects.toThrow('Model not found');
    });
  });

  describe('deleteModel', () => {
    it('should delete existing model', async () => {
      const modelData = { nodes: [], edges: [] };
      const createdModel = await modelHub.createModel(modelData);
      
      await modelHub.deleteModel(createdModel.id);
      
      const retrievedModel = await modelHub.getModel(createdModel.id);
      expect(retrievedModel).toBeUndefined();
    });

    it('should throw error for non-existent model', async () => {
      await expect(
        modelHub.deleteModel('non-existent')
      ).rejects.toThrow('Model not found');
    });
  });
});