import { Horizon, Keypair } from "@stellar/stellar-sdk";
import fs from "fs";
import path from "path";

function loadLocalEnvironment() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadLocalEnvironment();
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  const agentSecret = process.env.AGENT_PRIVATE_KEY;
  const recipientPub = process.env.PAYMENT_RECIPIENT_ADDRESS;
  if (!agentSecret || !recipientPub) {
    throw new Error("AGENT_PRIVATE_KEY and PAYMENT_RECIPIENT_ADDRESS are required in .env.local");
  }
  const agentPub = Keypair.fromSecret(agentSecret).publicKey();

  async function check(pub: string, label: string) {
    console.log(`\nBalances for ${label} (${pub}):`);
    try {
      const account = await server.loadAccount(pub);
      account.balances.forEach((bal: any) => {
        if (bal.asset_type === "native") {
          console.log(`- XLM: ${bal.balance}`);
        } else {
          console.log(`- ${bal.asset_code}: ${bal.balance} (Issuer: ${bal.asset_issuer})`);
        }
      });
    } catch (e: any) {
      console.error(`Failed to load account: ${e.message || e}`);
    }
  }

  await check(agentPub, "Agent (Buyer)");
  await check(recipientPub, "Recipient (Seller)");
}

main().catch(console.error);
