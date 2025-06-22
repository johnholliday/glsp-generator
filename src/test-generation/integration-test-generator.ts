import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar, GrammarInterface } from '../types/grammar.js';
import Handlebars from 'handlebars';

export interface IntegrationTestGeneratorOptions {
    generateServerTests?: boolean;
    generateHandlerTests?: boolean;
    generateClientTests?: boolean;
    generateCommunicationTests?: boolean;
}

export class IntegrationTestGenerator {
    private serverTestTemplate!: HandlebarsTemplateDelegate;
    private handlerTestTemplate!: HandlebarsTemplateDelegate;
    private clientTestTemplate!: HandlebarsTemplateDelegate;
    private communicationTestTemplate!: HandlebarsTemplateDelegate;
    
    constructor() {
        this.loadTemplates();
        this.registerHelpers();
    }
    
    private loadTemplates(): void {
        this.serverTestTemplate = Handlebars.compile(`import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Container } from 'inversify';
import { GLSPServerModule } from '@eclipse-glsp/server';
import { {{projectName}}ServerModule } from '../../../src/server/{{projectName}}-server-module';
import { {{projectName}}ModelSource } from '../../../src/server/model/{{projectName}}-model-source';
import { ModelState } from '@eclipse-glsp/server';

describe('{{projectName}} GLSP Server Integration', () => {
    let container: Container;
    let modelSource: {{projectName}}ModelSource;
    let modelState: ModelState;

    beforeEach(() => {
        container = new Container();
        container.load(
            GLSPServerModule,
            {{projectName}}ServerModule
        );
        
        modelSource = container.get({{projectName}}ModelSource);
        modelState = container.get(ModelState);
    });

    afterEach(() => {
        container.unbindAll();
    });

    describe('Server Initialization', () => {
        test('should initialize server modules', () => {
            expect(container.isBound({{projectName}}ModelSource)).toBe(true);
            expect(container.isBound(ModelState)).toBe(true);
        });

        test('should have all required bindings', () => {
            const requiredBindings = [
                'ActionDispatcher',
                'ActionHandlerRegistry',
                'CommandPalette',
                'ContextMenuProvider',
                'DiagramConfiguration'
            ];
            
            requiredBindings.forEach(binding => {
                expect(() => container.getNamed('Service', binding)).not.toThrow();
            });
        });
    });

    describe('Model Source', () => {
        test('should load empty model', async () => {
            const model = await modelSource.loadSourceModel({
                sourceUri: 'test://empty.{{projectName}}',
                clientId: 'test-client'
            });
            
            expect(model).toBeDefined();
            expect(model.type).toBe('graph');
        });

        test('should save model', async () => {
            const sourceUri = 'test://save-test.{{projectName}}';
            
            await modelSource.saveSourceModel({
                sourceUri,
                clientId: 'test-client',
                model: {
                    type: 'graph',
                    id: 'test-graph',
                    children: []
                }
            });
            
            const saved = await modelSource.loadSourceModel({
                sourceUri,
                clientId: 'test-client'
            });
            
            expect(saved.id).toBe('test-graph');
        });
    });

    describe('Model State Management', () => {
        test('should update model state', () => {
            const testModel = {
                type: 'graph',
                id: 'test',
                children: []
            };
            
            modelState.updateRoot(testModel);
            expect(modelState.root).toEqual(testModel);
        });

        test('should track dirty state', () => {
            expect(modelState.isDirty).toBe(false);
            
            modelState.updateRoot({
                type: 'graph',
                id: 'modified',
                children: []
            });
            
            expect(modelState.isDirty).toBe(true);
        });
    });
});
`);

        this.handlerTestTemplate = Handlebars.compile(`import { describe, test, expect, beforeEach } from 'vitest';
import { Container } from 'inversify';
import { ActionDispatcher, ModelState } from '@eclipse-glsp/server';
import { Create{{interfaceName}}Handler } from '../../../src/server/handlers/create-{{kebabCase interfaceName}}-handler';
import { {{interfaceName}}Factory } from '../../test-data/factories/{{kebabCase interfaceName}}-factory';

describe('{{interfaceName}} Handler Integration', () => {
    let container: Container;
    let handler: Create{{interfaceName}}Handler;
    let modelState: ModelState;
    let actionDispatcher: ActionDispatcher;

    beforeEach(() => {
        container = new Container();
        
        // Mock dependencies
        modelState = {
            root: { type: 'graph', id: 'test', children: [] },
            index: {
                add: vi.fn(),
                remove: vi.fn(),
                getById: vi.fn()
            }
        } as any;
        
        actionDispatcher = {
            dispatch: vi.fn()
        } as any;
        
        container.bind(ModelState).toConstantValue(modelState);
        container.bind(ActionDispatcher).toConstantValue(actionDispatcher);
        container.bind(Create{{interfaceName}}Handler).toSelf();
        
        handler = container.get(Create{{interfaceName}}Handler);
    });

    describe('Create {{interfaceName}}', () => {
        test('should handle create action', async () => {
            const action = {
                kind: 'create{{interfaceName}}',
                elementTypeId: '{{camelCase interfaceName}}',
                location: { x: 100, y: 100 }
            };
            
            const result = await handler.execute(action);
            
            expect(result).toBeDefined();
            expect(actionDispatcher.dispatch).toHaveBeenCalled();
        });

        test('should validate element properties', async () => {
            const action = {
                kind: 'create{{interfaceName}}',
                elementTypeId: '{{camelCase interfaceName}}',
                location: { x: -100, y: -100 } // Invalid location
            };
            
            await expect(handler.execute(action)).rejects.toThrow();
        });

        test('should add element to model', async () => {
            const action = {
                kind: 'create{{interfaceName}}',
                elementTypeId: '{{camelCase interfaceName}}',
                location: { x: 50, y: 50 }
            };
            
            await handler.execute(action);
            
            expect(modelState.index.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: '{{camelCase interfaceName}}'
                })
            );
        });
    });

    describe('Update {{interfaceName}}', () => {
        test('should handle update action', async () => {
            const existing = {{interfaceName}}Factory.create();
            modelState.index.getById = vi.fn().mockReturnValue(existing);
            
            const action = {
                kind: 'update{{interfaceName}}',
                elementId: existing.id,
                properties: {
                    name: 'Updated Name'
                }
            };
            
            const result = await handler.execute(action);
            
            expect(result).toBeDefined();
            expect(modelState.index.getById).toHaveBeenCalledWith(existing.id);
        });

        test('should validate updates', async () => {
            const existing = {{interfaceName}}Factory.create();
            modelState.index.getById = vi.fn().mockReturnValue(existing);
            
            const action = {
                kind: 'update{{interfaceName}}',
                elementId: existing.id,
                properties: {
                    name: '' // Invalid empty name
                }
            };
            
            await expect(handler.execute(action)).rejects.toThrow();
        });
    });

    describe('Delete {{interfaceName}}', () => {
        test('should handle delete action', async () => {
            const toDelete = {{interfaceName}}Factory.create();
            modelState.index.getById = vi.fn().mockReturnValue(toDelete);
            
            const action = {
                kind: 'delete{{interfaceName}}',
                elementId: toDelete.id
            };
            
            const result = await handler.execute(action);
            
            expect(result).toBeDefined();
            expect(modelState.index.remove).toHaveBeenCalledWith(toDelete);
        });

        test('should handle cascading deletes', async () => {
            // Test that deleting an element also deletes connected elements
            const element = {{interfaceName}}Factory.create();
            const connected = {{interfaceName}}Factory.create();
            
            modelState.index.getById = vi.fn()
                .mockReturnValueOnce(element)
                .mockReturnValueOnce(connected);
            
            const action = {
                kind: 'delete{{interfaceName}}',
                elementId: element.id,
                cascade: true
            };
            
            await handler.execute(action);
            
            expect(modelState.index.remove).toHaveBeenCalledTimes(2);
        });
    });
});
`);

        this.clientTestTemplate = Handlebars.compile(`import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { GLSPClient, ActionMessage } from '@eclipse-glsp/client';
import { {{projectName}}CommandContribution } from '../../../src/browser/{{projectName}}-command-contribution';
import { CommandRegistry } from '@theia/core';

describe('{{projectName}} Client Integration', () => {
    let commandContribution: {{projectName}}CommandContribution;
    let commandRegistry: CommandRegistry;
    let glspClient: GLSPClient;

    beforeEach(() => {
        // Mock GLSP client
        glspClient = {
            sendActionMessage: vi.fn(),
            onActionMessage: vi.fn(),
            start: vi.fn(),
            stop: vi.fn()
        } as any;

        // Mock command registry
        commandRegistry = {
            registerCommand: vi.fn(),
            executeCommand: vi.fn()
        } as any;

        commandContribution = new {{projectName}}CommandContribution();
    });

    describe('Command Registration', () => {
        test('should register all commands', () => {
            commandContribution.registerCommands(commandRegistry);
            
            const expectedCommands = [
{{#each interfaces}}
                '{{../projectName}}.create{{name}}',
                '{{../projectName}}.delete{{name}}',
{{/each}}
                '{{projectName}}.validateModel',
                '{{projectName}}.autoLayout'
            ];
            
            expectedCommands.forEach(commandId => {
                expect(commandRegistry.registerCommand).toHaveBeenCalledWith(
                    expect.objectContaining({ id: commandId }),
                    expect.any(Object)
                );
            });
        });
    });

    describe('Command Execution', () => {
{{#each interfaces}}
        test('should execute create {{name}} command', async () => {
            const command = {
                id: '{{../projectName}}.create{{name}}',
                label: 'Create {{name}}'
            };
            
            await commandContribution.execute(command);
            
            expect(glspClient.sendActionMessage).toHaveBeenCalledWith({
                kind: 'create{{name}}',
                elementTypeId: '{{camelCase name}}'
            });
        });

{{/each}}
        test('should handle command errors gracefully', async () => {
            glspClient.sendActionMessage = vi.fn().mockRejectedValue(
                new Error('Network error')
            );
            
            const command = {
                id: '{{projectName}}.validateModel',
                label: 'Validate Model'
            };
            
            await expect(commandContribution.execute(command)).rejects.toThrow('Network error');
        });
    });

    describe('Context Menu Integration', () => {
        test('should provide context menu items', () => {
            const selectedElements = [
                { type: '{{camelCase firstInterface}}', id: 'element1' }
            ];
            
            const menuItems = commandContribution.getContextMenuItems(selectedElements);
            
            expect(menuItems).toContainEqual(
                expect.objectContaining({
                    id: '{{projectName}}.delete{{firstInterface}}',
                    label: 'Delete {{firstInterface}}'
                })
            );
        });

        test('should filter menu items based on selection', () => {
            const mixedSelection = [
                { type: '{{camelCase firstInterface}}', id: 'element1' },
                { type: 'unknownType', id: 'element2' }
            ];
            
            const menuItems = commandContribution.getContextMenuItems(mixedSelection);
            
            // Should not show type-specific actions for mixed selection
            expect(menuItems).not.toContainEqual(
                expect.objectContaining({
                    id: expect.stringContaining('.delete')
                })
            );
        });
    });
});
`);

        this.communicationTestTemplate = Handlebars.compile(`import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import { GLSPServer } from '../../../src/server/{{projectName}}-glsp-server';
import { GLSPClient } from '../../../src/client/{{projectName}}-glsp-client';

describe('Client-Server Communication', () => {
    let server: GLSPServer;
    let client: GLSPClient;
    let serverPort: number;

    beforeEach(async () => {
        serverPort = 5000 + Math.floor(Math.random() * 1000);
        server = new GLSPServer({ port: serverPort });
        await server.start();

        client = new GLSPClient({
            serverUrl: \`ws://localhost:\${serverPort}\`
        });
        await client.connect();
    });

    afterEach(async () => {
        await client.disconnect();
        await server.stop();
    });

    describe('Connection Lifecycle', () => {
        test('should establish connection', () => {
            expect(client.isConnected()).toBe(true);
            expect(server.getClientCount()).toBe(1);
        });

        test('should handle reconnection', async () => {
            await client.disconnect();
            expect(client.isConnected()).toBe(false);
            
            await client.connect();
            expect(client.isConnected()).toBe(true);
        });

        test('should handle multiple clients', async () => {
            const client2 = new GLSPClient({
                serverUrl: \`ws://localhost:\${serverPort}\`
            });
            
            await client2.connect();
            expect(server.getClientCount()).toBe(2);
            
            await client2.disconnect();
            expect(server.getClientCount()).toBe(1);
        });
    });

    describe('Message Exchange', () => {
        test('should send and receive actions', async () => {
            const testAction = {
                kind: 'testAction',
                data: { value: 42 }
            };
            
            const responsePromise = new Promise(resolve => {
                client.onActionMessage(action => {
                    if (action.kind === 'testActionResponse') {
                        resolve(action);
                    }
                });
            });
            
            await client.sendActionMessage(testAction);
            const response = await responsePromise;
            
            expect(response).toMatchObject({
                kind: 'testActionResponse',
                data: { value: 42, processed: true }
            });
        });

        test('should handle request-response pattern', async () => {
            const request = {
                kind: 'modelRequest',
                requestId: 'req-123'
            };
            
            const response = await client.sendRequest(request);
            
            expect(response).toMatchObject({
                kind: 'modelResponse',
                responseId: 'req-123',
                model: expect.any(Object)
            });
        });

        test('should handle server-initiated messages', (done) => {
            client.onActionMessage(action => {
                if (action.kind === 'modelChanged') {
                    expect(action.changes).toBeDefined();
                    done();
                }
            });
            
            // Simulate server-side model change
            server.broadcastModelChange({
                kind: 'modelChanged',
                changes: [{ type: 'add', element: { id: 'new-element' } }]
            });
        });
    });

    describe('Error Handling', () => {
        test('should handle malformed messages', async () => {
            const malformed = { invalid: 'message' };
            
            await expect(client.sendActionMessage(malformed as any))
                .rejects.toThrow('Invalid action message');
        });

        test('should handle server errors', async () => {
            const errorAction = {
                kind: 'triggerError',
                errorType: 'ValidationError'
            };
            
            const responsePromise = new Promise((resolve, reject) => {
                client.onActionMessage(action => {
                    if (action.kind === 'error') {
                        reject(new Error(action.message));
                    }
                });
            });
            
            await client.sendActionMessage(errorAction);
            
            await expect(responsePromise).rejects.toThrow('ValidationError');
        });

        test('should recover from connection errors', async () => {
            // Force disconnect
            server.forceDisconnect(client.getClientId());
            
            // Wait for reconnection
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            expect(client.isConnected()).toBe(true);
        });
    });

    describe('Performance', () => {
        test('should handle high message throughput', async () => {
            const messageCount = 1000;
            const messages = Array.from({ length: messageCount }, (_, i) => ({
                kind: 'perfTest',
                index: i
            }));
            
            const received: number[] = [];
            client.onActionMessage(action => {
                if (action.kind === 'perfTestResponse') {
                    received.push(action.index);
                }
            });
            
            const start = Date.now();
            
            await Promise.all(
                messages.map(msg => client.sendActionMessage(msg))
            );
            
            // Wait for all responses
            while (received.length < messageCount) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            const duration = Date.now() - start;
            
            expect(received).toHaveLength(messageCount);
            expect(duration).toBeLessThan(5000); // Should handle 1000 messages in < 5s
        });
    });
});
`);
    }
    
