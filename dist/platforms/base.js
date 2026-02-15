"use strict";
/**
 * Base Platform Adapter
 * Abstract class for CI/CD platform adapters
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlatform = void 0;
const axios_1 = __importDefault(require("axios"));
class BasePlatform {
    constructor() {
        this.client = null;
        this.token = '';
    }
    async authenticate(token, options) {
        this.token = token;
        this.client = axios_1.default.create({
            baseURL: this.getApiUrl(),
            headers: {
                'Accept': 'application/json',
                ...this.getAuthHeaders(),
            },
            timeout: 30000,
        });
        try {
            return await this.testConnection();
        }
        catch (error) {
            this.client = null;
            return false;
        }
    }
    getClient() {
        if (!this.client) {
            throw new Error('Platform not authenticated. Call authenticate() first.');
        }
        return this.client;
    }
    calculateDuration(startTime, endTime) {
        const start = new Date(startTime).getTime();
        const end = endTime ? new Date(endTime).getTime() : Date.now();
        return Math.floor((end - start) / 1000);
    }
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}m ${secs}s`;
        }
        else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${mins}m`;
        }
    }
}
exports.BasePlatform = BasePlatform;
//# sourceMappingURL=base.js.map