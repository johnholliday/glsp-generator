/**
 * Bridge container that combines old and new DI configurations
 * @module config/di
 */

import { Container } from 'inversify';
import { TYPES } from './types.js';
import { ILogger, ILoggerFactory, LoggerFactory } from '../../utils/logger/index.js';
import { ConfigLoader } from '../config-loader.js';
import { LangiumGrammarParser } from '../../utils/langium-parser.js';
import { getProjectRoot } from '../../utils/paths.js';
import { GenerateCommandAdapter } from '../../commands/base/GenerateCommandAdapter.js';
import path from 'path';
import fs from 'fs-extra';

/**
 * Creates a bridge container that provides backward compatibility
 * while using the new architecture internally
 */
export function setupBridgeContainer(): Container {
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

  // Dynamic logger binding
  container.bind<ILogger>(TYPES.Logger).toDynamicValue((context: any) => {
    const factory = context.container.get(TYPES.LoggerFactory) as ILoggerFactory;
    return factory.createLogger('CLI');
  }).inTransientScope();

  // Bind existing services
  container.bind(TYPES.ConfigLoader).to(ConfigLoader).inSingletonScope();
  container.bind(TYPES.LangiumGrammarParser).to(LangiumGrammarParser).inSingletonScope();

  // Bind GLSPGenerator to use the adapter
  container.bind(TYPES.GLSPGenerator).toDynamicValue((context) => {
    const logger = container.get<ILogger>(TYPES.Logger);
    return new GenerateCommandAdapter(logger);
  }).inSingletonScope();

  // Bind new architecture services as needed
  // These can be gradually added as we migrate more components
  
  return container;
}