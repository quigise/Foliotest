// ═══════════════════════════════════════════════════════════════════════════
//  Pure computation layer - no React, no DOM
// ═══════════════════════════════════════════════════════════════════════════

export function alignSeriesOuter(seriesMap) {
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

export function alignSeriesInner(seriesMap) {
  const ids = Object.keys(seriesMap).filter(id => seriesMap[id]?.length > 1);
  if (!ids.length) return {};
  const maps = {};
  ids.forEach(id => { maps[id] = {}; seriesMap[id].forEach(p => { maps[id][p.date] = p.close; }); });
  const sets = ids.map(id => new Set(Object.keys(maps[id])));
  const common = [...sets[0]].filter(d => sets.every(s => s.has(d))).sort();
  if (common.length < 2) return {};
  const out = {};
  ids.forEach(id => { out[id] = common.map(d => ({ date: d, close: maps[id][d] })); });
  return out;
}

export function simulatePortfolio(aligned, weights, rebalance, monthlyContribution, initialValue = 10000) {
  const { ids, dates, closes } = aligned;
  if (!ids.length || !dates.length) return [];
  const totalW = ids.reduce((s, id) => s + (weights[id] ?? 0), 0);
  if (totalW === 0) return [];
  const w = {};
  ids.forEach(id => { w[id] = (weights[id] ?? 0) / totalW; });

  let startIdx = 0;
  for (; startIdx < dates.length; startIdx++) {
    let hasNull = false;
    for (const id of ids) if (closes[id][startIdx] == null) { hasNull = true; break; }
    if (!hasNull) break;
  }
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
    if (rebalance === "Monthly")    return md >= 1;
    if (rebalance === "Quarterly")  return md >= 3;
    if (rebalance === "Annual")     return md >= 12;
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
      value:     +totalValue.toFixed(2),
      deposited: +totalDeposited.toFixed(2),
      drawdown:  +(((totalValue - peakValue) / peakValue) * 100).toFixed(3),
      pct:       +(((totalValue - initialValue) / initialValue) * 100).toFixed(3),
    });
  }
  return results;
}

export function buildDisplayChart(simResults, pfNames, benchSim) {
  if (!simResults.length || !simResults[0].length) return [];
  return simResults[0].map((row, i) => {
    const out = { date: row.date, _iso: row.date };
    simResults.forEach((sim, pi) => {
      out[pfNames[pi]]          = sim[i]?.pct ?? null;
      out[`${pfNames[pi]}_val`] = sim[i]?.value ?? null;
      out[`${pfNames[pi]}_dep`] = sim[i]?.deposited ?? null;
    });
    if (benchSim) out._bench = benchSim[i]?.pct ?? null;
    return out;
  });
}

export function buildAnnualReturns(simResults, pfNames) {
  if (!simResults.length) return [];
  const byYear = {};
  simResults.forEach((sim, pi) => {
    const name = pfNames[pi];
    const yearMap = {};
    sim.forEach(r => {
      const y = r.date.slice(0, 4);
      if (!yearMap[y]) yearMap[y] = { first: r.value, last: r.value };
      yearMap[y].last = r.value;
    });
    Object.entries(yearMap).forEach(([y, { first, last }]) => {
      if (!byYear[y]) byYear[y] = {};
      byYear[y][name] = +(((last - first) / first) * 100).toFixed(2);
    });
  });
  return Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b))
    .map(([year, vals]) => ({ year, ...vals }));
}

export function buildMonthlyHeatmap(sim) {
  if (!sim?.length) return [];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const byYM = {};
  sim.forEach(r => {
    const y = r.date.slice(0, 4);
    const m = parseInt(r.date.slice(5, 7)) - 1;
    if (!byYM[y]) byYM[y] = {};
    if (!byYM[y][m]) byYM[y][m] = { first: r.value, last: r.value };
    byYM[y][m].last = r.value;
  });
  return Object.entries(byYM).sort(([a], [b]) => b.localeCompare(a)).map(([year, months]) => {
    const row = { year };
    MONTHS.forEach((name, mi) => {
      const d = months[mi];
      row[name] = d ? +(((d.last - d.first) / d.first) * 100).toFixed(2) : null;
    });
    return row;
  });
}

export function buildDrawdownChart(simResults, pfNames) {
  if (!simResults[0]?.length) return [];
  return simResults[0].map((row, i) => {
    const out = { date: row.date };
    simResults.forEach((sim, pi) => { out[pfNames[pi]] = sim[i]?.drawdown ?? null; });
    return out;
  });
}

