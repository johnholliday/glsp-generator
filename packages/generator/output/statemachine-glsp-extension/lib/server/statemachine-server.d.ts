import { DiagramConfiguration, ServerModule, GModelElementConstructor, ShapeTypeHint, EdgeTypeHint } from '@eclipse-glsp/server';
/**
 * Simple diagram configuration for statemachine
 */
export declare class StatemachineDiagramConfiguration implements DiagramConfiguration {
    readonly diagramType = "statemachine-diagram";
    readonly layoutKind: any;
    readonly needsClientLayout = true;
    readonly animatedUpdate = true;
    get typeMapping(): Map<string, GModelElementConstructor>;
    get shapeTypeHints(): ShapeTypeHint[];
    get edgeTypeHints(): EdgeTypeHint[];
}
/**
 * Server module for statemachine diagrams
 */
export declare const createStatemachineServerModule: () => ServerModule;
//# sourceMappingURL=statemachine-server.d.ts.map