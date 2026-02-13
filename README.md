<div align="center">

# 🧪 testflow-ai

**YAML API flows + optional LLM assertions (local Ollama or cloud)**

*Version-controlled • CI/CD-ready • Human-readable*

[![npm version](https://img.shields.io/npm/v/testflow-ai.svg?style=for-the-badge&color=blue)](https://www.npmjs.com/package/testflow-ai)
[![npm downloads](https://img.shields.io/npm/dm/testflow-ai.svg?style=for-the-badge&color=green)](https://www.npmjs.com/package/testflow-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg?style=for-the-badge)](https://nodejs.org)

✅ **Multi-step flows** (create → capture → reuse → assert)  
🤖 **Assert "hard" responses with AI** (privacy-first via Ollama)  
📄 **Keep API context in Markdown** (great for humans + AI agents)

[📖 Documentation](#-documentation) • [🚀 Quick Start](#-quick-start) • [💻 Examples](#-real-world-example) • [🤖 AI Providers](#-ai-powered-evaluation)

</div>

---

## 🎯 What is testflow-ai?

**testflow-ai** lets you describe API scenarios in YAML files, run them from the command line or as a library, and (optionally) ask an AI model to judge complex responses. No GUI, no vendor lock‑in, and it works with any HTTP/GraphQL API.

> **💡 Born from real-world frustration:**  
> After days of testing APIs with Postman and burning tokens with ChatGPT, I built this to centralize tests in version-controlled YAML files with local AI support.  
> I wanted something that felt more like a **test agent**: a tool that could **create data, mutate it, delete it, and walk full flows end‑to‑end**, but defined in plain files, close to the code, and easy to run in CI.  
> **testflow-ai** is that tool: a thin engine that turns YAML flows into real HTTP calls, variable captures, assertions, and (if you want) AI‑powered checks.

---

## ✨ Why it's different

Most API testing tools are either **GUI-first** (collections) or **code-first** (JS/TS test code).  
**testflow-ai** is **flow-first**: readable YAML that runs in CI — with an optional AI judge when classic assertions aren't enough.

**What you get:**

- **Flow engine**: multi-step scenarios with capture + interpolation (CRUD, auth, webhooks, background jobs)
- **AI assertions**: validate complex text/structured responses with natural language checks (Ollama/OpenAI/Anthropic)
- **Context-as-docs**: a Markdown file that explains base URLs, endpoints, and rules — perfect input for AI agents too

---

## ✅ When to use testflow-ai

- You want **version-controlled API E2E flows** (not a GUI collection)
- You need **multi-step chaining** (create → capture id → update → verify)
- You want **CI/CD-ready output** (console/json/markdown + exit codes + no external deps)
- You sometimes need an **AI judge** for fuzzy checks (content quality, summaries, "is this coherent?")

## 🚫 When NOT to use it

- You only need **schema/property-based fuzzing** from OpenAPI
- You prefer **writing tests in code** (Jest/Vitest) with full programmatic control
- You need **browser/UI testing** (Playwright/Cypress territory)

---

## 🆚 What testflow-ai optimizes for

<div align="center">

| Goal | testflow-ai |
|:----:|:-----------:|
| Human-readable flows in Git | ✅ |
| Multi-step chaining + captures | ✅ |
| CI/CD-ready (exit codes, JSON) | ✅ |
| Optional AI-based assertions | ✅ |
| GUI collections | ❌ (not a goal) |
| Full code-based test suites | ❌ (use your test framework) |

</div>

---

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

```bash
npm i -D testflow-ai
```

**Create `context.md`:**

```markdown
# My API

## Base URLs
- api: http://localhost:3000
```

**Create `tests/todo.yaml`:**

```yaml
name: Todo flow
tags: [smoke]

steps:
  - name: Create todo
    request:
      method: POST
      url: "{api}/todos"
      headers:
        Content-Type: application/json
      body:
        title: "Buy milk"
        completed: false
    capture:
      - name: todoId
        path: data.id
    assertions:
      - path: status
        operator: equals
        value: 201

  - name: Fetch todo
    request:
      method: GET
      url: "{api}/todos/${todoId}"
    assertions:
      - path: data.title
        operator: equals
        value: "Buy milk"
```

**Run:**

```bash
npx testflow --context ./context.md tests/todo.yaml
```

**That's it.** No config files, no GUI, no account.

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

<details>
<summary><b>💻 Real-World Example</b> (click to expand)</summary>

Here's a complete example using a Todo List API:

### Project Structure

```
my-api/
├── tests/
│   ├── index.ts              # Test runner
│   ├── context.md            # API context
│   └── flows/
│       ├── todo-crud.yaml
│       └── todo-graphql.yaml
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
  testFiles: ['./tests/todo-crud.yaml'],
  ai: { provider: 'ollama', model: 'mistral:7b' },
});
const report = await runner.run();

// Manual execution
const context = await parseContextFile('./context.md');
const flow = await parseYamlFile('./tests/todo-crud.yaml');
const executor = new FlowExecutor(context, true);
const result = await executor.executeFlow(flow);
```

</details>

---

<details>
<summary><b>📝 Test Flow Reference</b> (click to expand)</summary>

### Basic structure

```yaml
name: Todo Lifecycle
description: Create a todo and verify it exists
tags:
  - todos
  - smoke

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

  - name: Verify todo
    request:
      method: GET
      url: "{api}/todos/${todoId}"
    assertions:
      - path: data.id
        operator: equals
        value: "${todoId}"
```

### GraphQL requests

```yaml
steps:
  - name: Query todo
    request:
      method: POST
      url: "{graphql}"
      graphql:
        query: |
          query GetTodo($id: ID!) {
            todo(id: $id) {
              id
              title
              completed
            }
          }
        variables:
          id: "${todoId}"
    capture:
      - name: todoTitle
        path: data.todo.title
```

### Variable capture and interpolation

Variables captured in one step are available in all subsequent steps:

```yaml
steps:
  - name: Create todo
    request:
      method: POST
      url: "{api}/todos"
      headers:
        Content-Type: application/json
      body:
        title: "Read docs"
        completed: false
    capture:
      - name: todoId
        path: data.id
      - name: todoTitle
        path: data.title

  - name: Verify todo title
    request:
      method: GET
      url: "{api}/todos/${todoId}"
    assertions:
      - path: data.title
        operator: equals
        value: "${todoTitle}"
```

**Supported patterns:**

- `${variable}` — simple variable
- `${data.nested.field}` — nested path
- `${items[0].id}` — array access

### Async polling (waitUntil)

For operations that take time — polls until condition is met or timeout:

```yaml
steps:
  - name: Wait for todo sync
    request:
      method: GET
      url: "{api}/todos/${todoId}/sync-status"
    waitUntil:
      path: data.status
      operator: equals
      value: "SYNCED"
      timeout: 30000    # max wait (ms)
      interval: 2000    # poll every (ms)
    assertions:
      - path: data.status
        operator: equals
        value: "SYNCED"
```

</details>

---

<details>
<summary><b>✅ Assertions</b> (click to expand)</summary>

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

</details>

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
  - name: Check todo description
    request:
      method: GET
      url: "{api}/todos/${todoId}"
    assertions:
      # Traditional assertion
      - path: status
        operator: equals
        value: 200
      # AI-powered assertion (works with any provider)
      - path: data.description
        operator: ai-evaluate
        value: "Is this a well-formed task description with a clear action item?"
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

### 🤖 AI assertions in CI (recommended settings)

AI checks can be non-deterministic. For CI, prefer:

- **Deterministic settings** (e.g. `temperature: 0` for OpenAI/Anthropic)
- **Short, specific prompts** (avoid vague questions)
- **Stable models** (avoid preview/beta models)

Example:

```typescript
ai: {
  provider: 'openai',
  model: 'gpt-4o-mini',
  // OpenAI doesn't expose temperature in our API yet, but use stable models
}
```

---

<details>
<summary><b>🔒 Security & secrets</b> (click to expand)</summary>

- **Avoid committing API keys.** Use environment variables (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
- The runner **redacts** common secret fields in logs (Authorization headers, tokens, cookies) when verbose mode is enabled.
- Keep sensitive data out of YAML files — use environment variable interpolation or context files with `.gitignore`.

**Example:**

```yaml
headers:
  Authorization: "Bearer ${API_TOKEN}"  # Use env vars
```

**Best practices:**

- Store secrets in `.env` files (add to `.gitignore`)
- Use context files for non-sensitive config (base URLs, endpoints)
- Never commit API keys or tokens in YAML files

</details>

---

<details>
<summary><b>🧩 YAML schema & autocomplete (VSCode)</b> (click to expand)</summary>

We provide a JSON Schema for `*.yaml` test flows so you get autocomplete + validation in editors.

**VSCode setup** (`.vscode/settings.json`):

```json
{
  "yaml.schemas": {
    "https://raw.githubusercontent.com/carbajalmarcos/testflow-ai/main/schemas/testflow.schema.json": [
      "tests/**/*.yaml",
      "**/*.testflow.yaml"
    ]
  }
}
```

This gives you:

- ✅ Autocomplete for `name`, `steps`, `request`, `assertions`, etc.
- ✅ Validation for required fields and types
- ✅ Hover documentation for operators and options

> **Note:** JSON Schema coming in a future release. For now, TypeScript types provide autocomplete via `import type { TestFlow } from 'testflow-ai'`.

</details>

---

<details>
<summary><b>📄 Context Files</b> (click to expand)</summary>

Define your project context in Markdown. The runner uses it to resolve `{baseUrlKey}` references in your YAML flows.

```markdown
# Todo List API

## Description
A REST + GraphQL API for managing todo items.

## Base URLs
- api: http://localhost:3000
- graphql: http://localhost:3000/graphql

## Endpoints
- POST /todos - Create todo
- GET /todos/:id - Get todo by ID
- PUT /todos/:id - Update todo
- DELETE /todos/:id - Delete todo
- POST /graphql - GraphQL endpoint

## Rules
- All endpoints return JSON
- Todos have: id, title, completed, createdAt

## AI Configuration
- provider: ollama
- url: http://localhost:11434
- model: llama3.2:3b
```

</details>

---

<details>
<summary><b>🔄 CI/CD Integration</b> (click to expand)</summary>

**testflow-ai** works in any CI/CD pipeline:

- Exit code `0` = success, `1` = failure (CI will fail automatically)
- JSON output: `--format json` for parsing results
- Tag filtering: `--tags smoke` for faster runs

### GitHub Actions

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm install -D testflow-ai
      - run: npm run start:server &
      - run: npx testflow --dir ./tests --context ./context.md
```

That's it. If tests fail, the job fails automatically (exit code 1).

</details>

---

<details>
<summary><b>📊 Output Examples</b> (click to expand)</summary>

### Console Output

```
══════════════════════════════════════════════════════════════
  TESTFLOW AI — RESULTS
══════════════════════════════════════════════════════════════

Summary:
  Total:    3 flows
  Passed:  2
  Failed:  1
  Duration: 1850ms

Narrative:

✅ **Todo CRUD**
   → Create todo
     📦 todoId: abc-123
   → Read todo
   → Update todo
   → Delete todo

✅ **Todo GraphQL**
   → Create todo (mutation)
     📦 todoId: def-456
   → Query todo

❌ **Todo Bulk Import**
   ✗ Import todos from CSV
     ⚠️  Expected status to equal 200, got 500

══════════════════════════════════════════════════════════════
```

</details>

---

<details>
<summary><b>🗺️ Roadmap</b> (click to expand)</summary>

- [ ] Database assertions (verify records directly via SQL)
- [ ] gRPC / RPC support
- [ ] OpenAPI spec → auto-generate test flows
- [ ] Watch mode (re-run on file change)
- [ ] Parallel flow execution
- [ ] HTML report output
- [ ] `testflow init` wizard

</details>

---

## 📚 Examples

See the [`examples/`](./examples) directory for:

- **REST CRUD** (`rest-crud.yaml`) — Full todo lifecycle: create → read → update → verify
- **Auth Flow** (`auth-flow.yaml`) — Login, create todo with token, verify access control
- **GraphQL Flow** (`graphql-flow.yaml`) — Create + query todos via GraphQL mutations
- **Todo CRUD** (`todo-crud.yaml`) — Extended CRUD with delete + verify deletion
- **Todo GraphQL** (`todo-graphql.yaml`) — GraphQL mutations and queries with variable capture
- **Context Files** (`context.md`, `todo-list-context.md`) — API context templates

**Quick start with examples:**

```bash
# Run a specific flow
npx testflow --context ./examples/context.md ./examples/rest-crud.yaml

# Run the auth flow
npx testflow --context ./examples/context.md ./examples/auth-flow.yaml

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
