/**
 * Data Source Registry — Honest transparency layer.
 *
 * Lists every data source WhaleEye uses or could use.
 * Status is set truthfully based on what is actually connected.
 * "unavailable" means the UI will show a clear "غير متاح" badge.
 */

export type FeedStatus =
  | "polling"        // REST polling — connected, ~1–5s latency
  | "websocket"      // True WebSocket stream — not yet connected in this env
  | "unavailable"    // Not connected — data source not integrated
  | "demo";          // Synthetic / demo data

export type FeedCategory =
  | "public_exchange"   // Binance public REST/WS
  | "on_chain"          // Blockchain data
  | "smart_money"       // Labeled wallets / institutional flows
  | "derivatives"       // Futures, open interest, funding
  | "premium";          // Premium institutional data providers

export interface DataSource {
  id: string;
  name: string;
  nameAr: string;
  category: FeedCategory;
  status: FeedStatus;
  provider: string;
  latencyNote: string;   // honest latency description
  panels: string[];      // which panels use this source
  pollingMs?: number;    // if polling
  note?: string;         // optional transparency note
}

export const DATA_SOURCES: DataSource[] = [
  // ── PUBLIC EXCHANGE — Binance REST (actually connected) ───────────────
  {
    id: "binance_depth",
    name: "Order Book Depth",
    nameAr: "دفتر الأوامر",
    category: "public_exchange",
    status: "polling",
    provider: "Binance REST API",
    latencyNote: "استطلاع كل 1 ثانية — ليس WebSocket حقيقي",
    panels: ["دفتر الأوامر", "OFI", "الجدران", "المحرك المؤسساتي"],
    pollingMs: 1000,
    note: "يستخدم /api/v3/depth عبر بروكسي خادمنا لتجنب قيود CORS",
  },
  {
    id: "binance_ticker",
    name: "24h Ticker",
    nameAr: "تيكر 24 ساعة",
    category: "public_exchange",
    status: "polling",
    provider: "Binance REST API",
    latencyNote: "استطلاع كل 2 ثانية",
    panels: ["شريط السعر", "الشريط العلوي"],
    pollingMs: 2000,
  },
  {
    id: "binance_klines",
    name: "Candlestick Data",
    nameAr: "بيانات الشموع",
    category: "public_exchange",
    status: "polling",
    provider: "Binance REST API",
    latencyNote: "استطلاع كل 15 ثانية",
    panels: ["الرسم البياني", "SMC", "السيولة", "backtest"],
    pollingMs: 15000,
  },
  // ── PUBLIC EXCHANGE — WebSocket (not connected yet in this env) ───────
  {
    id: "binance_ws_depth",
    name: "Live Order Book Stream",
    nameAr: "دفتر أوامر مباشر (WebSocket)",
    category: "public_exchange",
    status: "unavailable",
    provider: "Binance WebSocket",
    latencyNote: "غير متصل — يتطلب بروكسي WebSocket خادم",
    panels: ["دفتر الأوامر", "CVD", "OFI"],
    note: "WebSocket الخارجي محجوب من بيئة Replit. يحتاج بروكسي WS في api-server",
  },
  {
    id: "binance_ws_trades",
    name: "Aggr. Trade Stream",
    nameAr: "تدفق صفقات مجمعة",
    category: "public_exchange",
    status: "unavailable",
    provider: "Binance WebSocket (aggTrade)",
    latencyNote: "غير متصل — CVD الحالي تقريبي",
    panels: ["CVD"],
    note: "CVD الحالي يعتمد على دلتا سعر × وكيل الحجم — ليس صفقات حقيقية",
  },
  // ── ON-CHAIN ──────────────────────────────────────────────────────────
  {
    id: "onchain_flows",
    name: "Exchange Inflow/Outflow",
    nameAr: "تدفقات البورصات (On-Chain)",
    category: "on_chain",
    status: "unavailable",
    provider: "Glassnode / Nansen / IntoTheBlock",
    latencyNote: "غير متصل — يحتاج مفتاح API مدفوع",
    panels: [],
  },
  {
    id: "onchain_wallets",
    name: "Whale Wallet Tracking",
    nameAr: "تتبع محافظ الحيتان",
    category: "on_chain",
    status: "unavailable",
    provider: "Glassnode / Arkham / Nansen",
    latencyNote: "غير متصل",
    panels: [],
  },
  {
    id: "onchain_stables",
    name: "Stablecoin Deployment",
    nameAr: "نشاط العملات المستقرة",
    category: "on_chain",
    status: "unavailable",
    provider: "Glassnode",
    latencyNote: "غير متصل",
    panels: [],
  },
  // ── SMART MONEY ───────────────────────────────────────────────────────
  {
    id: "smart_money_flows",
    name: "Institutional Flow Tracker",
    nameAr: "تتبع التدفقات المؤسسية",
    category: "smart_money",
    status: "unavailable",
    provider: "Coinalyze / Hyblock",
    latencyNote: "غير متصل",
    panels: [],
  },
  // ── DERIVATIVES ───────────────────────────────────────────────────────
  {
    id: "open_interest",
    name: "Open Interest",
    nameAr: "العقود المفتوحة",
    category: "derivatives",
    status: "polling",
    provider: "Binance Futures REST",
    latencyNote: "استطلاع كل 30 ثانية — بيانات حقيقية",
    panels: ["المحرك المؤسساتي", "تحليل المشتقات"],
    pollingMs: 30000,
    note: "مأخوذة من fapi.binance.com/v1/openInterest — بيانات Binance Futures العامة",
  },
  {
    id: "funding_rate",
    name: "Funding Rate",
    nameAr: "معدل التمويل",
    category: "derivatives",
    status: "polling",
    provider: "Binance Futures REST",
    latencyNote: "استطلاع كل 30 ثانية — سجل 8 فترات",
    panels: ["المحرك المؤسساتي", "تحليل المشتقات"],
    pollingMs: 30000,
    note: "مأخوذة من fapi.binance.com/v1/fundingRate — معدلات تمويل 8-ساعات حقيقية",
  },
  {
    id: "liquidations",
    name: "Liquidation Heatmap",
    nameAr: "خريطة التصفيات",
    category: "derivatives",
    status: "unavailable",
    provider: "Coinglass / Hyblock",
    latencyNote: "غير متصل",
    panels: [],
  },
  // ── PREMIUM ───────────────────────────────────────────────────────────
  {
    id: "premium_orderflow",
    name: "Institutional Order Flow Feed",
    nameAr: "بيانات تدفق الأوامر المؤسسية",
    category: "premium",
    status: "unavailable",
    provider: "Bookmap / VVIX / Exodus Point",
    latencyNote: "غير متصل — يحتاج اشتراك مؤسسي",
    panels: [],
  },
];

export function getConnectedSources(): DataSource[] {
  return DATA_SOURCES.filter(s => s.status === "polling" || s.status === "websocket");
}

export function getUnavailableSources(): DataSource[] {
  return DATA_SOURCES.filter(s => s.status === "unavailable");
}

export function getSourcesForPanel(panelName: string): DataSource[] {
  return DATA_SOURCES.filter(s => s.panels.some(p => p.includes(panelName)));
}

export const CATEGORY_LABELS: Record<FeedCategory, string> = {
  public_exchange:  "بورصة عامة",
  on_chain:         "On-Chain",
  smart_money:      "أموال ذكية",
  derivatives:      "مشتقات",
  premium:          "مؤسسي متقدم",
};

export const STATUS_LABELS: Record<FeedStatus, string> = {
  polling:    "استطلاع REST",
  websocket:  "WebSocket مباشر",
  unavailable:"غير متاح",
  demo:       "بيانات تجريبية",
};
