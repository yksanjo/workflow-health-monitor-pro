/**
 * Bottleneck Analyzer
 * Identifies performance bottlenecks in CI/CD workflows
 */
import { WorkflowRun, Bottleneck } from './types';
export declare class Analyzer {
    private slowJobThreshold;
    private failureRateThreshold;
    private sequentialThreshold;
    constructor(options?: {
        slowJobThreshold?: number;
        failureRateThreshold?: number;
    });
    analyze(runs: WorkflowRun[]): Bottleneck[];
    private findSlowJobs;
    private findFailurePatterns;
    private findSequentialJobs;
    private findQueueWaitIssues;
    private sortBySeverity;
    private sanitizeId;
    private formatDuration;
}
//# sourceMappingURL=analyzer.d.ts.map