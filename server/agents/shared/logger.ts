/**
 * Agent Logger
 * Stub implementation for agent activity logging
 * TODO: Implement persistent logging to database
 */

export interface LogEntry {
  executionId: string;
  eventType: string;
  message?: string;
  data?: Record<string, any>;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
}

export class AgentLogger {
  private executionId: string;
  private logs: LogEntry[] = [];

  constructor(executionId: string) {
    this.executionId = executionId;
  }

  /**
   * Log an event
   * TODO: Persist to database
   */
  log(
    eventType: string,
    data?: Record<string, any>,
    level: "info" | "warn" | "error" | "debug" = "info"
  ): void {
    const entry: LogEntry = {
      executionId: this.executionId,
      eventType,
      data,
      timestamp: new Date(),
      level,
    };

    this.logs.push(entry);

    // STUB: Console output for development
    console.log(`[Agent:${this.executionId}] ${eventType}`, data);
  }

  /**
   * Get all logs for this execution
   */
  getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Export logs to JSON
   * TODO: Add proper formatting
   */
  toJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
