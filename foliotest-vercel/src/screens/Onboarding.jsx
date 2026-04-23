import { useState } from "react";
import { Caps, Icon, Chip, Button } from "../components/primitives";
import { C, PRESETS, ASSET_COLORS } from "../lib/tokens";

export function Onboarding({ onPickPreset, onBlank }) {
  const [hover, setHover] = useState(null);

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"60px 40px" }}>
      <Caps style={{ marginBottom:12 }}>Step 1 of 3</Caps>
      <h1 style={{ margin:0, fontFamily:"var(--tf-font-sans)", fontWeight:800,
        fontSize:44, letterSpacing:"-0.03em", lineHeight:1.05, color:C.text }}>
        What do you want to test?
      </h1>
      <p style={{ margin:"12px 0 40px", fontFamily:"var(--tf-font-sans)", fontSize:16,
        color:C.sub, maxWidth:580, lineHeight:1.5 }}>
        Pick a starting point. You'll be able to edit weights, tickers, and rebalancing rules on the next screen.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16, marginBottom:40 }}>
        {PRESETS.map(p => {
          const isHover = hover === p.id;
          return (
            <div key={p.id} onClick={() => onPickPreset(p)}
              onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}
              style={{
                background:"#fff", border:`1px solid ${isHover ? C.text : C.border}`,
                borderRadius:14, padding:24, cursor:"pointer",
                transition:"border-color 120ms, transform 120ms",
                display:"flex", flexDirection:"column", gap:16, minHeight:280,
                transform: isHover ? "translateY(-1px)" : "none",
              }}>
              {/* Top row */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <Chip tone={p.id === "aggressive" || p.id === "crypto-core" ? "accent" : "flat"} size="sm">
                  {p.tag}
                </Chip>
                <Icon name="arrow-up-right" size={16} color={isHover ? C.text : C.faint}/>
              </div>

              {/* Title + description */}
              <div>
                <h3 style={{ margin:0, fontFamily:"var(--tf-font-sans)", fontWeight:700,
                  fontSize:20, letterSpacing:"-0.015em", color:C.text }}>
                  {p.name}
                </h3>
                <p style={{ margin:"6px 0 0", fontFamily:"var(--tf-font-sans)",
                  fontSize:13, color:C.muted, lineHeight:1.5 }}>
                  {p.desc}
                </p>
              </div>

              {/* Weight bar */}
              <div style={{ marginTop:"auto" }}>
                <div style={{ display:"flex", height:6, borderRadius:999, overflow:"hidden", marginBottom:12 }}>
                  {p.holdings.map((h, i) => (
                    <div key={i} style={{ flex: h.weight,
                      background: ASSET_COLORS[h.sym] || C.borderMd }}/>
                  ))}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                  {p.holdings.map((h, idx) => (
                    <span key={h.sym} style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                      {idx > 0 && <span style={{ color:C.borderMd, marginRight:2 }}>·</span>}
                      <span style={{ fontFamily:"var(--tf-font-sans)", fontSize:12,
                        color:C.sub, fontVariantNumeric:"tabular-nums" }}>
                        <span style={{ fontWeight:700, color:C.text }}>{h.sym}</span> {h.weight}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Blank portfolio */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"24px 0", borderTop:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontFamily:"var(--tf-font-sans)", fontWeight:600, fontSize:14, color:C.text }}>
            Start from scratch
          </div>
          <div style={{ fontFamily:"var(--tf-font-sans)", fontSize:13, color:C.muted }}>
            Build a custom allocation ticker by ticker.
          </div>
        </div>
        <Button kind="secondary" icon="plus" onClick={onBlank}>Blank portfolio</Button>
      </div>
    </div>
  );
}
