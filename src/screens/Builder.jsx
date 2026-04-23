import { useState, useMemo } from "react";
import { Caps, Icon, Chip, Button, Card, Input, Slider, Tooltip, AssetDot, Signed, Stat, Spinner, StatusPill } from "../components/primitives";
import { C, ASSET_COLORS, ASSET_META, ASSET_GROUPS, REBALANCE, INITIAL_VALUE } from "../lib/tokens";
import { fmtCurrency } from "../lib/format";

export function Builder({
  portfolio, onUpdate,
  metrics, busy, statuses, statusMsgs, tickerPerfs,
  onRun,
}) {
  const [tickerInput, setTickerInput] = useState("");
  const [tickerErr, setTickerErr]     = useState("");

  const total   = portfolio.holdings.reduce((s, h) => s + h.weight, 0);
  const isValid = Math.abs(total - 100) < 0.5;

  const upd = patch => onUpdate({ ...portfolio, ...patch });
  const updateWeight = (i, w) => upd({
    holdings: portfolio.holdings.map((h, idx) =>
      idx === i ? { ...h, weight: Math.max(0, Math.min(100, w)) } : h),
  });
  const removeAsset = i => upd({ holdings: portfolio.holdings.filter((_, idx) => idx !== i) });
  const addAsset = (sym) => {
    const s = sym.trim().toUpperCase();
    if (!s) { setTickerErr("Enter a ticker symbol"); return; }
    if (portfolio.holdings.some(h => h.sym === s)) { setTickerErr("Already in portfolio"); return; }
    upd({ holdings: [...portfolio.holdings, { sym: s, weight: 0 }] });
    setTickerInput(""); setTickerErr("");
  };
  const normalize = () => {
    if (!total) return;
    let sum = 0;
    const normalized = portfolio.holdings.map((h, i) => {
      const w = i < portfolio.holdings.length - 1
        ? Math.round((h.weight / total) * 1000) / 10
        : Math.round((100 - sum) * 10) / 10;
      sum += w;
      return { ...h, weight: w };
    });
    upd({ holdings: normalized });
  };
  const equalize = () => {
    const eq = Math.round((100 / portfolio.holdings.length) * 10) / 10;
    upd({ holdings: portfolio.holdings.map(h => ({ ...h, weight: eq })) });
  };

  const suggestedTickers = ["QQQ","VXUS","BND","GLD","BTC-USD","NVDA","AAPL","TLT"]
    .filter(s => !portfolio.holdings.some(h => h.sym === s)).slice(0, 6);

  return (
    <div style={{ padding:"32px 40px", maxWidth:1480, margin:"0 auto" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, gap:20 }}>
        <div style={{ flex:1 }}>
          <Caps style={{ marginBottom:8 }}>Builder</Caps>
          <input value={portfolio.name} onChange={e => upd({ name: e.target.value })}
            style={{ fontFamily:"var(--tf-font-sans)", fontWeight:800, fontSize:36,
              letterSpacing:"-0.03em", lineHeight:1.1, color:C.text,
              border:0, outline:"none", background:"transparent", width:"100%", padding:0 }}/>
          <p style={{ margin:"6px 0 0", fontFamily:"var(--tf-font-sans)", fontSize:14, color:C.muted }}>
            Adjust weights, tickers, and rules. Live preview uses real Yahoo Finance data.
          </p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <Button kind="ghost" size="md" icon="rotate-ccw" onClick={equalize}
            disabled={portfolio.holdings.length === 0}>
            Equal weight
          </Button>
          <Button kind="primary" size="md" icon="play" onClick={onRun}
            disabled={!isValid || portfolio.holdings.length === 0 || busy}>
            Run backtest
          </Button>
        </div>
      </div>

      {/* ── Two-column layout ──────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0, 1.35fr) minmax(0, 1fr)",
        gap:20, alignItems:"start" }}>

        {/* LEFT: editor */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Allocation card */}
          <Card padding={0}>
            <div style={{ padding:"18px 24px 14px", display:"flex",
              alignItems:"center", justifyContent:"space-between",
              borderBottom:`1px solid ${C.border}` }}>
              <h3 style={{ margin:0, fontFamily:"var(--tf-font-sans)", fontWeight:700, fontSize:16, color:C.text }}>
                Allocation
              </h3>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Caps>Total</Caps>
                <div style={{
                  fontFamily:"var(--tf-font-sans)", fontWeight:700, fontSize:15,
                  fontVariantNumeric:"tabular-nums",
                  color: isValid ? C.text : C.red,
                }}>{total.toFixed(1)}%</div>
                {!isValid && (
                  <button onClick={normalize}
                    style={{ border:0, background:"transparent", color:C.indigo2,
                      fontFamily:"var(--tf-font-sans)", fontSize:13, fontWeight:600,
                      cursor:"pointer", padding:0 }}>
                    Normalize to 100%
                  </button>
                )}
              </div>
            </div>

            {/* Stacked weight bar */}
            <div style={{ padding:"16px 24px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", height:8, borderRadius:999, overflow:"hidden", background:C.bgHover }}>
                {portfolio.holdings.map((h, i) => (
                  <div key={i} style={{
                    flex: h.weight,
                    background: ASSET_COLORS[h.sym] || C.borderMd,
                    transition: "flex 200ms cubic-bezier(0.2, 0, 0, 1)",
                  }}/>
                ))}
              </div>
            </div>

            {/* Holdings rows */}
            <div>
              {portfolio.holdings.length === 0 && (
                <div style={{ textAlign:"center", padding:"40px 24px", color:C.muted, fontSize:14 }}>
                  No assets yet. Add one below.
                </div>
              )}
              {portfolio.holdings.map((h, i) => {
                const meta  = ASSET_META[h.sym];
                const color = ASSET_COLORS[h.sym] || C.muted;
                const perf  = tickerPerfs?.[h.sym];
                const st    = statuses?.[h.sym];
                return (
                  <div key={h.sym} style={{
                    display:"grid",
                    gridTemplateColumns:"40px 160px 1fr 110px 36px",
                    alignItems:"center", gap:16, padding:"14px 24px",
                    borderBottom: i < portfolio.holdings.length - 1 ? `1px solid ${C.border}` : 0,
                  }}>
                    <AssetDot sym={h.sym} size={32} color={color}/>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontFamily:"var(--tf-font-sans)", fontWeight:700, fontSize:14, color:C.text }}>
                          {h.sym}
                        </span>
                        {st === "loading" && <Spinner size={9} color={C.muted}/>}
                        {(st === "error" || st === "badTicker") && (
                          <span style={{ fontSize:10, color: st === "badTicker" ? "#B45309" : C.red, fontWeight:700 }}>
                            {st === "badTicker" ? "?" : "✕"}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily:"var(--tf-font-sans)", fontSize:12, color:C.muted }}>
                        {meta?.name || "—"}
                        {perf != null && st === "ok" && (
                          <span style={{ marginLeft:6, fontVariantNumeric:"tabular-nums",
                            color: perf >= 0 ? C.green : C.red, fontWeight:600 }}>
                            {perf >= 0 ? "+" : ""}{perf.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Slider value={h.weight} min={0} max={100} step={0.5}
                      onChange={w => updateWeight(i, w)} color={color}/>
                    <div style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                      <input type="number" value={h.weight} step="0.5" min="0" max="100"
                        onChange={e => updateWeight(i, parseFloat(e.target.value) || 0)}
                        onFocus={e => e.target.select()}
                        style={{ width:64, padding:"6px 8px", border:`1px solid ${C.borderHv}`,
                          borderRadius:6, fontFamily:"var(--tf-font-sans)", fontWeight:600,
                          fontSize:13, fontVariantNumeric:"tabular-nums", textAlign:"right",
                          outline:"none", color:C.text, background:"#fff" }}/>
                      <span style={{ fontFamily:"var(--tf-font-sans)", fontSize:13, color:C.muted }}>%</span>
                    </div>
                    <button onClick={() => removeAsset(i)}
                      style={{ border:0, background:"transparent", padding:6, cursor:"pointer",
                        borderRadius:6, color:C.muted }}
                      onMouseEnter={e => e.currentTarget.style.color = C.red}
                      onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                      <Icon name="x" size={15}/>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add ticker */}
            <div style={{ padding:"16px 24px", borderTop:`1px solid ${C.border}`, background:C.bgAlt }}>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}>
                  <Input prefix="$" value={tickerInput}
                    onChange={v => { setTickerInput(v.toUpperCase()); setTickerErr(""); }}
                    onKeyDown={e => e.key === "Enter" && addAsset(tickerInput)}
                    placeholder="Add any Yahoo ticker — VTI, QQQ, BTC-USD, AAPL, MC.PA…"/>
                </div>
                <Button kind="secondary" icon="plus" onClick={() => addAsset(tickerInput)}>Add</Button>
              </div>
              {tickerErr && (
                <div style={{ marginTop:8, fontFamily:"var(--tf-font-sans)", fontSize:12, color:C.red }}>
                  {tickerErr}
                </div>
              )}
              <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
                {suggestedTickers.map(s => (
                  <Chip key={s} tone="flat" size="sm" onClick={() => addAsset(s)}>{s}</Chip>
                ))}
              </div>
            </div>
          </Card>

          {/* Rules card */}
          <Card padding={0}>
            <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${C.border}` }}>
              <h3 style={{ margin:0, fontFamily:"var(--tf-font-sans)", fontWeight:700, fontSize:16, color:C.text }}>
                Rules
              </h3>
            </div>
            <div style={{ padding:24, display:"grid", gridTemplateColumns:"1fr 1fr", gap:28 }}>
              {/* Rebalance */}
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                  <Caps>Rebalance</Caps>
                  <Tooltip content="How often the portfolio snaps back to target weights. 'Bands 5%' rebalances only when any asset drifts more than 5%.">
                    <Icon name="help-circle" size={13} color={C.faint}/>
                  </Tooltip>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {REBALANCE.map(o => (
                    <button key={o} onClick={() => upd({ rebalance: o })}
                      style={{
                        padding:"7px 14px",
                        border:`1px solid ${portfolio.rebalance === o ? C.text : C.borderHv}`,
                        background: portfolio.rebalance === o ? C.text : "#fff",
                        color: portfolio.rebalance === o ? "#fff" : C.text,
                        borderRadius:999, fontFamily:"var(--tf-font-sans)",
                        fontWeight:600, fontSize:13, cursor:"pointer",
                        transition:"all 120ms",
                      }}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start capital — fixed for now */}
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                  <Caps>Initial capital</Caps>
                </div>
                <Input prefix="$" value={INITIAL_VALUE.toLocaleString()} onChange={() => {}} />
              </div>

              {/* Monthly contribution */}
              <div style={{ gridColumn:"1 / -1" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                  <Caps>Monthly contribution (DCA)</Caps>
                  <Tooltip content="Dollar-cost averaging — invest a fixed amount every month, allocated pro-rata across holdings. Negative = withdrawal.">
                    <Icon name="help-circle" size={13} color={C.faint}/>
                  </Tooltip>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <Input prefix="$" suffix="/ mo"
                      value={(portfolio.contribution || 0).toLocaleString()}
                      onChange={v => upd({ contribution: parseFloat(v.replace(/,/g, "")) || 0 })}/>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    {[0, 250, 500, 1000].map(v => (
                      <Chip key={v} tone="flat" size="sm" active={portfolio.contribution === v}
                        onClick={() => upd({ contribution: v })}>
                        {v === 0 ? "None" : `$${v}`}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Statuses */}
          {Object.keys(statuses).length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {Object.entries(statuses).map(([id, st]) => (
                <StatusPill key={`${id}_${st}`} id={id} status={st} errMsg={statusMsgs[id]}/>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: live preview */}
        <Card padding={0} style={{ position:"sticky", top:88 }}>
          <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${C.border}`,
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <Caps style={{ marginBottom:4 }}>Live preview</Caps>
              <h3 style={{ margin:0, fontFamily:"var(--tf-font-sans)", fontWeight:700, fontSize:16, color:C.text }}>
                If you had run this
              </h3>
            </div>
            <Chip tone="flat" size="sm">
              {metrics ? `${metrics.years}y data` : "—"}
            </Chip>
          </div>
          <div style={{ padding:24 }}>
            <div style={{
              fontFamily:"var(--tf-font-sans)", fontWeight:800, fontSize:44,
              letterSpacing:"-0.03em", lineHeight:1, fontVariantNumeric:"tabular-nums",
              color: metrics ? (parseFloat(metrics.totalReturn) >= 0 ? C.green : C.red) : C.borderMd,
            }}>
              {metrics ? fmtCurrency(metrics.finalValue) : busy ? "…" : "—"}
            </div>
            <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:10 }}>
              <Signed value={metrics ? parseFloat(metrics.totalReturn) : null} size="md"/>
              {metrics && (
                <span style={{ fontFamily:"var(--tf-font-sans)", fontSize:13, color:C.muted }}>
                  on {fmtCurrency(metrics.deposited)} invested
                </span>
              )}
            </div>
            <hr style={{ margin:"20px 0", border:0, borderTop:`1px solid ${C.border}` }}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", rowGap:16, columnGap:16 }}>
              <Stat label="CAGR" value={metrics?.cagr ? `${metrics.cagr}%` : "—"}
                tip="Compound annual growth rate."/>
              <Stat label="Volatility" value={metrics ? `${metrics.volatility}%` : "—"}
                tip="Annualized standard deviation of returns."/>
              <Stat label="Sharpe" value={metrics?.sharpe || "—"}
                tip="Return per unit of risk. Above 1 is good."/>
              <Stat label="Max drawdown"
                value={metrics ? `−${metrics.maxDD}%` : "—"} tone="neg"
                tip="Worst peak-to-trough loss."/>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
