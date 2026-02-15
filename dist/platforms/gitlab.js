"use strict";
/**
 * GitLab CI/CD Platform Adapter
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitLabPlatform = void 0;
const base_1 = require("./base");
class GitLabPlatform extends base_1.BasePlatform {
    constructor() {
        super(...arguments);
        this.name = 'GitLab CI/CD';
        this.type = 'gitlab';
        this.projectId = '';
        this.baseUrl = 'https://gitlab.com/api/v4';
    }
    getApiUrl() {
        return this.baseUrl;
    }
    getAuthHeaders() {
        return {
            'PRIVATE-TOKEN': this.token,
        };
    }
    async testConnection() {
        const response = await this.getClient().get('/user');
        return response.status === 200;
    }
    async authenticate(token, options) {
        if (options?.host) {
            this.baseUrl = `${options.host}/api/v4`;
        }
        return super.authenticate(token, options);
    }
    async getWorkflows(repo) {
        this.projectId = encodeURIComponent(`${repo.owner}/${repo.name}`);
        const response = await this.getClient().get(`/projects/${this.projectId}/pipelines`, { params: { per_page: 100 } });
        const workflowMap = new Map();
        for (const pipeline of response.data) {
            if (!workflowMap.has(pipeline.ref)) {
                workflowMap.set(pipeline.ref, {
                    id: pipeline.ref,
                    name: `Pipeline for ${pipeline.ref}`,
                    runs: [],
                });
            }
        }
        return Array.from(workflowMap.values());
    }
    async getWorkflowRuns(repo, workflowId) {
        this.projectId = encodeURIComponent(`${repo.owner}/${repo.name}`);
        const endpoint = workflowId
            ? `/projects/${this.projectId}/pipelines/${workflowId}`
            : `/projects/${this.projectId}/pipelines`;
        const response = await this.getClient().get(endpoint, {
            params: { per_page: 30, order_by: 'updated_at', sort: 'desc' },
        });
        const pipelines = Array.isArray(response.data) ? response.data : [response.data];
        return pipelines.map((pipeline) => this.mapPipeline(pipeline));
    }
    async getJobDetails(repo, runId) {
        this.projectId = encodeURIComponent(`${repo.owner}/${repo.name}`);
        const response = await this.getClient().get(`/projects/${this.projectId}/pipelines/${runId}/jobs`);
        return response.data.map((job) => ({
            id: String(job.id),
            name: job.name,
            status: this.mapStatus(job.status),
            conclusion: this.mapConclusion(job.status),
            startedAt: job.started_at || undefined,
            completedAt: job.finished_at || undefined,
            duration: job.duration || 0,
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
            id: String(pipeline.id),
            name: `Pipeline #${pipeline.id}`,
            workflowId: pipeline.ref,
            status: this.mapStatus(pipeline.status),
            conclusion: this.mapConclusion(pipeline.status),
            runNumber: pipeline.id,
            event: 'push',
            branch: pipeline.ref,
            commit: pipeline.sha,
            startedAt: pipeline.created_at,
            completedAt: pipeline.updated_at,
            duration: this.calculateDuration(pipeline.created_at, pipeline.updated_at),
            jobs: [],
            url: pipeline.web_url,
        };
    }
    mapStatus(status) {
        const statusMap = {
            'pending': 'queued',
            'running': 'in_progress',
            'success': 'completed',
            'failed': 'failed',
            'canceled': 'completed',
            'skipped': 'completed',
        };
        return statusMap[status] || 'pending';
    }
    mapConclusion(status) {
        const conclusionMap = {
            'success': 'success',
            'failed': 'failure',
            'canceled': 'cancelled',
            'skipped': 'skipped',
        };
        return conclusionMap[status];
    }
}
exports.GitLabPlatform = GitLabPlatform;
//# sourceMappingURL=gitlab.js.map