import { describe, it, expect } from 'vitest';
import { parseYaml, parseContext } from '../src/parser.js';

describe('parseYaml', () => {
  it('parses a minimal flow', () => {
    const flow = parseYaml(`
name: Health Check
steps:
  - name: Ping
    request:
      method: GET
      url: http://localhost:3000/health
`);

    expect(flow.name).toBe('Health Check');
    expect(flow.steps).toHaveLength(1);
    expect(flow.steps[0].name).toBe('Ping');
    expect(flow.steps[0].request.method).toBe('GET');
    expect(flow.steps[0].request.url).toBe('http://localhost:3000/health');
  });

  it('parses tags, description, and multiple steps', () => {
    const flow = parseYaml(`
name: User CRUD
description: Create and verify a user
tags:
  - users
  - smoke
steps:
  - name: Create
    request:
      method: POST
      url: "{api}/users"
      body:
        email: test@example.com
    capture:
      - name: userId
        path: data.id
    assertions:
      - path: status
        operator: equals
        value: 201
  - name: Verify
    request:
      method: GET
      url: "{api}/users/\${userId}"
`);

    expect(flow.description).toBe('Create and verify a user');
    expect(flow.tags).toEqual(['users', 'smoke']);
    expect(flow.steps).toHaveLength(2);
    expect(flow.steps[0].capture).toHaveLength(1);
    expect(flow.steps[0].assertions).toHaveLength(1);
    expect(flow.steps[0].request.body).toEqual({ email: 'test@example.com' });
  });

  it('parses GraphQL steps', () => {
    const flow = parseYaml(`
name: GQL Test
steps:
  - name: Query
    request:
      method: POST
      url: "{graphql}"
      graphql:
        query: |
          query GetUser($id: ID!) {
            user(id: $id) { id email }
          }
        variables:
          id: "123"
`);

    expect(flow.steps[0].request.graphql).toBeDefined();
    expect(flow.steps[0].request.graphql?.query).toContain('GetUser');
    expect(flow.steps[0].request.graphql?.variables).toEqual({ id: '123' });
  });

  it('parses waitUntil config', () => {
    const flow = parseYaml(`
name: Async Flow
steps:
  - name: Poll
    request:
      method: GET
      url: http://localhost/status
    waitUntil:
      path: data.state
      operator: equals
      value: COMPLETED
      timeout: 10000
      interval: 1000
`);

    expect(flow.steps[0].waitUntil).toEqual({
      path: 'data.state',
      operator: 'equals',
      value: 'COMPLETED',
      timeout: 10000,
      interval: 1000,
    });
  });

  it('defaults method to GET', () => {
    const flow = parseYaml(`
name: Default Method
steps:
  - name: Get
    request:
      url: http://localhost/data
`);

    expect(flow.steps[0].request.method).toBe('GET');
  });

  it('throws when name is missing', () => {
    expect(() => parseYaml('steps: []')).toThrow(/name/i);
  });

  it('throws when steps are missing', () => {
    expect(() => parseYaml('name: Broken')).toThrow(/steps/i);
  });

  it('throws when a step has no request', () => {
    expect(() =>
      parseYaml(`
name: Bad
steps:
  - name: NoRequest
`),
    ).toThrow(/request/i);
  });
});

describe('parseContext', () => {
  it('parses base URLs and endpoints', () => {
    const ctx = parseContext(`
# My API

## Description
A sample REST API.

## Base URLs
- api: http://localhost:3000
- graphql: http://localhost:3000/graphql

## Endpoints
- POST /users - Create user
- GET /users/:id - Get user

## Rules
- All endpoints return JSON
- Rate limit: 100 req/min
`);

    expect(ctx.name).toBe('My API');
    expect(ctx.description).toBe('A sample REST API.');
    expect(ctx.baseUrls).toEqual({
      api: 'http://localhost:3000',
      graphql: 'http://localhost:3000/graphql',
    });
    expect(ctx.endpoints).toHaveLength(2);
    expect(ctx.endpoints[0].method).toBe('POST');
    expect(ctx.endpoints[0].path).toBe('/users');
    expect(ctx.rules).toHaveLength(2);
  });

  it('parses AI configuration', () => {
    const ctx = parseContext(`
# Test

## AI Configuration
- url: http://localhost:11434
- model: mistral:7b
`);

    expect(ctx.ai).toEqual({
      url: 'http://localhost:11434',
      model: 'mistral:7b',
    });
  });

  it('uses fallback name when heading is absent', () => {
    const ctx = parseContext('## Base URLs\n- api: http://localhost', 'fallback');
    expect(ctx.name).toBe('fallback');
  });
});
