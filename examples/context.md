# My API

## Description
Example API context for testflow-ai.

## Base URLs
- api: http://localhost:3000
- graphql: http://localhost:3000/graphql

## Endpoints
- POST /users - Create a new user
- GET /users/:id - Get user by ID
- PUT /users/:id - Update user
- DELETE /users/:id - Delete user
- POST /auth/login - Authenticate and get token
- POST /graphql - GraphQL endpoint

## Rules
- All endpoints return JSON
- Authentication required for /users endpoints
- Rate limit: 100 requests per minute

## AI Configuration
- url: http://localhost:11434
- model: llama3.2:3b
