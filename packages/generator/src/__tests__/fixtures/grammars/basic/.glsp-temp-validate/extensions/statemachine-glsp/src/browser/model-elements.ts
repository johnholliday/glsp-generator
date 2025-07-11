import { GNode, GEdge } from '@eclipse-glsp/client';
import { StateMachineModelElement } from '@statemachine/shared-model';

export class StateMachineNode extends GNode {
  modelElement?: StateMachineModelElement;
}

export class StateMachineEdge extends GEdge {
  modelElement?: StateMachineModelElement;
}