/**
 * Workflow Health Monitor Pro - Type Definitions
 */

export type PlatformType = 'github' | 'gitlab' | 'bitbucket' | 'jenkins' | 'circleci';

export type WorkflowStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'pending' | 'running';
export type WorkflowConclusion = 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | undefined;

export type BottleneckType = 'slow_job' | 'failure' | 'sequential' | 'queue_wait' | 'resource';
export type Severity = 'high' | 'medium' | 'low';

export type RecommendationCategory = 'parallelization' | 'caching' | 'resources' | 'tests' | 'artifacts' | 'dependencies';
export type RecommendationPriority = 'high' | 'medium' | 'low';

// Base Interfaces
export interface Step {
  id: string;
  name: string;
  status: WorkflowStatus;
  conclusion?: WorkflowConclusion;
  number: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

export interface Job {
  id: string;
  name: string;
  status: WorkflowStatus;
  conclusion?: WorkflowConclusion;
  startedAt?: string;
  completedAt?: string;
  duration: number;
  steps: Step[];
  runId?: string;
}

export interface WorkflowRun {
  id: string;
  name: string;
  workflowId: string;
  status: WorkflowStatus;
  conclusion?: WorkflowConclusion;
  runNumber: number;
  event: string;
  branch: string;
  commit?: string;
  startedAt: string;
  completedAt?: string;
  duration: number;
  jobs: Job[];
  url?: string;
}

export interface Workflow {
  id: string;
  name: string;
  path?: string;
  fileName?: string;
  runs: WorkflowRun[];
}

export interface Repository {
  owner: string;
  name: string;
  url?: string;
}

// Platform Interface
export interface PipelinePlatform {
  readonly name: string;
  readonly type: PlatformType;
  
  authenticate(token: string, options?: Record<string, string>): Promise<boolean>;
  getWorkflows(repo: Repository): Promise<Workflow[]>;
  getWorkflowRuns(repo: Repository, workflowId?: string): Promise<WorkflowRun[]>;
  getJobDetails(repo: Repository, runId: string): Promise<Job[]>;
  getWorkflowStats(repo: Repository, workflowId: string): Promise<WorkflowStats>;
}

export interface WorkflowStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  averageDuration: number;
  averageQueueTime: number;
  lastRun?: WorkflowRun;
}

// Analysis Interfaces
export interface Bottleneck {
  id: string;
  type: BottleneckType;
  severity: Severity;
  title: string;
  description: string;
  jobName?: string;
  workflowName?: string;
  potentialSavings: number; // in seconds
  evidence: string;
}

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  estimatedImprovement: string;
  implementationEffort: 'low' | 'medium' | 'high';
  relatedJobs?: string[];
  codeSnippet?: string;
}

export interface HealthScore {
  overall: number;
  reliability: number;
  performance: number;
  efficiency: number;
  breakdown: {
    successRate: number;
    avgDuration: number;
    bottleneckCount: number;
    optimizationPotential: number;
  };
}

// Monitor Result
export interface MonitorResult {
  platform: PlatformType;
  repository: Repository;
  timestamp: Date;
  healthScore: HealthScore;
  stats: WorkflowStats;
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
  workflows: Workflow[];
}

// CLI Options
export interface CLIOptions {
  platform: PlatformType;
  token: string;
  owner: string;
  repo: string;
  workflowId?: string;
  limit?: number;
  output?: 'console' | 'json';
  host?: string; // For self-hosted platforms
}

// Platform Configuration
export interface PlatformConfig {
  type: PlatformType;
  name: string;
  apiUrl: string;
  tokenEnvVar: string;
  authType: 'bearer' | 'basic' | 'api_key';
}
