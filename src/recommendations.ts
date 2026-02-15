/**
 * Optimization Recommendations Engine
 * Generates actionable recommendations based on bottlenecks and workflow data
 */

import { WorkflowRun, Bottleneck, Recommendation, RecommendationCategory, RecommendationPriority } from './types';

export class RecommendationsEngine {
  generate(runs: WorkflowRun[], bottlenecks: Bottleneck[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Generate recommendations based on bottlenecks
    for (const bottleneck of bottlenecks) {
      const recs = this.getRecommendationsForBottleneck(bottleneck, runs);
      recommendations.push(...recs);
    }

    // Add general optimization recommendations
    const generalRecs = this.getGeneralRecommendations(runs);
    recommendations.push(...generalRecs);

    // Sort by priority
    return this.sortByPriority(recommendations);
  }

  private getRecommendationsForBottleneck(bottleneck: Bottleneck, runs: WorkflowRun[]): Recommendation[] {
    switch (bottleneck.type) {
      case 'slow_job':
        return this.getSlowJobRecommendations(bottleneck);
      case 'failure':
        return this.getFailureRecommendations(bottleneck);
      case 'sequential':
        return this.getParallelizationRecommendations(bottleneck);
      case 'queue_wait':
        return this.getQueueWaitRecommendations(bottleneck);
      default:
        return [];
    }
  }

  private getSlowJobRecommendations(bottleneck: Bottleneck): Recommendation[] {
    const recs: Recommendation[] = [];
    const jobName = bottleneck.jobName || 'the job';

    // Caching recommendation
    recs.push({
      id: `rec-cache-${bottleneck.id}`,
      category: 'caching',
      priority: 'high',
      title: 'Implement Caching for Dependencies',
      description: `The job "${jobName}" takes a long time to run. Implementing dependency caching can significantly reduce build times by reusing downloaded packages and built artifacts between runs.`,
      estimatedImprovement: '30-60% reduction in execution time',
      implementationEffort: 'low',
      relatedJobs: [jobName],
      codeSnippet: this.getCachingExample(),
    });

    // Parallelization recommendation
    recs.push({
      id: `rec-parallel-${bottleneck.id}`,
      category: 'parallelization',
      priority: 'medium',
      title: 'Split Long-Running Jobs',
      description: `Consider breaking down "${jobName}" into smaller, parallel jobs. This can be done by splitting test suites, using matrix strategies, or running independent tasks concurrently.`,
      estimatedImprovement: '40-70% reduction in total workflow time',
      implementationEffort: 'medium',
      relatedJobs: [jobName],
    });

    // Resource optimization
    recs.push({
      id: `rec-resources-${bottleneck.id}`,
      category: 'resources',
      priority: 'low',
      title: 'Optimize Resource Allocation',
      description: `Consider increasing compute resources (CPU/memory) or using faster runners for "${jobName}" if it's computationally intensive.`,
      estimatedImprovement: '20-40% reduction in execution time',
      implementationEffort: 'low',
      relatedJobs: [jobName],
    });

    return recs;
  }

  private getFailureRecommendations(bottleneck: Bottleneck): Recommendation[] {
    const recs: Recommendation[] = [];
    const jobName = bottleneck.jobName || 'workflow';

    // Add flaky test detection
    recs.push({
      id: `rec-flaky-${bottleneck.id}`,
      category: 'tests',
      priority: 'high',
      title: 'Investigate Flaky Tests',
      description: `The job "${jobName}" has a high failure rate. Consider implementing test retry mechanisms, isolating flaky tests, or adding proper error handling to reduce false failures.`,
      estimatedImprovement: '50-80% reduction in flaky test failures',
      implementationEffort: 'medium',
      relatedJobs: [jobName],
    });

    // Add retry logic
    recs.push({
      id: `rec-retry-${bottleneck.id}`,
      category: 'resources',
      priority: 'medium',
      title: 'Add Retry Logic for Transient Failures',
      description: `Add automatic retry logic for "${jobName}" to handle transient failures like network issues or temporary service unavailability.`,
      estimatedImprovement: '30-50% reduction in failure rate',
      implementationEffort: 'low',
      relatedJobs: [jobName],
      codeSnippet: this.getRetryExample(),
    });

    return recs;
  }

  private getParallelizationRecommendations(bottleneck: Bottleneck): Recommendation[] {
    const recs: Recommendation[] = [];
    const jobName = bottleneck.jobName || 'job';

    recs.push({
      id: `rec-parallelize-${bottleneck.id}`,
      category: 'parallelization',
      priority: 'high',
      title: 'Enable Parallel Job Execution',
      description: `The jobs "${jobName}" appear to run sequentially. Review the workflow configuration and remove unnecessary dependencies to allow parallel execution.`,
      estimatedImprovement: '30-60% reduction in total workflow time',
      implementationEffort: 'medium',
      relatedJobs: [jobName],
      codeSnippet: this.getParallelExample(),
    });

    return recs;
  }

  private getQueueWaitRecommendations(bottleneck: Bottleneck): Recommendation[] {
    const recs: Recommendation[] = [];

    recs.push({
      id: 'rec-queue-self-hosted',
      category: 'resources',
      priority: 'high',
      title: 'Add More Self-Hosted Runners',
      description: 'Long queue wait times detected. Consider adding more self-hosted runners or upgrading to larger runner plans to reduce queue times.',
      estimatedImprovement: '50-90% reduction in queue time',
      implementationEffort: 'medium',
    });

    recs.push({
      id: 'rec-queue-schedule',
      category: 'resources',
      priority: 'low',
      title: 'Optimize Build Scheduling',
      description: 'Consider scheduling builds during off-peak hours or implementing build caching to reduce overall resource contention.',
      estimatedImprovement: '20-40% reduction in queue time',
      implementationEffort: 'low',
    });

    return recs;
  }

  private getGeneralRecommendations(runs: WorkflowRun[]): Recommendation[] {
    const recs: Recommendation[] = [];

    // Check for test optimization opportunities
    recs.push({
      id: 'rec-tests',
      category: 'tests',
      priority: 'low',
      title: 'Optimize Test Execution',
      description: 'Consider running tests in parallel, implementing test filtering to skip unchanged tests, or using test databases with in-memory storage for faster execution.',
      estimatedImprovement: '20-50% reduction in test time',
      implementationEffort: 'medium',
    });

    // Check for artifact optimization
    recs.push({
      id: 'rec-artifacts',
      category: 'artifacts',
      priority: 'low',
      title: 'Optimize Artifact Management',
      description: 'Review artifact retention policies and consider compressing large artifacts or using external storage for better performance.',
      estimatedImprovement: '10-30% reduction in workflow time',
      implementationEffort: 'low',
    });

    return recs;
  }

  private sortByPriority(recommendations: Recommendation[]): Recommendation[] {
    const priorityOrder: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  private getCachingExample(): string {
    return `# GitHub Actions caching example
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: \${{ runner.os }}-npm-\${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      \${{ runner.os }}-npm-

# Or use built-in cache
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '20'
    cache: 'npm'`;
  }

  private getRetryExample(): string {
    return `# GitHub Actions retry example
- name: Build
  run: npm run build
  timeout-minutes: 10
  retry:
    max-attempts: 3
    delay-seconds: 5`;
  }

  private getParallelExample(): string {
    return `# Enable parallel execution
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        chunk: [1, 2, 3, 4]
    steps:
      - run: npm run test -- --chunk=\${{ matrix.chunk }}`;
  }
}
