import { Horizon } from "@stellar/stellar-sdk";

async function main() {
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  
  const agentPub = "GBMXRWVHM4JA3VPIB7BT25WMEKJQX4OXCWT5BZZGQWKLACUFKETZZ6CF";
  const recipientPub = "GAAJFP5Q4U76HQXINWVS7STDQP75VLJIRDLY2MAOQ5A3BZ73QZ6NR7PI";

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
