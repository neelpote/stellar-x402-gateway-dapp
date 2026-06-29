import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  Activity, 
  Terminal as TerminalIcon, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Play, 
  RefreshCw 
} from "lucide-react";

interface TelemetryLog {
  id: string;
  timestamp: string;
  type: "info" | "success" | "error" | "warn";
  message: string;
}

interface ToastMessage {
  type: "success" | "error" | "info";
  text: string;
}

export default function Home() {
  // Mock states
  const [walletConnected, setWalletConnected] = useState(true);
  const [walletAddress] = useState("GBMXRWVHM4JA3VPIB7BT25WMEKJQX4OXCWT5BZZGQWKLACUFKETZZ6CF");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [premiumData, setPremiumData] = useState<any>(null);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Initialize with initial telemetry logs
  useEffect(() => {
    addLog("info", "System initialized. x402 resource server ready.");
    addLog("info", "Stellar testnet listener online. Listening on channels.openzeppelin.com.");
  }, []);

  const addLog = (type: "info" | "success" | "error" | "warn", message: string) => {
    const newLog: TelemetryLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const triggerToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleQuery = async () => {
    if (!walletConnected) {
      triggerToast("error", "Please connect your wallet first.");
      return;
    }

    setIsLoading(true);
    setPremiumData(null);
    addLog("info", "Initiated Premium Query: GET /api/market-data");

    // Phase 1 of Handshake: Hit route, expect challenge
    await new Promise((resolve) => setTimeout(resolve, 800));
    addLog("warn", "HTTP 402 Payment Required: Server returned handshake challenge.");

    // Phase 2: Parse requirements
    await new Promise((resolve) => setTimeout(resolve, 600));
    addLog("info", "Challenge parsed: Scheme=exact, Price=0.01 USDC, Network=stellar:testnet");

    // Phase 3: Wallet transaction signing
    await new Promise((resolve) => setTimeout(resolve, 800));
    addLog("info", "Requesting signature for payment transaction...");

    if (simulateFailure) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      addLog("error", "Transaction rejected on-chain: Insufficient USDC testnet funds.");
      triggerToast("error", "Payment failed: Insufficient USDC funds.");
      setIsLoading(false);
      return;
    }

    // Success path
    await new Promise((resolve) => setTimeout(resolve, 1000));
    addLog("success", "Transaction signed and submitted. Hash: 5b45bfe2c55448e16b65a108aa49232d25190a5c9dc72ac5952b423b5154d8c7");
    
    await new Promise((resolve) => setTimeout(resolve, 600));
    addLog("info", "Retrying GET /api/market-data with transaction proof header...");

    await new Promise((resolve) => setTimeout(resolve, 800));
    const mockData = {
      success: true,
      timestamp: new Date().toISOString(),
      ipfs: "ipfs://QmXoypizjW3WknFixtnd",
      data: {
        asset: "USDC",
        price: "1.00",
        volume_24h: "54,201,948",
        change_24h: "+0.02%",
        recipient: "GAAJFP5Q4U76HQXINWVS7STDQP75VLJIRDLY2MAOQ5A3BZ73QZ6NR7PI"
      }
    };
    
    setPremiumData(mockData);
    addLog("success", "HTTP 200 OK: Data unlocked. Access granted.");
    triggerToast("success", "Handshake completed! Premium data unlocked.");
    setIsLoading(false);
  };

  const toggleWallet = () => {
    setWalletConnected(!walletConnected);
    addLog("info", walletConnected ? "Wallet disconnected." : `Wallet connected: ${walletAddress}`);
    triggerToast("info", walletConnected ? "Wallet disconnected" : "Wallet connected successfully");
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col items-center p-4 md:p-8 font-sans selection:bg-stellarPrimary selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div 
          role="alert"
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-bounce ${
            toast.type === "success" 
              ? "bg-emerald-950 border-emerald-500 text-emerald-300"
              : toast.type === "error"
              ? "bg-rose-950 border-rose-500 text-rose-300"
              : "bg-blue-950 border-blue-500 text-blue-300"
          }`}
        >
          {toast.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-400" />}
          {toast.type === "error" && <XCircle className="h-5 w-5 text-rose-400" />}
          {toast.type === "info" && <Activity className="h-5 w-5 text-blue-400" />}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 mb-8 pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-stellarPrimary to-stellarAccent p-2.5 rounded-xl shadow-lg shadow-stellarPrimary/20">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Stellar x402 Gateway</h1>
            <p className="text-xs text-slate-400">Enterprise Pay-Per-Request Micro-transactions</p>
          </div>
        </div>

        {/* Wallet connection info */}
        <button
          onClick={toggleWallet}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
            walletConnected 
              ? "bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-200" 
              : "bg-stellarPrimary/20 hover:bg-stellarPrimary/30 border-stellarPrimary/50 text-stellarPrimary"
          }`}
        >
          <Wallet className="h-4 w-4" />
          {walletConnected 
            ? `Connected: ${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}`
            : "Connect Wallet"
          }
        </button>
      </header>

      {/* Main Grid Layout */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - Control panel & Unlocked Data (8 cols) */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* Query controller card */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-stellarPrimary/5 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-stellarPrimary" />
              API Query Controller
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Fetch premium market telemetry data. The request will automatically trigger an on-chain pay-per-call handshake of 0.01 USDC.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-6">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="simulate-failure" 
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded border-slate-700 text-stellarPrimary focus:ring-stellarPrimary/40 bg-slate-900 h-4 w-4"
                />
                <label htmlFor="simulate-failure" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Simulate Payment Failure (e.g. Insufficient Funds)
                </label>
              </div>

              <div className="text-xs text-slate-500">
                Network: <span className="text-slate-400 font-mono">stellar:testnet</span>
              </div>
            </div>

            <button
              onClick={handleQuery}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold shadow-lg transition-all ${
                isLoading 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-stellarPrimary to-stellarAccent hover:brightness-110 text-white shadow-stellarPrimary/25"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing x402 Handshake...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current" />
                  Trigger Premium Query
                </>
              )}
            </button>
          </div>

          {/* Locked/Unlocked Data Panel */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl min-h-[220px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Premium Content Box</h2>
            
            {!premiumData && !isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                <XCircle className="h-10 w-10 text-slate-700 mb-2" />
                <p className="text-sm text-slate-400">No premium content unlocked yet.</p>
                <p className="text-xs text-slate-600">Trigger a premium query to pay and unlock the data registry hash.</p>
              </div>
            )}

            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <Loader2 className="h-10 w-10 text-stellarPrimary animate-spin mb-3" />
                <p className="text-sm text-slate-400">Decrypting data payload from Stellar DataRegistry...</p>
              </div>
            )}

            {premiumData && !isLoading && (
              <div className="flex-1 bg-slate-950/80 p-5 rounded-xl border border-emerald-900/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Unlocked Premium Report</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{premiumData.timestamp}</span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-400">Data Registry IPFS Source:</div>
                  <div className="bg-slate-900 px-3 py-2 rounded border border-slate-800/80 font-mono text-sm text-stellarPrimary overflow-x-auto">
                    {premiumData.ipfs}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="bg-slate-900/50 p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase">Asset</div>
                    <div className="text-sm font-semibold">{premiumData.data.asset}</div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase">Index Price</div>
                    <div className="text-sm font-semibold text-emerald-400">${premiumData.data.price}</div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase">24h Vol</div>
                    <div className="text-sm font-semibold">${premiumData.data.volume_24h}</div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase">24h Change</div>
                    <div className="text-sm font-semibold text-emerald-500">{premiumData.data.change_24h}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Column - Events and telemetry logger (4 cols) */}
        <section className="lg:col-span-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-[526px]">
          <h2 className="text-md font-bold mb-4 flex items-center gap-2">
            <TerminalIcon className="h-4 w-4 text-stellarPrimary" />
            Telemetry & Smart Contract Logs
          </h2>

          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`p-2.5 rounded-lg border leading-relaxed ${
                  log.type === "success"
                    ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400"
                    : log.type === "error"
                    ? "bg-rose-950/20 border-rose-900/50 text-rose-400"
                    : log.type === "warn"
                    ? "bg-amber-950/20 border-amber-900/50 text-amber-400"
                    : "bg-slate-950/40 border-slate-800/80 text-slate-400"
                }`}
              >
                <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                  <span>{log.type.toUpperCase()}</span>
                  <span>{log.timestamp}</span>
                </div>
                <div>{log.message}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-slate-600 text-xs flex gap-4">
        <span>Stellar Network Passphrase: Testnet</span>
        <span>•</span>
        <span>Token: USDC (Circle Issuer)</span>
      </footer>
    </div>
  );
}
