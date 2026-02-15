"use strict";
/**
 * Bitbucket Pipelines Platform Adapter
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitbucketPlatform = void 0;
const base_1 = require("./base");
class BitbucketPlatform extends base_1.BasePlatform {
    constructor() {
        super(...arguments);
        this.name = 'Bitbucket Pipelines';
        this.type = 'bitbucket';
        this.repoOwner = '';
        this.repoName = '';
    }
    getApiUrl() {
        return `https://api.bitbucket.org/2.0/repositories/${this.repoOwner}/${this.repoName}`;
    }
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
        };
    }
    async testConnection() {
        const response = await this.getClient().get('/');
        return response.status === 200;
    }
    async authenticate(token, options) {
        if (options?.owner && options?.repo) {
            this.repoOwner = options.owner;
            this.repoName = options.repo;
        }
        return super.authenticate(token, options);
    }
    async getWorkflows(repo) {
        this.repoOwner = repo.owner;
        this.repoName = repo.name;
        const response = await this.getClient().get('/pipelines/', { params: { pagelen: 100 } });
        return [{
                id: 'default',
                name: 'Default Pipeline',
                runs: [],
            }];
    }
    async getWorkflowRuns(repo, workflowId) {
        this.repoOwner = repo.owner;
        this.repoName = repo.name;
        const response = await this.getClient().get('/pipelines/', { params: { pagelen: 30 } });
        return response.data.values.map((pipeline) => this.mapPipeline(pipeline));
    }
    async getJobDetails(repo, runId) {
        this.repoOwner = repo.owner;
        this.repoName = repo.name;
        const response = await this.getClient().get(`/pipelines/${runId}/steps/`);
        return response.data.values.map((step, index) => ({
            id: step.uuid,
            name: step.name || `Step ${index + 1}`,
            status: this.mapStatus(step.state.type),
            conclusion: this.mapConclusion(step.state.result?.name),
            startedAt: step.started_on || undefined,
            completedAt: step.completed_on || undefined,
            duration: this.calculateDuration(step.started_on || '', step.completed_on || ''),
            steps: [],
            runId,
        }));
    }
    async getWorkflowStats(repo, workflowId) {
        const runs = await this.getWorkflowRuns(repo, workflowId);
        const completedRuns = runs.filter((r) => r.status === 'completed');
        const successfulRuns = completedRuns.filter((r) => r.conclusion === 'success');
        const totalDuration = completedRuns.reduce((sum, r) => sum + r.duration, 0);
        return {
            totalRuns: runs.length,
            successfulRuns: successfulRuns.length,
            failedRuns: completedRuns.length - successfulRuns.length,
            successRate: completedRuns.length > 0
                ? (successfulRuns.length / completedRuns.length) * 100
                : 0,
            averageDuration: completedRuns.length > 0
                ? Math.floor(totalDuration / completedRuns.length)
                : 0,
            averageQueueTime: 0,
            lastRun: runs[0],
        };
    }
    mapPipeline(pipeline) {
        return {
            id: pipeline.uuid,
            name: `Pipeline #${pipeline.build_number}`,
            workflowId: 'default',
            status: this.mapStatus(pipeline.state.type),
            conclusion: this.mapConclusion(pipeline.state.result?.name),
            runNumber: pipeline.build_number,
            event: pipeline.trigger.type,
            branch: pipeline.source.branch.name,
            commit: pipeline.source.commit.hash,
            startedAt: pipeline.created_on,
            completedAt: pipeline.completed_on,
            duration: this.calculateDuration(pipeline.created_on, pipeline.completed_on),
            jobs: [],
        };
    }
    mapStatus(type) {
        if (type.includes('success') || type.includes('completed'))
            return 'completed';
        if (type.includes('failed'))
            return 'failed';
        if (type.includes('running'))
            return 'in_progress';
        if (type.includes('pending') || type.includes('queued'))
            return 'queued';
        return 'pending';
    }
    mapConclusion(result) {
        if (!result)
            return undefined;
        if (result.toLowerCase() === 'success')
            return 'success';
        if (result.toLowerCase() === 'failed')
            return 'failure';
        return 'cancelled';
    }
}
exports.BitbucketPlatform = BitbucketPlatform;
//# sourceMappingURL=bitbucket.js.map