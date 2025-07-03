import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import { GLSPGenerator } from '../generator.js';
import { ConfigLoader } from '../config/config-loader.js';
import { getUserProjectRoot } from '../utils/paths.js';

interface CICDArgs {
  grammar?: string;
  output?: string;
  workflows?: boolean;
  scripts?: boolean;
  platforms?: string[];
  'node-versions'?: string[];
  'publish-npm'?: boolean;
  'publish-ovsx'?: boolean;
  docker?: boolean;
  'semantic-release'?: boolean;
  config?: string;
}

@injectable()
export class CICDCommand extends BaseCommand<CICDArgs> {
  readonly command = ['cicd <grammar> [output]', 'ci'];
  readonly describe = 'Generate CI/CD configuration from Langium grammar';
  readonly aliases = ['ci'];

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.GLSPGenerator) private readonly generator: GLSPGenerator,
    @inject(TYPES.ConfigLoader) private readonly configLoader: ConfigLoader
  ) {
    super(logger);
  }

  builder(yargs: Argv): Argv<CICDArgs> {
    return yargs
      .positional('grammar', {
        describe: 'Langium grammar file',
        type: 'string',
        normalize: true
      })
      .positional('output', {
        describe: 'Output directory',
        type: 'string',
        default: '.',
        normalize: true
      })
      .option('workflows', {
        describe: 'Generate GitHub Actions workflows',
        type: 'boolean',
        default: true
      })
      .option('scripts', {
        describe: 'Generate release scripts',
        type: 'boolean',
        default: true
      })
      .option('platforms', {
        describe: 'CI platforms to target',
        type: 'array',
        choices: ['ubuntu-latest', 'windows-latest', 'macos-latest'],
        default: ['ubuntu-latest', 'windows-latest']
      })
      .option('node-versions', {
        describe: 'Node.js versions for CI',
        type: 'array',
        default: ['16.x', '18.x', '20.x']
      })
      .option('publish-npm', {
        describe: 'Include npm publishing',
        type: 'boolean',
        default: true
      })
      .option('publish-ovsx', {
        describe: 'Include Open VSX publishing',
        type: 'boolean',
        default: true
      })
      .option('docker', {
        describe: 'Include Docker support',
        type: 'boolean',
        default: true
      })
      .option('semantic-release', {
        describe: 'Use semantic-release',
        type: 'boolean',
        default: false
      })
      .option('config', {
        alias: 'c',
        describe: 'Configuration file',
        type: 'string'
      })
      .example('$0 cicd grammar.langium', 'Generate all CI/CD files')
      .example('$0 cicd grammar.langium --platforms ubuntu-latest', 'Ubuntu only')
      .example('$0 cicd grammar.langium --semantic-release', 'Use semantic-release') as Argv<CICDArgs>;
  }

  async handler(args: CICDArgs): Promise<void> {
    try {
      this.logger.info('Starting CI/CD configuration generation');

      const grammarFile = args.grammar;
      if (!grammarFile) {
        throw new Error('Grammar file is required');
      }

      await this.checkFileExists(grammarFile, 'Grammar');

      // Load configuration if specified
      if (args.config) {
        await this.configLoader.loadConfig(getUserProjectRoot(), args.config);
      }

      const cicdOptions = {
        platforms: args.platforms as string[],
        nodeVersions: args['node-versions'] as string[],
        publishTargets: [
          ...(args['publish-npm'] ? ['npm' as const] : []),
          ...(args['publish-ovsx'] ? ['ovsx' as const] : [])
        ],
        containerSupport: args.docker,
        workflows: {
          generateBuildWorkflow: args.workflows,
          generateReleaseWorkflow: args.workflows,
          generateSecurityWorkflow: args.workflows,
          generateDependencyUpdateWorkflow: args.workflows,
          generateNightlyWorkflow: args.workflows
        },
        releaseScripts: {
          generateVersionScripts: args.scripts,
          generateChangelogScripts: args.scripts,
          generatePublishScripts: args.scripts,
          generateReleaseScript: args.scripts,
          semanticRelease: args['semantic-release']
        }
      };

      await this.generator.generateCICD(grammarFile, args.output!, cicdOptions);

      this.logger.info('CI/CD configuration generated successfully');
      this.logger.info('Next steps:');
      this.logger.info('1. Add secrets to your GitHub repository:');
      this.logger.info('   - NPM_TOKEN (for npm publishing)');
      this.logger.info('   - OVSX_TOKEN (for Open VSX publishing)');
      this.logger.info('   - CODECOV_TOKEN (for coverage reports)');
      this.logger.info('2. Enable branch protection rules');
      this.logger.info('3. Configure Dependabot/Renovate');

    } catch (error) {
      this.handleError(error);
    }
  }
}