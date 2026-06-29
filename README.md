# 🌌 Stellar x402 Pay-Per-Request Gateway dApp

[![CI/CD Pipeline](https://github.com/stellar-x402-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Soroban SDK Version](https://img.shields.io/badge/Soroban%20SDK-21.7.7-blue)](https://crates.io/crates/soroban-sdk)
[![Next.js Pages Router](https://img.shields.io/badge/Next.js-14.2.35-black)](https://nextjs.org/)

An enterprise-grade, full-stack decentralized application implementing the **x402 pay-per-request payment gating protocol** on the Stellar blockchain network. This project features secure smart contract-to-contract communication, automated client handshake negotiation, a responsive dark-themed telemetry dashboard, and complete unit/integration test coverage.

---

## 🏗️ System Architecture

```
 +-------------------------+                       +-----------------------------+
 |                         |                       |      Next.js API Server     |
 |   Paying Client Agent   |                       |     (/api/market-data)      |
 |     (scripts/agent)     |                       +--------------+--------------+
 +------------+------------+                                      |
              |                                                   | (Intercepts request via middleware)
              | --- 1. GET /api/market-data --------------------> |
              |                                                   |
              | <--- 2. HTTP 402 + Payment Requirement Headers -- |
              |                                                   |
              | (Extracts challenge & signs transaction payload)  |
              |                                                   |
              | --- 3. Submits payment transfer transaction ----> | (USDC Token SAC on Stellar testnet)
              |                                                   |
              | --- 4. Retries GET with Transaction Proof Header -> |
              |                                                   | (Validates via OpenZeppelin Facilitator)
              |                                                   | (Triggers on-chain AccessController)
              |                                                   | (AccessController calls DataRegistry)
              |                                                   | (Emits native events & unlocks hash)
              |                                                   |
              | <--- 5. HTTP 200 OK + Unlocked Premium IPFS Hash - |
              v                                                   v
```

1. **Gated Resource Request**: The paying client initiates a standard HTTP `GET` request to `/api/market-data` to query protected intelligence.
2. **HTTP 402 Gating**: The server intercepts the call using `@x402/express` middleware, verifying that no valid transaction proof was provided. It returns an `HTTP 402 Payment Required` status, specifying the destination recipient address, required asset (0.01 USDC), and the network.
3. **Transaction Settlement**: The client (wrapped in `@x402/fetch` layer) parses the response challenge, generates a transfer transaction using the agent's private key, submits the transaction on-chain to the USDC Stellar Asset Contract (SAC), and captures the transaction hash.
4. **Access Validation & Execution**: The client resubmits the request, appending the transaction hash inside the header credentials. The resource server routes this proof through the OpenZeppelin Facilitator which invokes the deployed smart contracts on-chain to verify the token movement.
5. **Cross-Contract Delivery**: The `AccessController` contract confirms the USDC transfer, invokes the `DataRegistry` contract to log the query telemetry event, and returns the unlocked IPFS hash back to the server, which serves it inside an `HTTP 200 OK` payload.

---

## 📜 Smart Contract Registries (Stellar Testnet)

Smart contracts are written in Rust, targeted for WASM compilation, and configured with the `soroban-sdk` dependency.

| Contract Name | Asset Code / Identifier | Testnet Deployment Address / Explorer Link |
| :--- | :--- | :--- |
| **USDC Token (SAC)** | `USDC` | [`GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`](https://stellar.expert/explorer/testnet/asset/USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5) |
| **DataRegistry** | Storage gateway | [`CCDATAREGISTRYCONTRACTID1234567890SAMPLEONLY`](https://stellar.expert/explorer/testnet) |
| **AccessController** | Router interface | [`CCACCESSCONTROLLERCONTRACTID1234567890SAMPLE`](https://stellar.expert/explorer/testnet) |

---

## ⚙️ Environment Configuration

Generate a `.env.local` file in your project root using the following template:

```env
# Stellar payment recipient address (The seller/resource server account)
PAYMENT_RECIPIENT_ADDRESS=GAAJFP5Q4U76HQXINWVS7STDQP75VLJIRDLY2MAOQ5A3BZ73QZ6NR7PI

# Stellar private key of the paying client (The buyer/AI agent account)
AGENT_PRIVATE_KEY=SAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Configured USDC issuer for testnet
USDC_ISSUER_ADDRESS=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5

# OpenZeppelin channel testnet API Key (obtained from /testnet/gen)
FACILITATOR_API_KEY=c5c59ca5-9794-4f66-a6f4-7cb03fbfa98e
```

---

## 🚀 Step-by-Step Installation & Usage

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **Rust & Cargo** (for compiled contracts)

### 1. Install Dependencies
Initialize package requirements in the project root:
```bash
npm install
```

### 2. Auto-Provision Keys & Trustlines
Run the automated account provisioning utility. It will generate keypairs for the paying agent and receiving merchant, fund both with native XLM via Friendbot, register trustlines for the testnet USDC token contract, and append parameters directly to your `.env.local`:
```bash
npm run setup:keys
```

To view Horizon ledger balances of the provisioned accounts at any time, run:
```bash
npm run check:balances
```

### 3. Mint Testnet USDC
1. Go to the [Circle Developer Faucet](https://faucet.circle.com/).
2. Select **Stellar** in the network dropdown.
3. Paste the **Agent's Public Key** (generated in Step 2).
4. Request dev USDC tokens (20.00 USDC will be minted to the wallet).

---

## 🔬 Testing & Verifications

### 1. Rust Smart Contract Tests (Cargo)
Run the Rust integration test suite which asserts cross-contract querying, minting logic, token balances transfers, and native events publication:
```bash
cargo test --manifest-path contracts/Cargo.toml
```

### 2. Full-Stack Jest Tests (TypeScript & RTL)
Verify frontend DOM element rendering (header, status card, loading spinners, Toast elements) and backend API configurations:
```bash
npm run test
```

### 3. Local Handshake Handlers (Dev Server)
To observe the network intercepting the request and completing the payment handshake automatically:
1. Start the Next.js API server:
   ```bash
   npm run dev
   ```
2. Trigger the bounce test in a new terminal to confirm the raw HTTP 402 challenge occurs:
   ```bash
   npm run test:bounce
   ```
3. Trigger the automatic payment agent:
   ```bash
   npm run test:agent
   ```

---

## 📂 Project Structure Map

```
├── .github/workflows/ci.yml       # CI/CD test and build pipelines
├── contracts/                     # Soroban Rust Smart Contract Workspace
│   ├── src/
│   │   ├── lib.rs                 # Contract logics (Registry & Access)
│   │   └── test.rs                # Integration test assertions
│   └── Cargo.toml                 # Cargo dependencies configurations
├── pages/
│   ├── _app.tsx                   # Main global layout wrapper
│   ├── index.tsx                  # Interactive dark dashboard UI
│   └── api/
│       └── market-data.ts         # Protected x402 middleware resource
├── scripts/                       # Developer utility scripts
│   ├── agent.ts                   # Handshake automated buyer client
│   ├── check-balances.ts          # Balance inspector tool
│   ├── generate-and-setup.ts      # Automated account & trustline generator
│   └── test-402-bounce.ts         # Gating assertion tester
├── styles/
│   └── globals.css                # Global Tailwind CSS configurations
├── tests/                         # Full-stack Jest test cases
│   ├── backend.test.ts            # Route handler type tests
│   └── frontend.test.tsx          # DOM render and interaction test suites
├── tailwind.config.js             # Styling tokens and themes
├── postcss.config.js              # PostCSS plugins configurations
├── jest.config.js                 # Jest configurations for TS/ESM compilation
└── jest.setup.js                  # JSDOM global class polyfills
```
