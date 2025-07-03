import { Container } from 'inversify';
import { TYPES } from './types.js';
import { ILogger, ILoggerFactory, LoggerFactory } from '../../utils/logger/index.js';
import { ConfigLoader } from '../config-loader.js';
import { LangiumGrammarParser } from '../../utils/langium-parser.js';
import { getProjectRoot } from '../../utils/paths.js';
import path from 'path';
import fs from 'fs-extra';

/**
 * Creates a minimal container for the CLI without requiring all services to be injectable
 */
export function setupMinimalContainer(): Container {
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

  // Only bind services that are ready for DI
  container.bind(TYPES.ConfigLoader).to(ConfigLoader).inSingletonScope();
  container.bind(TYPES.LangiumGrammarParser).to(LangiumGrammarParser).inSingletonScope();

  // Create GLSPGenerator factory that doesn't require all dependencies to be injectable
  container.bind(TYPES.GLSPGenerator).toDynamicValue(() => {
    // For minimal container, we'll create a simplified factory that returns null
    // This allows the CLI to work without requiring all DI dependencies
    return null;
  }).inSingletonScope();

  return container;
}