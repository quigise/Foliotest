import { useState, useEffect, useRef, Component } from "react";
import { C } from "../lib/tokens";

// ─── Lucide icon loader ──────────────────────────────────────────────────────
// We use lucide-react via CDN script tag in index.html, accessed via window.lucide
export function Icon({ name, size = 16, color, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.setAttribute("data-lucide", name);
      ref.current.innerHTML = "";
      window.lucide.createIcons({
        attrs: { width: size, height: size, "stroke-width": 1.5 },
        nameAttr: "data-lucide",
      });
    }
  }, [name, size]);
  return <i ref={ref} data-lucide={name}
    style={{ width: size, height: size, display: "inline-flex",
      color: color || "currentColor", flexShrink: 0, ...style }} />;
}

// ─── Button ──────────────────────────────────────────────────────────────────
export function Button({ kind = "primary", size = "md", children, onClick, disabled, icon, iconRight, style, type = "button" }) {
  const [hover, setHover] = useState(false);
  const base = {
    fontFamily: "var(--tf-font-sans)", fontWeight: 600, border: 0,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
    borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 8,
    transition: "background 120ms, border-color 120ms", whiteSpace: "nowrap",
  };
  const sizes = {
    sm: { padding: "7px 12px", fontSize: 13 },
    md: { padding: "10px 16px", fontSize: 14 },
    lg: { padding: "12px 22px", fontSize: 15 },
  };
  const kinds = {
    primary:   { background: hover ? "#000" : C.text, color: "#fff" },
    secondary: { background: hover ? C.bgAlt : "#fff", color: C.text, border: `1px solid ${hover ? C.borderMd : C.borderHv}` },
    ghost:     { background: hover ? C.bgHover : "transparent", color: C.text },
    pos:       { background: hover ? C.greenDk : C.green, color: "#fff" },
    danger:    { background: hover ? C.redDk : C.red, color: "#fff" },
  };
  return (
    <button type={type} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...base, ...sizes[size], ...kinds[kind], ...style }}
      onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16}/>}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 14 : 16}/>}
    </button>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────────────
export function Chip({ children, tone = "neutral", active, onClick, size = "md", style }) {
  const tones = {
    neutral: { background: active ? C.text : "#fff", color: active ? "#fff" : C.text, border: `1px solid ${active ? C.text : C.borderHv}` },
    pos:     { background: C.greenLt, color: C.greenDk, border: `1px solid ${C.greenBd}` },
    neg:     { background: C.redLt, color: C.redDk, border: `1px solid ${C.redBd}` },
    flat:    { background: C.bgHover, color: C.sub, border: `1px solid ${C.border}` },
    accent:  { background: C.indigoLt, color: C.indigo2, border: `1px solid ${C.indigoBd}` },
  };
  const pad = size === "sm" ? "4px 10px" : "6px 12px";
  const fs  = size === "sm" ? 12 : 13;
  return (
    <span onClick={onClick}
      style={{ display:"inline-flex", alignItems:"center", gap:6, padding:pad,
        fontFamily:"var(--tf-font-sans)", fontWeight:600, fontSize:fs, lineHeight:1,
        borderRadius:999, fontVariantNumeric:"tabular-nums",
        cursor: onClick ? "pointer" : "default", ...tones[tone], ...style }}>
      {children}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, onClick, hoverable, padding = 24 }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff", border: "1px solid #EDEDED", borderRadius: 14, padding,
        boxShadow: hoverable && hover ? "0 1px 2px rgba(10,10,10,0.04)" : "none",
        transition: "box-shadow 120ms, border-color 120ms",
        cursor: onClick ? "pointer" : "default",
        borderColor: hoverable && hover ? C.borderHv : C.border,
        ...style,
      }}>{children}</div>
  );
}

