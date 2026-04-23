import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fetchHistory } from "../lib/api";
import {
  alignSeriesInner, computeMetrics, buildCorrelationMatrix,
  buildDisplayChart, buildAnnualReturns, buildMonthlyHeatmap,
  buildDrawdownChart, buildRollingReturns, analyzeDrawdowns,
  buildDistribution, buildScatterData,
} from "../lib/compute";
import { runSimulationInWorker } from "../lib/worker-compute";
import { PERIODS, INITIAL_VALUE } from "../lib/tokens";

export function useBacktest({ portfolios, period, benchmark, pfColors, rollingWin, corrPfIdx }) {
  const [statuses,         setStatuses]         = useState({});
  const [statusMsgs,       setStatusMsgs]       = useState({});
  const [priceCache,       setPriceCache]       = useState({});
  const [simResults,       setSimResults]       = useState([]);
  const [benchSim,         setBenchSim]         = useState(null);
  const [coverageWarnings, setCoverageWarnings] = useState(null);
  const [busy,             setBusy]             = useState(false);
  const [loadCount,        setLoadCount]        = useState({ total: 0, done: 0 });
  const [lastDates,        setLastDates]        = useState({});

  const pfNames = useMemo(() => portfolios.map(p => p.name), [portfolios]);

  const recompute = useCallback(async (pfs, pd, cache, bm) => {
    try {
      const result = await runSimulationInWorker({
        portfolios: pfs.map(pf => ({
          name: pf.name, rebalance: pf.rebalance, contribution: pf.contribution,
          holdings: pf.holdings.map(h => ({ sym: h.sym, weight: h.weight })),
        })),
        priceCache: cache,
        period: pd,
        benchmark: bm,
        initialValue: INITIAL_VALUE,
      });
      setSimResults(result.results);
      setBenchSim(result.benchSim);
      setCoverageWarnings(result.coverageWarnings);
    } catch (e) { console.error("Worker error:", e); }
  }, []);

  const load = useCallback(async (pfs, pd, cache, bm) => {
    setBusy(true);
    const cfg = PERIODS.find(p => p.label === pd) ?? PERIODS[3];
    const allIds = [...new Set([...pfs.flatMap(pf => pf.holdings.map(h => h.sym)), bm])].filter(Boolean);
    const missing = allIds.filter(id => !cache[`${id}_${pd}`]);

    setLoadCount({ total: missing.length, done: 0 });
    if (missing.length) {
      setStatuses(s => { const n = { ...s }; missing.forEach(id => { n[id] = "loading"; }); return n; });
    }

    const nc = { ...cache };
    await Promise.allSettled(missing.map(async id => {
      try {
        const res = await fetchHistory(id, cfg.days, cfg.interval);
        nc[`${id}_${pd}`] = res.data || res;
        if (res.lastDate) setLastDates(d => ({ ...d, [id]: res.lastDate }));
        setStatuses(s => ({ ...s, [id]: "ok" }));
        setLoadCount(c => ({ ...c, done: c.done + 1 }));
      } catch (e) {
        nc[`${id}_${pd}`] = null;
        setStatuses(s => ({ ...s, [id]: e.isInvalidTicker ? "badTicker" : "error" }));
        setStatusMsgs(s => ({ ...s, [id]: e.message }));
        setLoadCount(c => ({ ...c, done: c.done + 1 }));
      }
    }));

    setPriceCache(nc);
    await recompute(pfs, pd, nc, bm);
    setBusy(false);
  }, [recompute]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(portfolios, period, priceCache, benchmark); }, [period, benchmark]);

  const prevSig = useRef("");
  useEffect(() => {
    const tSig = [...new Set([...portfolios.flatMap(p => p.holdings.map(h => h.sym)), benchmark])].sort().join(",");
    const wSig = portfolios.map(p => p.holdings.map(h => `${h.sym}:${h.weight}`).join(",") + p.rebalance + p.contribution).join("|");
    const sig = tSig + "|" + wSig;
    if (sig === prevSig.current) return;
    const tChanged = tSig !== prevSig.current.split("|")[0];
    prevSig.current = sig;
    if (tChanged) load(portfolios, period, priceCache, benchmark);
    else recompute(portfolios, period, priceCache, benchmark);
    /* eslint-disable-next-line */
  }, [portfolios]);

  const allMetrics = useMemo(() => {
    const cfg = PERIODS.find(p => p.label === period) ?? PERIODS[3];
    return simResults.map(sim => computeMetrics(sim, benchSim, cfg.interval));
  }, [simResults, benchSim, period]);

  const displayChart  = useMemo(() => buildDisplayChart(simResults, pfNames, benchSim), [simResults, pfNames, benchSim]);
  const drawdownChart = useMemo(() => buildDrawdownChart(simResults, pfNames), [simResults, pfNames]);
  const annualRet     = useMemo(() => buildAnnualReturns(simResults, pfNames), [simResults, pfNames]);
  const rollingRet    = useMemo(() => buildRollingReturns(simResults, pfNames, rollingWin), [simResults, pfNames, rollingWin]);
  const distData      = useMemo(() => buildDistribution(simResults, pfNames), [simResults, pfNames]);
  const scatterData   = useMemo(() => buildScatterData(allMetrics, pfNames, pfColors), [allMetrics, pfNames, pfColors]);
  const ddAnalysis    = useMemo(() => simResults.map(sim => analyzeDrawdowns(sim, -5)), [simResults]);

  const tickerPerfs = useMemo(() => {
    const out = {};
    portfolios.forEach(pf => pf.holdings.forEach(h => {
      if (out[h.sym] != null) return;
      const s = priceCache[`${h.sym}_${period}`];
      if (s?.length > 1) out[h.sym] = +((s[s.length-1].close - s[0].close) / s[0].close * 100).toFixed(2);
    }));
    return out;
  }, [priceCache, period, portfolios]);

  const corrMatrix = useMemo(() => {
    const pf = portfolios[corrPfIdx] || portfolios[0];
    if (!pf) return null;
    const inner = {};
    pf.holdings.forEach(h => { if (priceCache[`${h.sym}_${period}`]) inner[h.sym] = priceCache[`${h.sym}_${period}`]; });
    const al = alignSeriesInner(inner);
    return Object.keys(al).length >= 2 ? buildCorrelationMatrix(al) : null;
  }, [portfolios, corrPfIdx, priceCache, period]);

  const heatmapData = useMemo(() => buildMonthlyHeatmap(simResults[corrPfIdx] || []), [simResults, corrPfIdx]);

  const latestDate = useMemo(() => {
    const dates = Object.values(lastDates).filter(Boolean);
    return dates.length ? dates.sort().pop() : null;
  }, [lastDates]);

  return {
    statuses, statusMsgs, priceCache,
    simResults, benchSim, allMetrics,
    coverageWarnings, busy, loadCount, latestDate,
    displayChart, drawdownChart, annualRet,
    rollingRet, distData, scatterData, ddAnalysis,
    tickerPerfs, corrMatrix, heatmapData,
  };
}
