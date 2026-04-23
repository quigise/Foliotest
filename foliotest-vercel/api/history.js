// Vercel serverless function — Yahoo Finance proxy
// Maps to /api/history?ticker=...&days=...&interval=...

const HEADERS = {
  "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept":          "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer":         "https://finance.yahoo.com/",
  "Origin":          "https://finance.yahoo.com",
};

async function fetchYahoo(ticker, days, interval) {
  const end   = Math.floor(Date.now() / 1000);
  const start = end - parseInt(days) * 86400;
  const errors = [];

  for (const host of ["query1", "query2"]) {
    const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
      `?period1=${start}&period2=${end}&interval=${interval}&events=history&includePrePost=false`;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 12000);
        const response   = await fetch(url, { headers: HEADERS, signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) throw { type: "INVALID_TICKER", message: `Ticker "${ticker}" not found on Yahoo Finance` };
          if (response.status === 429) {
            if (attempt < 2) { await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt))); continue; }
            throw { type: "RATE_LIMITED", message: "Yahoo Finance is rate-limiting us" };
          }
          throw { type: "FETCH_ERROR", message: `HTTP ${response.status}` };
        }

        const data   = await response.json();
        const result = data?.chart?.result?.[0];
        const errMsg = data?.chart?.error?.description;

        if (errMsg) throw { type: "INVALID_TICKER", message: errMsg };
        if (!result?.timestamp?.length) throw { type: "NO_DATA", message: "No data returned" };

        const ts    = result.timestamp;
        const quote = result.indicators.quote[0];
        const adj   = result.indicators.adjclose?.[0]?.adjclose;

        const points = ts.map((t, i) => ({
          date:   new Date(t * 1000).toISOString().slice(0, 10),
          close:  +(adj?.[i] ?? quote.close[i]),
          volume: quote.volume?.[i] ?? null,
        })).filter(p => p.close != null && isFinite(p.close) && p.close > 0);

        if (points.length < 2) throw { type: "INSUFFICIENT_DATA", message: "Insufficient data (< 2 points)" };

        return {
          data: points,
          lastDate:  points[points.length - 1].date,
          firstDate: points[0].date,
          count:     points.length,
        };
      } catch (err) {
        if (err.type === "INVALID_TICKER") throw err;
        if (err.type === "NO_DATA" || err.type === "INSUFFICIENT_DATA") {
          errors.push(err.message);
          break;
        }
        if (err.name === "AbortError") {
          errors.push("Timeout");
          if (attempt < 2) { await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt))); continue; }
        }
        errors.push(err.message || String(err));
        break;
      }
    }
  }
  throw { type: "FETCH_ERROR", message: errors.join(" | ") || `Could not fetch ${ticker}` };
}

// In-memory cache (per serverless invocation lifetime, ~5-15 min)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  // Cache headers — let Vercel CDN cache for 5 min
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");

  const { ticker, days, interval } = req.query;
  if (!ticker || !days || !interval) {
    return res.status(400).json({ errorType: "BAD_REQUEST", error: "Missing parameters" });
  }

  const key = `${ticker}_${days}_${interval}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.t < CACHE_TTL) {
    return res.status(200).json({ ...cached.data, cached: true });
  }

  try {
    const result = await fetchYahoo(ticker, days, interval);
    cache.set(key, { data: result, t: Date.now() });
    return res.status(200).json(result);
  } catch (err) {
    const status = err.type === "INVALID_TICKER" ? 404 : 500;
    return res.status(status).json({ errorType: err.type, error: err.message });
  }
}
