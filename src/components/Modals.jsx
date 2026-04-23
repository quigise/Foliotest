import { useState } from "react";
import { Caps, Button, Icon, Input } from "../components/primitives";
import { C } from "../lib/tokens";
import { exportCSV } from "../lib/api";

// ─── Modal shell ─────────────────────────────────────────────────────────────
function Modal({ children, onClose, title, subtitle, width = 560 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:50,
        background:"rgba(10,10,10,.45)", backdropFilter:"blur(4px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        animation:"tf-fadein 0.2s ease",
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:16, width, maxWidth:"calc(100vw - 40px)",
          maxHeight:"calc(100vh - 80px)", overflow:"auto",
          boxShadow:"0 20px 60px rgba(10,10,10,0.25)",
          animation:"tf-modalin 0.25s ease both",
        }}>
        <div style={{ padding:"22px 26px 16px", borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
          <div>
            <h2 style={{ margin:0, fontFamily:"var(--tf-font-sans)", fontWeight:700,
              fontSize:18, letterSpacing:"-0.015em", color:C.text }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin:"4px 0 0", fontFamily:"var(--tf-font-sans)",
                fontSize:13, color:C.muted, lineHeight:1.5 }}>
                {subtitle}
              </p>
            )}
          </div>
          <button onClick={onClose}
            style={{ background:"transparent", border:0, cursor:"pointer",
              color:C.muted, padding:6, borderRadius:6, display:"inline-flex" }}
            onMouseEnter={e => e.currentTarget.style.background = C.bgHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Icon name="x" size={18}/>
          </button>
        </div>
        <div style={{ padding:"22px 26px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Export Modal ────────────────────────────────────────────────────────────
export function ExportModal({ onClose, displayChart, simResults, portfolios, pfNames, period }) {
  const [format, setFormat] = useState("csv");

  const handleExport = () => {
    if (format === "csv") {
      exportCSV(displayChart, simResults, portfolios, pfNames, `foliotest_${period}.csv`);
    } else if (format === "json") {
      const blob = new Blob([JSON.stringify({ portfolios, period, results: simResults }, null, 2)],
        { type: "application/json" });
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), { href:url, download:`foliotest_${period}.json` }).click();
      URL.revokeObjectURL(url);
    } else if (format === "png") {
      window.print();
    }
    onClose();
  };

  const formats = [
    { id:"csv",  label:"CSV",  desc:"Spreadsheet-ready, includes per-period values in $",  icon:"file-text" },
    { id:"json", label:"JSON", desc:"Full data structure for programmatic use",            icon:"code" },
    { id:"png",  label:"Print", desc:"Open browser print dialog (save as PDF or print)",   icon:"printer" },
  ];

  return (
    <Modal onClose={onClose} title="Export results" subtitle="Choose how you want to save your backtest data.">
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
        {formats.map(f => (
          <button key={f.id} onClick={() => setFormat(f.id)}
            style={{
              display:"flex", alignItems:"center", gap:14,
              padding:"14px 16px", border:`1px solid ${format === f.id ? C.text : C.border}`,
              background: format === f.id ? C.bgAlt : "#fff",
              borderRadius:10, cursor:"pointer", textAlign:"left",
              transition:"all 120ms",
            }}>
            <div style={{
              width:38, height:38, borderRadius:8,
              background: format === f.id ? C.text : C.bgHover,
              color: format === f.id ? "#fff" : C.muted,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>
              <Icon name={f.icon} size={18}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"var(--tf-font-sans)", fontWeight:700,
                fontSize:14, color:C.text }}>{f.label}</div>
              <div style={{ fontFamily:"var(--tf-font-sans)", fontSize:12,
                color:C.muted, marginTop:2 }}>{f.desc}</div>
            </div>
            {format === f.id && <Icon name="check" size={16} color={C.text}/>}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Button kind="ghost" onClick={onClose}>Cancel</Button>
        <Button kind="primary" icon="download" onClick={handleExport}>
          Download {format.toUpperCase()}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Share Modal ─────────────────────────────────────────────────────────────
export function ShareModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <Modal onClose={onClose} title="Share this backtest"
      subtitle="The link contains your full configuration — anyone with it can see the same results.">
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <div style={{ flex:1 }}>
          <Input value={url} onChange={() => {}}/>
        </div>
        <Button kind={copied ? "pos" : "primary"} icon={copied ? "check" : "copy"} onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div style={{ padding:"14px 16px", background:C.bgAlt, borderRadius:10,
        fontFamily:"var(--tf-font-sans)", fontSize:12, color:C.muted, lineHeight:1.6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
          <Icon name="info" size={13} color={C.muted}/>
          <Caps>How it works</Caps>
        </div>
        Your portfolios, period, and benchmark are encoded in the URL.
        Recipients see the same view but can edit it independently.
      </div>
    </Modal>
  );
}

// ─── Running screen ──────────────────────────────────────────────────────────
export function RunningScreen({ portfolioName, message }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(255,255,255,0.94)",
      backdropFilter:"blur(4px)", zIndex:40,
      display:"flex", alignItems:"center", justifyContent:"center",
      animation:"tf-fadein 0.2s ease",
    }}>
      <div style={{ textAlign:"center", maxWidth:380 }}>
        <div style={{
          width:56, height:56, margin:"0 auto 20px",
          border:`3px solid ${C.border}`, borderTopColor:C.text,
          borderRadius:999, animation:"tf-spin 0.8s linear infinite",
        }}/>
        <h2 style={{ margin:0, fontFamily:"var(--tf-font-sans)", fontWeight:700,
          fontSize:20, letterSpacing:"-0.015em", color:C.text }}>
          Running backtest
        </h2>
        <p style={{ margin:"6px 0 0", fontFamily:"var(--tf-font-sans)", fontSize:14, color:C.muted }}>
          {message || `Simulating ${portfolioName} with real Yahoo Finance data…`}
        </p>
      </div>
    </div>
  );
}
