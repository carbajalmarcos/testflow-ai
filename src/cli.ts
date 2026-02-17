#!/usr/bin/env node

/**
 * testflow-ai CLI entry point.
 *
 * Usage:
 *   testflow --dir ./tests --context ./context.md
 *   testflow flow1.yaml flow2.yaml -v
 *   testflow --dir ./tests --tags smoke --format json
 */

import { Command } from 'commander';
import { runTests } from './runner.js';

const program = new Command();

program
    .name('testflow')
    .description('Declarative API testing powered by YAML flows')
    .version('0.1.0');

program
    .argument('[files...]', 'YAML test files to run')
    .option('-c, --context <file>', 'Path to context markdown file')
    .option('-d, --dir <directory>', 'Directory containing YAML test files')
    .option('-t, --tags <tags>', 'Comma-separated tags to filter')
    .option('-f, --format <format>', 'Output: console, json, markdown', 'console')
    .option('-v, --verbose', 'Verbose output')
    .option('--ai-provider <provider>', 'AI provider: ollama, openai, anthropic (default: ollama)')
    .option('--ai-url <url>', 'AI API URL (for Ollama, default: http://localhost:11434)')
    .option('--ai-model <model>', 'AI model name (varies by provider)')
    .option('--ai-key <key>', 'API key (required for OpenAI/Anthropic)')
    .action(async (files: string[], opts) => {
        try {
            const report = await runTests({
                testFiles: files.length > 0 ? files : undefined,
                contextFile: opts.context,
                testDir: opts.dir,
                tags: opts.tags?.split(','),
                format: opts.format,
                verbose: opts.verbose,
                ai: opts.aiProvider || opts.aiUrl || opts.aiModel || opts.aiKey
                    ? {
                        provider: opts.aiProvider || 'ollama',
                        url: opts.aiUrl,
                        model: opts.aiModel,
                        apiKey: opts.aiKey,
                    }
                    : undefined,
            });

            process.exit(report.failedFlows > 0 ? 1 : 0);
        } catch (err) {
            console.error(`\nError: ${err instanceof Error ? err.message : err}`);
            process.exit(1);
        }
    });

program.parse();
