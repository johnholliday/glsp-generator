import type { JSONSchema7 } from 'json-schema';

// JSON Schema for model validation
export const StateMachineModelSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://example.com/statemachine/model-schema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' }
            },
            required: ['x', 'y']
          },
          size: {
            type: 'object',
            properties: {
              width: { type: 'number' },
              height: { type: 'number' }
            },
            required: ['width', 'height']
          }
        },
        required: ['id', 'type', 'position', 'size']
      }
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          sourceId: { type: 'string' },
          targetId: { type: 'string' }
        },
        required: ['id', 'type', 'sourceId', 'targetId']
      }
    }
  },
  required: ['id', 'nodes', 'edges']
};