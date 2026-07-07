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

import handler, { buildMarketDataPayload, config, marketDataConfigError } from "@/pages/api/market-data";

function createJsonResponse() {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    payload: undefined as unknown,
    setHeader: jest.fn((name: string, value: string) => {
      response.headers[name] = value;
      return response;
    }),
    status: jest.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: jest.fn((payload: unknown) => {
      response.payload = payload;
      return response;
    }),
  };

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
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.payload).toEqual({
      success: false,
      error: "Method not allowed.",
    });
  });

  it("should build the successful market data payload from the configured recipient", () => {
    const payload = buildMarketDataPayload("GTESTRECIPIENT");

    expect(payload).toEqual(
      expect.objectContaining({
        success: true,
        asset: "USDC",
        price: "1.00",
        chain: "stellar:testnet",
        recipient: "GTESTRECIPIENT",
      })
    );
    expect(new Date(payload.timestamp).toString()).not.toBe("Invalid Date");
  });

  it("should expose a specific payload for missing payment recipient configuration", () => {
    expect(marketDataConfigError()).toEqual({
      success: false,
      error: "Server configuration error: PAYMENT_RECIPIENT_ADDRESS is not defined in the environment.",
    });
  });
});
