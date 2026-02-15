/**
 * Optimization Recommendations Engine
 * Generates actionable recommendations based on bottlenecks and workflow data
 */
import { WorkflowRun, Bottleneck, Recommendation } from './types';
export declare class RecommendationsEngine {
    generate(runs: WorkflowRun[], bottlenecks: Bottleneck[]): Recommendation[];
    private getRecommendationsForBottleneck;
    private getSlowJobRecommendations;
    private getFailureRecommendations;
    private getParallelizationRecommendations;
    private getQueueWaitRecommendations;
    private getGeneralRecommendations;
    private sortByPriority;
    private getCachingExample;
    private getRetryExample;
    private getParallelExample;
}
//# sourceMappingURL=recommendations.d.ts.map