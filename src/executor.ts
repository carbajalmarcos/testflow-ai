/**
 * Flow executor — runs HTTP requests, captures variables, and evaluates assertions.
 */

import axios, { type AxiosResponse, type AxiosError } from 'axios';
import { evaluateWithAi, resolveAiConfig } from './ai.js';
import type {
    TestFlow,
    TestStep,
    FlowResult,
    StepResult,
    AssertionResult,
    AssertionDefinition,
    ProjectContext,
    AiConfig,
} from './types.js';

// -- Public utilities (also used by tests) --

/** Extract a value from a nested object using dot-notation (supports array indices). */
export function extractValue(obj: unknown, path: string): unknown {
    let current: unknown = obj;

    for (const part of path.split('.')) {
        if (current === null || current === undefined) return undefined;

        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
            current = (current as Record<string, unknown>)[arrayMatch[1]];
            if (Array.isArray(current)) current = current[parseInt(arrayMatch[2], 10)];
            else return undefined;
        } else {
            current = (current as Record<string, unknown>)[part];
        }
    }

    return current;
}

/** Interpolate `${var}` references in a string. */
export function interpolate(str: string, variables: Record<string, unknown>): string {
    if (!str || typeof str !== 'string') return str || '';

    return str.replace(/\$\{(\w+(?:\[\d+\])?(?:\.\w+(?:\[\d+\])?)*)\}/g, (_, varPath) => {
        const value = extractValue(variables, varPath);
        if (value === undefined) return `\${${varPath}}`;
        if (typeof value === 'object' && value !== null) return JSON.stringify(value);
        return String(value);
    });
}

/** Evaluate a single assertion against an actual value. */
export function evaluateAssertion(
    assertion: AssertionDefinition,
    actual: unknown,
): AssertionResult {
    let success = false;
    let message = '';

    switch (assertion.operator) {
        case 'equals':
            success = JSON.stringify(actual) === JSON.stringify(assertion.value);
            message = success
                ? `${assertion.path} equals ${JSON.stringify(assertion.value)}`
                : `Expected ${assertion.path} to equal ${JSON.stringify(assertion.value)}, got ${JSON.stringify(actual)}`;
            break;

        case 'notEquals':
            success = JSON.stringify(actual) !== JSON.stringify(assertion.value);
            message = success
                ? `${assertion.path} does not equal ${JSON.stringify(assertion.value)}`
                : `Expected ${assertion.path} to not equal ${JSON.stringify(assertion.value)}`;
            break;

        case 'contains':
            if (typeof actual === 'string') success = actual.includes(String(assertion.value));
            else if (Array.isArray(actual)) success = actual.includes(assertion.value);
            message = success
                ? `${assertion.path} contains ${JSON.stringify(assertion.value)}`
                : `Expected ${assertion.path} to contain ${JSON.stringify(assertion.value)}`;
            break;

        case 'notContains':
            if (typeof actual === 'string') success = !actual.includes(String(assertion.value));
            else if (Array.isArray(actual)) success = !actual.includes(assertion.value);
            else success = true;
            message = success
                ? `${assertion.path} does not contain ${JSON.stringify(assertion.value)}`
                : `Expected ${assertion.path} to not contain ${JSON.stringify(assertion.value)}`;
            break;

        case 'exists':
            success = actual !== undefined && actual !== null;
            message = success ? `${assertion.path} exists` : `Expected ${assertion.path} to exist`;
            break;

        case 'notExists':
            success = actual === undefined || actual === null;
            message = success
                ? `${assertion.path} does not exist`
                : `Expected ${assertion.path} to not exist`;
            break;

        case 'greaterThan':
            success = typeof actual === 'number' && actual > (assertion.value as number);
            message = success
                ? `${assertion.path} (${actual}) > ${assertion.value}`
                : `Expected ${assertion.path} to be > ${assertion.value}, got ${actual}`;
            break;

        case 'lessThan':
            success = typeof actual === 'number' && actual < (assertion.value as number);
            message = success
                ? `${assertion.path} (${actual}) < ${assertion.value}`
                : `Expected ${assertion.path} to be < ${assertion.value}, got ${actual}`;
            break;

        case 'matches':
            if (typeof actual === 'string' && typeof assertion.value === 'string') {
                success = new RegExp(assertion.value).test(actual);
            }
            message = success
                ? `${assertion.path} matches ${assertion.value}`
                : `Expected ${assertion.path} to match ${assertion.value}`;
            break;

        case 'ai-evaluate':
            // Handled asynchronously in the executor; sync fallback.
            message = 'AI evaluation requires async execution';
            break;
    }

    return { assertion, success, actual, message: assertion.message || message };
}

