"use strict";
/**
 * CircleCI Platform Adapter
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircleCIPlatform = void 0;
const base_1 = require("./base");
class CircleCIPlatform extends base_1.BasePlatform {
    constructor() {
        super(...arguments);
        this.name = 'CircleCI';
        this.type = 'circleci';
        this.projectSlug = '';
        this.baseUrl = 'https://circleci.com/api/v2';
    }
    getApiUrl() {
        return this.baseUrl;
    }
    getAuthHeaders() {
        return {
            'Circle-Token': this.token,
        };
    }
    async testConnection() {
        const response = await this.getClient().get('/me');
        return response.status === 200;
    }
    async authenticate(token, options) {
        return super.authenticate(token, options);
    }
    async getWorkflows(repo) {
        this.projectSlug = `${repo.owner}/${repo.name}`;
        const response = await this.getClient().get(`/project/${this.projectSlug}/pipeline`, {
            params: { 'page-token': '' },
        });
        const pipelines = response.data.items || [];
        return [{
                id: 'default',
                name: 'Default Pipeline',
                runs: [],
            }];
    }
    async getWorkflowRuns(repo, workflowId) {
        this.projectSlug = `${repo.owner}/${repo.name}`;
        const endpoint = workflowId
            ? `/pipeline/${workflowId}/workflow`
            : `/project/${this.projectSlug}/pipeline`;
        const response = await this.getClient().get(endpoint, {
            params: { 'page-token': '' },
        });
        const items = response.data.items || response.data;
        const workflows = Array.isArray(items) ? items : [items];
        // Get pipeline details for each workflow
        const workflowRuns = await Promise.all(workflows.slice(0, 30).map(async (wf) => {
            const pipelineResponse = await this.getClient().get(`/pipeline/${wf.id}`);
            const pipeline = pipelineResponse.data;
            return {
                id: wf.id,
                name: wf.name,
                workflowId: pipeline.id,
                status: this.mapStatus(wf.status),
                conclusion: this.mapConclusion(wf.status),
                runNumber: pipeline.number,
                event: pipeline.trigger.type,
                branch: pipeline.vcs?.branch || '',
                commit: pipeline.vcs?.revision || '',
                startedAt: wf.created_at,
                completedAt: wf.stopped_at || undefined,
                duration: wf.duration || this.calculateDuration(wf.created_at, wf.stopped_at || ''),
                jobs: [],
                url: `https://app.circleci.com/pipelines/${this.projectSlug}/${pipeline.number}`,
            };
        }));
        return workflowRuns;
    }
    async getJobDetails(repo, runId) {
        const response = await this.getClient().get(`/workflow/${runId}/job`);
        const jobs = response.data.items || [];
        return jobs.map((job) => ({
            id: job.id,
            name: job.name,
            status: this.mapStatus(job.status),
            conclusion: this.mapConclusion(job.status),
            startedAt: job.started_at || undefined,
            completedAt: job.stopped_at || undefined,
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
    mapStatus(status) {
        const statusMap = {
            'pending': 'queued',
            'running': 'in_progress',
            'success': 'completed',
            'failed': 'failed',
            'canceled': 'completed',
            'not_run': 'pending',
        };
        return statusMap[status] || 'pending';
    }
    mapConclusion(status) {
        const conclusionMap = {
            'success': 'success',
            'failed': 'failure',
            'canceled': 'cancelled',
            'timed_out': 'cancelled',
        };
        return conclusionMap[status];
    }
}
exports.CircleCIPlatform = CircleCIPlatform;
//# sourceMappingURL=circleci.js.map