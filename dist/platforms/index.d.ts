/**
 * Platform Adapters Index
 */
import { PipelinePlatform, PlatformType } from '../types';
export * from './base';
export * from './github';
export * from './gitlab';
export * from './bitbucket';
export * from './jenkins';
export * from './circleci';
export declare function createPlatform(type: PlatformType): PipelinePlatform;
export declare const SUPPORTED_PLATFORMS: {
    type: PlatformType;
    name: string;
}[];
//# sourceMappingURL=index.d.ts.map