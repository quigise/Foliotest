import { useState, useEffect, useMemo, useCallback } from "react";
import { C, PRESETS, PERIODS, PF_COLORS, INITIAL_VALUE, ROUTES } from "./lib/tokens";
import { encodeState, decodeState } from "./lib/api";
import { useBacktest } from "./hooks/useBacktest";

import { TopBar, SideNav } from "./components/chrome";
import { ErrorBoundary } from "./components/primitives";
import { ExportModal, ShareModal, RunningScreen } from "./components/Modals";

import { Onboarding } from "./screens/Onboarding";
import { Builder }    from "./screens/Builder";
import { Results }    from "./screens/Results";
import { Compare }    from "./screens/Compare";
import { Correlation }from "./screens/Correlation";

// ─── Global CSS ──────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  :root { --tf-font-sans: 'Inter', system-ui, -apple-system, sans-serif; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { background: #fff; min-height: 100vh; }
  body { font-family: var(--tf-font-sans); color: ${C.text}; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 999px; }
  ::-webkit-scrollbar-thumb:hover { background: ${C.borderMd}; }
  input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  button { font-family: var(--tf-font-sans); }
  table { border-collapse: collapse; }
  @keyframes tf-spin    { to { transform: rotate(360deg); } }
  @keyframes tf-fadein  { from { opacity:0; } to { opacity:1; } }
  @keyframes tf-modalin { from { opacity:0; transform:translateY(8px) scale(0.98); } to { opacity:1; transform:none; } }
  @keyframes tf-fadeup  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  .anim-fadeup { animation: tf-fadeup 0.35s ease both; }
