#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Benchmark suite for GLSP Generator performance testing
 */
class BenchmarkSuite {
    constructor() {
        this.results = [];
        this.outputDir = path.join(__dirname, '../benchmark-results');
        this.testDataDir = path.join(__dirname, '../test-data');
    }

    /**
     * Run all benchmarks
     */
    async runAll() {
        console.log(chalk.blue.bold('🏃 Running GLSP Generator Benchmarks\n'));
        
        await this.setupTestData();
        
        // Grammar parsing benchmarks
        await this.benchmarkGrammarParsing();
        
        // Template generation benchmarks
        await this.benchmarkTemplateGeneration();
        
        // Memory usage benchmarks
        await this.benchmarkMemoryUsage();
        
        // Cache performance benchmarks
        await this.benchmarkCachePerformance();
        
        // Parallel processing benchmarks
        await this.benchmarkParallelProcessing();
        
        // Generate report
        await this.generateReport();
        
        console.log(chalk.green.bold('\n✅ All benchmarks completed!'));
    }

    /**
     * Setup test data for benchmarks
     */
    async setupTestData() {
        console.log(chalk.cyan('📁 Setting up test data...'));
        
        await fs.ensureDir(this.testDataDir);
        await fs.ensureDir(this.outputDir);
        
        // Generate test grammars of various sizes
        const sizes = [
            { name: 'small', lines: 100, rules: 10 },
            { name: 'medium', lines: 500, rules: 50 },
            { name: 'large', lines: 1000, rules: 100 },
            { name: 'xlarge', lines: 5000, rules: 500 },
            { name: 'xxlarge', lines: 10000, rules: 1000 }
        ];

        for (const size of sizes) {
            const grammarPath = path.join(this.testDataDir, `${size.name}-grammar.langium`);
            if (!await fs.pathExists(grammarPath)) {
                await this.generateTestGrammar(grammarPath, size.lines, size.rules);
            }
        }
        
        console.log(chalk.green('✓ Test data ready'));
    }

    /**
     * Generate a test grammar file
     */
    async generateTestGrammar(filePath, totalLines, ruleCount) {
        let content = `grammar TestGrammar\n\n`;
        content += `import "classpath:/types.langium"\n\n`;
        
        // Generate rules
        for (let i = 0; i < ruleCount; i++) {
            const ruleName = `Rule${i}`;
            content += `${ruleName} returns ${ruleName}:\n`;
            content += `    name=ID\n`;
            content += `    ('extends' superType=ID)?\n`;
            content += `    '{'\n`;
            content += `        (properties+=Property)*\n`;
            content += `    '}';\n\n`;
        }
        
        // Add property rule
        content += `Property returns Property:\n`;
        content += `    name=ID ':' type=ID ('=' defaultValue=STRING)?;\n\n`;
        
        // Pad to reach target line count
        const currentLines = content.split('\n').length;
        const additionalLines = Math.max(0, totalLines - currentLines);
        
        for (let i = 0; i < additionalLines; i++) {
            content += `// Generated comment line ${i}\n`;
        }
        
        await fs.writeFile(filePath, content);
    }

    /**
     * Benchmark grammar parsing performance
     */
    async benchmarkGrammarParsing() {
        console.log(chalk.cyan('\n📝 Benchmarking grammar parsing...'));
        
        const { StreamingGrammarParser } = await import('../src/performance/streaming-parser.js');
        const { PerformanceMonitor } = await import('../src/performance/monitor.js');
        
        const monitor = new PerformanceMonitor({ profileMode: true });
        const parser = new StreamingGrammarParser({}, monitor);
        
        const testFiles = [
            'small-grammar.langium',
            'medium-grammar.langium', 
            'large-grammar.langium',
            'xlarge-grammar.langium',
            'xxlarge-grammar.langium'
        ];

        for (const fileName of testFiles) {
            const filePath = path.join(this.testDataDir, fileName);
            if (!await fs.pathExists(filePath)) continue;
            
            const stats = await fs.stat(filePath);
            const fileSize = stats.size;
            
            console.log(`  Testing ${fileName} (${this.formatBytes(fileSize)})...`);
            
            const startTime = performance.now();
            const startMemory = process.memoryUsage();
            
            try {
                await parser.parseFile(filePath);
                
                const endTime = performance.now();
                const endMemory = process.memoryUsage();
                const duration = endTime - startTime;
                const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
                
                this.results.push({
                    category: 'grammar-parsing',
                    test: fileName,
                    duration,
                    memoryUsage: endMemory.heapUsed,
                    memoryDelta,
                    fileSize,
                    success: true
                });
                
                console.log(`    ✓ ${duration.toFixed(1)}ms (${this.formatBytes(memoryDelta)} memory)`);
                
            } catch (error) {
                console.log(`    ✗ Failed: ${error.message}`);
                this.results.push({
                    category: 'grammar-parsing',
                    test: fileName,
                    duration: 0,
                    memoryUsage: 0,
                    memoryDelta: 0,
                    fileSize,
                    success: false,
                    error: error.message
                });
            }
        }
    }

