import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import Handlebars from 'handlebars';

export interface E2ETestGeneratorOptions {
    generateBasicTests?: boolean;
    generateDiagramTests?: boolean;
    generateModelPersistenceTests?: boolean;
    generateKeyboardShortcutTests?: boolean;
    headless?: boolean;
}

export class E2ETestGenerator {
    private basicOperationsTemplate!: HandlebarsTemplateDelegate;
    private diagramEditingTemplate!: HandlebarsTemplateDelegate;
    private modelPersistenceTemplate!: HandlebarsTemplateDelegate;
    private keyboardShortcutsTemplate!: HandlebarsTemplateDelegate;

    constructor() {
        this.loadTemplates();
        this.registerHelpers();
    }

    private loadTemplates(): void {
        this.basicOperationsTemplate = Handlebars.compile(`import { test, expect } from '@playwright/test';
import { {{projectName}}Page } from '../page-objects/{{projectName}}-page';

test.describe('{{projectName}} Basic Operations', () => {
    let page: {{projectName}}Page;

    test.beforeEach(async ({ page: browserPage }) => {
        page = new {{projectName}}Page(browserPage);
        await page.goto();
        await page.waitForDiagramReady();
    });

    test('should load extension', async () => {
        await expect(page.diagram).toBeVisible();
        await expect(page.palette).toBeVisible();
        await expect(page.propertyPanel).toBeVisible();
    });

    test('should display tool palette', async () => {
        await page.openPalette();
        
        const tools = await page.getAvailableTools();
        expect(tools).toContain('Selection');
{{#each interfaces}}
        expect(tools).toContain('{{name}}');
{{/each}}
    });

{{#each interfaces}}
    test('should create {{name}} element', async () => {
        await page.openPalette();
        await page.selectTool('{{name}}');
        
        const position = { x: 100, y: 100 };
        await page.clickOnDiagram(position);
        
        const element = await page.waitForElement('{{camelCase name}}');
        expect(element).toBeTruthy();
        
        const bounds = await element.boundingBox();
        expect(bounds?.x).toBeCloseTo(position.x, -1);
        expect(bounds?.y).toBeCloseTo(position.y, -1);
    });

{{/each}}
    test('should select elements', async () => {
        // Create an element
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        // Click to select
        await page.clickOnDiagram({ x: 100, y: 100 });
        
        const selectedElements = await page.getSelectedElements();
        expect(selectedElements).toHaveLength(1);
        expect(selectedElements[0].type).toBe('{{camelCase firstInterface}}');
    });

    test('should multi-select with ctrl', async () => {
        // Create multiple elements
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        await page.createNode('{{firstInterface}}', { x: 200, y: 200 });
        
        // Select first element
        await page.clickOnDiagram({ x: 100, y: 100 });
        
        // Ctrl+click second element
        await page.clickOnDiagram({ x: 200, y: 200 }, { modifiers: ['Control'] });
        
        const selectedElements = await page.getSelectedElements();
        expect(selectedElements).toHaveLength(2);
    });

    test('should show context menu', async () => {
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        await page.rightClickOnDiagram({ x: 100, y: 100 });
        
        const contextMenu = await page.getContextMenu();
        expect(contextMenu).toBeVisible();
        
        const menuItems = await page.getContextMenuItems();
        expect(menuItems).toContain('Delete');
        expect(menuItems).toContain('Properties');
    });

    test('should zoom in and out', async () => {
        const initialZoom = await page.getZoomLevel();
        
        await page.zoomIn();
        const zoomedIn = await page.getZoomLevel();
        expect(zoomedIn).toBeGreaterThan(initialZoom);
        
        await page.zoomOut();
        await page.zoomOut();
        const zoomedOut = await page.getZoomLevel();
        expect(zoomedOut).toBeLessThan(initialZoom);
    });

    test('should fit to screen', async () => {
        // Create elements at edges
        await page.createNode('{{firstInterface}}', { x: 0, y: 0 });
        await page.createNode('{{firstInterface}}', { x: 1000, y: 1000 });
        
        await page.fitToScreen();
        
        const viewport = await page.getDiagramViewport();
        expect(viewport.scale).toBeLessThan(1);
    });

    test('should undo and redo', async () => {
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        let elements = await page.getAllElements();
        expect(elements).toHaveLength(1);
        
        await page.undo();
        elements = await page.getAllElements();
        expect(elements).toHaveLength(0);
        
        await page.redo();
        elements = await page.getAllElements();
        expect(elements).toHaveLength(1);
    });
});
`);

        this.diagramEditingTemplate = Handlebars.compile(`import { test, expect } from '@playwright/test';
import { {{projectName}}Page } from '../page-objects/{{projectName}}-page';

test.describe('{{projectName}} Diagram Editing', () => {
    let page: {{projectName}}Page;

    test.beforeEach(async ({ page: browserPage }) => {
        page = new {{projectName}}Page(browserPage);
        await page.goto();
        await page.waitForDiagramReady();
    });

    test('should move elements', async () => {
        const element = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        const initialBounds = await element.boundingBox();
        
        await page.dragElement(element, { x: 200, y: 200 });
        
        const movedBounds = await element.boundingBox();
        expect(movedBounds?.x).toBeCloseTo(300, -1);
        expect(movedBounds?.y).toBeCloseTo(300, -1);
    });

    test('should resize elements', async () => {
        const element = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        const initialBounds = await element.boundingBox();
        const initialWidth = initialBounds?.width || 0;
        const initialHeight = initialBounds?.height || 0;
        
        await page.resizeElement(element, { width: 200, height: 150 });
        
        const resizedBounds = await element.boundingBox();
        expect(resizedBounds?.width).toBeCloseTo(200, -1);
        expect(resizedBounds?.height).toBeCloseTo(150, -1);
    });

{{#if hasConnections}}
    test('should create connections', async () => {
        const source = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        const target = await page.createNode('{{firstInterface}}', { x: 300, y: 100 });
        
        await page.selectTool('Edge');
        await page.dragFromTo(
            { x: 150, y: 100 },  // Source center
            { x: 300, y: 100 }   // Target center
        );
        
        const edge = await page.waitForElement('edge');
        expect(edge).toBeTruthy();
        
        const edgeData = await page.getElementData(edge);
        expect(edgeData.sourceId).toBe(await source.getAttribute('id'));
        expect(edgeData.targetId).toBe(await target.getAttribute('id'));
    });

    test('should bend edges', async () => {
        const source = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        const target = await page.createNode('{{firstInterface}}', { x: 300, y: 100 });
        const edge = await page.createEdge(source, target);
        
        // Add bend point
        await page.clickOnElement(edge);
        await page.dragFromTo(
            { x: 200, y: 100 },  // Middle of edge
            { x: 200, y: 200 }   // Create bend
        );
        
        const bendPoints = await page.getEdgeBendPoints(edge);
        expect(bendPoints).toHaveLength(1);
        expect(bendPoints[0]).toMatchObject({ x: 200, y: 200 });
    });

    test('should reconnect edges', async () => {
        const source = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        const target1 = await page.createNode('{{firstInterface}}', { x: 300, y: 100 });
        const target2 = await page.createNode('{{firstInterface}}', { x: 300, y: 300 });
        
        const edge = await page.createEdge(source, target1);
        
        // Reconnect to target2
        await page.selectElement(edge);
        const targetHandle = await page.getEdgeTargetHandle(edge);
        await page.dragElement(targetHandle, { x: 0, y: 200 });
        
        const edgeData = await page.getElementData(edge);
        expect(edgeData.targetId).toBe(await target2.getAttribute('id'));
    });
{{/if}}

    test('should edit properties', async () => {
        const element = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        await page.selectElement(element);
        await page.openPropertyPanel();
        
{{#each firstInterfaceProperties}}
        await page.setProperty('{{name}}', {{#if (eq type 'string')}}'Test Value'{{else if (eq type 'number')}}42{{else if (eq type 'boolean')}}true{{else}}'value'{{/if}});
{{/each}}
        
        await page.applyProperties();
        
        const elementData = await page.getElementData(element);
{{#each firstInterfaceProperties}}
        expect(elementData.{{name}}).toBe({{#if (eq type 'string')}}'Test Value'{{else if (eq type 'number')}}42{{else if (eq type 'boolean')}}true{{else}}'value'{{/if}});
{{/each}}
    });

    test('should validate property constraints', async () => {
        const element = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        await page.selectElement(element);
        await page.openPropertyPanel();
        
        // Try to set invalid value
        await page.setProperty('name', ''); // Empty name
        
        const validationError = await page.getPropertyValidationError('name');
        expect(validationError).toContain('required');
    });

    test('should copy and paste elements', async () => {
        const original = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        await page.selectElement(original);
        await page.copy();
        await page.paste({ x: 200, y: 200 });
        
        const elements = await page.getAllElements();
        expect(elements).toHaveLength(2);
        
        const pasted = elements[1];
        const pastedBounds = await pasted.boundingBox();
        expect(pastedBounds?.x).toBeCloseTo(200, -1);
        expect(pastedBounds?.y).toBeCloseTo(200, -1);
    });

    test('should delete elements', async () => {
        const element = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        await page.selectElement(element);
        await page.deleteSelected();
        
        const elements = await page.getAllElements();
        expect(elements).toHaveLength(0);
    });

    test('should align elements', async () => {
        const element1 = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        const element2 = await page.createNode('{{firstInterface}}', { x: 200, y: 150 });
        const element3 = await page.createNode('{{firstInterface}}', { x: 150, y: 200 });
        
        await page.selectAll();
        await page.alignElements('left');
        
        const bounds1 = await element1.boundingBox();
        const bounds2 = await element2.boundingBox();
        const bounds3 = await element3.boundingBox();
        
        expect(bounds1?.x).toBe(bounds2?.x);
        expect(bounds2?.x).toBe(bounds3?.x);
    });

    test('should distribute elements', async () => {
        const elements = await Promise.all([
            page.createNode('{{firstInterface}}', { x: 100, y: 100 }),
            page.createNode('{{firstInterface}}', { x: 200, y: 100 }),
            page.createNode('{{firstInterface}}', { x: 400, y: 100 })
        ]);
        
        await page.selectAll();
        await page.distributeElements('horizontal');
        
        const bounds = await Promise.all(
            elements.map(el => el.boundingBox())
        );
        
        const spacing1 = (bounds[1]?.x || 0) - (bounds[0]?.x || 0);
        const spacing2 = (bounds[2]?.x || 0) - (bounds[1]?.x || 0);
        
        expect(spacing1).toBeCloseTo(spacing2, 0);
    });
});
`);

        this.modelPersistenceTemplate = Handlebars.compile(`import { test, expect } from '@playwright/test';
import { {{projectName}}Page } from '../page-objects/{{projectName}}-page';
import * as fs from 'fs/promises';
import * as path from 'path';

test.describe('{{projectName}} Model Persistence', () => {
    let page: {{projectName}}Page;
    const testModelPath = path.join(__dirname, '../test-models/test-model.{{projectName}}');

    test.beforeEach(async ({ page: browserPage }) => {
        page = new {{projectName}}Page(browserPage);
        await page.goto();
        await page.waitForDiagramReady();
    });

    test.afterEach(async () => {
        // Clean up test files
        try {
            await fs.unlink(testModelPath);
        } catch {
            // File might not exist
        }
    });

    test('should save model', async () => {
        // Create some elements
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        await page.createNode('{{firstInterface}}', { x: 200, y: 200 });
{{#if hasConnections}}
        const source = await page.getElementAt({ x: 100, y: 100 });
        const target = await page.getElementAt({ x: 200, y: 200 });
        await page.createEdge(source, target);
{{/if}}
        
        await page.saveModel(testModelPath);
        
        // Verify file exists
        const fileExists = await fs.access(testModelPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
        // Verify content
        const content = await fs.readFile(testModelPath, 'utf-8');
        const model = JSON.parse(content);
        
        expect(model.type).toBe('graph');
        expect(model.children).toHaveLength({{#if hasConnections}}3{{else}}2{{/if}});
    });

    test('should load model', async () => {
        // Create test model file
        const testModel = {
            type: 'graph',
            id: 'test-graph',
            children: [
{{#each interfaces}}
{{#if @first}}
                {
                    type: '{{camelCase name}}',
                    id: '{{name}}-1',
                    position: { x: 100, y: 100 }
                }
{{/if}}
{{/each}}
            ]
        };
        
        await fs.mkdir(path.dirname(testModelPath), { recursive: true });
        await fs.writeFile(testModelPath, JSON.stringify(testModel, null, 2));
        
        await page.loadModel(testModelPath);
        
        const elements = await page.getAllElements();
        expect(elements).toHaveLength(1);
        
        const element = elements[0];
        const bounds = await element.boundingBox();
        expect(bounds?.x).toBeCloseTo(100, -1);
        expect(bounds?.y).toBeCloseTo(100, -1);
    });

    test('should handle save errors gracefully', async () => {
        const invalidPath = '/invalid/path/model.{{projectName}}';
        
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        const saveResult = await page.saveModel(invalidPath);
        expect(saveResult.success).toBe(false);
        expect(saveResult.error).toContain('Failed to save');
        
        // Should show error notification
        const notification = await page.getNotification();
        expect(notification).toContain('Failed to save model');
    });

    test('should handle load errors gracefully', async () => {
        const nonExistentPath = path.join(__dirname, '../test-models/non-existent.{{projectName}}');
        
        const loadResult = await page.loadModel(nonExistentPath);
        expect(loadResult.success).toBe(false);
        expect(loadResult.error).toContain('File not found');
        
        // Should show error notification
        const notification = await page.getNotification();
        expect(notification).toContain('Failed to load model');
    });

    test('should auto-save changes', async () => {
        await page.enableAutoSave(testModelPath, 1000); // 1 second interval
        
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        // Wait for auto-save
        await page.waitForTimeout(1500);
        
        const fileExists = await fs.access(testModelPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
        const content = await fs.readFile(testModelPath, 'utf-8');
        const model = JSON.parse(content);
        expect(model.children).toHaveLength(1);
    });

    test('should export to different formats', async () => {
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        // Export as SVG
        const svgPath = path.join(__dirname, '../test-models/export.svg');
        await page.exportAs('svg', svgPath);
        
        const svgContent = await fs.readFile(svgPath, 'utf-8');
        expect(svgContent).toContain('<svg');
        expect(svgContent).toContain('{{firstInterface}}');
        
        // Export as PNG
        const pngPath = path.join(__dirname, '../test-models/export.png');
        await page.exportAs('png', pngPath);
        
        const pngStats = await fs.stat(pngPath);
        expect(pngStats.size).toBeGreaterThan(0);
        
        // Clean up
        await fs.unlink(svgPath);
        await fs.unlink(pngPath);
    });

    test('should handle large models', async () => {
        // Create large model
        const positions = [];
        for (let i = 0; i < 100; i++) {
            positions.push({
                x: (i % 10) * 100,
                y: Math.floor(i / 10) * 100
            });
        }
        
        await Promise.all(
            positions.map(pos => page.createNode('{{firstInterface}}', pos))
        );
        
        const saveStart = Date.now();
        await page.saveModel(testModelPath);
        const saveDuration = Date.now() - saveStart;
        
        // Should save within reasonable time
        expect(saveDuration).toBeLessThan(5000);
        
        // Clear diagram
        await page.selectAll();
        await page.deleteSelected();
        
        const loadStart = Date.now();
        await page.loadModel(testModelPath);
        const loadDuration = Date.now() - loadStart;
        
        // Should load within reasonable time
        expect(loadDuration).toBeLessThan(5000);
        
        const elements = await page.getAllElements();
        expect(elements).toHaveLength(100);
    });
});
`);

        this.keyboardShortcutsTemplate = Handlebars.compile(`import { test, expect } from '@playwright/test';
import { {{projectName}}Page } from '../page-objects/{{projectName}}-page';

test.describe('{{projectName}} Keyboard Shortcuts', () => {
    let page: {{projectName}}Page;

    test.beforeEach(async ({ page: browserPage }) => {
        page = new {{projectName}}Page(browserPage);
        await page.goto();
        await page.waitForDiagramReady();
    });

    test('should handle selection shortcuts', async () => {
        // Create elements
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        await page.createNode('{{firstInterface}}', { x: 200, y: 200 });
        
        // Ctrl+A to select all
        await page.keyboard.press('Control+a');
        
        const selectedElements = await page.getSelectedElements();
        expect(selectedElements).toHaveLength(2);
        
        // Escape to deselect
        await page.keyboard.press('Escape');
        
        const selectedAfterEscape = await page.getSelectedElements();
        expect(selectedAfterEscape).toHaveLength(0);
    });

    test('should handle clipboard shortcuts', async () => {
        const original = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        await page.selectElement(original);
        
        // Ctrl+C to copy
        await page.keyboard.press('Control+c');
        
        // Ctrl+V to paste
        await page.keyboard.press('Control+v');
        
        const elements = await page.getAllElements();
        expect(elements).toHaveLength(2);
        
        // Ctrl+X to cut
        await page.selectElement(elements[1]);
        await page.keyboard.press('Control+x');
        
        const afterCut = await page.getAllElements();
        expect(afterCut).toHaveLength(1);
        
        // Paste the cut element
        await page.keyboard.press('Control+v');
        
        const afterPaste = await page.getAllElements();
        expect(afterPaste).toHaveLength(2);
    });

    test('should handle undo/redo shortcuts', async () => {
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        // Ctrl+Z to undo
        await page.keyboard.press('Control+z');
        
        let elements = await page.getAllElements();
        expect(elements).toHaveLength(0);
        
        // Ctrl+Y to redo
        await page.keyboard.press('Control+y');
        
        elements = await page.getAllElements();
        expect(elements).toHaveLength(1);
        
        // Ctrl+Shift+Z as alternative redo
        await page.keyboard.press('Control+z');
        await page.keyboard.press('Control+Shift+z');
        
        elements = await page.getAllElements();
        expect(elements).toHaveLength(1);
    });

    test('should handle delete shortcuts', async () => {
        const element = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        await page.selectElement(element);
        
        // Delete key
        await page.keyboard.press('Delete');
        
        let elements = await page.getAllElements();
        expect(elements).toHaveLength(0);
        
        // Create another and test Backspace
        const element2 = await page.createNode('{{firstInterface}}', { x: 200, y: 200 });
        await page.selectElement(element2);
        
        await page.keyboard.press('Backspace');
        
        elements = await page.getAllElements();
        expect(elements).toHaveLength(0);
    });

    test('should handle save shortcuts', async () => {
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        
        // Mock save dialog
        await page.mockSaveDialog('/test/model.{{projectName}}');
        
        // Ctrl+S to save
        await page.keyboard.press('Control+s');
        
        const notification = await page.getNotification();
        expect(notification).toContain('Model saved');
    });

    test('should handle zoom shortcuts', async () => {
        const initialZoom = await page.getZoomLevel();
        
        // Ctrl++ to zoom in
        await page.keyboard.press('Control+Plus');
        
        let currentZoom = await page.getZoomLevel();
        expect(currentZoom).toBeGreaterThan(initialZoom);
        
        // Ctrl+- to zoom out
        await page.keyboard.press('Control+Minus');
        await page.keyboard.press('Control+Minus');
        
        currentZoom = await page.getZoomLevel();
        expect(currentZoom).toBeLessThan(initialZoom);
        
        // Ctrl+0 to reset zoom
        await page.keyboard.press('Control+0');
        
        currentZoom = await page.getZoomLevel();
        expect(currentZoom).toBe(1);
    });

    test('should handle navigation shortcuts', async () => {
        // Create elements spread out
        await page.createNode('{{firstInterface}}', { x: 0, y: 0 });
        await page.createNode('{{firstInterface}}', { x: 1000, y: 0 });
        await page.createNode('{{firstInterface}}', { x: 0, y: 1000 });
        await page.createNode('{{firstInterface}}', { x: 1000, y: 1000 });
        
        // Home to go to top-left
        await page.keyboard.press('Home');
        
        const viewportAfterHome = await page.getDiagramViewport();
        expect(viewportAfterHome.x).toBeCloseTo(0, 0);
        expect(viewportAfterHome.y).toBeCloseTo(0, 0);
        
        // End to go to bottom-right
        await page.keyboard.press('End');
        
        const viewportAfterEnd = await page.getDiagramViewport();
        expect(viewportAfterEnd.x).toBeGreaterThan(500);
        expect(viewportAfterEnd.y).toBeGreaterThan(500);
        
        // Arrow keys to pan
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowUp');
        
        const viewportAfterArrows = await page.getDiagramViewport();
        expect(viewportAfterArrows.x).toBeLessThan(viewportAfterEnd.x);
        expect(viewportAfterArrows.y).toBeLessThan(viewportAfterEnd.y);
    });

    test('should handle tool shortcuts', async () => {
        // V for selection tool
        await page.keyboard.press('v');
        
        let activeTool = await page.getActiveTool();
        expect(activeTool).toBe('selection');
        
{{#each interfaces}}
        // {{@index}} + 1 for {{name}} tool
        await page.keyboard.press('{{add @index 1}}');
        
        activeTool = await page.getActiveTool();
        expect(activeTool).toBe('{{camelCase name}}');
        
{{/each}}
    });

    test('should handle property panel shortcut', async () => {
        const element = await page.createNode('{{firstInterface}}', { x: 100, y: 100 });
        await page.selectElement(element);
        
        // F4 to open properties
        await page.keyboard.press('F4');
        
        const propertyPanel = await page.getPropertyPanel();
        expect(propertyPanel).toBeVisible();
        
        // Escape to close
        await page.keyboard.press('Escape');
        
        await expect(propertyPanel).not.toBeVisible();
    });

    test('should handle search shortcut', async () => {
        // Create elements with names
        await page.createNode('{{firstInterface}}', { x: 100, y: 100 }, { name: 'Element1' });
        await page.createNode('{{firstInterface}}', { x: 200, y: 200 }, { name: 'Element2' });
        await page.createNode('{{firstInterface}}', { x: 300, y: 300 }, { name: 'SearchMe' });
        
        // Ctrl+F to open search
        await page.keyboard.press('Control+f');
        
        const searchBox = await page.getSearchBox();
        expect(searchBox).toBeVisible();
        
        // Type search term
        await searchBox.type('SearchMe');
        await page.keyboard.press('Enter');
        
        // Should select and focus the matching element
        const selectedElements = await page.getSelectedElements();
        expect(selectedElements).toHaveLength(1);
        expect(selectedElements[0].name).toBe('SearchMe');
        
        // Escape to close search
        await page.keyboard.press('Escape');
        await expect(searchBox).not.toBeVisible();
    });
});
`);
    }

