/**
 * Platform Adapters Index
 */

import { PipelinePlatform, PlatformType } from '../types';
import { GitHubPlatform } from './github';
import { GitLabPlatform } from './gitlab';
import { BitbucketPlatform } from './bitbucket';
import { JenkinsPlatform } from './jenkins';
import { CircleCIPlatform } from './circleci';

export * from './base';
export * from './github';
export * from './gitlab';
export * from './bitbucket';
export * from './jenkins';
export * from './circleci';

export function createPlatform(type: PlatformType): PipelinePlatform {
  switch (type) {
    case 'github':
      return new GitHubPlatform();
    case 'gitlab':
      return new GitLabPlatform();
    case 'bitbucket':
      return new BitbucketPlatform();
    case 'jenkins':
      return new JenkinsPlatform();
    case 'circleci':
      return new CircleCIPlatform();
    default:
      throw new Error(`Unsupported platform: ${type}`);
  }
}

export const SUPPORTED_PLATFORMS: { type: PlatformType; name: string }[] = [
  { type: 'github', name: 'GitHub Actions' },
  { type: 'gitlab', name: 'GitLab CI/CD' },
  { type: 'bitbucket', name: 'Bitbucket Pipelines' },
  { type: 'jenkins', name: 'Jenkins' },
  { type: 'circleci', name: 'CircleCI' },
];
