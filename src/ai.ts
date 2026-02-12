/**
 * AI evaluation with support for multiple providers.
 *
 * Supports:
 * - Ollama (local, default)
 * - OpenAI (cloud)
 * - Anthropic (cloud)
 * - Custom providers via adapter pattern
 */

import axios from 'axios';
import type { AiConfig, AiEvaluation } from './types.js';

const DEFAULT_AI_CONFIG: AiConfig = {
    provider: 'ollama',
    url: 'http://localhost:11434',
    model: 'llama3.2:3b',
    timeout: 30_000,
};

/** Merge partial user config with defaults. */
export function resolveAiConfig(partial?: Partial<AiConfig>): AiConfig {
    return { ...DEFAULT_AI_CONFIG, ...partial };
}

/**
 * Evaluate a value against a natural-language prompt using AI.
 *
 * @example
 * ```ts
 * // Ollama (local)
 * const result = await evaluateWithAi(
 *   { provider: 'ollama', model: 'llama3.2:3b' },
 *   responseBody,
 *   'Does this contain a valid user object?'
 * );
 *
 * // OpenAI (cloud)
 * const result = await evaluateWithAi(
 *   { provider: 'openai', apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o-mini' },
 *   responseBody,
 *   'Is this response well-formatted?'
 * );
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

    switch (config.provider) {
        case 'ollama':
            return evaluateWithOllama(config, systemPrompt, userPrompt);
        case 'openai':
            return evaluateWithOpenAI(config, systemPrompt, userPrompt);
        case 'anthropic':
            return evaluateWithAnthropic(config, systemPrompt, userPrompt);
        default:
            return { pass: false, confidence: 0, reason: `Unknown AI provider: ${config.provider}` };
    }
}

/** Ollama (local) evaluation. */
async function evaluateWithOllama(
    config: AiConfig,
    systemPrompt: string,
    userPrompt: string,
): Promise<AiEvaluation> {
    try {
        const { data } = await axios.post(
            `${config.url || 'http://localhost:11434'}/api/generate`,
            {
                model: config.model || 'llama3.2:3b',
                prompt: userPrompt,
                system: systemPrompt,
                stream: false,
                format: 'json',
            },
            { timeout: config.timeout || 30_000 },
        );

        const parsed = JSON.parse(data.response);
        return {
            pass: Boolean(parsed.pass),
            confidence: Number(parsed.confidence) || 0,
            reason: String(parsed.reason || ''),
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { pass: false, confidence: 0, reason: `Ollama evaluation failed: ${message}` };
    }
}

/** OpenAI (cloud) evaluation. */
async function evaluateWithOpenAI(
    config: AiConfig,
    systemPrompt: string,
    userPrompt: string,
): Promise<AiEvaluation> {
    if (!config.apiKey) {
        return { pass: false, confidence: 0, reason: 'OpenAI API key is required' };
    }

    try {
        const { data } = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: config.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: config.timeout || 30_000,
            },
        );

        const parsed = JSON.parse(data.choices[0].message.content);
        return {
            pass: Boolean(parsed.pass),
            confidence: Number(parsed.confidence) || 0,
            reason: String(parsed.reason || ''),
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { pass: false, confidence: 0, reason: `OpenAI evaluation failed: ${message}` };
    }
}

/** Anthropic (cloud) evaluation. */
async function evaluateWithAnthropic(
    config: AiConfig,
    systemPrompt: string,
    userPrompt: string,
): Promise<AiEvaluation> {
    if (!config.apiKey) {
        return { pass: false, confidence: 0, reason: 'Anthropic API key is required' };
    }

    try {
        const { data } = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: config.model || 'claude-3-haiku-20240307',
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
            },
            {
                headers: {
                    'x-api-key': config.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                timeout: config.timeout || 30_000,
            },
        );

        const parsed = JSON.parse(data.content[0].text);
        return {
            pass: Boolean(parsed.pass),
            confidence: Number(parsed.confidence) || 0,
            reason: String(parsed.reason || ''),
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { pass: false, confidence: 0, reason: `Anthropic evaluation failed: ${message}` };
    }
}
