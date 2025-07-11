// Generated model types from StateMachine grammar

export interface Action {

}

export type StateMachineModelElement = Action;

// GLSP diagram model types
export interface StateMachineNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  modelElement: StateMachineModelElement;
}

export interface StateMachineEdge {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  routingPoints?: Array<{ x: number; y: number }>;
}

export interface StateMachineDiagramModel {
  id: string;
  nodes: StateMachineNode[];
  edges: StateMachineEdge[];
}