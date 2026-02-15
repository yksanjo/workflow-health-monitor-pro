/**
 * GitHub Actions Platform Adapter
 */

import axios from 'axios';
import { BasePlatform } from './base';
import { Repository, Workflow, WorkflowRun, Job, WorkflowStats, WorkflowStatus, WorkflowConclusion } from '../types';

interface GitHubWorkflowResponse {
  id: number;
  name: string;
  path: string;
  state: string;
}

interface GitHubWorkflowRunResponse {
  id: number;
  name: string;
  workflow_id: number;
  run_number: number;
  event: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  run_started_at: string;
  html_url: string;
}

interface GitHubJobResponse {
  id: number;
  run_id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface GitHubStepResponse {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
}

export class GitHubPlatform extends BasePlatform {
  readonly name = 'GitHub Actions';
  readonly type = 'github' as const;

  private repoOwner: string = '';
  private repoName: string = '';

  getApiUrl(): string {
    return `https://api.github.com/repos/${this.repoOwner}/${this.repoName}`;
  }

  getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  protected async testConnection(): Promise<boolean> {
    const response = await this.getClient().get('/');
    return response.status === 200;
  }

  async authenticate(token: string, options?: Record<string, string>): Promise<boolean> {
    if (options?.owner && options?.repo) {
      this.repoOwner = options.owner;
      this.repoName = options.repo;
    }
    return super.authenticate(token, options);
  }

  async getWorkflows(repo: Repository): Promise<Workflow[]> {
    this.repoOwner = repo.owner;
    this.repoName = repo.name;
    
    // Re-initialize client with correct API URL
    if (this.client) {
      this.client = axios.create({
        baseURL: this.getApiUrl(),
        headers: {
          'Accept': 'application/json',
          ...this.getAuthHeaders(),
        },
        timeout: 30000,
      });
    }

    const response = await this.getClient().get<GitHubWorkflowResponse[]>('/actions/workflows', {
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

  async getWorkflowRuns(repo: Repository, workflowId?: string): Promise<WorkflowRun[]> {
    this.repoOwner = repo.owner;
    this.repoName = repo.name;

    // Re-initialize client with correct API URL
    if (this.client) {
      this.client = axios.create({
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
    
    const response = await this.getClient().get<{ workflow_runs: GitHubWorkflowRunResponse[] }>(endpoint, {
      params: { per_page: 30 },
    });

    return response.data.workflow_runs.map((run) => this.mapWorkflowRun(run));
  }

  async getJobDetails(repo: Repository, runId: string): Promise<Job[]> {
    this.repoOwner = repo.owner;
    this.repoName = repo.name;

    // Re-initialize client with correct API URL
    if (this.client) {
      this.client = axios.create({
        baseURL: this.getApiUrl(),
        headers: {
          'Accept': 'application/json',
          ...this.getAuthHeaders(),
        },
        timeout: 30000,
      });
    }

    const response = await this.getClient().get<{ jobs: GitHubJobResponse[] }>(`/actions/runs/${runId}/jobs`);

    const jobsWithSteps: Job[] = await Promise.all(
      response.data.jobs.map(async (job) => {
        const stepsResponse = await this.getClient().get<{ steps: GitHubStepResponse[] }>(
          `/actions/jobs/${job.id}/steps`
        );
        
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
      })
    );

    return jobsWithSteps;
  }

  async getWorkflowStats(repo: Repository, workflowId: string): Promise<WorkflowStats> {
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

  private mapWorkflowRun(run: GitHubWorkflowRunResponse): WorkflowRun {
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

  private mapStatus(status: string, conclusion: string | null): WorkflowStatus {
    if (conclusion) {
      return conclusion === 'success' ? 'completed' : 'failed';
    }
    return status as WorkflowStatus;
  }

  private mapConclusion(conclusion: string | null): WorkflowConclusion {
    if (!conclusion) return undefined;
    return conclusion as WorkflowConclusion;
  }
}
