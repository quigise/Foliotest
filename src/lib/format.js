// ─── Formatting helpers ──────────────────────────────────────────────────────
export function fmtDate(iso) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    day:"numeric", month:"short", year:"2-digit", timeZone:"UTC",
  });
}

export function fmtMonthYear(iso) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month:"short", year:"numeric", timeZone:"UTC",
  });
}

export function fmtCurrency(v, decimals = 0) {
  if (v == null || !isFinite(v)) return "—";
  return parseFloat(v).toLocaleString("en-US", {
    style:"currency", currency:"USD",
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  });
}

export function fmtNumber(v, decimals = 0) {
  if (v == null || !isFinite(v)) return "—";
  return parseFloat(v).toLocaleString("en-US", {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  });
}

export function fmtPct(v, decimals = 2, signed = true) {
  if (v == null || !isFinite(v)) return "—";
  const n = parseFloat(v);
  return `${signed && n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;
}
