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

import handler, { config } from "@/pages/api/market-data";

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
});
