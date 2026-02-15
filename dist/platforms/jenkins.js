"use strict";
/**
 * Jenkins Platform Adapter
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JenkinsPlatform = void 0;
const axios_1 = __importDefault(require("axios"));
const base_1 = require("./base");
class JenkinsPlatform extends base_1.BasePlatform {
    constructor() {
        super(...arguments);
        this.name = 'Jenkins';
        this.type = 'jenkins';
        this.baseUrl = '';
        this.jobName = '';
    }
    getApiUrl() {
        return `${this.baseUrl}/api/json`;
    }
    getAuthHeaders() {
        const credentials = Buffer.from(`${this.token}`).toString('base64');
        return {
            'Authorization': `Basic ${credentials}`,
        };
    }
    async testConnection() {
        const response = await this.getClient().get('', { params: { tree: 'mode' } });
        return response.status === 200;
    }
    async authenticate(token, options) {
        if (options?.host) {
            this.baseUrl = options.host;
        }
        else {
            throw new Error('Jenkins requires --host parameter');
        }
        if (options?.repo) {
            this.jobName = options.repo;
        }
        this.token = token;
        this.client = axios_1.default.create({
            baseURL: this.getApiUrl(),
            headers: {
                'Accept': 'application/json',
                ...this.getAuthHeaders(),
            },
            timeout: 30000,
        });
        return this.testConnection();
    }
    async getWorkflows(repo) {
        const response = await this.getClient().get('', {
            params: { tree: 'jobs[name,url,color]' },
        });
        return response.data.jobs?.map((job) => ({
            id: job.name,
            name: job.name,
            runs: [],
        })) || [];
    }
    async getWorkflowRuns(repo, workflowId) {
        const jobName = workflowId || repo.name || this.jobName;
        const response = await this.getClient().get(`/job/${jobName}/api/json`, {
            params: { tree: 'builds[id,number,result,building,timestamp,duration,url]' },
        });
        const builds = response.data.builds || [];
        return builds.slice(0, 30).map((build) => this.mapBuild(build));
    }
    async getJobDetails(repo, runId) {
        const jobName = repo.name || this.jobName;
        const response = await this.getClient().get(`/job/${jobName}/${runId}/api/json`, {
            params: { tree: 'number,result,building,timestamp,duration,url' },
        });
        const build = response.data;
        return [{
                id: runId,
                name: `Build #${build.number}`,
                status: build.building ? 'in_progress' : 'completed',
                conclusion: this.mapConclusion(build.result),
                startedAt: new Date(build.timestamp).toISOString(),
                completedAt: build.building ? undefined : new Date(build.timestamp + build.duration).toISOString(),
                duration: Math.floor(build.duration / 1000),
                steps: [],
                runId,
            }];
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
    mapBuild(build) {
        let cause = 'Manual';
        try {
            const causeAction = build.actions?.find((a) => a.causes);
            if (causeAction && Array.isArray(causeAction.causes)) {
                cause = causeAction.causes[0]?.shortDescription || 'Manual';
            }
        }
        catch {
            // Fall back to 'Manual'
        }
        return {
            id: build.id,
            name: `Build #${build.number}`,
            workflowId: '',
            status: build.building ? 'in_progress' : 'completed',
            conclusion: this.mapConclusion(build.result),
            runNumber: build.number,
            event: cause,
            branch: '',
            startedAt: new Date(build.timestamp).toISOString(),
            completedAt: build.building ? undefined : new Date(build.timestamp + build.duration).toISOString(),
            duration: Math.floor(build.duration / 1000),
            jobs: [],
            url: build.url,
        };
    }
    mapConclusion(result) {
        if (!result)
            return undefined;
        if (result === 'SUCCESS')
            return 'success';
        if (result === 'FAILURE')
            return 'failure';
        if (result === 'ABORTED')
            return 'cancelled';
        return 'cancelled';
    }
}
exports.JenkinsPlatform = JenkinsPlatform;
//# sourceMappingURL=jenkins.js.map