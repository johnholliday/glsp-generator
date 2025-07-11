import { GLSPDiagramConfiguration } from '@eclipse-glsp/theia-integration';
import { Container } from 'inversify';
export declare class StatemachineDiagramConfiguration extends GLSPDiagramConfiguration {
    readonly diagramType = "statemachine-diagram";
    configureContainer(container: Container): void;
    private configureDiagramOptions;
    private configureGrid;
}
//# sourceMappingURL=statemachine-diagram-configuration.d.ts.map