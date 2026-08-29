import assert from "assert";

const requestTimeoutMs = 10_000;

async function main() {
  const gatewayBaseUrl = process.env.GATEWAY_BASE_URL ?? "http://127.0.0.1:3000";
  const targetUrl = `${gatewayBaseUrl.replace(/\/$/, "")}/api/market-data`;
  console.log(`Sending an unwrapped GET request to: ${targetUrl}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      signal: controller.signal,
    });

    assert.strictEqual(response.status, 402, `Expected HTTP 402, received HTTP ${response.status}`);
    assert.ok(response.headers.get("payment-required"), "Missing PAYMENT-REQUIRED header.");

    console.log("Payment challenge received successfully.");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Request timed out after ${requestTimeoutMs / 1000} seconds.`);
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  } finally {
    clearTimeout(timeoutId);
  }
}

main();
