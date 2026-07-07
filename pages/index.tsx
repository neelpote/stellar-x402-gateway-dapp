import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Loader2,
  Lock,
  Play,
  RefreshCcw,
  Server,
  ShieldCheck,
  Terminal as TerminalIcon,
  Unplug,
  Wallet,
  XCircle,
} from "lucide-react";

type LogType = "info" | "success" | "error" | "warn";
type QueryPhase = "idle" | "probe" | "challenge" | "settlement" | "retry" | "complete" | "failed";

interface TelemetryLog {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
}

interface ToastMessage {
  type: "success" | "error" | "info";
  text: string;
}

interface PremiumData {
  success: boolean;
  timestamp: string;
  ipfs: string;
  data: {
    asset: string;
    price: string;
    volume_24h: string;
    change_24h: string;
    recipient: string;
  };
}

const walletAddress = "GBMXRWVHM4JA3VPIB7BT25WMEKJQX4OXCWT5BZZGQWKLACUFKETZZ6CF";

const resources = {
  premium_report_2026: {
    label: "USDC Liquidity Analysis",
    description: "Live-priced stablecoin index with settlement metadata.",
    ipfs: "ipfs://QmXoypizjW3WknFixtnd",
  },
  telemetry_node_alpha: {
    label: "Node Alpha Diagnostics",
    description: "Validator response windows and facilitator health checks.",
    ipfs: "ipfs://QmNodeAlphaDiagnostics11235",
  },
  stellar_m2m_insights: {
    label: "M2M Economy Insights",
    description: "Machine-to-machine payment demand and registry volume.",
    ipfs: "ipfs://QmStellarM2MEconomy2026",
  },
} as const;

const phaseSteps: Array<{ id: QueryPhase; label: string; detail: string }> = [
  { id: "probe", label: "Probe", detail: "Request without proof" },
  { id: "challenge", label: "Challenge", detail: "Receive HTTP 402" },
  { id: "settlement", label: "Settle", detail: "Sign Stellar payment" },
  { id: "retry", label: "Retry", detail: "Attach payment proof" },
  { id: "complete", label: "Unlock", detail: "Return registry data" },
];

type ResourceId = keyof typeof resources;

