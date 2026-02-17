/**
 * Test runner — orchestrates discovery, execution, and reporting.
 */

import { parseYamlFile, parseContextFile, discoverTestFiles } from './parser.js';
import { FlowExecutor } from './executor.js';
import { generateTechnicalReport, printConsoleReport, toMarkdown } from './reporter.js';
import type { TestFlow, FlowResult, TestReport, AiConfig } from './types.js';

/** Options for `runTests()` and `TestRunner`. */
export interface RunnerOptions {
    /** Path to a context markdown file. */
    contextFile?: string;
    /** Directory containing YAML test files. */
    testDir?: string;
    /** Explicit list of test file paths. */
    testFiles?: string[];
    /** Only run flows matching these tags. */
    tags?: string[];
    /** Output format (default: `console`). */
    format?: 'console' | 'json' | 'markdown';
    /** Print verbose logs during execution. */
    verbose?: boolean;
    /** Ollama AI configuration (optional). */
    ai?: Partial<AiConfig>;
}

export class TestRunner {
    private opts: Required<Pick<RunnerOptions, 'format' | 'verbose'>> & RunnerOptions;

    constructor(options: RunnerOptions = {}) {
        this.opts = { format: 'console', verbose: false, ...options };
    }

    /** Run all matching tests and produce a report. */
    async run(): Promise<TestReport> {
        // Context
        const context = this.opts.contextFile
            ? await parseContextFile(this.opts.contextFile)
            : undefined;

    if (context && this.opts.verbose) console.log(`📚 Context: ${context.name}`);

    // Discover files
    let files = this.opts.testFiles ? [...this.opts.testFiles] : [];
    if (this.opts.testDir) {
      files = [...files, ...(await discoverTestFiles(this.opts.testDir))];
    }
    if (files.length === 0) throw new Error('No test files found');
    if (this.opts.verbose) console.log(`📁 ${files.length} test file(s)`);

        // Parse & filter
        const flows: TestFlow[] = [];
        for (const file of files) {
            try {
                const flow = await parseYamlFile(file);
                if (this.opts.tags?.length) {
                    if (!flow.tags || !this.opts.tags.some((t) => flow.tags?.includes(t))) continue;
                }
                flows.push(flow);
            } catch (err) {
                console.error(`⚠️ Failed to parse ${file}: ${err}`);
            }
        }
        if (flows.length === 0) throw new Error('No valid test flows found (check tags filter)');

        // Execute
        const executor = new FlowExecutor(context, this.opts.verbose, this.opts.ai);
        const results: FlowResult[] = [];

        for (const flow of flows) {
            const result = await executor.executeFlow(flow);
            results.push(result);
      if (this.opts.verbose) {
        console.log(`\n${result.success ? '✅ PASSED' : '❌ FAILED'}: ${flow.name} (${result.duration}ms)`);
      }
        }

        // Report
        const report = generateTechnicalReport(results);

        switch (this.opts.format) {
            case 'console':
                printConsoleReport(report);
                break;
            case 'json':
                console.log(JSON.stringify(report, null, 2));
                break;
            case 'markdown':
                console.log(toMarkdown(report));
                break;
        }

        return report;
    }
}

/** Convenience wrapper: create a runner and execute. */
export async function runTests(options: RunnerOptions): Promise<TestReport> {
    return new TestRunner(options).run();
}
