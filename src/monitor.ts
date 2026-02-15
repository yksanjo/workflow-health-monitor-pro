/**
 * Workflow Health Monitor
 * Main orchestrator for CI/CD pipeline monitoring
 */

import { PipelinePlatform, Repository, MonitorResult, WorkflowRun, HealthScore, WorkflowStats, Workflow, CLIOptions } from './types';
import { createPlatform } from './platforms';
import { Analyzer } from './analyzer';
import { RecommendationsEngine } from './recommendations';

export class Monitor {
  private platform: PipelinePlatform;
  private analyzer: Analyzer;
  private recommendations: RecommendationsEngine;

  constructor(platformType: CLIOptions['platform']) {
    this.platform = createPlatform(platformType);
    this.analyzer = new Analyzer();
    this.recommendations = new RecommendationsEngine();
  }

  async authenticate(token: string, options?: Record<string, string>): Promise<boolean> {
    return this.platform.authenticate(token, options);
  }

  async run(options: CLIOptions): Promise<MonitorResult> {
    const repo: Repository = {
      owner: options.owner,
      name: options.repo,
    };

    // Get workflow runs
    let runs = await this.platform.getWorkflowRuns(repo, options.workflowId);

    // Limit the number of runs if specified
    if (options.limit && runs.length > options.limit) {
      runs = runs.slice(0, options.limit);
    }

    // Fetch job details for each run (limited to most recent for performance)
    const runsWithJobs: WorkflowRun[] = await Promise.all(
      runs.slice(0, 10).map(async (run) => {
        try {
          const jobs = await this.platform.getJobDetails(repo, run.id);
          return { ...run, jobs };
        } catch (error) {
          console.warn(`Failed to fetch jobs for run ${run.id}:`, error);
          return run;
        }
      })
    );

    // Replace runs with detailed ones
    runs = runs.map((run, index) => runsWithJobs[index] || run);

    // Get workflow stats
    const stats = await this.calculateStats(runs);

    // Analyze bottlenecks
    const bottlenecks = this.analyzer.analyze(runs);

    // Generate recommendations
    const recommendations = this.recommendations.generate(runs, bottlenecks);

    // Calculate health score
    const healthScore = this.calculateHealthScore(stats, bottlenecks, recommendations);

    return {
      platform: options.platform,
      repository: repo,
      timestamp: new Date(),
      healthScore,
      stats,
      bottlenecks,
      recommendations,
      workflows: [], // Could include full workflow list if needed
    };
  }

  private async calculateStats(runs: WorkflowRun[]): Promise<WorkflowStats> {
    const completedRuns = runs.filter((r) => r.status === 'completed');
    const successfulRuns = completedRuns.filter((r) => r.conclusion === 'success');
    const failedRuns = completedRuns.filter((r) => r.conclusion === 'failure');

    const totalDuration = runs.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = runs.length > 0 ? Math.floor(totalDuration / runs.length) : 0;

    // Calculate average queue time
    let totalQueueTime = 0;
    let queueCount = 0;
    for (const run of runs) {
      if (run.jobs && run.jobs.length > 0) {
        const workflowStart = run.startedAt ? new Date(run.startedAt).getTime() : 0;
        const firstJobStart = run.jobs
          .filter((j) => j.startedAt)
          .map((j) => new Date(j.startedAt!).getTime())
          .sort((a, b) => a - b)[0];

        if (firstJobStart && workflowStart) {
          totalQueueTime += firstJobStart - workflowStart;
          queueCount++;
        }
      }
    }

    return {
      totalRuns: runs.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      successRate: completedRuns.length > 0
        ? (successfulRuns.length / completedRuns.length) * 100
        : 0,
      averageDuration,
      averageQueueTime: queueCount > 0 ? Math.floor(totalQueueTime / queueCount / 1000) : 0,
      lastRun: runs[0],
    };
  }

  private calculateHealthScore(
    stats: WorkflowStats,
    bottlenecks: { severity: string }[],
    recommendations: { priority: string }[]
  ): HealthScore {
    // Reliability score (based on success rate)
    const reliability = Math.min(100, stats.successRate);

    // Performance score (based on average duration - lower is better)
    // Assuming 5 minutes (300s) is good, 30 minutes (1800s) is poor
    const durationScore = Math.max(0, 100 - (stats.averageDuration / 1800) * 100);

    // Efficiency score (based on bottleneck count)
    const highSeverityBottlenecks = bottlenecks.filter((b) => b.severity === 'high').length;
    const mediumSeverityBottlenecks = bottlenecks.filter((b) => b.severity === 'medium').length;
    const bottleneckPenalty = (highSeverityBottlenecks * 20) + (mediumSeverityBottlenecks * 10);
    const efficiency = Math.max(0, 100 - bottleneckPenalty);

    // Overall score (weighted average)
    const overall = Math.round(
      reliability * 0.4 + durationScore * 0.3 + efficiency * 0.3
    );

    return {
      overall,
      reliability: Math.round(reliability),
      performance: Math.round(durationScore),
      efficiency: Math.round(efficiency),
      breakdown: {
        successRate: Math.round(stats.successRate),
        avgDuration: stats.averageDuration,
        bottleneckCount: bottlenecks.length,
        optimizationPotential: recommendations.filter((r) => r.priority === 'high').length,
      },
    };
  }
}