`;

// ─── Default portfolio factory ───────────────────────────────────────────────
const mkPf = (preset, idx = 0) => ({
  id:           Date.now() + idx,
  name:         preset?.name || `Portfolio ${idx + 1}`,
  rebalance:    preset?.rebalance || "Quarterly",
  contribution: 0,
  holdings:     preset?.holdings || [{ sym:"VTI", weight:60 }, { sym:"BND", weight:40 }],
});

export default function App() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const initState = useMemo(() => {
    try {
      const h = window.location.hash.slice(1);
      if (h) { const s = decodeState(h); if (s) return s; }
    } catch {}
    return null;
  }, []);

  const [route, setRoute]             = useState(() => initState?.route || localStorage.getItem("ft:route") || "onboarding");
  const [portfolios, setPortfolios]   = useState(initState?.portfolios || [mkPf(PRESETS[0])]);
  const [period, setPeriod]           = useState(initState?.period || "10Y");
  const [benchmark, setBenchmark]     = useState(initState?.benchmark || "SPY");
  const [exportOpen, setExportOpen]   = useState(false);
  const [shareOpen, setShareOpen]     = useState(false);
  const [running, setRunning]         = useState(false);
  const [corrPfIdx, setCorrPfIdx]     = useState(0);
  const [activePfIdx, setActivePfIdx] = useState(0);
  const [toast, setToast]             = useState(null);

  // Persist route
  useEffect(() => { localStorage.setItem("ft:route", route); }, [route]);

  // Sync URL + title
  useEffect(() => {
    const hash = encodeState({ route, portfolios, period, benchmark });
    window.history.replaceState(null, "", `#${hash}`);
    document.title = portfolios.length > 0
      ? `${portfolios.map(p => p.name).join(" · ")} — Foliotest`
      : "Foliotest — Portfolio backtester";
  }, [route, portfolios, period, benchmark]);

  // Color assignment
  const pfColors = useMemo(() => portfolios.map((_, i) => PF_COLORS[i % PF_COLORS.length]), [portfolios]);
  const pfNames  = useMemo(() => portfolios.map(p => p.name), [portfolios]);

  // Backtest hook (handles all data fetching & computation)
  const backtest = useBacktest({
    portfolios, period, benchmark, pfColors,
    rollingWin: 1, corrPfIdx,
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const pickPreset = useCallback((preset) => {
    setPortfolios([mkPf(preset)]);
    setActivePfIdx(0);
    setRoute("builder");
  }, []);

  const blank = useCallback(() => {
    setPortfolios([mkPf(null)]);
    setActivePfIdx(0);
    setRoute("builder");
  }, []);

  const updateActivePortfolio = useCallback((updated) => {
    setPortfolios(ps => ps.map((p, i) => i === activePfIdx ? updated : p));
  }, [activePfIdx]);

  const runBacktestFlow = useCallback(() => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setRoute("results"); }, 700);
  }, []);

  const addPortfolioForCompare = useCallback(() => {
    if (portfolios.length >= 4) return;
    const next = mkPf(PRESETS[portfolios.length % PRESETS.length], portfolios.length);
    setPortfolios([...portfolios, next]);
    setRoute("compare");
  }, [portfolios]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setToast("Link copied to clipboard");
      setTimeout(() => setToast(null), 2500);
    }).catch(() => {});
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT","SELECT","TEXTAREA"].includes(e.target.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); copyLink(); return; }
      const periodMap = { "1":"1M","2":"3M","3":"6M","4":"1Y","5":"3Y","6":"5Y","7":"10Y","8":"Max" };
      if (periodMap[e.key]) setPeriod(periodMap[e.key]);
      const routeMap = { "n":"onboarding","b":"builder","r":"results","c":"compare","x":"correlation" };
      if (routeMap[e.key.toLowerCase()]) setRoute(routeMap[e.key.toLowerCase()]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copyLink]);

  // Saved portfolios for sidebar
  const savedPortfolios = useMemo(() => portfolios.map((pf, i) => ({
    id:    pf.id,
    name:  pf.name,
    color: pfColors[i],
    ret:   backtest.allMetrics[i] ? parseFloat(backtest.allMetrics[i].totalReturn) : null,
    pfIdx: i,
  })), [portfolios, pfColors, backtest.allMetrics]);

  const onSelectSaved = useCallback((s) => {
    setActivePfIdx(s.pfIdx);
    setRoute("builder");
  }, []);

  const activePortfolio = portfolios[activePfIdx] || portfolios[0];

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"#fff" }}>
      <style>{GLOBAL_CSS}</style>

      <TopBar
        onOpenExport={() => setExportOpen(true)}
        onOpenShare={() => setShareOpen(true)}
        busy={backtest.busy}
        loadCount={backtest.loadCount}
        latestDate={backtest.latestDate}
      />

      <div style={{ display:"flex", flex:1, minHeight:0 }}>
        <SideNav
          route={route}
          onNav={setRoute}
          savedPortfolios={savedPortfolios}
          onSelectSaved={onSelectSaved}
        />

        <main style={{ flex:1, overflowY:"auto", maxHeight:"calc(100vh - 64px)", background:"#fff" }}>
          <ErrorBoundary>
            {route === "onboarding" && (
              <Onboarding onPickPreset={pickPreset} onBlank={blank}/>
            )}

            {route === "builder" && activePortfolio && (
              <Builder
                portfolio={activePortfolio}
                onUpdate={updateActivePortfolio}
                metrics={backtest.allMetrics[activePfIdx]}
                busy={backtest.busy}
                statuses={backtest.statuses}
                statusMsgs={backtest.statusMsgs}
                tickerPerfs={backtest.tickerPerfs}
                onRun={runBacktestFlow}
              />
            )}

            {route === "results" && (
              <Results
                portfolios={portfolios}
                pfNames={pfNames}
                pfColors={pfColors}
                displayChart={backtest.displayChart}
                drawdownChart={backtest.drawdownChart}
                annualRet={backtest.annualRet}
                rollingRet={backtest.rollingRet}
                heatmapData={backtest.heatmapData}
                distData={backtest.distData}
                scatterData={backtest.scatterData}
                ddAnalysis={backtest.ddAnalysis}
                allMetrics={backtest.allMetrics}
                simResults={backtest.simResults}
                priceCache={backtest.priceCache}
                benchSim={backtest.benchSim}
                benchmark={benchmark}
                period={period}
                setPeriod={setPeriod}
                periods={PERIODS}
                busy={backtest.busy}
                onEdit={() => setRoute("builder")}
              />
            )}

            {route === "compare" && (
              <Compare
                portfolios={portfolios}
                pfNames={pfNames}
                pfColors={pfColors}
                displayChart={backtest.displayChart}
                allMetrics={backtest.allMetrics}
                period={period}
                busy={backtest.busy}
                onEdit={() => setRoute("builder")}
              />
            )}

            {route === "correlation" && (
              <Correlation
                portfolios={portfolios}
                pfColors={pfColors}
                corrMatrix={backtest.corrMatrix}
                corrPfIdx={corrPfIdx}
                setCorrPfIdx={setCorrPfIdx}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Modals */}
      {running && <RunningScreen portfolioName={activePortfolio?.name || "portfolio"}/>}
      {exportOpen && (
        <ExportModal onClose={() => setExportOpen(false)}
          displayChart={backtest.displayChart}
          simResults={backtest.simResults}
          portfolios={portfolios}
          pfNames={pfNames}
          period={period}/>
      )}
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)}/>}

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          padding:"10px 18px", borderRadius:10, background:C.text, color:"#fff",
          fontFamily:"var(--tf-font-sans)", fontSize:13, fontWeight:600,
          boxShadow:"0 10px 30px rgba(0,0,0,0.2)", zIndex:60,
          animation:"tf-fadeup 0.25s ease both",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
