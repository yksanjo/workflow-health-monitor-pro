/**
 * GitLab CI/CD Platform Adapter
 */

import axios from 'axios';
import { BasePlatform } from './base';
import { Repository, Workflow, WorkflowRun, Job, WorkflowStats, WorkflowStatus, WorkflowConclusion } from '../types';

interface GitLabPipelineResponse {
  id: number;
  status: string;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
}

interface GitLabJobResponse {
  id: number;
  name: string;
  status: string;
  stage: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  duration: number | null;
  web_url: string;
}

export class GitLabPlatform extends BasePlatform {
  readonly name = 'GitLab CI/CD';
  readonly type = 'gitlab' as const;

  private projectId: string = '';
  private baseUrl: string = 'https://gitlab.com/api/v4';

  getApiUrl(): string {
    return this.baseUrl;
  }

  getAuthHeaders(): Record<string, string> {
    return {
      'PRIVATE-TOKEN': this.token,
    };
  }

  protected async testConnection(): Promise<boolean> {
    const response = await this.getClient().get('/user');
    return response.status === 200;
  }

  async authenticate(token: string, options?: Record<string, string>): Promise<boolean> {
    if (options?.host) {
      this.baseUrl = `${options.host}/api/v4`;
    }
    return super.authenticate(token, options);
  }

  async getWorkflows(repo: Repository): Promise<Workflow[]> {
    this.projectId = encodeURIComponent(`${repo.owner}/${repo.name}`);
    
    const response = await this.getClient().get<GitLabPipelineResponse[]>(
      `/projects/${this.projectId}/pipelines`,
      { params: { per_page: 100 } }
    );

    const workflowMap = new Map<string, Workflow>();
    
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

  async getWorkflowRuns(repo: Repository, workflowId?: string): Promise<WorkflowRun[]> {
    this.projectId = encodeURIComponent(`${repo.owner}/${repo.name}`);

    const endpoint = workflowId
      ? `/projects/${this.projectId}/pipelines/${workflowId}`
      : `/projects/${this.projectId}/pipelines`;

    const response = await this.getClient().get<GitLabPipelineResponse[] | GitLabPipelineResponse>(endpoint, {
      params: { per_page: 30, order_by: 'updated_at', sort: 'desc' },
    });

    const pipelines = Array.isArray(response.data) ? response.data : [response.data];

    return pipelines.map((pipeline) => this.mapPipeline(pipeline));
  }

  async getJobDetails(repo: Repository, runId: string): Promise<Job[]> {
    this.projectId = encodeURIComponent(`${repo.owner}/${repo.name}`);

    const response = await this.getClient().get<GitLabJobResponse[]>(
      `/projects/${this.projectId}/pipelines/${runId}/jobs`
    );

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

  private mapPipeline(pipeline: GitLabPipelineResponse): WorkflowRun {
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

  private mapStatus(status: string): WorkflowStatus {
    const statusMap: Record<string, WorkflowStatus> = {
      'pending': 'queued',
      'running': 'in_progress',
      'success': 'completed',
      'failed': 'failed',
      'canceled': 'completed',
      'skipped': 'completed',
    };
    return statusMap[status] || 'pending';
  }

  private mapConclusion(status: string): WorkflowConclusion {
    const conclusionMap: Record<string, WorkflowConclusion> = {
      'success': 'success',
      'failed': 'failure',
      'canceled': 'cancelled',
      'skipped': 'skipped',
    };
    return conclusionMap[status];
  }
}
