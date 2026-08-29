import assert from "assert";

const requestTimeoutMs = 10_000;

async function main() {
  const gatewayBaseUrl = process.env.GATEWAY_BASE_URL ?? "http://127.0.0.1:3000";
  const targetUrl = `${gatewayBaseUrl.replace(/\/$/, "")}/api/market-data`;
  console.log(`Sending unwrapped GET request to: ${targetUrl}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    // Send a standard fetch request WITHOUT any x402 wrapping or payment proof
    const response = await fetch(targetUrl, {
      method: "GET",
      signal: controller.signal,
    });

    console.log(`Received response with HTTP status: ${response.status}`);

    // Assert that the server rejects with HTTP 402 Payment Required
    assert.strictEqual(
      response.status,
      402,
      `Validation failed: Expected HTTP 402 Payment Required, but received HTTP ${response.status}`
    );

    assert.ok(response.headers.get("payment-required"), "Validation failed: missing PAYMENT-REQUIRED header.");

    console.log("\nSuccess: Bounce check works correctly!");
    console.log("The middleware returned HTTP 402 with a PAYMENT-REQUIRED challenge.");

  } catch (error: any) {
    console.error("\nTest Assertion Failed!");
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Reason: Request timed out after ${requestTimeoutMs / 1000} seconds.`);
    } else {
      console.error(`Reason: ${error.message || error}`);
    }
    process.exit(1);
  } finally {
    clearTimeout(timeoutId);
  }
}

main();