// -- FlowExecutor --

export class FlowExecutor {
    private variables: Record<string, unknown> = {};
    private context?: ProjectContext;
    private aiConfig?: AiConfig;
    private verbose: boolean;

    constructor(context?: ProjectContext, verbose = false, aiConfig?: Partial<AiConfig>) {
        this.context = context;
        this.verbose = verbose;

        // Resolve AI config from explicit param, context file, or defaults.
        if (aiConfig) {
            this.aiConfig = resolveAiConfig(aiConfig);
        } else if (context?.ai) {
            this.aiConfig = resolveAiConfig(context.ai);
        }
    }

    /** Execute a complete test flow (all steps in sequence). */
    async executeFlow(flow: TestFlow): Promise<FlowResult> {
        const start = Date.now();
        const stepResults: StepResult[] = [];
        let success = true;
        this.variables = {};

        if (this.verbose) {
            console.log(`\n📋 Flow: ${flow.name}`);
            if (flow.description) console.log(`   ${flow.description}`);
            console.log(`   Steps: ${flow.steps.length}`);
        }

        for (let i = 0; i < flow.steps.length; i++) {
            if (this.verbose) console.log(`\n[${i + 1}/${flow.steps.length}]`);
            const result = await this.executeStep(flow.steps[i]);
            stepResults.push(result);
            if (!result.success) success = false;
        }

        return { flow, success, duration: Date.now() - start, steps: stepResults, variables: { ...this.variables } };
    }

    /** Execute a single step: request → capture → assert. */
    async executeStep(step: TestStep): Promise<StepResult> {
        const start = Date.now();
        const captures: Record<string, unknown> = {};
        const assertions: AssertionResult[] = [];

        if (this.verbose) {
            console.log(`\n🧪 Step: ${step.name}`);
            if (step.description) console.log(`   ${step.description}`);
        }

        try {
            const resolved = this.resolveVariables(step.request);
            const url = this.resolveUrl(resolved.url);
            let body = resolved.body;

            // GraphQL
            if (resolved.graphql) {
                const query = resolved.graphql.query ? this.interpolateStr(resolved.graphql.query) : undefined;
                let variables = resolved.graphql.variables
                    ? this.resolveVariables(resolved.graphql.variables)
                    : undefined;
                if (variables && typeof variables === 'object') variables = this.parseJsonStrings(variables) as typeof variables;

                body = { query, variables, operationName: resolved.graphql.operationName };

                if (this.verbose) {
                    const op = resolved.graphql.operationName || query?.match(/(?:mutation|query)\s+(\w+)/)?.[1] || 'operation';
                    console.log(`   📡 GraphQL ${op} → ${url}`);
                }
            } else if (this.verbose) {
                console.log(`   📡 ${resolved.method} ${url}`);
            }

            // HTTP request
            const reqStart = Date.now();
            let response = await axios({
                method: resolved.method,
                url,
                headers: resolved.headers,
                data: body,
                validateStatus: () => true,
            });

      if (this.verbose) {
        const icon = response.status >= 200 && response.status < 300 ? '✅' : '❌';
        console.log(`   ${icon} ${response.status} (${Date.now() - reqStart}ms)`);
      }

            // Polling (waitUntil)
            if (step.waitUntil) {
                response = await this.poll(step.waitUntil, resolved, url, body, response);
            }

            // GraphQL errors
      if (resolved.graphql && response.data?.errors && this.verbose) {
        for (const err of response.data.errors) {
          console.log(`   ⚠️ ${(err as { message?: string }).message || 'GraphQL error'}`);
        }
      }

            // Capture
            if (step.capture) {
                for (const cap of step.capture) {
                    const val = extractValue(response.data, cap.path);
                    captures[cap.name] = val;
                    this.variables[cap.name] = val;
          if (this.verbose) {
            const display = val != null
              ? (typeof val === 'string' ? val.substring(0, 40) : JSON.stringify(val).substring(0, 40))
              : String(val);
            console.log(`   📦 ${cap.name} = ${display}`);
          }
                }
            }

            // Assertions
            if (step.assertions) {
                for (const a of step.assertions) {
                    const actual =
                        a.path === 'httpStatus' || (a.path === 'status' && typeof a.value === 'number')
                            ? response.status
                            : extractValue(response.data, a.path);

                    if (a.operator === 'ai-evaluate') {
                        assertions.push(await this.runAiAssertion(a, actual));
                    } else {
                        assertions.push(evaluateAssertion(a, actual));
                    }
                }
            }

            return {
                step,
                success: assertions.every((a) => a.success),
                duration: Date.now() - start,
                request: { method: resolved.method, url, body },
                response: { status: response.status, headers: response.headers as Record<string, string>, body: response.data },
                captures,
                assertions,
            };
        } catch (error) {
            return {
                step,
                success: false,
                duration: Date.now() - start,
                request: { method: step.request.method, url: step.request.url },
                captures,
                assertions,
                error: (error as AxiosError).message || String(error),
            };
        }
    }

