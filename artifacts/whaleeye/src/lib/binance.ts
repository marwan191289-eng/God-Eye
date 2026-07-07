// src/lib/binance.ts
const BINANCE_BASE = "https://api.binance.com";

// ── Symbols (added ETCUSDT, SLXUSDT) ───────────────────────────────────────
export const SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "LTCUSDT",
  "BCHUSDT",
  "AAVEUSDT",
  "ETCUSDT",
] as const;

export type Symbol = (typeof SYMBOLS)[number];

// ── Timeframes (added weekly 1w) ─────────────────────────────────────────
export const TIMEFRAMES = [
  { label: "1د", value: "1m" },
  { label: "5د", value: "5m" },
  { label: "15د", value: "15m" },
  { label: "1س", value: "1h" },
  { label: "4س", value: "4h" },
  { label: "يومي", value: "1d" },
  { label: "أسبوعي", value: "1w" }, // added weekly
] as const;

export type Interval = (typeof TIMEFRAMES)[number]["value"];

// ── Types ────────────────────────────────────────────────────────────────
export interface DepthLevel {
  price: number;
  qty: number;
}

export interface OrderBook {
  bids: DepthLevel[];
  asks: DepthLevel[];
  lastUpdateId: number;
}

export interface Ticker {
  symbol: string;
  last: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
}

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

// ── REST helpers ───────────────────────────────────────────────────────────
async function binanceGet(path: string): Promise<any> {
  const r = await fetch(`/api/binance${path}`);
  if (!r.ok) throw new Error(`Binance API error ${r.status}`);
  return r.json();
}

export function wsUrl(stream: string) {
  // Note: kept original behavior for direct WS usage if needed.
  return `wss://stream.binance.com:9443/ws/${stream}`;
}

export async function fetchDepth(symbol: string, limit = 500): Promise<OrderBook> {
  const j = await binanceGet(`/api/v3/depth?symbol=${symbol}&limit=${limit}`);
  return {
    lastUpdateId: j.lastUpdateId,
    bids: (j.bids as [string, string][]).map(([p, q]) => ({ price: +p, qty: +q })),
    asks: (j.asks as [string, string][]).map(([p, q]) => ({ price: +p, qty: +q })),
  };
}

export async function fetchTicker(symbol: string): Promise<Ticker> {
  const j = await binanceGet(`/api/v3/ticker/24hr?symbol=${symbol}`);
  return {
    symbol: j.symbol,
    last: +j.lastPrice,
    change: +j.priceChange,
    changePct: +j.priceChangePercent,
    high: +j.highPrice,
    low: +j.lowPrice,
    volume: +j.volume,
    quoteVolume: +j.quoteVolume,
  };
}

export async function fetchAllTickers(symbols: readonly string[]): Promise<Ticker[]> {
  const param = encodeURIComponent(JSON.stringify(symbols));
  const arr = (await binanceGet(`/api/v3/ticker/24hr?symbols=${param}`)) as any[];
  return arr.map((j) => ({
    symbol: j.symbol,
    last: +j.lastPrice,
    change: +j.priceChange,
    changePct: +j.priceChangePercent,
    high: +j.highPrice,
    low: +j.lowPrice,
    volume: +j.volume,
    quoteVolume: +j.quoteVolume,
  }));
}