    /**
     * Benchmark template generation performance
     */
    async benchmarkTemplateGeneration() {
        console.log(chalk.cyan('\n🎨 Benchmarking template generation...'));
        
        const { GLSPGenerator } = await import('../src/generator.js');
        
        const templateCounts = [5, 10, 25, 50, 100];
        
        for (const count of templateCounts) {
            console.log(`  Testing with ${count} templates...`);
            
            const startTime = performance.now();
            const startMemory = process.memoryUsage();
            
            try {
                // Create a minimal test setup
                const generator = new GLSPGenerator();
                const grammarPath = path.join(this.testDataDir, 'medium-grammar.langium');
                const outputPath = path.join(this.outputDir, `template-test-${count}`);
                
                await generator.generateExtension(grammarPath, outputPath);
                
                const endTime = performance.now();
                const endMemory = process.memoryUsage();
                const duration = endTime - startTime;
                const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
                
                this.results.push({
                    category: 'template-generation',
                    test: `${count}-templates`,
                    duration,
                    memoryUsage: endMemory.heapUsed,
                    memoryDelta,
                    templateCount: count,
                    success: true
                });
                
                console.log(`    ✓ ${duration.toFixed(1)}ms (${this.formatBytes(memoryDelta)} memory)`);
                
                // Cleanup
                await fs.remove(outputPath);
                
            } catch (error) {
                console.log(`    ✗ Failed: ${error.message}`);
                this.results.push({
                    category: 'template-generation',
                    test: `${count}-templates`,
                    duration: 0,
                    memoryUsage: 0,
                    memoryDelta: 0,
                    templateCount: count,
                    success: false,
                    error: error.message
                });
            }
        }
    }

