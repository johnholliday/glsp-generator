import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import path from 'path';
import { ConfigLoader } from './config-loader.js';
import { DEFAULT_CONFIG } from './default-config.js';
import { GLSPConfig } from './types.js';

describe('ConfigLoader', () => {
    let configLoader: ConfigLoader;

    beforeEach(() => {
        configLoader = new ConfigLoader();
    });

    describe('applyOverrides', () => {
        test('should apply simple overrides', () => {
            const config: GLSPConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            const overrides = {
                'extension.version': '3.0.0',
                'extension.name': 'overridden-name'
            };
            
            const result = configLoader.applyOverrides(config, overrides);
            
            expect(result.extension.version).toBe('3.0.0');
            expect(result.extension.name).toBe('overridden-name');
        });

        test('should apply nested overrides', () => {
            const config: GLSPConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            const overrides = {
                'styling.defaultColors.node': '#AABBCC',
                'diagram.features.compartments': true
            };
            
            const result = configLoader.applyOverrides(config, overrides);
            
            expect(result.styling.defaultColors.node).toBe('#AABBCC');
            expect(result.diagram.features.compartments).toBe(true);
        });

        test('should create missing nested objects', () => {
            const config: GLSPConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            const overrides = {
                'newSection.newProperty': 'newValue'
            };
            
            const result = configLoader.applyOverrides(config, overrides);
            
            expect((result as any).newSection.newProperty).toBe('newValue');
        });

        test('should handle array index notation', () => {
            const config: GLSPConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            // Add an array to test
            (config as any).testArray = ['first', 'second'];
            
            const overrides = {
                'testArray.0': 'updated',
                'testArray.2': 'third'
            };
            
            const result = configLoader.applyOverrides(config, overrides);
            
            expect((result as any).testArray[0]).toBe('updated');
            expect((result as any).testArray[2]).toBe('third');
        });
    });

    describe('default values', () => {
        test('should have valid default configuration', () => {
            expect(DEFAULT_CONFIG.extension.name).toBe('my-glsp-extension');
            expect(DEFAULT_CONFIG.extension.version).toBe('1.0.0');
            expect(DEFAULT_CONFIG.dependencies['@eclipse-glsp/server']).toBe('^2.0.0');
            expect(DEFAULT_CONFIG.diagram.type).toBe('node-edge');
            expect(DEFAULT_CONFIG.styling.theme).toBe('light');
            expect(DEFAULT_CONFIG.generation.outputStructure).toBe('standard');
        });

        test('should have complete default configuration', () => {
            // Check all required fields are present
            expect(DEFAULT_CONFIG.extension).toBeDefined();
            expect(DEFAULT_CONFIG.dependencies).toBeDefined();
            expect(DEFAULT_CONFIG.diagram).toBeDefined();
            expect(DEFAULT_CONFIG.styling).toBeDefined();
            expect(DEFAULT_CONFIG.generation).toBeDefined();
            
            // Check nested required fields
            expect(DEFAULT_CONFIG.diagram.features).toBeDefined();
            expect(DEFAULT_CONFIG.styling.defaultColors).toBeDefined();
            expect(DEFAULT_CONFIG.styling.fonts).toBeDefined();
            expect(DEFAULT_CONFIG.styling.nodeDefaults).toBeDefined();
        });
    });
});