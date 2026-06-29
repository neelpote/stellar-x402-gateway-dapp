async function main() {
  console.log("Requesting OpenZeppelin channel testnet API key...");
  try {
    // Attempt POST
    let res = await fetch("https://channels.openzeppelin.com/testnet/gen", {
      method: "POST"
    });
    console.log("POST Status:", res.status);
    let text = await res.text();
    console.log("POST Response:", text);

    // Attempt GET if POST was not 201
    if (res.status !== 201 && res.status !== 200) {
      res = await fetch("https://channels.openzeppelin.com/testnet/gen", {
        method: "GET"
      });
      console.log("GET Status:", res.status);
      text = await res.text();
      console.log("GET Response:", text);
    }
  } catch (e: any) {
    console.error("Fetch error:", e.message || e);
  }
}
main().catch(console.error);
