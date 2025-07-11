import { Container } from 'inversify';
import { configureViewerOptions, ConsoleLogger, LogLevel, TYPES } from 'sprotty';
import { statemachineDiagramModule } from '../browser/diagram/statemachine-diagram-module';
const vscode = acquireVsCodeApi();
/**
 * Initialize GLSP diagram in the webview
 */
async function initializeDiagram() {
    // Create the GLSP container
    const container = new Container();
    container.load(statemachineDiagramModule);
    // Configure viewer options
    configureViewerOptions(container, {
        baseDiv: 'sprotty-container',
        hiddenDiv: 'sprotty-hidden',
        popupDiv: 'sprotty-popup',
        needsClientLayout: true,
        needsServerLayout: true
    });
    // Configure logging
    container.rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    container.rebind(TYPES.LogLevel).toConstantValue(LogLevel.info);
    // Get the model viewer
    const modelViewer = container.get(TYPES.ModelViewer);
    const viewerOptions = container.get(TYPES.ViewerOptions);
    // Initialize with the document content
    const initialContent = window.initialContent || '';
    const documentUri = window.documentUri || '';
    try {
        // Parse the document content
        const model = parseDocumentContent(initialContent);
        // Initialize the diagram with the model
        await modelViewer.update(model);
        // Set up message handling
        setupMessageHandling(modelViewer);
        // Notify extension that diagram is ready
        vscode.postMessage({ command: 'ready' });
    }
    catch (error) {
        console.error('Failed to initialize diagram:', error);
        vscode.postMessage({
            command: 'error',
            error: `Failed to initialize diagram: ${error}`
        });
    }
}
/**
 * Parse document content to create GLSP model
 */
function parseDocumentContent(content) {
    // TODO: Implement actual parsing logic based on your grammar
    // For now, return a basic model structure
    const model = {
        id: 'graph',
        type: 'graph',
        children: []
    };
    try {
        // Simple parsing example - you'll need to implement proper parsing
        const lines = content.split('\n');
        let currentY = 50;
        for (const line of lines) {
            const trimmed = line.trim();
            // Parse State declarations
            if (trimmed.startsWith('State ')) {
                const match = trimmed.match(/State\s+(\w+)\s*\{/);
                if (match) {
                    model.children.push({
                        id: `state-${match[1]}`,
                        type: 'state',
                        name: match[1],
                        position: { x: 100, y: currentY },
                        size: { width: 100, height: 60 }
                    });
                    currentY += 100;
                }
            }
            // Parse Transition declarations
            if (trimmed.includes('->')) {
                const match = trimmed.match(/(\w+)\s*->\s*(\w+)/);
                if (match) {
                    model.children.push({
                        id: `edge-${match[1]}-${match[2]}`,
                        type: 'edge',
                        sourceId: `state-${match[1]}`,
                        targetId: `state-${match[2]}`,
                        routingPoints: []
                    });
                }
            }
        }
    }
    catch (error) {
        console.error('Error parsing document:', error);
    }
    return model;
}
/**
 * Set up message handling between webview and extension
 */
function setupMessageHandling(modelViewer) {
    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                // Update diagram when document changes
                const newModel = parseDocumentContent(message.text);
                modelViewer.update(newModel);
                break;
            case 'command':
                // Handle commands from extension
                handleCommand(message.command, message.args, modelViewer);
                break;
        }
    });
    // Listen for model updates
    // Note: You may need to implement change detection based on your requirements
}
/**
 * Handle commands from the extension
 */
function handleCommand(command, args, modelViewer) {
    switch (command) {
        case 'fit':
            // Fit to screen functionality would need to be implemented
            console.log('Fit command received');
            break;
        case 'center':
            // Center functionality would need to be implemented  
            console.log('Center command received');
            break;
        case 'export':
            // Export functionality would need to be implemented
            console.log('Export command received');
            break;
        default:
            console.warn(`Unknown command: ${command}`);
    }
}
// Initialize when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDiagram);
}
else {
    initializeDiagram();
}
//# sourceMappingURL=index.js.map