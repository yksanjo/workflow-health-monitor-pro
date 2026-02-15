/**
 * Jenkins Platform Adapter
 */

import axios from 'axios';
import { BasePlatform } from './base';
import { Repository, Workflow, WorkflowRun, Job, WorkflowStats, WorkflowStatus, WorkflowConclusion } from '../types';

interface JenkinsBuildResponse {
  id: string;
  number: number;
  result: string | null;
  building: boolean;
  timestamp: number;
  duration: number;
  url: string;
  actions: Array<Record<string, unknown>>;
}

interface JenkinsJobResponse {
  name: string;
  url: string;
  color: string;
}

export class JenkinsPlatform extends BasePlatform {
  readonly name = 'Jenkins';
  readonly type = 'jenkins' as const;

  private baseUrl: string = '';
  private jobName: string = '';

  getApiUrl(): string {
    return `${this.baseUrl}/api/json`;
  }

  getAuthHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.token}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
    };
  }

  protected async testConnection(): Promise<boolean> {
    const response = await this.getClient().get('', { params: { tree: 'mode' } });
    return response.status === 200;
  }

  async authenticate(token: string, options?: Record<string, string>): Promise<boolean> {
    if (options?.host) {
      this.baseUrl = options.host;
    } else {
      throw new Error('Jenkins requires --host parameter');
    }
    if (options?.repo) {
      this.jobName = options.repo;
    }
    this.token = token;
    
    this.client = axios.create({
      baseURL: this.getApiUrl(),
      headers: {
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
      timeout: 30000,
    });

    return this.testConnection();
  }

  async getWorkflows(repo: Repository): Promise<Workflow[]> {
    const response = await this.getClient().get('', {
      params: { tree: 'jobs[name,url,color]' },
    });

    return response.data.jobs?.map((job: JenkinsJobResponse) => ({
      id: job.name,
      name: job.name,
      runs: [],
    })) || [];
  }

  async getWorkflowRuns(repo: Repository, workflowId?: string): Promise<WorkflowRun[]> {
    const jobName = workflowId || repo.name || this.jobName;
    
    const response = await this.getClient().get(`/job/${jobName}/api/json`, {
      params: { tree: 'builds[id,number,result,building,timestamp,duration,url]' },
    });

    const builds = response.data.builds || [];
    return builds.slice(0, 30).map((build: JenkinsBuildResponse) => this.mapBuild(build));
  }

  async getJobDetails(repo: Repository, runId: string): Promise<Job[]> {
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

  private mapBuild(build: JenkinsBuildResponse): WorkflowRun {
    let cause = 'Manual';
    try {
      const causeAction = build.actions?.find((a) => a.causes);
      if (causeAction && Array.isArray(causeAction.causes)) {
        cause = (causeAction.causes[0] as { shortDescription: string })?.shortDescription || 'Manual';
      }
    } catch {
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

  private mapConclusion(result: string | null): WorkflowConclusion {
    if (!result) return undefined;
    if (result === 'SUCCESS') return 'success';
    if (result === 'FAILURE') return 'failure';
    if (result === 'ABORTED') return 'cancelled';
    return 'cancelled';
  }
}
