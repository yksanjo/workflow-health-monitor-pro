/**
 * Jenkins Platform Adapter
 */
import { BasePlatform } from './base';
import { Repository, Workflow, WorkflowRun, Job, WorkflowStats } from '../types';
export declare class JenkinsPlatform extends BasePlatform {
    readonly name = "Jenkins";
    readonly type: "jenkins";
    private baseUrl;
    private jobName;
    getApiUrl(): string;
    getAuthHeaders(): Record<string, string>;
    protected testConnection(): Promise<boolean>;
    authenticate(token: string, options?: Record<string, string>): Promise<boolean>;
    getWorkflows(repo: Repository): Promise<Workflow[]>;
    getWorkflowRuns(repo: Repository, workflowId?: string): Promise<WorkflowRun[]>;
    getJobDetails(repo: Repository, runId: string): Promise<Job[]>;
    getWorkflowStats(repo: Repository, workflowId: string): Promise<WorkflowStats>;
    private mapBuild;
    private mapConclusion;
}
//# sourceMappingURL=jenkins.d.ts.map