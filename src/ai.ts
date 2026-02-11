/**
 * AI evaluation via Ollama (local LLM).
 *
 * Sends a prompt + data to a locally running Ollama instance and returns
 * a structured pass/fail evaluation. No cloud API keys required.
 */

import axios from 'axios';
import type { AiConfig, AiEvaluation } from './types.js';

const DEFAULT_AI_CONFIG: AiConfig = {
  url: 'http://localhost:11434',
  model: 'llama3.2:3b',
  timeout: 30_000,
};

/** Merge partial user config with defaults. */
export function resolveAiConfig(partial?: Partial<AiConfig>): AiConfig {
  return { ...DEFAULT_AI_CONFIG, ...partial };
}

/**
 * Evaluate a value against a natural-language prompt using a local LLM.
 *
 * @example
 * ```ts
 * const result = await evaluateWithAi(config, responseBody, 'Does this contain a valid user object?');
 * // { pass: true, confidence: 0.95, reason: 'Response contains id, email, and name fields.' }
 * ```
 */
export async function evaluateWithAi(
  config: AiConfig,
  actual: unknown,
  prompt: string,
): Promise<AiEvaluation> {
  const systemPrompt = [
    'You are a test evaluator. Analyze the provided data against the given criteria.',
    'Respond ONLY with valid JSON: {"pass": true/false, "confidence": 0.0-1.0, "reason": "brief explanation"}',
  ].join(' ');

  const userPrompt = `Criteria: ${prompt}\n\nData:\n${JSON.stringify(actual, null, 2)}`;

  try {
    const { data } = await axios.post(
      `${config.url}/api/generate`,
      {
        model: config.model,
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
        format: 'json',
      },
      { timeout: config.timeout },
    );

    const parsed = JSON.parse(data.response);
    return {
      pass: Boolean(parsed.pass),
      confidence: Number(parsed.confidence) || 0,
      reason: String(parsed.reason || ''),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { pass: false, confidence: 0, reason: `AI evaluation failed: ${message}` };
  }
}