    private registerHelpers(): void {
        Handlebars.registerHelper('camelCase', (str: string) => {
            return str.charAt(0).toLowerCase() + str.slice(1);
        });
        
        Handlebars.registerHelper('kebabCase', (str: string) => {
            return str
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase()
                .replace(/^-/, '');
        });
    }
    
    async generate(
        grammar: ParsedGrammar,
        outputDir: string,
        options: IntegrationTestGeneratorOptions = {}
    ): Promise<string[]> {
        const opts = {
            generateServerTests: true,
            generateHandlerTests: true,
            generateClientTests: true,
            generateCommunicationTests: true,
            ...options
        };
        
        const generatedFiles: string[] = [];
        
        // Create test directories
        const integrationTestDir = path.join(outputDir, 'src', 'test', 'integration');
        const serverTestDir = path.join(integrationTestDir, 'server');
        const clientTestDir = path.join(integrationTestDir, 'client');
        
        await fs.ensureDir(serverTestDir);
        await fs.ensureDir(clientTestDir);
        
        // Generate server tests
        if (opts.generateServerTests) {
            const testPath = path.join(serverTestDir, 'server.test.ts');
            const content = this.generateServerTest(grammar);
            await fs.writeFile(testPath, content);
            generatedFiles.push(testPath);
        }
        
        // Generate handler tests for each interface
        if (opts.generateHandlerTests) {
            for (const iface of grammar.interfaces) {
                const testPath = path.join(serverTestDir, `${this.kebabCase(iface.name)}-handler.test.ts`);
                const content = this.generateHandlerTest(iface, grammar);
                await fs.writeFile(testPath, content);
                generatedFiles.push(testPath);
            }
        }
        
        // Generate client tests
        if (opts.generateClientTests) {
            const testPath = path.join(clientTestDir, 'commands.test.ts');
            const content = this.generateClientTest(grammar);
            await fs.writeFile(testPath, content);
            generatedFiles.push(testPath);
        }
        
        // Generate communication tests
        if (opts.generateCommunicationTests) {
            const testPath = path.join(integrationTestDir, 'communication.test.ts');
            const content = this.generateCommunicationTest(grammar);
            await fs.writeFile(testPath, content);
            generatedFiles.push(testPath);
        }
        
        return generatedFiles;
    }
    
    private generateServerTest(grammar: ParsedGrammar): string {
        return this.serverTestTemplate({
            projectName: grammar.projectName,
            interfaces: grammar.interfaces
        });
    }
    
    private generateHandlerTest(iface: GrammarInterface, grammar: ParsedGrammar): string {
        return this.handlerTestTemplate({
            projectName: grammar.projectName,
            interfaceName: iface.name,
            interfaces: grammar.interfaces
        });
    }
    
    private generateClientTest(grammar: ParsedGrammar): string {
        return this.clientTestTemplate({
            projectName: grammar.projectName,
            interfaces: grammar.interfaces,
            firstInterface: grammar.interfaces[0]?.name || 'Node'
        });
    }
    
    private generateCommunicationTest(grammar: ParsedGrammar): string {
        return this.communicationTestTemplate({
            projectName: grammar.projectName,
            interfaces: grammar.interfaces
        });
    }
    
    private kebabCase(str: string): string {
        return str
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '');
    }
}