export async function fetchKlines(
  symbol: string,
  interval: Interval,
  limit = 200
): Promise<Kline[]> {
  const arr = (await binanceGet(
    `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  )) as any[][];
  return arr.map((k) => ({
    openTime: k[0],
    open: +k[1],
    high: +k[2],
    low: +k[3],
    close: +k[4],
    volume: +k[5],
    closeTime: k[6],
  }));
}

// ── New: symbol / search helpers ──────────────────────────────────────────

/**
 * Fetch exchangeInfo for a single symbol.
 * Returns the raw exchangeInfo.symbol object or throws if not found.
 */
export async function fetchSymbolInfo(symbol: string): Promise<any> {
  const j = await binanceGet(`/api/v3/exchangeInfo?symbol=${symbol}`);
  // Binance returns { symbols: [...] } even for single symbol; normalize:
  if (j && Array.isArray(j.symbols) && j.symbols.length > 0) return j.symbols[0];
  if (j && j.symbol) return j; // fallback
  throw new Error("symbol not found");
}

/**
 * Check whether a symbol exists on Binance (fast boolean).
 */
export async function symbolExists(symbol: string): Promise<boolean> {
  try {
    await fetchSymbolInfo(symbol);
    return true;
  } catch {
    return false;
  }
}

/**
 * Search symbols by substring (case-insensitive).
 * Useful for "search any coin on Binance".
 * Returns an array of matching symbol strings (e.g., ["ETHUSDT", "ETHBUSD", ...]).
 */
export async function searchSymbols(query: string): Promise<string[]> {
  // fetch full exchangeInfo once and filter locally
  const j = await binanceGet(`/api/v3/exchangeInfo`);
  const all = (j.symbols as any[]) || [];
  const q = query.trim().toUpperCase();
  if (!q) return [];
  return all
    .map((s) => s.symbol as string)
    .filter((sym) => sym.includes(q));
}

/**
 * Fetch combined details for a symbol: exchangeInfo, ticker, and shallow depth.
 * Useful to "check its status and position when it appears".
 */
export async function fetchSymbolDetails(symbol: string) {
  const [info, ticker, depth] = await Promise.all([
    fetchSymbolInfo(symbol),
    fetchTicker(symbol),
    fetchDepth(symbol, 20),
  ]);
  // position in our default SYMBOLS list (if present)
  const index = SYMBOLS.indexOf(symbol as Symbol);
  return { info, ticker, depth, inDefaultList: index >= 0, defaultListIndex: index >= 0 ? index : -1 };
}

// ── Proxy aliases (for compatibility with useBinance.ts changes) ──────────
export const fetchDepthProxy = fetchDepth;
export const fetchTickerProxy = fetchTicker;
export const fetchAllTickersProxy = fetchAllTickers;
export const fetchKlinesProxy = fetchKlines;

// ── FUTURES helpers ────────────────────────────────────────────────────────
async function fapiGet(path: string): Promise<any> {
  const r = await fetch(`/api/fapi${path}`);
  if (!r.ok) throw new Error(`Binance Futures API error ${r.status}`);
  return r.json();
}

export interface FundingRateEntry {
  symbol: string;
  fundingTime: number;
  fundingRate: number;
  markPrice: number;
}

export async function fetchFundingRate(symbol: string, limit = 8): Promise<FundingRateEntry[]> {
  const arr = (await fapiGet(`/v1/fundingRate?symbol=${symbol}&limit=${limit}`)) as any[];
  return arr.map((j) => ({
    symbol: j.symbol,
    fundingTime: j.fundingTime,
    fundingRate: +j.fundingRate,
    markPrice: +(j.markPrice ?? 0),
  }));
}

export interface PremiumIndex {
  symbol: string;
  markPrice: number;
  indexPrice: number;
  lastFundingRate: number;
  nextFundingTime: number;
  interestRate: number;
}

export async function fetchPremiumIndex(symbol: string): Promise<PremiumIndex> {
  const j = await fapiGet(`/v1/premiumIndex?symbol=${symbol}`);
  return {
    symbol: j.symbol,
    markPrice: +j.markPrice,
    indexPrice: +j.indexPrice,
    lastFundingRate: +j.lastFundingRate,
    nextFundingTime: j.nextFundingTime,
    interestRate: +(j.interestRate ?? 0),
  };
}

export interface OpenInterest {
  symbol: string;
  openInterest: number;
  time: number;
}

export async function fetchOpenInterest(symbol: string): Promise<OpenInterest> {
  const j = await fapiGet(`/v1/openInterest?symbol=${symbol}`);
  return {
    symbol: j.symbol,
    openInterest: +j.openInterest,
    time: j.time,
  };
}

export interface OpenInterestHistEntry {
  symbol: string;
  sumOpenInterest: number;
  sumOpenInterestValue: number;
  timestamp: number;
}

export async function fetchOIHistory(symbol: string, period: "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d" = "1h", limit = 24): Promise<OpenInterestHistEntry[]> {
  const arr = (await fapiGet(`/futures/data/openInterestHist?symbol=${symbol}&period=${period}&limit=${limit}`)) as any[];
  return arr.map((j) => ({
    symbol: j.symbol,
    sumOpenInterest: +j.sumOpenInterest,
    sumOpenInterestValue: +j.sumOpenInterestValue,
    timestamp: j.timestamp,
  }));
}

// ── Formatters ─────────────────────────────────────────────────────────────
export function fmtPrice(n: number, decimals?: number): string {
  if (!isFinite(n)) return "—";
  const d =
    decimals ??
    (n >= 1000 ? 2 : n >= 10 ? 3 : n >= 1 ? 4 : n >= 0.01 ? 5 : 6);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function fmtUsd(n: number): string {
  if (!isFinite(n)) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

export function fmtQty(n: number): string {
  if (!isFinite(n)) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(n >= 1 ? 2 : 4);
}

export function fmtPct(n: number, digits = 2): string {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(digits)}%`;
}
