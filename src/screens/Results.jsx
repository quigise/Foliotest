import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ScatterChart, Scatter, Cell, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ZAxis, ReferenceArea,
} from "recharts";
import { Caps, Card, Chip, Button, Icon, Stat, Signed, Tooltip as Tip, AssetDot } from "../components/primitives";
import { C, ASSET_COLORS, MONTHS_SHORT, INITIAL_VALUE } from "../lib/tokens";
import { fmtCurrency, fmtDate, fmtMonthYear, fmtPct } from "../lib/format";
import { buildAssetChart } from "../lib/compute";

const TABS = [
  { id:"perf",    label:"Performance", icon:"trending-up" },
  { id:"contrib", label:"Contributions", icon:"piggy-bank" },
  { id:"dd",      label:"Drawdown", icon:"trending-down" },
  { id:"heatmap", label:"Heatmap", icon:"grid-3x3" },
  { id:"annual",  label:"By year", icon:"calendar" },
  { id:"rolling", label:"Rolling", icon:"refresh-cw" },
  { id:"dist",    label:"Distribution", icon:"bar-chart" },
  { id:"scatter", label:"Risk/Return", icon:"target" },
  { id:"assets",  label:"Per asset", icon:"layers" },
  { id:"stats",   label:"Statistics", icon:"sliders" },
];

