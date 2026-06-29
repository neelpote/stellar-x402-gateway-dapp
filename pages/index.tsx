import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  Activity, 
  Terminal as TerminalIcon, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Play, 
  ArrowRight,
  TrendingUp
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
  const [selectedReport, setSelectedReport] = useState("premium_report_2026");
  const [isLoading, setIsLoading] = useState(false);
  const [premiumData, setPremiumData] = useState<any>(null);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Initialize with initial telemetry logs
  useEffect(() => {
    addLog("info", "System initialized. x402 resource server online.");
    addLog("info", "Stellar testnet listener registered at channels.openzeppelin.com.");
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
    }, 4500);
  };

  const handleQuery = async () => {
    if (!walletConnected) {
      triggerToast("error", "Connect your wallet to authorize.");
      return;
    }

    setIsLoading(true);
    setPremiumData(null);
    addLog("info", "Initiated Premium Resource Retrieval: GET /api/market-data");

    // Phase 1: Bounce
    await new Promise((resolve) => setTimeout(resolve, 600));
    addLog("warn", "HTTP 402 Gating Triggered: Client challenged for payment proof.");

    // Phase 2: Requirements
    await new Promise((resolve) => setTimeout(resolve, 500));
    addLog("info", "Parsed requirement: 0.01 USDC exact on stellar:testnet -> GAAJFP5Q...PI");

    // Phase 3: Sign/Verify
    await new Promise((resolve) => setTimeout(resolve, 700));
    addLog("info", "Requesting signature on USDC transfer transaction...");

    if (simulateFailure) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      addLog("error", "Transaction submission aborted: Insufficient USDC testnet balance.");
      triggerToast("error", "Payment failed: Insufficient USDC balance.");
      setIsLoading(false);
      return;
    }

    // Success path
    await new Promise((resolve) => setTimeout(resolve, 900));
    addLog("success", "Transaction signed. Hash: 5b45bfe2c55448e16b65a108aa49232d25190a5c9dc72ac5952b423b5154d8c7");
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    addLog("info", "Retrying resource fetch with on-chain settlement headers...");

    await new Promise((resolve) => setTimeout(resolve, 700));
    
    let ipfsHash = "ipfs://QmXoypizjW3WknFixtnd";
    if (selectedReport === "telemetry_node_alpha") {
      ipfsHash = "ipfs://QmNodeAlphaDiagnostics11235";
    } else if (selectedReport === "stellar_m2m_insights") {
      ipfsHash = "ipfs://QmStellarM2MEconomy2026";
    }

    const mockData = {
      success: true,
      timestamp: new Date().toISOString(),
      ipfs: ipfsHash,
      data: {
        asset: "USDC",
        price: "1.00",
        volume_24h: "54,201,948",
        change_24h: "+0.02%",
        recipient: "GAAJFP5Q4U76HQXINWVS7STDQP75VLJIRDLY2MAOQ5A3BZ73QZ6NR7PI"
      }
    };
    
    setPremiumData(mockData);
    addLog("success", "HTTP 200 OK: DataRegistry cross-contract lookup successful.");
    triggerToast("success", "Handshake completed! Premium registry unlocked.");
    setIsLoading(false);
  };

  const toggleWallet = () => {
    setWalletConnected(!walletConnected);
    addLog("info", walletConnected ? "Wallet disconnected." : `Wallet connected: ${walletAddress}`);
    triggerToast("info", walletConnected ? "Wallet disconnected" : "Wallet connected successfully");
  };

  return (
    <div className="min-h-screen bg-[#F3F0EE] text-[#141413] flex flex-col items-center px-4 md:px-8 pt-24 font-sans selection:bg-[#CF4500] selection:text-white pb-36 relative overflow-hidden">
      
      {/* Background Graphic Watermark */}
      <div className="absolute -top-24 -left-36 text-[180px] font-bold text-[#E8E2DA] select-none pointer-events-none tracking-tighter opacity-70 z-0">
        MC / x402
      </div>

      {/* Interactive Toast */}
      {toast && (
        <div 
          role="alert"
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-mcButton shadow-cardShadow border transition-all ${
            toast.type === "success" 
              ? "bg-[#FCFBFA] border-emerald-500 text-emerald-900"
              : toast.type === "error"
              ? "bg-[#FCFBFA] border-[#CF4500] text-[#CF4500]"
              : "bg-[#FCFBFA] border-slate-300 text-slate-900"
          }`}
        >
          {toast.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-600" />}
          {toast.type === "error" && <XCircle className="h-5 w-5 text-[#CF4500]" />}
          {toast.type === "info" && <Activity className="h-5 w-5 text-blue-600" />}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      {/* Floating Navigation Pill */}
      <nav className="fixed top-6 left-4 right-4 max-w-5xl mx-auto bg-white/95 backdrop-blur-md h-16 rounded-pill shadow-navShadow border border-slate-100 flex justify-between items-center px-6 z-40">
        <div className="flex items-center gap-2">
          {/* Mock MasterCard Circles */}
          <div className="flex -space-x-2">
            <div className="w-5 h-5 rounded-full bg-[#EB001B]" />
            <div className="w-5 h-5 rounded-full bg-[#F79E1B] opacity-85" />
          </div>
          <span className="text-sm font-bold tracking-tight text-[#141413] ml-1">x402 Gateway</span>
        </div>

        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
          <a href="#dashboard" className="hover:text-black transition-colors">Overview</a>
          <a href="#registry" className="hover:text-black transition-colors">Registry</a>
          <a href="#telemetry" className="hover:text-black transition-colors">Telemetry</a>
        </div>

        <button
          onClick={toggleWallet}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-mcButton text-xs font-semibold tracking-tight transition-all border ${
            walletConnected 
              ? "bg-[#141413] border-[#141413] text-[#F3F0EE] hover:bg-black" 
              : "bg-white border-[#141413] text-[#141413] hover:bg-slate-50"
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          {walletConnected 
            ? `${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}`
            : "Connect Wallet"
          }
        </button>
      </nav>

      {/* Main Container */}
      <main className="w-full max-w-5xl z-10">
        
        {/* Editorial Section Header */}
        <section className="mt-12 mb-16 text-left max-w-2xl">
          <div className="flex items-center gap-1.5 text-[#CF4500] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CF4500]" />
            <span className="text-xs font-bold tracking-widest uppercase">• Stellar Network</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-medium text-[#141413] leading-tight tracking-tight mb-4">
            A frictionless pay-per-request gateway on Stellar.
          </h1>
          <p className="text-slate-600 text-base leading-relaxed font-normal max-w-lg">
            Interact with on-chain Soroban registry records securely. Payment gates are executed under strict x402 semantic protocols with automatic USDC settlements.
          </p>
        </section>

        {/* Dashboard Grid (Mastercard Editorial Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Operations Center (7 Columns) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Controller Card - Putty Raised Box (stadium corner radius 40px) */}
            <div className="bg-[#FCFBFA] rounded-stadium p-8 shadow-cardShadow border border-slate-100 relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-[#141413]">API Query Controller</h2>
                  <p className="text-xs text-slate-500 mt-1">Select query index targets and execution modes.</p>
                </div>
                <div className="text-xs bg-[#F4F4F4] text-slate-600 px-3 py-1 rounded-pill font-mono border border-slate-200">
                  stellar:testnet
                </div>
              </div>

              {/* Grid Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="report-select" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Premium Resource</label>
                  <select
                    id="report-select"
                    value={selectedReport}
                    onChange={(e) => {
                      setSelectedReport(e.target.value);
                      addLog("info", `Target resource changed: ${e.target.value}`);
                    }}
                    className="bg-white border border-slate-200 rounded-mcButton px-4 py-2.5 text-sm text-[#141413] focus:outline-none focus:border-[#141413] transition-colors w-full cursor-pointer shadow-sm"
                  >
                    <option value="premium_report_2026">USDC Liquidity Analysis (2026)</option>
                    <option value="telemetry_node_alpha">Node Alpha Diagnostics</option>
                    <option value="stellar_m2m_insights">M2M Economy Insights</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5 justify-end">
                  <div className="flex items-center gap-2 bg-[#F4F4F4] px-4 py-3 rounded-mcButton border border-slate-200 shadow-sm">
                    <input 
                      type="checkbox" 
                      id="simulate-failure" 
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="rounded border-slate-300 text-[#CF4500] focus:ring-[#CF4500]/40 bg-white h-4 w-4"
                    />
                    <label htmlFor="simulate-failure" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      Simulate Payment Failure
                    </label>
                  </div>
                </div>
              </div>

              {/* Execution Trigger Pill Button */}
              <button
                onClick={handleQuery}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-pill font-semibold text-sm tracking-tight transition-all shadow-md ${
                  isLoading 
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-[#141413] text-[#F3F0EE] hover:bg-black active:scale-[0.98]"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Executing x402 Settlement Handshake...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    Trigger Gated Query (0.01 USDC)
                  </>
                )}
              </button>
            </div>

            {/* Premium Data Box */}
            <div className="bg-[#FCFBFA] rounded-stadium p-8 shadow-cardShadow border border-slate-100 min-h-[220px] flex flex-col justify-center">
              {!premiumData && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-stadium">
                  <div className="bg-slate-100 p-3 rounded-full mb-3">
                    <XCircle className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Data Registry Locked</p>
                  <p className="text-xs text-slate-500 mt-1">Payment authorization is required to pull the IPFS register hash.</p>
                </div>
              )}

              {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 text-[#141413] animate-spin mb-3" />
                  <p className="text-sm text-slate-600">Invoking AccessController cross-contract verify...</p>
                </div>
              )}

              {premiumData && !isLoading && (
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-700 tracking-wider uppercase">Unlocked Premium Report</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{premiumData.timestamp.substring(11, 19)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unlocked IPFS Register Hash</div>
                    <div className="bg-[#F4F4F4] px-4 py-3 rounded-mcButton border border-slate-200 font-mono text-xs text-[#CF4500] overflow-x-auto">
                      {premiumData.ipfs}
                    </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="bg-[#F4F4F4] p-3.5 rounded-mcButton border border-slate-200">
                      <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Asset</div>
                      <div className="text-sm font-bold text-[#141413] mt-1">{premiumData.data.asset}</div>
                    </div>
                    <div className="bg-[#F4F4F4] p-3.5 rounded-mcButton border border-slate-200">
                      <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Index Value</div>
                      <div className="text-sm font-bold text-emerald-600 mt-1">${premiumData.data.price}</div>
                    </div>
                    <div className="bg-[#F4F4F4] p-3.5 rounded-mcButton border border-slate-200">
                      <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">24h Volume</div>
                      <div className="text-sm font-bold text-[#141413] mt-1">${premiumData.data.volume_24h}</div>
                    </div>
                    <div className="bg-[#F4F4F4] p-3.5 rounded-mcButton border border-slate-200 flex flex-col justify-between">
                      <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">24h Change</div>
                      <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm mt-1">
                        <TrendingUp className="h-3 w-3" />
                        {premiumData.data.change_24h}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right: Telemetry logs (5 Columns) */}
          <div className="lg:col-span-5">
            <div className="bg-[#FCFBFA] rounded-stadium p-6 shadow-cardShadow border border-slate-100 h-[526px] flex flex-col">
              <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-[#141413]">
                <TerminalIcon className="h-4 w-4 text-[#CF4500]" />
                Handshake Telemetry & Logs
              </h2>

              <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                    <p>No telemetry recorded.</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-mcButton border leading-relaxed ${
                        log.type === "success"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                          : log.type === "error"
                          ? "bg-[#CF4500]/5 border-[#CF4500]/10 text-[#CF4500]"
                          : log.type === "warn"
                          ? "bg-amber-50 border-amber-100 text-amber-800"
                          : "bg-[#F4F4F4] border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                        <span className="font-bold">{log.type.toUpperCase()}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <div>{log.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Decorative MasterCard Trace Circles - Signature Element */}
      <div className="mt-28 flex flex-col items-center justify-center gap-4 text-center">
        {/* Orbital Arc Connection */}
        <div className="relative w-48 h-20 flex justify-center items-center">
          <svg className="absolute w-full h-full text-[#F37338]" fill="none" viewBox="0 0 200 100">
            <path d="M 10,80 Q 100,0 190,80" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          <div className="absolute left-6 bottom-1 w-12 h-12 rounded-full bg-[#FCFBFA] border border-slate-200 flex items-center justify-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#EB001B] opacity-80" />
          </div>
          <div className="absolute right-6 bottom-1 w-12 h-12 rounded-full bg-[#FCFBFA] border border-slate-200 flex items-center justify-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#F79E1B] opacity-80" />
          </div>
          {/* Satellite Button */}
          <div className="absolute -bottom-2 right-2 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-md cursor-pointer hover:bg-slate-50 transition-colors">
            <ArrowRight className="h-3.5 w-3.5 text-[#141413]" />
          </div>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priceless Trajectory</span>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">Connecting Soroban smart registries through verified trust networks.</p>
        </div>
      </div>

      {/* Dark Footer */}
      <footer className="absolute bottom-0 left-0 right-0 bg-[#141413] text-[#F3F0EE] py-12 px-6 border-t border-slate-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-85" />
            </div>
            <span className="font-semibold">Stellar x402 Gateway</span>
          </div>
          <div className="flex gap-6 text-slate-400">
            <span>Passphrase: Testnet</span>
            <span>USDC Issuer: GBBD47IF...</span>
            <span>Facilitator: OpenZeppelin</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
