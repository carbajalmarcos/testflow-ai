/**
 * YAML and Markdown parsers for test flows and project context.
 */

import { parse as parseYamlString } from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { TestFlow, TestStep, ProjectContext } from './types.js';

// -- YAML parsing --

/** Parse a YAML string into a TestFlow. */
export function parseYaml(content: string): TestFlow {
  const parsed = parseYamlString(content);
  return normalizeFlow(parsed);
}

/** Read and parse a YAML test file. */
export async function parseYamlFile(filePath: string): Promise<TestFlow> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseYaml(content);
}

function normalizeFlow(data: unknown): TestFlow {
  const obj = data as Record<string, unknown>;

  if (!obj.name || !obj.steps) {
    throw new Error('Test flow must have "name" and "steps" fields');
  }

  return {
    name: obj.name as string,
    description: obj.description as string | undefined,
    tags: obj.tags as string[] | undefined,
    steps: (obj.steps as unknown[]).map(normalizeStep),
  };
}

function normalizeStep(data: unknown): TestStep {
  const obj = data as Record<string, unknown>;

  if (!obj.name || !obj.request) {
    throw new Error('Step must have "name" and "request" fields');
  }

  const req = obj.request as Record<string, unknown>;

  return {
    name: obj.name as string,
    description: obj.description as string | undefined,
    request: {
      method: ((req.method as string) || 'GET').toUpperCase() as TestStep['request']['method'],
      url: req.url as string,
      headers: req.headers as Record<string, string> | undefined,
      body: req.body,
      graphql: req.graphql as TestStep['request']['graphql'] | undefined,
    },
    capture: obj.capture as TestStep['capture'] | undefined,
    assertions: obj.assertions as TestStep['assertions'] | undefined,
    waitUntil: obj.waitUntil as TestStep['waitUntil'] | undefined,
  };
}

// -- Context parsing --

/** Parse a markdown string into ProjectContext. */
export function parseContext(content: string, fallbackName = 'API'): ProjectContext {
  const sections = extractSections(content);

  return {
    name: sections['name'] || fallbackName,
    description: sections['description'] || '',
    baseUrls: parseKeyValues(sections['base urls'] || sections['urls'] || ''),
    endpoints: parseEndpoints(sections['endpoints'] || ''),
    rules: parseList(sections['rules'] || sections['business rules'] || ''),
    ai: parseAiConfig(sections['ai configuration'] || sections['ai'] || ''),
  };
}

/** Read and parse a markdown context file. */
export async function parseContextFile(filePath: string): Promise<ProjectContext> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseContext(content, path.basename(filePath, '.md'));
}

function extractSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let currentSection = 'description';
  let buffer: string[] = [];

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)$/);
    const heading = line.match(/^#{2,}\s+(.+)$/);

    if (h1 && !sections['name']) {
      // Top-level H1 becomes the project name.
      if (buffer.length) sections[currentSection.toLowerCase()] = buffer.join('\n').trim();
      sections['name'] = h1[1].trim();
      currentSection = 'description';
      buffer = [];
    } else if (heading) {
      if (buffer.length) sections[currentSection.toLowerCase()] = buffer.join('\n').trim();
      currentSection = heading[1];
      buffer = [];
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length) sections[currentSection.toLowerCase()] = buffer.join('\n').trim();

  return sections;
}

function parseKeyValues(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^-?\s*(\w+):\s*(.+)$/);
    if (m) result[m[1]] = m[2].trim();
  }
  return result;
}

function parseEndpoints(content: string): ProjectContext['endpoints'] {
  const endpoints: ProjectContext['endpoints'] = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^-\s+(?:(\w+):\s+)?(GET|POST|PUT|DELETE|PATCH)\s+(\S+)(?:\s+-\s+(.+))?$/i);
    if (m) {
      endpoints.push({
        name: m[1] || `${m[2]} ${m[3]}`,
        method: m[2].toUpperCase() as ProjectContext['endpoints'][0]['method'],
        path: m[3],
        description: m[4],
      });
    }
  }
  return endpoints;
}

function parseList(content: string): string[] {
  const items: string[] = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^-\s+(.+)$/);
    if (m) items.push(m[1].trim());
  }
  return items;
}

function parseAiConfig(content: string): ProjectContext['ai'] {
  if (!content) return undefined;
  const kv = parseKeyValues(content);
  if (!kv['url'] && !kv['model']) return undefined;
  return {
    url: kv['url'] || 'http://localhost:11434',
    model: kv['model'] || 'llama3.2:3b',
  };
}

// -- File discovery --

/** Recursively find all `.yaml` / `.yml` test files in a directory. */
export async function discoverTestFiles(dir: string): Promise<string[]> {
  const { glob } = await import('glob');
  return glob(path.join(dir, '**/*.{yaml,yml}'));
}
