import { useState } from "react";
import { Icon, Button, Caps, Spinner, ProgressBar } from "./primitives";
import { C, ROUTES } from "../lib/tokens";

// ─── TopBar ──────────────────────────────────────────────────────────────────
export function TopBar({ onOpenExport, onOpenShare, busy, loadCount, latestDate }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 20, height: 64, background: "#fff",
      borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center",
      padding: "0 24px", gap: 20, flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ display:"flex", alignItems:"center", gap:10, width:216 }}>
        <div style={{ width:30, height:30, background:C.text, borderRadius:8,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ color:"#fff", fontFamily:"var(--tf-font-sans)",
            fontWeight:800, fontSize:14 }}>F</span>
        </div>
        <span style={{ fontFamily:"var(--tf-font-sans)", fontWeight:800, fontSize:19, letterSpacing:"-0.02em" }}>
          Foliotest
        </span>
      </div>

      {/* Search bar */}
      <div style={{ flex:1, maxWidth:420, position:"relative" }}>
        <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
          color:C.faint, display:"flex" }}>
          <Icon name="search" size={15} color={C.faint}/>
        </div>
        <input placeholder="Search tickers — SPY, QQQ, BTC-USD…"
          style={{ width:"100%", padding:"9px 12px 9px 36px",
            border:`1px solid ${C.border}`, background:C.bgAlt, borderRadius:8,
            fontFamily:"var(--tf-font-sans)", fontSize:14, outline:"none",
            boxSizing:"border-box" }}/>
      </div>

      {/* Status (loading or last-data-date) */}
      {busy && loadCount.total > 0 ? (
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Spinner size={12}/>
          <div style={{ width:100 }}>
            <ProgressBar value={loadCount.done} max={loadCount.total}/>
          </div>
          <span style={{ fontSize:11, color:C.muted, fontWeight:500, fontFamily:"var(--tf-font-sans)", whiteSpace:"nowrap" }}>
            {loadCount.done}/{loadCount.total}
          </span>
        </div>
      ) : latestDate ? (
        <div style={{ fontSize:11, color:C.muted, fontFamily:"var(--tf-font-sans)" }}>
          Data through {new Date(latestDate + "T00:00:00Z").toLocaleDateString("en-US", {
            month:"short", day:"numeric", year:"numeric", timeZone:"UTC"
          })}
        </div>
      ) : null}

      <div style={{ flex:1 }}/>

      <Button kind="ghost" size="sm" icon="share-2" onClick={onOpenShare}>Share</Button>
      <Button kind="secondary" size="sm" icon="download" onClick={onOpenExport}>Export</Button>

      <div style={{ width:1, height:24, background:C.border }}/>

      <button style={{ background:"transparent", border:0, width:36, height:36,
        borderRadius:8, cursor:"pointer", display:"inline-flex",
        alignItems:"center", justifyContent:"center" }}>
        <Icon name="bell" size={18}/>
      </button>

      <div style={{ width:32, height:32, borderRadius:999, background:C.text,
        color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"var(--tf-font-sans)", fontWeight:700, fontSize:12 }}>
        FT
      </div>
    </div>
  );
}

// ─── SideNav ─────────────────────────────────────────────────────────────────
export function SideNav({ route, onNav, savedPortfolios, onSelectSaved }) {
  const [hover, setHover] = useState(null);

  return (
    <aside style={{
      width:236, borderRight:`1px solid ${C.border}`, background:"#fff",
      padding:"20px 12px", display:"flex", flexDirection:"column", gap:24,
      flexShrink:0, height:"calc(100vh - 64px)", overflowY:"auto",
    }}>
      {/* Workbench section */}
      <div>
        <Caps style={{ padding:"0 12px", marginBottom:8 }}>Workbench</Caps>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {ROUTES.map(it => {
            const active = route === it.id;
            const isHover = hover === it.id;
            return (
              <button key={it.id} onClick={() => onNav(it.id)}
                onMouseEnter={() => setHover(it.id)} onMouseLeave={() => setHover(null)}
                style={{
                  display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                  border:0, borderRadius:8,
                  background: active ? C.bgHover : isHover ? C.bgAlt : "transparent",
                  color: C.text, fontFamily:"var(--tf-font-sans)", fontSize:14,
                  fontWeight: active ? 600 : 500, cursor:"pointer", textAlign:"left",
                  transition:"background 120ms",
                }}>
                <Icon name={it.icon} size={17}/>
                {it.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Saved portfolios */}
      {savedPortfolios?.length > 0 && (
        <div>
          <Caps style={{ padding:"0 12px", marginBottom:8 }}>Open portfolios</Caps>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {savedPortfolios.map(s => (
              <button key={s.id} onClick={() => onSelectSaved && onSelectSaved(s)}
                style={{
                  display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                  border:0, borderRadius:8, background:"transparent", color:C.text2,
                  fontFamily:"var(--tf-font-sans)", fontSize:13, fontWeight:500,
                  cursor:"pointer", textAlign:"left",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bgAlt}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ width:6, height:6, borderRadius:999, background:s.color || C.borderMd }}/>
                <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {s.name}
                </span>
                {s.ret != null && (
                  <span style={{ fontVariantNumeric:"tabular-nums", fontSize:12,
                    color: s.ret >= 0 ? C.green : C.red, fontWeight:600 }}>
                    {s.ret >= 0 ? "+" : "−"}{Math.abs(s.ret).toFixed(1)}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex:1 }}/>

      {/* Disclaimer card */}
      <div style={{ padding:12, border:`1px solid ${C.border}`, borderRadius:10, background:C.bgAlt }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <Icon name="info" size={14} color={C.muted}/>
          <Caps>Research only</Caps>
        </div>
        <div style={{ fontFamily:"var(--tf-font-sans)", fontSize:12, color:C.muted, lineHeight:1.5 }}>
          Past performance doesn't predict future returns. Data via Yahoo Finance.
        </div>
      </div>
    </aside>
  );
}
