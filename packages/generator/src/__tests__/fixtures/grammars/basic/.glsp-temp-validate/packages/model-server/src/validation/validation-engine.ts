import { StateMachineDiagramModel } from '@statemachine/shared-model';
import { logger } from '../utils/logger.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ValidationEngine {
  async validateModel(model: StateMachineDiagramModel): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic structure validation
      this.validateBasicStructure(model, errors);
      
      // Node validation
      this.validateNodes(model, errors, warnings);
      
      // Edge validation
      this.validateEdges(model, errors, warnings);
      
      // Cross-references validation
      this.validateCrossReferences(model, errors, warnings);
      
      // Business rules validation
      this.validateBusinessRules(model, errors, warnings);

    } catch (error) {
      logger.error('Validation error:', error);
      errors.push(`Validation failed: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateBasicStructure(model: StateMachineDiagramModel, errors: string[]): void {
    if (!model.id) {
      errors.push('Model must have an ID');
    }

    if (!Array.isArray(model.nodes)) {
      errors.push('Model must have a nodes array');
    }

    if (!Array.isArray(model.edges)) {
      errors.push('Model must have an edges array');
    }
  }

  private validateNodes(model: StateMachineDiagramModel, errors: string[], warnings: string[]): void {
    const nodeIds = new Set<string>();

    model.nodes.forEach((node, index) => {
      if (!node.id) {
        errors.push(`Node at index ${index} must have an ID`);
        return;
      }

      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);

      if (!node.type) {
        errors.push(`Node ${node.id} must have a type`);
      }

      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        errors.push(`Node ${node.id} must have valid position coordinates`);
      }

      if (!node.size || typeof node.size.width !== 'number' || typeof node.size.height !== 'number') {
        errors.push(`Node ${node.id} must have valid size dimensions`);
      }

      if (node.size.width <= 0 || node.size.height <= 0) {
        warnings.push(`Node ${node.id} has zero or negative dimensions`);
      }
    });
  }

  private validateEdges(model: StateMachineDiagramModel, errors: string[], warnings: string[]): void {
    const edgeIds = new Set<string>();
    const nodeIds = new Set(model.nodes.map(n => n.id));

    model.edges.forEach((edge, index) => {
      if (!edge.id) {
        errors.push(`Edge at index ${index} must have an ID`);
        return;
      }

      if (edgeIds.has(edge.id)) {
        errors.push(`Duplicate edge ID: ${edge.id}`);
      }
      edgeIds.add(edge.id);

      if (!edge.type) {
        errors.push(`Edge ${edge.id} must have a type`);
      }

      if (!edge.sourceId) {
        errors.push(`Edge ${edge.id} must have a sourceId`);
      } else if (!nodeIds.has(edge.sourceId)) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.sourceId}`);
      }

      if (!edge.targetId) {
        errors.push(`Edge ${edge.id} must have a targetId`);
      } else if (!nodeIds.has(edge.targetId)) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.targetId}`);
      }

      if (edge.sourceId === edge.targetId) {
        warnings.push(`Edge ${edge.id} is a self-loop`);
      }
    });
  }

  private validateCrossReferences(model: StateMachineDiagramModel, errors: string[], warnings: string[]): void {
    // Validate that all cross-references point to existing elements
    const allIds = new Set([
      ...model.nodes.map(n => n.id),
      ...model.edges.map(e => e.id)
    ]);

    // Check for orphaned elements
    const connectedNodeIds = new Set<string>();
    model.edges.forEach(edge => {
      connectedNodeIds.add(edge.sourceId);
      connectedNodeIds.add(edge.targetId);
    });

    model.nodes.forEach(node => {
      if (!connectedNodeIds.has(node.id)) {
        warnings.push(`Node ${node.id} is not connected to any edges`);
      }
    });
  }

  private validateBusinessRules(model: StateMachineDiagramModel, errors: string[], warnings: string[]): void {
    // Add grammar-specific business rules here
    // This would be generated based on the Langium grammar constraints
    
    // Example: Check for required relationships
    const entityNodes = model.nodes.filter(n => n.type === 'Entity');
    const relationshipEdges = model.edges.filter(e => e.type === 'Relationship');
    
    if (entityNodes.length > 0 && relationshipEdges.length === 0) {
      warnings.push('Model has entities but no relationships defined');
    }

    // Example: Validate naming conventions
    model.nodes.forEach(node => {
      if (node.modelElement && 'name' in node.modelElement) {
        const name = (node.modelElement as any).name;
        if (typeof name === 'string' && !/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
          warnings.push(`Node ${node.id} name '${name}' does not follow naming conventions`);
        }
      }
    });
  }
}