// ─── Throttled fetch queue ────────────────────────────────────────────────────
class Limiter {
  constructor(max = 4) { this.max = max; this.running = 0; this.queue = []; }
  async run(fn) {
    if (this.running >= this.max) await new Promise(r => this.queue.push(r));
    this.running++;
    try { return await fn(); }
    finally { this.running--; const n = this.queue.shift(); if (n) n(); }
  }
}
const limiter = new Limiter(4);

export async function fetchHistory(ticker, days, interval) {
  return limiter.run(async () => {
    const res = await fetch(`/api/history?ticker=${encodeURIComponent(ticker)}&days=${days}&interval=${interval}`);
    const json = await res.json();
    if (!res.ok) {
      const e = new Error(json.error || `HTTP ${res.status}`);
      e.errorType = json.errorType;
      e.isInvalidTicker = json.errorType === "INVALID_TICKER";
      throw e;
    }
    return json;
  });
}

// ─── URL state encode/decode ─────────────────────────────────────────────────
export function encodeState(state) {
  try { return btoa(JSON.stringify(state)); } catch { return ""; }
}
export function decodeState(hash) {
  try { return JSON.parse(atob(hash)); } catch { return null; }
}

// ─── CSV export ──────────────────────────────────────────────────────────────
export function exportCSV(displayChart, simResults, portfolios, pfNames, filename = "backtest.csv") {
  if (!displayChart?.length) return;
  const headers = ["Date"];
  pfNames.forEach(n => headers.push(`${n} (%)`, `${n} ($)`, `${n} invested ($)`));
  headers.push("Benchmark (%)");
  const rows = [headers.join(",")];
  displayChart.forEach(r => {
    const row = [r._iso || r.date];
    pfNames.forEach(n => {
      row.push(r[n]?.toFixed(3) ?? "");
      row.push(r[`${n}_val`]?.toFixed(2) ?? "");
      row.push(r[`${n}_dep`]?.toFixed(2) ?? "");
    });
    row.push(r._bench?.toFixed(3) ?? "");
    rows.push(row.join(","));
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}
