# Stellar x402 Pay-Per-Request Gateway dApp

An enterprise-grade, full-stack decentralized application implementing the **x402 payment gating protocol** on the Stellar blockchain network.

---

## Architectural Workflow

```
 +------------------+                   +----------------------+
 |   Client Agent   |                   |    Next.js Server    |
 | (scripts/agent)  |                   | (/api/market-data)   |
 +--------+---------+                   +----------+-----------+
          |                                        |
          | --- 1. GET /api/market-data ---------> |
          |                                        | (Intercepts request via middleware)
          | <--- 2. HTTP 402 + Payment-Required --- |
          |                                        |
          | (Extracts challenge & signs Tx)        |
          |                                        |
          | --- 3. Submits Transaction to SAC ---> | (USDC Token SAC on Stellar testnet)
          |                                        |
          | --- 4. Retries GET with Proof --------> |
          |                                        | (Queries OpenZeppelin Facilitator)
          |                                        | (Verifies payment on-chain)
          |                                        | (Calls AccessController SAC)
          |                                        | (AccessController calls DataRegistry)
          |                                        | (Emits query event & unlocks hash)
          |                                        |
          | <--- 5. HTTP 200 OK + Market Data ---- |
          v                                        v
```

1. **Initial Request**: The client requests gated premium market data.
2. **Payment Challenge**: The server's Express-wrapped x402 middleware intercepts the call and rejects it with `HTTP 402 Payment Required`, specifying the cost (0.01 USDC) and recipient.
3. **On-Chain Settlement**: The client (using `@x402/fetch` wrapper) parses the challenge, signs the payment authorization via the agent's key, and submits the transfer transaction.
4. **Access Verification**: The client retries the request with the payment proof. The server routes the challenge to the OpenZeppelin Facilitator, which queries the deployed `AccessController` contract on-chain.
5. **Cross-Contract Delivery**: The `AccessController` verifies the USDC transfer on-chain and performs a cross-contract invocation to `DataRegistry` which logs the query event and returns the premium IPFS hash to the client.

---

## Smart Contract Deployments (Testnet)

*   **USDC Token Contract (SAC)**: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
*   **DataRegistry Contract**: `CCDATAREGISTRYCONTRACTID1234567890SAMPLEONLY`
*   **AccessController Contract**: `CCACCESSCONTROLLERCONTRACTID1234567890SAMPLE`

---

## Local Setup & Configuration

### Prerequisites
- Node.js (v18+)
- Rust & Cargo (with `wasm32-unknown-unknown` target configured)

### 1. Install Dependencies
Install npm modules in the workspace root:
```bash
npm install
```

### 2. Auto-Provision Stellar Accounts
Run the setup utility to generate fresh keypairs, fund them on the Testnet ledger via Friendbot, and configure USDC trustlines:
```bash
npx tsx scripts/generate-and-setup.ts
```
This script will output the keys and write them automatically to your `.env.local` file.

### 3. Claim Testnet USDC
Go to the [Circle Faucet](https://faucet.circle.com/), select the **Stellar** network, paste your **Agent's Public Key** (generated in the previous step), and claim your dev tokens.

---

## Verification & Testing

### Smart Contract Tests (Soroban)
Run the Rust unit and integration test suite inside `/contracts`:
```bash
cargo test --manifest-path contracts/Cargo.toml
```

### Frontend & Backend Integration Tests
Execute the TypeScript and React Testing Library test suites:
```bash
npm run test
```

### End-to-End Handshake Verification
1. Start the Next.js API server:
   ```bash
   npm run dev
   ```
2. In a separate terminal, trigger the bounce test (fails with 402):
   ```bash
   npm run test:bounce
   ```
3. Run the payment agent script (succeeds via automatic handshake):
   ```bash
   npm run test:agent
   ```

---

## CI/CD Pipeline
Continuous Integration is configured via GitHub Actions at `.github/workflows/ci.yml`. It automates:
- Dependency resolution for Node and Rust toolchains.
- Cargo contract compiling and test execution.
- Jest full-stack test suite verification.
- Next.js production builds compiling.
