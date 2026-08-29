// Mock x402 core and express server modules to prevent network requests during testing
jest.mock("@x402/core/server", () => {
  return {
    HTTPFacilitatorClient: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

jest.mock("@x402/express", () => {
  return {
    paymentMiddleware: jest.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => next();
    }),
    x402ResourceServer: jest.fn().mockImplementation(() => {
      return {
        register: jest.fn().mockReturnThis(),
      };
    }),
  };
});

jest.mock("@x402/stellar/exact/server", () => {
  return {
    ExactStellarScheme: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

import handler, {
  buildMarketDataPayload,
  config,
  hasFacilitatorApiKey,
  isValidPaymentRecipientAddress,
  marketDataConfigError,
  PAYMENT_RESPONSE_CACHE_CONTROL,
  resetMarketDataAppForTests,
  X402_PRICE,
} from "@/pages/api/market-data";
import healthHandler from "@/pages/api/health";

interface MockJsonResponse {
  statusCode: number;
  headers: Record<string, string>;
  payload: unknown;
  setHeader: jest.Mock;
  status: jest.Mock;
  json: jest.Mock;
}

function createJsonResponse(): MockJsonResponse {
  const response = {} as MockJsonResponse;
  response.statusCode = 200;
  response.headers = {};
  response.payload = undefined;
  response.setHeader = jest.fn((name: string, value: string) => {
    response.headers[name] = value;
    return response;
  });
  response.status = jest.fn((statusCode: number) => {
    response.statusCode = statusCode;
    return response;
  });
  response.json = jest.fn((payload: unknown) => {
    response.payload = payload;
    return response;
  });

  return response;
}

describe("Market Data API Route Configuration", () => {
  it("should export handler as a valid Next.js route handler function", () => {
    expect(typeof handler).toBe("function");
  });

  it("should configure api to disable bodyParser to let middleware parse streams", () => {
    expect(config.api.bodyParser).toBe(false);
  });

  it("should configure api to enable externalResolver to prevent Next.js warnings", () => {
    expect(config.api.externalResolver).toBe(true);
  });

  it("should reject unsupported methods before invoking the payment middleware", () => {
    const response = createJsonResponse();

    handler({ method: "POST" } as any, response as any);

    expect(response.setHeader).toHaveBeenCalledWith("Allow", "GET");
    expect(response.setHeader).toHaveBeenCalledWith("Cache-Control", PAYMENT_RESPONSE_CACHE_CONTROL);
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.payload).toEqual({
      success: false,
      error: "Method not allowed.",
    });
  });

  it("disables caching for every protected-resource response", () => {
    const response = createJsonResponse();
    const originalRecipient = process.env.PAYMENT_RECIPIENT_ADDRESS;
    delete process.env.PAYMENT_RECIPIENT_ADDRESS;
    resetMarketDataAppForTests();

    handler({ method: "GET" } as any, response as any);

    expect(response.headers["Cache-Control"]).toBe(PAYMENT_RESPONSE_CACHE_CONTROL);
    if (originalRecipient) {
      process.env.PAYMENT_RECIPIENT_ADDRESS = originalRecipient;
    }
    resetMarketDataAppForTests();
  });

  it("should build the successful market data payload from the configured recipient", () => {
    const payload = buildMarketDataPayload("GTESTRECIPIENT");

    expect(payload).toEqual(
      expect.objectContaining({
        success: true,
        asset: "USDC",
        price: X402_PRICE,
        chain: "stellar:testnet",
        recipient: "GTESTRECIPIENT",
      })
    );
    expect(new Date(payload.timestamp).toString()).not.toBe("Invalid Date");
  });

  it("should expose a specific payload for missing payment recipient configuration", () => {
    expect(marketDataConfigError()).toEqual({
      success: false,
      error: "Server configuration error: PAYMENT_RECIPIENT_ADDRESS must be a valid Stellar account address.",
    });
  });

  it("validates Stellar recipient addresses before configuring payment middleware", () => {
    expect(
      isValidPaymentRecipientAddress("GBMXRWVHM4JA3VPIB7BT25WMEKJQX4OXCWT5BZZGQWKLACUFKETZZ6CF")
    ).toBe(true);
    expect(isValidPaymentRecipientAddress("GBPLACEHOLDERRECIPIENTADDRESS1234567890")).toBe(false);
    expect(isValidPaymentRecipientAddress(undefined)).toBe(false);
  });

  it("requires a non-empty facilitator API key", () => {
    expect(hasFacilitatorApiKey("test-key")).toBe(true);
    expect(hasFacilitatorApiKey("   ")).toBe(false);
    expect(hasFacilitatorApiKey(undefined)).toBe(false);
  });

  it("fails closed when the payment recipient is missing", () => {
    const originalRecipient = process.env.PAYMENT_RECIPIENT_ADDRESS;
    delete process.env.PAYMENT_RECIPIENT_ADDRESS;
    resetMarketDataAppForTests();
    const response = createJsonResponse();

    handler({ method: "GET" } as any, response as any);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.payload).toEqual(marketDataConfigError());
    if (originalRecipient) {
      process.env.PAYMENT_RECIPIENT_ADDRESS = originalRecipient;
    }
    resetMarketDataAppForTests();
  });
});

describe("Health API Route", () => {
  const originalRecipient = process.env.PAYMENT_RECIPIENT_ADDRESS;
  const originalFacilitatorKey = process.env.FACILITATOR_API_KEY;

  afterEach(() => {
    if (originalRecipient) {
      process.env.PAYMENT_RECIPIENT_ADDRESS = originalRecipient;
    } else {
      delete process.env.PAYMENT_RECIPIENT_ADDRESS;
    }

    if (originalFacilitatorKey) {
      process.env.FACILITATOR_API_KEY = originalFacilitatorKey;
    } else {
      delete process.env.FACILITATOR_API_KEY;
    }
  });

  it("reports ready only when the gateway configuration is present", () => {
    process.env.PAYMENT_RECIPIENT_ADDRESS = "GBMXRWVHM4JA3VPIB7BT25WMEKJQX4OXCWT5BZZGQWKLACUFKETZZ6CF";
    process.env.FACILITATOR_API_KEY = "test-key";
    const response = createJsonResponse();

    healthHandler({ method: "GET" } as any, response as any);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.headers["Cache-Control"]).toBe("no-store, max-age=0");
    expect(response.payload).toEqual(
      expect.objectContaining({
        status: "ok",
        service: "stellar-x402-gateway",
        checks: {
          paymentRecipientConfigured: true,
          facilitatorConfigured: true,
        },
      })
    );
  });

  it("returns a degraded signal when the payment service is not configured", () => {
    delete process.env.PAYMENT_RECIPIENT_ADDRESS;
    delete process.env.FACILITATOR_API_KEY;
    const response = createJsonResponse();

    healthHandler({ method: "GET" } as any, response as any);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.payload).toEqual(
      expect.objectContaining({
        status: "degraded",
        checks: {
          paymentRecipientConfigured: false,
          facilitatorConfigured: false,
        },
      })
    );
  });

  it("returns a degraded signal for a whitespace-only facilitator key", () => {
    process.env.PAYMENT_RECIPIENT_ADDRESS = "GBMXRWVHM4JA3VPIB7BT25WMEKJQX4OXCWT5BZZGQWKLACUFKETZZ6CF";
    process.env.FACILITATOR_API_KEY = "   ";
    const response = createJsonResponse();

    healthHandler({ method: "GET" } as any, response as any);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.payload).toEqual(
      expect.objectContaining({
        checks: {
          paymentRecipientConfigured: true,
          facilitatorConfigured: false,
        },
      })
    );
  });
});
