import { DiagramConfiguration, ShapeTypeHint, EdgeTypeHint, ServerLayoutKind, GModelElementConstructor } from '@eclipse-glsp/server';
/**
 * Diagram configuration for statemachine
 */
export declare class StatemachineDiagramConfiguration implements DiagramConfiguration {
    get diagramType(): string;
    get layoutKind(): ServerLayoutKind;
    get needsClientLayout(): boolean;
    get animatedUpdate(): boolean;
    get typeMapping(): Map<string, GModelElementConstructor>;
    get shapeTypeHints(): ShapeTypeHint[];
    get edgeTypeHints(): EdgeTypeHint[];
}
//# sourceMappingURL=statemachine-diagram-configuration.d.ts.map