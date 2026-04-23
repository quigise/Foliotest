// ═══════════════════════════════════════════════════════════════════════════
//  FOLIOTEST DESIGN SYSTEM — tokens, colors, constants
// ═══════════════════════════════════════════════════════════════════════════

// ─── Palette (from Claude Design export) ─────────────────────────────────────
export const C = {
  // Surfaces
  bg:       "#FFFFFF",
  bgAlt:    "#FAFAFA",
  bgHover:  "#F5F5F5",
  surface:  "#FFFFFF",

  // Borders
  border:   "#EDEDED",
  borderHv: "#E0E0E0",
  borderMd: "#CFCFCF",

  // Text
  text:     "#0A0A0A",
  text2:    "#404040",
  sub:      "#525252",
  muted:    "#737373",
  faint:    "#A3A3A3",

  // Brand & accents
  indigo:   "#4F46E5",
  indigoLt: "#EEF0FF",
  indigoBd: "#E0E3FB",
  indigo2:  "#6366F1",

  // Performance
  green:    "#059669",
  greenDk:  "#047857",
  greenLt:  "#ECFDF5",
  greenBd:  "#A7F3D0",

  red:      "#DC2626",
  redDk:    "#B91C1C",
  redLt:    "#FEF2F2",
  redBd:    "#FECACA",

  // Other
  amber:    "#D97706",
  amberLt:  "#FBBF24",
  cyan:     "#0EA5E9",
  emerald:  "#10B981",
  violet:   "#8B5CF6",
  slate:    "#374151",
  gray:     "#6B7280",
};

// Asset-specific colors (from Foliotest)
export const ASSET_COLORS = {
  VTI:     "#4F46E5", QQQ:  "#0EA5E9", SPY:  "#0A0A0A", VXUS: "#10B981",
  BND:     "#6B7280", TLT:  "#374151", GLD:  "#D97706", "BTC-USD": "#F59E0B",
  "ETH-USD":"#7C3AED","SOL-USD":"#16A34A", VNQ:  "#8B5CF6",
  AAPL:    "#111111", MSFT: "#0284C7", NVDA: "#16A34A", TSLA: "#DC2626",
  GOOGL:   "#7C3AED", META: "#0EA5E9", AMZN: "#D97706", "BRK-B": "#0A0A0A",
  JPM:     "#1D4ED8", V:    "#4F46E5", NFLX: "#DC2626",
  "IWDA.AS":"#10B981","CW8.PA":"#7C3AED",ARKK: "#F59E0B", VBR:  "#6366F1",
  SHY:     "#9CA3AF", TIP:  "#10B981", HYG:  "#D97706", BND2: "#6B7280",
  DBC:     "#D97706", SLV:  "#9CA3AF", "BNB-USD":"#F0B90B", "XRP-USD":"#0EA5E9",
};

export const PF_COLORS = ["#4F46E5", "#0A0A0A", "#0EA5E9", "#059669"];

// ─── Constants ───────────────────────────────────────────────────────────────
export const PERIODS = [
  {label:"1M",  days:30,   interval:"1d"},
  {label:"3M",  days:90,   interval:"1d"},
  {label:"6M",  days:180,  interval:"1d"},
  {label:"1Y",  days:365,  interval:"1wk"},
  {label:"3Y",  days:1095, interval:"1mo"},
  {label:"5Y",  days:1825, interval:"1mo"},
  {label:"10Y", days:3650, interval:"1mo"},
  {label:"Max", days:7300, interval:"1mo"},
];

export const REBALANCE = ["Monthly", "Quarterly", "Annual", "Bands 5%", "Never"];

