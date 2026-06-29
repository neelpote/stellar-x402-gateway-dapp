import { Keypair, Horizon, Asset, TransactionBuilder, Operation, Networks } from "@stellar/stellar-sdk";
import fs from "fs";
import path from "path";

async function fundAccount(publicKey: string, label: string) {
  console.log(`Funding ${label} account (${publicKey}) via Friendbot...`);
  // Friendbot activates and funds the account with 10,000 XLM
  const response = await fetch(`https://friendbot.stellar.org/?addr=${publicKey}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Friendbot funding failed for ${label}: ${text}`);
  }
  console.log(`Friendbot successfully funded ${label} account.`);
}

async function main() {
  console.log("Generating fresh Stellar Testnet keypairs for Agent and Recipient...");
  
  const agentKeypair = Keypair.random();
  const recipientKeypair = Keypair.random();

  console.log(`Agent Public Key:   ${agentKeypair.publicKey()}`);
  console.log(`Recipient Public Key: ${recipientKeypair.publicKey()}`);

  // Fund accounts via Friendbot
  await fundAccount(agentKeypair.publicKey(), "Agent (Buyer)");
  await fundAccount(recipientKeypair.publicKey(), "Recipient (Seller)");

  // Establish trustlines for USDC
  console.log("Connecting to Horizon Testnet server...");
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  const usdcAsset = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");

  async function createTrustline(keypair: Keypair, label: string) {
    console.log(`Establishing USDC trustline for ${label} account...`);
    const account = await server.loadAccount(keypair.publicKey());
    const baseFee = await server.fetchBaseFee();
    
    const transaction = new TransactionBuilder(account, {
      fee: baseFee.toString(),
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.changeTrust({
          asset: usdcAsset,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(keypair);
    const result = await server.submitTransaction(transaction);
    console.log(`${label} USDC trustline transaction completed successfully. Hash: ${result.hash}`);
  }

  await createTrustline(agentKeypair, "Agent (Buyer)");
  await createTrustline(recipientKeypair, "Recipient (Seller)");

  // Write fresh keys directly to .env.local
  const envContent = `# Stellar payment recipient address (The seller/resource server account)
PAYMENT_RECIPIENT_ADDRESS=${recipientKeypair.publicKey()}

# Stellar private key of the paying client (The buyer/AI agent account, starts with 'S')
AGENT_PRIVATE_KEY=${agentKeypair.secret()}

# Configured USDC issuer for testnet
USDC_ISSUER_ADDRESS=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
`;

  const envPath = path.resolve(process.cwd(), ".env.local");
  fs.writeFileSync(envPath, envContent, "utf-8");
  
  console.log("\nSuccess: Configured and updated .env.local with fresh, fully configured testnet keys!");
  console.log("\nAccount Setup Details:");
  console.log(`1. Agent (Buyer) Account:`);
  console.log(`   - Public Key: ${agentKeypair.publicKey()}`);
  console.log(`   - Secret Key: ${agentKeypair.secret()}`);
  console.log(`   - XLM Balance: 10,000 XLM`);
  console.log(`   - USDC Trustline: Active`);
  console.log(`2. Recipient (Seller) Account:`);
  console.log(`   - Public Key: ${recipientKeypair.publicKey()}`);
  console.log(`   - Secret Key: ${recipientKeypair.secret()}`);
  console.log(`   - XLM Balance: 10,000 XLM`);
  console.log(`   - USDC Trustline: Active`);
  
  console.log("\nNOTE: Before making pay-per-call API requests, request testnet USDC for the Agent account:");
  console.log(`- Go to the Circle Faucet: https://faucet.circle.com/`);
  console.log(`- Select 'Stellar' network and enter the Agent Public Key: ${agentKeypair.publicKey()}`);
}

main().catch((err) => {
  console.error("Account generation and trustline setup failed:");
  console.error(err);
  process.exit(1);
});
