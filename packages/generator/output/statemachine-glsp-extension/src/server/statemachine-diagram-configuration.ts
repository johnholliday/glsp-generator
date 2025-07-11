import { injectable } from 'inversify';
import { DiagramConfiguration, ShapeTypeHint, EdgeTypeHint, ServerLayoutKind, GModelElementConstructor } from '@eclipse-glsp/server';

/**
 * Diagram configuration for statemachine
 */
@injectable()
export class StatemachineDiagramConfiguration implements DiagramConfiguration {
    get diagramType(): string {
        return 'statemachine-diagram';
    }

    get layoutKind(): ServerLayoutKind {
        return ServerLayoutKind.MANUAL;
    }

    get needsClientLayout(): boolean {
        return true;
    }

    get animatedUpdate(): boolean {
        return true;
    }

    get typeMapping(): Map<string, GModelElementConstructor> {
        // Return empty map - actual type mapping is handled by the model factory
        return new Map<string, GModelElementConstructor>();
    }

    get shapeTypeHints(): ShapeTypeHint[] {
        return [
            {
                elementTypeId: 'statemachine',
                deletable: true,
                reparentable: false,
                repositionable: true,
                resizable: true
            },
            {
                elementTypeId: 'state',
                deletable: true,
                reparentable: true,
                repositionable: true,
                resizable: true
            },
            {
                elementTypeId: 'transition',
                deletable: true,
                reparentable: true,
                repositionable: true,
                resizable: true
            }
        ];
    }

    get edgeTypeHints(): EdgeTypeHint[] {
        return [
            {
                elementTypeId: 'edge',
                deletable: true,
                repositionable: false,
                routable: true,
                sourceElementTypeIds: ['state'],
                targetElementTypeIds: ['state']
            }
        ];
    }
}