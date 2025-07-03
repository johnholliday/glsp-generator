import {
    Diagnostic,
    LinterRule,
    LinterContext,
    ValidationResult,
    DiagnosticSeverity
} from './types.js';
import { LinterConfig } from '../config/types.js';
import { DiagnosticFormatter } from './diagnostics.js';
import * as rules from './rules/index.js';
import {
    ILinterService,
    ILoggerService,
    IConfigurationService,
    ICacheService,
    IMetricsService,
    IEventService
} from '../config/di/interfaces.js';
import { injectable, inject, postConstruct, preDestroy, optional } from 'inversify';
import { TYPES } from '../config/di/types.inversify.js';
import { LogMethod } from '../utils/decorators/log-method.js';

/**
 * Grammar linter with comprehensive dependency injection support
 */
@injectable()
export class GrammarLinter implements ILinterService {
    private rules = new Map<string, LinterRule>();
    private config!: LinterConfig;
    private formatter!: DiagnosticFormatter;
    private initialized = false;

    constructor(
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
        @inject(TYPES.IConfigurationService) private readonly configService: IConfigurationService,
        @inject(TYPES.ICacheService) private readonly cache: ICacheService,
        @inject(TYPES.IMetricsService) private readonly metrics: IMetricsService,
        @inject(TYPES.IEventService) private readonly eventService: IEventService,
        @optional() @inject(TYPES.LinterConfig) config?: LinterConfig
    ) {
        this.logger.debug('GrammarLinter constructor called');
        this.config = config || this.getDefaultConfig();
    }

    @postConstruct()
    private _initialize(): void {
        this.logger.info('Initializing GrammarLinter');

        try {
            this.formatter = new DiagnosticFormatter();
            this.registerBuiltinRules();
            this.loadConfiguration();
            this.setupEventListeners();
            this.initialized = true;

            this.logger.info('GrammarLinter initialized successfully', {
                ruleCount: this.rules.size,
                configuredRules: Object.keys(this.config.rules).length
            });

            this.eventService.emit('linter.initialized', { ruleCount: this.rules.size });
        } catch (error) {
            this.logger.error('Failed to initialize GrammarLinter', error as Error);
            throw error;
        }
    }

    @preDestroy()
    private _cleanup(): void {
        this.logger.info('Cleaning up GrammarLinter resources');
        this.rules.clear();
        this.initialized = false;
        this.eventService.emit('linter.disposed');
    }

    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async lintGrammar(
        grammarFile: string,
        grammarContent: string,
        ast: any
    ): Promise<ValidationResult> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('linter.lint.attempts');

