import { describe, it, expect } from 'vitest';
import { generateNarrative, generateTechnicalReport, toJSON, toMarkdown } from '../src/reporter.js';
import type { FlowResult } from '../src/types.js';

function makeFlowResult(overrides: Partial<FlowResult> = {}): FlowResult {
  return {
    flow: { name: 'Test Flow', steps: [] },
    success: true,
    duration: 150,
    steps: [],
    variables: {},
    ...overrides,
  };
}

describe('generateNarrative', () => {
  it('marks passing flows with ✅', () => {
    const narrative = generateNarrative([makeFlowResult()]);
    expect(narrative).toContain('✅');
    expect(narrative).toContain('Test Flow');
  });

  it('marks failing flows with ❌', () => {
    const narrative = generateNarrative([makeFlowResult({ success: false })]);
    expect(narrative).toContain('❌');
  });

  it('includes flow description', () => {
    const narrative = generateNarrative([
      makeFlowResult({ flow: { name: 'F', description: 'A flow description', steps: [] } }),
    ]);
    expect(narrative).toContain('A flow description');
  });

  it('shows captured variables', () => {
    const narrative = generateNarrative([
      makeFlowResult({
        steps: [
          {
            step: { name: 'Step 1', request: { method: 'GET', url: '/' } },
            success: true,
            duration: 50,
            request: { method: 'GET', url: '/' },
            captures: { userId: 'abc-123' },
            assertions: [],
          },
        ],
      }),
    ]);
    expect(narrative).toContain('userId');
    expect(narrative).toContain('abc-123');
  });

  it('shows failed assertions', () => {
    const narrative = generateNarrative([
      makeFlowResult({
        success: false,
        steps: [
          {
            step: { name: 'Check', request: { method: 'GET', url: '/' } },
            success: false,
            duration: 10,
            request: { method: 'GET', url: '/' },
            captures: {},
            assertions: [
              {
                assertion: { path: 'status', operator: 'equals', value: 200 },
                success: false,
                actual: 500,
                message: 'Expected status to equal 200, got 500',
              },
            ],
          },
        ],
      }),
    ]);
    expect(narrative).toContain('Expected status to equal 200');
  });

  it('shows step errors', () => {
    const narrative = generateNarrative([
      makeFlowResult({
        success: false,
        steps: [
          {
            step: { name: 'Broken', request: { method: 'GET', url: '/' } },
            success: false,
            duration: 0,
            request: { method: 'GET', url: '/' },
            captures: {},
            assertions: [],
            error: 'Connection refused',
          },
        ],
      }),
    ]);
    expect(narrative).toContain('Connection refused');
  });
});

describe('generateTechnicalReport', () => {
  it('aggregates results correctly', () => {
    const results = [
      makeFlowResult({ success: true, duration: 100 }),
      makeFlowResult({ flow: { name: 'F2', steps: [] }, success: false, duration: 200 }),
      makeFlowResult({ flow: { name: 'F3', steps: [] }, success: true, duration: 50 }),
    ];

    const report = generateTechnicalReport(results);

    expect(report.totalFlows).toBe(3);
    expect(report.passedFlows).toBe(2);
    expect(report.failedFlows).toBe(1);
    expect(report.duration).toBe(350);
    expect(report.flows).toHaveLength(3);
    expect(report.narrative).toBeTruthy();
    expect(report.timestamp).toBeInstanceOf(Date);
  });
});

describe('toJSON', () => {
  it('returns valid JSON', () => {
    const report = generateTechnicalReport([makeFlowResult()]);
    const json = toJSON(report);
    const parsed = JSON.parse(json);
    expect(parsed.totalFlows).toBe(1);
    expect(parsed.passedFlows).toBe(1);
  });
});

describe('toMarkdown', () => {
  it('includes summary table', () => {
    const report = generateTechnicalReport([makeFlowResult()]);
    const md = toMarkdown(report);
    expect(md).toContain('# Test Report');
    expect(md).toContain('| Total | 1 |');
    expect(md).toContain('| Passed | 1 |');
  });

  it('includes failures section when there are failures', () => {
    const report = generateTechnicalReport([
      makeFlowResult({
        success: false,
        steps: [
          {
            step: { name: 'Bad Step', request: { method: 'GET', url: '/' } },
            success: false,
            duration: 10,
            request: { method: 'GET', url: '/' },
            captures: {},
            assertions: [
              {
                assertion: { path: 'status', operator: 'equals', value: 200 },
                success: false,
                actual: 500,
                message: 'Expected 200, got 500',
              },
            ],
          },
        ],
      }),
    ]);
    const md = toMarkdown(report);
    expect(md).toContain('## Failures');
    expect(md).toContain('Bad Step');
    expect(md).toContain('Expected 200, got 500');
  });
});
