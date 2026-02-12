<div align="center">

# 🧪 testflow-ai

**Declarative API testing powered by YAML flows**

*Version-controlled • Human-readable • AI-friendly*

[![npm version](https://img.shields.io/npm/v/testflow-ai.svg?style=for-the-badge&color=blue)](https://www.npmjs.com/package/testflow-ai)
[![npm downloads](https://img.shields.io/npm/dm/testflow-ai.svg?style=for-the-badge&color=green)](https://www.npmjs.com/package/testflow-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg?style=for-the-badge)](https://nodejs.org)

[📖 Documentation](#-documentation) • [🚀 Quick Start](#-quick-start) • [💻 Examples](#-real-world-example) • [🤖 AI Providers](#-ai-powered-evaluation)

</div>

---

## 🎯 What is testflow-ai?

**testflow-ai** lets you describe API scenarios in YAML files, run them from the command line or as a library, and (optionally) ask an AI model to judge complex responses. No GUI, no vendor lock‑in, and it works with any HTTP/GraphQL API.

> **💡 Origin story (side projects & frustration):**  
> While hacking on side projects and small backends, I ended up with **dozens of endpoints**: auth, users, tasks, webhooks, background jobs…  
> I was jumping between Postman collections, ad‑hoc scripts, and “please hit these endpoints” prompts to AI agents. I wanted something that felt more like a **test agent**:  
> a tool that could **create data, mutate it, delete it, and walk full flows end‑to‑end**, but defined in plain files, close to the code, and easy to run in CI.  
> **testflow-ai** is that tool: a thin engine that turns YAML flows into real HTTP calls, variable captures, assertions, and (if you want) AI‑powered checks.

### ✨ Key Features

<div align="center">

| 🎨 Feature | 📝 Description |
|:----------:|:-------------:|
| **📝 YAML Flows** | Define test sequences declaratively — version-controlled and human-readable |
| **🔗 Variable Capture** | Extract values from responses, reuse in later steps automatically |
| **✅ Rich Assertions** | 10+ operators: equals, contains, exists, greaterThan, matches, and more |
| **🔄 GraphQL Native** | First-class support for queries and mutations |
| **⏳ Async Polling** | `waitUntil` for operations that take time (background jobs, processing) |
| **🤖 AI Evaluation** | Assert with natural language using Ollama, OpenAI, or Anthropic |
| **📄 Context Files** | Define base URLs, endpoints, and rules in Markdown |
| **📊 Multiple Formats** | Console (colored), JSON (CI/CD), or Markdown reports |
| **🎯 Tag Filtering** | Run subsets of your test suite (`--tags smoke,e2e`) |
| **🖥️ CLI + API** | Use from terminal (`npx testflow`) or import as a library |

</div>

---

## 🚀 Quick Start

### 1️⃣ Install

```bash
npm install testflow-ai
```

### 2️⃣ Create a test flow

Create `tests/health.yaml`:

```yaml
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

### 3️⃣ Run

```bash
npx testflow tests/health.yaml
```

**That's it.** No config files, no GUI, no account.

---

## 💡 Why testflow-ai?

I was building a backend that started as a simple API and grew into a system with GraphQL, async workers, state machines, and AI-powered evaluations.

Testing started simple — a few requests in Postman. Then the project scaled:

<div align="center">

| ❌ Problem | ✅ Solution |
|:----------:|:-----------:|
| **Postman / Insomnia** became unmanageable | YAML files in version control |
| **IDE AI assistants** burned tokens, lost context | Local AI via Ollama (free, private) |
| **MCP servers** required complex setup | Zero dependencies beyond Node.js |
| **Manual token copying** between requests | Automatic variable capture |
| **No CI/CD integration** | JSON output, exit codes, GitHub Actions ready |

</div>

**testflow-ai** solves all of this.

---

## 📦 Installation

```bash
npm install testflow-ai
# or
pnpm add testflow-ai
# or
yarn add testflow-ai
```

---

## 🖥️ CLI Usage

```bash
# Run specific files
npx testflow flow1.yaml flow2.yaml

# Run all YAML files in a directory
npx testflow --dir ./tests

# Use a context file for base URLs
npx testflow --dir ./tests --context ./context.md

# Filter by tags (run only smoke tests)
npx testflow --dir ./tests --tags smoke

# JSON output (for CI/CD)
npx testflow --dir ./tests --format json

# Markdown output (for reports)
npx testflow --dir ./tests --format markdown

# Verbose mode (see step-by-step execution)
npx testflow --dir ./tests -v

# With AI evaluation
npx testflow --dir ./tests --ai-provider ollama --ai-model llama3.2:3b
npx testflow --dir ./tests --ai-provider openai --ai-key $OPENAI_API_KEY --ai-model gpt-4o-mini
```

---

## 💻 Programmatic API

### Simple usage

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

---

## 💻 Real-World Example

Here's a complete example using a Todo List API:

### Project Structure

```
my-api/
├── tests/
│   ├── index.ts              # Test runner
│   ├── context.md            # API context
│   └── flows/
│       ├── health-check.yaml
│       ├── todo-crud.yaml
│       └── todo-complete-flow.yaml
└── package.json
```

### Test Runner (`tests/index.ts`)

```typescript
import { runTests, type RunnerOptions } from 'testflow-ai';
import * as path from 'path';

async function main() {
  const options: RunnerOptions = {
    contextFile: path.join(__dirname, 'context.md'),
    testDir: path.join(__dirname, 'flows'),
    tags: process.argv.includes('--tags=smoke') ? ['smoke'] : undefined,
    format: 'console',
    verbose: false,
  };

  const report = await runTests(options);
  process.exit(report.failedFlows > 0 ? 1 : 0);
}

main();
```

### Context File (`tests/context.md`)

```markdown
# Todo List API

## Description
A simple REST API for managing todo items.

## Base URLs
- api: http://localhost:3000
- graphql: http://localhost:3000/graphql

## Endpoints
- POST /todos - Create a new todo
- GET /todos/:id - Get todo by ID
- PUT /todos/:id - Update todo
- DELETE /todos/:id - Delete todo
- POST /graphql - GraphQL endpoint
```

### Test Flow (`tests/flows/todo-crud.yaml`)

```yaml
name: Todo CRUD Flow
tags: [todos, crud, smoke]

steps:
  - name: Create todo
    request:
      method: POST
      url: "{api}/todos"
      headers:
        Content-Type: application/json
      body:
        title: "Buy groceries"
        completed: false
    capture:
      - name: todoId
        path: data.id
    assertions:
      - path: status
        operator: equals
        value: 201
      - path: data.title
        operator: equals
        value: "Buy groceries"

  - name: Get todo
    request:
      method: GET
      url: "{api}/todos/${todoId}"
    assertions:
      - path: data.id
        operator: equals
        value: "${todoId}"

  - name: Update todo
    request:
      method: PUT
      url: "{api}/todos/${todoId}"
      headers:
        Content-Type: application/json
      body:
        completed: true
    assertions:
      - path: data.completed
        operator: equals
        value: true
```

### Running Tests

```bash
# Add to package.json scripts:
"test:e2e": "ts-node tests/index.ts"
"test:smoke": "ts-node tests/index.ts --tags=smoke"

# Then run:
npm run test:e2e
npm run test:smoke
```

### Advanced usage

```typescript
import { TestRunner, FlowExecutor, parseYamlFile, parseContextFile } from 'testflow-ai';

// Runner with full control
const runner = new TestRunner({
  contextFile: './context.md',
  testFiles: ['./tests/critical.yaml'],
  ai: { provider: 'ollama', model: 'mistral:7b' },
});
const report = await runner.run();

// Manual execution
const context = await parseContextFile('./context.md');
const flow = await parseYamlFile('./tests/flow.yaml');
const executor = new FlowExecutor(context, true);
const result = await executor.executeFlow(flow);
```

---

## 📝 Test Flow Reference

### Basic structure

```yaml
name: User Registration Flow
description: Create and verify a new user
tags:
  - users
  - smoke

steps:
  - name: Create user
    request:
      method: POST
      url: "{api}/users"
      headers:
        Content-Type: application/json
      body:
        email: alice@example.com
        name: Alice
    capture:
      - name: userId
        path: data.id
    assertions:
      - path: status
        operator: equals
        value: 201
      - path: data.email
        operator: equals
        value: alice@example.com

  - name: Verify user
    request:
      method: GET
      url: "{api}/users/${userId}"
    assertions:
      - path: data.id
        operator: equals
        value: "${userId}"
```

### GraphQL requests

```yaml
steps:
  - name: Query user
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
      - name: userEmail
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

**Supported patterns:**

- `${variable}` — simple variable
- `${data.nested.field}` — nested path
- `${items[0].id}` — array access

### Async polling (waitUntil)

For operations that take time — polls until condition is met or timeout:

```yaml
steps:
  - name: Wait for job completion
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

## ✅ Assertions

<div align="center">

| Operator | Description | Example |
|:--------:|:-----------:|:-------:|
| `equals` | Exact match (deep equality) | `value: 200` |
| `notEquals` | Not equal | `value: null` |
| `contains` | String/array contains | `value: "success"` |
| `notContains` | Does not contain | `value: "error"` |
| `exists` | Not null/undefined | — |
| `notExists` | Is null/undefined | — |
| `greaterThan` | Number comparison | `value: 0` |
| `lessThan` | Number comparison | `value: 100` |
| `matches` | Regex match | `value: "^[a-z]+$"` |
| `ai-evaluate` | AI-powered evaluation | `value: "Is this valid?"` |

</div>

**Special paths:**

- `status` — HTTP status code (when value is a number)
- `httpStatus` — always the HTTP status code
- `data.field` — response body field
- `data.items[0].id` — array access

---

## 🤖 AI-Powered Evaluation

Use AI to assert things that are hard to express with traditional operators. **testflow-ai** supports multiple providers:

<div align="center">

| Provider | Type | Setup | Best For |
|:--------:|:----:|:-----:|:--------:|
| **🦙 Ollama** | Local | Free, no API key | Privacy, offline, cost-effective |
| **🤖 OpenAI** | Cloud | API key required | High accuracy, GPT-4 |
| **🧠 Anthropic** | Cloud | API key required | Claude models, safety-focused |

</div>

### 🦙 Ollama (Local, Recommended)

**No cloud API keys, no data leaves your machine.**

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

1. **Start Ollama** (runs on `http://localhost:11434` by default):

```bash
ollama serve
```

**Usage:**

```bash
# CLI
npx testflow --dir ./tests --ai-provider ollama --ai-model llama3.2:3b

# Programmatic
const report = await runTests({
  testDir: './tests',
  ai: {
    provider: 'ollama',
    url: 'http://localhost:11434',
    model: 'llama3.2:3b',
  },
});
```

### 🤖 OpenAI (Cloud)

**Requires API key from [platform.openai.com](https://platform.openai.com/api-keys)**

```bash
# CLI
npx testflow --dir ./tests \
  --ai-provider openai \
  --ai-key $OPENAI_API_KEY \
  --ai-model gpt-4o-mini

# Programmatic
const report = await runTests({
  testDir: './tests',
  ai: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
  },
});
```

**Supported models:** `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`

### 🧠 Anthropic (Cloud)

**Requires API key from [console.anthropic.com](https://console.anthropic.com/)**

```bash
# CLI
npx testflow --dir ./tests \
  --ai-provider anthropic \
  --ai-key $ANTHROPIC_API_KEY \
  --ai-model claude-3-haiku-20240307

# Programmatic
const report = await runTests({
  testDir: './tests',
  ai: {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-haiku-20240307',
  },
});
```

**Supported models:** `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, `claude-3-haiku-20240307`

### Using AI assertions

```yaml
steps:
  - name: Check article quality
    request:
      method: GET
      url: "{api}/articles/1"
    assertions:
      # Traditional assertion
      - path: status
        operator: equals
        value: 200
      # AI-powered assertion (works with any provider)
      - path: data.content
        operator: ai-evaluate
        value: "Does this article contain a coherent explanation with at least two paragraphs?"
```

### Context file AI config

```markdown
## AI Configuration
- provider: ollama
- url: http://localhost:11434
- model: llama3.2:3b

# Or for cloud providers:
# provider: openai
# apiKey: ${OPENAI_API_KEY}
# model: gpt-4o-mini
```

> **🔒 Privacy note:** Ollama runs entirely locally. OpenAI and Anthropic send data to their APIs. Choose based on your privacy requirements.

---

## 📄 Context Files

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
- provider: ollama
- url: http://localhost:11434
- model: llama3.2:3b
```

---

## 🔄 CI/CD Integration

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

**Exit codes:**

- `0` — all flows passed
- `1` — one or more flows failed

---

## 📊 Output Examples

### Console Output

```
══════════════════════════════════════════════════════════════
  TESTFLOW AI — RESULTS
══════════════════════════════════════════════════════════════

Summary:
  Total:    5 flows
  Passed:  5
  Failed:  0
  Duration: 2450ms

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

## 🗺️ Roadmap

- [ ] Database assertions (verify records directly via SQL)
- [ ] gRPC / RPC support
- [ ] OpenAPI spec → auto-generate test flows
- [ ] Watch mode (re-run on file change)
- [ ] Parallel flow execution
- [ ] HTML report output
- [ ] `testflow init` wizard

---

## 📚 Examples

See the [`examples/`](./examples) directory for:

- **Todo List CRUD** (`todo-crud.yaml`) - Complete REST CRUD flow
- **Todo GraphQL** (`todo-graphql.yaml`) - GraphQL mutations and queries
- **REST CRUD** (`rest-crud.yaml`) - User management example
- **GraphQL Flow** (`graphql-flow.yaml`) - GraphQL with variable capture
- **Auth Flow** (`auth-flow.yaml`) - Authentication and protected routes
- **Context Files** (`context.md`, `todo-list-context.md`) - API context templates

**Quick start with examples:**

```bash
# Run todo list examples
npx testflow --dir ./examples --context ./examples/todo-list-context.md todo-crud.yaml

# Run all examples
npx testflow --dir ./examples --context ./examples/context.md
```

---

## 📄 License

MIT

---

<div align="center">

**Made with ❤️ by [Marcos Carbajal](https://github.com/carbajalmarcos)**

[⭐ Star on GitHub](https://github.com/carbajalmarcos/testflow-ai) • [📦 npm](https://www.npmjs.com/package/testflow-ai) • [🐛 Report Bug](https://github.com/carbajalmarcos/testflow-ai/issues) • [💬 Discussions](https://github.com/carbajalmarcos/testflow-ai/discussions)

---

### ☕ Support this project

If you find **testflow-ai** useful, consider supporting its development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/carbajalmarcos)

**Crypto donations:**

- **Bitcoin (BTC):** `bc1qv0ddjg3wcgujk9ad66v9msz8manu5tanhvq0fn`
- **ERC-20 USDT:** `0x79F57C9D45d2D40420EF071DDAaA27057618E7C8`

*Every contribution helps make this project better!*

</div>
