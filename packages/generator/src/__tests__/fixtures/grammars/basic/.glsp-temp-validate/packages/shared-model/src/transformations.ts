import type { StateMachineDiagramModel, StateMachineModelElement } from './model.js';

export class StateMachineModelTransformer {
  private nodeIdCounter = 0;
  private edgeIdCounter = 0;

  astToDiagram(ast: any): StateMachineDiagramModel {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Transform AST nodes to diagram nodes
    this.visitAstNode(ast, nodes, edges);

    return {
      id: 'root',
      nodes,
      edges
    };
  }

  diagramToAst(diagram: StateMachineDiagramModel): any {
    // Transform diagram back to AST
    const ast: any = {
      elements: []
    };

    diagram.nodes.forEach(node => {
      ast.elements.push(node.modelElement);
    });

    return ast;
  }

  private visitAstNode(node: any, nodes: any[], edges: any[]): void {
    if (!node) return;

    // Create diagram node for AST element
    if (node.name) {
      nodes.push({
        id: `node_${this.nodeIdCounter++}`,
        type: node.$type || 'default',
        position: { x: Math.random() * 500, y: Math.random() * 500 },
        size: { width: 150, height: 75 },
        modelElement: node
      });
    }

    // Visit child nodes
    Object.keys(node).forEach(key => {
      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach(child => this.visitAstNode(child, nodes, edges));
      } else if (typeof value === 'object' && value !== null && !key.startsWith('$')) {
        this.visitAstNode(value, nodes, edges);
      }
    });
  }
}