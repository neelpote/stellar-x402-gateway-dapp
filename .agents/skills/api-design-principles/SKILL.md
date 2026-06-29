---
name: API Design Principles
description: Guidelines for REST API contracts, 402 Payment Required status code, and X-Payment headers.
---

# API Design Principles for Pay-Per-Call Web3 APIs

This skill outlines guidelines for implementing pay-per-call API contracts using HTTP standard 402 (Payment Required).

## 402 Payment Required Protocol Handshake

When a resource requires payment before serving:
1. **Initial Request**: Client sends a standard request to the endpoint (e.g., `GET /api/market-data`).
2. **Payment Required Challenge (402)**: The server intercepts the request, detects that no valid payment context is present, and returns `HTTP 402 Payment Required`.
   - The response must include headers indicating the payment requirement (e.g., `402` status code and standard/custom headers like `X-Payment` or `WWW-Authenticate` containing details on price, token, recipient address, network, and payment scheme).
3. **Client Payment Execution**: The client extracts the payment parameters from the response headers, executes the transaction on the target blockchain (e.g., Stellar testnet), and obtains a transaction proof/signature.
4. **Subsequent Request with Payment Proof**: The client retries the request, attaching the payment proof or transaction ID in the headers (e.g., as a bearer token or in a custom header like `X-Payment`).
5. **Success (200)**: The server verifies the transaction proof (checking transaction existence, recipient, amount, and asset code/issuer). If valid, it processes the request and returns `200 OK` with the payload.

## Headers and Semantics
- Ensure headers are strictly validated and handled without throwing unhandled exceptions.
- Custom headers used by x402 protocol include `X-Payment` containing state or transaction reference.
