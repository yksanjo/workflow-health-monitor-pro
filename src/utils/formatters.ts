/**
 * Output Formatters
 * Formats results for console and JSON output
 */

import chalk from 'chalk';
import { MonitorResult, Bottleneck, Recommendation, HealthScore, WorkflowStats, Severity } from '../types';

export class Formatter {
  formatConsole(result: MonitorResult): string {
    const lines: string[] = [];

    // Header
    lines.push(this.formatHeader(result));
    
    // Health Score
    lines.push(this.formatHealthScore(result.healthScore));
    
    // Stats Summary
    lines.push(this.formatStats(result.stats));
    
    // Bottlenecks
    lines.push(this.formatBottlenecks(result.bottlenecks));
    
    // Recommendations
    lines.push(this.formatRecommendations(result.recommendations));

    return lines.join('\n');
  }

  private formatHeader(result: MonitorResult): string {
    return `
${chalk.bold.cyan('═'.repeat(60))}
${chalk.bold.cyan('  WORKFLOW HEALTH MONITOR PRO')}
${chalk.bold.cyan('═'.repeat(60))}
${chalk.gray('Platform:')} ${result.platform.toUpperCase()}
${chalk.gray('Repository:')} ${result.repository.owner}/${result.repository.name}
${chalk.gray('Analyzed at:')} ${result.timestamp.toISOString()}
`;
  }

  private formatHealthScore(score: HealthScore): string {
    const scoreColor = score.overall >= 80 ? 'green' : score.overall >= 60 ? 'yellow' : 'red';
    const scoreStr = chalk[scoreColor](`${score.overall}/100`);

    return `
${chalk.bold.cyan('─').repeat(60)}
${chalk.bold('  HEALTH SCORE')}
${chalk.bold.cyan('─').repeat(60)}
  Overall: ${scoreStr}
  
  ${chalk.gray('Reliability:')}  ${this.formatScoreBar(score.reliability)} ${score.reliability}%
  ${chalk.gray('Performance:')} ${this.formatScoreBar(score.performance)} ${score.performance}%
  ${chalk.gray('Efficiency:')}  ${this.formatScoreBar(score.efficiency)} ${score.efficiency}%
`;
  }

  private formatScoreBar(value: number): string {
    const filled = Math.round(value / 10);
    const empty = 10 - filled;
    const fillChar = chalk.green('█');
    const emptyChar = chalk.gray('░');
    return fillChar.repeat(filled) + emptyChar.repeat(empty);
  }

  private formatStats(stats: WorkflowStats): string {
    return `
${chalk.bold.cyan('─').repeat(60)}
${chalk.bold('  STATISTICS')}
${chalk.bold.cyan('─').repeat(60)}
  ${chalk.gray('Total Runs:')}      ${stats.totalRuns}
  ${chalk.green('Success Rate:')}   ${stats.successRate.toFixed(1)}%
  ${chalk.red('Failures:')}        ${stats.failedRuns}
  ${chalk.gray('Avg Duration:')}   ${this.formatDuration(stats.averageDuration)}
  ${chalk.gray('Avg Queue Time:')}  ${this.formatDuration(stats.averageQueueTime)}
`;
  }

  private formatBottlenecks(bottlenecks: Bottleneck[]): string {
    if (bottlenecks.length === 0) {
      return `
${chalk.bold.cyan('─').repeat(60)}
${chalk.bold('  BOTTLENECKS')}
${chalk.bold.cyan('─').repeat(60)}
  ${chalk.green('✓ No significant bottlenecks detected')}
`;
    }

    const lines = [
      `
${chalk.bold.cyan('─').repeat(60)}
${chalk.bold('  BOTTLENECKS')} (${bottlenecks.length} found)
${chalk.bold.cyan('─').repeat(60)}
`,
    ];

    for (const bottleneck of bottlenecks.slice(0, 10)) {
      const severityIcon = bottleneck.severity === 'high' ? '🔴' : bottleneck.severity === 'medium' ? '🟡' : '🟢';
      const title = bottleneck.severity === 'high' ? chalk.red.bold(bottleneck.title) : 
                    bottleneck.severity === 'medium' ? chalk.yellow.bold(bottleneck.title) : 
                    chalk.gray.bold(bottleneck.title);

      lines.push(`
  ${severityIcon} ${title}
     ${chalk.gray(bottleneck.description)}
     ${chalk.gray('Evidence:')} ${bottleneck.evidence}
     ${chalk.gray('Potential savings:')} ${this.formatDuration(bottleneck.potentialSavings)}
`);
    }

    return lines.join('');
  }

  private formatRecommendations(recommendations: Recommendation[]): string {
    if (recommendations.length === 0) {
      return `
${chalk.bold.cyan('─').repeat(60)}
${chalk.bold('  RECOMMENDATIONS')}
${chalk.bold.cyan('─').repeat(60)}
  ${chalk.green('✓ No recommendations at this time')}
`;
    }

    const lines = [
      `
${chalk.bold.cyan('─').repeat(60)}
${chalk.bold('  RECOMMENDATIONS')}
${chalk.bold.cyan('─').repeat(60)}
`,
    ];

    const priorityLabels = { high: '🔴 HIGH', medium: '🟡 MEDIUM', low: '🟢 LOW' };

    for (const rec of recommendations.slice(0, 10)) {
      lines.push(`
  ${chalk.bold(priorityLabels[rec.priority])} ${chalk.bold(rec.title)}
     ${chalk.gray(rec.description)}
     ${chalk.gray('Improvement:')} ${rec.estimatedImprovement}
     ${chalk.gray('Effort:')} ${rec.implementationEffort}
`);
      
      if (rec.codeSnippet) {
        lines.push(chalk.gray(`     Code example:\n`) + chalk.gray('     ') + rec.codeSnippet.split('\n').join('\n     ') + '\n');
      }
    }

    return lines.join('');
  }

  formatJSON(result: MonitorResult): string {
    return JSON.stringify(result, null, 2);
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }
}