    private registerHelpers(): void {
        Handlebars.registerHelper('camelCase', (str: string) => {
            return str.charAt(0).toLowerCase() + str.slice(1);
        });

        Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

        Handlebars.registerHelper('add', (a: number, b: number) => a + b);
    }

    async generate(
        grammar: ParsedGrammar,
        outputDir: string,
        options: E2ETestGeneratorOptions = {}
    ): Promise<string[]> {
        const opts = {
            generateBasicTests: true,
            generateDiagramTests: true,
            generateModelPersistenceTests: true,
            generateKeyboardShortcutTests: true,
            headless: true,
            ...options
        };

        const generatedFiles: string[] = [];

        // Create test directories
        const e2eTestDir = path.join(outputDir, 'src', 'test', 'e2e');
        const pageObjectsDir = path.join(e2eTestDir, 'page-objects');

        await fs.ensureDir(e2eTestDir);
        await fs.ensureDir(pageObjectsDir);

        // Generate page object
        await this.generatePageObject(grammar, pageObjectsDir);
        generatedFiles.push(path.join(pageObjectsDir, `${grammar.projectName}-page.ts`));

        // Generate basic operations tests
        if (opts.generateBasicTests) {
            const testPath = path.join(e2eTestDir, 'basic-operations.test.ts');
            const content = this.generateBasicOperationsTest(grammar);
            await fs.writeFile(testPath, content);
            generatedFiles.push(testPath);
        }

        // Generate diagram editing tests
        if (opts.generateDiagramTests) {
            const testPath = path.join(e2eTestDir, 'diagram-editing.test.ts');
            const content = this.generateDiagramEditingTest(grammar);
            await fs.writeFile(testPath, content);
            generatedFiles.push(testPath);
        }

        // Generate model persistence tests
        if (opts.generateModelPersistenceTests) {
            const testPath = path.join(e2eTestDir, 'model-persistence.test.ts');
            const content = this.generateModelPersistenceTest(grammar);
            await fs.writeFile(testPath, content);
            generatedFiles.push(testPath);
        }

        // Generate keyboard shortcut tests
        if (opts.generateKeyboardShortcutTests) {
            const testPath = path.join(e2eTestDir, 'keyboard-shortcuts.test.ts');
            const content = this.generateKeyboardShortcutsTest(grammar);
            await fs.writeFile(testPath, content);
            generatedFiles.push(testPath);
        }

        return generatedFiles;
    }

