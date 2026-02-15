#!/usr/bin/env node
"use strict";
/**
 * CLI Interface for Workflow Health Monitor Pro
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const monitor_1 = require("./monitor");
const formatters_1 = require("./utils/formatters");
const program = new commander_1.Command();
program
    .name('whm')
    .description('Workflow Health Monitor Pro - Monitor ANY CI/CD pipeline and get optimization recommendations')
    .version('1.0.0');
program
    .requiredOption('-p, --platform <platform>', 'CI/CD platform (github, gitlab, bitbucket, jenkins, circleci)')
    .requiredOption('-t, --token <token>', 'API token for authentication')
    .requiredOption('-o, --owner <owner>', 'Repository owner or organization')
    .requiredOption('-r, --repo <repo>', 'Repository name')
    .option('-w, --workflow <id>', 'Specific workflow ID to analyze')
    .option('-l, --limit <number>', 'Number of recent runs to analyze', '30')
    .option('-H, --host <url>', 'Self-hosted platform URL (for Jenkins)')
    .option('--output <type>', 'Output format (console, json)', 'console')
    .action(async (options) => {
    try {
        const cliOptions = {
            platform: options.platform,
            token: options.token,
            owner: options.owner,
            repo: options.repo,
            workflowId: options.workflow,
            limit: parseInt(options.limit, 10),
            host: options.host,
            output: options.output,
        };
        // Validate platform
        const validPlatforms = ['github', 'gitlab', 'bitbucket', 'jenkins', 'circleci'];
        if (!validPlatforms.includes(cliOptions.platform)) {
            console.error(chalk_1.default.red(`Error: Invalid platform. Supported platforms: ${validPlatforms.join(', ')}`));
            process.exit(1);
        }
        // Display welcome message
        console.log(chalk_1.default.cyan('\n🔍 Workflow Health Monitor Pro'));
        console.log(chalk_1.default.gray('Initializing...\n'));
        // Create monitor and authenticate
        const monitor = new monitor_1.Monitor(cliOptions.platform);
        const authOptions = {};
        if (cliOptions.owner && cliOptions.repo) {
            authOptions.owner = cliOptions.owner;
            authOptions.repo = cliOptions.repo;
        }
        if (cliOptions.host) {
            authOptions.host = cliOptions.host;
        }
        console.log(chalk_1.default.gray(`Platform: ${cliOptions.platform.toUpperCase()}`));
        console.log(chalk_1.default.gray(`Repository: ${cliOptions.owner}/${cliOptions.repo}`));
        const authenticated = await monitor.authenticate(cliOptions.token, authOptions);
        if (!authenticated) {
            console.error(chalk_1.default.red('\n❌ Authentication failed. Please check your token and try again.'));
            process.exit(1);
        }
        console.log(chalk_1.default.green('✓ Authentication successful\n'));
        // Run analysis
        console.log(chalk_1.default.gray('Analyzing workflow runs...'));
        const result = await monitor.run(cliOptions);
        // Format and output results
        const formatter = new formatters_1.Formatter();
        if (cliOptions.output === 'json') {
            console.log(formatter.formatJSON(result));
        }
        else {
            console.log(formatter.formatConsole(result));
        }
        // Summary
        const healthEmoji = result.healthScore.overall >= 80 ? '✅' : result.healthScore.overall >= 60 ? '⚠️' : '❌';
        console.log(chalk_1.default.bold(`\n${healthEmoji} Health Score: ${result.healthScore.overall}/100`));
        console.log(chalk_1.default.gray(`Found ${result.bottlenecks.length} bottlenecks and ${result.recommendations.length} recommendations.\n`));
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
// Add help for platforms
program.on('--help', () => {
    console.log(`
${chalk_1.default.bold('Supported Platforms:')}
  github     - GitHub Actions
  gitlab     - GitLab CI/CD
  bitbucket  - Bitbucket Pipelines
  jenkins    - Jenkins
  circleci   - CircleCI

${chalk_1.default.bold('Examples:')}
  # Analyze GitHub Actions
  whm -p github -t $GITHUB_TOKEN -o owner -r repo

  # Analyze GitLab CI
  whm -p gitlab -t $GITLAB_TOKEN -o owner -r repo

  # Analyze with JSON output
  whm -p github -t $TOKEN -o owner -r repo --output json

  # Analyze specific workflow
  whm -p github -t $TOKEN -o owner -r repo -w 123456

  # Analyze Jenkins (self-hosted)
  whm -p jenkins -t "user:api_token" -o myorg -r myrepo -H "http://jenkins:8080"
`);
});
program.parse();
//# sourceMappingURL=cli.js.map