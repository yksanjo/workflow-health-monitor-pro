/**
 * GitLab CI/CD Platform Adapter
 */
import { BasePlatform } from './base';
import { Repository, Workflow, WorkflowRun, Job, WorkflowStats } from '../types';
export declare class GitLabPlatform extends BasePlatform {
    readonly name = "GitLab CI/CD";
    readonly type: "gitlab";
    private projectId;
    private baseUrl;
    getApiUrl(): string;
    getAuthHeaders(): Record<string, string>;
    protected testConnection(): Promise<boolean>;
    authenticate(token: string, options?: Record<string, string>): Promise<boolean>;
    getWorkflows(repo: Repository): Promise<Workflow[]>;
    getWorkflowRuns(repo: Repository, workflowId?: string): Promise<WorkflowRun[]>;
    getJobDetails(repo: Repository, runId: string): Promise<Job[]>;
    getWorkflowStats(repo: Repository, workflowId: string): Promise<WorkflowStats>;
    private mapPipeline;
    private mapStatus;
    private mapConclusion;
}
//# sourceMappingURL=gitlab.d.ts.map