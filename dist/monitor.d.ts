/**
 * Workflow Health Monitor
 * Main orchestrator for CI/CD pipeline monitoring
 */
import { MonitorResult, CLIOptions } from './types';
export declare class Monitor {
    private platform;
    private analyzer;
    private recommendations;
    constructor(platformType: CLIOptions['platform']);
    authenticate(token: string, options?: Record<string, string>): Promise<boolean>;
    run(options: CLIOptions): Promise<MonitorResult>;
    private calculateStats;
    private calculateHealthScore;
}
//# sourceMappingURL=monitor.d.ts.map