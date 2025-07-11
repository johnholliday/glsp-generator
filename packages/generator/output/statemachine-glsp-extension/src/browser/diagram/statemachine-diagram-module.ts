import { ContainerModule } from 'inversify';
import { TYPES, configureModelElement, SGraphImpl, SNodeImpl, SEdgeImpl, SGraphView, PolylineEdgeView } from 'sprotty';
import { StatemachineViews } from './statemachine-views';

/**
 * Diagram module configuration for statemachine GLSP diagrams
 */
export const statemachineDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Configure model elements
    configureModelElement(context, 'graph', SGraphImpl, SGraphView);
    
    configureModelElement(context, 'statemachine', SNodeImpl, StatemachineViews.StateMachineView);
    configureModelElement(context, 'state', SNodeImpl, StatemachineViews.StateView);
    configureModelElement(context, 'transition', SNodeImpl, StatemachineViews.TransitionView);

    // Configure edges with default polyline view
    configureModelElement(context, 'edge', SEdgeImpl, PolylineEdgeView);
});