# Demo Script

The included [production dashboard walkthrough](demo/stellar-x402-gateway-walkthrough.mp4) captures resource selection, the 402 challenge, progress telemetry, an unlocked payload, and a payment failure state from the deployed application.

This three-minute walkthrough records the public dashboard and the real command-line payment path separately so the distinction is visible to reviewers.

1. Open the live dashboard and select **USDC Liquidity Analysis**.
2. Run **Trigger gated query**. Point out the probe, the HTTP 402 challenge, the simulated wallet step, and the unlocked payload.
3. Turn on **Simulate payment failure**, run the query again, and show that the payload remains locked.
4. Show `/api/health` returning `status: "ok"` and the Vercel Analytics / Speed Insights panels.
5. In a terminal, run `npm run test:bounce` to show an actual 402 response.
6. Run `npm run test:agent` using a funded Stellar testnet account to show the real signed payment retry and 200 response.
7. Open the two Stellar Expert contract links from `README.md`, then close with the architecture diagram.

For a longer narrated submission, upload a recording following this script to YouTube or Loom and add that public URL alongside the included dashboard walkthrough.
