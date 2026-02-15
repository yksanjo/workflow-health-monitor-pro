"use strict";
/**
 * Bottleneck Analyzer
 * Identifies performance bottlenecks in CI/CD workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analyzer = void 0;
class Analyzer {
    constructor(options) {
        this.slowJobThreshold = 300; // 5 minutes
        this.failureRateThreshold = 20; // 20%
        this.sequentialThreshold = 2; // jobs that run after each other
        if (options?.slowJobThreshold) {
            this.slowJobThreshold = options.slowJobThreshold;
        }
        if (options?.failureRateThreshold) {
            this.failureRateThreshold = options.failureRateThreshold;
        }
    }
    analyze(runs) {
        const bottlenecks = [];
        if (runs.length === 0) {
            return bottlenecks;
        }
        // Analyze slow jobs
        const slowJobs = this.findSlowJobs(runs);
        bottlenecks.push(...slowJobs);
        // Analyze failure patterns
        const failureBottlenecks = this.findFailurePatterns(runs);
        bottlenecks.push(...failureBottlenecks);
        // Analyze sequential execution
        const sequentialBottlenecks = this.findSequentialJobs(runs);
        bottlenecks.push(...sequentialBottlenecks);
        // Analyze queue wait times
        const queueBottlenecks = this.findQueueWaitIssues(runs);
        bottlenecks.push(...queueBottlenecks);
        // Sort by severity
        return this.sortBySeverity(bottlenecks);
    }
    findSlowJobs(runs) {
        const bottlenecks = [];
        const jobDurations = new Map();
        // Aggregate job durations across all runs
        for (const run of runs) {
            for (const job of run.jobs) {
                const existing = jobDurations.get(job.name) || { total: 0, count: 0 };
                existing.total += job.duration;
                existing.count += 1;
                jobDurations.set(job.name, existing);
            }
        }
        // Find jobs that exceed threshold
        for (const [jobName, stats] of jobDurations) {
            const avgDuration = stats.total / stats.count;
            if (avgDuration > this.slowJobThreshold) {
                const severity = avgDuration > 600 ? 'high' : avgDuration > 300 ? 'medium' : 'low';
                bottlenecks.push({
                    id: `slow-${this.sanitizeId(jobName)}`,
                    type: 'slow_job',
                    severity,
                    title: `Slow Job: ${jobName}`,
                    description: `Average execution time is ${this.formatDuration(avgDuration)}, which exceeds the ${this.formatDuration(this.slowJobThreshold)} threshold.`,
                    jobName,
                    potentialSavings: Math.floor(avgDuration * 0.5),
                    evidence: `Average duration: ${this.formatDuration(avgDuration)} across ${stats.count} runs`,
                });
            }
        }
        return bottlenecks;
    }
    findFailurePatterns(runs) {
        const bottlenecks = [];
        const jobFailures = new Map();
        // Aggregate failures by job name
        for (const run of runs) {
            if (!run.jobs || run.jobs.length === 0)
                continue;
            for (const job of run.jobs) {
                const existing = jobFailures.get(job.name) || { failed: 0, total: 0 };
                existing.total += 1;
                if (job.conclusion === 'failure') {
                    existing.failed += 1;
                }
                jobFailures.set(job.name, existing);
            }
        }
        // Find jobs with high failure rates
        for (const [jobName, stats] of jobFailures) {
            const failureRate = (stats.failed / stats.total) * 100;
            if (failureRate > this.failureRateThreshold) {
                const severity = failureRate > 50 ? 'high' : failureRate > 30 ? 'medium' : 'low';
                bottlenecks.push({
                    id: `failure-${this.sanitizeId(jobName)}`,
                    type: 'failure',
                    severity,
                    title: `Frequent Failures: ${jobName}`,
                    description: `Job has a ${failureRate.toFixed(1)}% failure rate (${stats.failed}/${stats.total} runs).`,
                    jobName,
                    potentialSavings: stats.failed * 300,
                    evidence: `Failed ${stats.failed} times out of ${stats.total} executions`,
                });
            }
        }
        // Check overall workflow failure rate
        const totalCompleted = runs.filter(r => r.status === 'completed').length;
        const totalFailed = runs.filter(r => r.conclusion === 'failure').length;
        if (totalCompleted > 0) {
            const workflowFailureRate = (totalFailed / totalCompleted) * 100;
            if (workflowFailureRate > this.failureRateThreshold) {
                bottlenecks.push({
                    id: 'workflow-failure-rate',
                    type: 'failure',
                    severity: workflowFailureRate > 30 ? 'high' : 'medium',
                    title: 'High Workflow Failure Rate',
                    description: `The workflow fails ${workflowFailureRate.toFixed(1)}% of the time.`,
                    potentialSavings: totalFailed * 300,
                    evidence: `${totalFailed} failures out of ${totalCompleted} completed runs`,
                });
            }
        }
        return bottlenecks;
    }
    findSequentialJobs(runs) {
        const bottlenecks = [];
        // Look at most recent runs for job ordering
        const recentRuns = runs.slice(0, 5);
        for (const run of recentRuns) {
            if (!run.jobs || run.jobs.length < 2)
                continue;
            // Sort jobs by start time
            const sortedJobs = [...run.jobs].sort((a, b) => {
                const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
                const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
                return aTime - bTime;
            });
            // Find jobs that run sequentially (start after previous ends)
            for (let i = 1; i < sortedJobs.length; i++) {
                const prevJob = sortedJobs[i - 1];
                const currJob = sortedJobs[i];
                if (prevJob.completedAt && currJob.startedAt) {
                    const prevEnd = new Date(prevJob.completedAt).getTime();
                    const currStart = new Date(currJob.startedAt).getTime();
                    const gap = currStart - prevEnd;
                    // If gap is small, they might be running sequentially
                    if (gap >= 0 && gap < 5000) {
                        const potentialSavings = currJob.duration;
                        bottlenecks.push({
                            id: `sequential-${this.sanitizeId(prevJob.name)}-${this.sanitizeId(currJob.name)}`,
                            type: 'sequential',
                            severity: 'medium',
                            title: `Potential Parallelization: ${prevJob.name} → ${currJob.name}`,
                            description: `These jobs appear to run sequentially but could potentially run in parallel.`,
                            jobName: currJob.name,
                            potentialSavings,
                            evidence: `${prevJob.name} (${this.formatDuration(prevJob.duration)}) → ${currJob.name} (${this.formatDuration(currJob.duration)})`,
                        });
                    }
                }
            }
        }
        return bottlenecks;
    }
    findQueueWaitIssues(runs) {
        const bottlenecks = [];
        // Estimate queue time by comparing workflow start to first job start
        for (const run of runs) {
            if (!run.startedAt || !run.jobs || run.jobs.length === 0)
                continue;
            const workflowStart = new Date(run.startedAt).getTime();
            const firstJobStart = run.jobs
                .filter(j => j.startedAt)
                .map(j => new Date(j.startedAt).getTime())
                .sort((a, b) => a - b)[0];
            if (firstJobStart) {
                const queueTime = firstJobStart - workflowStart;
                if (queueTime > 60000) {
                    const severity = queueTime > 300000 ? 'high' : queueTime > 120000 ? 'medium' : 'low';
                    bottlenecks.push({
                        id: `queue-${run.id}`,
                        type: 'queue_wait',
                        severity,
                        title: 'Long Queue Wait Time',
                        description: `Workflow waited ${this.formatDuration(queueTime / 1000)} before first job started.`,
                        potentialSavings: Math.floor(queueTime / 1000),
                        evidence: `Queue time: ${this.formatDuration(queueTime / 1000)}`,
                    });
                }
            }
        }
        return bottlenecks;
    }
    sortBySeverity(bottlenecks) {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return bottlenecks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }
    sanitizeId(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${Math.floor(seconds)}s`;
        }
        else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        }
        else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    }
}
exports.Analyzer = Analyzer;
//# sourceMappingURL=analyzer.js.map