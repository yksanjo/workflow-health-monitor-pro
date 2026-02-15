/**
 * Output Formatters
 * Formats results for console and JSON output
 */
import { MonitorResult } from '../types';
export declare class Formatter {
    formatConsole(result: MonitorResult): string;
    private formatHeader;
    private formatHealthScore;
    private formatScoreBar;
    private formatStats;
    private formatBottlenecks;
    private formatRecommendations;
    formatJSON(result: MonitorResult): string;
    formatDuration(seconds: number): string;
}
//# sourceMappingURL=formatters.d.ts.map