// ─── Custom chart tooltip ────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label, showEur }) => {
  if (!active || !payload?.length) return null;
  const rows = [...payload]
    .filter(p => p.value != null && !String(p.dataKey).includes("_val") && !String(p.dataKey).includes("_dep"))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:10,
      padding:"10px 14px", boxShadow:"0 4px 16px rgba(10,10,10,0.10)", minWidth:200 }}>
      <Caps style={{ marginBottom:8 }}>{label}</Caps>
      {rows.map(p => {
        const v = typeof p.value === "number" ? p.value : null;
        const eur = payload.find(x => x.dataKey === `${p.dataKey}_val`)?.value;
        return (
          <div key={p.dataKey} style={{ marginBottom:4 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:20 }}>
              <span style={{ display:"flex", alignItems:"center", gap:7,
                fontSize:12, fontWeight:500, color:C.sub, fontFamily:"var(--tf-font-sans)" }}>
                <span style={{ width:8, height:8, borderRadius:2,
                  background:p.stroke || p.fill || C.text, display:"inline-block", flexShrink:0 }}/>
                {p.name || p.dataKey}
              </span>
              <Signed value={v} size="sm" weight={700}/>
            </div>
            {showEur && eur && (
              <div style={{ fontSize:11, color:C.muted, textAlign:"right",
                marginTop:1, fontFamily:"var(--tf-font-sans)", fontVariantNumeric:"tabular-nums" }}>
                {fmtCurrency(eur)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Heatmap ─────────────────────────────────────────────────────────────────
function Heatmap({ data }) {
  const [hover, setHover] = useState(null);
  if (!data.length) return <div style={{ textAlign:"center", color:C.muted, padding:"40px 0" }}>No data</div>;

  const allVals = data.flatMap(r => MONTHS_SHORT.map(m => r[m]).filter(v => v != null));
  const maxAbs = Math.max(...allVals.map(Math.abs), 1);

  const cellBg = v => {
    if (v == null) return C.border;
    const intensity = Math.min(Math.abs(v) / maxAbs, 1);
    return v >= 0
      ? `rgba(5,150,105,${.12 + intensity * .75})`
      : `rgba(220,38,38,${.12 + intensity * .75})`;
  };
  const textCol = v => {
    if (v == null) return C.muted;
    return Math.abs(v) > maxAbs * .5 ? "#fff" : v >= 0 ? C.greenDk : C.redDk;
  };

  return (
    <div style={{ position:"relative" }}>
      <div style={{ overflowX:"auto" }}>
        <table style={{ minWidth:720, width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:C.bgAlt }}>
              <th style={{ padding:"9px 14px", textAlign:"left" }}>
                <Caps>Year</Caps>
              </th>
              {MONTHS_SHORT.map(m => (
                <th key={m} style={{ padding:"9px 8px", textAlign:"center" }}>
                  <Caps>{m}</Caps>
                </th>
              ))}
              <th style={{ padding:"9px 14px", textAlign:"right" }}>
                <Caps>Total</Caps>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => {
              const totalLog = MONTHS_SHORT.reduce((s, m) => {
                const v = row[m];
                return v != null ? s + Math.log(1 + v / 100) : s;
              }, 0);
              const total = +((Math.exp(totalLog) - 1) * 100).toFixed(2);
              return (
                <tr key={row.year} style={{ borderTop:`1px solid ${C.border}` }}>
                  <td style={{ padding:"8px 14px", fontFamily:"var(--tf-font-sans)",
                    fontVariantNumeric:"tabular-nums", fontSize:12, fontWeight:700, color:C.sub }}>
                    {row.year}
                  </td>
                  {MONTHS_SHORT.map(m => {
                    const v = row[m];
                    return (
                      <td key={m}
                        onMouseEnter={() => setHover({ year: row.year, month: m, value: v })}
                        onMouseLeave={() => setHover(null)}
                        style={{
                          padding:"8px 4px", textAlign:"center",
                          fontFamily:"var(--tf-font-sans)", fontVariantNumeric:"tabular-nums",
                          fontSize:11, fontWeight:600,
                          background: cellBg(v), color: textCol(v),
                          cursor: v != null ? "pointer" : "default",
                          transition:"transform .1s",
                        }}>
                        {v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}` : "·"}
                      </td>
                    );
                  })}
                  <td style={{ padding:"8px 14px", textAlign:"right" }}>
                    <Signed value={total} size="sm"/>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hover && hover.value != null && (
        <div style={{ position:"absolute", top:0, right:0, padding:"8px 14px",
          background:"#fff", border:`1px solid ${C.border}`, borderRadius:8,
          fontFamily:"var(--tf-font-sans)", fontSize:12, color:C.sub,
          boxShadow:"0 2px 8px rgba(0,0,0,.06)", pointerEvents:"none" }}>
          <strong style={{ color:C.text }}>{hover.month} {hover.year}</strong>:{" "}
          <Signed value={hover.value} size="sm" weight={700}/>
        </div>
      )}
    </div>
  );
}

// ─── StatRow ─────────────────────────────────────────────────────────────────
function StatRow({ label, metrics, getValue, fmt, isGood }) {
  const vals = metrics.map(m => getValue(m));
  const numbers = vals.map(v => v != null ? parseFloat(v) : null).filter(v => v != null && isFinite(v));
  const bestNum = isGood === null || !numbers.length ? null
    : isGood ? Math.max(...numbers) : Math.min(...numbers);
  return (
    <tr style={{ borderBottom:`1px solid ${C.border}` }}>
      <td style={{ padding:"10px 16px", fontFamily:"var(--tf-font-sans)",
        fontSize:12, color:C.sub, fontWeight:500, whiteSpace:"nowrap" }}>
        {label}
      </td>
      {vals.map((raw, i) => {
        const val = raw != null ? fmt(raw) : "—";
        const num = raw != null ? parseFloat(raw) : null;
        const isBest = bestNum != null && num != null && Math.abs(num - bestNum) < .001;
        return (
          <td key={i} style={{
            padding:"10px 20px", textAlign:"right",
            fontFamily:"var(--tf-font-sans)", fontVariantNumeric:"tabular-nums",
            fontSize:13, fontWeight: isBest ? 700 : 500,
            background: isBest ? (isGood === false ? C.redLt : C.greenLt) : "transparent",
            color: isBest ? (isGood === false ? C.redDk : C.greenDk) :
                   isGood === null ? C.text : num > 0 ? C.green : num < 0 ? C.red : C.sub,
            borderLeft: isBest ? `2px solid ${isGood === false ? C.red : C.green}` : "2px solid transparent",
          }}>
            {val}
          </td>
        );
      })}
    </tr>
  );
}

// ─── MAIN RESULTS COMPONENT ──────────────────────────────────────────────────
export function Results({
  portfolios, pfNames, pfColors,
  displayChart, drawdownChart, annualRet, rollingRet,
  heatmapData, distData, scatterData, ddAnalysis,
  allMetrics, simResults, priceCache,
  benchSim, benchmark, period, setPeriod, periods,
  busy, onEdit, savedPortfolios,
}) {
  const [tab,        setTab]        = useState("perf");
  const [rollingWin, setRollingWin] = useState(1);
  const [heatPfIdx,  setHeatPfIdx]  = useState(0);

  // Format chart data with English dates
  const fmtChart      = useMemo(() => displayChart.map(r => ({ ...r, date: fmtDate(r._iso || r.date) })), [displayChart]);
  const fmtDrawdown   = useMemo(() => drawdownChart.map(r => ({ ...r, date: fmtDate(r.date) })), [drawdownChart]);
  const fmtRolling    = useMemo(() => rollingRet.map(r => ({ ...r, date: fmtDate(r.date) })), [rollingRet]);

  const axisProps = { tick:{ fill:C.muted, fontSize:11, fontFamily:"var(--tf-font-sans)" },
    axisLine:false, tickLine:false };

  const chartH = Math.max(320, Math.min(440, Math.floor(window.innerHeight * 0.42)));
  const hasData = displayChart.length > 0;

  return (
    <div style={{ padding:"32px 40px", maxWidth:1480, margin:"0 auto" }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, gap:20 }}>
        <div>
          <Caps style={{ marginBottom:8 }}>Results · {period}</Caps>
          <h1 style={{ margin:0, fontFamily:"var(--tf-font-sans)", fontWeight:800,
            fontSize:36, letterSpacing:"-0.03em", lineHeight:1.1, color:C.text }}>
            {portfolios.length === 1 ? portfolios[0].name : `${portfolios.length} portfolios compared`}
          </h1>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Period pills */}
          <div style={{ display:"flex", gap:1, background:C.bgAlt, padding:3,
            border:`1px solid ${C.border}`, borderRadius:8 }}>
            {periods.map(p => (
              <button key={p.label} onClick={() => setPeriod(p.label)}
                style={{
                  padding:"5px 11px", borderRadius:6, fontSize:12, fontWeight:600,
                  background: period === p.label ? "#fff" : "transparent",
                  color: period === p.label ? C.text : C.muted,
                  boxShadow: period === p.label ? "0 1px 2px rgba(0,0,0,.06)" : "none",
                  border:0, cursor:"pointer", fontFamily:"var(--tf-font-sans)",
                  transition:"all .15s",
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <Button kind="secondary" size="md" icon="settings" onClick={onEdit}>Edit</Button>
        </div>
      </div>

      {/* ── Hero metrics ──────────────────────────────────────────── */}
      <div style={{
        display:"grid",
        gridTemplateColumns: `repeat(${portfolios.length}, 1fr)`,
        gap:16, marginBottom:24,
      }}>
        {portfolios.map((pf, i) => {
          const m = allMetrics[i];
          const pos = parseFloat(m?.totalReturn ?? 0) >= 0;
          const hasContrib = pf.contribution !== 0;
          return (
            <Card key={pf.id} padding={20}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:pfColors[i] }}/>
                <span style={{ fontFamily:"var(--tf-font-sans)", fontSize:12, fontWeight:600, color:C.sub }}>
                  {pf.name}
                </span>
                <Chip tone="flat" size="sm">{pf.rebalance}</Chip>
                {hasContrib && (
                  <Chip tone="accent" size="sm">
                    {pf.contribution > 0 ? "+" : ""}${pf.contribution}/mo
                  </Chip>
                )}
              </div>
              <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
                <span style={{
                  fontFamily:"var(--tf-font-sans)", fontWeight:800, fontSize:36,
                  letterSpacing:"-0.03em", lineHeight:1, fontVariantNumeric:"tabular-nums",
                  color: m ? (pos ? C.green : C.red) : C.borderMd,
                }}>
                  {m ? fmtCurrency(m.finalValue) : busy ? "…" : "—"}
                </span>
                {m && <Signed value={parseFloat(m.totalReturn)} size="md"/>}
              </div>
              {m && hasContrib && (
                <div style={{ fontFamily:"var(--tf-font-sans)", fontSize:12,
                  color:C.muted, marginBottom:8, fontVariantNumeric:"tabular-nums" }}>
                  {fmtCurrency(m.deposited)} invested · Net{" "}
                  <span style={{ color: parseFloat(m.trueProfit) >= 0 ? C.green : C.red, fontWeight:700 }}>
                    {parseFloat(m.trueProfit) >= 0 ? "+" : ""}{fmtCurrency(m.trueProfit)}
                  </span>
                </div>
              )}
              {m && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginTop:12,
                  paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                  <Stat label="CAGR" value={m.cagr ? `${m.cagr}%` : "—"} size="md"/>
                  <Stat label="Sharpe" value={m.sharpe} size="md"/>
                  <Stat label="DD max" value={`−${m.maxDD}%`} size="md" tone="neg"/>
                  <Stat label="Vol" value={`${m.volatility}%`} size="md"/>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <Card padding={0} style={{ overflow:"hidden" }}>
        <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`,
          overflowX:"auto", background:"#fff" }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"14px 18px", border:0, background:"transparent",
                  color: active ? C.text : C.muted,
                  fontFamily:"var(--tf-font-sans)", fontWeight: active ? 700 : 500,
                  fontSize:13, cursor:"pointer", whiteSpace:"nowrap",
                  borderBottom:`2.5px solid ${active ? C.text : "transparent"}`,
                  transition:"all .15s",
                }}>
                <Icon name={t.icon} size={14}/>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div key={tab} style={{ padding:24, opacity: busy ? 0.5 : 1, transition:"opacity .3s",
          minHeight:chartH + 60, animation:"tf-fadein .25s ease both" }}>

          {/* ── PERFORMANCE ── */}
          {tab === "perf" && hasData && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <Caps>Cumulative performance · {fmtCurrency(INITIAL_VALUE)} initial</Caps>
              </div>
              <ResponsiveContainer width="100%" height={chartH}>
                <LineChart data={fmtChart} margin={{ top:5, right:60, left:0, bottom:0 }}>
                  <CartesianGrid stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd"/>
                  <YAxis {...axisProps} tickFormatter={v => `${v}%`} width={50}/>
                  <YAxis yAxisId="eur" orientation="right" {...axisProps}
                    tickFormatter={v => fmtCurrency(v)} width={60}/>
                  <ReferenceLine y={0} stroke={C.borderHv} strokeDasharray="4 2"/>
                  <Tooltip content={<ChartTip showEur/>}/>
                  <Legend wrapperStyle={{ fontSize:13, fontWeight:600, paddingTop:16, fontFamily:"var(--tf-font-sans)" }}/>
                  {portfolios.map((pf, i) => (
                    <Line key={pf.id} type="monotone" dataKey={pfNames[i]}
                      stroke={pfColors[i]} strokeWidth={2.5} dot={false}
                      activeDot={{ r:5 }} animationDuration={500}/>
                  ))}
                  {portfolios.map((pf, i) => (
                    <Line key={`${pf.id}_val`} type="monotone" dataKey={`${pfNames[i]}_val`}
                      stroke="transparent" dot={false} legendType="none" yAxisId="eur"/>
                  ))}
                  {benchSim && (
                    <Line type="monotone" dataKey="_bench" stroke={C.muted} strokeWidth={1.5}
                      dot={false} strokeDasharray="6 3" name={`${benchmark} (bench)`}/>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </>
          )}

          {/* ── CONTRIBUTIONS ── */}
          {tab === "contrib" && hasData && (
            <>
              <Caps style={{ marginBottom:16 }}>Portfolio value vs capital invested</Caps>
              <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                {portfolios.map((pf, i) => {
                  const sim = simResults[i];
                  if (!sim?.length) return null;
                  const cd = sim.map(r => ({ date: fmtDate(r.date), Value: r.value, Invested: r.deposited }));
                  const last = sim[sim.length - 1];
                  const gain = last ? last.value - last.deposited : null;
                  return (
                    <div key={pf.id}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <span style={{ width:7, height:7, borderRadius:2, background:pfColors[i] }}/>
                        <span style={{ fontFamily:"var(--tf-font-sans)", fontSize:13,
                          fontWeight:700, color:C.sub }}>{pf.name}</span>
                        {gain != null && <Signed value={gain >= 0 ? gain : gain} size="md"
                          suffix={` ${gain >= 0 ? "gain" : "loss"}`} digits={0}/>}
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={cd}>
                          <defs>
                            <linearGradient id={`gv${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={pfColors[i]} stopOpacity={0.2}/>
                              <stop offset="100%" stopColor={pfColors[i]} stopOpacity={0.02}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={C.border} vertical={false}/>
                          <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd"/>
                          <YAxis {...axisProps} tickFormatter={v => fmtCurrency(v)} width={70}/>
                          <Tooltip contentStyle={{ background:"#fff", border:`1px solid ${C.border}`,
                            borderRadius:10, fontSize:12, fontFamily:"var(--tf-font-sans)" }}
                            formatter={v => [fmtCurrency(v)]}/>
                          <Legend wrapperStyle={{ fontSize:12, paddingTop:10, fontFamily:"var(--tf-font-sans)" }}/>
                          <Area type="monotone" dataKey="Value" stroke={pfColors[i]}
                            strokeWidth={2} fill={`url(#gv${i})`}/>
                          <Area type="monotone" dataKey="Invested" stroke={C.muted}
                            strokeWidth={1.5} fill="transparent" strokeDasharray="5 3"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── DRAWDOWN ── */}
          {tab === "dd" && hasData && (
            <>
              <Caps style={{ marginBottom:16 }}>Drawdown from peak</Caps>
              <ResponsiveContainer width="100%" height={Math.round(chartH * 0.65)}>
                <AreaChart data={fmtDrawdown}>
                  <defs>
                    {portfolios.map((_, i) => (
                      <linearGradient key={i} id={`gdd${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={pfColors[i]} stopOpacity={0.2}/>
                        <stop offset="100%" stopColor={pfColors[i]} stopOpacity={0.02}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd"/>
                  <YAxis {...axisProps} tickFormatter={v => `${v}%`} width={50}/>
                  <ReferenceLine y={0} stroke={C.borderHv}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Legend wrapperStyle={{ fontSize:13, fontWeight:600, paddingTop:14, fontFamily:"var(--tf-font-sans)" }}/>
                  {portfolios.map((pf, i) => (
                    <Area key={pf.id} type="monotone" dataKey={pfNames[i]}
                      stroke={pfColors[i]} strokeWidth={2} fill={`url(#gdd${i})`}/>
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              {ddAnalysis.some(d => d.length > 0) && (
                <div style={{ marginTop:24 }}>
                  <Caps style={{ marginBottom:14 }}>Top drawdown periods (&gt; 5%)</Caps>
                  {portfolios.map((pf, i) => {
                    const dds = ddAnalysis[i];
                    if (!dds?.length) return null;
                    return (
                      <div key={i} style={{ marginBottom:16 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8,
                          fontFamily:"var(--tf-font-sans)", fontSize:12, fontWeight:700, color:C.sub }}>
                          <span style={{ width:6, height:6, borderRadius:2, background:pfColors[i] }}/>
                          {pf.name}
                        </div>
                        <div style={{ overflowX:"auto", border:`1px solid ${C.border}`, borderRadius:10 }}>
                          <table style={{ width:"100%", borderCollapse:"collapse" }}>
                            <thead>
                              <tr style={{ background:C.bgAlt }}>
                                {["Start","End","DD max","Duration"].map(h => (
                                  <th key={h} style={{ padding:"8px 14px", textAlign:"left" }}>
                                    <Caps>{h}</Caps>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dds.slice(0, 8).map((d, j) => (
                                <tr key={j} style={{ borderTop:`1px solid ${C.border}` }}>
                                  <td style={{ padding:"8px 14px", fontFamily:"var(--tf-font-sans)",
                                    fontSize:12, color:C.sub, fontVariantNumeric:"tabular-nums" }}>
                                    {fmtMonthYear(d.start)}
                                  </td>
                                  <td style={{ padding:"8px 14px", fontFamily:"var(--tf-font-sans)",
                                    fontSize:12, color:C.sub, fontVariantNumeric:"tabular-nums" }}>
                                    {d.end ? fmtMonthYear(d.end) : <span style={{ color:C.red, fontWeight:700 }}>Ongoing</span>}
                                  </td>
                                  <td style={{ padding:"8px 14px" }}>
                                    <Signed value={d.maxDD} size="sm"/>
                                  </td>
                                  <td style={{ padding:"8px 14px", fontFamily:"var(--tf-font-sans)",
                                    fontSize:12, color:C.sub }}>
                                    {d.duration} {d.duration === 1 ? "period" : "periods"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── HEATMAP ── */}
          {tab === "heatmap" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <Caps>Monthly returns heatmap</Caps>
                {portfolios.length > 1 && (
                  <div style={{ display:"flex", gap:4 }}>
                    {portfolios.map((pf, i) => (
                      <Chip key={i} active={heatPfIdx === i} size="sm"
                        onClick={() => setHeatPfIdx(i)}>
                        {pf.name}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
              <Heatmap data={heatmapData}/>
            </>
          )}

          {/* ── ANNUAL ── */}
          {tab === "annual" && annualRet.length > 0 && (
            <>
              <Caps style={{ marginBottom:16 }}>Annual returns</Caps>
              <ResponsiveContainer width="100%" height={Math.min(chartH, 260)}>
                <BarChart data={annualRet} barCategoryGap="28%">
                  <CartesianGrid stroke={C.border} vertical={false}/>
                  <XAxis dataKey="year" {...axisProps}/>
                  <YAxis {...axisProps} tickFormatter={v => `${v}%`} width={50}/>
                  <ReferenceLine y={0} stroke={C.borderHv}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Legend wrapperStyle={{ fontSize:13, fontWeight:600, paddingTop:14, fontFamily:"var(--tf-font-sans)" }}/>
                  {portfolios.map((pf, i) => (
                    <Bar key={pf.id} dataKey={pfNames[i]} fill={pfColors[i]} radius={[3,3,0,0]} opacity={0.9}/>
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop:22, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:C.bgAlt }}>
                      <th style={{ padding:"10px 16px", textAlign:"left" }}><Caps>Year</Caps></th>
                      {pfNames.map((n, i) => (
                        <th key={i} style={{ padding:"10px 20px", textAlign:"right",
                          fontFamily:"var(--tf-font-sans)", fontSize:11, fontWeight:700,
                          color:pfColors[i], letterSpacing:"0.05em" }}>{n}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...annualRet].reverse().map(row => {
                      const nums = pfNames.map(n => row[n]).filter(v => v != null);
                      const best = nums.length > 1 ? Math.max(...nums) : null;
                      return (
                        <tr key={row.year} style={{ borderBottom:`1px solid ${C.border}` }}>
                          <td style={{ padding:"9px 16px", fontFamily:"var(--tf-font-sans)",
                            fontVariantNumeric:"tabular-nums", fontSize:12, fontWeight:600, color:C.sub }}>
                            {row.year}
                          </td>
                          {pfNames.map((n, i) => {
                            const v = row[n];
                            const isBest = best != null && v === best;
                            return (
                              <td key={i} style={{
                                padding:"9px 20px", textAlign:"right",
                                fontFamily:"var(--tf-font-sans)", fontVariantNumeric:"tabular-nums",
                                fontSize:13, fontWeight: isBest ? 700 : 500,
                                background: isBest ? C.greenLt : "transparent",
                                color: v == null ? C.muted : v >= 0 ? C.green : C.red,
                                borderLeft: isBest ? `2px solid ${C.green}` : "2px solid transparent",
                              }}>
                                {v != null ? `${v >= 0 ? "+" : ""}${v}%` : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── ROLLING ── */}
          {tab === "rolling" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <Caps>Rolling annualized returns · {rollingWin}-year window</Caps>
                <div style={{ display:"flex", gap:4 }}>
                  {[1, 3, 5].map(w => (
                    <Chip key={w} active={rollingWin === w} size="sm"
                      onClick={() => setRollingWin(w)}>
                      {w}Y
                    </Chip>
                  ))}
                </div>
              </div>
              {fmtRolling.length > 0 ? (
                <ResponsiveContainer width="100%" height={chartH}>
                  <LineChart data={fmtRolling}>
                    <CartesianGrid stroke={C.border} vertical={false}/>
                    <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd"/>
                    <YAxis {...axisProps} tickFormatter={v => `${v}%`} width={50}/>
                    <ReferenceLine y={0} stroke={C.borderHv} strokeDasharray="4 2"/>
                    <Tooltip content={<ChartTip/>}/>
                    <Legend wrapperStyle={{ fontSize:13, fontWeight:600, paddingTop:14, fontFamily:"var(--tf-font-sans)" }}/>
                    {portfolios.map((pf, i) => (
                      <Line key={pf.id} type="monotone" dataKey={pfNames[i]}
                        stroke={pfColors[i]} strokeWidth={2} dot={false}/>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign:"center", color:C.muted, padding:"60px 0",
                  fontFamily:"var(--tf-font-sans)", fontSize:14 }}>
                  Period too short for {rollingWin}-year rolling returns.
                </div>
              )}
            </>
          )}

          {/* ── DISTRIBUTION ── */}
          {tab === "dist" && distData.length > 0 && (
            <>
              <Caps style={{ marginBottom:16 }}>Return distribution per period</Caps>
              <ResponsiveContainer width="100%" height={chartH}>
                <BarChart data={distData}>
                  <CartesianGrid stroke={C.border} vertical={false}/>
                  <XAxis dataKey="range" {...axisProps} interval={Math.floor(distData.length / 8)}/>
                  <YAxis {...axisProps}/>
                  <Tooltip contentStyle={{ background:"#fff", border:`1px solid ${C.border}`,
                    borderRadius:10, fontSize:12, fontFamily:"var(--tf-font-sans)" }}/>
                  <Legend wrapperStyle={{ fontSize:13, fontWeight:600, paddingTop:14, fontFamily:"var(--tf-font-sans)" }}/>
                  {portfolios.map((pf, i) => (
                    <Bar key={pf.id} dataKey={pfNames[i]} fill={pfColors[i]} radius={[2,2,0,0]} opacity={0.85}/>
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize:11, color:C.muted, marginTop:10, fontFamily:"var(--tf-font-sans)" }}>
                Bins use the 1%–99% percentile range (excludes outliers). A wider distribution means higher volatility.
              </div>
            </>
          )}

          {/* ── SCATTER ── */}
          {tab === "scatter" && scatterData.length > 0 && (
            <>
              <Caps style={{ marginBottom:16 }}>Risk vs return — ideal: upper left</Caps>
              <ResponsiveContainer width="100%" height={chartH}>
                <ScatterChart margin={{ top:30, right:40, left:10, bottom:30 }}>
                  <CartesianGrid stroke={C.border}/>
                  <XAxis type="number" dataKey="vol" {...axisProps}
                    tickFormatter={v => `${v}%`}
                    label={{ value:"Annualized volatility (%)", position:"insideBottom", offset:-15,
                      fill:C.muted, fontSize:11, fontFamily:"var(--tf-font-sans)" }}/>
                  <YAxis type="number" dataKey="cagr" {...axisProps}
                    tickFormatter={v => `${v}%`} width={55}
                    label={{ value:"CAGR (%)", angle:-90, position:"insideLeft",
                      fill:C.muted, fontSize:11, fontFamily:"var(--tf-font-sans)" }}/>
                  <ZAxis range={[280, 280]}/>
                  <ReferenceLine y={0} stroke={C.borderHv} strokeDasharray="4 2"/>
                  <Tooltip cursor={{ strokeDasharray:"3 3" }}
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div style={{ background:"#fff", border:`1px solid ${C.border}`,
                          borderRadius:10, padding:"10px 14px", boxShadow:"0 4px 16px rgba(10,10,10,0.10)" }}>
                          <div style={{ fontFamily:"var(--tf-font-sans)", fontWeight:700,
                            fontSize:13, marginBottom:6, color:d.color }}>{d.name}</div>
                          <div style={{ fontFamily:"var(--tf-font-sans)", fontSize:12, color:C.sub, lineHeight:1.7 }}>
                            CAGR: <span style={{ fontWeight:700, color: d.cagr >= 0 ? C.green : C.red,
                              fontVariantNumeric:"tabular-nums" }}>
                              {d.cagr >= 0 ? "+" : ""}{d.cagr?.toFixed(2)}%
                            </span><br/>
                            Volatility: <span style={{ fontWeight:700, color:C.text,
                              fontVariantNumeric:"tabular-nums" }}>{d.vol?.toFixed(2)}%</span>
                            {d.sharpe && (
                              <><br/>Sharpe: <span style={{ fontWeight:700,
                                color: d.sharpe >= 1 ? C.green : C.sub,
                                fontVariantNumeric:"tabular-nums" }}>{d.sharpe?.toFixed(2)}</span></>
                            )}
                          </div>
                        </div>
                      );
                    }}/>
                  <Scatter data={scatterData}>
                    {scatterData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                    <LabelList dataKey="name" position="top" offset={12} fill={C.text}
                      fontSize={12} fontWeight={700} fontFamily="var(--tf-font-sans)"/>
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </>
          )}

          {/* ── PER ASSET ── */}
          {tab === "assets" && hasData && (
            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              {portfolios.map((pf, i) => {
                const ac = buildAssetChart(pf.holdings, priceCache, period);
                if (!ac.length) return null;
                const fmtAc = ac.map(r => ({ ...r, date: fmtDate(r.date) }));
                return (
                  <div key={pf.id}>
                    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:14,
                      fontFamily:"var(--tf-font-sans)", fontSize:13, fontWeight:700, color:C.sub }}>
                      <span style={{ width:7, height:7, borderRadius:2, background:pfColors[i] }}/>
                      {pf.name}
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={fmtAc}>
                        <CartesianGrid stroke={C.border} vertical={false}/>
                        <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd"/>
                        <YAxis {...axisProps} tickFormatter={v => `${v}%`} width={50}/>
                        <ReferenceLine y={0} stroke={C.borderHv} strokeDasharray="4 2"/>
                        <Tooltip content={<ChartTip/>}/>
                        <Legend wrapperStyle={{ fontSize:12, paddingTop:12, fontFamily:"var(--tf-font-sans)" }}/>
                        {pf.holdings.map(h => (
                          <Line key={h.sym} type="monotone" dataKey={h.sym}
                            stroke={ASSET_COLORS[h.sym] || C.muted} strokeWidth={1.5} dot={false}/>
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STATISTICS ── */}
          {tab === "stats" && allMetrics.some(Boolean) && (
            <>
              <Caps style={{ marginBottom:16 }}>Detailed metrics · best value highlighted in green</Caps>
              <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:C.bgAlt }}>
                      <th style={{ padding:"11px 16px", textAlign:"left", width:220 }}>
                        <Caps>Metric</Caps>
                      </th>
                      {portfolios.map((pf, i) => (
                        <th key={i} style={{ padding:"11px 20px", textAlign:"right" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:5,
                            fontFamily:"var(--tf-font-sans)", fontSize:11, fontWeight:700,
                            color:pfColors[i], letterSpacing:"0.05em" }}>
                            <span style={{ width:6, height:6, borderRadius:2, background:pfColors[i] }}/>
                            {pf.name}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label:"Total return",         get:m => m?.totalReturn,  fmt:v => `${parseFloat(v) >= 0 ? "+" : ""}${v}%`, isGood:true },
                      { label:"Final value",          get:m => m?.finalValue,   fmt:fmtCurrency, isGood:true },
                      { label:"Capital invested",     get:m => m?.deposited,    fmt:fmtCurrency, isGood:null },
                      { label:"Net profit",           get:m => m?.trueProfit,   fmt:v => fmtCurrency(v), isGood:true },
                      { label:"CAGR",                 get:m => m?.cagr,         fmt:v => v ? `${parseFloat(v) >= 0 ? "+" : ""}${v}%` : "N/A", isGood:true },
                      { label:"Sharpe ratio",         get:m => m?.sharpe,       fmt:v => v, isGood:true },
                      { label:"Sortino ratio",        get:m => m?.sortino,      fmt:v => v, isGood:true },
                      { label:"Calmar ratio",         get:m => m?.calmar,       fmt:v => v, isGood:true },
                      { label:"Max drawdown",         get:m => m?.maxDD,        fmt:v => `−${v}%`, isGood:false },
                      { label:"Annualized vol",       get:m => m?.volatility,   fmt:v => `${v}%`, isGood:false },
                      { label:"Beta vs benchmark",    get:m => m?.beta,         fmt:v => v, isGood:null },
                      { label:"Alpha vs benchmark",   get:m => m?.alpha,        fmt:v => v != null && v !== "—" ? `${parseFloat(v) >= 0 ? "+" : ""}${v}%` : "—", isGood:true },
                      { label:"Correlation w/ bench", get:m => m?.correlation,  fmt:v => v, isGood:null },
                      { label:"Win rate",             get:m => m?.winRate,      fmt:v => `${v}%`, isGood:true },
                      { label:"Best period",          get:m => m?.best,         fmt:v => `+${v}%`, isGood:true },
                      { label:"Worst period",         get:m => m?.worst,        fmt:v => `${v}%`, isGood:false },
                      { label:"Years analyzed",       get:m => m?.years,        fmt:v => `${v}y`, isGood:null },
                    ].map(row => (
                      <StatRow key={row.label} {...row} metrics={allMetrics}
                        getValue={row.get}/>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
