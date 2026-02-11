/**
 * testflow-ai
 *
 * Declarative API testing powered by YAML flows.
 * Define test sequences in YAML, run them against any HTTP/GraphQL backend,
 * capture variables between steps, and assert outcomes — with optional
 * AI-powered evaluation via a local Ollama instance.
 *
 * @example
 * ```ts
 * import { runTests } from 'testflow-ai';
 *
 * const report = await runTests({
 *   contextFile: './context.md',
 *   testDir: './tests',
 *   format: 'console',
 * });
 *
 * process.exit(report.failedFlows > 0 ? 1 : 0);
 * ```
 */

// Types
export type {
  ProjectContext,
  EndpointDefinition,
  AiContextConfig,
  TestFlow,
  TestStep,
  RequestDefinition,
  GraphQLRequest,
  CaptureDefinition,
  AssertionDefinition,
  WaitUntilConfig,
  FlowResult,
  StepResult,
  AssertionResult,
  TestReport,
  AiConfig,
  AiEvaluation,
} from './types.js';

// Parser
export { parseYaml, parseYamlFile, parseContext, parseContextFile, discoverTestFiles } from './parser.js';

// Executor
export { FlowExecutor, extractValue, interpolate, evaluateAssertion } from './executor.js';

// Reporter
export { generateNarrative, generateTechnicalReport, printConsoleReport, toJSON, toMarkdown } from './reporter.js';

// Runner
export { TestRunner, runTests, type RunnerOptions } from './runner.js';

// AI
export { evaluateWithAi, resolveAiConfig } from './ai.js';
