# Stellar x402 Pay-Per-Request Gateway

A Next.js example of an HTTP `402 Payment Required` gateway on Stellar testnet, plus an independent pair of Soroban contracts for atomic contract-based payment and registry access.

[![CI/CD Pipeline](https://github.com/neelpote/stellar-x402-gateway-dapp/actions/workflows/ci.yml/badge.svg)](https://github.com/neelpote/stellar-x402-gateway-dapp/actions/workflows/ci.yml)

## Live deployment and contracts

- Dashboard: [stellar-x402-gateway-dapp.vercel.app](https://stellar-x402-gateway-dapp.vercel.app)
- Uptime health check: [api/health](https://stellar-x402-gateway-dapp.vercel.app/api/health)
- Demo walkthrough: [MP4 recording](docs/demo/stellar-x402-gateway-walkthrough.mp4)
- DataRegistry: [`CBNK...DDHAO`](https://stellar.expert/explorer/testnet/contract/CBNKLZ5OTWONHLNGFE274SFCVUEDOTLSCKQE3DCO3KESHOF7O4DDDHAO)
- AccessController: [`CB2L...K7RYH`](https://stellar.expert/explorer/testnet/contract/CB2LLC37XM3AMQOYWMML6R6HHBFKIMYUNC4LTK5AIJ2244ALGSGK7RYH)

The dashboard is an intentional browser walkthrough: it makes an unauthenticated request to expose the real 402 challenge, then simulates wallet signing. The `scripts/agent.ts` client is the real signed x402 payment path. This distinction prevents a browser demo from silently requesting a private key or charging a user.

## What is real

The repository contains two distinct payment paths:

1. **HTTP x402 gateway** — `/api/market-data` uses `@x402/express`, the Stellar exact-payment scheme, and the OpenZeppelin testnet facilitator. The facilitator verifies and settles a Stellar payment before the buffered API response is released.
2. **Soroban contract path** — `AccessController` transfers a configured token amount and calls `DataRegistry` in one atomic invocation. This path has separate WASM artifacts and can be deployed independently.

The HTTP facilitator does not invoke `AccessController`. Combining those paths in a single request would charge the buyer twice. The browser dashboard visibly simulates the wallet portion of the flow; `npm run test:agent` is the real paying HTTP client.

## HTTP x402 flow

```text
Paying client                    Next.js resource server             Facilitator / Stellar
     |                                      |                               |
     | GET /api/market-data                 |                               |
     |------------------------------------->|                               |
     | 402 + exact payment requirements     |                               |
     |<-------------------------------------|                               |
     | retry with signed payment payload    |                               |
     |------------------------------------->| verify and settle ------------>|
     |                                      |<---------------- success ------|
     | 200 protected payload                |                               |
     |<-------------------------------------|                               |
```

The configured HTTP price is **0.01 USDC**. The API fails closed when `PAYMENT_RECIPIENT_ADDRESS` is missing or is not a valid Stellar account address.

## Soroban contracts

### DataRegistry

- Constructed atomically with an administrator; only that administrator can configure the authorized `AccessController` address.
- Only the administrator can create or overwrite records.
- Only the configured controller can call `get_data`.
- Persistent records and instance configuration extend their storage TTL.
- Missing records fail explicitly instead of returning a fake default value.

### AccessController

- Constructed atomically with the administrator, seller, token contract, registry, and positive fixed price.
- Buyers cannot supply or override the seller, token, registry, or price.
- Buyer authorization is required.
- Token transfer and registry lookup are atomic; a failed lookup rolls back the transfer.
- Only the administrator can update payment configuration or transfer administration.

Stellar contract storage and return values are public. Store public metadata, commitments, or encrypted content references in `DataRegistry`—never plaintext secrets.

## Configuration

Copy `.env.example` to `.env.local` and provide real testnet values:

```env
PAYMENT_RECIPIENT_ADDRESS=G...
AGENT_PRIVATE_KEY=S...
FACILITATOR_API_KEY=replace-with-your-testnet-key
USDC_ISSUER_ADDRESS=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

`AGENT_PRIVATE_KEY` is used only by the command-line paying client. It must never be exposed through a `NEXT_PUBLIC_` variable or sent to the browser.

## Install and run

Prerequisites: Node.js 20+, Rust 1.91+, and the `wasm32v1-none` Rust target.

```bash
npm ci
npm run dev
```

In another terminal, confirm the raw challenge:

```bash
npm run test:bounce
```

Run the real signed x402 client after configuring and funding the agent account:

```bash
npm run test:agent
```

Both command-line clients default to `http://127.0.0.1:3000`, which avoids a local IPv6 `localhost` mismatch. Set `GATEWAY_BASE_URL` to point them at a deployed gateway instead. Explicit shell environment values take precedence over `.env.local` values.

The setup helper creates fresh testnet accounts and trustlines. It stores the buyer secret in the permission-restricted `.env.local` file and does not print secrets:

```bash
npm run setup:keys
npm run check:balances
```

## Test and build

Run the 13 Soroban unit and security tests:

```bash
cargo test --manifest-path contracts/Cargo.toml --locked
```

Build the two deployable WASM artifacts:

```bash
cargo build \
  --manifest-path contracts/Cargo.toml \
  --locked \
  --release \
  --target wasm32v1-none \
  -p data-registry \
  -p access-controller
```

Artifacts:

- `contracts/target/wasm32v1-none/release/data_registry.wasm`
- `contracts/target/wasm32v1-none/release/access_controller.wasm`

Run the application tests and production build:

```bash
npm test -- --runInBand
npm run build
```

CI runs all three checks and builds both WASMs. There are no placeholder deployment IDs checked into the repository.

## Deploy the contract path

The following outline uses a configured Stellar CLI identity named `deployer`. Deployment is an explicit operation and is not performed by the test suite.

```bash
ADMIN_ADDRESS=$(stellar keys address deployer)

DATA_REGISTRY_CONTRACT_ID=$(stellar contract deploy \
  --wasm contracts/target/wasm32v1-none/release/data_registry.wasm \
  --source deployer \
  --network testnet \
  -- \
  --admin "$ADMIN_ADDRESS")

ACCESS_CONTROLLER_CONTRACT_ID=$(stellar contract deploy \
  --wasm contracts/target/wasm32v1-none/release/access_controller.wasm \
  --source deployer \
  --network testnet \
  -- \
  --admin "$ADMIN_ADDRESS" \
  --seller "$SELLER_ADDRESS" \
  --token "$TOKEN_CONTRACT_ID" \
  --registry "$DATA_REGISTRY_CONTRACT_ID" \
  --price 100000)
```

Both contracts use deploy-time constructors, so their administrators and payment terms are set atomically and cannot be claimed in a front-running initialization transaction. After deploying the controller, authorize it in the registry:

```bash
stellar contract invoke \
  --id "$DATA_REGISTRY_CONTRACT_ID" \
  --source deployer \
  --network testnet \
  -- set_controller \
  --controller "$ACCESS_CONTROLLER_CONTRACT_ID"
```

After deployment, put the two returned contract IDs in `.env.local` for operational reference.

## Project layout

```text
contracts/
├── Cargo.toml                       # Rust workspace
├── access-controller/               # Fixed-price atomic payment contract
│   └── src/{lib.rs,test.rs}
└── data-registry/                   # Admin-controlled registry contract
    └── src/{lib.rs,test.rs}
pages/
├── api/market-data.ts               # Protected x402 HTTP resource
└── index.tsx                        # Clearly labelled browser walkthrough
scripts/
├── agent.ts                         # Real signed x402 client
├── generate-and-setup.ts            # Testnet account setup
└── check-balances.ts                # Environment-based balance lookup
tests/                               # API and UI tests
```

## Production operations

Vercel Web Analytics captures page views and the dashboard's non-sensitive product events. Speed Insights reports real-user performance. The unauthenticated `GET /api/health` endpoint returns `200` only when the payment recipient and facilitator key are configured; configure it as an uptime monitor in the deployment platform.

The included `vercel.json` adds browser security headers without imposing a content security policy that could break the Next.js runtime. The Vercel project needs only `PAYMENT_RECIPIENT_ADDRESS` and `FACILITATOR_API_KEY`. Keep `AGENT_PRIVATE_KEY` and `USDC_ISSUER_ADDRESS` local for the payment-client and setup scripts; never upload a buyer secret to the web deployment.

## Submission assets

`docs/SUBMISSION.md` contains the checklist, live links, verified contract addresses, screenshots, feedback template, and final verification commands. `docs/DEMO_SCRIPT.md` is a short recording plan that demonstrates both the visual walkthrough and the real paying client.
