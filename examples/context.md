# Todo API

## Description
Example API context for testflow-ai — a simple Todo REST + GraphQL API.

## Base URLs
- api: http://localhost:3000
- graphql: http://localhost:3000/graphql

## Endpoints
- POST /todos - Create a new todo
- GET /todos/:id - Get todo by ID
- GET /todos - List all todos
- PUT /todos/:id - Update todo
- DELETE /todos/:id - Delete todo
- POST /auth/login - Authenticate and get token
- POST /graphql - GraphQL endpoint

## Rules
- All endpoints return JSON
- Authentication required for write operations
- Rate limit: 100 requests per minute

## AI Configuration
- provider: ollama
- url: http://localhost:11434
- model: llama3.2:3b
