import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { createEd25519Signer } from "@x402/stellar";
import fs from "fs";
import path from "path";

// Load environment variables manually from .env.local for standard node execution
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  }
}

async function main() {
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: AGENT_PRIVATE_KEY is not defined in .env.local");
    console.error("Please configure your .env.local and add AGENT_PRIVATE_KEY=<your-secret-key-S...>");
    process.exit(1);
  }

  try {
    console.log("Initializing Stellar signer and x402 client...");
    // createEd25519Signer from @x402/stellar using target network stellar:testnet
    const signer = createEd25519Signer(privateKey, "stellar:testnet");

    // Initialize the x402 Client
    const client = new x402Client();

    // Register ExactStellarScheme on the x402Client
    client.register("stellar:*", new ExactStellarScheme(signer));

    // Wrap native fetch function using wrapFetchWithPayment
    const fetchWithPayment = wrapFetchWithPayment(fetch, client);

    const targetUrl = "http://localhost:3000/api/market-data";
    console.log(`Sending authenticated pay-per-call GET request to: ${targetUrl}`);

    const response = await fetchWithPayment(targetUrl, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("\nSuccess! Protected market-data response payload received:");
    console.log(JSON.stringify(data, null, 2));

  } catch (error: any) {
    console.error("\nError: Handshake or client request failed.");
    console.error(`Failure Reason: ${error.message || error}`);
    process.exit(1);
  }
}

main();
