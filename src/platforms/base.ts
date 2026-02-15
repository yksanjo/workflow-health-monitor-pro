/**
 * Base Platform Adapter
 * Abstract class for CI/CD platform adapters
 */

import axios, { AxiosInstance } from 'axios';
import { PipelinePlatform, Repository, Workflow, WorkflowRun, Job, WorkflowStats, PlatformType } from '../types';

export abstract class BasePlatform implements PipelinePlatform {
  abstract readonly name: string;
  abstract readonly type: PlatformType;
  protected client: AxiosInstance | null = null;
  protected token: string = '';

  abstract getApiUrl(): string;
  abstract getAuthHeaders(): Record<string, string>;

  async authenticate(token: string, options?: Record<string, string>): Promise<boolean> {
    this.token = token;
    this.client = axios.create({
      baseURL: this.getApiUrl(),
      headers: {
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
      timeout: 30000,
    });

    try {
      return await this.testConnection();
    } catch (error) {
      this.client = null;
      return false;
    }
  }

  protected abstract testConnection(): Promise<boolean>;

  protected getClient(): AxiosInstance {
    if (!this.client) {
      throw new Error('Platform not authenticated. Call authenticate() first.');
    }
    return this.client;
  }

  abstract getWorkflows(repo: Repository): Promise<Workflow[]>;
  abstract getWorkflowRuns(repo: Repository, workflowId?: string): Promise<WorkflowRun[]>;
  abstract getJobDetails(repo: Repository, runId: string): Promise<Job[]>;
  abstract getWorkflowStats(repo: Repository, workflowId: string): Promise<WorkflowStats>;

  protected calculateDuration(startTime: string, endTime?: string): number {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    return Math.floor((end - start) / 1000);
  }

  protected formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
  }
}