const phaseCopy: Record<QueryPhase, string> = {
  idle: "Ready",
  probe: "Probing API",
  challenge: "402 challenge",
  settlement: "Signing payment",
  retry: "Retrying resource",
  complete: "Unlocked",
  failed: "Failed",
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const probeTimeoutMs = 3500;

const createLogId = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 9);

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(true);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ResourceId>("premium_report_2026");
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<QueryPhase>("idle");
  const [premiumData, setPremiumData] = useState<PremiumData | null>(null);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const selectedResource = resources[selectedReport];

  const shortWallet = useMemo(
    () => `${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}`,
    []
  );

  const phaseIndex = useMemo(
    () => phaseSteps.findIndex((step) => step.id === phase),
    [phase]
  );

  const addLog = (type: LogType, message: string) => {
    const newLog: TelemetryLog = {
      id: createLogId(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      type,
      message,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 24));
  };

  const triggerToast = (type: ToastMessage["type"], text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  };

  useEffect(() => {
    addLog("info", "Resource server online at /api/market-data.");
    addLog("info", "OpenZeppelin facilitator channel configured for stellar:testnet.");
  }, []);

  const probeProtectedResource = async () => {
    setPhase("probe");
    addLog("info", "GET /api/market-data without payment proof.");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), probeTimeoutMs);

    try {
      const response = await fetch("/api/market-data", {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (response.status === 402) {
        setPhase("challenge");
        addLog("warn", "HTTP 402 received. Payment requirement challenge is active.");
        return;
      }

      if (response.ok) {
        addLog("success", "API returned 200. Existing payment proof was accepted.");
        return;
      }

      addLog("warn", `API responded with HTTP ${response.status}; continuing demo settlement.`);
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? `Probe timed out after ${probeTimeoutMs / 1000}s`
          : error instanceof Error
            ? error.message
            : "Unknown network error";
      addLog("warn", `API probe could not complete: ${message}`);
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const handleQuery = async () => {
    if (!walletConnected) {
      triggerToast("error", "Connect your wallet before running a gated query.");
      addLog("error", "Query blocked because no wallet is connected.");
      return;
    }

    setIsLoading(true);
    setPremiumData(null);

    await probeProtectedResource();
    await wait(500);

    setPhase("settlement");
    addLog("info", "Preparing 0.01 USDC exact payment on stellar:testnet.");
    await wait(600);
    addLog("info", "Requesting wallet signature for settlement transaction.");
    await wait(700);

    if (simulateFailure) {
      setPhase("failed");
      addLog("error", "Transaction rejected: simulated insufficient USDC testnet balance.");
      triggerToast("error", "Payment failed. Add testnet USDC or disable failure mode.");
      setIsLoading(false);
      return;
    }

    addLog(
      "success",
      "Transaction signed. Hash 5b45bfe2c55448e16b65a108aa49232d25190a5c9dc72ac5952b423b5154d8c7."
    );
    await wait(650);

    setPhase("retry");
    addLog("info", "Retrying resource fetch with settlement proof headers.");
    await wait(700);

    const mockData: PremiumData = {
      success: true,
      timestamp: new Date().toISOString(),
      ipfs: selectedResource.ipfs,
      data: {
        asset: "USDC",
        price: "1.00",
        volume_24h: "54,201,948",
        change_24h: "+0.02%",
        recipient: "GAAJFP5Q4U76HQXINWVS7STDQP75VLJIRDLY2MAOQ5A3BZ73QZ6NR7PI",
      },
    };

    setPremiumData(mockData);
    setPhase("complete");
    addLog("success", `${selectedResource.label} unlocked from the DataRegistry contract.`);
    triggerToast("success", "Premium registry unlocked.");
    setIsLoading(false);
  };

  const toggleWallet = () => {
    setWalletConnected((current) => {
      const nextValue = !current;
      addLog("info", nextValue ? `Wallet connected: ${shortWallet}` : "Wallet disconnected.");
      triggerToast("info", nextValue ? "Wallet connected" : "Wallet disconnected");
      return nextValue;
    });
  };

  const resetSession = () => {
    setPremiumData(null);
    setPhase("idle");
    setLogs([]);
    triggerToast("info", "Session cleared");
  };

  return (
    <div className="min-h-screen bg-[#ECE9E2] text-[#151515] font-sans selection:bg-[#CF4500] selection:text-white">
      <Head>
        <title>Stellar x402 Gateway</title>
        <meta
          name="description"
          content="A Stellar testnet control room for x402 pay-per-request resource access."
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23151515'/%3E%3Ccircle cx='26' cy='32' r='15' fill='%23EB001B'/%3E%3Ccircle cx='38' cy='32' r='15' fill='%23F79E1B' fill-opacity='.9'/%3E%3C/svg%3E"
        />
      </Head>

      {toast && (
        <div
          role="alert"
          className={`fixed right-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-[8px] border px-4 py-3 shadow-[0_16px_40px_rgba(20,20,19,0.14)] md:right-8 md:top-8 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-slate-200 bg-white text-slate-900"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
          {toast.type === "error" && <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
          {toast.type === "info" && <Activity className="h-5 w-5 shrink-0 text-[#3860BE]" />}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[#D9D2C7] bg-[#ECE9E2]/95 backdrop-blur">
        <nav className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <a
            href="#dashboard"
            className="flex min-w-0 items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4500]"
          >
            <span className="flex -space-x-2" aria-hidden="true">
              <span className="h-6 w-6 rounded-full bg-[#EB001B]" />
              <span className="h-6 w-6 rounded-full bg-[#F79E1B]/90" />
            </span>
            <span className="truncate text-sm font-bold tracking-normal">Stellar x402 Gateway</span>
          </a>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#controller" className="transition-colors hover:text-[#151515]">
              Controller
            </a>
            <a href="#registry" className="transition-colors hover:text-[#151515]">
              Registry
            </a>
            <a href="#telemetry" className="transition-colors hover:text-[#151515]">
              Telemetry
            </a>
          </div>

          <button
            onClick={toggleWallet}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4500] ${
              walletConnected
                ? "border-[#151515] bg-[#151515] text-[#F7F3EA] hover:bg-black"
                : "border-[#151515] bg-white text-[#151515] hover:bg-[#F7F3EA]"
            }`}
          >
            <Wallet className="h-4 w-4" />
            {walletConnected ? shortWallet : "Connect wallet"}
          </button>
        </nav>
      </header>

      <main id="dashboard" className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 md:px-6 md:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D9D2C7] bg-[#F7F3EA] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#8B3D19]">
              <span className="h-2 w-2 rounded-full bg-[#CF4500]" />
              Stellar testnet
            </div>
            <h1 className="text-4xl font-semibold leading-[1.03] tracking-normal text-[#151515] md:text-6xl">
              Pay-per-request access without the dashboard theater.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Run an x402 resource probe, watch the 402 challenge, simulate settlement, and inspect the registry payload from one tight control room.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-[8px] border border-[#D9D2C7] bg-[#F7F3EA] p-3 shadow-[0_18px_50px_rgba(20,20,19,0.08)]">
            <Metric icon={Server} label="API route" value="/market-data" />
            <Metric icon={CircleDollarSign} label="Price" value="0.01 USDC" />
            <Metric icon={ShieldCheck} label="Phase" value={phaseCopy[phase]} tone={phase} />
          </div>
        </section>

        <PhaseRail phase={phase} phaseIndex={phaseIndex} />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.9fr)]">
          <div className="grid gap-6">
            <section
              id="controller"
              className="rounded-[8px] border border-[#D9D2C7] bg-[#FBFAF6] p-5 shadow-[0_18px_50px_rgba(20,20,19,0.08)] md:p-6"
            >
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-normal">Query controller</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Choose a protected resource and run the same path a client agent would negotiate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetSession}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#D9D2C7] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#151515] hover:text-[#151515] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4500]"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Premium resource</span>
                  <select
                    aria-label="Premium resource"
                    value={selectedReport}
                    onChange={(event) => {
                      const nextReport = event.target.value as ResourceId;
                      setSelectedReport(nextReport);
                      addLog("info", `Target resource changed to ${resources[nextReport].label}.`);
                    }}
                    className="min-h-12 w-full rounded-[8px] border border-[#D9D2C7] bg-white px-4 text-sm font-semibold text-[#151515] outline-none transition focus:border-[#151515] focus:ring-2 focus:ring-[#CF4500]/20"
                  >
                    {Object.entries(resources).map(([id, resource]) => (
                      <option key={id} value={id}>
                        {resource.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm leading-6 text-slate-600">{selectedResource.description}</span>
                </label>

                <label className="flex min-h-12 items-center gap-3 self-start rounded-[8px] border border-[#D9D2C7] bg-[#F1EEE7] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(event) => setSimulateFailure(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-[#CF4500]"
                  />
                  <span className="text-sm font-semibold text-slate-700">Simulate payment failure</span>
                </label>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <button
                  onClick={handleQuery}
                  disabled={isLoading}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#151515] px-6 text-sm font-bold text-[#F7F3EA] transition hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4500] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Executing x402 settlement
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Trigger gated query
                    </>
                  )}
                </button>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                  {walletConnected ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Unplug className="h-4 w-4 text-red-600" />
                  )}
                  {walletConnected ? "Wallet ready" : "Wallet disconnected"}
                </div>
              </div>
            </section>

            <section
              id="registry"
              className="rounded-[8px] border border-[#D9D2C7] bg-[#151515] p-5 text-[#F7F3EA] shadow-[0_18px_50px_rgba(20,20,19,0.12)] md:p-6"
            >
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-normal">Registry result</h2>
                  <p className="mt-1 text-sm leading-6 text-white/60">Unlocked payload, IPFS pointer, and market fields.</p>
                </div>
                <Database className="h-5 w-5 text-[#F79E1B]" />
              </div>

              {!premiumData && !isLoading && (
                <div className="grid min-h-[220px] place-items-center rounded-[8px] border border-dashed border-white/18 bg-white/[0.03] p-6 text-center">
                  <div>
                    <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-white/8">
                      <Lock className="h-6 w-6 text-white/50" />
                    </div>
                    <p className="font-semibold">Data Registry locked</p>
                    <p className="mt-2 max-w-md text-sm leading-6 text-white/55">
                      Run a gated query to complete the 402 payment sequence and unlock the selected record.
                    </p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="grid min-h-[220px] place-items-center rounded-[8px] border border-white/10 bg-white/[0.03] p-6 text-center">
                  <div>
                    <Loader2 className="mx-auto mb-4 h-9 w-9 animate-spin text-[#F79E1B]" />
                    <p className="font-semibold">{phaseCopy[phase]}</p>
                    <p className="mt-2 text-sm leading-6 text-white/55">Coordinating facilitator verification and registry retry.</p>
                  </div>
                </div>
              )}

              {premiumData && !isLoading && (
                <div className="grid gap-5">
                  <div className="rounded-[8px] border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Unlocked Premium Report
                      </span>
                      <span className="font-mono text-xs text-white/50">{premiumData.timestamp.substring(11, 19)}</span>
                    </div>
                    <p className="break-all font-mono text-sm text-[#F79E1B]">{premiumData.ipfs}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <ResultStat label="Asset" value={premiumData.data.asset} />
                    <ResultStat label="Index value" value={`$${premiumData.data.price}`} accent />
                    <ResultStat label="24h volume" value={`$${premiumData.data.volume_24h}`} />
                    <ResultStat label="24h change" value={premiumData.data.change_24h} accent />
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside
            id="telemetry"
            className="rounded-[8px] border border-[#D9D2C7] bg-[#FBFAF6] p-5 shadow-[0_18px_50px_rgba(20,20,19,0.08)] md:p-6 lg:sticky lg:top-24"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold tracking-normal">
                  <TerminalIcon className="h-5 w-5 text-[#CF4500]" />
                  Telemetry
                </h2>
                <p className="mt-1 text-sm text-slate-600">Latest handshake events first.</p>
              </div>
              <span className="rounded-full border border-[#D9D2C7] bg-white px-3 py-1 font-mono text-xs text-slate-500">
                {logs.length} logs
              </span>
            </div>

            <div className="max-h-[580px] space-y-3 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="grid min-h-[260px] place-items-center rounded-[8px] border border-dashed border-[#D9D2C7] text-center text-sm text-slate-500">
                  No telemetry recorded.
                </div>
              ) : (
                logs.map((log) => <LogLine key={log.id} log={log} />)
              )}
            </div>
          </aside>
        </section>

        <section className="grid gap-4 rounded-[8px] border border-[#D9D2C7] bg-[#F7F3EA] p-5 md:grid-cols-3 md:p-6">
          <Step title="1. Probe" text="The client asks for /api/market-data without payment proof." />
          <Step title="2. Settle" text="The x402 challenge defines the exact Stellar testnet USDC payment." />
          <Step title="3. Unlock" text="The client retries with proof and receives the registry payload." />
        </section>
      </main>

      <footer className="border-t border-[#2C2A27] bg-[#151515] px-4 py-8 text-[#F7F3EA] md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4 text-[#F79E1B]" />
            x402 Stellar testnet console
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/55">
            <span>Passphrase: Testnet</span>
            <span>USDC issuer: GBBD47IF...</span>
            <span>Facilitator: OpenZeppelin</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PhaseRail({ phase, phaseIndex }: { phase: QueryPhase; phaseIndex: number }) {
  return (
    <section
      aria-label="x402 handshake progress"
      className="grid gap-3 rounded-[8px] border border-[#D9D2C7] bg-[#FBFAF6] p-3 shadow-[0_18px_50px_rgba(20,20,19,0.06)] md:grid-cols-5"
    >
      {phaseSteps.map((step, index) => {
        const isComplete = phase === "complete" || (phaseIndex > -1 && index < phaseIndex);
        const isCurrent = step.id === phase;
        const isFailed = phase === "failed" && index === 2;

        return (
          <div
            key={step.id}
            className={`rounded-[8px] border p-3 ${
              isCurrent || isFailed
                ? "border-[#CF4500] bg-[#FFF5EE]"
                : isComplete
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-[#E5DED2] bg-white"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{step.label}</span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isFailed ? "bg-red-500" : isCurrent ? "bg-[#CF4500]" : isComplete ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
            </div>
            <p className="text-sm font-semibold text-[#151515]">{step.detail}</p>
          </div>
        );
      })}
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: QueryPhase;
}) {
  const toneClass =
    tone === "complete"
      ? "text-emerald-700"
      : tone === "failed"
        ? "text-red-700"
        : tone && tone !== "idle"
          ? "text-[#8B3D19]"
          : "text-[#151515]";

  return (
    <div className="min-w-0 rounded-[8px] border border-[#D9D2C7] bg-white p-3">
      <Icon className="mb-3 h-4 w-4 text-[#CF4500]" />
      <div className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={`mt-1 truncate text-sm font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

function ResultStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className={`mt-2 text-sm font-bold ${accent ? "text-emerald-300" : "text-[#F7F3EA]"}`}>{value}</div>
    </div>
  );
}

function LogLine({ log }: { log: TelemetryLog }) {
  const styles: Record<LogType, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-red-200 bg-red-50 text-red-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    info: "border-[#D9D2C7] bg-white text-slate-700",
  };

  const icons: Record<LogType, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    error: <XCircle className="h-4 w-4 text-red-600" />,
    warn: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    info: <Activity className="h-4 w-4 text-[#3860BE]" />,
  };

  return (
    <div className={`rounded-[8px] border p-3 ${styles[log.type]}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
          {icons[log.type]}
          {log.type}
        </span>
        <span className="font-mono text-[11px] opacity-60">{log.timestamp}</span>
      </div>
      <p className="text-sm leading-6">{log.message}</p>
    </div>
  );
}

function Step({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#151515] text-[#F7F3EA]">
        <ArrowRight className="h-4 w-4" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </div>
  );
}
