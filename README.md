# testflow-ai

> Declarative API testing powered by YAML flows. Version-controlled, human-readable, AI-friendly.

[![npm version](https://img.shields.io/npm/v/testflow-ai.svg)](https://www.npmjs.com/package/testflow-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)

---

## Why?

I was building a backend that started as a simple API and grew into a system with GraphQL, async workers, state machines, and AI-powered evaluations.

Testing started simple — a few requests in Postman. Then the project scaled:

- **Postman / Insomnia** became unmanageable. Dozens of collections, manual token copying, no version control.
- **IDE AI assistants** worked for one-off requests but burned through tokens, lost context, and couldn't maintain complex multi-step flows.
- **MCP servers and tooling** required significant setup and ongoing maintenance.

I needed something that:

1. Lives in the repo alongside my code
2. Defines multi-step flows declaratively
3. Captures variables between steps automatically
4. Supports REST, GraphQL, and async operations
5. Can leverage a **local AI model** for intelligent assertions
6. Runs in CI/CD with zero cloud dependencies

**testflow-ai** is the result.

---

## Features

- 📝 **YAML test flows** — define test sequences declaratively
- 🔗 **Variable capture** — extract values from responses, reuse in later steps
- ✅ **Rich assertions** — equals, contains, exists, greaterThan, matches, and more
- 🔄 **GraphQL native** — first-class support for queries and mutations
- ⏳ **Async polling** — `waitUntil` for operations that take time
- 🤖 **AI evaluation** — assert with natural language via a local Ollama model
- 📄 **Context files** — define base URLs, endpoints, and rules in Markdown
- 📊 **Multiple formats** — console, JSON, or Markdown reports
- 🎯 **Tag filtering** — run subsets of your test suite
- 🖥️ **CLI + API** — use from the terminal or import as a library

---

## Quick Start

### 1. Install

```bash
npm install testflow-ai
```

### 2. Create a test flow

```yaml
# tests/health.yaml
name: Health Check
tags: [smoke]
steps:
  - name: Ping API
    request:
      method: GET
      url: http://localhost:3000/health
    assertions:
      - path: status
        operator: equals
        value: 200
```

### 3. Run

```bash
npx testflow tests/health.yaml
```

That's it. No config files, no GUI, no account.

---

## Installation

```bash
npm install testflow-ai
# or
pnpm add testflow-ai
# or
yarn add testflow-ai
```

---

## CLI Usage

```bash
# Run specific files
testflow flow1.yaml flow2.yaml

# Run all YAML files in a directory
testflow --dir ./tests

# Use a context file for base URLs
testflow --dir ./tests --context ./context.md

# Filter by tags
testflow --dir ./tests --tags smoke,auth

# JSON output (for CI/CD)
testflow --dir ./tests --format json

# Markdown output (for reports)
testflow --dir ./tests --format markdown

# Verbose mode
testflow --dir ./tests -v

# With AI evaluation (Ollama)
testflow --dir ./tests --ai-model llama3.2:3b
```

---

## Programmatic API

```typescript
import { runTests } from 'testflow-ai';

const report = await runTests({
  contextFile: './context.md',
  testDir: './tests',
  tags: ['smoke'],
  format: 'console',
  verbose: true,
});

console.log(`${report.passedFlows}/${report.totalFlows} passed`);
process.exit(report.failedFlows > 0 ? 1 : 0);
```

### Advanced usage

```typescript
import { TestRunner, FlowExecutor, parseYamlFile, parseContextFile } from 'testflow-ai';

// Runner with full control
const runner = new TestRunner({
  contextFile: './context.md',
  testFiles: ['./tests/critical.yaml'],
  ai: { model: 'mistral:7b' },
});
const report = await runner.run();

// Manual execution
const context = await parseContextFile('./context.md');
const flow = await parseYamlFile('./tests/flow.yaml');
const executor = new FlowExecutor(context, true);
const result = await executor.executeFlow(flow);
```

---

## Test Flow Reference

### Basic structure

```yaml
name: Flow Name
description: What this flow tests
tags:
  - smoke
  - e2e

steps:
  - name: Step Name
    request:
      method: POST
      url: "{api}/endpoint"
      headers:
        Content-Type: application/json
      body:
        key: value
    capture:
      - name: variableName
        path: data.field
    assertions:
      - path: status
        operator: equals
        value: 201
```

### REST requests

```yaml
steps:
  - name: Create resource
    request:
      method: POST
      url: "{api}/resources"
      headers:
        Content-Type: application/json
        Authorization: "Bearer ${token}"
      body:
        title: New Resource
        active: true
```

### GraphQL requests

```yaml
steps:
  - name: Query users
    request:
      method: POST
      url: "{graphql}"
      graphql:
        query: |
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              email
              name
            }
          }
        variables:
          id: "${userId}"
    capture:
      - name: email
        path: data.user.email
```

### Variable capture and interpolation

Variables captured in one step are available in all subsequent steps:

```yaml
steps:
  - name: Login
    request:
      method: POST
      url: "{api}/auth/login"
      body:
        email: admin@example.com
        password: secret
    capture:
      - name: token
        path: data.accessToken
      - name: userId
        path: data.user.id

  - name: Get profile
    request:
      method: GET
      url: "{api}/users/${userId}"
      headers:
        Authorization: "Bearer ${token}"
```

Supported interpolation patterns:
- `${variable}` — simple variable
- `${data.nested.field}` — nested path
- `${items[0].id}` — array access

### Polling (waitUntil)

For async operations — polls until a condition is met or timeout:

```yaml
steps:
  - name: Wait for processing
    request:
      method: GET
      url: "{api}/jobs/${jobId}"
    waitUntil:
      path: data.status
      operator: equals
      value: "COMPLETED"
      timeout: 30000    # max wait (ms)
      interval: 2000    # poll every (ms)
    assertions:
      - path: data.status
        operator: equals
        value: "COMPLETED"
```

---

## Assertions

| Operator | Description | Example value |
|----------|-------------|---------------|
| `equals` | Exact match (deep equality) | `200` |
| `notEquals` | Not equal | `null` |
| `contains` | String/array contains | `"success"` |
| `notContains` | Does not contain | `"error"` |
| `exists` | Not null/undefined | — |
| `notExists` | Is null/undefined | — |
| `greaterThan` | Number comparison | `0` |
| `lessThan` | Number comparison | `100` |
| `matches` | Regex match | `"^[a-z]+$"` |
| `ai-evaluate` | AI-powered evaluation | `"Is this a valid user?"` |

### Special paths

- `status` — HTTP status code (when value is a number)
- `httpStatus` — always the HTTP status code
- `data.field` — response body field
- `data.items[0].id` — array access

---

## AI-Powered Evaluation

Use a local LLM to assert things that are hard to express with traditional operators.

### Setup Ollama

1. **Install Ollama** — [ollama.com/download](https://ollama.com/download)

2. **Pull a model:**

```bash
# Recommended — good balance of speed and quality
ollama pull llama3.2:3b

# Faster, lighter (for limited hardware)
ollama pull llama3.2:1b

# More accurate (needs ~8GB RAM)
ollama pull mistral:7b
```

3. **Start Ollama** (runs on `http://localhost:11434` by default):

```bash
ollama serve
```

### Using AI assertions

```yaml
steps:
  - name: Check response quality
    request:
      method: GET
      url: "{api}/articles/1"
    assertions:
      # Traditional assertion
      - path: status
        operator: equals
        value: 200
      # AI-powered assertion
      - path: data.content
        operator: ai-evaluate
        value: "Does this article contain a coherent explanation with at least two paragraphs?"
```

### CLI with AI

```bash
testflow --dir ./tests --ai-model llama3.2:3b
testflow --dir ./tests --ai-url http://192.168.1.10:11434 --ai-model mistral:7b
```

### Programmatic with AI

```typescript
const report = await runTests({
  testDir: './tests',
  ai: {
    url: 'http://localhost:11434',
    model: 'llama3.2:3b',
    timeout: 30000,
  },
});
```

### Context file AI config

```markdown
## AI Configuration
- url: http://localhost:11434
- model: llama3.2:3b
```

> AI evaluation requires Ollama running locally. No cloud API keys, no data leaves your machine.

---

## Context Files

Define your project context in Markdown. The runner uses it to resolve `{baseUrlKey}` references in your YAML flows.

```markdown
# My API

## Description
Brief description of your API.

## Base URLs
- api: http://localhost:3000
- graphql: http://localhost:3000/graphql

## Endpoints
- POST /users - Create user
- GET /users/:id - Get user
- POST /graphql - GraphQL endpoint

## Rules
- All endpoints return JSON
- Authentication required for /users

## AI Configuration
- url: http://localhost:11434
- model: llama3.2:3b
```

---

## CI/CD Integration

### GitHub Actions

```yaml
jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run start:server &
      - run: npx testflow --dir ./tests --context ./context.md --format json > results.json
      - uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: results.json
```

### Exit codes

- `0` — all flows passed
- `1` — one or more flows failed

---

## Output Examples

### Console

```
══════════════════════════════════════════════════════════════
  TESTFLOW AI — RESULTS
══════════════════════════════════════════════════════════════

Summary:
  Total:    3 flows
  Passed:  2
  Failed:  1
  Duration: 542ms

Narrative:

✅ **User CRUD**
   → Create user
     📦 userId: abc-123
   → Read user
   → Update user

✅ **Auth Flow**
   → Login
     📦 token: eyJhbG…
   → Access protected route

❌ **Payment Flow**
   ✗ Create payment
     ⚠️  Expected status to equal 200, got 500

══════════════════════════════════════════════════════════════
```

---

## Roadmap

- [ ] Database assertions (verify records directly via SQL)
- [ ] gRPC / RPC support
- [ ] OpenAPI spec → auto-generate test flows
- [ ] Watch mode (re-run on file change)
- [ ] Parallel flow execution
- [ ] HTML report output
- [ ] `testflow init` wizard

---

## License

MIT
