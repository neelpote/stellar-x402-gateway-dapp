import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import type { NextApiRequest, NextApiResponse } from "next";

type ExpressApp = ReturnType<typeof express>;

let app: ExpressApp | null = null;

export function buildMarketDataPayload(recipient: string) {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    asset: "USDC",
    price: "1.00",
    volume_24h: "54201948",
    change_24h: "+0.02%",
    chain: "stellar:testnet",
    recipient,
    note: "Payment successfully verified by x402 facilitator.",
  };
}

export function marketDataConfigError() {
  return {
    success: false,
    error: "Server configuration error: PAYMENT_RECIPIENT_ADDRESS is not defined in the environment.",
  };
}

function getPaymentRecipientAddress() {
  return process.env.PAYMENT_RECIPIENT_ADDRESS;
}

function getAuthHeaders(): Record<string, string> {
  const key = process.env.FACILITATOR_API_KEY;
  return key
    ? {
        Authorization: `Bearer ${key}`,
        "X-API-Key": key,
      }
    : {};
}

function createApp() {
  const expressApp = express();
  const recipientAddress = getPaymentRecipientAddress();

  const facilitatorClient = new HTTPFacilitatorClient({
    url: "https://channels.openzeppelin.com/x402/testnet",
    createAuthHeaders: async () => {
      const headers = getAuthHeaders();
      return {
        verify: headers,
        settle: headers,
        supported: headers,
      };
    },
  });

  const resourceServer = new x402ResourceServer(facilitatorClient).register(
    "stellar:testnet",
    new ExactStellarScheme()
  );

  expressApp.use(
    paymentMiddleware(
      {
        "GET /api/market-data": {
          accepts: [
            {
              scheme: "exact",
              price: "0.01",
              network: "stellar:testnet",
              payTo: recipientAddress || "GBPLACEHOLDERRECIPIENTADDRESS1234567890",
            },
          ],
        },
      },
      resourceServer
    )
  );

  expressApp.get("/api/market-data", (req, res) => {
    const recipient = getPaymentRecipientAddress();

    if (!recipient) {
      return res.status(500).json(marketDataConfigError());
    }

    return res.status(200).json(buildMarketDataPayload(recipient));
  });

  return expressApp;
}

function getApp() {
  if (!app) {
    app = createApp();
  }

  return app;
}

export function resetMarketDataAppForTests() {
  if (process.env.NODE_ENV === "test") {
    app = null;
  }
}

// Default next.js handler delegating execution to the Express app
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      success: false,
      error: "Method not allowed.",
    });
  }

  return getApp()(req, res);
}

// Disable Next.js body parser to allow middleware parsing, and mark resolver as external
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
