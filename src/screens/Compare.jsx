import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Caps, Card, Chip, Signed, Stat, Icon, AssetDot, Button } from "../components/primitives";
import { C, ASSET_COLORS, INITIAL_VALUE } from "../lib/tokens";
import { fmtCurrency, fmtDate } from "../lib/format";

export function Compare({ portfolios, pfNames, pfColors, displayChart, allMetrics, period, busy, onEdit }) {
  const fmtChart = useMemo(
    () => displayChart.map(r => ({ ...r, date: fmtDate(r._iso || r.date) })),
    [displayChart]
  );

  const axisProps = {
    tick:{ fill:C.muted, fontSize:11, fontFamily:"var(--tf-font-sans)" },
    axisLine:false, tickLine:false,
  };

  return (
    <div style={{ padding:"32px 40px", maxWidth:1480, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <Caps style={{ marginBottom:8 }}>Compare</Caps>
          <h1 style={{ margin:0, fontFamily:"var(--tf-font-sans)", fontWeight:800,
            fontSize:36, letterSpacing:"-0.03em", lineHeight:1.1, color:C.text }}>
            Side-by-side comparison
          </h1>
          <p style={{ margin:"6px 0 0", fontFamily:"var(--tf-font-sans)", fontSize:14, color:C.muted }}>
            Compare {portfolios.length} portfolios across performance, risk, and composition.
          </p>
        </div>
        <Button kind="secondary" icon="settings" onClick={onEdit}>Edit portfolios</Button>
      </div>

      {/* Performance comparison chart */}
      <Card padding={24} style={{ marginBottom:20 }}>
        <Caps style={{ marginBottom:16 }}>Cumulative performance · {period}</Caps>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={fmtChart}>
            <CartesianGrid stroke={C.border} vertical={false}/>
            <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd"/>
            <YAxis {...axisProps} tickFormatter={v => `${v}%`} width={50}/>
            <ReferenceLine y={0} stroke={C.borderHv} strokeDasharray="4 2"/>
            <Tooltip
              contentStyle={{ background:"#fff", border:`1px solid ${C.border}`,
                borderRadius:10, fontSize:12, fontFamily:"var(--tf-font-sans)" }}
              formatter={(v) => `${v >= 0 ? "+" : ""}${v?.toFixed(2)}%`}/>
            <Legend wrapperStyle={{ fontSize:13, fontWeight:600, paddingTop:14, fontFamily:"var(--tf-font-sans)" }}/>
            {portfolios.map((pf, i) => (
              <Line key={pf.id} type="monotone" dataKey={pfNames[i]}
                stroke={pfColors[i]} strokeWidth={2.5} dot={false}/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Side-by-side cards with composition */}
      <div style={{ display:"grid",
        gridTemplateColumns:`repeat(${Math.min(portfolios.length, 3)}, 1fr)`,
        gap:16 }}>
        {portfolios.map((pf, i) => {
          const m = allMetrics[i];
          const total = pf.holdings.reduce((s, h) => s + h.weight, 0);
          return (
            <Card key={pf.id} padding={0}>
              <div style={{ padding:"18px 22px", borderBottom:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ width:10, height:10, borderRadius:3, background:pfColors[i], flexShrink:0 }}/>
                <h3 style={{ margin:0, flex:1, fontFamily:"var(--tf-font-sans)",
                  fontWeight:700, fontSize:16, color:C.text }}>{pf.name}</h3>
                <Chip tone="flat" size="sm">{pf.rebalance}</Chip>
              </div>

              <div style={{ padding:"22px" }}>
                {m && (
                  <>
                    <div style={{
                      fontFamily:"var(--tf-font-sans)", fontWeight:800, fontSize:32,
                      letterSpacing:"-0.03em", lineHeight:1, fontVariantNumeric:"tabular-nums",
                      color: parseFloat(m.totalReturn) >= 0 ? C.green : C.red, marginBottom:6,
                    }}>
                      {fmtCurrency(m.finalValue)}
                    </div>
                    <Signed value={parseFloat(m.totalReturn)} size="md"/>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10,
                      marginTop:18, paddingTop:18, borderTop:`1px solid ${C.border}` }}>
                      <Stat label="CAGR" value={m.cagr ? `${m.cagr}%` : "—"}/>
                      <Stat label="Sharpe" value={m.sharpe}/>
                      <Stat label="DD max" value={`−${m.maxDD}%`} tone="neg"/>
                      <Stat label="Vol" value={`${m.volatility}%`}/>
                    </div>
                  </>
                )}
                {!m && (
                  <div style={{ color:C.muted, fontFamily:"var(--tf-font-sans)", fontSize:13 }}>
                    {busy ? "Computing…" : "Not enough data"}
                  </div>
                )}

                {/* Composition */}
                <div style={{ marginTop:20, paddingTop:18, borderTop:`1px solid ${C.border}` }}>
                  <Caps style={{ marginBottom:12 }}>Composition</Caps>
                  <div style={{ display:"flex", height:6, borderRadius:999, overflow:"hidden", marginBottom:12 }}>
                    {pf.holdings.map((h, idx) => (
                      <div key={idx} style={{
                        flex: h.weight,
                        background: ASSET_COLORS[h.sym] || C.borderMd,
                      }}/>
                    ))}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {pf.holdings.map(h => (
                      <div key={h.sym} style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:6, height:6, borderRadius:2,
                          background:ASSET_COLORS[h.sym] || C.borderMd, flexShrink:0 }}/>
                        <span style={{ flex:1, fontFamily:"var(--tf-font-sans)", fontSize:12,
                          fontWeight:600, color:C.text }}>{h.sym}</span>
                        <span style={{ fontFamily:"var(--tf-font-sans)", fontSize:12,
                          color:C.muted, fontVariantNumeric:"tabular-nums" }}>{h.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