export const PRESETS = [
  {
    id: "long-term-etf", name: "Long-term ETF", tag: "Boring & solid",
    desc: "Diversified equity + bonds. Set it and forget it.",
    holdings: [
      { sym:"VTI",  weight: 50 },
      { sym:"VXUS", weight: 25 },
      { sym:"BND",  weight: 25 },
    ],
    rebalance: "Quarterly",
  },
  {
    id: "aggressive", name: "Aggressive growth", tag: "High risk · high reward",
    desc: "Tilted toward tech and growth. Expect volatility.",
    holdings: [
      { sym:"QQQ",  weight: 50 },
      { sym:"VTI",  weight: 30 },
      { sym:"BTC-USD", weight: 10 },
      { sym:"NVDA", weight: 10 },
    ],
    rebalance: "Quarterly",
  },
  {
    id: "all-weather", name: "All Weather", tag: "Designed for any climate",
    desc: "Inspired by Ray Dalio. Balanced across regimes.",
    holdings: [
      { sym:"VTI", weight: 30 },
      { sym:"TLT", weight: 40 },
      { sym:"GLD", weight: 15 },
      { sym:"BND", weight: 15 },
    ],
    rebalance: "Annual",
  },
  {
    id: "sixty-forty", name: "60/40 Classic", tag: "Time-tested",
    desc: "Decades-old benchmark. Equity ballast meets bond stability.",
    holdings: [
      { sym:"SPY", weight: 60 },
      { sym:"BND", weight: 40 },
    ],
    rebalance: "Annual",
  },
  {
    id: "faang", name: "FAANG+", tag: "Concentrated tech",
    desc: "Pure mega-cap technology bet. Maximum upside, maximum drawdown.",
    holdings: [
      { sym:"AAPL", weight: 20 },
      { sym:"MSFT", weight: 20 },
      { sym:"GOOGL",weight: 20 },
      { sym:"META", weight: 20 },
      { sym:"AMZN", weight: 20 },
    ],
    rebalance: "Quarterly",
  },
  {
    id: "crypto-core", name: "Crypto Core", tag: "Digital assets",
    desc: "Bitcoin-dominant with ETH and SOL. Extreme volatility.",
    holdings: [
      { sym:"BTC-USD", weight: 60 },
      { sym:"ETH-USD", weight: 30 },
      { sym:"SOL-USD", weight: 10 },
    ],
    rebalance: "Quarterly",
  },
];

export const ASSET_GROUPS = {
  "Equities":   ["AAPL","MSFT","AMZN","NVDA","GOOGL","META","TSLA","BRK-B","JPM","V","NFLX"],
  "ETFs":       ["SPY","QQQ","VTI","VXUS","IWDA.AS","CW8.PA","VNQ","ARKK","VBR"],
  "Crypto":     ["BTC-USD","ETH-USD","SOL-USD","BNB-USD","XRP-USD"],
  "Bonds & Gold": ["TLT","SHY","BND","GLD","SLV","TIP","HYG","DBC"],
};

export const ASSET_META = {
  // Equities
  AAPL:  { name: "Apple",          cls: "Equities" },
  MSFT:  { name: "Microsoft",      cls: "Equities" },
  AMZN:  { name: "Amazon",         cls: "Equities" },
  NVDA:  { name: "NVIDIA",         cls: "Equities" },
  GOOGL: { name: "Alphabet",       cls: "Equities" },
  META:  { name: "Meta",           cls: "Equities" },
  TSLA:  { name: "Tesla",          cls: "Equities" },
  "BRK-B":{ name: "Berkshire B",   cls: "Equities" },
  JPM:   { name: "JPMorgan",       cls: "Equities" },
  V:     { name: "Visa",           cls: "Equities" },
  NFLX:  { name: "Netflix",        cls: "Equities" },
  // ETFs
  VTI:   { name: "Total US stock", cls: "ETF" },
  QQQ:   { name: "Nasdaq 100",     cls: "ETF" },
  SPY:   { name: "S&P 500",        cls: "ETF" },
  VXUS:  { name: "International",  cls: "ETF" },
  "IWDA.AS": { name: "MSCI World", cls: "ETF" },
  "CW8.PA":  { name: "MSCI World €", cls: "ETF" },
  VNQ:   { name: "Real estate",    cls: "ETF" },
  ARKK:  { name: "ARK Innovation", cls: "ETF" },
  VBR:   { name: "Small-cap value",cls: "ETF" },
  // Bonds
  BND:   { name: "US bonds",       cls: "Bond" },
  TLT:   { name: "20+yr Treasury", cls: "Bond" },
  SHY:   { name: "1-3yr Treasury", cls: "Bond" },
  TIP:   { name: "TIPS",           cls: "Bond" },
  HYG:   { name: "High yield",     cls: "Bond" },
  // Commodities
  GLD:   { name: "Gold",           cls: "Commodity" },
  SLV:   { name: "Silver",         cls: "Commodity" },
  DBC:   { name: "Commodities",    cls: "Commodity" },
  // Crypto
  "BTC-USD": { name: "Bitcoin",    cls: "Crypto" },
  "ETH-USD": { name: "Ethereum",   cls: "Crypto" },
  "SOL-USD": { name: "Solana",     cls: "Crypto" },
  "BNB-USD": { name: "BNB",        cls: "Crypto" },
  "XRP-USD": { name: "XRP",        cls: "Crypto" },
};

export const INITIAL_VALUE = 10000;
export const MONTHS_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const ROUTES = [
  { id:"onboarding",  label:"New portfolio", icon:"plus-circle" },
  { id:"builder",     label:"Builder",       icon:"layers" },
  { id:"results",     label:"Results",       icon:"line-chart" },
  { id:"compare",     label:"Compare",       icon:"bar-chart-2" },
  { id:"correlation", label:"Correlation",   icon:"grid-3x3" },
];
