import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../pages/index";

const mockFetch = jest.fn();

async function advanceQueryTimers() {
  for (let index = 0; index < 12; index += 1) {
    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });
  }
}

describe("Stellar x402 Gateway Dashboard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch.mockResolvedValue({ ok: false, status: 402 });
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders the redesigned control surface", () => {
    render(<Home />);

    expect(screen.getByText("Stellar x402 Gateway")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /pay-per-request access without the dashboard theater/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /trigger gated query/i })).toBeInTheDocument();
    expect(screen.getByText("Data Registry locked")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /x402 handshake progress/i })).toBeInTheDocument();
  });

  it("blocks a query when the wallet is disconnected", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /GBMXRW/i }));
    fireEvent.click(screen.getByRole("button", { name: /trigger gated query/i }));

    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
    expect(screen.getByText("Wallet disconnected")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Connect your wallet before running a gated query."
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("unlocks the selected premium resource after the simulated x402 flow", async () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText("Premium resource"), {
      target: { value: "telemetry_node_alpha" },
    });
    fireEvent.click(screen.getByRole("button", { name: /trigger gated query/i }));

    expect(screen.getByText("Executing x402 settlement")).toBeInTheDocument();

    await advanceQueryTimers();

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/market-data",
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );
    await waitFor(() => {
      expect(screen.getByText("Unlocked Premium Report")).toBeInTheDocument();
    });
    expect(screen.getByText("ipfs://QmNodeAlphaDiagnostics11235")).toBeInTheDocument();
    expect(
      screen.getByText("Node Alpha Diagnostics unlocked from the DataRegistry contract.")
    ).toBeInTheDocument();
  });

  it("shows the failure state without unlocking registry data", async () => {
    render(<Home />);

    fireEvent.click(screen.getByLabelText("Simulate payment failure"));
    fireEvent.click(screen.getByRole("button", { name: /trigger gated query/i }));

    await advanceQueryTimers();

    await waitFor(() => {
      expect(screen.getByText("Payment failed. Add testnet USDC or disable failure mode.")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Failed").length).toBeGreaterThan(0);
    expect(screen.queryByText("Unlocked Premium Report")).not.toBeInTheDocument();
  });

  it("clears unlocked data and telemetry when reset is clicked", async () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /trigger gated query/i }));
    await advanceQueryTimers();
    await waitFor(() => {
      expect(screen.getByText("Unlocked Premium Report")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(screen.getByText("Data Registry locked")).toBeInTheDocument();
    expect(screen.getByText("No telemetry recorded.")).toBeInTheDocument();
  });
});
