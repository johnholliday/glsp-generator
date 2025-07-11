// src/config/di/cli-container.ts
import { Container } from 'inversify';
import { TYPES } from './types.js';
import { ILogger, ILoggerFactory, LoggerFactory } from '../../utils/logger/index.js';
import { GLSPGenerator } from '../../generator.js';
import { LangiumGrammarParser } from '../../utils/langium-parser.js';
import { ConfigLoader } from '../config-loader.js';
import { GrammarLinter } from '../../validation/linter.js';
import { ValidationReporter } from '../../validation/reporter.js';
import { DocumentationGenerator } from '../../documentation/documentation-generator.js';
import { TypeSafetyGenerator } from '../../type-safety/index.js';
import { TestGenerator } from '../../test-generation/index.js';
import { CICDGenerator } from '../../cicd/index.js';
import { TemplateSystem } from '../../templates/index.js';
import { PerformanceOptimizer } from '../../performance/index.js';
import { MemoryManager } from '../../performance/memory-manager.js';
import { SystemInfoService } from '../../performance/services/system-info.service.js';
import { PerformanceMonitorAdapter } from '../../performance/services/performance-monitor.adapter.js';
import { IMemoryManager } from '../../performance/interfaces/memory-manager.interface.js';
import { ISystemInfoService } from '../../performance/interfaces/system-info.interface.js';
import { IPerformanceMonitor } from '../../performance/interfaces/performance-monitor.interface.js';
import { PerformanceConfig } from '../../performance/types.js';
import { getProjectRoot } from '../../utils/paths.js';
import path from 'path';
import fs from 'fs-extra';

export function setupContainer(): Container {
  const container = new Container({
    defaultScope: 'Singleton'
  });

  // Load package.json for version info
  const packageJsonPath = path.join(getProjectRoot(), 'package.json');
  const packageJson = fs.readJsonSync(packageJsonPath);

  container.bind(TYPES.PackageInfo).toConstantValue({
    version: packageJson.version,
    name: packageJson.name,
    description: packageJson.description
  });

  // Bind logger factory
  container.bind<ILoggerFactory>(TYPES.LoggerFactory)
    .to(LoggerFactory)
    .inSingletonScope();

  // Dynamic logger binding - creates component-specific loggers
  container.bind<ILogger>(TYPES.Logger).toDynamicValue((context: any) => {
    const factory = context.container.get(TYPES.LoggerFactory) as ILoggerFactory;
    return factory.createLogger('CLI');
  }).inTransientScope();

  // Bind core services
  container.bind(TYPES.ConfigLoader).to(ConfigLoader).inSingletonScope();
  container.bind(TYPES.LangiumGrammarParser).to(LangiumGrammarParser).inSingletonScope();

  // Bind validation services
  container.bind(TYPES.GrammarLinter).to(GrammarLinter).inSingletonScope();
  container.bind(TYPES.ValidationReporter).to(ValidationReporter).inSingletonScope();

  // Bind generation services
  container.bind(TYPES.DocumentationGenerator).to(DocumentationGenerator).inSingletonScope();
  container.bind(TYPES.TypeSafetyGenerator).to(TypeSafetyGenerator).inSingletonScope();
  container.bind(TYPES.TestGenerator).to(TestGenerator).inSingletonScope();
  container.bind(TYPES.CICDGenerator).to(CICDGenerator).inSingletonScope();
  container.bind(TYPES.TemplateSystem).to(TemplateSystem).inSingletonScope();
  container.bind(TYPES.PerformanceOptimizer).to(PerformanceOptimizer).inSingletonScope();

  // Bind performance configuration
  container.bind<PerformanceConfig>(TYPES.PerformanceConfig)
    .toConstantValue({
      enableParallelProcessing: true,
      enableStreaming: true,
      enableProgressIndicators: true,
      enableMemoryMonitoring: true,
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB default
      gcHints: true,
      profileMode: false
    });

  // Bind performance services
  container.bind<ISystemInfoService>(TYPES.ISystemInfoService)
    .to(SystemInfoService)
    .inSingletonScope();

  container.bind<IPerformanceMonitor>(TYPES.IPerformanceMonitor)
    .to(PerformanceMonitorAdapter)
    .inSingletonScope();

  container.bind<IMemoryManager>(TYPES.IMemoryManager)
    .to(MemoryManager)
    .inSingletonScope();

  // Bind concrete implementations for backward compatibility
  container.bind<MemoryManager>(TYPES.MemoryManager)
    .to(MemoryManager)
    .inSingletonScope();

  container.bind<SystemInfoService>(TYPES.SystemInfoService)
    .to(SystemInfoService)
    .inSingletonScope();

  // Bind main generator
  container.bind(TYPES.GLSPGenerator).to(GLSPGenerator).inSingletonScope();

  return container;
}