import type { NextApiRequest, NextApiResponse } from "next";
import { isValidPaymentRecipientAddress } from "./market-data";

type HealthResponse = {
  status: "ok" | "degraded";
  service: "stellar-x402-gateway";
  timestamp: string;
  checks: {
    paymentRecipientConfigured: boolean;
    facilitatorConfigured: boolean;
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponse<HealthResponse | { error: string }>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const checks = {
    paymentRecipientConfigured: isValidPaymentRecipientAddress(process.env.PAYMENT_RECIPIENT_ADDRESS),
    facilitatorConfigured: Boolean(process.env.FACILITATOR_API_KEY),
  };
  const ready = checks.paymentRecipientConfigured && checks.facilitatorConfigured;

  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "degraded",
    service: "stellar-x402-gateway",
    timestamp: new Date().toISOString(),
    checks,
  });
}
