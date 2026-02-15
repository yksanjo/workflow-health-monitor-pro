/**
 * Base Platform Adapter
 * Abstract class for CI/CD platform adapters
 */
import { AxiosInstance } from 'axios';
import { PipelinePlatform, Repository, Workflow, WorkflowRun, Job, WorkflowStats, PlatformType } from '../types';
export declare abstract class BasePlatform implements PipelinePlatform {
    abstract readonly name: string;
    abstract readonly type: PlatformType;
    protected client: AxiosInstance | null;
    protected token: string;
    abstract getApiUrl(): string;
    abstract getAuthHeaders(): Record<string, string>;
    authenticate(token: string, options?: Record<string, string>): Promise<boolean>;
    protected abstract testConnection(): Promise<boolean>;
    protected getClient(): AxiosInstance;
    abstract getWorkflows(repo: Repository): Promise<Workflow[]>;
    abstract getWorkflowRuns(repo: Repository, workflowId?: string): Promise<WorkflowRun[]>;
    abstract getJobDetails(repo: Repository, runId: string): Promise<Job[]>;
    abstract getWorkflowStats(repo: Repository, workflowId: string): Promise<WorkflowStats>;
    protected calculateDuration(startTime: string, endTime?: string): number;
    protected formatDuration(seconds: number): string;
}
//# sourceMappingURL=base.d.ts.map