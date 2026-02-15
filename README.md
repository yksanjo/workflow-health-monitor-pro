# Workflow Health Monitor Pro

A standalone CLI tool that monitors ANY CI/CD pipeline, identifies bottlenecks, and auto-generates optimization recommendations. Supports GitHub Actions, GitLab CI/CD, Bitbucket Pipelines, Jenkins, and CircleCI.

## Features

- **Multi-Platform Support**: Works with GitHub Actions, GitLab CI/CD, Bitbucket Pipelines, Jenkins, and CircleCI
- **Bottleneck Detection**: Automatically identifies slow jobs, failure patterns, sequential executions, and queue wait times
- **Health Scoring**: Calculates overall pipeline health based on reliability, performance, and efficiency
- **Optimization Recommendations**: Provides actionable recommendations with code examples
- **Flexible Output**: Console output with color-coded results or JSON export for integration

## Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/workflow-health-monitor-pro.git
cd workflow-health-monitor-pro

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Command Line

```bash
# Analyze GitHub Actions
whm -p github -t $GITHUB_TOKEN -o owner -r repo

# Analyze GitLab CI/CD
whm -p gitlab -t $GITLAB_TOKEN -o owner -r repo

# Analyze Bitbucket Pipelines
whm -p bitbucket -t $BITBUCKET_TOKEN -o owner -r repo

# Analyze Jenkins (self-hosted)
whm -p jenkins -t "user:api_token" -o myorg -r myrepo -H "http://jenkins:8080"

# Analyze CircleCI
whm -p circleci -t $CIRCLECI_TOKEN -o owner -r repo

# Output as JSON
whm -p github -t $TOKEN -o owner -r repo --output json

# Analyze specific workflow
whm -p github -t $TOKEN -o owner -r repo -w 123456

# Limit number of runs analyzed
whm -p github -t $TOKEN -o owner -r repo -l 10
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--platform` | `-p` | CI/CD platform (github, gitlab, bitbucket, jenkins, circleci) |
| `--token` | `-t` | API token for authentication |
| `--owner` | `-o` | Repository owner or organization |
| `--repo` | `-r` | Repository name |
| `--workflow` | `-w` | Specific workflow ID to analyze |
| `--limit` | `-l` | Number of recent runs to analyze (default: 30) |
| `--host` | `-H` | Self-hosted platform URL (for Jenkins) |
| `--output` | - | Output format: console or json (default: console) |

### Programmatic Usage

```typescript
import { Monitor } from './src/index';

async function main() {
  const monitor = new Monitor('github');
  
  const authenticated = await monitor.authenticate('your-token', {
    owner: 'owner',
    repo: 'repo',
  });
  
  if (authenticated) {
    const result = await monitor.run({
      platform: 'github',
      token: 'your-token',
      owner: 'owner',
      repo: 'repo',
      limit: 30,
    });
    
    console.log(`Health Score: ${result.healthScore.overall}/100`);
    console.log(`Bottlenecks: ${result.bottlenecks.length}`);
    console.log(`Recommendations: ${result.recommendations.length}`);
  }
}

main();
```

## Output Example

```
══════════════════════════════════════════════════════════════
  WORKFLOW HEALTH MONITOR PRO
══════════════════════════════════════════════════════════════
Platform: GITHUB
Repository: owner/repo
Analyzed at: 2024-01-15T10:30:00.000Z

──────────────────────────────────────────────────────────────
  HEALTH SCORE
──────────────────────────────────────────────────────────────
  Overall: 75/100
  
  Reliability:  ████████░░ 85%
  Performance:  ███████░░░ 70%
  Efficiency:   ██████░░░░ 60%

──────────────────────────────────────────────────────────────
  STATISTICS
──────────────────────────────────────────────────────────────
  Total Runs:      30
  Success Rate:   85.0%
  Failures:       4
  Avg Duration:   5m 30s
  Avg Queue Time:  15s

──────────────────────────────────────────────────────────────
  BOTTLENECKS (2 found)
──────────────────────────────────────────────────────────────

  🔴 HIGH Slow Job: build
     Average execution time is 3m 45s, which exceeds the 5m threshold.
     Evidence: Average duration: 3m 45s across 30 runs
     Potential savings: 1m 52s

  🟡 MEDIUM Frequent Failures: test
     Job has a 15.0% failure rate (5/30 runs).
     Evidence: Failed 5 times out of 30 executions
     Potential savings: 1500s

──────────────────────────────────────────────────────────────
  RECOMMENDATIONS
──────────────────────────────────────────────────────────────

  🔴 HIGH Implement Caching for Dependencies
     The job "build" takes a long time to run. Implementing dependency caching...
     Improvement: 30-60% reduction in execution time
     Effort: low
     Code example:
     # GitHub Actions caching example
     - name: Cache node modules
       uses: actions/cache@v3

  🟡 MEDIUM Investigate Flaky Tests
     The job "test" has a high failure rate. Consider implementing test retry...
     Improvement: 50-80% reduction in flaky test failures
     Effort: medium

⚠️ Health Score: 75/100
Found 2 bottlenecks and 5 recommendations.
```

## API Tokens

### GitHub
Create a Personal Access Token with `repo` scope: https://github.com/settings/tokens

### GitLab
Create a Personal Access Token with `read_api` scope: https://gitlab.com/-/profile/personal_access_tokens

### Bitbucket
Create an App Password with `repo` read access: https://bitbucket.org/account/settings/app-passwords/

### CircleCI
Create a Personal API Token: https://app.circleci.com/settings/user/api

### Jenkins
Use your username and API token from Jenkins user settings.

## Development

```bash
# Run in development mode
npm run dev

# Build
npm run build

# Run CLI
node dist/cli.js -p github -t $TOKEN -o owner -r repo
```

## License

MIT
