"use strict";
/**
 * GitHub Actions Platform Adapter
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubPlatform = void 0;
const axios_1 = __importDefault(require("axios"));
const base_1 = require("./base");
class GitHubPlatform extends base_1.BasePlatform {
    constructor() {
        super(...arguments);
        this.name = 'GitHub Actions';
        this.type = 'github';
        this.repoOwner = '';
        this.repoName = '';
    }
    getApiUrl() {
        return `https://api.github.com/repos/${this.repoOwner}/${this.repoName}`;
    }
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'X-GitHub-Api-Version': '2022-11-28',
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
        // Re-initialize client with correct API URL
        if (this.client) {
            this.client = axios_1.default.create({
                baseURL: this.getApiUrl(),
                headers: {
                    'Accept': 'application/json',
                    ...this.getAuthHeaders(),
                },
                timeout: 30000,
            });
        }
        const response = await this.getClient().get('/actions/workflows', {
            params: { per_page: 100 },
        });
        return response.data.map((wf) => ({
            id: String(wf.id),
            name: wf.name,
            path: wf.path,
            fileName: wf.path.split('/').pop(),
            runs: [],
        }));
    }
    async getWorkflowRuns(repo, workflowId) {
        this.repoOwner = repo.owner;
        this.repoName = repo.name;
        // Re-initialize client with correct API URL
        if (this.client) {
            this.client = axios_1.default.create({
                baseURL: this.getApiUrl(),
                headers: {
                    'Accept': 'application/json',
                    ...this.getAuthHeaders(),
                },
                timeout: 30000,
            });
        }
        const endpoint = workflowId
            ? `/actions/workflows/${workflowId}/runs`
            : '/actions/runs';
        const response = await this.getClient().get(endpoint, {
            params: { per_page: 30 },
        });
        return response.data.workflow_runs.map((run) => this.mapWorkflowRun(run));
    }
    async getJobDetails(repo, runId) {
        this.repoOwner = repo.owner;
        this.repoName = repo.name;
        // Re-initialize client with correct API URL
        if (this.client) {
            this.client = axios_1.default.create({
                baseURL: this.getApiUrl(),
                headers: {
                    'Accept': 'application/json',
                    ...this.getAuthHeaders(),
                },
                timeout: 30000,
            });
        }
        const response = await this.getClient().get(`/actions/runs/${runId}/jobs`);
        const jobsWithSteps = await Promise.all(response.data.jobs.map(async (job) => {
            const stepsResponse = await this.getClient().get(`/actions/jobs/${job.id}/steps`);
            return {
                id: String(job.id),
                name: job.name,
                status: this.mapStatus(job.status, job.conclusion),
                conclusion: this.mapConclusion(job.conclusion),
                startedAt: job.started_at || undefined,
                completedAt: job.completed_at || undefined,
                duration: this.calculateDuration(job.started_at || '', job.completed_at || ''),
                steps: stepsResponse.data.steps.map((step) => ({
                    id: String(step.id),
                    name: step.name,
                    status: this.mapStatus(step.status, step.conclusion),
                    conclusion: this.mapConclusion(step.conclusion),
                    number: step.number,
                    startedAt: step.started_at || undefined,
                    completedAt: step.completed_at || undefined,
                    duration: this.calculateDuration(step.started_at || '', step.completed_at || ''),
                })),
                runId,
            };
        }));
        return jobsWithSteps;
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
    mapWorkflowRun(run) {
        return {
            id: String(run.id),
            name: run.name,
            workflowId: String(run.workflow_id),
            status: this.mapStatus(run.status, run.conclusion),
            conclusion: this.mapConclusion(run.conclusion),
            runNumber: run.run_number,
            event: run.event,
            branch: run.head_branch,
            commit: run.head_sha,
            startedAt: run.run_started_at,
            completedAt: run.updated_at,
            duration: this.calculateDuration(run.run_started_at, run.updated_at),
            jobs: [],
            url: run.html_url,
        };
    }
    mapStatus(status, conclusion) {
        if (conclusion) {
            return conclusion === 'success' ? 'completed' : 'failed';
        }
        return status;
    }
    mapConclusion(conclusion) {
        if (!conclusion)
            return undefined;
        return conclusion;
    }
}
exports.GitHubPlatform = GitHubPlatform;
//# sourceMappingURL=github.js.map