export function analyzeDrawdowns(sim, threshold = -5) {
  if (!sim?.length) return [];
  const periods = [];
  let inDD = false, ddStart = null, ddPeak = 0;
  sim.forEach((r, i) => {
    const dd = r.drawdown;
    if (!inDD && dd < threshold) { inDD = true; ddStart = i; ddPeak = dd; }
    else if (inDD) {
      if (dd < ddPeak) ddPeak = dd;
      if (dd >= -0.1) {
        periods.push({ start: sim[ddStart].date, end: r.date, maxDD: +ddPeak.toFixed(2), duration: i - ddStart });
        inDD = false; ddStart = null; ddPeak = 0;
      }
    }
  });
  if (inDD && ddStart != null) {
    periods.push({ start: sim[ddStart].date, end: null, maxDD: +ddPeak.toFixed(2), duration: sim.length - 1 - ddStart });
  }
  return periods.sort((a, b) => a.maxDD - b.maxDD).slice(0, 10);
}

export function buildRollingReturns(simResults, pfNames, windowYears) {
  if (!simResults[0]?.length) return [];
  const sim0 = simResults[0];
  const n = sim0.length;
  const getStartIdx = (i) => {
    const target = new Date(sim0[i].date + "T00:00:00Z");
    target.setUTCFullYear(target.getUTCFullYear() - windowYears);
    const targetISO = target.toISOString().slice(0, 10);
    let lo = 0, hi = i;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sim0[mid].date < targetISO) lo = mid + 1; else hi = mid;
    }
    return lo;
  };
  const result = [];
  for (let i = 1; i < n; i++) {
    const startIdx = getStartIdx(i);
    if (startIdx === i) continue;
    const row = { date: sim0[i].date };
    let valid = false;
    simResults.forEach((sim, pi) => {
      const sv = sim[startIdx]?.value, ev = sim[i]?.value;
      if (!sv || !ev) { row[pfNames[pi]] = null; return; }
      row[pfNames[pi]] = +((Math.pow(ev / sv, 1 / windowYears) - 1) * 100).toFixed(2);
      valid = true;
    });
    if (valid) result.push(row);
  }
  return result;
}

export function buildDistribution(simResults, pfNames, targetBins = 18) {
  if (!simResults[0]?.length) return [];
  const allReturns = simResults.map(sim => {
    const pct = sim.map(r => r.pct);
    return pct.slice(1).map((v, i) => v - pct[i]);
  });
  const allVals = allReturns.flat().filter(v => isFinite(v));
  if (!allVals.length) return [];
  const sorted = [...allVals].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.01)];
  const hi = sorted[Math.floor(sorted.length * 0.99)];
  const range = hi - lo;
  const step = range / targetBins;
  if (step === 0) return [];
  const result = [];
  for (let b = 0; b < targetBins; b++) {
    const binLo = +(lo + b * step).toFixed(2);
    const binHi = b === targetBins - 1 ? Infinity : +(lo + (b + 1) * step).toFixed(2);
    const row = { range: `${binLo >= 0 ? "+" : ""}${binLo.toFixed(1)}%`, lo: binLo,
      hi: binHi === Infinity ? +(lo + (b + 1) * step).toFixed(2) : binHi };
    allReturns.forEach((rets, pi) => {
      row[pfNames[pi]] = rets.filter(v => v >= binLo && v < binHi).length;
    });
    result.push(row);
  }
  return result;
}

export function buildScatterData(allMetrics, pfNames, pfColors) {
  return allMetrics.map((m, i) => ({
    name:   pfNames[i],
    color:  pfColors[i],
    cagr:   m?.cagr ? parseFloat(m.cagr) : null,
    vol:    m?.volatility ? parseFloat(m.volatility) : null,
    sharpe: m?.sharpe !== "—" ? parseFloat(m.sharpe) : null,
  })).filter(p => p.cagr != null && p.vol != null);
}

