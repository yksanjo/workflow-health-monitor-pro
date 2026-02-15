/**
 * GitHub Actions Platform Adapter
 */
import { BasePlatform } from './base';
import { Repository, Workflow, WorkflowRun, Job, WorkflowStats } from '../types';
export declare class GitHubPlatform extends BasePlatform {
    readonly name = "GitHub Actions";
    readonly type: "github";
    private repoOwner;
    private repoName;
    getApiUrl(): string;
    getAuthHeaders(): Record<string, string>;
    protected testConnection(): Promise<boolean>;
    authenticate(token: string, options?: Record<string, string>): Promise<boolean>;
    getWorkflows(repo: Repository): Promise<Workflow[]>;
    getWorkflowRuns(repo: Repository, workflowId?: string): Promise<WorkflowRun[]>;
    getJobDetails(repo: Repository, runId: string): Promise<Job[]>;
    getWorkflowStats(repo: Repository, workflowId: string): Promise<WorkflowStats>;
    private mapWorkflowRun;
    private mapStatus;
    private mapConclusion;
}
//# sourceMappingURL=github.d.ts.map