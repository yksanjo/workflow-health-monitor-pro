#!/usr/bin/env node

/**
 * CLI Interface for Workflow Health Monitor Pro
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Monitor } from './monitor';
import { Formatter } from './utils/formatters';
import { CLIOptions, PlatformType } from './types';

const program = new Command();

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
      const cliOptions: CLIOptions = {
        platform: options.platform as PlatformType,
        token: options.token,
        owner: options.owner,
        repo: options.repo,
        workflowId: options.workflow,
        limit: parseInt(options.limit, 10),
        host: options.host,
        output: options.output as 'console' | 'json',
      };

      // Validate platform
      const validPlatforms = ['github', 'gitlab', 'bitbucket', 'jenkins', 'circleci'];
      if (!validPlatforms.includes(cliOptions.platform)) {
        console.error(chalk.red(`Error: Invalid platform. Supported platforms: ${validPlatforms.join(', ')}`));
        process.exit(1);
      }

      // Display welcome message
      console.log(chalk.cyan('\n🔍 Workflow Health Monitor Pro'));
      console.log(chalk.gray('Initializing...\n'));

      // Create monitor and authenticate
      const monitor = new Monitor(cliOptions.platform);
      
      const authOptions: Record<string, string> = {};
      if (cliOptions.owner && cliOptions.repo) {
        authOptions.owner = cliOptions.owner;
        authOptions.repo = cliOptions.repo;
      }
      if (cliOptions.host) {
        authOptions.host = cliOptions.host;
      }

      console.log(chalk.gray(`Platform: ${cliOptions.platform.toUpperCase()}`));
      console.log(chalk.gray(`Repository: ${cliOptions.owner}/${cliOptions.repo}`));

      const authenticated = await monitor.authenticate(cliOptions.token, authOptions);
      
      if (!authenticated) {
        console.error(chalk.red('\n❌ Authentication failed. Please check your token and try again.'));
        process.exit(1);
      }

      console.log(chalk.green('✓ Authentication successful\n'));

      // Run analysis
      console.log(chalk.gray('Analyzing workflow runs...'));
      const result = await monitor.run(cliOptions);

      // Format and output results
      const formatter = new Formatter();
      
      if (cliOptions.output === 'json') {
        console.log(formatter.formatJSON(result));
      } else {
        console.log(formatter.formatConsole(result));
      }

      // Summary
      const healthEmoji = result.healthScore.overall >= 80 ? '✅' : result.healthScore.overall >= 60 ? '⚠️' : '❌';
      console.log(chalk.bold(`\n${healthEmoji} Health Score: ${result.healthScore.overall}/100`));
      console.log(chalk.gray(`Found ${result.bottlenecks.length} bottlenecks and ${result.recommendations.length} recommendations.\n`));

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add help for platforms
program.on('--help', () => {
  console.log(`
${chalk.bold('Supported Platforms:')}
  github     - GitHub Actions
  gitlab     - GitLab CI/CD
  bitbucket  - Bitbucket Pipelines
  jenkins    - Jenkins
  circleci   - CircleCI

${chalk.bold('Examples:')}
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
