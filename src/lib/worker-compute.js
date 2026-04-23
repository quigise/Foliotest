// Web Worker — runs heavy computations off the main UI thread
export const WORKER_SOURCE = `
function alignSeriesOuter(seriesMap) {
  const ids = Object.keys(seriesMap).filter(id => seriesMap[id]?.length > 1);
  if (!ids.length) return { ids: [], dates: [], closes: {}, coverageWarning: null };
  const allDates = new Set();
  const maps = {};
  ids.forEach(id => {
    maps[id] = {};
    seriesMap[id].forEach(p => { maps[id][p.date] = p.close; allDates.add(p.date); });
  });
  const dates = [...allDates].sort();
  const cw = {};
  ids.forEach(id => {
    const cov = dates.filter(d => maps[id][d] != null).length;
    const pct = Math.round(cov / dates.length * 100);
    if (pct < 80) cw[id] = { pct, firstDate: seriesMap[id][0]?.date, lastDate: seriesMap[id][seriesMap[id].length-1]?.date };
  });
  const closes = {};
  ids.forEach(id => { closes[id] = dates.map(d => maps[id][d] ?? null); });
  return { ids, dates, closes, coverageWarning: Object.keys(cw).length ? cw : null };
}

function simulatePortfolio(aligned, weights, rebalance, monthlyContribution, initialValue) {
  const { ids, dates, closes } = aligned;
  if (!ids.length || !dates.length) return [];
  const totalW = ids.reduce((s, id) => s + (weights[id] ?? 0), 0);
  if (totalW === 0) return [];
  const w = {};
  ids.forEach(id => { w[id] = (weights[id] ?? 0) / totalW; });
  let startIdx = 0;
  while (startIdx < dates.length && ids.some(id => closes[id][startIdx] == null)) startIdx++;
  if (startIdx >= dates.length - 1) return [];
  let shares = {};
  ids.forEach(id => { shares[id] = (initialValue * w[id]) / closes[id][startIdx]; });
  let lastRebalDate = new Date(dates[startIdx] + "T00:00:00Z");
  let peakValue = initialValue;
  let totalDeposited = initialValue;
  const needsRebal = (cd, ld) => {
    if (rebalance === "Never" || rebalance === "Bands 5%") return false;
    const cur = new Date(cd + "T00:00:00Z");
    const md = (cur.getFullYear() - ld.getFullYear()) * 12 + (cur.getMonth() - ld.getMonth());
    if (rebalance === "Monthly") return md >= 1;
    if (rebalance === "Quarterly") return md >= 3;
    if (rebalance === "Annual") return md >= 12;
    return false;
  };
  const isNewMonth = (d, p) => p && d.slice(0,7) !== p.slice(0,7);
  const results = [];
  for (let i = startIdx; i < dates.length; i++) {
    const date = dates[i];
    const prices = {};
    ids.forEach(id => {
      const p = closes[id][i];
      if (p == null) {
        let j = i - 1;
        while (j >= startIdx && closes[id][j] == null) j--;
        prices[id] = closes[id][j] ?? 1;
      } else prices[id] = p;
    });
    let totalValue = ids.reduce((s, id) => s + shares[id] * prices[id], 0);
    if (i > startIdx && rebalance === "Bands 5%") {
      const drifted = ids.some(id => Math.abs((shares[id] * prices[id]) / totalValue - w[id]) > 0.05);
      if (drifted) {
        ids.forEach(id => { shares[id] = (w[id] * totalValue) / prices[id]; });
        lastRebalDate = new Date(date + "T00:00:00Z");
      }
    } else if (i > startIdx && needsRebal(date, lastRebalDate)) {
      ids.forEach(id => { shares[id] = (totalValue * w[id]) / prices[id]; });
      lastRebalDate = new Date(date + "T00:00:00Z");
    }
    const prev = i > startIdx ? dates[i-1] : null;
    if (i > startIdx && monthlyContribution !== 0 && isNewMonth(date, prev)) {
      totalValue += monthlyContribution;
      totalDeposited += Math.max(0, monthlyContribution);
      ids.forEach(id => { shares[id] += (monthlyContribution * w[id]) / prices[id]; });
    }
    totalValue = ids.reduce((s, id) => s + shares[id] * prices[id], 0);
    peakValue = Math.max(peakValue, totalValue);
    results.push({
      date,
      value: +totalValue.toFixed(2),
      deposited: +totalDeposited.toFixed(2),
      drawdown: +(((totalValue - peakValue) / peakValue) * 100).toFixed(3),
      pct: +(((totalValue - initialValue) / initialValue) * 100).toFixed(3),
    });
  }
  return results;
}

self.onmessage = function(e) {
  const { type, payload } = e.data;
  if (type === "simulate") {
    const { portfolios, priceCache, period, benchmark, initialValue } = payload;
    const results = [];
    let coverageWarnings = null;
    portfolios.forEach(pf => {
      const rawMap = {};
      pf.holdings.forEach(h => {
        const k = h.sym + "_" + period;
        if (priceCache[k]) rawMap[h.sym] = priceCache[k];
      });
      const al = alignSeriesOuter(rawMap);
      if (al.coverageWarning) coverageWarnings = { ...(coverageWarnings || {}), ...al.coverageWarning };
      if (!al.ids.length) { results.push([]); return; }
      const w = {};
      pf.holdings.forEach(h => { w[h.sym] = h.weight; });
      results.push(simulatePortfolio(al, w, pf.rebalance, pf.contribution, initialValue));
    });
    let benchSim = null;
    const bk = benchmark + "_" + period;
    if (priceCache[bk]) {
      const ba = alignSeriesOuter({ [benchmark]: priceCache[bk] });
      if (ba.ids.length) benchSim = simulatePortfolio(ba, { [benchmark]: 100 }, "Never", 0, initialValue);
    }
    self.postMessage({ type: "simulateDone", results, benchSim, coverageWarnings });
  }
};
`;

let workerInstance = null;
export function getWorker() {
  if (!workerInstance) {
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    workerInstance = new Worker(URL.createObjectURL(blob));
  }
  return workerInstance;
}

export function runSimulationInWorker(payload) {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const handler = (e) => {
      if (e.data.type === "simulateDone") {
        w.removeEventListener("message", handler);
        resolve(e.data);
      }
    };
    w.addEventListener("message", handler);
    w.addEventListener("error", reject, { once: true });
    w.postMessage({ type: "simulate", payload });
  });
}