export function computeMetrics(sim, benchSim, intervalLabel) {
  if (!sim?.length || sim.length < 3) return null;
  const n = sim.length;
  const startD = new Date(sim[0].date + "T00:00:00Z");
  const endD = new Date(sim[n - 1].date + "T00:00:00Z");
  const years = Math.max((endD - startD) / (365.25 * 86400000), 1 / 12);
  const values = sim.map(r => r.value);
  const pcts = sim.map(r => r.pct);
  const deposited = sim[n - 1].deposited;
  const totalReturn = pcts[n - 1];
  const showCAGR = years >= 0.25;
  const cagr = showCAGR ? (Math.pow(values[n - 1] / values[0], 1 / years) - 1) * 100 : null;
  const trueProfit = values[n - 1] - deposited;
  const trueReturn = deposited > 0 ? (trueProfit / deposited) * 100 : null;
  const periodsPerYear = n / years;
  const diffs = pcts.slice(1).map((v, i) => v - pcts[i]);
  const mean = diffs.reduce((s, v) => s + v, 0) / diffs.length;
  const variance = diffs.reduce((s, v) => s + (v - mean) ** 2, 0) / diffs.length;
  const stdDev = Math.sqrt(variance);
  const annualVol = stdDev * Math.sqrt(periodsPerYear);
  const sharpe = annualVol > 0 && cagr != null ? (cagr / annualVol).toFixed(2) : "—";
  const downs = diffs.filter(v => v < 0);
  const downsideV = downs.length ? Math.sqrt(downs.reduce((s, v) => s + v * v, 0) / downs.length) * Math.sqrt(periodsPerYear) : 0;
  const sortino = downsideV > 0 && cagr != null ? (cagr / downsideV).toFixed(2) : "—";
  let maxDD = 0, peak = -Infinity;
  values.forEach(v => { if (v > peak) peak = v; maxDD = Math.max(maxDD, (peak - v) / peak * 100); });
  const calmar = maxDD > 0 && cagr != null ? (cagr / maxDD).toFixed(2) : "—";
  let beta = "—", alpha = "—", correlation = "—";
  if (benchSim?.length === n) {
    const bp = benchSim.map(r => r.pct);
    const bd = bp.slice(1).map((v, i) => v - bp[i]);
    const bm = bd.reduce((s, v) => s + v, 0) / bd.length;
    const len = Math.min(diffs.length, bd.length);
    const cov = diffs.slice(0, len).reduce((s, v, i) => s + (v - mean) * (bd[i] - bm), 0) / len;
    const bVar = bd.reduce((s, v) => s + (v - bm) ** 2, 0) / bd.length;
    const bVol = Math.sqrt(bVar);
    beta = bVar > 0 ? (cov / bVar).toFixed(2) : "—";
    const bFinal = benchSim[benchSim.length - 1].value;
    const bStart = benchSim[0].value;
    const bCAGR = (Math.pow(bFinal / bStart, 1 / years) - 1) * 100;
    alpha = bVar > 0 && cagr != null ? (cagr - parseFloat(beta) * bCAGR).toFixed(2) : "—";
    correlation = (bVol > 0 && stdDev > 0) ? (cov / (stdDev * bVol)).toFixed(2) : "—";
  }
  const periodBase = intervalLabel === "1d" ? "d" : intervalLabel === "1wk" ? "wk" : "mo";
  return {
    totalReturn:  totalReturn.toFixed(2),
    finalValue:   values[n - 1].toFixed(0),
    deposited:    deposited.toFixed(0),
    trueProfit:   trueProfit.toFixed(0),
    trueReturn:   trueReturn?.toFixed(2) ?? null,
    cagr:         cagr?.toFixed(2) ?? null,
    sharpe, sortino, calmar,
    maxDD:        maxDD.toFixed(2),
    volatility:   annualVol.toFixed(2),
    best:         Math.max(...diffs).toFixed(2),
    worst:        Math.min(...diffs).toFixed(2),
    beta, alpha, correlation,
    winRate:      ((diffs.filter(v => v > 0).length / diffs.length) * 100).toFixed(1),
    winRateBase:  periodBase,
    years:        years.toFixed(1),
  };
}

export function buildCorrelationMatrix(innerAligned) {
  const ids = Object.keys(innerAligned);
  if (ids.length < 2) return null;
  const returns = {};
  ids.forEach(id => {
    const closes = innerAligned[id].map(p => p.close);
    returns[id] = closes.slice(1).map((v, i) => (v - closes[i]) / closes[i]);
  });
  const matrix = {};
  ids.forEach(a => {
    matrix[a] = {};
    ids.forEach(b => {
      const ra = returns[a], rb = returns[b];
      const len = Math.min(ra.length, rb.length);
      const ma = ra.slice(0, len).reduce((s, v) => s + v, 0) / len;
      const mb = rb.slice(0, len).reduce((s, v) => s + v, 0) / len;
      const cov = ra.slice(0, len).reduce((s, v, i) => s + (v - ma) * (rb[i] - mb), 0) / len;
      const va = ra.slice(0, len).reduce((s, v) => s + (v - ma) ** 2, 0) / len;
      const vb = rb.slice(0, len).reduce((s, v) => s + (v - mb) ** 2, 0) / len;
      matrix[a][b] = va > 0 && vb > 0 ? +(cov / Math.sqrt(va * vb)).toFixed(3) : (a === b ? 1 : 0);
    });
  });
  return { ids, matrix };
}

export function buildAssetChart(holdings, priceCache, period) {
  const inner = {};
  holdings.forEach(h => {
    const k = `${h.id || h.sym}_${period}`;
    if (priceCache[k]) inner[h.id || h.sym] = priceCache[k];
  });
  const al = alignSeriesInner(inner);
  const refId = Object.keys(al)[0];
  if (!refId) return [];
  const b0 = {};
  Object.keys(al).forEach(id => { b0[id] = al[id][0].close; });
  return al[refId].map((row, j) => {
    const out = { date: row.date };
    Object.keys(al).forEach(id => {
      out[id] = +((al[id][j].close - b0[id]) / b0[id] * 100).toFixed(2);
    });
    return out;
  });
}
