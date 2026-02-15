"use strict";
/**
 * Platform Adapters Index
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_PLATFORMS = void 0;
exports.createPlatform = createPlatform;
const github_1 = require("./github");
const gitlab_1 = require("./gitlab");
const bitbucket_1 = require("./bitbucket");
const jenkins_1 = require("./jenkins");
const circleci_1 = require("./circleci");
__exportStar(require("./base"), exports);
__exportStar(require("./github"), exports);
__exportStar(require("./gitlab"), exports);
__exportStar(require("./bitbucket"), exports);
__exportStar(require("./jenkins"), exports);
__exportStar(require("./circleci"), exports);
function createPlatform(type) {
    switch (type) {
        case 'github':
            return new github_1.GitHubPlatform();
        case 'gitlab':
            return new gitlab_1.GitLabPlatform();
        case 'bitbucket':
            return new bitbucket_1.BitbucketPlatform();
        case 'jenkins':
            return new jenkins_1.JenkinsPlatform();
        case 'circleci':
            return new circleci_1.CircleCIPlatform();
        default:
            throw new Error(`Unsupported platform: ${type}`);
    }
}
exports.SUPPORTED_PLATFORMS = [
    { type: 'github', name: 'GitHub Actions' },
    { type: 'gitlab', name: 'GitLab CI/CD' },
    { type: 'bitbucket', name: 'Bitbucket Pipelines' },
    { type: 'jenkins', name: 'Jenkins' },
    { type: 'circleci', name: 'CircleCI' },
];
//# sourceMappingURL=index.js.map