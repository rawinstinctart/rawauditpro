/**
 * Core Agent Type Definitions
 * Defines interfaces for the agent lifecycle: Input → Evaluation → Decision → Action → Status
 */

export interface AgentInput {
  /** Unique identifier for the agent execution */
  executionId: string;

  /** Type of audit or analysis being performed */
  auditType: "seo" | "performance" | "accessibility";

  /** Target website URL */
  targetUrl: string;

  /** Additional context or parameters */
  context?: Record<string, any>;

  /** Timestamp when input was created */
  timestamp: Date;
}

export interface EvaluationResult {
  /** Execution ID from the input */
  executionId: string;

  /** Whether the input is valid and processable */
  isValid: boolean;

  /** Severity level of findings (if any) */
  severity?: "low" | "medium" | "high" | "critical";

  /** Detailed findings from evaluation */
  findings: string[];

  /** Confidence score (0-1) for the evaluation */
  confidence: number;

  /** Timestamp of evaluation */
  evaluatedAt: Date;
}

export interface Decision {
  /** Execution ID */
  executionId: string;

  /** Type of decision made */
  type: "proceed" | "defer" | "escalate" | "skip";

  /** Reasoning for the decision */
  reasoning: string;

  /** Recommended action to take */
  recommendedAction: string;

  /** Risk level of the action */
  riskLevel: "low" | "medium" | "high";

  /** Timestamp of decision */
  decidedAt: Date;
}

export interface Action {
  /** Execution ID */
  executionId: string;

  /** Type of action to perform */
  actionType:
    | "analyze"
    | "crawl"
    | "optimize"
    | "validate"
    | "report"
    | "notify";

  /** Action description */
  description: string;

  /** Parameters for the action */
  parameters: Record<string, any>;

  /** Expected duration in milliseconds */
  expectedDurationMs?: number;

  /** Timestamp of action creation */
  createdAt: Date;
}

export interface ActionResult {
  /** Execution ID */
  executionId: string;

  /** Whether the action succeeded */
  success: boolean;

  /** Output from the action */
  output?: Record<string, any>;

  /** Error message if failed */
  error?: string;

  /** Duration in milliseconds */
  durationMs: number;

  /** Timestamp of completion */
  completedAt: Date;
}

export type AgentStatus =
  | "initialized"
  | "evaluating"
  | "deciding"
  | "acting"
  | "completed"
  | "failed"
  | "paused";

export interface AgentState {
  /** Unique execution ID */
  executionId: string;

  /** Current status */
  status: AgentStatus;

  /** Input data */
  input: AgentInput;

  /** Evaluation results */
  evaluation?: EvaluationResult;

  /** Decision made */
  decision?: Decision;

  /** Action(s) performed */
  actions: Action[];

  /** Action results */
  actionResults: ActionResult[];

  /** Any errors encountered */
  errors: string[];

  /** Start time of execution */
  startedAt: Date;

  /** End time of execution (if completed) */
  endedAt?: Date;
}
