/**
 * Report generators — narrative, console, and JSON output.
 */

import type { FlowResult, TestReport } from './types.js';

// -- Narrative --

/** Generate a human-readable narrative from flow results. */
export function generateNarrative(results: FlowResult[]): string {
    const lines: string[] = [];

  for (const flow of results) {
    const icon = flow.success ? '✅' : '❌';
    lines.push(`\n${icon} **${flow.flow.name}**`);
        if (flow.flow.description) lines.push(`   _${flow.flow.description}_`);

        for (const step of flow.steps) {
            lines.push(`   ${step.success ? '→' : '✗'} ${step.step.name}`);

            for (const [name, value] of Object.entries(step.captures)) {
                const display =
                    value == null
                        ? String(value)
                        : typeof value === 'string'
                            ? value.substring(0, 50) + (value.length > 50 ? '…' : '')
                            : JSON.stringify(value).substring(0, 50);
        lines.push(`     📦 ${name}: ${display}`);
      }

      for (const a of step.assertions) {
        if (!a.success) lines.push(`     ⚠️ ${a.message}`);
      }

      if (step.error) lines.push(`     ❌ ${step.error}`);
        }
    }

    return lines.join('\n');
}

// -- Technical report --

/** Aggregate flow results into a TestReport. */
export function generateTechnicalReport(results: FlowResult[]): TestReport {
    const passed = results.filter((r) => r.success).length;
    return {
        timestamp: new Date(),
        duration: results.reduce((sum, r) => sum + r.duration, 0),
        totalFlows: results.length,
        passedFlows: passed,
        failedFlows: results.length - passed,
        flows: results,
        narrative: generateNarrative(results),
    };
}

// -- Console --

/** Print a colored report to stdout. */
export function printConsoleReport(report: TestReport): void {
    const c = colors;

    console.log('\n' + c.bold('═'.repeat(60)));
    console.log(c.bold('  TESTFLOW AI — RESULTS'));
    console.log(c.bold('═'.repeat(60)));

    console.log(`\n${c.cyan('Summary:')}`);
    console.log(`  Total:    ${report.totalFlows} flows`);
    console.log(`  ${c.green('Passed:')}  ${report.passedFlows}`);
    console.log(`  ${c.red('Failed:')}  ${report.failedFlows}`);
    console.log(`  ${c.dim('Duration:')} ${report.duration}ms`);

    console.log(`\n${c.cyan('Narrative:')}`);
    console.log(formatNarrative(report.narrative));

    const failed = report.flows.filter((f) => !f.success);
    if (failed.length > 0) {
        console.log(`\n${c.red('Failures:')}`);
        for (const flow of failed) {
            console.log(`\n  ${c.red('✗')} ${c.bold(flow.flow.name)}`);
            for (const step of flow.steps) {
                if (!step.success) {
                    console.log(`    ${c.yellow('Step:')} ${step.step.name}`);
                    if (step.error) console.log(`    ${c.red('Error:')} ${step.error}`);
                    for (const a of step.assertions) {
                        if (!a.success) {
                            console.log(`    ${c.red('Assert:')} ${a.message}`);
                            console.log(`    ${c.dim('Actual:')} ${JSON.stringify(a.actual)}`);
                        }
                    }
                }
            }
        }
    }

    console.log('\n' + c.bold('═'.repeat(60)) + '\n');
}

// -- JSON --

/** Serialize a report to a JSON string. */
export function toJSON(report: TestReport): string {
    return JSON.stringify(report, null, 2);
}

// -- Markdown --

/** Render a report as a markdown string. */
export function toMarkdown(report: TestReport): string {
    const lines: string[] = [
        '# Test Report',
        '',
        `**Date:** ${report.timestamp.toISOString()}`,
        `**Duration:** ${report.duration}ms`,
        '',
        '## Summary',
        '',
        '| Metric | Value |',
        '|--------|-------|',
        `| Total | ${report.totalFlows} |`,
        `| Passed | ${report.passedFlows} |`,
        `| Failed | ${report.failedFlows} |`,
        '',
        '## Narrative',
        '',
        report.narrative,
        '',
    ];

    const failed = report.flows.filter((f) => !f.success);
    if (failed.length > 0) {
        lines.push('## Failures', '');
        for (const flow of failed) {
            lines.push(`### ${flow.flow.name}`, '');
            for (const step of flow.steps) {
                if (!step.success) {
                    lines.push(`**Step:** ${step.step.name}`);
                    if (step.error) lines.push(`- Error: ${step.error}`);
                    for (const a of step.assertions) {
                        if (!a.success) lines.push(`- ${a.message}`);
                    }
                    lines.push('');
                }
            }
        }
    }

    return lines.join('\n');
}

// -- Helpers --

function formatNarrative(narrative: string): string {
    return narrative
        .replace(/\*\*([^*]+)\*\*/g, '\x1b[1m$1\x1b[0m')
        .replace(/_([^_]+)_/g, '\x1b[2m$1\x1b[0m');
}

const colors = {
    bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
    dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
    red: (s: string) => `\x1b[31m${s}\x1b[0m`,
    green: (s: string) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
    cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
};
