import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import type { NextApiRequest, NextApiResponse } from "next";

// Init express
const app = express();

// Facilitator Client connecting to OpenZeppelin channel testnet relayer
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://channels.openzeppelin.com/x402/testnet",
  createAuthHeaders: async () => {
    const key = process.env.FACILITATOR_API_KEY;
    const headers: Record<string, string> = key
      ? {
          Authorization: `Bearer ${key}`,
          "X-API-Key": key,
        }
      : {};
    return {
      verify: headers,
      settle: headers,
      supported: headers,
    };
  },
});

// Configure resource server and register exact scheme for Stellar Testnet
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("stellar:testnet", new ExactStellarScheme());

// Retrieve the payment destination from environment variables
const recipientAddress = process.env.PAYMENT_RECIPIENT_ADDRESS;

// Middleware configuration guarding GET /api/market-data
app.use(
  paymentMiddleware(
    {
      "GET /api/market-data": {
        accepts: [
          {
            scheme: "exact",
            price: "0.01", // 0.01 USDC
            network: "stellar:testnet",
            payTo: recipientAddress || "GBPLACEHOLDERRECIPIENTADDRESS1234567890",
          },
        ],
      },
    },
    resourceServer
  )
);

// Protected endpoint handler
app.get("/api/market-data", (req, res) => {
  if (!process.env.PAYMENT_RECIPIENT_ADDRESS) {
    return res.status(500).json({
      success: false,
      error: "Server configuration error: PAYMENT_RECIPIENT_ADDRESS is not defined in the environment.",
    });
  }

  // Payment cleared, return actual simulated market data
  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    asset: "USDC",
    price: "1.00",
    volume_24h: "54201948",
    change_24h: "+0.02%",
    chain: "stellar:testnet",
    recipient: process.env.PAYMENT_RECIPIENT_ADDRESS,
    note: "Payment successfully verified by x402 facilitator.",
  });
});

// Default next.js handler delegating execution to the Express app
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Let express route the request
  return app(req, res);
}

// Disable Next.js body parser to allow middleware parsing, and mark resolver as external
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
