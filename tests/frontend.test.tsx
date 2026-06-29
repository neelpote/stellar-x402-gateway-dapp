import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../pages/index";

describe("Stellar x402 Gateway Dashboard", () => {
  it("renders correctly, displaying the gateway header, query button, and status", () => {
    render(<Home />);
    
    // Assertion 1: Header title is rendered
    expect(screen.getByText("Stellar x402 Gateway")).toBeInTheDocument();
    
    // Assertion 2: Query trigger button is rendered
    expect(screen.getByRole("button", { name: /Trigger Gated Query/i })).toBeInTheDocument();
    
    // Assertion 3: Wallet connection status is shown
    expect(screen.getByRole("button", { name: /GBMXRW/i })).toBeInTheDocument();
  });

  it("toggles wallet connection state when connect/disconnect button is clicked", () => {
    render(<Home />);
    
    const toggleButton = screen.getByRole("button", { name: /GBMXRW/i });
    fireEvent.click(toggleButton);

    // Assertion 4: Button label changes to prompt wallet connection
    expect(screen.getByRole("button", { name: /Connect Wallet/i })).toBeInTheDocument();
  });

  it("handles premium query trigger and transitions through loading states", async () => {
    render(<Home />);
    
    const queryButton = screen.getByRole("button", { name: /Trigger Gated Query/i });
    fireEvent.click(queryButton);

    // Assertion 5: Loading text is visible immediately upon trigger
    expect(screen.getByText(/Executing x402 Settlement/i)).toBeInTheDocument();

    // Wait for the async simulation sequence to complete (transitions back to normal button)
    await waitFor(() => {
      expect(screen.queryByText(/Executing x402 Settlement/i)).not.toBeInTheDocument();
    }, { timeout: 6000 });

    // Assertion 6: Premium unlocked data is visible in the container
    expect(screen.getByText(/Unlocked Premium Report/i)).toBeInTheDocument();
  });
});
