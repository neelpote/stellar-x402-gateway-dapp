---
name: Architecture
description: Architectural guidelines for separating HTTP facilitation, middleware, server initialization, and test scripts.
---

# Architecture & Modularity Guidelines

This skill guides the overall structure and quality of backend implementations.

## Separation of Concerns
1. **HTTP Resource Layer**: API endpoints should focus on request handling, validation, routing, and returning formatted JSON/status responses.
2. **Middleware Layer**: Payment checking and verification protocols (like x402) should be encapsulated in middlewares, avoiding logic pollution of business handlers.
3. **Execution/Client Scripts**: Autonomous scripts, CLI runners, and tests should live separately from the core API routing code (typically in a `scripts/` directory).
4. **Configuration Layer**: Dependency clients (like HTTPFacilitatorClient, Stellar signers) should be initialized dynamically and correctly bound to standard environmental contexts.

## Clean Code and Types
- Keep types explicit and complete. Avoid `any` where possible.
- Design code to fail gracefully at the boundaries with informative error responses rather than bubble up untyped exceptions.