    private async generatePageObject(grammar: ParsedGrammar, pageObjectsDir: string): Promise<void> {
        const pageObjectTemplate = Handlebars.compile(`import { Page, Locator } from '@playwright/test';

export class {{projectName}}Page {
    readonly page: Page;
    readonly diagram: Locator;
    readonly palette: Locator;
    readonly propertyPanel: Locator;
    
    constructor(page: Page) {
        this.page = page;
        this.diagram = page.locator('.diagram-container');
        this.palette = page.locator('.tool-palette');
        this.propertyPanel = page.locator('.property-panel');
    }
    
    async goto() {
        await this.page.goto('/');
    }
    
    async waitForDiagramReady() {
        await this.diagram.waitFor({ state: 'visible' });
        await this.page.waitForTimeout(500); // Wait for initialization
    }
    
    async openPalette() {
        if (!await this.palette.isVisible()) {
            await this.page.click('[aria-label="Tool Palette"]');
        }
    }
    
    async selectTool(toolName: string) {
        await this.openPalette();
        await this.page.click(\`[data-tool-id="\${toolName.toLowerCase()}"]\`);
    }
    
    async getAvailableTools(): Promise<string[]> {
        await this.openPalette();
        const tools = await this.palette.locator('[data-tool-id]').all();
        return Promise.all(tools.map(tool => tool.getAttribute('data-tool-label') || ''));
    }
    
    async clickOnDiagram(position: { x: number; y: number }, options?: { modifiers?: string[] }) {
        await this.diagram.click({
            position,
            modifiers: options?.modifiers as any
        });
    }
    
    async rightClickOnDiagram(position: { x: number; y: number }) {
        await this.diagram.click({
            position,
            button: 'right'
        });
    }
    
    async createNode(type: string, position: { x: number; y: number }, properties?: Record<string, any>) {
        await this.selectTool(type);
        await this.clickOnDiagram(position);
        
        const element = await this.waitForElement(type.toLowerCase());
        
        if (properties) {
            await this.selectElement(element);
            await this.openPropertyPanel();
            for (const [key, value] of Object.entries(properties)) {
                await this.setProperty(key, value);
            }
            await this.applyProperties();
        }
        
        return element;
    }
    
    async waitForElement(type: string): Promise<Locator> {
        const selector = \`[data-element-type="\${type}"]:last-child\`;
        await this.page.waitForSelector(selector);
        return this.page.locator(selector);
    }
    
    async getSelectedElements() {
        const elements = await this.page.locator('.selected[data-element-type]').all();
        return Promise.all(elements.map(async el => ({
            type: await el.getAttribute('data-element-type') || '',
            id: await el.getAttribute('id') || '',
            name: await el.getAttribute('data-name') || ''
        })));
    }
    
    async getAllElements() {
        return this.page.locator('[data-element-type]').all();
    }
    
    async selectElement(element: Locator) {
        await element.click();
    }
    
    async getContextMenu() {
        return this.page.locator('.context-menu');
    }
    
    async getContextMenuItems(): Promise<string[]> {
        const menu = await this.getContextMenu();
        const items = await menu.locator('.menu-item').all();
        return Promise.all(items.map(item => item.textContent() || ''));
    }
    
    async getZoomLevel(): Promise<number> {
        const transform = await this.diagram.evaluate(el => {
            const svg = el.querySelector('svg g');
            return svg?.getAttribute('transform') || '';
        });
        const match = transform.match(/scale\\(([\d.]+)\\)/);
        return match ? parseFloat(match[1]) : 1;
    }
    
    async zoomIn() {
        await this.page.click('[aria-label="Zoom In"]');
    }
    
    async zoomOut() {
        await this.page.click('[aria-label="Zoom Out"]');
    }
    
    async fitToScreen() {
        await this.page.click('[aria-label="Fit to Screen"]');
    }
    
    async undo() {
        await this.page.keyboard.press('Control+z');
    }
    
    async redo() {
        await this.page.keyboard.press('Control+y');
    }
    
    // Additional helper methods...
}
`);

        const content = pageObjectTemplate({
            projectName: grammar.projectName
        });

        await fs.writeFile(
            path.join(pageObjectsDir, `${grammar.projectName}-page.ts`),
            content
        );
    }

