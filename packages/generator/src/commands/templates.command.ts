import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import ora from 'ora';

interface TemplatesArgs {
  command?: string;
  query?: string;
  package?: string;
  version?: string;
  global?: boolean;
}

@injectable()
export class TemplatesCommand extends BaseCommand<TemplatesArgs> {
  readonly command = 'templates <command>';
  readonly describe = 'Manage template packages';

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.TemplateSystem) private readonly templateSystem: any
  ) {
    super(logger);
  }

  builder(yargs: Argv): Argv<TemplatesArgs> {
    return yargs
      .command(
        'list',
        'List installed template packages',
        {},
        async () => await this.handleList()
      )
      .command(
        'search <query>',
        'Search for template packages',
        (yargs) => {
          return yargs
            .positional('query', {
              describe: 'Search query',
              type: 'string'
            });
        },
        async (argv) => await this.handleSearch(argv.query as string)
      )
      .command(
        'install <package>',
        'Install a template package',
        (yargs) => {
          return yargs
            .positional('package', {
              describe: 'Package name',
              type: 'string'
            })
            .option('version', {
              describe: 'Package version',
              type: 'string'
            })
            .option('global', {
              alias: 'g',
              describe: 'Install globally',
              type: 'boolean',
              default: false
            });
        },
        async (argv) => await this.handleInstall(
          argv.package as string,
          argv.version,
          argv.global
        )
      )
      .command(
        'validate <package>',
        'Validate a template package',
        (yargs) => {
          return yargs
            .positional('package', {
              describe: 'Package name or path',
              type: 'string'
            });
        },
        async (argv) => await this.handleValidate(argv.package as string)
      )
      .demandCommand(1, 'You must specify a template command')
      .example('$0 templates list', 'List installed template packages')
      .example('$0 templates search glsp', 'Search for GLSP templates')
      .example('$0 templates install my-template', 'Install a template package')
      .example('$0 templates validate ./my-template', 'Validate a template package') as Argv<TemplatesArgs>;
  }

  async handler(_args: TemplatesArgs): Promise<void> {
    // This is handled by subcommands
  }

  private async handleList(): Promise<void> {
    try {
      const packages = await this.templateSystem.listPackages();

      if (packages.length === 0) {
        this.logger.warn('No template packages installed');
        return;
      }

      this.logger.info('Installed template packages:');
      packages.forEach((pkg: any) => {
        this.logger.info(`  - ${pkg.name}@${pkg.version}`);
        if (pkg.description) {
          this.logger.debug(`    ${pkg.description}`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to list packages', error);
      this.handleError(error);
    }
  }

  private async handleSearch(query: string): Promise<void> {
    try {
      if (!query) {
        this.logger.error('Search query is required');
        process.exit(1);
      }

      const packages = await this.templateSystem.searchPackages(query);

      if (packages.length === 0) {
        this.logger.warn(`No packages found for "${query}"`);
        return;
      }

      this.logger.info(`Found ${packages.length} package(s):`);
      packages.forEach((pkg: any) => {
        const status = pkg.installed ? 'installed' : 'not installed';
        this.logger.info(`  ${pkg.name}@${pkg.version} (${status})`);
        if (pkg.description) {
          this.logger.debug(`    ${pkg.description}`);
        }
      });
    } catch (error) {
      this.logger.error('Search failed', error);
      this.handleError(error);
    }
  }

  private async handleInstall(packageName: string, version?: string, global?: boolean): Promise<void> {
    try {
      if (!packageName) {
        this.logger.error('Package name is required');
        process.exit(1);
      }

      const spinner = ora(`Installing ${packageName}...`).start();
      await this.templateSystem.installPackage(packageName, {
        version,
        global
      });
      spinner.succeed(`Successfully installed ${packageName}`);
    } catch (error) {
      this.logger.error('Installation failed', error);
      this.handleError(error);
    }
  }

  private async handleValidate(packagePath: string): Promise<void> {
    try {
      if (!packagePath) {
        this.logger.error('Package name is required');
        process.exit(1);
      }

      const result = await this.templateSystem.validatePackage(packagePath);

      if (result.valid) {
        this.logger.info(`${packagePath} is valid`);
      } else {
        this.logger.error(`${packagePath} is invalid:`);
        result.errors.forEach((error: string) => {
          this.logger.error(`  - ${error}`);
        });
        process.exit(1);
      }
    } catch (error) {
      this.logger.error('Validation failed', error);
      this.handleError(error);
    }
  }
}