    // -- Private helpers --

    private async poll(
        config: NonNullable<TestStep['waitUntil']>,
        resolved: TestStep['request'],
        url: string,
        body: unknown,
        initial: AxiosResponse,
    ): Promise<AxiosResponse> {
        const timeout = config.timeout || 30_000;
        const interval = config.interval || 2_000;
        const waitStart = Date.now();
        let response = initial;

    if (this.verbose) {
      console.log(`   ⏳ Polling ${config.path} ${config.operator} ${config.value !== undefined ? JSON.stringify(config.value) : ''} (max ${timeout}ms)`);
    }

        while (Date.now() - waitStart < timeout) {
            const actual = extractValue(response.data, config.path);
            let met = false;

            switch (config.operator) {
                case 'equals': met = JSON.stringify(actual) === JSON.stringify(config.value); break;
                case 'notEquals': met = JSON.stringify(actual) !== JSON.stringify(config.value); break;
                case 'exists': met = actual !== undefined && actual !== null; break;
                case 'notExists': met = actual === undefined || actual === null; break;
            }

      if (met) {
        if (this.verbose) console.log(`   ✅ Condition met: ${config.path} = ${JSON.stringify(actual)}`);
        return response;
      }

            await new Promise((r) => setTimeout(r, interval));

            response = await axios({
                method: resolved.method,
                url,
                headers: resolved.headers,
                data: body,
                validateStatus: () => true,
            });

            if (this.verbose) {
                console.log(`   Polling... (${Date.now() - waitStart}ms elapsed)`);
            }
        }

        if (this.verbose) console.log(`   ⚠️ Timeout after ${Date.now() - waitStart}ms`);
        return response;
    }

    private async runAiAssertion(assertion: AssertionDefinition, actual: unknown): Promise<AssertionResult> {
        if (!this.aiConfig) {
            return {
                assertion,
                success: false,
                actual,
                message: assertion.message || 'AI evaluation requires Ollama configuration. See docs for setup.',
            };
        }

        const evaluation = await evaluateWithAi(this.aiConfig, actual, String(assertion.value));
        return {
            assertion,
            success: evaluation.pass,
            actual,
            message: assertion.message || (evaluation.pass
                ? `AI passed (${(evaluation.confidence * 100).toFixed(0)}%): ${evaluation.reason}`
                : `AI failed: ${evaluation.reason}`),
        };
    }

    private resolveUrl(url: string): string {
        if (url.startsWith('http://') || url.startsWith('https://')) return url;

        const m = url.match(/^\{(\w+)\}(.*)$/);
        if (m && this.context?.baseUrls[m[1]]) return this.context.baseUrls[m[1]] + m[2];

        if (this.context?.baseUrls) {
            const defaultBase = Object.values(this.context.baseUrls)[0];
            if (defaultBase) return defaultBase + url;
        }

        return url;
    }

    private resolveVariables<T>(obj: T): T {
        if (typeof obj === 'string') {
            const result = this.interpolateStr(obj);
            if (result.trim().startsWith('{') || result.trim().startsWith('[')) {
                try { return JSON.parse(result) as T; } catch { /* keep string */ }
            }
            return result as T;
        }
        if (Array.isArray(obj)) return obj.map((item) => this.resolveVariables(item)) as T;
        if (obj && typeof obj === 'object') {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(obj)) out[k] = this.resolveVariables(v);
            return out as T;
        }
        return obj;
    }

    private interpolateStr(str: string): string {
        return interpolate(str, this.variables);
    }

    private parseJsonStrings(obj: unknown): unknown {
        if (typeof obj === 'string' && (obj.trim().startsWith('{') || obj.trim().startsWith('['))) {
            try { return JSON.parse(obj); } catch { return obj; }
        }
        if (Array.isArray(obj)) return obj.map((i) => this.parseJsonStrings(i));
        if (obj && typeof obj === 'object') {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(obj)) out[k] = this.parseJsonStrings(v);
            return out;
        }
        return obj;
    }
}
