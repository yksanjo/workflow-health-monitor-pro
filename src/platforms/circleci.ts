/**
 * CircleCI Platform Adapter
 */

import axios from 'axios';
import { BasePlatform } from './base';
import { Repository, Workflow, WorkflowRun, Job, WorkflowStats, WorkflowStatus, WorkflowConclusion } from '../types';

interface CircleCIPipelineResponse {
  id: string;
  project_slug: string;
  number: number;
  state: string;
  trigger: {
    type: string;
  };
  vcs: {
    branch: string;
    revision: string;
  };
  created_at: string;
  updated_at: string;
}

interface CircleCIWorkflowResponse {
  id: string;
  name: string;
  status: string;
  created_at: string;
  stopped_at: string | null;
  duration: number | null;
}

interface CircleCIJobResponse {
  id: string;
  name: string;
  status: string;
  started_at: string | null;
  stopped_at: string | null;
  duration: number | null;
}

export class CircleCIPlatform extends BasePlatform {
  readonly name = 'CircleCI';
  readonly type = 'circleci' as const;

  private projectSlug: string = '';
  private baseUrl: string = 'https://circleci.com/api/v2';

  getApiUrl(): string {
    return this.baseUrl;
  }

  getAuthHeaders(): Record<string, string> {
    return {
      'Circle-Token': this.token,
    };
  }

  protected async testConnection(): Promise<boolean> {
    const response = await this.getClient().get('/me');
    return response.status === 200;
  }

  async authenticate(token: string, options?: Record<string, string>): Promise<boolean> {
    return super.authenticate(token, options);
  }

  async getWorkflows(repo: Repository): Promise<Workflow[]> {
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

  async getWorkflowRuns(repo: Repository, workflowId?: string): Promise<WorkflowRun[]> {
    this.projectSlug = `${repo.owner}/${repo.name}`;

    const endpoint = workflowId
      ? `/pipeline/${workflowId}/workflow`
      : `/project/${this.projectSlug}/pipeline`;

    const response = await this.getClient().get(endpoint, {
      params: { 'page-token': '' },
    });

    const items = response.data.items || response.data;
    const workflows: CircleCIWorkflowResponse[] = Array.isArray(items) ? items : [items];

    // Get pipeline details for each workflow
    const workflowRuns: WorkflowRun[] = await Promise.all(
      workflows.slice(0, 30).map(async (wf) => {
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
      })
    );

    return workflowRuns;
  }

  async getJobDetails(repo: Repository, runId: string): Promise<Job[]> {
    const response = await this.getClient().get(`/workflow/${runId}/job`);

    const jobs = response.data.items || [];
    return jobs.map((job: CircleCIJobResponse) => ({
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

  private mapStatus(status: string): WorkflowStatus {
    const statusMap: Record<string, WorkflowStatus> = {
      'pending': 'queued',
      'running': 'in_progress',
      'success': 'completed',
      'failed': 'failed',
      'canceled': 'completed',
      'not_run': 'pending',
    };
    return statusMap[status] || 'pending';
  }

  private mapConclusion(status: string): WorkflowConclusion {
    const conclusionMap: Record<string, WorkflowConclusion> = {
      'success': 'success',
      'failed': 'failure',
      'canceled': 'cancelled',
      'timed_out': 'cancelled',
    };
    return conclusionMap[status];
  }
}
