import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import _path from 'path';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import { GLSPGenerator } from '../generator.js';
import { PerformanceOptimizer } from '../performance/index.js';
import ora from 'ora';

interface ProfileArgs {
  grammar?: string;
  output?: string;
  report?: string;
  format?: 'json' | 'html' | 'text';
}

@injectable()
export class ProfileCommand extends BaseCommand<ProfileArgs> {
  readonly command = 'profile <grammar> [output]';
  readonly describe = 'Profile grammar generation performance';

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.GLSPGenerator) private readonly generator: GLSPGenerator,
    @inject(TYPES.PerformanceOptimizer) private readonly performanceOptimizer: PerformanceOptimizer
  ) {
    super(logger);
  }

  builder(yargs: Argv): Argv<ProfileArgs> {
    return yargs
      .positional('grammar', {
        describe: 'Langium grammar file',
        type: 'string'
      })
      .positional('output', {
        describe: 'Output directory',
        type: 'string',
        default: './profile-output'
      })
      .option('report', {
        alias: 'r',
        describe: 'Generate performance report',
        type: 'string',
        default: './performance-report.json'
      })
      .option('format', {
        alias: 'f',
        describe: 'Report format',
        choices: ['json', 'html', 'text'] as const,
        default: 'json'
      })
      .example('$0 profile grammar.langium', 'Profile grammar generation')
      .example('$0 profile grammar.langium -r report.html -f html', 'Generate HTML report') as Argv<ProfileArgs>;
  }

  async handler(args: ProfileArgs): Promise<void> {
    try {
      this.logger.info('Starting grammar generation profiling');

      if (!args.grammar) {
        throw new Error('Grammar parameter is required');
      }

      await this.checkFileExists(args.grammar, 'Grammar');

      const spinner = ora('Profiling generation...').start();

      // Create performance config with profiling enabled
      const perfConfig = {
        enableParallelProcessing: true,
        enableStreaming: true,
        enableProgressIndicators: true,
        enableMemoryMonitoring: true,
        profileMode: true
      };

      // Start profiling
      const profileSession = this.createProfileSession();
      profileSession.start();

      try {
        // Generate with profiling
        const startTime = performance.now();
        await this.generator.generateExtension(args.grammar, args.output!, {
          performanceOptions: perfConfig
        });
        const endTime = performance.now();

        spinner.succeed('Profiling completed');

        // Collect metrics
        const metrics = {
          totalTime: endTime - startTime,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          ...profileSession.getMetrics()
        };

        // Generate report
        const monitor = this.performanceOptimizer.getMonitor();
        if (monitor && typeof monitor.saveReport === 'function') {
          await monitor.saveReport(args.report!, args.format!);
          this.logger.info('Performance report saved', { path: args.report });
        } else {
          // Fallback: save basic metrics
          await this.saveBasicReport(args.report!, args.format!, metrics);
        }

        // Display summary
        this.logger.info('Profiling Summary:');
        this.logger.info(`  Total time: ${metrics.totalTime.toFixed(2)}ms`);
        this.logger.info(`  Memory used: ${this.formatBytes(metrics.memoryUsage.heapUsed)}`);
        this.logger.info(`  Peak memory: ${this.formatBytes(metrics.memoryUsage.heapTotal)}`);

        // Show optimization recommendations
        const recommendations = this.performanceOptimizer.getOptimizationRecommendations();
        if (recommendations && recommendations.length > 0) {
          this.logger.info('Performance Recommendations:');
          recommendations.forEach(rec => this.logger.info(`  - ${rec}`));
        }

      } finally {
        profileSession.stop();
      }

    } catch (error) {
      this.handleError(error);
    }
  }

  private createProfileSession() {
    const metrics: any = {
      phases: {},
      currentPhase: null,
      phaseStart: 0
    };

    return {
      start: () => {
        metrics.startTime = performance.now();
        metrics.startMemory = process.memoryUsage();
      },

      startPhase: (phase: string) => {
        metrics.currentPhase = phase;
        metrics.phaseStart = performance.now();
      },

      endPhase: () => {
        if (metrics.currentPhase) {
          metrics.phases[metrics.currentPhase] = performance.now() - metrics.phaseStart;
          metrics.currentPhase = null;
        }
      },

      stop: () => {
        metrics.endTime = performance.now();
        metrics.endMemory = process.memoryUsage();
      },

      getMetrics: () => ({
        duration: metrics.endTime - metrics.startTime,
        phases: metrics.phases,
        memoryDelta: {
          heapUsed: metrics.endMemory.heapUsed - metrics.startMemory.heapUsed,
          heapTotal: metrics.endMemory.heapTotal - metrics.startMemory.heapTotal
        }
      })
    };
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(1)}${units[unitIndex]}`;
  }

  private async saveBasicReport(reportPath: string, format: string, metrics: any): Promise<void> {
    const fs = await import('fs-extra');

    switch (format) {
      case 'json':
        await fs.writeJson(reportPath, metrics, { spaces: 2 });
        break;

      case 'text':
        const textReport = this.formatTextReport(metrics);
        await fs.writeFile(reportPath, textReport);
        break;

      case 'html':
        const htmlReport = this.formatHtmlReport(metrics);
        await fs.writeFile(reportPath, htmlReport);
        break;
    }

    this.logger.info('Report saved to:', { path: reportPath });
  }

  private formatTextReport(metrics: any): string {
    let report = 'GLSP Generator Performance Report\n';
    report += '=================================\n\n';
    report += `Total Time: ${metrics.totalTime.toFixed(2)}ms\n`;
    report += `Memory Used: ${this.formatBytes(metrics.memoryUsage.heapUsed)}\n`;
    report += `Peak Memory: ${this.formatBytes(metrics.memoryUsage.heapTotal)}\n`;

    if (metrics.phases) {
      report += '\nPhase Breakdown:\n';
      Object.entries(metrics.phases).forEach(([phase, time]) => {
        report += `  ${phase}: ${time}ms\n`;
      });
    }

    return report;
  }

  private formatHtmlReport(metrics: any): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>GLSP Generator Performance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .metric { margin: 10px 0; }
    .label { font-weight: bold; }
    table { border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>GLSP Generator Performance Report</h1>
  <div class="metric">
    <span class="label">Total Time:</span> ${metrics.totalTime.toFixed(2)}ms
  </div>
  <div class="metric">
    <span class="label">Memory Used:</span> ${this.formatBytes(metrics.memoryUsage.heapUsed)}
  </div>
  <div class="metric">
    <span class="label">Peak Memory:</span> ${this.formatBytes(metrics.memoryUsage.heapTotal)}
  </div>
  ${metrics.phases ? `
  <h2>Phase Breakdown</h2>
  <table>
    <tr><th>Phase</th><th>Duration (ms)</th></tr>
    ${Object.entries(metrics.phases).map(([phase, time]) =>
      `<tr><td>${phase}</td><td>${time}</td></tr>`
    ).join('')}
  </table>
  ` : ''}
</body>
</html>`;
  }
}