    private generateBasicOperationsTest(grammar: ParsedGrammar): string {
        return this.basicOperationsTemplate({
            projectName: grammar.projectName,
            interfaces: grammar.interfaces,
            firstInterface: grammar.interfaces[0]?.name || 'Node'
        });
    }

    private generateDiagramEditingTest(grammar: ParsedGrammar): string {
        const hasConnections = grammar.interfaces.some(i =>
            i.name.toLowerCase().includes('edge') ||
            i.name.toLowerCase().includes('connection')
        );

        return this.diagramEditingTemplate({
            projectName: grammar.projectName,
            interfaces: grammar.interfaces,
            firstInterface: grammar.interfaces[0]?.name || 'Node',
            firstInterfaceProperties: grammar.interfaces[0]?.properties || [],
            hasConnections
        });
    }

    private generateModelPersistenceTest(grammar: ParsedGrammar): string {
        const hasConnections = grammar.interfaces.some(i =>
            i.name.toLowerCase().includes('edge') ||
            i.name.toLowerCase().includes('connection')
        );

        return this.modelPersistenceTemplate({
            projectName: grammar.projectName,
            interfaces: grammar.interfaces,
            firstInterface: grammar.interfaces[0]?.name || 'Node',
            hasConnections
        });
    }

    private generateKeyboardShortcutsTest(grammar: ParsedGrammar): string {
        return this.keyboardShortcutsTemplate({
            projectName: grammar.projectName,
            interfaces: grammar.interfaces,
            firstInterface: grammar.interfaces[0]?.name || 'Node'
        });
    }
}