        try {
            this.logger.info('Starting grammar linting', { grammarFile });

            // Check cache first
            const cacheKey = `lint:${grammarFile}:${this.hashContent(grammarContent)}:${this.getConfigHash()}`;
            const cached = await this.cache.get<ValidationResult>(cacheKey);
            if (cached) {
                this.logger.debug('Returning cached linting result', { grammarFile });
                this.metrics.incrementCounter('linter.lint.cache_hits');
                return cached;
            }

            const lines = grammarContent.split('\n');
            const diagnostics: Diagnostic[] = [];

            // Create linter context
            const context: LinterContext = {
                grammarFile,
                grammarContent,
                lines,
                ast,
                reportDiagnostic: (diagnostic) => {
                    const fullDiagnostic: Diagnostic = {
                        severity: diagnostic.severity || 'error',
                        code: diagnostic.code || 'GLSP000',
                        message: diagnostic.message || 'Unknown error',
                        location: diagnostic.location || { file: grammarFile, line: 1, column: 1 },
                        source: diagnostic.source,
                        suggestions: diagnostic.suggestions,
                        documentation: diagnostic.documentation
                    };
                    diagnostics.push(fullDiagnostic);
                }
            };

            // Run each enabled rule
            const enabledRules = this.getEnabledRules();
            this.logger.debug('Running linting rules', {
                grammarFile,
                enabledRuleCount: enabledRules.length
            });

            for (const { ruleName, ruleConfig, rule } of enabledRules) {
                const ruleStartTime = performance.now();

                try {
                    // Determine severity and options
                    let severity: DiagnosticSeverity;
                    let _options: any = {};

                    if (Array.isArray(ruleConfig)) {
                        severity = ruleConfig[0] as DiagnosticSeverity;
                        _options = ruleConfig[1];
                    } else {
                        severity = ruleConfig as DiagnosticSeverity;
                    }

                    // Run the rule
                    const ruleDiagnostics = rule.validate(context);

                    // Apply configured severity
                    ruleDiagnostics.forEach(d => {
                        d.severity = severity;
                        diagnostics.push(d);
                    });

                    const ruleDuration = performance.now() - ruleStartTime;
                    this.metrics.recordDuration(`linter.rule.${ruleName}`, ruleDuration);
                    this.metrics.incrementCounter('linter.rule.success', { rule: ruleName });

                    this.logger.trace('Rule executed successfully', {
                        rule: ruleName,
                        diagnosticsFound: ruleDiagnostics.length,
                        duration: Math.round(ruleDuration)
                    });

                } catch (error) {
                    const ruleDuration = performance.now() - ruleStartTime;
                    this.metrics.recordDuration(`linter.rule.${ruleName}.error`, ruleDuration);
                    this.metrics.incrementCounter('linter.rule.errors', { rule: ruleName });

                    this.logger.error(`Error running rule ${ruleName}`, error as Error, {
                        grammarFile,
                        rule: ruleName
                    });

                    // Add error diagnostic
                    diagnostics.push({
                        severity: 'error',
                        code: 'LINTER001',
                        message: `Internal linter error in rule ${ruleName}: ${(error as Error).message}`,
                        location: { file: grammarFile, line: 1, column: 1 }
                    });
                }
            }

            // Sort diagnostics by location
            diagnostics.sort((a, b) => {
                if (a.location.line !== b.location.line) {
                    return a.location.line - b.location.line;
                }
                return a.location.column - b.location.column;
            });

            // Count by severity
            const errorCount = diagnostics.filter(d => d.severity === 'error').length;
            const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
            const infoCount = diagnostics.filter(d => d.severity === 'info').length;
            const hintCount = diagnostics.filter(d => d.severity === 'hint').length;

            const result: ValidationResult = {
                diagnostics,
                valid: errorCount === 0,
                errorCount,
                warningCount,
                infoCount,
                hintCount
            };

            // Cache the result
            await this.cache.set(cacheKey, result, 1800000); // 30 minutes TTL

            const duration = performance.now() - startTime;
            this.metrics.recordDuration('linter.lint', duration);
            this.metrics.incrementCounter('linter.lint.success');

            this.logger.info('Grammar linting completed', {
                grammarFile,
                valid: result.valid,
                errorCount,
                warningCount,
                infoCount,
                hintCount,
                totalDiagnostics: diagnostics.length,
                duration: Math.round(duration)
            });

            this.eventService.emit('linter.completed', {
                grammarFile,
                result,
                duration
            });

            return result;

        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('linter.lint.error', duration);
            this.metrics.incrementCounter('linter.lint.errors');

            this.logger.error('Grammar linting failed', error as Error, { grammarFile });
            this.eventService.emit('linter.error', { grammarFile, error });

            throw error;
        }
    }

    @LogMethod({ logArgs: false, logResult: false, logDuration: true })
    formatResults(result: ValidationResult, grammarFile: string, sourceLines?: string[]): string {
        this.ensureInitialized();

        try {
            this.logger.debug('Formatting linting results', {
                grammarFile,
                diagnosticCount: result.diagnostics.length
            });

            const parts: string[] = [];

            // Header
            parts.push(this.formatter.formatValidationHeader(grammarFile));

            // Format each diagnostic
            result.diagnostics.forEach(diagnostic => {
                parts.push(this.formatter.formatDiagnostic(diagnostic, sourceLines));
            });

            // Summary
            parts.push(this.formatter.formatSummary(result.diagnostics));

            // Footer
            parts.push(this.formatter.formatValidationFooter(!result.valid));

            const formatted = parts.join('\n');

            this.metrics.incrementCounter('linter.format.success');
            this.logger.debug('Results formatted successfully', {
                grammarFile,
                outputLength: formatted.length
            });

            return formatted;

        } catch (error) {
            this.metrics.incrementCounter('linter.format.errors');
            this.logger.error('Failed to format linting results', error as Error, { grammarFile });
            throw error;
        }
    }

    @LogMethod({ logArgs: true, logResult: false })
    updateConfig(config: Partial<LinterConfig>): void {
        this.ensureInitialized();

        try {
            this.logger.info('Updating linter configuration', {
                newRules: Object.keys(config.rules || {}).length
            });

            const oldConfig = { ...this.config };

            this.config = {
                ...this.config,
                ...config,
                rules: {
                    ...this.config.rules,
                    ...(config.rules || {})
                }
            };

            // Save to configuration service
            this.configService.set('linter', this.config);

            this.metrics.incrementCounter('linter.config.updates');

            this.logger.info('Linter configuration updated successfully', {
                totalRules: Object.keys(this.config.rules).length
            });

            this.eventService.emit('linter.config.updated', {
                oldConfig,
                newConfig: this.config
            });

        } catch (error) {
            this.metrics.incrementCounter('linter.config.errors');
            this.logger.error('Failed to update linter configuration', error as Error);
            throw error;
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('GrammarLinter not initialized. Call initialize() first.');
        }
    }

    private getDefaultConfig(): LinterConfig {
        return {
            rules: {
                'naming-conventions': 'error',
                'no-duplicate-properties': 'error',
                'no-circular-refs': 'warning',
                'no-undefined-types': 'error'
                // Additional rules will be enabled as they are implemented:
                // 'prefer-arrays-over-many': 'info',
                // 'max-inheritance-depth': ['warning', 5],
                // 'glsp-compatible-types': 'error',
                // 'no-empty-interfaces': 'warning',
                // 'consistent-property-types': 'info'
            }
        };
    }

    private registerBuiltinRules(): void {
        this.logger.debug('Registering built-in linting rules');

        try {
            // Register all built-in rules
            Object.values(rules).forEach(RuleClass => {
                const rule = new RuleClass();
                this.rules.set(rule.code, rule);
                this.logger.trace('Registered rule', { code: rule.code, name: rule.name });
            });

            this.logger.info('Built-in rules registered successfully', {
                ruleCount: this.rules.size
            });

        } catch (error) {
            this.logger.error('Failed to register built-in rules', error as Error);
            throw error;
        }
    }

    private loadConfiguration(): void {
        try {
            // Load configuration from configuration service
            const savedConfig = this.configService.get<LinterConfig>('linter');
            if (savedConfig) {
                this.config = {
                    ...this.config,
                    ...savedConfig,
                    rules: {
                        ...this.config.rules,
                        ...savedConfig.rules
                    }
                };

                this.logger.debug('Loaded saved linter configuration', {
                    ruleCount: Object.keys(this.config.rules).length
                });
            }
        } catch (error) {
            this.logger.warn('Failed to load saved configuration, using defaults', { error });
        }
    }

    private setupEventListeners(): void {
        // Listen for configuration changes
        this.eventService.on('config.changed', (data) => {
            if (data?.section === 'linter') {
                this.logger.debug('Configuration change detected, reloading');
                this.loadConfiguration();
            }
        });
    }

    private getEnabledRules(): Array<{ ruleName: string; ruleConfig: any; rule: LinterRule }> {
        const enabledRules: Array<{ ruleName: string; ruleConfig: any; rule: LinterRule }> = [];

        for (const [ruleName, ruleConfig] of Object.entries(this.config.rules)) {
            if (ruleConfig === 'off') continue;

            const rule = this.rules.get(ruleName);
            if (!rule) {
                this.logger.warn(`Unknown linter rule: ${ruleName}`);
                continue;
            }

            enabledRules.push({ ruleName, ruleConfig, rule });
        }

        return enabledRules;
    }

    private hashContent(content: string): string {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    private getConfigHash(): string {
        return this.hashContent(JSON.stringify(this.config));
    }
}