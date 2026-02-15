"use strict";
/**
 * Output Formatters
 * Formats results for console and JSON output
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formatter = void 0;
const chalk_1 = __importDefault(require("chalk"));
class Formatter {
    formatConsole(result) {
        const lines = [];
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
    formatHeader(result) {
        return `
${chalk_1.default.bold.cyan('═'.repeat(60))}
${chalk_1.default.bold.cyan('  WORKFLOW HEALTH MONITOR PRO')}
${chalk_1.default.bold.cyan('═'.repeat(60))}
${chalk_1.default.gray('Platform:')} ${result.platform.toUpperCase()}
${chalk_1.default.gray('Repository:')} ${result.repository.owner}/${result.repository.name}
${chalk_1.default.gray('Analyzed at:')} ${result.timestamp.toISOString()}
`;
    }
    formatHealthScore(score) {
        const scoreColor = score.overall >= 80 ? 'green' : score.overall >= 60 ? 'yellow' : 'red';
        const scoreStr = chalk_1.default[scoreColor](`${score.overall}/100`);
        return `
${chalk_1.default.bold.cyan('─').repeat(60)}
${chalk_1.default.bold('  HEALTH SCORE')}
${chalk_1.default.bold.cyan('─').repeat(60)}
  Overall: ${scoreStr}
  
  ${chalk_1.default.gray('Reliability:')}  ${this.formatScoreBar(score.reliability)} ${score.reliability}%
  ${chalk_1.default.gray('Performance:')} ${this.formatScoreBar(score.performance)} ${score.performance}%
  ${chalk_1.default.gray('Efficiency:')}  ${this.formatScoreBar(score.efficiency)} ${score.efficiency}%
`;
    }
    formatScoreBar(value) {
        const filled = Math.round(value / 10);
        const empty = 10 - filled;
        const fillChar = chalk_1.default.green('█');
        const emptyChar = chalk_1.default.gray('░');
        return fillChar.repeat(filled) + emptyChar.repeat(empty);
    }
    formatStats(stats) {
        return `
${chalk_1.default.bold.cyan('─').repeat(60)}
${chalk_1.default.bold('  STATISTICS')}
${chalk_1.default.bold.cyan('─').repeat(60)}
  ${chalk_1.default.gray('Total Runs:')}      ${stats.totalRuns}
  ${chalk_1.default.green('Success Rate:')}   ${stats.successRate.toFixed(1)}%
  ${chalk_1.default.red('Failures:')}        ${stats.failedRuns}
  ${chalk_1.default.gray('Avg Duration:')}   ${this.formatDuration(stats.averageDuration)}
  ${chalk_1.default.gray('Avg Queue Time:')}  ${this.formatDuration(stats.averageQueueTime)}
`;
    }
    formatBottlenecks(bottlenecks) {
        if (bottlenecks.length === 0) {
            return `
${chalk_1.default.bold.cyan('─').repeat(60)}
${chalk_1.default.bold('  BOTTLENECKS')}
${chalk_1.default.bold.cyan('─').repeat(60)}
  ${chalk_1.default.green('✓ No significant bottlenecks detected')}
`;
        }
        const lines = [
            `
${chalk_1.default.bold.cyan('─').repeat(60)}
${chalk_1.default.bold('  BOTTLENECKS')} (${bottlenecks.length} found)
${chalk_1.default.bold.cyan('─').repeat(60)}
`,
        ];
        for (const bottleneck of bottlenecks.slice(0, 10)) {
            const severityIcon = bottleneck.severity === 'high' ? '🔴' : bottleneck.severity === 'medium' ? '🟡' : '🟢';
            const title = bottleneck.severity === 'high' ? chalk_1.default.red.bold(bottleneck.title) :
                bottleneck.severity === 'medium' ? chalk_1.default.yellow.bold(bottleneck.title) :
                    chalk_1.default.gray.bold(bottleneck.title);
            lines.push(`
  ${severityIcon} ${title}
     ${chalk_1.default.gray(bottleneck.description)}
     ${chalk_1.default.gray('Evidence:')} ${bottleneck.evidence}
     ${chalk_1.default.gray('Potential savings:')} ${this.formatDuration(bottleneck.potentialSavings)}
`);
        }
        return lines.join('');
    }
    formatRecommendations(recommendations) {
        if (recommendations.length === 0) {
            return `
${chalk_1.default.bold.cyan('─').repeat(60)}
${chalk_1.default.bold('  RECOMMENDATIONS')}
${chalk_1.default.bold.cyan('─').repeat(60)}
  ${chalk_1.default.green('✓ No recommendations at this time')}
`;
        }
        const lines = [
            `
${chalk_1.default.bold.cyan('─').repeat(60)}
${chalk_1.default.bold('  RECOMMENDATIONS')}
${chalk_1.default.bold.cyan('─').repeat(60)}
`,
        ];
        const priorityLabels = { high: '🔴 HIGH', medium: '🟡 MEDIUM', low: '🟢 LOW' };
        for (const rec of recommendations.slice(0, 10)) {
            lines.push(`
  ${chalk_1.default.bold(priorityLabels[rec.priority])} ${chalk_1.default.bold(rec.title)}
     ${chalk_1.default.gray(rec.description)}
     ${chalk_1.default.gray('Improvement:')} ${rec.estimatedImprovement}
     ${chalk_1.default.gray('Effort:')} ${rec.implementationEffort}
`);
            if (rec.codeSnippet) {
                lines.push(chalk_1.default.gray(`     Code example:\n`) + chalk_1.default.gray('     ') + rec.codeSnippet.split('\n').join('\n     ') + '\n');
            }
        }
        return lines.join('');
    }
    formatJSON(result) {
        return JSON.stringify(result, null, 2);
    }
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        }
        else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    }
}
exports.Formatter = Formatter;
//# sourceMappingURL=formatters.js.map