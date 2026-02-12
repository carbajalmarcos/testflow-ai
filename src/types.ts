/**
 * Core type definitions for testflow-ai.
 */

// -- Context --

/** Project context loaded from a markdown file. */
export interface ProjectContext {
  name: string;
  description: string;
  baseUrls: Record<string, string>;
  endpoints: EndpointDefinition[];
  rules: string[];
  ai?: AiContextConfig;
}

/** API endpoint definition extracted from the context file. */
export interface EndpointDefinition {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description?: string;
}

/** AI configuration from the context file. */
export interface AiContextConfig {
  provider?: AiProvider;
  url?: string;
  apiKey?: string;
  model?: string;
}

// -- Test flows --

/** A complete test flow: a named sequence of steps. */
export interface TestFlow {
  name: string;
  description?: string;
  tags?: string[];
  steps: TestStep[];
}

/** A single test step inside a flow. */
export interface TestStep {
  name: string;
  description?: string;
  request: RequestDefinition;
  capture?: CaptureDefinition[];
  assertions?: AssertionDefinition[];
  /** Poll until a condition is met (useful for async operations). */
  waitUntil?: WaitUntilConfig;
}

/** HTTP request definition. */
export interface RequestDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  graphql?: GraphQLRequest;
}

/** GraphQL-specific request fields. */
export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

/** Capture a value from the response into a named variable. */
export interface CaptureDefinition {
  name: string;
  /** Dot-notation path to extract from the response body (e.g. `data.user.id`). */
  path: string;
}

/** Assert a condition on the response. */
export interface AssertionDefinition {
  /** Dot-notation path to the value to check (`status` for HTTP status code). */
  path: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'notContains'
    | 'exists'
    | 'notExists'
    | 'greaterThan'
    | 'lessThan'
    | 'matches'
    | 'ai-evaluate';
  /** Expected value, or evaluation prompt for `ai-evaluate`. */
  value?: unknown;
  /** Custom message shown on failure. */
  message?: string;
}

/** Polling configuration for async operations. */
export interface WaitUntilConfig {
  path: string;
  operator: 'equals' | 'notEquals' | 'exists' | 'notExists';
  value?: unknown;
  /** Max wait time in ms (default: 30 000). */
  timeout?: number;
  /** Poll interval in ms (default: 2 000). */
  interval?: number;
}

// -- Results --

/** Result of executing a complete flow. */
export interface FlowResult {
  flow: TestFlow;
  success: boolean;
  duration: number;
  steps: StepResult[];
  variables: Record<string, unknown>;
}

/** Result of executing a single step. */
export interface StepResult {
  step: TestStep;
  success: boolean;
  duration: number;
  request: { method: string; url: string; body?: unknown };
  response?: { status: number; headers: Record<string, string>; body: unknown };
  captures: Record<string, unknown>;
  assertions: AssertionResult[];
  error?: string;
}

/** Result of a single assertion evaluation. */
export interface AssertionResult {
  assertion: AssertionDefinition;
  success: boolean;
  actual?: unknown;
  message: string;
}

// -- Report --

/** Aggregated test report. */
export interface TestReport {
  timestamp: Date;
  duration: number;
  totalFlows: number;
  passedFlows: number;
  failedFlows: number;
  flows: FlowResult[];
  narrative: string;
}

// -- AI --

/** AI provider type. */
export type AiProvider = 'ollama' | 'openai' | 'anthropic';

/** AI evaluator configuration. */
export interface AiConfig {
  /** AI provider (default: `ollama`). */
  provider?: AiProvider;
  /** API URL (for Ollama, default: `http://localhost:11434`). */
  url?: string;
  /** API key (required for OpenAI and Anthropic). */
  apiKey?: string;
  /** Model name (default varies by provider). */
  model?: string;
  /** Request timeout in ms (default: 30 000). */
  timeout?: number;
}

/** Result returned by the AI evaluator. */
export interface AiEvaluation {
  pass: boolean;
  confidence: number;
  reason: string;
}