    /**
     * Benchmark memory usage patterns
     */
    async benchmarkMemoryUsage() {
        console.log(chalk.cyan('\n🧠 Benchmarking memory usage...'));
        
        const { MemoryManager } = await import('../src/performance/memory-manager.js');
        
        const memoryManager = new MemoryManager();
        
        // Test object pooling
        console.log('  Testing object pooling...');
        const startTime = performance.now();
        
        const pool = memoryManager.createPool(
            'test-objects',
            () => ({ data: new Array(1000).fill(0) }),
            (obj) => obj.data.fill(0),
            100
        );
        
        // Allocate and deallocate objects
        const objects = [];
        for (let i = 0; i < 1000; i++) {
            objects.push(pool.allocate());
        }
        
        for (const obj of objects) {
            pool.deallocate(obj);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.results.push({
            category: 'memory-usage',
            test: 'object-pooling',
            duration,
            memoryUsage: process.memoryUsage().heapUsed,
            success: true
        });
        
        console.log(`    ✓ Object pooling: ${duration.toFixed(1)}ms`);
        
        // Test memory estimation
        console.log('  Testing memory estimation...');
        const testObjects = [
            { type: 'small-object', data: { name: 'test', value: 42 } },
            { type: 'large-object', data: new Array(10000).fill('data') },
            { type: 'complex-object', data: { 
                arrays: [new Array(100).fill(0), new Array(200).fill(1)],
                objects: { nested: { deep: { value: 'test' } } },
                strings: 'long string '.repeat(100)
            }}
        ];
        
        for (const testObj of testObjects) {
            const estimatedSize = memoryManager.estimateSize(testObj.data);
            console.log(`    • ${testObj.type}: ${this.formatBytes(estimatedSize)}`);
            
            this.results.push({
                category: 'memory-usage',
                test: `estimation-${testObj.type}`,
                estimatedSize,
                success: true
            });
        }
    }

    /**
     * Benchmark cache performance
     */
    async benchmarkCachePerformance() {
        console.log(chalk.cyan('\n💾 Benchmarking cache performance...'));
        
        const { AdvancedCacheManager } = await import('../src/performance/cache-manager.js');
        
        const cacheManager = new AdvancedCacheManager({
            maxSize: 50 * 1024 * 1024, // 50MB
            maxEntries: 1000,
            ttl: 3600 // 1 hour
        });
        
        // Test cache hit/miss performance
        const testData = [];
        for (let i = 0; i < 1000; i++) {
            testData.push({
                path: `/test/file${i}.ts`,
                content: `Test content ${i}`.repeat(100)
            });
        }
        
        console.log('  Testing cache writes...');
        const writeStartTime = performance.now();
        
        for (const item of testData) {
            cacheManager.cacheTemplate(item.path, { template: () => item.content });
        }
        
        const writeEndTime = performance.now();
        const writeDuration = writeEndTime - writeStartTime;
        
        console.log('  Testing cache reads...');
        const readStartTime = performance.now();
        let hits = 0;
        
        for (const item of testData) {
            const cached = cacheManager.getCompiledTemplate(item.path);
            if (cached) hits++;
        }
        
        const readEndTime = performance.now();
        const readDuration = readEndTime - readStartTime;
        const hitRate = hits / testData.length;
        
        this.results.push({
            category: 'cache-performance',
            test: 'write-performance',
            duration: writeDuration,
            operationsPerSecond: testData.length / (writeDuration / 1000),
            success: true
        });
        
        this.results.push({
            category: 'cache-performance',
            test: 'read-performance',
            duration: readDuration,
            hitRate,
            operationsPerSecond: testData.length / (readDuration / 1000),
            success: true
        });
        
        console.log(`    ✓ Write: ${writeDuration.toFixed(1)}ms (${(testData.length / (writeDuration / 1000)).toFixed(0)} ops/s)`);
        console.log(`    ✓ Read: ${readDuration.toFixed(1)}ms, ${(hitRate * 100).toFixed(1)}% hit rate`);
    }

    /**
     * Benchmark parallel processing performance
     */
    async benchmarkParallelProcessing() {
        console.log(chalk.cyan('\n⚡ Benchmarking parallel processing...'));
        
        // Simulate CPU-intensive work
        const workItems = [];
        for (let i = 0; i < 100; i++) {
            workItems.push({
                id: i,
                data: new Array(1000).fill(0).map((_, j) => i * 1000 + j)
            });
        }
        
        // Serial processing
        console.log('  Testing serial processing...');
        const serialStartTime = performance.now();
        
        const serialResults = [];
        for (const item of workItems) {
            serialResults.push(this.processCPUIntensiveWork(item));
        }
        
        const serialEndTime = performance.now();
        const serialDuration = serialEndTime - serialStartTime;
        
        // Parallel processing simulation
        console.log('  Testing parallel processing...');
        const parallelStartTime = performance.now();
        
        const chunkSize = Math.ceil(workItems.length / 4); // 4 chunks
        const chunks = [];
        for (let i = 0; i < workItems.length; i += chunkSize) {
            chunks.push(workItems.slice(i, i + chunkSize));
        }
        
        const parallelResults = await Promise.all(
            chunks.map(chunk => 
                Promise.resolve(chunk.map(item => this.processCPUIntensiveWork(item)))
            )
        );
        
        const parallelEndTime = performance.now();
        const parallelDuration = parallelEndTime - parallelStartTime;
        const efficiency = serialDuration / parallelDuration;
        
        this.results.push({
            category: 'parallel-processing',
            test: 'serial-vs-parallel',
            serialDuration,
            parallelDuration,
            efficiency,
            speedup: efficiency,
            success: true
        });
        
        console.log(`    ✓ Serial: ${serialDuration.toFixed(1)}ms`);
        console.log(`    ✓ Parallel: ${parallelDuration.toFixed(1)}ms`);
        console.log(`    ✓ Speedup: ${efficiency.toFixed(2)}x`);
    }

    /**
     * Simulate CPU-intensive work
     */
    processCPUIntensiveWork(item) {
        let sum = 0;
        for (const value of item.data) {
            sum += Math.sqrt(value) * Math.sin(value / 1000);
        }
        return { id: item.id, result: sum };
    }

    /**
     * Generate benchmark report
     */
    async generateReport() {
        console.log(chalk.cyan('\n📊 Generating benchmark report...'));
        
        const report = {
            timestamp: new Date().toISOString(),
            system: {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                cpuCount: require('os').cpus().length,
                totalMemory: require('os').totalmem(),
                freeMemory: require('os').freemem()
            },
            results: this.results,
            summary: this.generateSummary()
        };
        
        // Save JSON report
        const jsonPath = path.join(this.outputDir, 'benchmark-report.json');
        await fs.writeJson(jsonPath, report, { spaces: 2 });
        
        // Save HTML report
        const htmlPath = path.join(this.outputDir, 'benchmark-report.html');
        await this.generateHtmlReport(htmlPath, report);
        
        // Print summary
        this.printSummary(report.summary);
        
        console.log(chalk.green(`\n✓ Reports saved:`));
        console.log(chalk.gray(`  JSON: ${jsonPath}`));
        console.log(chalk.gray(`  HTML: ${htmlPath}`));
    }

    /**
     * Generate benchmark summary
     */
    generateSummary() {
        const categories = {};
        
        for (const result of this.results) {
            if (!categories[result.category]) {
                categories[result.category] = {
                    totalTests: 0,
                    successfulTests: 0,
                    totalDuration: 0,
                    averageDuration: 0,
                    totalMemory: 0,
                    averageMemory: 0
                };
            }
            
            const cat = categories[result.category];
            cat.totalTests++;
            
            if (result.success) {
                cat.successfulTests++;
                cat.totalDuration += result.duration || 0;
                cat.totalMemory += result.memoryUsage || 0;
            }
        }
        
        // Calculate averages
        for (const category of Object.values(categories)) {
            if (category.successfulTests > 0) {
                category.averageDuration = category.totalDuration / category.successfulTests;
                category.averageMemory = category.totalMemory / category.successfulTests;
            }
        }
        
        return categories;
    }

    /**
     * Print benchmark summary
     */
    printSummary(summary) {
        console.log(chalk.blue.bold('\n📈 Benchmark Summary'));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        for (const [category, stats] of Object.entries(summary)) {
            console.log(chalk.cyan(`\n${category}:`));
            console.log(`  Tests: ${stats.successfulTests}/${stats.totalTests} passed`);
            
            if (stats.averageDuration > 0) {
                console.log(`  Avg Duration: ${stats.averageDuration.toFixed(1)}ms`);
            }
            
            if (stats.averageMemory > 0) {
                console.log(`  Avg Memory: ${this.formatBytes(stats.averageMemory)}`);
            }
        }
    }

    /**
     * Generate HTML report
     */
    async generateHtmlReport(filePath, report) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>GLSP Generator Benchmark Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .category { margin: 20px 0; }
        .test { background: #fff; border: 1px solid #dee2e6; border-radius: 4px; margin: 10px 0; padding: 15px; }
        .success { border-left: 4px solid #28a745; }
        .failure { border-left: 4px solid #dc3545; }
        .metric { display: inline-block; margin: 5px 15px 5px 0; }
        .metric-label { font-weight: bold; color: #6c757d; }
        .metric-value { color: #495057; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <h1>GLSP Generator Benchmark Report</h1>
    <p>Generated on ${report.timestamp}</p>
    
    <div class="summary">
        <h2>System Information</h2>
        <table>
            <tr><td>Platform</td><td>${report.system.platform} ${report.system.arch}</td></tr>
            <tr><td>Node.js</td><td>${report.system.nodeVersion}</td></tr>
            <tr><td>CPU Cores</td><td>${report.system.cpuCount}</td></tr>
            <tr><td>Total Memory</td><td>${this.formatBytes(report.system.totalMemory)}</td></tr>
        </table>
    </div>
    
    ${Object.entries(report.summary).map(([category, stats]) => `
        <div class="category">
            <h2>${category}</h2>
            <div class="summary">
                <span class="metric">
                    <span class="metric-label">Tests:</span>
                    <span class="metric-value">${stats.successfulTests}/${stats.totalTests}</span>
                </span>
                ${stats.averageDuration > 0 ? `
                    <span class="metric">
                        <span class="metric-label">Avg Duration:</span>
                        <span class="metric-value">${stats.averageDuration.toFixed(1)}ms</span>
                    </span>
                ` : ''}
                ${stats.averageMemory > 0 ? `
                    <span class="metric">
                        <span class="metric-label">Avg Memory:</span>
                        <span class="metric-value">${this.formatBytes(stats.averageMemory)}</span>
                    </span>
                ` : ''}
            </div>
            
            ${report.results.filter(r => r.category === category).map(result => `
                <div class="test ${result.success ? 'success' : 'failure'}">
                    <h4>${result.test}</h4>
                    ${result.success ? `
                        ${result.duration ? `<span class="metric"><span class="metric-label">Duration:</span> <span class="metric-value">${result.duration.toFixed(1)}ms</span></span>` : ''}
                        ${result.memoryUsage ? `<span class="metric"><span class="metric-label">Memory:</span> <span class="metric-value">${this.formatBytes(result.memoryUsage)}</span></span>` : ''}
                        ${result.hitRate ? `<span class="metric"><span class="metric-label">Hit Rate:</span> <span class="metric-value">${(result.hitRate * 100).toFixed(1)}%</span></span>` : ''}
                        ${result.speedup ? `<span class="metric"><span class="metric-label">Speedup:</span> <span class="metric-value">${result.speedup.toFixed(2)}x</span></span>` : ''}
                    ` : `
                        <div style="color: #dc3545;">Error: ${result.error}</div>
                    `}
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;
        
        await fs.writeFile(filePath, html);
    }

    /**
     * Format bytes in human-readable format
     */
    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let value = bytes;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }

        return `${value.toFixed(1)}${units[unitIndex]}`;
    }
}

// Run benchmarks if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const suite = new BenchmarkSuite();
    suite.runAll().catch(console.error);
}

export { BenchmarkSuite };