---
name: Debugging Strategies
description: Debugging strategies for x402 payment flow, Stellar testnet connection, relayer timeouts, and trustlines.
---

# Debugging Strategies for Web3 Pay-Per-Call APIs

Use this guide to diagnose issues encountered during development and integration testing:

## 1. Network Issues / Relayer Timeout
- **Stellar Horizon / OpenZeppelin Channel Relayer**: Check if the testnet relayer (e.g. `https://channels.openzeppelin.com/x402/testnet`) is responsive. Use `curl` or test requests to verify status.
- **Local Dev Server**: Ensure the Next.js API server is running locally (normally `http://localhost:3000`) and is accessible by the agent script.

## 2. Stellar Payment / Trustline Errors
- **Gas / Account Funding**: Stellar accounts must be funded with native XLM (using Friendbot) before they can perform any transaction.
- **USDC Trustline**: For USD Coin (USDC) transactions on Stellar testnet, the paying wallet must have established a trustline to the USDC asset. The USDC asset details on Stellar testnet are:
  - Asset Code: `USDC`
  - Issuer: `GBBD47R74W77HOEPIZFLHY7VGDGD6G3GDBCC6A4ZO36Z5BC5W65QWQQB` (or standard testnet USDC issuer).
- **Insufficient Funds**: Make sure the payer balance has enough XLM/USDC to cover the request price (e.g. 0.01 USDC) and transaction fees.

## 3. Middleware Integration Errors
- **Next.js Body Parsing**: If a middleware hangs or throws parsing errors, confirm that Next.js automatic body parsing is disabled (`export const config = { api: { bodyParser: false } }`).
- **Express Responders**: If a Next.js route with Express times out, check if `externalResolver: true` is configured in Next.js config to allow Express to handle response resolving.
