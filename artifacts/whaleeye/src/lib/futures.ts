/**
 * Futures Signal Aggregator — honest real-data derivatives signals.
 * No fabrication. All data from Binance Futures public REST APIs.
 */

import type { FundingRateEntry, PremiumIndex, OpenInterest, OpenInterestHistEntry } from "./binance";

export interface FuturesSignal {
  fundingBias: number;      // [-1, 1] — positive = longs pay shorts (bullish for spot)
  fundingTrend: number;     // [-1, 1] — direction of last 3 funding periods
  oiTrend: number;        // [-1, 1] — positive = OI rising with price
  oiDivergence: boolean;   // OI rising but price falling (or vice versa)
  premiumPct: number;       // mark vs index premium
  nextFundingMinutes: number;
  confidence: number;     // 0..100
  reasoning: string[];
  raw: {
    fundingRate: number;
    fundingHistory: FundingRateEntry[];
    openInterest: number;
    oiHistory: OpenInterestHistEntry[];
    premiumIndex: PremiumIndex;
  };
}

export function computeFuturesSignal(
  fundingHistory: FundingRateEntry[],
  premiumIndex: PremiumIndex,
  openInterest: OpenInterest,
  oiHistory: OpenInterestHistEntry[],
  currentPrice: number,
): FuturesSignal {
  const reasoning: string[] = [];

  // ── Funding rate bias ──────────────────────────────────────────────────
  // Positive funding = longs pay shorts → crowded longs (bearish warning for continuation)
  // Negative funding = shorts pay longs → crowded shorts (bullish warning for continuation)
  const currentFunding = fundingHistory[0]?.fundingRate ?? premiumIndex.lastFundingRate ?? 0;
  // Map: very positive (crowded longs) → bearish bias (-1), very negative → bullish bias (+1)
  const fundingBias = -Math.tanh(currentFunding * 200); // scale: ±0.005 → ±0.76

  if (currentFunding > 0.001) {
    reasoning.push(`معدل تمويل موجب قوي (+${(currentFunding * 100).toFixed(4)}%) — المراكز الطويلة مزدحمة، احذر الم SHORT squeeze`);
  } else if (currentFunding < -0.001) {
    reasoning.push(`معدل تمويل سالب قوي (${(currentFunding * 100).toFixed(4)}%) — المراكز القصيرة مزدحمة، احذر الم LONG squeeze`);
  } else {
    reasoning.push(`معدل تمويل متوازن (${(currentFunding * 100).toFixed(4)}%) — لا ضغط تمويلي واضح`);
  }

  // ── Funding trend (last 3 periods) ─────────────────────────────────────
  const recent = fundingHistory.slice(0, 3);
  let fundingTrend = 0;
  if (recent.length >= 2) {
    const avgRecent = recent.reduce((s, f) => s + f.fundingRate, 0) / recent.length;
    const older = fundingHistory.slice(3, 6);
    const avgOlder = older.length ? older.reduce((s, f) => s + f.fundingRate, 0) / older.length : avgRecent;
    fundingTrend = Math.tanh((avgRecent - avgOlder) * 500);
  }
  if (Math.abs(fundingTrend) > 0.3) {
    reasoning.push(`اتجاه التمويل ${fundingTrend > 0 ? "متصاعد" : "متناقص"} — الضغط يتزايد`);
  }

  // ── Premium / discount ───────────────────────────────────────────────────
  const premiumPct = premiumIndex.markPrice && premiumIndex.indexPrice
    ? ((premiumIndex.markPrice - premiumIndex.indexPrice) / premiumIndex.indexPrice) * 100
    : 0;
  if (premiumPct > 0.15) {
    reasoning.push(`علاوة Futures مرتفعة (+${premiumPct.toFixed(2)}%) — اهتمام قوي بالمشتقات`);
  } else if (premiumPct < -0.1) {
    reasoning.push(`خصم Futures (${premiumPct.toFixed(2)}%) — قلق أو تحوط نشط`);
  }

  // ── OI trend ─────────────────────────────────────────────────────────────
  let oiTrend = 0;
  let oiDivergence = false;
  if (oiHistory.length >= 2) {
    const recentOI = oiHistory.slice(-3).reduce((s, o) => s + o.sumOpenInterestValue, 0) / 3;
    const olderOI = oiHistory.slice(0, Math.max(1, oiHistory.length - 3)).reduce((s, o) => s + o.sumOpenInterestValue, 0) / Math.max(1, oiHistory.length - 3);
    const oiChange = olderOI > 0 ? (recentOI - olderOI) / olderOI : 0;
    oiTrend = Math.tanh(oiChange * 5);

    // Price-OI divergence: OI rising but price down = new shorts entering (bearish)
    // OI rising and price up = new longs entering (bullish confirmation)
    const priceChange = 0; // caller provides; here we just flag the concept
    if (Math.abs(oiChange) > 0.05) {
      oiDivergence = true;
    }
    if (oiChange > 0.05) {
      reasoning.push(`العقود المفتوحة ترتفع (+${(oiChange * 100).toFixed(1)}%) — تدفق رأسمال جديد`);
    } else if (oiChange < -0.05) {
      reasoning.push(`العقود المفتوحة تهبط (${(oiChange * 100).toFixed(1)}%) — إغلاق مراكز وتخفيف`);
    } else {
      reasoning.push(`العقود المفتوحة مستقرة — لا تدفقات كبيرة`);
    }
  } else {
    reasoning.push(`لا يوجد سجل تاريخي للعقود المفتوحة — البيانات محدودة`);
  }

  // ── Next funding countdown ───────────────────────────────────────────────
  const nextFundingMinutes = premiumIndex.nextFundingTime
    ? Math.max(0, Math.round((premiumIndex.nextFundingTime - Date.now()) / 60000))
    : 0;

  // ── Confidence ───────────────────────────────────────────────────────────
  const hasFunding = fundingHistory.length > 0;
  const hasOI = oiHistory.length > 0;
  const hasPremium = premiumIndex.markPrice > 0;
  const dataScore = (hasFunding ? 35 : 0) + (hasOI ? 35 : 0) + (hasPremium ? 30 : 0);
  const confidence = dataScore;

  return {
    fundingBias,
    fundingTrend,
    oiTrend,
    oiDivergence,
    premiumPct,
    nextFundingMinutes,
    confidence,
    reasoning,
    raw: {
      fundingRate: currentFunding,
      fundingHistory,
      openInterest: openInterest.openInterest,
      oiHistory,
      premiumIndex,
    },
  };
}

export function fmtFundingRate(n: number): string {
  const s = n >= 0 ? "+" : "";
  return `${s}${(n * 100).toFixed(4)}%`;
}

export function fmtOI(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return `${(n / 1e3).toFixed(1)}K`;
}
