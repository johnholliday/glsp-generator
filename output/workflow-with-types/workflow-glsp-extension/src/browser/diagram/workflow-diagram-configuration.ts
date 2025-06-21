import { GLSPDiagramConfiguration } from '@eclipse-glsp/theia-integration';
import { Container } from 'inversify';
import { WorkflowModel } from '../../common/workflow-model.js';

export class WorkflowDiagramConfiguration extends GLSPDiagramConfiguration {
    readonly diagramType = 'workflow-diagram';

    createContainer(widgetId: string): Container {
        const container = super.createContainer(widgetId);
        // Register default tools and handlers
        this.configureGrid(container);
        return container;
    }

    protected initializeDiagramContainer(container: Container): void {
        super.initializeDiagramContainer(container);
        // Register model elements
        // Note: We're binding the namespace itself, not trying to use it as a value
        container.bind('WorkflowModelNamespace').toConstantValue(WorkflowModel);
        
        // Configure diagram options
        this.configureDiagramOptions(container);
    }
    
    private configureDiagramOptions(container: Container): void {
        const options = {
            snapToGrid: true,
            animationEnabled: true,
            routingType: 'polyline',
            defaultNodeSize: {
                width: 100,
                height: 60
            },
            theme: 'light',
            defaultColors: {
                node: '#4A90E2',
                edge: '#333333',
                selected: '#FF6B6B',
                hover: '#FFA500'
            }
        };
        
        container.bind('DiagramOptions').toConstantValue(options);
    }
    
    private configureGrid(container: Container): void {
        // Configure grid options
        container.bind('GridOptions').toConstantValue({
            enabled: true,
            size: 10,
            visible: true
        });
    }
}
