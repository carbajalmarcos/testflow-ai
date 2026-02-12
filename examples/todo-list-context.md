# Todo List API

## Description
A simple REST API for managing todo items with authentication.

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
- Authentication required for /todos endpoints
- Todos have: id, title, completed, createdAt

## AI Configuration
- provider: ollama
- url: http://localhost:11434
- model: llama3.2:3b
