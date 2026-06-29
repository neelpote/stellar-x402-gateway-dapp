import assert from "assert";

async function main() {
  const targetUrl = "http://localhost:3000/api/market-data";
  console.log(`Sending unwrapped GET request to: ${targetUrl}`);

  try {
    // Send a standard fetch request WITHOUT any x402 wrapping or payment proof
    const response = await fetch(targetUrl, {
      method: "GET",
    });

    console.log(`Received response with HTTP status: ${response.status}`);

    // Assert that the server rejects with HTTP 402 Payment Required
    assert.strictEqual(
      response.status,
      402,
      `Validation failed: Expected HTTP 402 Payment Required, but received HTTP ${response.status}`
    );

    // Read details from standard headers to verify payment challenge structure
    console.log("\nResponse Headers:");
    response.headers.forEach((val, key) => {
      console.log(`- ${key}: ${val}`);
    });

    console.log("\nSuccess: Bounce check works correctly!");
    console.log("The middleware is actively guarding the route with a 402 Payment Required challenge.");

  } catch (error: any) {
    console.error("\nTest Assertion Failed!");
    console.error(`Reason: ${error.message || error}`);
    process.exit(1);
  }
}

main();