// ─── Caps (label) ────────────────────────────────────────────────────────────
export function Caps({ children, style, color }) {
  return <div style={{
    fontFamily: "var(--tf-font-sans)", fontWeight: 600, fontSize: 11,
    letterSpacing: "0.08em", textTransform: "uppercase",
    color: color || C.muted, ...style,
  }}>{children}</div>;
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ prefix, suffix, value, onChange, placeholder, type = "text", style, autoFocus, onKeyDown, onBlur }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", border: `1px solid ${C.borderHv}`,
      borderRadius: 6, overflow: "hidden", background: "#fff", ...style,
    }}>
      {prefix && (
        <span style={{ padding:"10px 12px", background:C.bgAlt, borderRight:`1px solid ${C.borderHv}`,
          fontFamily:"var(--tf-font-sans)", fontSize:13, color:C.muted, fontWeight:600 }}>
          {prefix}
        </span>
      )}
      <input
        autoFocus={autoFocus}
        type={type}
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{
          border: 0, padding: "10px 12px", flex: 1,
          fontFamily: "var(--tf-font-sans)", fontSize: 14, fontWeight: 500,
          fontVariantNumeric: "tabular-nums", outline: "none", minWidth: 0,
          background: "transparent", color: C.text,
        }}
      />
      {suffix && (
        <span style={{ padding:"10px 12px", background:C.bgAlt, borderLeft:`1px solid ${C.borderHv}`,
          fontFamily:"var(--tf-font-sans)", fontSize:13, color:C.muted, fontWeight:600 }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── Segmented control ───────────────────────────────────────────────────────
export function Segmented({ options, value, onChange, size = "md" }) {
  const pad = size === "sm" ? "6px 10px" : "8px 14px";
  const fs  = size === "sm" ? 12 : 13;
  return (
    <div style={{ display:"inline-flex", border:`1px solid ${C.borderHv}`, borderRadius:8, overflow:"hidden", background:"#fff" }}>
      {options.map((o, i) => {
        const v = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const active = v === value;
        return (
          <button key={v} onClick={() => onChange(v)}
            style={{
              border: 0, background: active ? C.text : "transparent",
              color: active ? "#fff" : C.text2, padding: pad,
              fontFamily: "var(--tf-font-sans)", fontWeight: 600, fontSize: fs,
              cursor: "pointer", borderRight: i < options.length - 1 ? `1px solid ${C.borderHv}` : 0,
              transition: "background 120ms",
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
export function Tooltip({ children, content, side = "top" }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position:"relative", display:"inline-flex" }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      {open && (
        <span style={{
          position: "absolute",
          [side === "top" ? "bottom" : "top"]: "calc(100% + 8px)",
          left: "50%", transform: "translateX(-50%)",
          background: C.text, color: "#fff",
          padding: "8px 12px", borderRadius: 8,
          fontFamily: "var(--tf-font-sans)", fontSize: 12, fontWeight: 500,
          lineHeight: 1.4, whiteSpace: "normal", width: 220, zIndex: 50,
          pointerEvents: "none", boxShadow: "0 4px 16px rgba(10,10,10,0.12)",
          textAlign: "left",
        }}>{content}</span>
      )}
    </span>
  );
}

// ─── Signed number ───────────────────────────────────────────────────────────
export function Signed({ value, suffix = "%", digits = 2, size = "md", weight = 700 }) {
  const sizes = { sm: 13, md: 14, lg: 18, xl: 28, xxl: 40 };
  if (value == null || !isFinite(value)) {
    return <span style={{ fontFamily:"var(--tf-font-sans)", fontWeight: weight, color:C.muted, fontSize:sizes[size] || size }}>—</span>;
  }
  const pos = value >= 0;
  const sign = pos ? "+" : "−";
  const n = Math.abs(value).toFixed(digits);
  return (
    <span style={{
      fontFamily: "var(--tf-font-sans)", fontWeight: weight,
      color: pos ? C.green : C.red,
      fontSize: sizes[size] || size, fontVariantNumeric: "tabular-nums",
      letterSpacing: (sizes[size] || size) >= 24 ? "-0.02em" : 0,
    }}>{sign}{n}{suffix}</span>
  );
}

// ─── Slider with colored fill track ──────────────────────────────────────────
export function Slider({ value, min = 0, max = 100, step = 0.5, onChange, color = C.text }) {
  return (
    <div style={{ position:"relative", width:"100%", height:20, display:"flex", alignItems:"center" }}>
      <div style={{ position:"absolute", left:0, right:0, height:4, background:C.border, borderRadius:999 }}/>
      <div style={{
        position: "absolute", left: 0,
        width: `${((value - min) / (max - min)) * 100}%`,
        height: 4, background: color, borderRadius: 999,
        transition: "width 120ms",
      }}/>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ position:"absolute", inset:0, width:"100%", margin:0,
          opacity:0, cursor:"pointer", appearance:"none" }}
      />
      <div style={{
        position: "absolute",
        left: `calc(${((value - min) / (max - min)) * 100}% - 9px)`,
        width: 18, height: 18, borderRadius: 999, background: "#fff",
        border: `2px solid ${color}`, pointerEvents: "none",
        transition: "left 120ms",
      }}/>
    </div>
  );
}

// ─── Asset dot ───────────────────────────────────────────────────────────────
export function AssetDot({ sym, size = 28, color }) {
  const bg = color || C.muted;
  const display = sym && sym.includes("-") ? sym.split("-")[0].slice(0, 3) : sym?.slice(0, sym.length > 3 ? 2 : 1) || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--tf-font-sans)", fontWeight: 700,
      fontSize: size * (display.length > 2 ? 0.32 : 0.4),
      flexShrink: 0, letterSpacing: "-0.02em",
    }}>{display}</div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 14, color = C.text }) {
  return <div style={{
    width: size, height: size, border: `2px solid ${C.border}`,
    borderTop: `2px solid ${color}`, borderRadius: "50%",
    animation: "tf-spin 0.7s linear infinite", flexShrink: 0,
  }}/>;
}

// ─── Stat (small metric block) ───────────────────────────────────────────────
export function Stat({ label, value, tip, tone, size = "lg" }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
        <Caps>{label}</Caps>
        {tip && <Tooltip content={tip}><Icon name="help-circle" size={12} color={C.faint}/></Tooltip>}
      </div>
      <div style={{
        fontFamily: "var(--tf-font-sans)", fontWeight: 700,
        fontSize: size === "lg" ? 20 : size === "xl" ? 28 : 16,
        fontVariantNumeric: "tabular-nums",
        color: tone === "neg" ? C.red : tone === "pos" ? C.green : C.text,
        letterSpacing: "-0.015em",
      }}>{value}</div>
    </div>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, max = 100, color = C.indigo }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width:"100%", height:4, background:C.border, borderRadius:99, overflow:"hidden" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width .3s" }}/>
    </div>
  );
}

// ─── Status pill (loading / ok / error / badTicker) ──────────────────────────
export function StatusPill({ id, status, errMsg }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    setGone(false);
    if (status === "ok") { const t = setTimeout(() => setGone(true), 5000); return () => clearTimeout(t); }
  }, [status]);
  if (gone) return null;
  const cfg = {
    ok:        { bg: C.greenLt, color: C.greenDk, bd: C.greenBd, icon: "✓" },
    error:     { bg: C.redLt,   color: C.redDk,   bd: C.redBd,   icon: "✕" },
    badTicker: { bg: "#FFFBEB", color: "#B45309", bd: "#FDE68A", icon: "?" },
    loading:   { bg: "#fff",    color: C.muted,   bd: C.border,  icon: null },
  };
  const c = cfg[status] || cfg.loading;
  return (
    <span title={errMsg} style={{
      display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px",
      borderRadius:999, fontSize:11, fontWeight:600,
      background:c.bg, color:c.color, border:`1px solid ${c.bd}`,
      fontFamily:"var(--tf-font-sans)", fontVariantNumeric:"tabular-nums",
    }}>
      {status === "loading"
        ? <Spinner size={8} color={c.color}/>
        : <span style={{width:5,height:5,borderRadius:"50%",background:c.color,display:"inline-block"}}/>}
      {id} {c.icon}
    </span>
  );
}

// ─── Error boundary ──────────────────────────────────────────────────────────
export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Boundary caught:", error, info); }
  reset = () => this.setState({ error: null });
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding:30, textAlign:"center", color:C.muted, fontSize:13 }}>
          <div style={{ fontSize:30, marginBottom:10 }}>⚠</div>
          <div style={{ fontWeight:700, marginBottom:6, color:C.red }}>Something broke in this section</div>
          <div style={{ fontFamily:"monospace", fontSize:11, marginBottom:14 }}>{this.state.error.message}</div>
          <Button kind="primary" size="sm" onClick={this.reset}>Try again</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
